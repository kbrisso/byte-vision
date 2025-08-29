package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"

	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"go.mongodb.org/mongo-driver/v2/mongo"
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
func (app *App) CancelProcess() string {
	if app.cancelFunc != nil {
		app.log.Info("Canceling current process...")
		app.cancelFunc() // Actually cancel the context
		return "Process canceled successfully"
	}
	return "No active process to cancel"
}

// Startup Update to store both contexts
func (app *App) Startup(ctx context.Context) {
	app.log.Info("App startup called")
	app.ctx = ctx
	app.log.Info("Setting up event listeners...")
	app.SetupEventListeners()
	app.log.Info("Startup complete")
}

// Reset context for operations only
func (app *App) resetContext() {
	// Create a cancelable context from the original Wails context
	cancelableCtx, cancel := context.WithCancel(app.wailsCtx)
	app.operationCtx = cancelableCtx
	app.cancelFunc = cancel
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

func (app *App) Shutdown(ctx context.Context) {
	app.ctx = ctx
}

func (app *App) Domready(ctx context.Context) {
	app.wailsCtx = ctx
}

func (app *App) BeforeClose(ctx context.Context) (prevent bool) {
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

func (app *App) GetInferenceHistory() []map[string]interface{} {
	data, err := GetInferenceHistory(app.appArgs)
	if err != nil {
		app.log.Error(err.Error())
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
func (app *App) GetPDFAsBase64(filePath string) (string, error) {
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
func (app *App) ChooseFile() string {
	opts := runtime.OpenDialogOptions{
		DefaultDirectory: app.appArgs.DocumentPath,
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

	ret, err := runtime.OpenFileDialog(app.ctx, opts)
	if err != nil {
		app.log.Error(err.Error())
		return err.Error()
	}
	return ret
}
func (app *App) ChooseFileOrFolderWithToggle() string {
	for {
		// Show file dialog first
		opts := runtime.OpenDialogOptions{
			DefaultDirectory: app.appArgs.DocumentPath,
			Title:            "Select a file (or cancel to choose folder)",
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

		ret, err := runtime.OpenFileDialog(app.ctx, opts)
		if err != nil {
			app.log.Error(err.Error())
			return err.Error()
		}

		// If user canceled file dialog, ask if they want to select a folder instead
		if ret == "" {
			dialog, err := runtime.MessageDialog(app.ctx, runtime.MessageDialogOptions{
				Type:    runtime.QuestionDialog,
				Title:   "Select Folder Instead?",
				Message: "No file selected. Would you like to select a folder instead?",
				Buttons: []string{"Yes", "No"},
			})

			if err != nil || dialog != "Yes" {
				return "" // User chose not to select folder or error occurred
			}

			// Open folder dialog
			return app.ChooseFolder()
		}

		return ret // Return selected file
	}
}
func (app *App) ChooseFolder() string {
	opts := runtime.OpenDialogOptions{
		DefaultDirectory:           app.appArgs.DocumentPath,
		Title:                      "Select a folder",
		ShowHiddenFiles:            false,
		CanCreateDirectories:       true,
		ResolvesAliases:            false,
		TreatPackagesAsDirectories: false,
	}

	ret, err := runtime.OpenDirectoryDialog(app.ctx, opts)
	if err != nil {
		app.log.Error(err.Error())
		return err.Error()
	}
	return ret
}
func (app *App) ChooseImageFile() string {
	opts := runtime.OpenDialogOptions{
		DefaultDirectory: app.appArgs.DocumentPath,
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

	ret, err := runtime.OpenFileDialog(app.ctx, opts)
	if err != nil {
		app.log.Error(err.Error())
		return err.Error()
	}
	return ret
}
func (app *App) SetupEventListeners() {
	eventHandler := NewEventHandler(app)
	eventHandler.SetupAllEventListeners()
}
