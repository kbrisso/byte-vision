package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// InferenceEventHandler delegates inference event setup to the core EventHandler
type InferenceEventHandler struct {
	core *EventHandler
}

func NewInferenceEventHandler(core *EventHandler) *InferenceEventHandler {
	return &InferenceEventHandler{core: core}
}

func (h *InferenceEventHandler) SetupEventListeners() {
	if h == nil || h.core == nil {
		return
	}
	h.core.setupInferenceCompletionEventListener()
}

func (eh *EventHandler) setupInferenceCompletionEventListener() {
	eh.app.log.Info("Setting up inference event listener...")

	runtime.EventsOn(eh.app.ctx, "inference-completion-request", func(optionalData ...interface{}) {
		eh.processInferenceCompletionEvent(optionalData...)
	})

	eh.app.log.Info("Inference event listener setup complete")
}

func (eh *EventHandler) processInferenceCompletionEvent(optionalData ...interface{}) {
	const eventName = "inference-completion-request"
	eh.app.log.Info(fmt.Sprintf("Received %s event with %d parameters", eventName, len(optionalData)))

	if len(optionalData) == 0 {
		eh.app.log.Info(fmt.Sprintf("No data received in %s event", eventName))
		return
	}

	request, err := eh.parseInferenceRequest(optionalData[0])
	if err != nil {
		eh.emitInferenceCompletionResponse(InferenceCompletionResponse{
			RequestID: eh.extractRequestID(optionalData[0]),
			Success:   false,
			Error:     err.Error(),
		})
		return
	}

	eh.app.log.Info(fmt.Sprintf("Parsed inference request successfully: %+v", request))
	go eh.safeHandleInferenceCompletionRequest(request)
}

func (eh *EventHandler) parseInferenceRequest(data interface{}) (InferenceCompletionRequest, error) {
	requestData, ok := data.(map[string]interface{})
	if !ok {
		return InferenceCompletionRequest{}, fmt.Errorf("invalid request data format")
	}

	jsonData, err := json.Marshal(requestData)
	if err != nil {
		eh.app.log.Info("Failed to marshal request data: " + err.Error())
		return InferenceCompletionRequest{}, fmt.Errorf("failed to parse request data: %w", err)
	}

	var request InferenceCompletionRequest
	if err := json.Unmarshal(jsonData, &request); err != nil {
		eh.app.log.Info("Failed to unmarshal request data: " + err.Error())
		return InferenceCompletionRequest{}, fmt.Errorf("failed to unmarshal request: %w", err)
	}

	return request, nil
}

func (eh *EventHandler) extractRequestID(data interface{}) string {
	if requestData, ok := data.(map[string]interface{}); ok {
		return fmt.Sprintf("%v", requestData["requestId"])
	}
	return ""
}

func (eh *EventHandler) safeHandleInferenceCompletionRequest(request InferenceCompletionRequest) {
	if eh == nil {
		_, err := fmt.Fprintf(os.Stderr, "EventHandler is nil in safeHandleInferenceCompletionRequest\n")
		if err != nil {
			return
		}
		return
	}
	eh.handleInferenceCompletionRequest(request)
}

func (eh *EventHandler) handleInferenceCompletionRequest(request InferenceCompletionRequest) {
	if eh.app == nil || eh.app.log == nil {
		return
	}

	processingStartTime := time.Now()
	eh.emitProgressUpdate(request.RequestID, "starting", "Starting inference completion...", 5)
	eh.emitProgressUpdate(request.RequestID, "processing", "Processing inference completion...", 10)

	eh.app.log.Info(fmt.Sprintf("Calling inference completion with converted arguments for request: %s", request.RequestID))

	result := eh.generateInferenceCompletionWithProgress(request)
	response := eh.createCompletionResponse(request.RequestID, result, processingStartTime)

	eh.finalizeInferenceCompletion(request.RequestID, response, processingStartTime)
}

func (eh *EventHandler) finalizeInferenceCompletion(requestID string, response InferenceCompletionResponse, startTime time.Time) {
	processingTime := time.Since(startTime).Milliseconds()

	eh.emitProgressUpdate(requestID, "completed", "Processing complete", 100)
	time.Sleep(25 * time.Millisecond) // Brief delay to ensure progress reaches frontend

	eh.emitInferenceCompletionResponse(response)
	eh.app.log.Info(fmt.Sprintf("Inference completion request %s completed in %dms", requestID, processingTime))
}

func (eh *EventHandler) generateInferenceCompletionWithProgress(request InferenceCompletionRequest) string {
	eh.emitProgressUpdate(request.RequestID, "processing", "Processing prompt...", 20)

	processedPrompt, err := eh.processPromptIfProvided(request)
	if err != nil {
		return "Error: " + err.Error()
	}
	request.LlamaCliArgs.PromptText = processedPrompt

	eh.emitProgressUpdate(request.RequestID, "generating", "Generating completion...", 50)

	completionResult, err := eh.executeCompletion(request)
	if err != nil {
		return eh.handleCompletionError(err)
	}

	eh.emitProgressUpdate(request.RequestID, "saving", "Saving completion...", 80)

	if eh.app.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	eh.saveCompletionToDatabase(request.LlamaCliArgs, completionResult, request.LlamaCliArgs.PromptText)
	eh.emitProgressUpdate(request.RequestID, "finalizing", "Finalizing response...", 95)

	return string(completionResult)
}

func (eh *EventHandler) processPromptIfProvided(request InferenceCompletionRequest) (string, error) {
	originalPromptText := request.LlamaCliArgs.PromptText
	if len(originalPromptText) == 0 {
		return originalPromptText, nil
	}

	processedPrompt, err := HandlePromptType(eh.app.log, request.PromptType, originalPromptText)
	if err != nil {
		eh.app.log.Error("Failed to handle prompt type: " + err.Error())
		return "", err
	}

	uniqueFileName := generateUniqueFileName("prompt")
	_ = SaveAsText(eh.app.appArgs.PromptTempPath, uniqueFileName, processedPrompt, eh.app.log)

	return processedPrompt, nil
}

func (eh *EventHandler) executeCompletion(request InferenceCompletionRequest) ([]byte, error) {
	completionArgs := LlamaCliStructToArgs(request.LlamaCliArgs)
	return GenerateSingleCompletionWithCancel(eh.app.operationCtx, *eh.app.appArgs, completionArgs)
}

func (eh *EventHandler) handleCompletionError(err error) string {
	if errors.Is(eh.app.operationCtx.Err(), context.Canceled) {
		eh.app.log.Info("Completion generation was cancelled by user")
		return "Operation cancelled by user"
	}
	eh.app.log.Error("Failed to generate completion: " + err.Error())
	return "Error: " + err.Error()
}

func (eh *EventHandler) saveCompletionToDatabase(llamaArgs LlamaCliArgs, output []byte, originalPrompt string) {
	if err := eh.app.saveQuestionResponse(llamaArgs, output, originalPrompt); err != nil {
		eh.app.log.Error("Failed to save completion: " + err.Error())
	}
}

func (eh *EventHandler) emitProgressUpdate(requestID, status, message string, progress int) {
	progressData := InferenceCompletionProgress{
		RequestID: requestID,
		Status:    status,
		Message:   message,
		Progress:  progress,
	}
	eh.app.log.Info(fmt.Sprintf("Emitting inference progress: %+v", progressData))
	runtime.EventsEmit(eh.app.ctx, "inference-completion-progress", progressData)
}

func (eh *EventHandler) emitInferenceCompletionResponse(response InferenceCompletionResponse) {
	eh.app.log.Info(fmt.Sprintf("Emitting inference response: %+v", response))
	runtime.EventsEmit(eh.app.ctx, "inference-completion-response", response)
}

func (eh *EventHandler) createCompletionResponse(requestID, result string, processingStartTime time.Time) InferenceCompletionResponse {
	return InferenceCompletionResponse{
		RequestID:      requestID,
		Success:        true,
		Result:         result,
		ProcessingTime: time.Since(processingStartTime).Milliseconds(),
	}
}
