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

// Constants for event names

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
	eh.app.log.Info(LogSettingUpInferenceListener)
	runtime.EventsOn(eh.app.ctx, EventInferenceCompletionRequest, func(optionalData ...interface{}) {
		eh.processInferenceCompletionEvent(optionalData...)
	})
	eh.app.log.Info(LogInferenceListenerComplete)
}

func (eh *EventHandler) processInferenceCompletionEvent(optionalData ...interface{}) {
	eh.app.log.Info(fmt.Sprintf("Received %s event with %d parameters", EventInferenceCompletionRequest, len(optionalData)))

	if len(optionalData) == 0 {
		eh.app.log.Info(fmt.Sprintf("No data received in %s event", EventInferenceCompletionRequest))
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
		return InferenceCompletionRequest{}, fmt.Errorf(ErrorInvalidRequestFormat)
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
	eh.emitProgressUpdate(request.RequestID, StatusStarting, MessageStartingInference, ProgressStart)
	eh.emitProgressUpdate(request.RequestID, StatusProcessing, MessageProcessingInference, ProgressProcessing)

	eh.app.log.Info(fmt.Sprintf("Calling inference completion with converted arguments for request: %s", request.RequestID))

	result := eh.generateInferenceCompletionWithProgress(request)
	response := eh.createCompletionResponse(request.RequestID, result, processingStartTime)

	eh.finalizeInferenceCompletion(request.RequestID, response, processingStartTime)
}

func (eh *EventHandler) finalizeInferenceCompletion(requestID string, response InferenceCompletionResponse, startTime time.Time) {
	processingTime := time.Since(startTime).Milliseconds()

	eh.emitProgressUpdate(requestID, StatusCompleted, MessageProcessingComplete, ProgressComplete)
	time.Sleep(ProgressUIDelay) // Brief delay to ensure progress reaches frontend

	eh.emitInferenceCompletionResponse(response)
	eh.app.log.Info(fmt.Sprintf("Inference completion request %s completed in %dms", requestID, processingTime))
}

func (eh *EventHandler) generateInferenceCompletionWithProgress(request InferenceCompletionRequest) string {
	eh.emitProgressUpdate(request.RequestID, StatusProcessing, MessageProcessingPrompt, ProgressPrompt)

	processedPrompt, err := eh.processPrompt(request)
	if err != nil {
		return ErrorPrefix + err.Error()
	}
	request.LlamaCliArgs.PromptText = processedPrompt

	eh.emitProgressUpdate(request.RequestID, StatusGenerating, MessageGeneratingCompletion, ProgressGenerating)

	completionResult, err := eh.executeCompletion(request)
	if err != nil {
		return eh.handleCompletionError(err)
	}

	eh.emitProgressUpdate(request.RequestID, StatusSaving, MessageSavingCompletion, ProgressSaving)

	if eh.app.isOperationCanceled() {
		return ErrorOperationCancelledByUser
	}

	eh.saveCompletionToDatabase(request.LlamaCliArgs, completionResult, request.PromptText)
	eh.emitProgressUpdate(request.RequestID, StatusFinalizing, MessageFinalizingResponse, ProgressFinalizing)

	return string(completionResult)
}

func (eh *EventHandler) processPrompt(request InferenceCompletionRequest) (string, error) {
	originalPromptText := request.PromptText
	if len(originalPromptText) == 0 {
		return originalPromptText, nil
	}

	processedPrompt, err := HandlePromptType(eh.app.log, request.PromptType, originalPromptText)
	if err != nil {
		eh.app.log.Error(LogFailedToHandlePromptType + err.Error())
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
		eh.app.log.Info(LogCompletionCancelledByUser)
		return ErrorOperationCancelledByUser
	}
	eh.app.log.Error(LogFailedToGenerateCompletion + err.Error())
	return ErrorPrefix + err.Error()
}

func (eh *EventHandler) saveCompletionToDatabase(llamaArgs LlamaCliArgs, output []byte, originalPrompt string) {
	if err := eh.app.saveQuestionResponse(llamaArgs, output, originalPrompt); err != nil {
		eh.app.log.Error(LogFailedToSaveCompletion + err.Error())
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
	runtime.EventsEmit(eh.app.ctx, EventInferenceCompletionProgress, progressData)
}

func (eh *EventHandler) emitInferenceCompletionResponse(response InferenceCompletionResponse) {
	eh.app.log.Info(fmt.Sprintf("Emitting inference response: %+v", response))
	runtime.EventsEmit(eh.app.ctx, EventInferenceCompletionResponse, response)
}

func (eh *EventHandler) createCompletionResponse(requestID, result string, processingStartTime time.Time) InferenceCompletionResponse {
	return InferenceCompletionResponse{
		RequestID:      requestID,
		Success:        true,
		Result:         result,
		ProcessingTime: time.Since(processingStartTime).Milliseconds(),
	}
}
