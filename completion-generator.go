package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"strings"
	"time"
)

// InferenceCompletionRequest represents the structure for inference completion requests
type InferenceCompletionRequest struct {
	LlamaCliArgs LlamaCliArgs `json:"llamaCliArgs"`
	PromptText   string       `json:"promptText"`
	PromptType   string       `json:"promptType"`
	RequestID    string       `json:"requestId,omitempty"`
}

// InferenceCompletionResponse represents the response structure
type InferenceCompletionResponse struct {
	RequestID      string `json:"requestId,omitempty"`
	Success        bool   `json:"success"`
	Result         string `json:"result"`
	Error          string `json:"error,omitempty"`
	ProcessingTime int64  `json:"processingTime"`
}

// InferenceCompletionProgress represents progress updates
type InferenceCompletionProgress struct {
	RequestID string `json:"requestId,omitempty"`
	Status    string `json:"status"`
	Message   string `json:"message"`
	Progress  int    `json:"progress"` // 0-100
}

// SetupEventInferenceListener sets up event listener for inference completion requests
func (a *App) SetupEventInferenceListener() {
	a.log.Info("Setting up inference event listener...")

	// Listen for inference completion requests
	runtime.EventsOn(a.ctx, "inference-completion-request", func(optionalData ...interface{}) {
		a.log.Info("Received inference-completion-request event with %d parameters\n" + string(rune(len(optionalData))))

		if len(optionalData) > 0 {
			// Parse the request data
			requestData, ok := optionalData[0].(map[string]interface{})
			if !ok {
				a.emitInferenceCompletionResponse(InferenceCompletionResponse{
					RequestID: "",
					Success:   false,
					Error:     "Invalid request data format",
				})
				return
			}

			// Convert to JSON and then to struct for proper type handling
			jsonData, err := json.Marshal(requestData)
			if err != nil {
				a.log.Info("Failed to marshal request data: %v\n" + err.Error())
				a.emitInferenceCompletionResponse(InferenceCompletionResponse{
					RequestID: fmt.Sprintf("%v", requestData["requestId"]),
					Success:   false,
					Error:     "Failed to parse request data: " + err.Error(),
				})
				return
			}

			var request InferenceCompletionRequest
			if err := json.Unmarshal(jsonData, &request); err != nil {
				a.log.Info("Failed to unmarshal request data: %v\n" + err.Error())
				a.emitInferenceCompletionResponse(InferenceCompletionResponse{
					RequestID: fmt.Sprintf("%v", requestData["requestId"]),
					Success:   false,
					Error:     "Failed to unmarshal request: " + err.Error(),
				})
				return
			}

			a.log.Info(fmt.Sprintf("Parsed inference request successfully: %+v\n", request))

			// Execute the inference completion method asynchronously
			go a.handleInferenceCompletionRequest(request)
		} else {
			a.log.Info("No data received in inference-completion-request event")
		}
	})

	a.log.Info("Inference event listener setup complete")
}

// GenerateCompletion generates a completion based on the provided arguments and prompt type
func (a *App) GenerateCompletion(llamaCliArgs LlamaCliArgs, promptType string) string {
	// Reset context for this operation
	a.resetContext()

	// Check if the operation was canceled before starting
	if a.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// Process prompt if provided
	originalPromptText := llamaCliArgs.PromptText
	if len(originalPromptText) > 0 {
		processedPrompt, err := HandlePromptType(a.log, promptType, originalPromptText)
		if err != nil {
			a.log.Error("Failed to handle prompt type: " + err.Error())
			return err.Error()
		}
		llamaCliArgs.PromptText = processedPrompt
	}

	// Check for cancellation before generating completion
	if a.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// Build arguments and execute completion
	completionArgs := LlamaCliStructToArgs(llamaCliArgs)

	completionOutput, err := GenerateSingleCompletionWithCancel(a.ctx, *a.appArgs, completionArgs)
	if err != nil {
		// Check if the error is due to context cancellation
		if errors.Is(a.ctx.Err(), context.Canceled) {
			a.log.Info("Completion generation was cancelled by user")
			return "Operation cancelled by user"
		}
		a.log.Error("Failed to generate completion: " + err.Error())
		return err.Error()
	}

	// Check for cancellation before saving to database
	if a.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// Save the completion in the database
	if err := a.saveQuestionResponse(llamaCliArgs, completionOutput, originalPromptText); err != nil {
		a.log.Error("Failed to save completion: " + err.Error())
	}

	return string(completionOutput)
}

// isOperationCanceled checks if the current operation was canceled
func (a *App) isOperationCanceled() bool {
	select {
	case <-a.ctx.Done():
		a.log.Info("Operation was cancelled by user")
		return true
	default:
		return false
	}
}

// saveQuestionResponse saves the generated completion to the database
func (a *App) saveQuestionResponse(llamaCliArgs LlamaCliArgs, completionOutput []byte, originalPromptText string) error {
	jsonArgs, err := json.Marshal(llamaCliArgs)
	if err != nil {
		return fmt.Errorf("failed to convert arguments to JSON: %w", err)
	}

	// Convert JSON args to string and remove brackets
	jsonArgsStr := a.removeJSONBrackets(string(jsonArgs))

	return SaveQuestionResponse(a.appArgs, string(completionOutput), jsonArgsStr, originalPromptText)
}

// removeJSONBrackets removes the first and last characters (brackets) from JSON string
func (a *App) removeJSONBrackets(jsonStr string) string {
	if len(jsonStr) > 2 {
		return jsonStr[1 : len(jsonStr)-1]
	}
	return jsonStr
}

// handleInferenceCompletionRequest processes the inference completion request asynchronously
func (a *App) handleInferenceCompletionRequest(request InferenceCompletionRequest) {
	processingStartTime := time.Now()

	// Emit initial progress
	a.emitInferenceCompletionProgress(InferenceCompletionProgress{
		RequestID: request.RequestID,
		Status:    "starting",
		Message:   "Initializing inference completion...",
		Progress:  0,
	})

	// Reset operation context for this operation
	a.resetContext()

	select {
	case <-a.operationCtx.Done():
		a.log.Info("Operation was cancelled before starting")
		a.emitInferenceCompletionResponse(InferenceCompletionResponse{
			RequestID: request.RequestID,
			Success:   false,
			Error:     "Operation cancelled by user",
		})
		return
	default:
		result := a.generateInferenceCompletionWithProgress(request, processingStartTime)

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
		a.emitInferenceCompletionResponse(response)
	}
}

// generateInferenceCompletionWithProgress generates completion with progress updates
func (a *App) generateInferenceCompletionWithProgress(request InferenceCompletionRequest, processingStartTime time.Time) string {
	// Emit progress: processing prompt
	a.emitInferenceCompletionProgress(InferenceCompletionProgress{
		RequestID: request.RequestID,
		Status:    "processing",
		Message:   "Processing prompt...",
		Progress:  20,
	})

	// Check if the operation was canceled
	if a.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// Process prompt if provided
	originalPromptText := request.LlamaCliArgs.PromptText
	if len(originalPromptText) > 0 {
		processedPrompt, err := HandlePromptType(a.log, request.PromptType, originalPromptText)
		if err != nil {
			a.log.Error("Failed to handle prompt type: " + err.Error())
			return "Error: " + err.Error()
		}
		request.LlamaCliArgs.PromptText = processedPrompt
	}

	// Emit progress: generating completion
	a.emitInferenceCompletionProgress(InferenceCompletionProgress{
		RequestID: request.RequestID,
		Status:    "generating",
		Message:   "Generating completion...",
		Progress:  50,
	})

	// Check for cancellation before generating completion
	if a.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// Build arguments and execute completion
	completionArgs := LlamaCliStructToArgs(request.LlamaCliArgs)

	completionOutput, err := GenerateSingleCompletionWithCancel(a.ctx, *a.appArgs, completionArgs)
	if err != nil {
		// Check if the error is due to context cancellation
		if errors.Is(a.ctx.Err(), context.Canceled) {
			a.log.Info("Completion generation was cancelled by user")
			return "Operation cancelled by user"
		}
		a.log.Error("Failed to generate completion: " + err.Error())
		return "Error: " + err.Error()
	}

	// Emit progress: saving to database
	a.emitInferenceCompletionProgress(InferenceCompletionProgress{
		RequestID: request.RequestID,
		Status:    "saving",
		Message:   "Saving completion...",
		Progress:  80,
	})

	// Check for cancellation before saving to database
	if a.isOperationCanceled() {
		return "Operation cancelled by user"
	}

	// Save the completion in the database
	if err := a.saveQuestionResponse(request.LlamaCliArgs, completionOutput, originalPromptText); err != nil {
		a.log.Error("Failed to save completion: " + err.Error())
	}

	// Emit final progress
	a.emitInferenceCompletionProgress(InferenceCompletionProgress{
		RequestID: request.RequestID,
		Status:    "completed",
		Message:   "Completion generated successfully",
		Progress:  100,
	})

	return string(completionOutput)
}

// Helper functions for emitting events
func (a *App) emitInferenceCompletionProgress(progress InferenceCompletionProgress) {
	a.log.Info(fmt.Sprintf("Emitting inference progress: %+v", progress))
	runtime.EventsEmit(a.ctx, "inference-completion-progress", progress)
}

func (a *App) emitInferenceCompletionResponse(response InferenceCompletionResponse) {
	a.log.Info(fmt.Sprintf("Emitting inference response: %+v", response))
	runtime.EventsEmit(a.ctx, "inference-completion-response", response)
}
