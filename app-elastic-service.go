package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/labstack/gommon/log"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"go.mongodb.org/mongo-driver/v2/bson"
	"strings"
	"time"
)

// DocumentAddRequest represents the structure for add document requests
type DocumentAddRequest struct {
	EmbeddingArguments LlamaEmbedArgs `json:"embeddingArguments"`
	EmbeddingType      string         `json:"embeddingType"`
	IndexName          string         `json:"indexName"`
	Title              string         `json:"title"`
	MetaTextDesc       string         `json:"metaTextDesc"`
	MetaKeyWords       string         `json:"metaKeyWords"`
	SourceLocation     string         `json:"sourceLocation"`
	ChunkSize          int            `json:"chunkSize"`
	ChunkOverlap       int            `json:"chunkOverlap"`
	RequestID          string         `json:"requestId,omitempty"`
}

// DocumentAddResponse represents the response structure
type DocumentAddResponse struct {
	RequestID string `json:"requestId,omitempty"`
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	Error     string `json:"error,omitempty"`
}

// DocumentSearchService handles Elasticsearch operations for document search and retrieval
type DocumentSearchService struct {
	application *App
}

// NewDocumentSearchService creates a new document search service instance
func (a *App) NewDocumentSearchService() *DocumentSearchService {
	return &DocumentSearchService{application: a}
}

// createElasticsearchClient creates and returns a new ElasticSearch client with a specified body length limit
func (a *App) createElasticsearchClient(maxBodyLength int) (*ElasticsearchClientWrapper, error) {
	elasticLogger := NewElasticsearchRequestLogger(LoggingLevelInfo)
	elasticLogger.SetMaxBodyLength(maxBodyLength)

	elasticClient, err := NewElasticsearchClient(*elasticLogger, *a.appArgs)
	if err != nil {
		a.log.Error("Failed to create Elasticsearch client: " + err.Error())
		return nil, err
	}

	return elasticClient, nil
}

// SetupEventListeners sets up event listeners for document operations
func (a *App) SetupEventListeners() {
	// Listen for add document requests
	runtime.EventsOn(a.ctx, "add-document-request", func(optionalData ...interface{}) {
		if len(optionalData) > 0 {
			// Parse the request data
			requestData, ok := optionalData[0].(map[string]interface{})
			if !ok {
				a.emitDocumentAddResponse(DocumentAddResponse{
					Success: false,
					Error:   "Invalid request data format",
				})
				return
			}

			// Convert to JSON and then to struct for proper type handling
			jsonData, err := json.Marshal(requestData)
			if err != nil {
				a.emitDocumentAddResponse(DocumentAddResponse{
					Success: false,
					Error:   "Failed to parse request data: " + err.Error(),
				})
				return
			}

			var request DocumentAddRequest
			if err := json.Unmarshal(jsonData, &request); err != nil {
				a.emitDocumentAddResponse(DocumentAddResponse{
					Success: false,
					Error:   "Failed to unmarshal request: " + err.Error(),
				})
				return
			}

			// Execute the AddElasticDocument method
			go a.handleAddDocumentRequest(request)
		}
	})
}

// handleAddDocumentRequest processes the add document request asynchronously
func (a *App) handleAddDocumentRequest(request DocumentAddRequest) {
	// Emit progress event
	runtime.EventsEmit(a.ctx, "add-document-progress", map[string]interface{}{
		"requestId": request.RequestID,
		"status":    "processing",
		"message":   "Adding document to Elasticsearch...",
	})

	// Call the actual AddElasticDocument method
	result := a.AddElasticDocument(
		request.EmbeddingArguments,
		request.EmbeddingType,
		request.IndexName,
		request.Title,
		request.MetaTextDesc,
		request.MetaKeyWords,
		request.SourceLocation,
		request.ChunkSize,
		request.ChunkOverlap,
	)

	// Determine success based on a result
	success := result == "Document added successfully"

	response := DocumentAddResponse{
		RequestID: request.RequestID,
		Success:   success,
		Message:   result,
	}

	if !success {
		response.Error = result
	}

	// Emit the response
	a.emitDocumentAddResponse(response)
}

// emitDocumentAddResponse emits the document add response event
func (a *App) emitDocumentAddResponse(response DocumentAddResponse) {
	runtime.EventsEmit(a.ctx, "add-document-response", response)
}

// GetAllIndices retrieves all available indices from ElasticSearch
func (a *App) GetAllIndices() []string {
	elasticClient, err := a.createElasticsearchClient(5000)
	if err != nil {
		return []string{}
	}

	availableIndices, err := elasticClient.GetAllElasticsearchIndices()
	if err != nil {
		log.Error("Failed to get indices: " + err.Error())
		return []string{}
	}

	return availableIndices
}

// GetDocumentsByFieldsSettings searches for documents based on provided field values
func (a *App) GetDocumentsByFieldsSettings(indexName, metaKeyWords, metaTextDesc, title string) string {
	elasticClient, err := a.createElasticsearchClient(5000)
	if err != nil {
		return err.Error()
	}

	searchParameters := DocumentSearchParameters{
		Title:        title,
		metaKeyWords: metaKeyWords,
		metaTextDesc: metaTextDesc,
		ResultSize:   20,
	}

	searchResults, err := elasticClient.SearchDocumentsByFields(a.ctx, indexName, searchParameters)
	if err != nil {
		// Check if the error is due to context cancellation
		if errors.Is(a.ctx.Err(), context.Canceled) {
			a.log.Info("Document search was cancelled by user")
			return "Search cancelled by user"
		}
		a.log.Error("Failed to search documents: " + err.Error())
		return err.Error()
	}

	// Check for cancellation before processing results
	if errors.Is(a.ctx.Err(), context.Canceled) {
		a.log.Info("Document search was cancelled by user")
		return "Search cancelled by user"
	}

	jsonOutput, err := TransformMultipleElasticResponsesToJSON(searchResults)
	if err != nil {
		a.log.Error("Failed to transform search results: " + err.Error())
		return err.Error()
	}

	return jsonOutput
}

// AddElasticDocument adds a document to Elasticsearch with the given parameters
func (a *App) AddElasticDocument(embeddingArguments LlamaEmbedArgs, embeddingType, indexName,
	title, metaTextDesc, metaKeyWords, sourceLocation string,
	chunkSize, chunkOverlap int) string {

	elasticClient, err := a.createElasticsearchClient(5000)
	if err != nil {
		return err.Error()
	}

	processedDocument, err := a.processDocumentByType(embeddingType, sourceLocation, chunkSize, chunkOverlap)
	if err != nil {
		a.log.Error("Failed to ingest document: " + err.Error())
		return err.Error()
	}

	err = elasticClient.AddElasticsearchDocument(a.ctx, a.log, *a.appArgs, embeddingArguments, processedDocument, indexName, title, metaTextDesc, metaKeyWords, sourceLocation)
	if err != nil {
		a.log.Error("Failed to add document to Elasticsearch: " + err.Error())
		return err.Error()
	}

	return "Document added successfully"
}

// processDocumentByType processes a document based on its type (csv, text, pdf)
func (a *App) processDocumentByType(embeddingType, sourceLocation string, chunkSize, chunkOverlap int) ([]Document, error) {
	switch embeddingType {
	case "csv":
		return IngestCVSData(a.log, *a.appArgs, sourceLocation, chunkSize, chunkOverlap)
	case "text":
		return IngestTextData(a.log, *a.appArgs, sourceLocation, chunkSize, chunkOverlap)
	case "pdf":
		return IngestPdfData(a.log, *a.appArgs, sourceLocation, chunkSize, chunkOverlap)
	default:
		return nil, fmt.Errorf("unsupported embed type: %s", embeddingType)
	}
}

// QueryElasticDocument processes a question against a specific document in ElasticSearch using vector similarity search
func (a *App) QueryElasticDocument(llamaCliArgs LlamaCliArgs, llamaEmbedArgs LlamaEmbedArgs,
	indexID string, documentID, embeddingPrompt string, documentPrompt string, promptType string, searchKeywords []string) string {
	processingStartTime := time.Now()
	// Reset context for this operation
	a.resetContext()
	completionResult := ""

	select {
	case <-a.ctx.Done():
		a.log.Info("Operation was cancelled before starting")
		return "Operation cancelled by user"
	default:

		elasticClient, err := a.createElasticsearchClient(150000)
		if err != nil {
			return err.Error()
		}

		// Generate vector embeddings for both keywords and prompt
		keywordSearchVector, err := GenerateEmbedWithCancel(a.ctx, llamaEmbedArgs, *a.appArgs, strings.Join(searchKeywords, " "))
		if err != nil {
			if errors.Is(a.ctx.Err(), context.Canceled) {
				a.log.Info("Document analysis was cancelled by user")
				return "Operation cancelled by user"
			}
			a.log.Error("Failed to generate keywordSearchVector embedding: " + err.Error())
			return err.Error()
		}
		promptSearchVector, err := GenerateEmbedWithCancel(a.ctx, llamaEmbedArgs, *a.appArgs, embeddingPrompt)
		if err != nil {
			// Check if the error is due to context cancellation
			if errors.Is(a.ctx.Err(), context.Canceled) {
				a.log.Info("Document analysis was cancelled by user")
				return "Search cancelled by user"
			}
			a.log.Error("Failed to generate embeddingPrompt embedding: " + err.Error())
			return err.Error()
		}

		// Perform vector similarity searches using both keyword and prompt embeddings
		keywordSearchResults, err := elasticClient.SearchDocumentByIDWithVector(a.ctx, indexID, documentID, keywordSearchVector, 15)
		if err != nil {
			// Check if the error is due to context cancellation
			if errors.Is(a.ctx.Err(), context.Canceled) {
				a.log.Info("Document analysis was cancelled by user")
				return "Search cancelled by user"
			}
			a.log.Error("Failed to search with keywordSearchVector embedding: " + err.Error())
			return err.Error()
		}
		promptSearchResults, err := elasticClient.SearchDocumentByIDWithVector(a.ctx, indexID, documentID, promptSearchVector, 15)
		if err != nil {
			// Check if the error is due to context cancellation
			if errors.Is(a.ctx.Err(), context.Canceled) {
				a.log.Info("Document analysis was cancelled by user")
				return "Search cancelled by user"
			}
			a.log.Error("Failed to search with promptSearchVector embedding: " + err.Error())
			return err.Error()
		}

		// Remove duplicates between keyword and prompt search results
		deduplicatedKeywordResults, deduplicatedPromptResults := removeDuplicateSearchResults(keywordSearchResults, promptSearchResults)

		// Combine both deduplicated search results for context generation
		combinedSearchContext := deduplicatedKeywordResults + deduplicatedPromptResults

		// Generate final completion using combined context
		completionResult = a.generateCompletionWithContext(llamaCliArgs, combinedSearchContext, documentPrompt, promptType)

		totalProcessingTime := time.Since(processingStartTime).Milliseconds()

		// Create and save the document question response with all relevant metadata
		documentQuestionResponse := DocumentQuestionResponse{
			ID:          bson.NewObjectID(),
			DocumentID:  documentID,
			IndexName:   indexID,
			EmbedPrompt: embeddingPrompt,
			DocPrompt:   documentPrompt,
			Response:    completionResult,
			Keywords:    searchKeywords,
			PromptType:  promptType,
			EmbedArgs:   llamaEmbedArgs,
			CliState:    llamaCliArgs,
			CreatedAt:   time.Now(),
			ProcessTime: totalProcessingTime,
		}

		if _, err = SaveDocumentQuestionResponse(a.appArgs, documentQuestionResponse); err != nil {
			a.log.Error("Failed to save document question response: " + err.Error())
			return ""
		}
	}
	return completionResult
}

// generateCompletionWithPromptType generates a completion with specific prompt type formatting
func (a *App) generateCompletionWithPromptType(llamaCliArgs LlamaCliArgs, llamaEmbedArgs LlamaEmbedArgs,
	userPrompt, promptType, documentID, indexName, embeddingPrompt, documentPrompt string, searchKeywords []string) string {

	processingStartTime := time.Now()

	// Format the prompt according to the specified prompt type
	formattedPrompt, err := HandlePromptType(a.log, promptType, userPrompt)
	if err != nil {
		a.log.Error("Failed to handle prompt type: " + err.Error())
		return err.Error()
	}

	// Save the formatted prompt for debugging/logging purposes
	filename := fmt.Sprintf("docQuery_%s_%s.txt", documentID, time.Now().Format("20060102_150405"))
	if err := SaveAsText(a.appArgs.PromptTempPath, filename, formattedPrompt, a.log); err != nil {
		a.log.Error("Failed to save prompt: " + err.Error())
	}
	// Configure CLI arguments with the formatted prompt and generate completion
	llamaCliArgs.PromptText = formattedPrompt
	cliArgumentsArray := LlamaCliStructToArgs(llamaCliArgs)
	generatedOutput, err := GenerateSingleCompletionWithCancel(a.ctx, *a.appArgs, cliArgumentsArray)
	if err != nil {
		a.log.Error("Failed to generate completion: " + err.Error())
		return err.Error()
	}

	completionOutputString := string(generatedOutput)
	totalProcessingTime := time.Since(processingStartTime).Milliseconds()

	// Create and save the document question response with all relevant metadata
	documentQuestionResponse := DocumentQuestionResponse{
		ID:          bson.NewObjectID(),
		DocumentID:  documentID,
		IndexName:   indexName,
		EmbedPrompt: embeddingPrompt,
		DocPrompt:   documentPrompt,
		Response:    completionOutputString,
		Keywords:    searchKeywords,
		EmbedArgs:   llamaEmbedArgs,
		CliState:    llamaCliArgs,
		CreatedAt:   time.Now(),
		ProcessTime: totalProcessingTime,
	}

	if _, err = SaveDocumentQuestionResponse(a.appArgs, documentQuestionResponse); err != nil {
		a.log.Error("Failed to save document question response: " + err.Error())
		return ""
	}

	return completionOutputString
}

// generateCompletionWithContext generates a completion using the provided context and document prompt
func (a *App) generateCompletionWithContext(llamaCliArgs LlamaCliArgs, searchContext string, documentPrompt string, promptType string) string {
	// Create a template that combines the document prompt with the search context
	contextualPromptTemplate := documentPrompt + "\n\nContext: %s\n\n"
	promptWithContext := fmt.Sprintf(contextualPromptTemplate, searchContext)

	// Generate completion with the contextualized prompt
	return a.generateCompletionWithPromptType(llamaCliArgs, LlamaEmbedArgs{}, promptWithContext, promptType, "", "", "", documentPrompt, []string{})
}

// removeDuplicateSearchResults removes duplicate strings between two search result sets
// It preserves all items from keywordResults and only unique items from promptResults
func removeDuplicateSearchResults(keywordResults, promptResults string) (string, string) {
	// Handle empty result cases
	if keywordResults == "" && promptResults == "" {
		return "", ""
	}

	if keywordResults == "" {
		return "", promptResults
	}

	if promptResults == "" {
		return keywordResults, ""
	}

	// If both results are identical, keep only keywordResults to avoid complete duplication
	if keywordResults == promptResults {
		return keywordResults, ""
	}

	// Split results into individual lines for granular duplicate detection
	keywordResultLines := strings.Split(keywordResults, "\n")
	promptResultLines := strings.Split(promptResults, "\n")

	// Create a lookup map to track lines that exist in keywordResults
	keywordLinesMap := make(map[string]bool)
	for _, line := range keywordResultLines {
		trimmedLine := strings.TrimSpace(line)
		if trimmedLine != "" {
			keywordLinesMap[trimmedLine] = true
		}
	}

	// Filter out duplicate lines from promptResults
	var uniquePromptResultLines []string
	for _, line := range promptResultLines {
		trimmedLine := strings.TrimSpace(line)
		// Only include non-empty lines that don't exist in keywordResults
		if trimmedLine != "" && !keywordLinesMap[trimmedLine] {
			uniquePromptResultLines = append(uniquePromptResultLines, line)
		}
	}

	// Reconstruct the filtered prompt results
	deduplicatedPromptResults := strings.Join(uniquePromptResultLines, "\n")

	return keywordResults, deduplicatedPromptResults
}
