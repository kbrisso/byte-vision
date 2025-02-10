package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/philippgille/chromem-go"
	"math/rand"
	"os"
	"os/exec"
	"runtime"

	"time"
)

var CLI LlamaCppArgs
var EMD LlamaEmbedArgs

// EmbedCompletionWithCancel executes a series of operations including querying a database, generating embeddings,
// Format -> tableName salary empNumber 10009 amount 94409 fromDate 2002-02-14 toDate 9999-01-01
func QueryCSVEmbeddingWithCancel(ctx context.Context, cli LlamaCppArgs, emd LlamaEmbedArgs, dbFileName, reportTemplatePath, reportDataPath, whereKey string, queryField, queryValue string, tableList []string) ([]byte, error) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	CLI = cli
	EMD = emd

	db, err := chromem.NewPersistentDB(AppArgs.EmbedDBFolderName+dbFileName, false)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}

	var out string
	for _, table := range tableList {
		where := make(map[string]string)
		where[whereKey] = table
		whereDocument := make(map[string]string)
		whereDocument["$contains"] = fmt.Sprintf("%s %s", queryField, queryValue)
		c, _ := db.GetOrCreateCollection(table, nil, GenerateEmbedWithCancel)
		cnt := c.Count()
		res, err := c.Query(ctx, fmt.Sprintf("%s %s", "tableName", table), cnt, where, whereDocument)
		if err != nil {
			Log.Error(err.Error())
			return nil, err
		}
		for _, v := range res {
			out += fmt.Sprintf("%s\r\n", v.Content)
		}
	}

	// Open a file to write the output string
	file, err := os.Create(AppArgs.ReportDataPath + reportDataPath)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}
	defer func(file *os.File) {
		err := file.Close()
		if err != nil {
			Log.Error(err.Error())
		}
	}(file)

	// Write the output string to the file
	_, err = file.WriteString(out)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}
	reportPrompt := CreateReportTemplateWithMetadata(reportTemplatePath, reportDataPath)

	file, err = os.Create(CLI.PromptFileVal)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}
	defer func(file *os.File) {
		err := file.Close()
		if err != nil {
			Log.Error(err.Error())
		}
	}(file)

	// Write the output string to the file
	_, err = file.WriteString(reportPrompt)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}
	args := LlamaCliStructToArgs(CLI)
	p, err := GenerateCompletionWithCancel(ctx, args)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}

	return p, nil
}
func QueryTextEmbeddingWithCancel(ctx context.Context, cli LlamaCppArgs, emd LlamaEmbedArgs, dbFileName string, collection string, key string, metaText string, query string) ([]byte, error) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	CLI = cli
	EMD = emd

	db, err := chromem.NewPersistentDB(AppArgs.EmbedDBFolderName+dbFileName, false)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}
	metaData := make(map[string]string)
	metaData[key] = metaText

	c, _ := db.GetOrCreateCollection(collection, nil, GenerateEmbedWithCancel)
	cnt := c.Count()
	if cnt >= 100 {
		cnt = 100 / 3
	}
	res, err := c.Query(ctx, query, cnt, metaData, nil)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}
	var out string
	for _, v := range res {
		out += fmt.Sprintf("%s\r\n", v.Content)
	}

	resStr := fmt.Sprintf("%v", strings.TrimSpace(out))
	Log.Info(strconv.Itoa(len(resStr)))
	CLI.PromptText = CreateLlamaTemplate(resStr)
	args := LlamaCliStructToArgs(CLI)
	// Write the output string to the file

	p, err := GenerateCompletionWithCancel(ctx, args)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}

	return p, nil
}
func parseJSONToFloat32(jsonBytes []byte) []float32 {
	const errMessage = "Error decoding JSON"

	// Parse JSON into a 2D slice of float32
	var nestedSlices [][]float32
	if err := json.Unmarshal(jsonBytes, &nestedSlices); err != nil {
		Log.Info(err.Error())
		return nil
	}

	// Flatten the nested slices into a single slice
	return flattenFloat32Slices(nestedSlices)
}

// Helper function to flatten 2D slices into a single slice
func flattenFloat32Slices(nested [][]float32) []float32 {
	var flatData []float32
	for _, row := range nested {
		flatData = append(flatData, row...)
	}
	return flatData
}

// GenerateEmbedWithCancel generates embeddings for a given text, supporting cancellation via context.
// Takes a context and a string input; returns an embedding slice or an error upon failure.
// Cancels the operation if the context is done or the timeout is reached.
// Executes an external embedding command asynchronously, gathering the result or handling cancellation.
func GenerateEmbedWithCancel(ctx context.Context, text string) ([]float32, error) {

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	// Create a channel to capture the result
	result := make(chan struct {
		output []byte
		err    error
	})
	EMD.EmbedPromptCmd = "-p"
	EMD.EmbedPromptText = text
	args := LlamaEmbedStructToArgs(EMD)
	// Run the command in a goroutine
	go func() {
		out, err := exec.CommandContext(ctx, AppArgs.LLamaEmbedCliPath, args...).Output()
		result <- struct {
			output []byte
			err    error
		}{output: out, err: err}
		close(result)
	}()

	select {
	case res := <-result:
		// Command completed
		return parseJSONToFloat32(res.output), res.err
	case <-ctx.Done():
		// Context was canceled or timed out
		return nil, ctx.Err()
	}

}

func CreateEmbedding(doc []Document, dbPath string, collectionName string, metaData string, metaDataKey string) {
	ctx := context.Background()
	db, err := chromem.NewPersistentDB(AppArgs.EmbedDBFolderName+dbPath, false)
	if err != nil {
		Log.Error(err.Error())
	}
	c, err := db.GetOrCreateCollection(collectionName, nil, GenerateEmbedWithCancel)
	if err != nil {
		Log.Error(err.Error())
	}
	x := 0

	for _, singleDoc := range doc {
		metadataStr := make(map[string]string)
		for key, value := range singleDoc.Metadata {
			if strValue, ok := value.(string); ok {
				metadataStr[key] = strValue
				metadataStr[metaDataKey] = metaData
			} else {
				metadataStr[key] = fmt.Sprintf("%v", value) // Handle non-string values by converting to a string
			}
		}

		rand.Seed(time.Now().UnixNano())
		randomNumber := rand.Intn(100)
		err = c.AddDocuments(ctx, []chromem.Document{
			{
				ID:       fmt.Sprintf("%v", randomNumber),
				Metadata: metadataStr,
				Content:  singleDoc.Content,
			},
		}, runtime.NumCPU())
		if err != nil {
			Log.Error(err.Error())
		}
		x++
		fmt.Println(x)
	}
}
func IngestTextData(cli LlamaCppArgs, emd LlamaEmbedArgs, filePath string, dbPath string, chunkSize int, chunkOverlap int, collectionName string, metaData string, metaDataKey string) {
	CLI = cli
	EMD = emd
	metaDataStr := Meta{}
	metaDataStr[metaDataKey] = metaData
	documents, _ := NewTextLoader(filePath, metaDataStr).Load(context.Background())

	if chunkSize > 0 && chunkOverlap > 0 {
		textSplitter := NewRecursiveCharacterTextSplitter(chunkSize, chunkOverlap)
		documentChunks := textSplitter.SplitDocuments(documents)
		CreateEmbedding(documentChunks, dbPath, collectionName, metaData, metaDataKey)
	} else {
		CreateEmbedding(documents, dbPath, collectionName, metaData, metaDataKey)
	}

}

func IngestCVSData(cli LlamaCppArgs, emd LlamaEmbedArgs, filePath string, dbFolder string, chunkSize int, chunkOverlap int, collectionName string, metaData string, metaDataKey string) {
	CLI = cli
	EMD = emd

	documents, _ := NewCSVLoader(filePath).Load(context.Background())

	if chunkSize > 0 && chunkOverlap > 0 {
		textSplitter := NewRecursiveCharacterTextSplitter(chunkSize, chunkOverlap)
		documentChunks := textSplitter.SplitDocuments(documents)
		CreateEmbedding(documentChunks, dbFolder, collectionName, metaData, metaDataKey)
	} else {
		CreateEmbedding(documents, dbFolder, collectionName, metaData, metaDataKey)
	}

}

func IngestPdfData(cli LlamaCppArgs, emd LlamaEmbedArgs, filePath string, dbFolder string, chunkSize int, chunkOverlap int, collectionName string, metaData string, metaDataKey string) {
	CLI = cli
	EMD = emd
	loader := NewPDFToTextLoader(filePath).WithPDFToTextPath(AppArgs.PDFToTextEXE)
	documents, _ := loader.Load(context.Background())

	if chunkSize > 0 && chunkOverlap > 0 {
		textSplitter := NewRecursiveCharacterTextSplitter(chunkSize, chunkOverlap)
		documentChunks := textSplitter.SplitDocuments(documents)
		CreateEmbedding(documentChunks, dbFolder, collectionName, metaData, metaDataKey)
	} else {
		CreateEmbedding(documents, dbFolder, collectionName, metaData, metaDataKey)
	}

}
