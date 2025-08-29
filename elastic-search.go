package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/elastic/go-elasticsearch/v9"
	"github.com/elastic/go-elasticsearch/v9/esutil"
	"github.com/google/uuid"
	"github.com/labstack/gommon/log"
	"github.com/wailsapp/wails/v2/pkg/logger"
)

/*
Elasticsearch Index Mapping Structure:
{
  "mappings": {
    "properties": {
      "metaKeyWords": {
        "type": "text"
      },
      "metaTextDesc": {
        "type": "text"
      },
      "docChunks": {
        "type": "nested",
        "properties": {
          "textChunk": {
            "type": "text"
          },
          "vector": {
            "type": "dense_vector",
            "dims": 1024,
            "index": true,
            "similarity": "cosine",
            "index_options": {
              "type": "int8_hnsw",
              "m": 24,
              "ef_construction": 200
            }
          }
        }
      },
      "sourceLocation": {
        "type": "text"
      },
      "timestamp": {
        "type": "date"
      },
      "title": {
        "type": "text"
      }
    }
  }
}
*/

// ElasticsearchClientWrapper is a wrapper around the official Elasticsearch client providing custom functionality
type ElasticsearchClientWrapper struct {
	elasticsearchClient *elasticsearch.Client
}

// DocumentSearchParameters contains parameters for filtering documents by field values
type DocumentSearchParameters struct {
	metaKeyWords string // Case name to search for
	metaTextDesc string // metaTextDesc name to search for
	Title        string // Document title to search for
	DateFromTime string // Start date filter (Format: YYYY-MM-DD or RFC3339)
	DateToTime   string // End date filter (Format: YYYY-MM-DD or RFC3339)
	ResultSize   int    // Maximum number of results to return
}

// ElasticsearchRequestLogger handles logging of Elasticsearch requests and responses
type ElasticsearchRequestLogger struct {
	LogOutput             io.Writer    // Where to write log output
	LoggingLevel          LoggingLevel // Current logging level
	EnableRequestBodyLog  bool         // Whether to log request bodies
	EnableResponseBodyLog bool         // Whether to log response bodies
	MaximumBodyLength     int          // Maximum length for logged bodies
	ShowElapsedTimeField  bool         // Whether to show elapsed time in logs
}

// LoggingLevel defines the level of detail for logs
type LoggingLevel int

const (
	LoggingLevelError LoggingLevel = iota
	LoggingLevelWarn
	LoggingLevelInfo
	LoggingLevelDebug
	LoggingLevelTrace
)

// RequestBodyEnabled returns whether request body logging is enabled
func (logger *ElasticsearchRequestLogger) RequestBodyEnabled() bool {
	return logger.EnableRequestBodyLog
}

// ResponseBodyEnabled returns whether response body logging is enabled
func (logger *ElasticsearchRequestLogger) ResponseBodyEnabled() bool {
	return logger.EnableResponseBodyLog
}

// InitializeElasticsearchWithIndices creates a new Elasticsearch client and initializes required indices
func InitializeElasticsearchWithIndices(elasticsearchLogger ElasticsearchRequestLogger, appArgs DefaultAppArgs) (*ElasticsearchClientWrapper, error) {
	// Create the Elasticsearch client
	elasticsearchWrapper, err := NewElasticsearchClient(elasticsearchLogger, appArgs)
	if err != nil {
		return nil, fmt.Errorf("failed to create Elasticsearch client: %w", err)
	}

	// Initialize required indices
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := elasticsearchWrapper.InitializeRequiredIndices(ctx); err != nil {
		return nil, fmt.Errorf("failed to initialize required indices: %w", err)
	}

	return elasticsearchWrapper, nil
}

// NewElasticsearchClient creates a new Elasticsearch client with the provided logger configuration
func NewElasticsearchClient(elasticsearchLogger ElasticsearchRequestLogger, appArgs DefaultAppArgs) (*ElasticsearchClientWrapper, error) {
	// Configure Elasticsearch client with connection settings and transport layer
	clientConfiguration := elasticsearch.Config{
		Addresses: appArgs.ElasticsearchServerAddresses,
		APIKey:    appArgs.ElasticsearchAPIKey,
		Logger:    &elasticsearchLogger,
		Transport: &http.Transport{
			MaxIdleConnsPerHost:    10,
			ResponseHeaderTimeout:  time.Second * 30,
			IdleConnTimeout:        time.Second * 90,
			TLSHandshakeTimeout:    time.Second * 10,
			ExpectContinueTimeout:  time.Second * 1,
			DisableKeepAlives:      false,
			MaxResponseHeaderBytes: 64 << 10, // 64KB
		},
		MaxRetries:          3,
		RetryOnStatus:       []int{502, 503, 504},
		CompressRequestBody: false,
		RetryBackoff:        func(attemptNumber int) time.Duration { return time.Duration(attemptNumber) * 100 * time.Millisecond },
	}

	// Create a new Elasticsearch client with the configuration
	elasticsearchClientInstance, err := elasticsearch.NewClient(clientConfiguration)
	if err != nil {
		return nil, fmt.Errorf("error creating Elasticsearch client: %w", err)
	}

	// Return a new wrapper with the initialized client
	return &ElasticsearchClientWrapper{
		elasticsearchClient: elasticsearchClientInstance,
	}, nil
}

// NewElasticsearchRequestLogger creates a new logger with default settings for the specified logging level
func NewElasticsearchRequestLogger(loggingLevel LoggingLevel) *ElasticsearchRequestLogger {
	return &ElasticsearchRequestLogger{
		LogOutput:             os.Stdout,
		LoggingLevel:          loggingLevel,
		EnableRequestBodyLog:  true,
		EnableResponseBodyLog: true,
		MaximumBodyLength:     10000, // Limit response/request body logging to 10KB by default
		ShowElapsedTimeField:  true,
	}
}

// LogRoundTrip logs the HTTP request and response details for debugging and monitoring purposes
func (logger *ElasticsearchRequestLogger) LogRoundTrip(httpRequest *http.Request, httpResponse *http.Response, requestError error, requestStartTime time.Time, requestDuration time.Duration) error {
	// Skip logging if level is below info to reduce noise
	if logger.LoggingLevel < LoggingLevelInfo {
		return nil
	}

	// Build the log message with various components
	var logMessageBuilder strings.Builder

	// Add timestamp to log entry
	logMessageBuilder.WriteString(fmt.Sprintf("[%s]", time.Now().Format(time.RFC3339)))

	// Add elapsed time if enabled for performance monitoring
	if logger.ShowElapsedTimeField {
		logMessageBuilder.WriteString(fmt.Sprintf(" [%.3fs]", requestDuration.Seconds()))
	}

	// Log HTTP method and URL for request identification
	if httpRequest != nil {
		logMessageBuilder.WriteString(fmt.Sprintf(" [%s]", httpRequest.Method))
		logMessageBuilder.WriteString(fmt.Sprintf(" [%s]", httpRequest.URL.String()))
	}

	// Log response status code if response is available
	if httpResponse != nil {
		logMessageBuilder.WriteString(fmt.Sprintf(" [status:%d]", httpResponse.StatusCode))
	}

	// Log error if present for troubleshooting
	if requestError != nil {
		logMessageBuilder.WriteString(fmt.Sprintf(" [error:%s]", requestError.Error()))
	}

	// Log request headers if debug level or higher (excluding sensitive information)
	if httpRequest != nil && logger.LoggingLevel >= LoggingLevelDebug {
		logMessageBuilder.WriteString("\nRequest Headers:")
		for headerKey, headerValues := range httpRequest.Header {
			// Skip the Authorization header to prevent leaking credentials
			if strings.ToLower(headerKey) == "authorization" {
				logMessageBuilder.WriteString(fmt.Sprintf("\n  %s: [REDACTED]", headerKey))
			} else {
				logMessageBuilder.WriteString(fmt.Sprintf("\n  %s: %s", headerKey, strings.Join(headerValues, ", ")))
			}
		}
	}

	// Log request body if enabled and debug level or higher
	if httpRequest != nil && httpRequest.Body != nil && logger.EnableRequestBodyLog && logger.LoggingLevel >= LoggingLevelDebug {
		if httpRequest.GetBody != nil {
			requestBody, err := httpRequest.GetBody()
			if err == nil {
				var bodyBuffer bytes.Buffer
				if _, err := io.Copy(&bodyBuffer, requestBody); err == nil {
					bodyContent := bodyBuffer.String()
					if len(bodyContent) > logger.MaximumBodyLength {
						bodyContent = bodyContent[:logger.MaximumBodyLength] + "... [truncated]"
					}
					logMessageBuilder.WriteString("\nRequest Body:\n")
					logMessageBuilder.WriteString(bodyContent)
				}
				_ = requestBody.Close()
			}
		}
	}

	// Log response headers if debug level or higher
	if httpResponse != nil && logger.LoggingLevel >= LoggingLevelDebug {
		logMessageBuilder.WriteString("\nResponse Headers:")
		for headerKey, headerValues := range httpResponse.Header {
			logMessageBuilder.WriteString(fmt.Sprintf("\n  %s: %s", headerKey, strings.Join(headerValues, ", ")))
		}
	}

	// Log response body if enabled and debug level or higher
	if httpResponse != nil && httpResponse.Body != nil && logger.EnableResponseBodyLog && logger.LoggingLevel >= LoggingLevelDebug {
		// Read the body without consuming it for the caller
		if httpResponse.ContentLength > 0 && httpResponse.ContentLength <= int64(logger.MaximumBodyLength) {
			responseBodyBytes, err := io.ReadAll(httpResponse.Body)
			if err == nil {
				// Restore the body for the caller
				httpResponse.Body = io.NopCloser(bytes.NewReader(responseBodyBytes))
				logMessageBuilder.WriteString("\nResponse Body:\n")
				logMessageBuilder.WriteString(string(responseBodyBytes))
			}
		} else if httpResponse.ContentLength > int64(logger.MaximumBodyLength) {
			logMessageBuilder.WriteString(fmt.Sprintf("\nResponse Body: [too large: %d bytes]", httpResponse.ContentLength))
		}
	}

	// Write the complete log message to output
	fmt.Fprintln(logger.LogOutput, logMessageBuilder.String())

	return nil
}

// IsRequestBodyLoggingEnabled returns whether request body logging is enabled
func (logger *ElasticsearchRequestLogger) IsRequestBodyLoggingEnabled() bool {
	return logger.EnableRequestBodyLog
}

// IsResponseBodyLoggingEnabled returns whether response body logging is enabled
func (logger *ElasticsearchRequestLogger) IsResponseBodyLoggingEnabled() bool {
	return logger.EnableResponseBodyLog
}

// SetLoggingLevel sets the log level for filtering log output
func (logger *ElasticsearchRequestLogger) SetLoggingLevel(newLoggingLevel LoggingLevel) {
	logger.LoggingLevel = newLoggingLevel
}

// SetLogOutput sets the output writer for log messages
func (logger *ElasticsearchRequestLogger) SetLogOutput(outputWriter io.Writer) {
	logger.LogOutput = outputWriter
}

// SetRequestBodyLogging enables or disables request body logging
func (logger *ElasticsearchRequestLogger) SetRequestBodyLogging(enableRequestBodyLogging bool) {
	logger.EnableRequestBodyLog = enableRequestBodyLogging
}

// SetResponseBodyLogging enables or disables response body logging
func (logger *ElasticsearchRequestLogger) SetResponseBodyLogging(enableResponseBodyLogging bool) {
	logger.EnableResponseBodyLog = enableResponseBodyLogging
}

// SetMaxBodyLength sets the maximum length for logged request/response bodies
func (logger *ElasticsearchRequestLogger) SetMaxBodyLength(maximumBodyLength int) {
	logger.MaximumBodyLength = maximumBodyLength
}

// SearchDocumentsByFields searches for documents matching the specified field criteria
func (elasticsearchWrapper *ElasticsearchClientWrapper) SearchDocumentsByFields(searchContext context.Context, indexName string, searchParameters DocumentSearchParameters) ([]map[string]interface{}, error) {
	// Set default result size if isn't specified
	if searchParameters.ResultSize == 0 {
		searchParameters.ResultSize = 10
	}

	// Build the boolean query with multiple field conditions
	booleanQuery := map[string]interface{}{
		"bool": map[string]interface{}{
			"must": []map[string]interface{}{},
		},
	}

	mustQueryClauses := make([]map[string]interface{}, 0)

	// Add case name condition if provided
	if searchParameters.metaKeyWords != "" {
		mustQueryClauses = append(mustQueryClauses, map[string]interface{}{
			"match": map[string]interface{}{
				"metaKeyWords": searchParameters.metaKeyWords,
			},
		})
	}

	// Add metaTextDesc condition if provided
	if searchParameters.metaTextDesc != "" {
		mustQueryClauses = append(mustQueryClauses, map[string]interface{}{
			"match": map[string]interface{}{
				"metaTextDesc": searchParameters.metaTextDesc,
			},
		})
	}

	// Add title condition if provided
	if searchParameters.Title != "" {
		mustQueryClauses = append(mustQueryClauses, map[string]interface{}{
			"match": map[string]interface{}{
				"title": searchParameters.Title,
			},
		})
	}

	// Add date range condition if either date parameter is provided
	if searchParameters.DateFromTime != "" || searchParameters.DateToTime != "" {
		dateRangeQuery := map[string]interface{}{}

		if searchParameters.DateFromTime != "" {
			dateRangeQuery["gte"] = searchParameters.DateFromTime
		}

		if searchParameters.DateToTime != "" {
			dateRangeQuery["lte"] = searchParameters.DateToTime
		}

		mustQueryClauses = append(mustQueryClauses, map[string]interface{}{
			"range": map[string]interface{}{
				"timestamp": dateRangeQuery,
			},
		})
	}

	// If no conditions provided, match all documents
	if len(mustQueryClauses) == 0 {
		booleanQuery = map[string]interface{}{
			"bool": map[string]interface{}{
				"must": map[string]interface{}{
					"match_all": map[string]interface{}{},
				},
			},
		}
	} else {
		booleanQuery["bool"].(map[string]interface{})["must"] = mustQueryClauses
	}

	// Create the full search query with size and field specifications
	searchQuery := map[string]interface{}{
		"query":  booleanQuery,
		"size":   searchParameters.ResultSize,
		"fields": []string{"metaKeyWords", "metaTextDesc", "title", "timestamp", "sourceLocation"},
	}

	// Encode the query to JSON for transmission
	var queryBuffer bytes.Buffer
	if err := json.NewEncoder(&queryBuffer).Encode(searchQuery); err != nil {
		return nil, fmt.Errorf("error encoding search query: %w", err)
	}

	// Execute the search request against Elasticsearch
	searchResponse, err := elasticsearchWrapper.elasticsearchClient.Search(
		elasticsearchWrapper.elasticsearchClient.Search.WithContext(searchContext),
		elasticsearchWrapper.elasticsearchClient.Search.WithIndex(indexName),
		elasticsearchWrapper.elasticsearchClient.Search.WithBody(&queryBuffer),
	)
	if err != nil {
		return nil, fmt.Errorf("error executing field search: %w", err)
	}
	defer func(responseBody io.ReadCloser) {
		err := responseBody.Close()
		if err != nil {
			log.Error(err.Error())
		}
	}(searchResponse.Body)

	// Check for errors in the response
	if searchResponse.IsError() {
		return nil, fmt.Errorf("error response from Elasticsearch: %s", searchResponse.String())
	}

	// Parse the search response JSON
	var searchResponseData map[string]interface{}
	if err := json.NewDecoder(searchResponse.Body).Decode(&searchResponseData); err != nil {
		return nil, fmt.Errorf("error parsing search response: %w", err)
	}

	// Extract the hits from the response structure
	searchHits, ok := searchResponseData["hits"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected response format: missing hits")
	}

	searchHitsArray, ok := searchHits["hits"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected response format: missing hits array")
	}

	// Process the search results and prepare return data
	searchResults := make([]map[string]interface{}, 0, len(searchHitsArray))
	for _, searchHit := range searchHitsArray {
		searchHitMap, ok := searchHit.(map[string]interface{})
		if !ok {
			continue
		}

		documentSource, ok := searchHitMap["_source"].(map[string]interface{})
		if !ok {
			continue
		}

		// Add metadata from the hit to the source document
		documentSource["_id"] = searchHitMap["_id"]
		documentSource["_score"] = searchHitMap["_score"]

		searchResults = append(searchResults, documentSource)
	}

	return searchResults, nil
}

// CreateIndexIfNotExists creates an index with the specified mapping if it doesn't already exist
func (elasticsearchWrapper *ElasticsearchClientWrapper) CreateIndexIfNotExists(ctx context.Context, indexName string, mapping map[string]interface{}) error {
	// Check if the index exists
	indexExistsResponse, err := elasticsearchWrapper.elasticsearchClient.Indices.Exists([]string{indexName})
	if err != nil {
		return fmt.Errorf("error checking if index exists: %w", err)
	}
	defer func(responseBody io.ReadCloser) {
		err := responseBody.Close()
		if err != nil {
			log.Error(err.Error())
		}
	}(indexExistsResponse.Body)

	// If index exists (status 200), return early
	if indexExistsResponse.StatusCode == 200 {
		fmt.Printf("Index '%s' already exists\n", indexName)
		return nil
	}

	// If index doesn't exist (status 404), create it
	if indexExistsResponse.StatusCode == 404 {
		// Create the index with the mapping
		indexConfig := map[string]interface{}{
			"mappings": mapping,
		}

		var configBuffer bytes.Buffer
		if err := json.NewEncoder(&configBuffer).Encode(indexConfig); err != nil {
			return fmt.Errorf("error encoding index configuration: %w", err)
		}

		createResponse, err := elasticsearchWrapper.elasticsearchClient.Indices.Create(
			indexName,
			elasticsearchWrapper.elasticsearchClient.Indices.Create.WithContext(ctx),
			elasticsearchWrapper.elasticsearchClient.Indices.Create.WithBody(&configBuffer),
		)
		if err != nil {
			return fmt.Errorf("error creating index: %w", err)
		}
		defer func(responseBody io.ReadCloser) {
			err := responseBody.Close()
			if err != nil {
				log.Error(err.Error())
			}
		}(createResponse.Body)

		if createResponse.IsError() {
			return fmt.Errorf("error response from Elasticsearch when creating index: %s", createResponse.String())
		}

		fmt.Printf("Index '%s' created successfully\n", indexName)
		return nil
	}

	return fmt.Errorf("unexpected response when checking index existence: %s", indexExistsResponse.String())
}

// InitializeRequiredIndices creates all required indices with their mappings on startup
func (elasticsearchWrapper *ElasticsearchClientWrapper) InitializeRequiredIndices(ctx context.Context) error {
	// Define the mapping structure
	mapping := map[string]interface{}{
		"properties": map[string]interface{}{
			"metaKeyWords": map[string]interface{}{
				"type": "text",
			},
			"metaTextDesc": map[string]interface{}{
				"type": "text",
			},
			"docChunks": map[string]interface{}{
				"type": "nested",
				"properties": map[string]interface{}{
					"textChunk": map[string]interface{}{
						"type": "text",
					},
					"vector": map[string]interface{}{
						"type":       "dense_vector",
						"dims":       1024,
						"index":      true,
						"similarity": "cosine",
						"index_options": map[string]interface{}{
							"type":            "int8_hnsw",
							"m":               24,
							"ef_construction": 200,
						},
					},
				},
			},
			"sourceLocation": map[string]interface{}{
				"type": "text",
			},
			"timestamp": map[string]interface{}{
				"type": "date",
			},
			"title": map[string]interface{}{
				"type": "text",
			},
		},
	}

	// Create the default index - you can adjust the index name as needed
	defaultIndexName := "document-meta-index"

	if err := elasticsearchWrapper.CreateIndexIfNotExists(ctx, defaultIndexName, mapping); err != nil {
		return fmt.Errorf("failed to create default index '%s': %w", defaultIndexName, err)
	}

	return nil
}

// AddElasticsearchDocument adds a document with embeddings to Elasticsearch
func (elasticsearchWrapper *ElasticsearchClientWrapper) AddElasticsearchDocument(documentContext context.Context, log logger.Logger, appArgs DefaultAppArgs, llamaEmbeddingParameters LlamaEmbedArgs, documentChunks []Document, indexName string, documentTitle string, metaTextDesc string, metaKeyWords string, sourceFilePath string) error {

	// Create the main document structure for Elasticsearch
	elasticsearchDocument := ElasticDocument{
		Title:          documentTitle,
		MetaTextDesc:   metaTextDesc,
		MetaKeyWords:   metaKeyWords,
		SourceLocation: sourceFilePath,
		Timestamp:      time.Now().Format(time.RFC3339),
		DocChunks:      []ElasticDocumentTextChunk{},
	}

	// Process each document chunk and generate embeddings
	for _, documentChunk := range documentChunks {
		chunkEmbedding, err := GenerateEmbedWithCancel(documentContext, llamaEmbeddingParameters, appArgs, documentChunk.Content)
		if err != nil {
			log.Info(fmt.Sprintf("Failed to generate embedding for document: %v", err))
			continue // Skip this document chunk but continue processing others
		}

		// Create the document chunk with text and vector embedding
		elasticsearchDocumentChunk := ElasticDocumentTextChunk{
			TextChunk: documentChunk.Content,
			Vector:    chunkEmbedding,
		}
		elasticsearchDocument.DocChunks = append(elasticsearchDocument.DocChunks, elasticsearchDocumentChunk)
	}

	// Generate a unique document ID
	documentUniqueID := uuid.New().String()

	// Index the document in Elasticsearch
	indexResponse, err := elasticsearchWrapper.elasticsearchClient.Index(indexName, esutil.NewJSONReader(elasticsearchDocument), elasticsearchWrapper.elasticsearchClient.Index.WithDocumentID(documentUniqueID), elasticsearchWrapper.elasticsearchClient.Index.WithContext(context.Background()))
	if err != nil {
		return fmt.Errorf("error indexing document: %w", err)
	}
	defer func(responseBody io.ReadCloser) {
		err := responseBody.Close()
		if err != nil {
			// Log error but don't fail the operation
		}
	}(indexResponse.Body)

	// Check for indexing errors
	if indexResponse.IsError() {
		return fmt.Errorf("error response from Elasticsearch: %s", indexResponse.String())
	}

	log.Info("Document ID: %s indexed successfully" + documentUniqueID)
	return nil
}

// GetElasticsearchIndexInfo retrieves information about a specific Elasticsearch index
func (elasticsearchWrapper *ElasticsearchClientWrapper) GetElasticsearchIndexInfo(indexName string) (map[string]interface{}, error) {
	// Perform a request to get index information
	indexInfoResponse, err := elasticsearchWrapper.elasticsearchClient.Indices.Get([]string{indexName}, elasticsearchWrapper.elasticsearchClient.Indices.Get.WithContext(context.Background()))
	if err != nil {
		return nil, fmt.Errorf("error getting index information: %w", err)
	}
	defer func(responseBody io.ReadCloser) {
		err := responseBody.Close()
		if err != nil {
			// Log error but don't fail the operation
		}
	}(indexInfoResponse.Body)

	// Check if the response indicates an error
	if indexInfoResponse.IsError() {
		// Handle 404 not found separately for better error messaging
		if indexInfoResponse.StatusCode == 404 {
			return nil, fmt.Errorf("index '%s' not found", indexName)
		}
		return nil, fmt.Errorf("error response from Elasticsearch: %s", indexInfoResponse.String())
	}

	// Decode the response body into a map
	var indexInformation map[string]interface{}
	if err := json.NewDecoder(indexInfoResponse.Body).Decode(&indexInformation); err != nil {
		return nil, fmt.Errorf("error decoding index information: %w", err)
	}
	return indexInformation, nil
}

// GetAllElasticsearchIndices retrieves a list of all indices in the Elasticsearch cluster
func (elasticsearchWrapper *ElasticsearchClientWrapper) GetAllElasticsearchIndices() ([]string, error) {
	// Perform a request to get all indices using the _cat/indices API with a specific pattern
	indexSearchPattern := "document-**"

	indicesResponse, err := elasticsearchWrapper.elasticsearchClient.Cat.Indices(
		elasticsearchWrapper.elasticsearchClient.Cat.Indices.WithFormat("json"),
		elasticsearchWrapper.elasticsearchClient.Cat.Indices.WithContext(context.Background()),
		elasticsearchWrapper.elasticsearchClient.Cat.Indices.WithIndex(indexSearchPattern),
	)

	if err != nil {
		return nil, fmt.Errorf("error getting indices: %w", err)
	}
	defer func(responseBody io.ReadCloser) {
		err := responseBody.Close()
		if err != nil {
			// Log error but don't fail the operation
		}
	}(indicesResponse.Body)

	// Check if the response indicates an error
	if indicesResponse.IsError() {
		return nil, fmt.Errorf("error response from Elasticsearch: %s", indicesResponse.String())
	}

	// Decode the response body containing index information
	var indicesInformation []struct {
		Index string `json:"index"`
	}
	if err := json.NewDecoder(indicesResponse.Body).Decode(&indicesInformation); err != nil {
		return nil, fmt.Errorf("error decoding indices response: %w", err)
	}

	// Extract only the index names from the response
	availableIndices := make([]string, len(indicesInformation))
	for i, indexInfo := range indicesInformation {
		availableIndices[i] = indexInfo.Index
	}
	return availableIndices, nil
}

// SearchWithKNearestNeighbors performs a vector similarity search on nested document fields
func (elasticsearchWrapper *ElasticsearchClientWrapper) SearchWithKNearestNeighbors(searchContext context.Context, indexName string, queryVector []float32, resultSize int) ([]map[string]interface{}, error) {
	searchContext, cancelSearch := context.WithCancel(searchContext)
	defer cancelSearch()

	// Build the k-NN search query for vector similarity
	knnSearchQuery := map[string]interface{}{
		"knn": map[string]interface{}{
			"field":          "docChunks.vector",
			"query_vector":   queryVector,
			"k":              resultSize,
			"num_candidates": 10, // Typically num_candidates is larger than k for better results
			"inner_hits": map[string]interface{}{
				"size":    5,
				"_source": false,
				"fields":  []string{"docChunks.textChunk"},
			},
		},
	}

	// Encode the query to JSON for transmission
	var queryBuffer bytes.Buffer
	if err := json.NewEncoder(&queryBuffer).Encode(knnSearchQuery); err != nil {
		return nil, fmt.Errorf("error encoding k-NN search query: %w", err)
	}

	// Execute the search request
	knnSearchResponse, err := elasticsearchWrapper.elasticsearchClient.Search(
		elasticsearchWrapper.elasticsearchClient.Search.WithContext(searchContext),
		elasticsearchWrapper.elasticsearchClient.Search.WithIndex(indexName),
		elasticsearchWrapper.elasticsearchClient.Search.WithBody(&queryBuffer),
	)
	if err != nil {
		return nil, fmt.Errorf("error executing k-NN search: %w", err)
	}
	defer func(responseBody io.ReadCloser) {
		err := responseBody.Close()
		if err != nil {
			log.Error(err.Error())
		}
	}(knnSearchResponse.Body)

	// Check for errors in the response
	if knnSearchResponse.IsError() {
		return nil, fmt.Errorf("error response from Elasticsearch: %s", knnSearchResponse.String())
	}

	// Parse the search response JSON
	var knnSearchResultData map[string]interface{}
	if err := json.NewDecoder(knnSearchResponse.Body).Decode(&knnSearchResultData); err != nil {
		return nil, fmt.Errorf("error parsing k-NN search response: %w", err)
	}

	// Extract the hits from the response structure
	searchHits, ok := knnSearchResultData["hits"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected response format: missing hits")
	}

	searchHitsArray, ok := searchHits["hits"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected response format: missing hits array")
	}

	// Process the search results
	knnSearchResults := make([]map[string]interface{}, 0, len(searchHitsArray))
	for _, searchHit := range searchHitsArray {
		searchHitMap, ok := searchHit.(map[string]interface{})
		if !ok {
			continue
		}

		documentSource, ok := searchHitMap["_source"].(map[string]interface{})
		if !ok {
			continue
		}

		// Add metadata from the hit to the source document
		documentSource["_id"] = searchHitMap["_id"]
		documentSource["_score"] = searchHitMap["_score"]

		// Extract inner hits (matching nested documents)
		if innerHitsData, ok := searchHitMap["inner_hits"].(map[string]interface{}); ok {
			if documentChunksData, ok := innerHitsData["docChunks"].(map[string]interface{}); ok {
				if innerHitsResults, ok := documentChunksData["hits"].(map[string]interface{}); ok {
					documentSource["matching_chunks"] = innerHitsResults["hits"]
				}
			}
		}

		knnSearchResults = append(knnSearchResults, documentSource)
	}

	return knnSearchResults, nil
}

// SearchDocumentByIDWithVector searches for a specific document by ID and performs a vector similarity search
// within that document's chunks, returning the matching text chunks as a concatenated string
func (elasticsearchWrapper *ElasticsearchClientWrapper) SearchDocumentByIDWithVector(searchContext context.Context, indexName, targetDocumentID string, searchVector []float32, maximumResults int) (string, error) {
	searchContext, cancelSearch := context.WithCancel(searchContext)
	defer cancelSearch()

	// Build the query that combines an exact ID match with a vector similarity search on nested chunks
	combinedSearchQuery := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must": map[string]interface{}{
					"term": map[string]interface{}{
						"_id": targetDocumentID,
					},
				},
			},
		},
		"knn": map[string]interface{}{
			"field":          "docChunks.vector",
			"query_vector":   searchVector,
			"k":              5,
			"num_candidates": 10, // Typically num_candidates is larger than k for better results
			"inner_hits": map[string]interface{}{
				"size":    maximumResults,
				"_source": false,
				"fields":  []string{"docChunks.textChunk"},
			},
		},
		"size":    1,
		"_source": false,
		"fields":  []string{"inner_hits"}, // We only need the one document with the specified ID
	}

	// Execute the search request
	documentSearchResponse, err := elasticsearchWrapper.elasticsearchClient.Search(
		elasticsearchWrapper.elasticsearchClient.Search.WithContext(searchContext),
		elasticsearchWrapper.elasticsearchClient.Search.WithIndex(indexName),
		elasticsearchWrapper.elasticsearchClient.Search.WithBody(esutil.NewJSONReader(&combinedSearchQuery)),
	)
	if err != nil {
		return "", fmt.Errorf("error executing document search: %w", err)
	}

	// Check for errors in the response BEFORE reading the body
	if documentSearchResponse.IsError() {
		// Read error details into a variable first
		var errorResponseDetails map[string]interface{}
		if err := json.NewDecoder(documentSearchResponse.Body).Decode(&errorResponseDetails); err != nil {
			// If we can't decode the error response, return a generic error
			return "", fmt.Errorf("error response from Elasticsearch (status: %d)", documentSearchResponse.StatusCode)
		}
		return "", fmt.Errorf("error response from Elasticsearch: %v", errorResponseDetails)
	}
	defer func(responseBody io.ReadCloser) {
		err := responseBody.Close()
		if err != nil {
			log.Error(err.Error())
		}
	}(documentSearchResponse.Body)

	// Parse the search response JSON
	var documentSearchResultData map[string]interface{}
	if err := json.NewDecoder(documentSearchResponse.Body).Decode(&documentSearchResultData); err != nil {
		return "", fmt.Errorf("error parsing search response: %w", err)
	}

	// Extract the hits from the response structure
	searchHits, ok := documentSearchResultData["hits"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected response format: missing hits")
	}

	searchHitsArray, ok := searchHits["hits"].([]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected response format: missing hits array")
	}

	// Check if we found the target document
	if len(searchHitsArray) == 0 {
		return "", fmt.Errorf("document with ID %s not found", targetDocumentID)
	}

	// Get the first (and should be only) hit
	primaryHitMap, ok := searchHitsArray[0].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected hit format")
	}

	// Extract inner hits containing the matching text chunks
	innerHitsData, ok := primaryHitMap["inner_hits"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("no inner hits found in the document")
	}

	// Extract text chunks inner hits
	documentChunksData, ok := innerHitsData["docChunks"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("docChunks not found in inner hits")
	}

	documentChunksHitsData, ok := documentChunksData["hits"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected docChunks format")
	}

	documentChunksHitsArray, ok := documentChunksHitsData["hits"].([]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected docChunks hits array format")
	}

	// Build a concatenated string from all the matching text chunks
	var textChunksResultBuilder strings.Builder
	for chunkIndex, chunkHitData := range documentChunksHitsArray {
		chunkHitMap, ok := chunkHitData.(map[string]interface{})
		if !ok {
			continue
		}

		// Extract fields from the chunk hit
		chunkFields, ok := chunkHitMap["fields"].(map[string]interface{})
		if !ok {
			continue
		}

		// Extract docChunks array from fields
		documentChunksField, ok := chunkFields["docChunks"].([]interface{})
		if !ok || len(documentChunksField) == 0 {
			continue
		}

		// Extract the first docChunk object
		documentChunkObject, ok := documentChunksField[0].(map[string]interface{})
		if !ok {
			continue
		}

		// Extract textChunk array from the chunk object
		textChunkArray, ok := documentChunkObject["textChunk"].([]interface{})
		if !ok || len(textChunkArray) == 0 {
			continue
		}

		// Extract the first textChunk string
		textChunkContent, ok := textChunkArray[0].(string)
		if !ok {
			continue
		}

		// Add a newline between chunks except for the first one
		if chunkIndex > 0 {
			textChunksResultBuilder.WriteString("\n\n")
		}
		textChunksResultBuilder.WriteString(textChunkContent)
	}

	return textChunksResultBuilder.String(), nil
}

// SearchWithKNNAndTextCombined performs a combined vector and text search on documents for hybrid search capabilities
func (elasticsearchWrapper *ElasticsearchClientWrapper) SearchWithKNNAndTextCombined(searchContext context.Context, indexName string, searchVector []float32, searchTextQuery string, resultSize int) ([]map[string]interface{}, error) {
	// Build a query that combines vector search with text search using weighted scoring
	hybridSearchQuery := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"should": []map[string]interface{}{
					{
						"nested": map[string]interface{}{
							"path": "docChunks",
							"query": map[string]interface{}{
								"match": map[string]interface{}{
									"docChunks.textChunk": searchTextQuery,
								},
							},
							"inner_hits": map[string]interface{}{
								"size": resultSize,
							},
							"score_mode": "max",
							"boost":      0.4, // Adjust weights between text and vector as needed
						},
					},
				},
			},
		},
		"knn": map[string]interface{}{
			"field":          "docChunks.vector",
			"query_vector":   searchVector,
			"k":              resultSize,
			"num_candidates": resultSize * 3,
			"boost":          0.6, // Higher weight for vector similarity
			"inner_hits": map[string]interface{}{
				"size":    resultSize,
				"_source": false,
				"fields":  []string{"docChunks.textChunk"},
			},
		},
		"size": resultSize,
	}

	// Execute the hybrid search request
	hybridSearchResponse, err := elasticsearchWrapper.elasticsearchClient.Search(
		elasticsearchWrapper.elasticsearchClient.Search.WithContext(searchContext),
		elasticsearchWrapper.elasticsearchClient.Search.WithIndex(indexName),
		elasticsearchWrapper.elasticsearchClient.Search.WithBody(esutil.NewJSONReader(&hybridSearchQuery)),
	)
	if err != nil {
		return nil, fmt.Errorf("error executing hybrid search: %w", err)
	}
	defer func(responseBody io.ReadCloser) {
		err := responseBody.Close()
		if err != nil {
			log.Error(err.Error())
		}
	}(hybridSearchResponse.Body)

	// Check for errors in the response
	if hybridSearchResponse.IsError() {
		return nil, fmt.Errorf("error response from Elasticsearch: %s", hybridSearchResponse.String())
	}

	// Process and return results (similar to previous method)
	var hybridSearchResultData map[string]interface{}
	if err := json.NewDecoder(hybridSearchResponse.Body).Decode(&hybridSearchResultData); err != nil {
		return nil, fmt.Errorf("error parsing hybrid search response: %w", err)
	}

	// Extract the hits from the response structure
	searchHits, ok := hybridSearchResultData["hits"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected response format: missing hits")
	}

	searchHitsArray, ok := searchHits["hits"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected response format: missing hits array")
	}

	// Process the hybrid search results
	hybridSearchResults := make([]map[string]interface{}, 0, len(searchHitsArray))
	for _, searchHit := range searchHitsArray {
		searchHitMap, ok := searchHit.(map[string]interface{})
		if !ok {
			continue
		}

		documentSource, ok := searchHitMap["_source"].(map[string]interface{})
		if !ok {
			continue
		}

		// Add metadata from the hit to the source document
		documentSource["_id"] = searchHitMap["_id"]
		documentSource["_score"] = searchHitMap["_score"]

		// Extract inner hits from both text and vector searches
		if innerHitsData, ok := searchHitMap["inner_hits"].(map[string]interface{}); ok {
			matchingTextChunks := make([]interface{}, 0)

			// Extract text search inner hits
			if documentChunksData, ok := innerHitsData["docChunks"].(map[string]interface{}); ok {
				if innerHitsResults, ok := documentChunksData["hits"].(map[string]interface{}); ok {
					if hitsArray, ok := innerHitsResults["hits"].([]interface{}); ok {
						matchingTextChunks = append(matchingTextChunks, hitsArray...)
					}
				}
			}

			// Add KNN inner hits if they exist separately
			if knnHitsArray, ok := innerHitsData["knn_hits"].([]interface{}); ok {
				matchingTextChunks = append(matchingTextChunks, knnHitsArray...)
			}

			documentSource["matching_chunks"] = matchingTextChunks
		}

		hybridSearchResults = append(hybridSearchResults, documentSource)
	}
	return hybridSearchResults, nil
}
