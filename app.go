package main

import (
	"context"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"os"
	"path/filepath"
)

// App struct
type App struct {
	ctx context.Context
	Log logger.Logger
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.Log = Log
	a.ctx = ctx
}

func (a *App) DomGetDefaultSettings() LlamaCppArgs {
	args, _ := GetDefaultSettings(LlamaCppArgs{})
	return args
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	a.Log.Info("Greet called")
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) Embed() string {
	RunEmbedding()
	return "Done"
}

func (a *App) EmbedCompletion(q LlamaCppArgs) string {
	args := StructToArgs(q)
	out, err := EmbedCompletionsWithCancel(a.ctx, args)
	if err != nil {
		a.Log.Error(err.Error())
		return ""
	}
	return string(out)

}

// GetFilesInDirectory opens a directory and returns the file names and their full paths
func (a *App) GetFilesInDirectory() []ModelFile {
	modelPath := ModelPath
	dirPath := filepath.Dir(string(modelPath))
	filePath, err := os.Open(dirPath)
	if err != nil {
		a.Log.Error(err.Error())
		return nil
	}
	defer func(filePath *os.File) {
		err := filePath.Close()
		if err != nil {
			a.Log.Error(err.Error())
		}
	}(filePath)
	files, err := filePath.Readdir(-1)
	if err != nil {
		a.Log.Error(err.Error())
		return nil
	}
	var fileModels []ModelFile
	for _, entry := range files {
		if !entry.IsDir() {
			fullPath := filepath.Join(dirPath, entry.Name())
			fileModels = append(fileModels, ModelFile{
				FileName: entry.Name(),
				FullPath: fullPath,
			})
		}
	}
	return fileModels
}

func (a *App) GenerateCompletion(q LlamaCppArgs) string {

	args := StructToArgs(q)
	a.Log.Info(fmt.Sprint(args))
	out, err := executeWithCancel(a.ctx, args)
	if err != nil {
		a.Log.Error(err.Error())
		return ""
	}

	return string(out)
}
