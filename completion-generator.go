package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
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

// generateUniqueFileName creates a unique filename with timestamp and random suffix
func generateUniqueFileName(baseName string) string {
	timestamp := time.Now().Format("20060102_150405")
	randomSuffix := rand.Intn(10000)
	return fmt.Sprintf("%s_%s_%04d.txt", baseName, timestamp, randomSuffix)
}
