package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/sergi/go-diff/diffmatchpatch"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"time"
)

// App struct
type App struct {
	ctx    context.Context
	Log    logger.Logger
	cancel context.CancelFunc
}

// NewApp creates a new App application struct
func NewApp() *App {
	ctx, cancel := context.WithCancel(context.Background())
	return &App{
		ctx:    ctx,
		cancel: cancel,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.Log = Log
	a.ctx = ctx
}
func (a *App) WorkItemsDiff(workItemOne string, workItemTwo string) string {
	dmp := diffmatchpatch.New()
	diffs := dmp.DiffMain(workItemOne, workItemTwo, true)
	dmp.DiffCleanupSemantic(diffs)
	dmp.DiffCleanupSemanticLossless(diffs)
	out := dmp.DiffPrettyHtml(diffs)
	return out
}
func (a *App) GetWorkItems() string {
	out, err := GetData()
	if err != nil {
		return ""
	}
	jsonOut, err := json.Marshal(out)
	if err != nil {
		return ""
	}
	return string(jsonOut)
}

// GenerateCompletion generates a completion based on the provided arguments and prompt type, returning the resulting inference output.
func (a *App) GenerateCompletion(q LlamaCppArgs, promptType string) string {
	//Get prompt template type
	var err error
	switch promptType {
	case "LLAMA2":
		q.PromptText, err = CreateInstTemplate(instPrompt, instTemplate, q.PromptText)
	case "LLAMA3":
		q.PromptText, err = CreateSystemUserTemplate(llamaPrompt, llamaTemplate, q.PromptText)
	case "SystemUserAssistant":
		q.PromptText, err = CreateSystemUserTemplate(systemPrompt, systemTemplate, q.PromptText)
	case "UserAssistantDeepSeek":
		q.PromptText, err = CreateInstTemplate(instDeepSeekPrompt, instDeepSeekTemplate, q.PromptText)
	default:
		q.PromptText, err = CreateSystemUserTemplate(llamaPrompt, llamaTemplate, q.PromptText)
	}
	//Build up args
	args := LlamaCliStructToArgs(q)
	//Execute completion
	out, err := GenerateSingleCompletionWithCancel(a.ctx, args)
	if err != nil {
		a.Log.Error(err.Error())
		return err.Error()
	}

	// Convert q to JSON
	jsonArgs, err := json.Marshal(q)
	if err != nil {
		a.Log.Error("Failed to convert q to JSON: " + err.Error())
		return ""
	}
	currentDateTime := time.Now().Format("2006-01-02 15:04:05")
	err = InsertData(string(out), string(jsonArgs)[1:len(string(jsonArgs))-1], q.PromptText, currentDateTime)
	if err != nil {
		return ""
	}
	return string(out)
}

// GetDefaultSettings Return all the default settings for the App, byte-vision config sets the defaults
func (a *App) GetDefaultSettings() string {
	//Parse all the settings
	defaultLlamaCliArgs, _ := json.Marshal(DefaultLlamaCliArgs)
	defaultLlamaEmbedArgs, _ := json.Marshal(DefaultLlamaEmbedArgs)
	appArgs, _ := json.Marshal(AppArgs)
	return fmt.Sprintf("[%s, %s, %s]", defaultLlamaCliArgs, defaultLlamaEmbedArgs, appArgs)
}

// CreateEmbedding processes text/csv/pdf data using the specified embedding type and generates embeddings that are stored in a database.
func (a *App) CreateEmbedding(cli LlamaCppArgs, emd LlamaEmbedArgs, embedType string, filePath string, dbFolder string, chunkSize int, chunkOverlap int, collectionName string, metaData string, metaDataKey string) string {
	//Parse embedding type
	switch embedType {
	case "csv":
		err := IngestCVSData(cli, emd, filePath, dbFolder, chunkSize, chunkOverlap, collectionName, metaData, metaDataKey)
		if err != nil {
			a.Log.Error(err.Error())
			return err.Error()
		}
	case "text":
		err := IngestTextData(cli, emd, filePath, dbFolder, chunkSize, chunkOverlap, collectionName, metaData, metaDataKey)
		if err != nil {
			a.Log.Error(err.Error())
			return err.Error()
		}
	case "pdf":
		err := IngestPdfData(cli, emd, filePath, dbFolder, chunkSize, chunkOverlap, collectionName, metaData, metaDataKey)
		if err != nil {
			a.Log.Error(err.Error())
			return err.Error()
		}
	}
	return "Done"
}

// QueryTextEmbeddingWithCancel queries a text embedding with cancellation support using the specified parameters and returns the result.
func (a *App) QueryTextEmbeddingWithCancel(cli LlamaCppArgs, emd LlamaEmbedArgs, dbPath string, collection string, key string, metaData string, query string) string {

	out, err := QueryTextEmbeddingWithCancel(a.ctx, cli, emd, dbPath, collection, key, metaData, query)
	if err != nil {
		a.Log.Error(err.Error())
		return err.Error()
	}
	return string(out)
}

// QueryCSVEmbeddingWithCancel queries a CSV embedding database with cancellation support using the specified parameters.
func (a *App) QueryCSVEmbeddingWithCancel(cli LlamaCppArgs, emd LlamaEmbedArgs, dbPath string, reportTemplatePath string, reportDataPath string, whereKey string, queryField string, queryValue string, tableList []string) string {
	out, err := QueryCSVEmbeddingWithCancel(a.ctx, cli, emd, dbPath, reportTemplatePath, reportDataPath, whereKey, queryField, queryValue, tableList)
	if err != nil {
		a.Log.Error(err.Error())
		return err.Error()
	}
	return string(out)
}

// GetAppLogFile reads the content of the log file located at the specified path and returns it as a string.
func (a *App) GetAppLogFile(appLogPath string) string {
	return GetAppLogFile(appLogPath)
}

// GetModelFiles retrieves a list of model file names and their full paths from the configured model folder directory.
func (a *App) GetModelFiles() []ModelNameFullPath {
	return GetModelFilesInDirectory()
}

// GetCurrentModelLogFile retrieves and returns the contents of the model log file located at the specified path.
func (a *App) GetCurrentModelLogFile(modelLogPath string) string {
	return GetCurrentModelLogFile(modelLogPath)
}

// GetCurrentEmbedModelLogFile retrieves the content of the embedding model log file located at the specified path.
func (a *App) GetCurrentEmbedModelLogFile(modelEmbedLogPath string) string {
	return GetCurrentEmbedModelLogFile(modelEmbedLogPath)
}
