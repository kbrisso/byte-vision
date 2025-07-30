package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"os"
)

type App struct {
	ctx            context.Context // Original Wails context
	wailsCtx       context.Context // Store the original Wails context
	cancelFunc     context.CancelFunc
	operationCtx   context.Context // Separate context for operations
	log            logger.Logger
	llamaCliArgs   *LlamaCliArgs
	llamaEmbedArgs *LlamaEmbedArgs
	appArgs        *DefaultAppArgs
	database       *mongo.Database
}

// CancelProcess Update the method
func (a *App) CancelProcess() string {
	if a.cancelFunc != nil {
		a.log.Info("Canceling current process...")
		a.cancelFunc() // Actually cancel the context
		return "Process canceled successfully"
	}
	return "No active process to cancel"
}

// Startup Update to store both contexts
func (a *App) Startup(ctx context.Context) {
	a.log.Info("App startup called")
	a.ctx = ctx

	a.log.Info("Setting up event listeners...")
	a.SetupEventListeners()
	a.SetupEventInferenceListener()
	a.log.Info("Startup complete")
}

// Reset context for operations only
func (a *App) resetContext() {
	// Create a cancelable context from the original Wails context
	cancelableCtx, cancel := context.WithCancel(a.wailsCtx)
	a.operationCtx = cancelableCtx
	a.cancelFunc = cancel
}

// NewApp creates a new App application struct
func NewApp(logger logger.Logger, llamaCliArgs *LlamaCliArgs, llamaEmbedArgs *LlamaEmbedArgs, appArgs *DefaultAppArgs, database *mongo.Database) *App {
	return &App{
		log:            logger,
		llamaCliArgs:   llamaCliArgs,
		llamaEmbedArgs: llamaEmbedArgs,
		appArgs:        appArgs,
		database:       database,
	}
}

func (a *App) Shutdown(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) Domready(ctx context.Context) {
	a.wailsCtx = ctx
}

func (a *App) BeforeClose(ctx context.Context) (prevent bool) {
	dialog, err := runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
		Type:    runtime.QuestionDialog,
		Title:   "Quit?",
		Message: "Are you sure you want to quit?",
	})

	if err != nil {
		return false
	}
	return dialog != "Yes"
}

func (a *App) GetInferenceHistory() []map[string]interface{} {
	data, err := GetInferenceHistory(a.appArgs)
	if err != nil {
		a.log.Error(err.Error())
		return nil
	}
	result := make([]map[string]interface{}, len(data))
	for i, item := range data {
		result[i] = map[string]interface{}{
			"id":        item.ID,
			"response":  item.Response,
			"args":      item.Args,
			"question":  item.Question,
			"createdAt": item.CreatedAt,
		}
	}
	return result

}
func (a *App) GetPDFAsBase64(filePath string) (string, error) {
	// Validate a file path and check if a file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return "", fmt.Errorf("file does not exist: %s", filePath)
	}

	// Read the PDF file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %v", err)
	}

	// Encode to base64
	return base64.StdEncoding.EncodeToString(data), nil
}

// ChooseFile opens a directory selection dialog
func (a *App) ChooseFile() string {
	opts := runtime.OpenDialogOptions{
		DefaultDirectory: a.appArgs.DocumentPath,
		Title:            "Select a file",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "PDF (*.pdf)",
				Pattern:     "*.pdf",
			}, {
				DisplayName: "Text (*.txt;*.text)",
				Pattern:     "*.txt;*.text",
			},
			{
				DisplayName: "CSV (*.csv;*.txt)",
				Pattern:     "*.csv;*.txt",
			},
		},
		ShowHiddenFiles:            false,
		CanCreateDirectories:       false,
		ResolvesAliases:            false,
		TreatPackagesAsDirectories: false,
	}

	ret, err := runtime.OpenFileDialog(a.ctx, opts)
	if err != nil {
		a.log.Error(err.Error())
		return err.Error()
	}
	return ret
}
func (a *App) ChooseImageFile() string {
	opts := runtime.OpenDialogOptions{
		DefaultDirectory: a.appArgs.DocumentPath,
		Title:            "Select an image file",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Image Files (*.png;*.jpg;*.jpeg;*.tiff;*.bmp)",
				Pattern:     "*.png;*.jpg;*.jpeg;*.tiff;*.bmp",
			},
			{
				DisplayName: "PNG (*.png)",
				Pattern:     "*.png",
			},
			{
				DisplayName: "JPEG (*.jpg;*.jpeg)",
				Pattern:     "*.jpg;*.jpeg",
			},
		},
		ShowHiddenFiles:            false,
		CanCreateDirectories:       false,
		ResolvesAliases:            false,
		TreatPackagesAsDirectories: false,
	}

	ret, err := runtime.OpenFileDialog(a.ctx, opts)
	if err != nil {
		a.log.Error(err.Error())
		return err.Error()
	}
	return ret
}
