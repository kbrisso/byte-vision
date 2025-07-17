package main

import "C"
import (
	"context"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"syscall"
)

func parseFloatArray(input string) []float32 {
	// Clean up the input string by removing the outer brackets
	input = strings.TrimSpace(input)
	input = strings.TrimPrefix(input, "[[")
	input = strings.TrimSuffix(input, "]]")

	// Split by comma to get individual float values
	stringValues := strings.Split(input, ",")

	// Create the result slice with the appropriate capacity
	result := make([]float32, 0, len(stringValues))

	// Parse each value into a float32
	for _, strVal := range stringValues {
		// Remove any leading/trailing spaces
		strVal = strings.TrimSpace(strVal)

		// Convert string to float64 first
		floatVal, err := strconv.ParseFloat(strVal, 32)
		if err != nil {
			// Handle error or skip invalid values
			continue
		}
		// Append as float32
		result = append(result, float32(floatVal))
	}

	return result
}

// GenerateEmbedWithCancel generates embeddings for a given text, supporting cancellation via context.
// Takes a context and a string input; returns an embedding slice or an error upon failure.
// Cancels the operation if the context is done or the timeout is reached.
// Executes an external embedding command asynchronously, gathering the result or handling cancellation.
func GenerateEmbedWithCancel(ctx context.Context, llamaEmbedArgs LlamaEmbedArgs, appArgs DefaultAppArgs, text string) ([]float32, error) {

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	// Create a channel to capture the result
	result := make(chan struct {
		output []byte
		err    error
	})
	//Create a prompt for embedding.
	llamaEmbedArgs.EmbedPromptCmd = "-p"
	llamaEmbedArgs.EmbedPromptText = text
	args := LlamaEmbedStructToArgs(llamaEmbedArgs)
	// Run the command in a goroutine
	go func() {
		cmd := exec.CommandContext(ctx, appArgs.LLamaEmbedCliPath, args...)
		// Hide the window on Windows
		if runtime.GOOS == "windows" {
			cmd.SysProcAttr = &syscall.SysProcAttr{
				HideWindow: true,
			}
		}
		out, err := cmd.Output()
		result <- struct {
			output []byte
			err    error
		}{output: out, err: err}
		close(result)
	}()

	select {
	case res := <-result:

		output := parseFloatArray(string(res.output))
		return output, res.err

	case <-ctx.Done():
		// Context was canceled or timed out
		return nil, ctx.Err()
	}

}

func IngestTextData(log logger.Logger, appArgs DefaultAppArgs, sourceLocation string, chunkSize int, chunkOverlap int) ([]Document, error) {

	meta := Meta{}
	meta["type"] = "text"
	//Create docs with metad
	documents, err := NewTextLoader(sourceLocation, meta).Load(log, context.Background())
	if err != nil {
		log.Error(err.Error())
		return nil, fmt.Errorf("error in IngestTextData: %w", err)
	}
	if chunkSize > 0 && chunkOverlap > 0 {
		//Split up text into chunks
		textSplitter := NewRecursiveCharacterTextSplitter(chunkSize, chunkOverlap)
		documentChunks := textSplitter.SplitDocuments(log, appArgs, documents)
		return documentChunks, nil
	} else {
		return documents, nil
	}
}

func IngestCVSData(log logger.Logger, appArgs DefaultAppArgs, sourceLocation string, chunkSize int, chunkOverlap int) ([]Document, error) {

	documents, err := NewCSVLoader(log, sourceLocation).Load(context.Background())
	if err != nil {

		log.Error(err.Error())
		return nil, fmt.Errorf("error in IngestTextData: %w", err)
	}
	if chunkSize > 0 && chunkOverlap > 0 {
		textSplitter := NewRecursiveCharacterTextSplitter(chunkSize, chunkOverlap)
		documentChunks := textSplitter.SplitDocuments(log, appArgs, documents)
		return documentChunks, nil
	} else {
		return documents, nil
	}
}

func IngestPdfData(log logger.Logger, appArgs DefaultAppArgs, sourceLocation string, chunkSize int, chunkOverlap int) ([]Document, error) {

	//Load xpdf exe
	loader := NewPDFToTextLoader(sourceLocation).WithPDFToTextPath(appArgs.PDFToTextPath)
	//Create docs
	documents, err := loader.Load(context.Background())
	if err != nil {
		log.Error(err.Error())
		return nil, fmt.Errorf("error in IngestPdfData: %w", err)
	}
	if chunkSize > 0 && chunkOverlap > 0 {
		textSplitter := NewRecursiveCharacterTextSplitter(chunkSize, chunkOverlap)
		documentChunks := textSplitter.SplitDocuments(log, appArgs, documents)
		return documentChunks, nil
	} else {
		return documents, nil
	}
}
