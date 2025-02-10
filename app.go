package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/logger"
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

func (a *App) GetDefaultSettings() string {
	defaultLlamaCliArgs, _ := json.Marshal(DefaultLlamaCliArgs)
	defaultLlamaEmbedArgs, _ := json.Marshal(DefaultLlamaEmbedArgs)
	appArgs, _ := json.Marshal(AppArgs)
	return fmt.Sprintf("[%s, %s, %s]", defaultLlamaCliArgs, defaultLlamaEmbedArgs, appArgs)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	a.Log.Info("Greet called")
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) CreateEmbedding(cli LlamaCppArgs, emd LlamaEmbedArgs, embedType string, filePath string, dbFolder string, chunkSize int, chunkOverlap int, collectionName string, metaData string, metaDataKey string) string {
	switch embedType {
	case "csv":
		IngestCVSData(cli, emd, filePath, dbFolder, chunkSize, chunkOverlap, collectionName, metaData, metaDataKey)
	case "text":
		IngestTextData(cli, emd, filePath, dbFolder, chunkSize, chunkOverlap, collectionName, metaData, metaDataKey)
	case "pdf":
		IngestPdfData(cli, emd, filePath, dbFolder, chunkSize, chunkOverlap, collectionName, metaData, metaDataKey)
	}

	return "Done"
}

func (a *App) QueryTextEmbeddingWithCancel(cli LlamaCppArgs, emd LlamaEmbedArgs, dbPath string, collection string, key string, metaData string, query string) string {

	out, err := QueryTextEmbeddingWithCancel(a.ctx, cli, emd, dbPath, collection, key, metaData, query)
	if err != nil {
		a.Log.Error(err.Error())
		return ""
	}
	return string(out)
}
func (a *App) QueryCSVEmbeddingWithCancel(cli LlamaCppArgs, emd LlamaEmbedArgs, dbPath string, reportTemplatePath string, reportDataPath string, whereKey string, queryField string, queryValue string, tableList []string) string {

	out, err := QueryCSVEmbeddingWithCancel(a.ctx, cli, emd, dbPath, reportTemplatePath, reportDataPath, whereKey, queryField, queryValue, tableList)
	if err != nil {
		a.Log.Error(err.Error())
		return ""
	}
	return string(out)
}

func (a *App) GetAppLogFile(appLogPath string) string {
	return GetAppLogFile(appLogPath)
}

func (a *App) GetModelFiles() []ModelNameFullPath {
	return GetModelFilesInDirectory()
}

func (a *App) GetCurrentModelLogFile(modelLogPath string) string {
	return GetCurrentModelLogFile(modelLogPath)
}

func (a *App) GetCurrentEmbedModelLogFile(modelEmbedLogPath string) string {
	return GetCurrentEmbedModelLogFile(modelEmbedLogPath)
}

func (a *App) GenerateCompletion(q LlamaCppArgs) string {
	q.PromptText = CreateSystemUserTemplate(q.PromptText)
	args := LlamaCliStructToArgs(q)
	out, err := GenerateCompletionWithCancel(a.ctx, args)
	if err != nil {
		a.Log.Error(err.Error())
		return ""
	}
	return string(out)
}
