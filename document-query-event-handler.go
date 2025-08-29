package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// DocumentQueryEventHandler delegates document query event setup to the core EventHandler
type DocumentQueryEventHandler struct {
	core *EventHandler
}

func NewDocumentQueryEventHandler(core *EventHandler) *DocumentQueryEventHandler {
	return &DocumentQueryEventHandler{core: core}
}

func (h *DocumentQueryEventHandler) SetupEventListeners() {
	if h == nil || h.core == nil {
		return
	}
	// Reuse existing, battle-tested implementation on the core handler
	h.core.setupDocumentQueryEventListener()
}

func (eh *EventHandler) setupDocumentQueryEventListener() {
	runtime.EventsOn(eh.app.ctx, "query-document-request", func(optionalData ...interface{}) {
		eh.app.log.Info(fmt.Sprintf("Received query-document-request event with %d parameters", len(optionalData)))
		if len(optionalData) == 0 {
			eh.app.log.Info("No data received in query-document-request event")
			return
		}
		request, err := eh.parseDocumentQueryRequest(optionalData[0])
		if err != nil {
			eh.emitDocumentQueryError("", err.Error())
			return
		}
		eh.app.log.Info(fmt.Sprintf("Parsed request successfully: %+v", request))
		// Execute the query asynchronously with proper error recovery
		go eh.safeHandleQueryDocumentRequest(request)
	})
}

func (eh *EventHandler) safeHandleQueryDocumentRequest(request DocumentQueryRequest) {
	defer eh.recoverFromPanic("handleQueryDocumentRequest", request.RequestID)
	eh.app.handleQueryDocumentRequest(request)
}

func (app *App) handleQueryDocumentRequest(request DocumentQueryRequest) {
	processor := newDocumentQueryProcessor(app, request)
	processor.processRequest()
}

// documentQueryProcessor encapsulates the document query processing logic
type documentQueryProcessor struct {
	app                 *App
	request             DocumentQueryRequest
	processingStartTime time.Time
	eventHandler        *EventHandler
}

func newDocumentQueryProcessor(app *App, request DocumentQueryRequest) *documentQueryProcessor {
	return &documentQueryProcessor{
		app:                 app,
		request:             request,
		processingStartTime: time.Now(),
	}
}

func (p *documentQueryProcessor) processRequest() {
	// Defensive nil checks first
	if p.app == nil || p.app.log == nil {
		return
	}

	// Recover from any panics in this method
	defer p.handlePanic()

	// Initialize event handler
	p.eventHandler = p.app.safeCreateEventHandler()
	if p.eventHandler == nil {
		p.app.log.Error("Failed to create event handler")
		return
	}

	// Emit initial progress and validate request
	p.emitInitialProgress()
	if err := p.validateRequest(); err != nil {
		p.emitErrorResponse(err.Error())
		return
	}

	// Convert arguments
	cliArgs, embedArgs, err := p.convertArguments()
	if err != nil {
		p.emitErrorResponse(err.Error())
		return
	}

	// Execute query
	result := p.executeQuery(cliArgs, embedArgs)

	// Emit completion and response
	p.emitCompletion(result)
}

func (p *documentQueryProcessor) handlePanic() {
	if r := recover(); r != nil {
		p.app.log.Error(fmt.Sprintf("Panic in handleQueryDocumentRequest: %v", r))
		if p.eventHandler != nil {
			p.eventHandler.emitDocumentQueryResponse(DocumentQueryResponse{
				RequestID: p.request.RequestID,
				Success:   false,
				Error:     fmt.Sprintf("Internal error: %v", r),
			})
		}
	}
}

func (p *documentQueryProcessor) emitInitialProgress() {
	p.eventHandler.emitDocumentQueryProgress(DocumentQueryProgress{
		RequestID: p.request.RequestID,
		Status:    "starting",
		Message:   "Starting document query...",
		Progress:  5,
	})
}

func (p *documentQueryProcessor) validateRequest() error {
	if err := p.app.validateQueryRequest(p.request); err != nil {
		p.app.log.Error("Request validation failed: " + err.Error())
		return err
	}
	return nil
}

func (p *documentQueryProcessor) convertArguments() (LlamaCliArgs, LlamaEmbedArgs, error) {
	cliArgs, err := p.app.convertMapToLlamaCliArgs(p.request.LlamaCliArgs)
	if err != nil {
		p.app.log.Error("Failed to convert CLI args: " + err.Error())
		return LlamaCliArgs{}, LlamaEmbedArgs{}, fmt.Errorf("failed to convert CLI arguments: %w", err)
	}

	embedArgs, err := p.app.convertMapToLlamaEmbedArgs(p.request.LlamaEmbedArgs)
	if err != nil {
		p.app.log.Error("Failed to convert embed args: " + err.Error())
		return LlamaCliArgs{}, LlamaEmbedArgs{}, fmt.Errorf("failed to convert embedding arguments: %w", err)
	}

	return cliArgs, embedArgs, nil
}

func (p *documentQueryProcessor) executeQuery(cliArgs LlamaCliArgs, embedArgs LlamaEmbedArgs) string {
	p.eventHandler.emitDocumentQueryProgress(DocumentQueryProgress{
		RequestID: p.request.RequestID,
		Status:    "processing",
		Message:   "Processing document query...",
		Progress:  10,
	})

	p.app.log.Info(fmt.Sprintf("Calling QueryElasticDocument with converted arguments for request: %s", p.request.RequestID))

	return p.app.QueryElasticDocument(
		cliArgs,
		embedArgs,
		p.request.IndexID,
		p.request.DocumentID,
		p.request.EmbeddingPrompt,
		p.request.DocumentPrompt,
		p.request.PromptType,
		p.request.SearchKeywords,
	)
}

func (p *documentQueryProcessor) emitCompletion(result string) {
	response := p.app.prepareQueryResponse(p.request.RequestID, result, nil, p.processingStartTime)

	p.eventHandler.emitDocumentQueryProgress(DocumentQueryProgress{
		RequestID: p.request.RequestID,
		Status:    "completed",
		Message:   "Processing complete",
		Progress:  100,
	})

	time.Sleep(25 * time.Millisecond)
	p.eventHandler.emitDocumentQueryResponse(response)

	processingTime := time.Since(p.processingStartTime).Milliseconds()
	p.app.log.Info(fmt.Sprintf("Document query request %s completed in %dms", p.request.RequestID, processingTime))
}

func (p *documentQueryProcessor) emitErrorResponse(errorMsg string) {
	response := DocumentQueryResponse{
		RequestID:      p.request.RequestID,
		Success:        false,
		Error:          errorMsg,
		ProcessingTime: time.Since(p.processingStartTime).Milliseconds(),
	}
	p.eventHandler.emitDocumentQueryResponse(response)
}

// parseDocumentQueryRequest parses and validates document query request data
func (eh *EventHandler) parseDocumentQueryRequest(data interface{}) (DocumentQueryRequest, error) {
	requestData, ok := data.(map[string]interface{})
	if !ok {
		return DocumentQueryRequest{}, fmt.Errorf("invalid request data format")
	}
	jsonData, err := json.Marshal(requestData)
	if err != nil {
		eh.app.log.Info("Failed to marshal request data: " + err.Error())
		return DocumentQueryRequest{}, fmt.Errorf("failed to parse request data: %w", err)
	}
	var request DocumentQueryRequest
	if err := json.Unmarshal(jsonData, &request); err != nil {
		eh.app.log.Info("Failed to unmarshal request data: " + err.Error())
		return DocumentQueryRequest{}, fmt.Errorf("failed to unmarshal request: %w", err)
	}
	return request, nil
}

// emitDocumentQueryError emits a document query error response
func (eh *EventHandler) emitDocumentQueryError(requestID, errorMsg string) {
	response := DocumentQueryResponse{
		RequestID: requestID,
		Success:   false,
		Error:     errorMsg,
	}
	eh.emitDocumentQueryResponse(response)
}

// Event emission helper functions
func (eh *EventHandler) emitDocumentQueryProgress(progress DocumentQueryProgress) {
	eh.app.log.Info(fmt.Sprintf("Emitting progress: %+v", progress))
	runtime.EventsEmit(eh.app.ctx, "query-document-progress", progress)
}

func (eh *EventHandler) emitDocumentQueryResponse(response DocumentQueryResponse) {
	eh.app.log.Info(fmt.Sprintf("Emitting response: %+v", response))
	runtime.EventsEmit(eh.app.ctx, "query-document-response", response)
}

func (app *App) saveDocumentQuestionResponse(request DocumentQueryRequest, completionResult string, processingTime int64) {
	documentQuestionResponse := DocumentQuestionResponse{
		ID:          bson.NewObjectID(),
		DocumentID:  request.DocumentID,
		IndexName:   request.IndexID,
		EmbedPrompt: request.EmbeddingPrompt,
		DocPrompt:   request.DocumentPrompt,
		Response:    completionResult,
		Keywords:    request.SearchKeywords,
		PromptType:  request.PromptType,
		//EmbedArgs:   request.LlamaEmbedArgs,
		CliState:    LlamaCliArgs{},
		CreatedAt:   time.Now(),
		ProcessTime: processingTime,
	}
	if _, err := SaveDocumentQuestionResponse(app.appArgs, documentQuestionResponse); err != nil {
		app.log.Error("Failed to save document question response: " + err.Error())
	}
}
