package main

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/labstack/gommon/log"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"go.mongodb.org/mongo-driver/v2/bson"
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

// DocumentQueryRequest represents the structure for document query requests
type DocumentQueryRequest struct {
	LlamaCliArgs    LlamaCliArgs   `json:"llamaCliArgs"`
	LlamaEmbedArgs  LlamaEmbedArgs `json:"llamaEmbedArgs"`
	IndexID         string         `json:"indexId"`
	DocumentID      string         `json:"documentId"`
	EmbeddingPrompt string         `json:"embeddingPrompt"`
	DocumentPrompt  string         `json:"documentPrompt"`
	PromptType      string         `json:"promptType"`
	SearchKeywords  []string       `json:"searchKeywords"`
	RequestID       string         `json:"requestId,omitempty"`
}

// DocumentQueryResponse represents the response structure
type DocumentQueryResponse struct {
	RequestID      string `json:"requestId,omitempty"`
	Success        bool   `json:"success"`
	Result         string `json:"result"`
	Error          string `json:"error,omitempty"`
	ProcessingTime int64  `json:"processingTime"`
}

// DocumentQueryProgress represents progress updates
type DocumentQueryProgress struct {
	RequestID string `json:"requestId,omitempty"`
	Status    string `json:"status"`
	Message   string `json:"message"`
	Progress  int    `json:"progress"` // 0-100
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

func extractEmbeddingVector(result interface{}) ([]float64, error) {
	// Try nested [][]float64 array first
	if nestedVector, ok := result.([][]float64); ok {
		if len(nestedVector) == 0 {
			return nil, fmt.Errorf("embedding result is empty nested array")
		}
		return nestedVector[0], nil
	}

	// Try nested [][]float32 array
	if nestedVector, ok := result.([][]float32); ok {
		if len(nestedVector) == 0 {
			return nil, fmt.Errorf("embedding result is empty nested array")
		}
		// Convert []float32 to []float64
		f64Vector := make([]float64, len(nestedVector[0]))
		for i, v := range nestedVector[0] {
			f64Vector[i] = float64(v)
		}
		return f64Vector, nil
	}

	// Try simple []float64 array
	if vector, ok := result.([]float64); ok {
		return vector, nil
	}

	// Try simple []float32 array
	if vector, ok := result.([]float32); ok {
		// Convert []float32 to []float64
		f64Vector := make([]float64, len(vector))
		for i, v := range vector {
			f64Vector[i] = float64(v)
		}
		return f64Vector, nil
	}

	return nil, fmt.Errorf("embedding result is not [][]float64, [][]float32, []float64, or []float32, got %T", result)
}

// Helper function to convert []float64 to []float32
func convertFloat64ToFloat32(f64Slice []float64) []float32 {
	f32Slice := make([]float32, len(f64Slice))
	for i, v := range f64Slice {
		f32Slice[i] = float32(v)
	}
	return f32Slice
}

// Request handlers
func (a *App) handleQueryDocumentRequest(request DocumentQueryRequest) {
	// Add input validation
	if request.IndexID == "" {
		runtime.EventsEmit(a.ctx, "query-document-response", DocumentQueryResponse{
			RequestID: request.RequestID,
			Success:   false,
			Error:     "Index ID is required",
		})
		return
	}

	if request.DocumentID == "" {
		runtime.EventsEmit(a.ctx, "query-document-response", DocumentQueryResponse{
			RequestID: request.RequestID,
			Success:   false,
			Error:     "Document ID is required",
		})
		return
	}

	processingStartTime := time.Now()

	runtime.EventsEmit(a.ctx, "query-document-response", DocumentQueryProgress{
		RequestID: request.RequestID,
		Status:    "starting",
		Message:   "Initializing document query...",
		Progress:  0,
	})

	a.resetContext()

	// Add nil check for context
	if a.operationCtx == nil {
		runtime.EventsEmit(a.ctx, "query-document-response", DocumentQueryResponse{
			RequestID: request.RequestID,
			Success:   false,
			Error:     "Operation context is nil",
		})
		return
	}

	select {
	case <-a.operationCtx.Done():
		a.log.Info("Operation was cancelled before starting")
		runtime.EventsEmit(a.ctx, "query-document-response", DocumentQueryResponse{
			RequestID: request.RequestID,
			Success:   false,
			Error:     "Operation cancelled by user",
		})
		return
	default:
		// Wrap the main logic in a recover to catch panics
		defer func() {
			if r := recover(); r != nil {
				a.log.Error(fmt.Sprintf("Panic in queryElasticDocumentWithProgress: %v", r))
				runtime.EventsEmit(a.ctx, "query-document-response", DocumentQueryResponse{
					RequestID: request.RequestID,
					Success:   false,
					Error:     fmt.Sprintf("Internal error: %v", r),
				})
			}
		}()

		result := a.queryElasticDocumentWithProgress(request, processingStartTime)
		success := !strings.Contains(result, "Error:") && !strings.Contains(result, "cancelled")

		response := DocumentQueryResponse{
			RequestID:      request.RequestID,
			Success:        success,
			Result:         result,
			ProcessingTime: time.Since(processingStartTime).Milliseconds(),
		}

		if !success {
			response.Error = result
		}

		runtime.EventsEmit(a.ctx, "query-document-response", response)
	}
}
func (a *App) handleAddDocumentRequest(request DocumentAddRequest) {
	runtime.EventsEmit(a.ctx, "query-document-progress", map[string]interface{}{
		"requestId": request.RequestID,
		"status":    "processing",
		"message":   "Adding document to Elasticsearch...",
	})

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

	success := result == "Document added successfully"
	response := DocumentAddResponse{
		RequestID: request.RequestID,
		Success:   success,
		Message:   result,
	}

	if !success {
		response.Error = result
	}

	runtime.EventsEmit(a.ctx, "query-document-response", response)
}

// Core document processing methods
func (a *App) queryElasticDocumentWithProgress(request DocumentQueryRequest, processingStartTime time.Time) string {
	// Add defensive checks
	if a.operationCtx == nil {
		return "Error: operation context is nil"
	}

	steps := []struct {
		progress int
		status   string
		message  string
		action   func() (interface{}, error)
	}{
		{10, "connecting", "Connecting to Elasticsearch...", func() (interface{}, error) {
			return a.createElasticsearchClient(150000)
		}},
		{20, "embedding", "Generating vector embeddings...", func() (interface{}, error) {
			if len(request.SearchKeywords) == 0 {
				return nil, fmt.Errorf("search keywords are empty")
			}
			return GenerateEmbedWithCancel(a.operationCtx, request.LlamaEmbedArgs, *a.appArgs, strings.Join(request.SearchKeywords, " "))
		}},
		{40, "embedding", "Generating prompt embeddings...", func() (interface{}, error) {
			if request.EmbeddingPrompt == "" {
				return nil, fmt.Errorf("embedding prompt is empty")
			}
			return GenerateEmbedWithCancel(a.ctx, request.LlamaEmbedArgs, *a.appArgs, request.EmbeddingPrompt)
		}},
	}

	var elasticClient *ElasticsearchClientWrapper
	var keywordSearchVector, promptSearchVector []float64

	for i, step := range steps {
		// Check for cancellation before each step
		select {
		case <-a.operationCtx.Done():
			return "Operation cancelled by user"
		default:
		}

		runtime.EventsEmit(a.ctx, "query-document-progress", DocumentQueryProgress{
			RequestID: request.RequestID,
			Status:    step.status,
			Message:   step.message,
			Progress:  step.progress,
		})

		result, err := step.action()
		if err != nil {
			if errors.Is(a.operationCtx.Err(), context.Canceled) {
				a.log.Info("Document analysis was cancelled by user")
				return "Operation cancelled by user"
			}
			a.log.Error(fmt.Sprintf("Step %d failed: %s", i, err.Error()))
			return "Error: " + err.Error()
		}

		// Add nil checks before type assertions
		if result == nil {
			a.log.Error(fmt.Sprintf("Step %d returned nil result", i))
			return fmt.Sprintf("Error: Step %d returned nil result", i)
		}

		switch i {
		case 0:
			client, ok := result.(*ElasticsearchClientWrapper)
			if !ok {
				a.log.Error("Failed to cast result to ElasticsearchClientWrapper")
				return "Error: Failed to cast elasticsearch client"
			}
			elasticClient = client
		case 1:
			vector, err := extractEmbeddingVector(result)
			if err != nil {
				a.log.Error("Failed to extract keyword search vector: " + err.Error())
				return "Error: " + err.Error()
			}
			keywordSearchVector = vector
		case 2:
			vector, err := extractEmbeddingVector(result)
			if err != nil {
				a.log.Error("Failed to extract prompt search vector: " + err.Error())
				return "Error: " + err.Error()
			}
			promptSearchVector = vector
		}
	}

	// Final nil checks before proceeding
	if elasticClient == nil {
		return "Error: Elasticsearch client is nil"
	}
	if keywordSearchVector == nil {
		return "Error: Keyword search vector is nil"
	}
	if promptSearchVector == nil {
		return "Error: Prompt search vector is nil"
	}

	return a.performSearchAndGeneration(request, elasticClient, keywordSearchVector, promptSearchVector, processingStartTime)
}

func (a *App) performSearchAndGeneration(request DocumentQueryRequest, elasticClient *ElasticsearchClientWrapper,
	keywordSearchVector, promptSearchVector []float64, processingStartTime time.Time) string {

	// Progress: Performing searches
	runtime.EventsEmit(a.ctx, "query-document-progress", DocumentQueryProgress{
		RequestID: request.RequestID,
		Status:    "searching",
		Message:   "Performing vector similarity searches...",
		Progress:  60,
	})

	// Convert float64 slices to float32 for the SearchDocumentByIDWithVector function
	keywordSearchVectorF32 := convertFloat64ToFloat32(keywordSearchVector)
	promptSearchVectorF32 := convertFloat64ToFloat32(promptSearchVector)

	keywordSearchResults, err := elasticClient.SearchDocumentByIDWithVector(a.ctx, request.IndexID, request.DocumentID, keywordSearchVectorF32, 15)
	if err != nil {
		return a.handleSearchError(err, "keywordSearchVector")
	}

	promptSearchResults, err := elasticClient.SearchDocumentByIDWithVector(a.ctx, request.IndexID, request.DocumentID, promptSearchVectorF32, 15)
	if err != nil {
		return a.handleSearchError(err, "promptSearchVector")
	}

	// Progress: Processing results
	runtime.EventsEmit(a.ctx, "query-document-progress", DocumentQueryProgress{
		RequestID: request.RequestID,
		Status:    "processing",
		Message:   "Processing search results...",
		Progress:  80,
	})

	deduplicatedKeywordResults, deduplicatedPromptResults := removeDuplicateSearchResults(keywordSearchResults, promptSearchResults)
	combinedSearchContext := deduplicatedKeywordResults + deduplicatedPromptResults

	// Progress: Generating completion
	runtime.EventsEmit(a.ctx, "query-document-progress", DocumentQueryProgress{
		RequestID: request.RequestID,
		Status:    "generating",
		Message:   "Generating AI completion...",
		Progress:  90,
	})

	completionResult := a.generateCompletionWithContext(request.LlamaCliArgs, combinedSearchContext, request.DocumentPrompt, request.PromptType)

	a.saveDocumentQuestionResponse(request, completionResult, time.Since(processingStartTime).Milliseconds())

	// Progress: Complete
	runtime.EventsEmit(a.ctx, "query-document-progress", DocumentQueryProgress{
		RequestID: request.RequestID,
		Status:    "complete",
		Message:   "Document query completed successfully",
		Progress:  100,
	})

	return completionResult
}

func (a *App) handleSearchError(err error, searchType string) string {
	if errors.Is(a.operationCtx.Err(), context.Canceled) {
		a.log.Info("Document analysis was cancelled by user")
		return "Search cancelled by user"
	}
	a.log.Error(fmt.Sprintf("Failed to search with %s embedding: %s", searchType, err.Error()))
	return "Error: " + err.Error()
}

func (a *App) saveDocumentQuestionResponse(request DocumentQueryRequest, completionResult string, processingTime int64) {
	documentQuestionResponse := DocumentQuestionResponse{
		ID:          bson.NewObjectID(),
		DocumentID:  request.DocumentID,
		IndexName:   request.IndexID,
		EmbedPrompt: request.EmbeddingPrompt,
		DocPrompt:   request.DocumentPrompt,
		Response:    completionResult,
		Keywords:    request.SearchKeywords,
		PromptType:  request.PromptType,
		EmbedArgs:   request.LlamaEmbedArgs,
		CliState:    request.LlamaCliArgs,
		CreatedAt:   time.Now(),
		ProcessTime: processingTime,
	}

	if _, err := SaveDocumentQuestionResponse(a.appArgs, documentQuestionResponse); err != nil {
		a.log.Error("Failed to save document question response: " + err.Error())
	}
}

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

	searchResults, err := elasticClient.SearchDocumentsByFields(a.operationCtx, indexName, searchParameters)
	if err != nil {
		if errors.Is(a.ctx.Err(), context.Canceled) {
			a.log.Info("Document search was cancelled by user")
			return "Search cancelled by user"
		}
		a.log.Error("Failed to search documents: " + err.Error())
		return err.Error()
	}

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

// Legacy methods (consider refactoring these as well in future iterations)
func (a *App) QueryElasticDocument(llamaCliArgs LlamaCliArgs, llamaEmbedArgs LlamaEmbedArgs,
	indexID string, documentID, embeddingPrompt string, documentPrompt string, promptType string, searchKeywords []string) string {
	processingStartTime := time.Now()
	a.resetContext()

	select {
	case <-a.ctx.Done():
		a.log.Info("Operation was cancelled before starting")
		return "Operation cancelled by user"
	default:
		elasticClient, err := a.createElasticsearchClient(150000)
		if err != nil {
			return err.Error()
		}

		keywordSearchVector, err := GenerateEmbedWithCancel(a.ctx, llamaEmbedArgs, *a.appArgs, strings.Join(searchKeywords, " "))
		if err != nil {
			return a.handleEmbeddingError(err, "keywordSearchVector")
		}

		promptSearchVector, err := GenerateEmbedWithCancel(a.ctx, llamaEmbedArgs, *a.appArgs, embeddingPrompt)
		if err != nil {
			return a.handleEmbeddingError(err, "promptSearchVector")
		}

		keywordSearchResults, err := elasticClient.SearchDocumentByIDWithVector(a.ctx, indexID, documentID, keywordSearchVector, 15)
		if err != nil {
			return a.handleSearchError(err, "keywordSearchVector")
		}

		promptSearchResults, err := elasticClient.SearchDocumentByIDWithVector(a.ctx, indexID, documentID, promptSearchVector, 15)
		if err != nil {
			return a.handleSearchError(err, "promptSearchVector")
		}

		deduplicatedKeywordResults, deduplicatedPromptResults := removeDuplicateSearchResults(keywordSearchResults, promptSearchResults)
		combinedSearchContext := deduplicatedKeywordResults + deduplicatedPromptResults

		completionResult := a.generateCompletionWithContext(llamaCliArgs, combinedSearchContext, documentPrompt, promptType)

		totalProcessingTime := time.Since(processingStartTime).Milliseconds()
		a.saveDocumentQuestionResponseLegacy(documentID, indexID, embeddingPrompt, documentPrompt, completionResult, searchKeywords, promptType, llamaEmbedArgs, llamaCliArgs, totalProcessingTime)

		return completionResult
	}
}

func (a *App) handleEmbeddingError(err error, embeddingType string) string {
	if errors.Is(a.ctx.Err(), context.Canceled) {
		a.log.Info("Document analysis was cancelled by user")
		return "Operation cancelled by user"
	}
	a.log.Error(fmt.Sprintf("Failed to generate %s embedding: %s", embeddingType, err.Error()))
	return err.Error()
}

func (a *App) saveDocumentQuestionResponseLegacy(documentID, indexID, embeddingPrompt, documentPrompt, completionResult string, searchKeywords []string, promptType string, llamaEmbedArgs LlamaEmbedArgs, llamaCliArgs LlamaCliArgs, totalProcessingTime int64) {
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

	if _, err := SaveDocumentQuestionResponse(a.appArgs, documentQuestionResponse); err != nil {
		a.log.Error("Failed to save document question response: " + err.Error())
	}
}

func (a *App) generateCompletionWithPromptType(llamaCliArgs LlamaCliArgs, llamaEmbedArgs LlamaEmbedArgs,
	userPrompt, promptType, documentID, indexName, embeddingPrompt, documentPrompt string, searchKeywords []string) string {

	processingStartTime := time.Now()

	formattedPrompt, err := HandlePromptType(a.log, promptType, userPrompt)
	if err != nil {
		a.log.Error("Failed to handle prompt type: " + err.Error())
		return err.Error()
	}

	filename := fmt.Sprintf("docQuery_%s_%s.txt", documentID, time.Now().Format("20060102_150405"))
	if err := SaveAsText(a.appArgs.PromptTempPath, filename, formattedPrompt, a.log); err != nil {
		a.log.Error("Failed to save prompt: " + err.Error())
	}

	llamaCliArgs.PromptText = formattedPrompt
	cliArgumentsArray := LlamaCliStructToArgs(llamaCliArgs)
	generatedOutput, err := GenerateSingleCompletionWithCancel(a.ctx, *a.appArgs, cliArgumentsArray)
	if err != nil {
		a.log.Error("Failed to generate completion: " + err.Error())
		return err.Error()
	}

	completionOutputString := string(generatedOutput)
	totalProcessingTime := time.Since(processingStartTime).Milliseconds()

	a.saveDocumentQuestionResponseLegacy(documentID, indexName, embeddingPrompt, documentPrompt, completionOutputString, searchKeywords, promptType, llamaEmbedArgs, llamaCliArgs, totalProcessingTime)

	return completionOutputString
}

func (a *App) generateCompletionWithContext(llamaCliArgs LlamaCliArgs, searchContext string, documentPrompt string, promptType string) string {
	contextualPromptTemplate := documentPrompt + "\n\nContext: %s\n\n"
	promptWithContext := fmt.Sprintf(contextualPromptTemplate, searchContext)

	return a.generateCompletionWithPromptType(llamaCliArgs, LlamaEmbedArgs{}, promptWithContext, promptType, "", "", "", documentPrompt, []string{})
}

func removeDuplicateSearchResults(keywordResults, promptResults string) (string, string) {
	if keywordResults == "" && promptResults == "" {
		return "", ""
	}

	if keywordResults == "" {
		return "", promptResults
	}

	if promptResults == "" {
		return keywordResults, ""
	}

	if keywordResults == promptResults {
		return keywordResults, ""
	}

	keywordResultLines := strings.Split(keywordResults, "\n")
	promptResultLines := strings.Split(promptResults, "\n")

	keywordLinesMap := make(map[string]bool)
	for _, line := range keywordResultLines {
		trimmedLine := strings.TrimSpace(line)
		if trimmedLine != "" {
			keywordLinesMap[trimmedLine] = true
		}
	}

	var uniquePromptResultLines []string
	for _, line := range promptResultLines {
		trimmedLine := strings.TrimSpace(line)
		if trimmedLine != "" && !keywordLinesMap[trimmedLine] {
			uniquePromptResultLines = append(uniquePromptResultLines, line)
		}
	}

	deduplicatedPromptResults := strings.Join(uniquePromptResultLines, "\n")

	return keywordResults, deduplicatedPromptResults
}
