package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
)

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
