package main

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"os/exec"
	"runtime"
	"sync"
	"syscall"
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
func (app *App) isOperationCanceled() bool {
	if app.operationCtx == nil {
		app.log.Error("operationCtx is nil - this indicates improper initialization")
		return false // or return true if you want to treat nil context as cancelled
	}

	select {
	case <-app.operationCtx.Done():
		app.log.Info("Operation was cancelled by user")
		return true
	default:
		return false
	}
}

// saveQuestionResponse saves the generated completion to the database
func (app *App) saveQuestionResponse(llamaCliArgs LlamaCliArgs, completionOutput []byte, originalPromptText string) error {
	jsonArgs, err := json.Marshal(llamaCliArgs)
	if err != nil {
		return fmt.Errorf("failed to convert arguments to JSON: %w", err)
	}

	// Convert JSON args to string and remove brackets
	jsonArgsStr := app.removeJSONBrackets(string(jsonArgs))

	return SaveQuestionResponse(app.appArgs, string(completionOutput), jsonArgsStr, originalPromptText)
}

// removeJSONBrackets removes the first and last characters (brackets) from JSON string
func (app *App) removeJSONBrackets(jsonStr string) string {
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

var (
	llamaCliMutex sync.Mutex
)

func GenerateSingleCompletionWithCancel(ctx context.Context, appArgs DefaultAppArgs, args []string) ([]byte, error) {
	// Lock to prevent concurrent CLI calls
	if ctx == nil {
		ctx = context.Background()
	}

	llamaCliMutex.Lock()
	defer llamaCliMutex.Unlock()

	// Create the command with context
	cmd := exec.CommandContext(ctx, appArgs.LLamaCliPath, args...)

	// Set up process attributes for proper termination
	if runtime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP,
		}
	} else {
		// On Unix-like systems, use process group settings
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}

	// Create a channel to capture the result
	result := make(chan struct {
		output []byte
		err    error
	})

	// Run the command in a goroutine
	go func() {
		defer close(result)
		out, err := cmd.Output()

		select {
		case result <- struct {
			output []byte
			err    error
		}{output: out, err: err}:
		case <-ctx.Done():
			// Context canceled, don't send result
		}
	}()

	select {
	case res := <-result:
		// Command completed normally
		return res.output, res.err
	case <-ctx.Done():
		// Context was canceled - ensure process is terminated
		if cmd.Process != nil {
			// Use the standard Process.Kill() method which works cross-platform
			if err := cmd.Process.Kill(); err != nil {
				// If Kill() fails, try using Signal on Unix
				if runtime.GOOS != "windows" {
					cmd.Process.Signal(os.Kill)
				}
			}
		}

		// Wait for the process to actually terminate
		if cmd.ProcessState == nil {
			go func() {
				err := cmd.Wait()
				if err != nil {
					return
				} // Clean up the process
			}()
		}

		return nil, ctx.Err()
	}
}
