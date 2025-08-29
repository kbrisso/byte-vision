package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// DocumentQueryProgress represents progress updates for document queries
type DocumentQueryProgress struct {
	RequestID string `json:"requestId,omitempty"`
	Status    string `json:"status"`
	Message   string `json:"message"`
	Progress  int    `json:"progress"` // 0-100
}

// DocumentQueryResponse represents the response to a document query
type DocumentQueryResponse struct {
	RequestID      string `json:"requestId,omitempty"`
	Success        bool   `json:"success"`
	Result         string `json:"result,omitempty"`
	Error          string `json:"error,omitempty"`
	ProcessingTime int64  `json:"processingTime,omitempty"`
}

// DocumentQueryRequest represents a document query request
type DocumentQueryRequest struct {
	RequestID       string                 `json:"requestId,omitempty"`
	LlamaCliArgs    map[string]interface{} `json:"llamaCliArgs"`
	LlamaEmbedArgs  map[string]interface{} `json:"llamaEmbedArgs"`
	IndexID         string                 `json:"indexId"`
	DocumentID      string                 `json:"documentId"`
	EmbeddingPrompt string                 `json:"embeddingPrompt"`
	DocumentPrompt  string                 `json:"documentPrompt"`
	PromptType      string                 `json:"promptType"`
	SearchKeywords  []string               `json:"searchKeywords"`
}

// DocumentAddRequest represents a document add request
type DocumentAddRequest struct {
	RequestID             string         `json:"requestId,omitempty"`
	EmbeddingArguments    LlamaEmbedArgs `json:"embeddingArguments"`
	EmbeddingType         string         `json:"embeddingType"`
	IndexName             string         `json:"indexName"`
	Title                 string         `json:"title"`
	MetaTextDesc          string         `json:"metaTextDesc"`
	MetaKeyWords          string         `json:"metaKeyWords"`
	FilePath              string         `json:"filePath"`
	ChunkSize             int            `json:"chunkSize"`
	ChunkOverlap          int            `json:"chunkOverlap"`
	EnableStopWordRemoval bool           `json:"enableStopWordRemoval"`
}

// DocumentAddResponse represents the response to a document add request
type DocumentAddResponse struct {
	RequestID      string `json:"requestId,omitempty"`
	Success        bool   `json:"success"`
	Result         string `json:"result,omitempty"`
	Error          string `json:"error,omitempty"`
	ProcessingTime int64  `json:"processingTime,omitempty"`
}

// DocumentSearchService handles Elasticsearch operations for document search and retrieval
type DocumentSearchService struct {
	application *App
}

// NewDocumentSearchService creates a new document search service instance
func (app *App) NewDocumentSearchService() *DocumentSearchService {
	return &DocumentSearchService{application: app}
}

// createElasticsearchClient creates and returns a new ElasticSearch client with a specified body length limit
func (app *App) createElasticsearchClient(maxBodyLength int) (*ElasticsearchClientWrapper, error) {
	elasticLogger := NewElasticsearchRequestLogger(LoggingLevelInfo)
	elasticLogger.SetMaxBodyLength(maxBodyLength)

	elasticClient, err := NewElasticsearchClient(*elasticLogger, *app.appArgs)
	if err != nil {
		app.log.Error("Failed to create Elasticsearch client: " + err.Error())
		return nil, err
	}

	return elasticClient, nil
}

// recoverFromPanic provides centralized panic recovery with logging
func (app *App) recoverFromPanic(operation string, requestID string) {
	if r := recover(); r != nil {
		app.log.Error(fmt.Sprintf("Panic in %s (RequestID: %s): %v", operation, requestID, r))
	}
}

// createEventHandler safely creates an event handler with centralized error handling
func (app *App) createEventHandler() *EventHandler {
	defer app.recoverFromPanic("createEventHandler", "")
	return NewEventHandler(app)
}

// emitProgressSafely emits progress updates with error handling
func (app *App) emitProgressSafely(requestID, status, message string, progress int) {
	defer app.recoverFromPanic("emitProgress", requestID)

	eh := app.createEventHandler()
	if eh != nil {
		progressData := map[string]interface{}{
			"requestId": requestID,
			"status":    status,
			"message":   message,
			"progress":  progress,
		}
		eh.emitDocumentAddProgress(progressData)
	}
}

// Helper function with proper error handling
func (app *App) generateDocumentAddWithProgressSafe(request DocumentAddRequest) (*string, error) {
	defer app.recoverFromPanic("generateDocumentAddWithProgressSafe", request.RequestID)

	result := app.generateDocumentAddWithProgress(request)
	return &result, nil
}

// generateDocumentAddWithProgress generates document add response with progress updates
func (app *App) generateDocumentAddWithProgress(request DocumentAddRequest) string {
	// Emit progress: processing document
	app.emitProgressSafely(request.RequestID, "processing", "Processing document...", 20)

	// Check if the operation was canceled
	if app.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// Emit progress: extracting content
	app.emitProgressSafely(request.RequestID, "extracting", "Extracting document content...", 40)

	// Check for cancellation
	if app.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// Emit progress: indexing
	app.emitProgressSafely(request.RequestID, "indexing", "Indexing document...", 70)

	// Check for cancellation
	if app.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// **ADD THIS: Actually call AddElasticDocument**
	// You'll need to determine appropriate values for the missing parameters
	embeddingArgs := request.EmbeddingArguments
	embeddingType := request.EmbeddingType
	indexName := request.IndexName
	title := request.Title
	description := request.MetaTextDesc
	metaKeyWords := request.MetaKeyWords
	filePath := request.FilePath
	chunkSize := request.ChunkSize
	chunkOverlap := request.ChunkOverlap
	enableStopWordRemoval := request.EnableStopWordRemoval // Configure as needed

	result := app.AddElasticDocument(
		embeddingArgs,
		embeddingType,
		indexName,
		title,
		description,
		metaKeyWords,
		filePath,
		chunkSize,
		chunkOverlap,
		enableStopWordRemoval,
	)

	// Emit progress: finalizing
	app.emitProgressSafely(request.RequestID, "finalizing", "Finalizing document addition...", 95)

	return result
}

func (app *App) handleAddDocumentRequest(request DocumentAddRequest) {
	defer app.recoverFromPanic("handleAddDocumentRequest", request.RequestID)

	processingStartTime := time.Now()

	// Create event handler for responses
	eh := app.createEventHandler()
	if eh == nil {
		app.log.Error("Failed to create event handler for request: " + request.RequestID)
		return
	}

	// Log the request
	app.log.Info(fmt.Sprintf("Processing document add request: %s", request.RequestID))

	// Emit initial progress
	app.emitProgressSafely(request.RequestID, "starting", "Starting document processing...", 5)

	// Generate document add response with progress tracking
	result := app.generateDocumentAddWithProgress(request)

	// Calculate processing time
	processingTime := time.Since(processingStartTime).Milliseconds()

	// Check if operation was cancelled or resulted in error
	if result == "Operation cancelled by user" {
		app.log.Info(fmt.Sprintf("Document add request %s was cancelled", request.RequestID))
		eh.emitDocumentAddResponse(DocumentAddResponse{
			RequestID:      request.RequestID,
			Success:        false,
			Error:          "Request was cancelled",
			ProcessingTime: processingTime,
		})
		return
	}

	// Check for error prefixes in result
	if len(result) >= 6 && result[:6] == "Error:" {
		eh.emitDocumentAddResponse(DocumentAddResponse{
			RequestID:      request.RequestID,
			Success:        false,
			Error:          result[6:], // Remove "Error:" prefix
			ProcessingTime: processingTime,
		})
		return
	}

	// Emit final progress
	app.emitProgressSafely(request.RequestID, "completed", "Document processed successfully", 100)

	// Emit success response
	eh.emitDocumentAddResponse(DocumentAddResponse{
		RequestID:      request.RequestID,
		Success:        true,
		Result:         result,
		ProcessingTime: processingTime,
	})

	app.log.Info(fmt.Sprintf("Document add request %s completed successfully", request.RequestID))
}

func (app *App) handleSearchError(err error, searchType string) string {
	if errors.Is(app.operationCtx.Err(), context.Canceled) {
		app.log.Info("Document analysis was cancelled by user")
		return "Search cancelled by user"
	}
	app.log.Error(fmt.Sprintf("Failed to search with %s embedding: %s", searchType, err.Error()))
	return "Error: " + err.Error()
}

func (app *App) GetAllIndices() []string {
	elasticClient, err := app.createElasticsearchClient(5000)
	if err != nil {
		return []string{}
	}

	availableIndices, err := elasticClient.GetAllElasticsearchIndices()
	if err != nil {
		app.log.Error("Failed to get indices: " + err.Error())
		return []string{}
	}

	return availableIndices
}

func (app *App) GetDocumentsByFieldsSettings(indexName, metaKeyWords, metaTextDesc, title string) string {
	elasticClient, err := app.createElasticsearchClient(5000)
	if err != nil {
		return err.Error()
	}

	searchParameters := DocumentSearchParameters{
		Title:        title,
		metaKeyWords: metaKeyWords,
		metaTextDesc: metaTextDesc,
		ResultSize:   20,
	}

	searchResults, err := elasticClient.SearchDocumentsByFields(app.operationCtx, indexName, searchParameters)
	if err != nil {
		if errors.Is(app.ctx.Err(), context.Canceled) {
			app.log.Info("Document search was cancelled by user")
			return "Search cancelled by user"
		}
		app.log.Error("Failed to search documents: " + err.Error())
		return err.Error()
	}

	if errors.Is(app.ctx.Err(), context.Canceled) {
		app.log.Info("Document search was cancelled by user")
		return "Search cancelled by user"
	}

	jsonOutput, err := TransformMultipleElasticResponsesToJSON(searchResults)
	if err != nil {
		app.log.Error("Failed to transform search results: " + err.Error())
		return err.Error()
	}

	return jsonOutput
}

func (app *App) AddElasticDocument(embeddingArguments LlamaEmbedArgs, embeddingType, indexName,
	title, metaTextDesc, metaKeyWords, sourceLocation string,
	chunkSize, chunkOverlap int, enableStopWordRemoval bool) string {

	elasticClient, err := app.createElasticsearchClient(5000)
	if err != nil {
		return err.Error()
	}

	processedDocument, err := app.processDocumentByType(embeddingType, sourceLocation, chunkSize, chunkOverlap, enableStopWordRemoval)
	if err != nil {
		app.log.Error("Failed to ingest document: " + err.Error())
		return err.Error()
	}

	err = elasticClient.AddElasticsearchDocument(app.ctx, app.log, *app.appArgs, embeddingArguments, processedDocument, indexName, title, metaTextDesc, metaKeyWords, sourceLocation)
	if err != nil {
		app.log.Error("Failed to add document to Elasticsearch: " + err.Error())
		return err.Error()
	}

	return "Document added successfully"
}

func (app *App) processDocumentByType(embeddingType, sourceLocation string, chunkSize, chunkOverlap int, enableStopWordRemoval bool) ([]Document, error) {
	switch embeddingType {
	case "csv":
		return IngestCVSData(app.log, *app.appArgs, sourceLocation, chunkSize, chunkOverlap, enableStopWordRemoval)
	case "text":
		return IngestTextData(app.log, *app.appArgs, sourceLocation, chunkSize, chunkOverlap, enableStopWordRemoval)
	case "pdf":
		return IngestPdfData(app.log, *app.appArgs, sourceLocation, chunkSize, chunkOverlap, enableStopWordRemoval)
	default:
		return nil, fmt.Errorf("unsupported embed type: %s", embeddingType)
	}
}

// Legacy methods (consider refactoring these as well in future iterations)
func (app *App) QueryElasticDocument(llamaCliArgs LlamaCliArgs, llamaEmbedArgs LlamaEmbedArgs,
	indexID string, documentID, embeddingPrompt string, documentPrompt string, promptType string, searchKeywords []string) string {
	processingStartTime := time.Now()
	app.resetContext()

	select {
	case <-app.ctx.Done():
		app.log.Info("Operation was cancelled before starting")
		return "Operation cancelled by user"
	default:
		elasticClient, err := app.createElasticsearchClient(150000)
		if err != nil {
			return err.Error()
		}

		keywordSearchVector, err := GenerateEmbedWithCancel(app.ctx, llamaEmbedArgs, *app.appArgs, strings.Join(searchKeywords, " "))
		if err != nil {
			return app.handleEmbeddingError(err, "keywordSearchVector")
		}

		promptSearchVector, err := GenerateEmbedWithCancel(app.ctx, llamaEmbedArgs, *app.appArgs, embeddingPrompt)
		if err != nil {
			return app.handleEmbeddingError(err, "promptSearchVector")
		}

		keywordSearchResults, err := elasticClient.SearchDocumentByIDWithVector(app.ctx, indexID, documentID, keywordSearchVector, 15)
		if err != nil {
			return app.handleSearchError(err, "keywordSearchVector")
		}

		promptSearchResults, err := elasticClient.SearchDocumentByIDWithVector(app.ctx, indexID, documentID, promptSearchVector, 15)
		if err != nil {
			return app.handleSearchError(err, "promptSearchVector")
		}

		deduplicatedKeywordResults, deduplicatedPromptResults := removeDuplicateSearchResults(keywordSearchResults, promptSearchResults)
		combinedSearchContext := deduplicatedKeywordResults + deduplicatedPromptResults

		completionResult := app.generateCompletionWithPromptType(llamaCliArgs, llamaEmbedArgs, combinedSearchContext, promptType, documentID, indexID, embeddingPrompt, documentPrompt, searchKeywords)

		totalProcessingTime := time.Since(processingStartTime).Milliseconds()
		app.prepareDocumentQuestionResponse(documentID, indexID, embeddingPrompt, documentPrompt, completionResult, searchKeywords, promptType, llamaEmbedArgs, llamaCliArgs, totalProcessingTime)

		return completionResult
	}
}

func (app *App) handleEmbeddingError(err error, embeddingType string) string {
	if errors.Is(app.ctx.Err(), context.Canceled) {
		app.log.Info("Document analysis was cancelled by user")
		return "Operation cancelled by user"
	}
	app.log.Error(fmt.Sprintf("Failed to generate %s embedding: %s", embeddingType, err.Error()))
	return err.Error()
}

func (app *App) prepareDocumentQuestionResponse(documentID, indexID, embeddingPrompt, documentPrompt, completionResult string, searchKeywords []string, promptType string, llamaEmbedArgs LlamaEmbedArgs, llamaCliArgs LlamaCliArgs, totalProcessingTime int64) {
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

	if _, err := SaveDocumentQuestionResponse(app.appArgs, documentQuestionResponse); err != nil {
		app.log.Error("Failed to save document question response: " + err.Error())
	}
}

func (app *App) generateCompletionWithPromptType(llamaCliArgs LlamaCliArgs, llamaEmbedArgs LlamaEmbedArgs,
	combinedSearchContext, promptType, documentID, indexName, embeddingPrompt, documentPrompt string, searchKeywords []string) string {

	processingStartTime := time.Now()

	formattedPrompt, err := HandlePromptType(app.log, promptType, documentPrompt+"\nUse only the provided Context:"+combinedSearchContext)
	if err != nil {
		app.log.Error("Failed to handle prompt type: " + err.Error())
		return err.Error()
	}

	filename := fmt.Sprintf("docQuery_%s_%s.txt", documentID, time.Now().Format("20060102_150405"))
	if err := SaveAsText(app.appArgs.PromptTempPath, filename, formattedPrompt, app.log); err != nil {
		app.log.Error("Failed to save prompt: " + err.Error())
	}

	llamaCliArgs.PromptText = formattedPrompt
	cliArgumentsArray := LlamaCliStructToArgs(llamaCliArgs)
	generatedOutput, err := GenerateSingleCompletionWithCancel(app.ctx, *app.appArgs, cliArgumentsArray)
	if err != nil {
		app.log.Error("Failed to generate completion: " + err.Error())
		return err.Error()
	}

	completionOutputString := string(generatedOutput)
	totalProcessingTime := time.Since(processingStartTime).Milliseconds()

	app.prepareDocumentQuestionResponse(documentID, indexName, embeddingPrompt, documentPrompt, completionOutputString, searchKeywords, promptType, llamaEmbedArgs, llamaCliArgs, totalProcessingTime)

	return completionOutputString
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

// convertMapToLlamaCliArgs converts map[string]interface{} to LlamaCliArgs struct (creates a copy)
func (app *App) convertMapToLlamaCliArgs(requestArgs map[string]interface{}) (LlamaCliArgs, error) {
	// Start with a copy of default args to ensure all fields are properly initialized
	var cliArgs LlamaCliArgs
	if app.appArgs != nil && app.llamaCliArgs != nil {
		// Create a deep copy of the default args
		cliArgs = *app.llamaCliArgs
	}

	// If request has custom args, merge them in
	if requestArgs != nil && len(requestArgs) > 0 {
		// Convert map to JSON then to struct for proper type handling
		jsonData, err := json.Marshal(requestArgs)
		if err != nil {
			app.log.Error("Failed to marshal CLI args: " + err.Error())
			// Return the default args copy as fallback
			return cliArgs, nil
		}

		// Unmarshal into our copy (this will override fields present in the request)
		if err := json.Unmarshal(jsonData, &cliArgs); err != nil {
			app.log.Error("Failed to unmarshal CLI args: " + err.Error())
			// Return the default args copy as fallback
			return cliArgs, nil
		}

		app.log.Info("Successfully converted CLI args from request")
	} else {
		app.log.Info("Using default CLI args (no custom args provided)")
	}

	return cliArgs, nil
}

// convertMapToLlamaEmbedArgs converts map[string]interface{} to LlamaEmbedArgs struct (creates a copy)
func (app *App) convertMapToLlamaEmbedArgs(requestArgs map[string]interface{}) (LlamaEmbedArgs, error) {
	// Start with a copy of default args to ensure all fields are properly initialized
	var embedArgs LlamaEmbedArgs
	if app.appArgs != nil && app.llamaEmbedArgs != nil {
		// Create a deep copy of the default args
		embedArgs = *app.llamaEmbedArgs
	}

	// If request has custom args, merge them in
	if requestArgs != nil && len(requestArgs) > 0 {
		// Convert map to JSON then to struct for proper type handling
		jsonData, err := json.Marshal(requestArgs)
		if err != nil {
			app.log.Error("Failed to marshal embed args: " + err.Error())
			// Return the default args copy as fallback
			return embedArgs, nil
		}

		// Unmarshal into our copy (this will override fields present in the request)
		if err := json.Unmarshal(jsonData, &embedArgs); err != nil {
			app.log.Error("Failed to unmarshal embed args: " + err.Error())
			// Return the default args copy as fallback
			return embedArgs, nil
		}

		app.log.Info("Successfully converted embed args from request")
	} else {
		app.log.Info("Using default embed args (no custom args provided)")
	}

	return embedArgs, nil
}

// safeCreateEventHandler safely creates an event handler with nil checks
func (app *App) safeCreateEventHandler() *EventHandler {
	return app.createEventHandler()
}

// safeResetContext safely resets the operation context with nil checks
func (app *App) safeResetContext() {
	if app == nil {
		return
	}

	defer app.recoverFromPanic("safeResetContext", "")
	app.resetContext()
}

// validateQueryRequest validates the incoming request structure
func (app *App) validateQueryRequest(request DocumentQueryRequest) error {
	if request.RequestID == "" {
		return fmt.Errorf("request ID is required")
	}

	if request.IndexID == "" {
		return fmt.Errorf("index ID is required")
	}

	if request.DocumentID == "" {
		return fmt.Errorf("document ID is required")
	}

	if request.EmbeddingPrompt == "" {
		return fmt.Errorf("embedding prompt is required")
	}

	if request.DocumentPrompt == "" {
		return fmt.Errorf("document prompt is required")
	}

	if len(request.SearchKeywords) == 0 {
		return fmt.Errorf("search keywords are required")
	}

	return nil
}

// prepareQueryResponse creates the final response based on result and error status
func (app *App) prepareQueryResponse(requestID, result string, queryError error, processingStartTime time.Time) DocumentQueryResponse {
	response := DocumentQueryResponse{
		RequestID:      requestID,
		ProcessingTime: time.Since(processingStartTime).Milliseconds(),
	}

	if queryError != nil {
		if app.log != nil {
			app.log.Error("Query operation failed: " + queryError.Error())
		}
		response.Success = false
		response.Error = queryError.Error()
		return response
	}

	// Check for error indicators in the result
	if app.isErrorResult(result) {
		response.Success = false
		response.Error = app.extractErrorMessage(result)
		return response
	}

	// Success case
	response.Success = true
	response.Result = result
	return response
}

// isErrorResult checks if the result string indicates an error condition
func (app *App) isErrorResult(result string) bool {
	if result == "" {
		return true
	}

	resultLower := strings.ToLower(result)
	errorIndicators := []string{
		"error:",
		"operation cancelled",
		"failed to",
		"panic:",
		"invalid memory address",
		"nil pointer",
	}

	for _, indicator := range errorIndicators {
		if strings.Contains(resultLower, indicator) {
			return true
		}
	}

	return false
}

// extractErrorMessage extracts a clean error message from the result
func (app *App) extractErrorMessage(result string) string {
	if strings.HasPrefix(result, "Error:") {
		return strings.TrimSpace(strings.TrimPrefix(result, "Error:"))
	}
	if strings.HasPrefix(result, "error:") {
		return strings.TrimSpace(strings.TrimPrefix(result, "error:"))
	}
	return result
}
