package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// EventHandler manages all application event listeners
type EventHandler struct {
	app *App
}

// NewEventHandler creates a new event handler instance
func NewEventHandler(app *App) *EventHandler {
	return &EventHandler{app: app}
}

// SetupAllEventListeners sets up all event listeners for the application
func (eh *EventHandler) SetupAllEventListeners() {
	eh.app.log.Info("Setting up event listeners...")

	eh.setupDocumentQueryEventListener()
	eh.setupDocumentAddEventListener()
	eh.setupDocumentProgressEventListeners()
	eh.setupInferenceCompletionEventListener()

	eh.app.log.Info("Event listeners setup complete")
}

// SetupEventInferenceListener sets up event listener for inference completion requests
func (eh *EventHandler) setupInferenceCompletionEventListener() {
	eh.app.log.Info("Setting up inference event listener...")

	// Listen for inference completion requests
	runtime.EventsOn(eh.app.ctx, "inference-completion-request", func(optionalData ...interface{}) {
		eh.app.log.Info("Received inference-completion-request event with %d parameters\n" + string(rune(len(optionalData))))

		if len(optionalData) > 0 {
			// Parse the request data
			requestData, ok := optionalData[0].(map[string]interface{})
			if !ok {
				eh.emitInferenceCompletionResponse(InferenceCompletionResponse{
					RequestID: "",
					Success:   false,
					Error:     "Invalid request data format",
				})
				return
			}

			// Convert to JSON and then to struct for proper type handling
			jsonData, err := json.Marshal(requestData)
			if err != nil {
				eh.app.log.Info("Failed to marshal request data: %v\n" + err.Error())
				eh.emitInferenceCompletionResponse(InferenceCompletionResponse{
					RequestID: fmt.Sprintf("%v", requestData["requestId"]),
					Success:   false,
					Error:     "Failed to parse request data: " + err.Error(),
				})
				return
			}

			var request InferenceCompletionRequest
			if err := json.Unmarshal(jsonData, &request); err != nil {
				eh.app.log.Info("Failed to unmarshal request data: %v\n" + err.Error())
				eh.emitInferenceCompletionResponse(InferenceCompletionResponse{
					RequestID: fmt.Sprintf("%v", requestData["requestId"]),
					Success:   false,
					Error:     "Failed to unmarshal request: " + err.Error(),
				})
				return
			}

			eh.app.log.Info(fmt.Sprintf("Parsed inference request successfully: %+v\n", request))

			// Execute the inference completion method asynchronously
			go eh.handleInferenceCompletionRequest(request)
		} else {
			eh.app.log.Info("No data received in inference-completion-request event")
		}
	})

	eh.app.log.Info("Inference event listener setup complete")
}

// handleInferenceCompletionRequest processes the inference completion request asynchronously
func (eh *EventHandler) handleInferenceCompletionRequest(request InferenceCompletionRequest) {
	processingStartTime := time.Now()

	// Emit initial progress
	eh.emitInferenceCompletionProgress(InferenceCompletionProgress{
		RequestID: request.RequestID,
		Status:    "starting",
		Message:   "Initializing inference completion...",
		Progress:  0,
	})

	// Reset operation context for this operation
	eh.app.resetContext()

	select {
	case <-eh.app.operationCtx.Done():
		eh.app.log.Info("Operation was cancelled before starting")
		eh.emitInferenceCompletionResponse(InferenceCompletionResponse{
			RequestID: request.RequestID,
			Success:   false,
			Error:     "Operation cancelled by user",
		})
		return
	default:
		result := eh.generateInferenceCompletionWithProgress(request)

		// Determine success based on result
		success := !strings.Contains(result, "Error:") && !strings.Contains(result, "cancelled")

		response := InferenceCompletionResponse{
			RequestID:      request.RequestID,
			Success:        success,
			Result:         result,
			ProcessingTime: time.Since(processingStartTime).Milliseconds(),
		}

		if !success {
			response.Error = result
		}

		// Emit the final response
		eh.emitInferenceCompletionResponse(response)
	}
}

// generateInferenceCompletionWithProgress generates completion with progress updates
func (eh *EventHandler) generateInferenceCompletionWithProgress(request InferenceCompletionRequest) string {
	// Emit progress: processing prompt
	eh.emitInferenceCompletionProgress(InferenceCompletionProgress{
		RequestID: request.RequestID,
		Status:    "processing",
		Message:   "Processing prompt...",
		Progress:  20,
	})

	// Check if the operation was canceled
	if eh.app.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// Process prompt if provided
	originalPromptText := request.LlamaCliArgs.PromptText
	if len(originalPromptText) > 0 {
		processedPrompt, err := HandlePromptType(eh.app.log, request.PromptType, originalPromptText)
		if err != nil {
			eh.app.log.Error("Failed to handle prompt type: " + err.Error())
			return "Error: " + err.Error()
		}
		request.LlamaCliArgs.PromptText = processedPrompt
		uniqueFileName := generateUniqueFileName("prompt")
		_ = SaveAsText(eh.app.appArgs.PromptTempPath, uniqueFileName, processedPrompt, eh.app.log)
	}

	// Emit progress: generating completion
	eh.emitInferenceCompletionProgress(InferenceCompletionProgress{
		RequestID: request.RequestID,
		Status:    "generating",
		Message:   "Generating completion...",
		Progress:  50,
	})

	// Check for cancellation before generating completion
	if eh.app.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// Build arguments and execute completion
	completionArgs := LlamaCliStructToArgs(request.LlamaCliArgs)

	completionOutput, err := GenerateSingleCompletionWithCancel(eh.app.ctx, *eh.app.appArgs, completionArgs)

	if err != nil {
		// Check if the error is due to context cancellation
		if errors.Is(eh.app.operationCtx.Err(), context.Canceled) {
			eh.app.log.Info("Completion generation was cancelled by user")
			return "Operation cancelled by user"
		}
		eh.app.log.Error("Failed to generate completion: " + err.Error())
		return "Error: " + err.Error()
	}

	// Emit progress: saving to database
	eh.emitInferenceCompletionProgress(InferenceCompletionProgress{
		RequestID: request.RequestID,
		Status:    "saving",
		Message:   "Saving completion...",
		Progress:  80,
	})

	// Check for cancellation before saving to database
	if eh.app.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// Save the completion in the database
	if err := eh.app.saveQuestionResponse(request.LlamaCliArgs, completionOutput, originalPromptText); err != nil {
		eh.app.log.Error("Failed to save completion: " + err.Error())
	}

	// Emit final progress
	eh.emitInferenceCompletionProgress(InferenceCompletionProgress{
		RequestID: request.RequestID,
		Status:    "completed",
		Message:   "Completion generated successfully",
		Progress:  100,
	})

	return string(completionOutput)
}

// Helper functions for emitting events
func (eh *EventHandler) emitInferenceCompletionProgress(progress InferenceCompletionProgress) {
	eh.app.log.Info(fmt.Sprintf("Emitting inference progress: %+v", progress))
	runtime.EventsEmit(eh.app.ctx, "inference-completion-progress", progress)
}

func (eh *EventHandler) emitInferenceCompletionResponse(response InferenceCompletionResponse) {
	eh.app.log.Info(fmt.Sprintf("Emitting inference response: %+v", response))
	runtime.EventsEmit(eh.app.ctx, "inference-completion-response", response)
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

		// Execute the query asynchronously
		go eh.app.handleQueryDocumentRequest(request)
	})
}

// setupDocumentAddEventListener sets up the document add request listener
func (eh *EventHandler) setupDocumentAddEventListener() {
	runtime.EventsOn(eh.app.ctx, "add-document-request", func(optionalData ...interface{}) {
		eh.app.log.Info(fmt.Sprintf("Received add-document-request event with %d parameters", len(optionalData)))

		if len(optionalData) == 0 {
			eh.app.log.Info("No data received in add-document-request event")
			return
		}

		request, err := eh.parseDocumentAddRequest(optionalData[0])
		if err != nil {
			eh.emitDocumentAddError("", err.Error())
			return
		}

		eh.app.log.Info(fmt.Sprintf("Parsed add request successfully: %+v", request))

		// Execute the add document request asynchronously
		go eh.app.handleAddDocumentRequest(request)
	})
}

// setupDocumentProgressEventListeners sets up progress-related event listeners
func (eh *EventHandler) setupDocumentProgressEventListeners() {
	// Listen for add-document-progress events (if you need to handle progress from frontend)
	runtime.EventsOn(eh.app.ctx, "add-document-progress", func(optionalData ...interface{}) {
		eh.app.log.Info("Received add-document-progress event")
		// This is typically used for emitting progress, not listening
		// Add custom logic here if needed
	})

	// Listen for add-document-response events (if you need to handle responses from frontend)
	runtime.EventsOn(eh.app.ctx, "add-document-response", func(optionalData ...interface{}) {
		eh.app.log.Info("Received add-document-response event")
		// This is typically used for emitting responses, not listening
		// Add custom logic here if needed
	})
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

// parseDocumentAddRequest parses and validates document add request data
func (eh *EventHandler) parseDocumentAddRequest(data interface{}) (DocumentAddRequest, error) {
	requestData, ok := data.(map[string]interface{})
	if !ok {
		return DocumentAddRequest{}, fmt.Errorf("invalid request data format")
	}

	jsonData, err := json.Marshal(requestData)
	if err != nil {
		eh.app.log.Info("Failed to marshal add request data: " + err.Error())
		return DocumentAddRequest{}, fmt.Errorf("failed to parse request data: %w", err)
	}

	var request DocumentAddRequest
	if err := json.Unmarshal(jsonData, &request); err != nil {
		eh.app.log.Info("Failed to unmarshal add request data: " + err.Error())
		return DocumentAddRequest{}, fmt.Errorf("failed to unmarshal request: %w", err)
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

// emitDocumentAddError emits a document add error response
func (eh *EventHandler) emitDocumentAddError(requestID, errorMsg string) {
	response := DocumentAddResponse{
		RequestID: requestID,
		Success:   false,
		Error:     errorMsg,
	}
	eh.emitDocumentAddResponse(response)
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

func (eh *EventHandler) emitDocumentAddResponse(response DocumentAddResponse) {
	eh.app.log.Info(fmt.Sprintf("Emitting add document response: %+v", response))
	runtime.EventsEmit(eh.app.ctx, "add-document-response", response)
}

func (eh *EventHandler) emitDocumentAddProgress(progress map[string]interface{}) {
	eh.app.log.Info(fmt.Sprintf("Emitting add document progress: %+v", progress))
	runtime.EventsEmit(eh.app.ctx, "add-document-progress", progress)
}
