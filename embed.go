package main

import "C"
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

var Cli LlamaCppArgs
var Emb LlamaEmbedArgs

// QueryCSVEmbeddingWithCancel executes a series of operations including querying a database, generating embeddings,
// Format -> tableName salary empNumber 10009 amount 94409 fromDate 2002-02-14 toDate 9999-01-01
func QueryCSVEmbeddingWithCancel(ctx context.Context, cli LlamaCppArgs, emd LlamaEmbedArgs, dbFileName, reportTemplatePath, reportDataPath, whereKey string, queryField, queryValue string, tableList []string) ([]byte, error) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	Cli = cli
	Emb = emd

	db, err := chromem.NewPersistentDB(AppArgs.EmbedDBFolderName+dbFileName, false)
	if err != nil {
		Log.Error(err.Error())
		return nil, fmt.Errorf("error in QueryCSVEmbeddingWithCancel: %w", err)
	}

	var out string
	for _, table := range tableList {
		where := make(map[string]string)
		where[whereKey] = table
		whereDocument := make(map[string]string)
		whereDocument["$contains"] = fmt.Sprintf("%s %s", queryField, queryValue)
		c, _ := db.GetOrCreateCollection(table, nil, GenerateEmbedWithCancel)
		cnt := c.Count()
		//Pay attention to hard coded "tableName"
		res, err := c.Query(ctx, fmt.Sprintf("%s %s", "tableName", table), cnt, where, whereDocument)
		if err != nil {
			Log.Error(err.Error())
			return nil, fmt.Errorf("error in QueryCSVEmbeddingWithCancel: %w", err)
		}
		for _, v := range res {
			out += fmt.Sprintf("%s\r\n", v.Content)
		}
	}

	// Open a file to write the query results output string.
	file, err := os.Create(AppArgs.ReportDataPath + reportDataPath)
	if err != nil {
		Log.Error(err.Error())
		return nil, fmt.Errorf("error in QueryCSVEmbeddingWithCancel: %w", err)
	}
	defer func(file *os.File) {
		err := file.Close()
		if err != nil {
			Log.Error(err.Error())
			return
		}
	}(file)

	// Write the output string to the file
	_, err = file.WriteString(out)
	if err != nil {
		Log.Error(err.Error())
		return nil, fmt.Errorf("error in QueryCSVEmbeddingWithCancel: %w", err)
	}
	reportPrompt, err := CreateReportTemplateWithMetadata(reportTemplatePath, reportDataPath)
	if err != nil {
		Log.Error(err.Error())
		return nil, fmt.Errorf("error in QueryCSVEmbeddingWithCancel: %w", err)
	}
	//Create prompt file
	file, err = os.Create(Cli.PromptFileVal)
	if err != nil {
		Log.Error(err.Error())
		return nil, fmt.Errorf("error in QueryCSVEmbeddingWithCancel: %w", err)
	}
	defer func(file *os.File) {
		err := file.Close()
		if err != nil {
			Log.Error(err.Error())
			return
		}
	}(file)

	// Write the output string to the file
	_, err = file.WriteString(reportPrompt)
	if err != nil {
		Log.Error(err.Error())
		return nil, fmt.Errorf("error in QueryCSVEmbeddingWithCancel: %w", err)
	}
	args := LlamaCliStructToArgs(Cli)
	//Create completion result
	result, err := GenerateSingleCompletionWithCancel(ctx, args)
	if err != nil {
		Log.Error(err.Error())
		return nil, fmt.Errorf("error in QueryCSVEmbeddingWithCancel: %w", err)
	}

	return result, nil
}

// QueryTextEmbeddingWithCancel queries a persistent database for embeddings based on input text and context cancellation.
// It generates and returns a single response completion or an error if encountered.
// Inputs include context, database details, collection metadata, and query parameters.
func QueryTextEmbeddingWithCancel(ctx context.Context, cli LlamaCppArgs, emd LlamaEmbedArgs, dbFileName string, collection string, key string, metaText string, query string) ([]byte, error) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	Cli = cli
	Emb = emd

	db, err := chromem.NewPersistentDB(AppArgs.EmbedDBFolderName+dbFileName, false)
	if err != nil {
		Log.Error(err.Error())
		return nil, fmt.Errorf("error in QueryTextEmbeddingWithCancel: %w", err)
	}
	metaData := make(map[string]string)
	metaData[key] = metaText
	//Create embedding
	c, _ := db.GetOrCreateCollection(collection, nil, GenerateEmbedWithCancel)
	cnt := c.Count()
	//Hacky way to back off like results
	if cnt >= 100 {
		cnt = 100 / 3
	}
	//Execute embedding query
	res, err := c.Query(ctx, query, cnt, metaData, nil)
	if err != nil {
		Log.Error(err.Error())
		return nil, fmt.Errorf("error in QueryTextEmbeddingWithCancel: %w", err)
	}
	var out string
	for _, v := range res {
		out += fmt.Sprintf("%s\r\n", v.Content)
	}
	//Trim response
	resStr := fmt.Sprintf("%v", strings.TrimSpace(out))
	Log.Info(strconv.Itoa(len(resStr)))
	//Create prompt template with embedding response
	Cli.PromptText, err = CreateSystemUserTemplate(llamaPrompt, llamaTemplate, resStr)
	if err != nil {
		Log.Error(err.Error())
		return nil, fmt.Errorf("error in QueryTextEmbeddingWithCancel: %w", err)
	}
	args := LlamaCliStructToArgs(Cli)
	// Write the output string to the file
	response, err := GenerateSingleCompletionWithCancel(ctx, args)
	if err != nil {
		Log.Error(err.Error())
		return nil, fmt.Errorf("error in QueryTextEmbeddingWithCancel: %w", err)
	}

	return response, nil
}
func parseJSONToFloat32(jsonBytes []byte) ([]float32, error) {
	// Parse JSON into a 2D slice of float32
	var nestedSlices [][]float32
	if err := json.Unmarshal(jsonBytes, &nestedSlices); err != nil {
		Log.Info(err.Error())
		return nil, fmt.Errorf("error in parseJSONToFloat32: %w", err)
	}
	// Flatten the nested slices into a single slice
	return flattenFloat32Slices(nestedSlices), nil

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
	//Create prompt for embedding.
	Emb.EmbedPromptCmd = "-p"
	Emb.EmbedPromptText = text
	args := LlamaEmbedStructToArgs(Emb)
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
		resParsed, errParse := parseJSONToFloat32(res.output)
		if errParse != nil {
			return nil, errParse // Return the error from parseJSONToFloat32 if any
		}
		return resParsed, res.err

	case <-ctx.Done():
		// Context was canceled or timed out
		return nil, ctx.Err()
	}

}

// CreateEmbedding adds a batch of documents to a specified collection in a persistent database with embedding generation.
// Each document's metadata is processed and updated before being stored in the collection.
func CreateEmbedding(doc []Document, dbPath string, collectionName string, metaData string, metaDataKey string) error {
	ctx := context.Background()
	db, err := chromem.NewPersistentDB(AppArgs.EmbedDBFolderName+dbPath, false)
	if err != nil {
		Log.Info(err.Error())
		return fmt.Errorf("error in CreateEmbedding: %w", err)
	}
	c, err := db.GetOrCreateCollection(collectionName, nil, GenerateEmbedWithCancel)
	if err != nil {
		Log.Info(err.Error())
		return fmt.Errorf("error in CreateEmbedding: %w", err)
	}

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
			return fmt.Errorf("error in CreateEmbedding: %w", err)
		}

	}
	return nil
}

// IngestTextData ingests text from a file into a vector database with optional chunking and metadata attachment.
// cli specifies the CLI configuration for LlamaCppArgs processing.
// emd specifies the embedding configuration using LlamaEmbedArgs.
// filePath is the path to the input text file to be processed.
// dbPath specifies the path to the database where embeddings will be stored.
// chunkSize defines the size of each text chunk if chunking is enabled.
// chunkOverlap determines the overlap size between consecutive text chunks.
// collectionName is the name of the collection in the database where embeddings are stored.
// metaData is a string containing optional metadata to associate with the ingested text.
// metaDataKey specifies the key used for storing the given metadata.
// Returns an error if any processing step fails.
func IngestTextData(cli LlamaCppArgs, emd LlamaEmbedArgs, filePath string, dbPath string, chunkSize int, chunkOverlap int, collectionName string, metaData string, metaDataKey string) error {
	Cli = cli
	Emb = emd
	metaDataStr := Meta{}
	metaDataStr[metaDataKey] = metaData
	//Create docs with metadata.
	documents, _ := NewTextLoader(filePath, metaDataStr).Load(context.Background())
	if chunkSize > 0 && chunkOverlap > 0 {
		//Split up text into chunks
		textSplitter := NewRecursiveCharacterTextSplitter(chunkSize, chunkOverlap)
		documentChunks := textSplitter.SplitDocuments(documents)
		err := CreateEmbedding(documentChunks, dbPath, collectionName, metaData, metaDataKey)
		if err != nil {
			Log.Error(err.Error())
			return fmt.Errorf("error in IngestTextData: %w", err)
		}
	} else {
		err := CreateEmbedding(documents, dbPath, collectionName, metaData, metaDataKey)
		if err != nil {
			Log.Error(err.Error())
			return fmt.Errorf("error in IngestTextData: %w", err)
		}
	}
	return nil
}

// IngestCVSData ingests CSV data, processes it, and creates embeddings into a specified database and collection.
// cli and emd are configuration structs for LlamaCpp and LlamaEmbed.
// filePath is the path to the CSV file to be loaded.
// dbFolder specifies the target database folder for embeddings.
// chunkSize and chunkOverlap define the document splitting configuration; if <= 0, no splitting is applied.
// collectionName is the name of the collection in the database to store embeddings.
// metaData and metaDataKey provide additional metadata for the embeddings.
// Returns an error if data ingestion or embedding creation fails.
func IngestCVSData(cli LlamaCppArgs, emd LlamaEmbedArgs, filePath string, dbFolder string, chunkSize int, chunkOverlap int, collectionName string, metaData string, metaDataKey string) error {
	Cli = cli
	Emb = emd
	documents, _ := NewCSVLoader(filePath).Load(context.Background())
	if chunkSize > 0 && chunkOverlap > 0 {
		textSplitter := NewRecursiveCharacterTextSplitter(chunkSize, chunkOverlap)
		documentChunks := textSplitter.SplitDocuments(documents)
		err := CreateEmbedding(documentChunks, dbFolder, collectionName, metaData, metaDataKey)
		if err != nil {
			Log.Error(err.Error())
			return fmt.Errorf("error in IngestCVSData: %w", err)
		}
	} else {
		err := CreateEmbedding(documents, dbFolder, collectionName, metaData, metaDataKey)
		if err != nil {
			Log.Error(err.Error())
			return fmt.Errorf("error in IngestCVSData: %w", err)
		}
	}
	return nil
}

// IngestPdfData processes and ingests data from a PDF file into an embedding database with optional text chunking.
// cli specifies the LlamaCppArgs configuration settings.
// emd specifies the LlamaEmbedArgs configuration settings.
// filePath is the path to the PDF file to be ingested.
// dbFolder specifies the folder where the embedding database is stored.
// chunkSize defines the size of text chunks for splitting; use 0 for no splitting.
// chunkOverlap defines the overlap between text chunks; use 0 for no overlap.
// collectionName specifies the name of the collection inside the database.
// metaData is additional metadata to associate with the embeddings.
// metaDataKey is the key for the metadata field.
// Returns an error if any issues occur during the ingestion process.
func IngestPdfData(cli LlamaCppArgs, emd LlamaEmbedArgs, filePath string, dbFolder string, chunkSize int, chunkOverlap int, collectionName string, metaData string, metaDataKey string) error {
	Cli = cli
	Emb = emd
	//Load xpdfexe
	loader := NewPDFToTextLoader(filePath).WithPDFToTextPath(AppArgs.PDFToTextEXE)
	//Create docs
	documents, _ := loader.Load(context.Background())
	if chunkSize > 0 && chunkOverlap > 0 {
		textSplitter := NewRecursiveCharacterTextSplitter(chunkSize, chunkOverlap)
		documentChunks := textSplitter.SplitDocuments(documents)
		err := CreateEmbedding(documentChunks, dbFolder, collectionName, metaData, metaDataKey)
		if err != nil {
			Log.Error(err.Error())
			return fmt.Errorf("error in IngestPdfData: %w", err)
		}
	} else {
		err := CreateEmbedding(documents, dbFolder, collectionName, metaData, metaDataKey)
		if err != nil {
			Log.Error(err.Error())
			return fmt.Errorf("error in IngestPdfData: %w", err)
		}
	}
	return nil
}
