package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/philippgille/chromem-go"
	"math/rand"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

func executeEmbedWithCancel(ctx context.Context, text string) ([]float32, error) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	// Create a channel to capture the result
	result := make(chan struct {
		output []byte
		err    error
	})
	args := EmbedArgs()
	args = append(args, "-p", text)
	// Run the command in a goroutine
	go func() {
		out, err := exec.CommandContext(ctx, EmbedLLamaCppPath, args...).Output()
		result <- struct {
			output []byte
			err    error
		}{output: out, err: err}
		close(result)
	}()

	select {
	case res := <-result:
		// Command completed
		return uint8Float32(res.output), res.err
	case <-ctx.Done():
		// Context was canceled or timed out
		return nil, ctx.Err()
	}

}

func uint8Float32(input []byte) []float32 {
	var parsedData [][]float32
	// Unmarshal the JSON into the placeholder
	err := json.Unmarshal([]byte(input), &parsedData)
	if err != nil {
		fmt.Println("Error decoding JSON:", err)
		return nil
	}

	// Flatten the 2D array into a single []float32
	var flatData []float32
	for _, row := range parsedData {
		flatData = append(flatData, row...)
	}
	return flatData
}

func EmbedCompletionsWithCancel(ctx context.Context, args []string) ([]byte, error) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	db, err := chromem.NewPersistentDB("C:/Projects/byte-vision/db/employee", false)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}
	c, err := db.GetOrCreateCollection("employee", nil, executeEmbedWithCancel)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}
	cnt := c.Count()
	var tableList = []string{"salary", "employee", "title"}
	var prompt string
	var out string
	for _, table := range tableList {
		where := make(map[string]string)
		where["table"] = table
		res, err := c.Query(ctx, "empNumber 10009 ", cnt, where, map[string]string{"$contains": "10009"})
		if err != nil {
			Log.Error(err.Error())
			return nil, err
		}
		for _, v := range res {
			out += fmt.Sprintf("%s\n", v.Content)
		}
	}
	prompt = fmt.Sprintf(`system You are a helpful assistant that follows instructions to answer questions.user please use the template shown between ### and >>> to build a report. Please use the data provided between context. List 
                out the data in a table format with the appropriate headers.               
				####Employee Report###
				
				####Employee Information###
				| empNumber | firstName | lastName | birthDate   | gender | hireDate   |   |
				|-----------|-----------|---------|------------|-------|------------|	
				
				---
				
				####Salary History####
				| empNumber | firstName | lastName | birthDate   | gender | hireDate   | fromDate  | toDate    | amount  |
				|-----------|-----------|---------|------------|-------|------------|-----------|-----------|---------|			
				---
				
				####Title History####
				| empNumber | firstName | lastName | birthDate   | gender | hireDate   | fromDate  | toDate    | title       |
				|-----------|-----------|---------|------------|-------|------------|-----------|-----------|-------------|				
				context starts %s context ends`, strings.TrimSpace(out))

	fmt.Print(prompt)
	// Create a new slice with enough capacity for the inserted items

	p, err := executeWithCancel(ctx, args)
	if err != nil {
		Log.Error(err.Error())
		return nil, err
	}

	return p, nil
}

func RunEmbedding() {
	ctx := context.Background()
	db, err := chromem.NewPersistentDB("C:/Projects/byte-vision/db/employee", false)
	if err != nil {
		Log.Error(err.Error())
	}
	c, err := db.GetOrCreateCollection("employee", nil, executeEmbedWithCancel)
	if err != nil {
		Log.Error(err.Error())
	}
	x := 0
	doc := IngestTextData()
	for _, singleDoc := range doc {
		metadataStr := make(map[string]string)
		for key, value := range singleDoc.Metadata {
			if strValue, ok := value.(string); ok {
				metadataStr[key] = strValue
				metadataStr["table"] = "employee"
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
func IngestTextData() []Document {

	fmt.Printf("Ingesting data...")
	metadataStr := Meta{}
	metadataStr["text"] = "random"

	documents, err := NewCSVLoader("C:/Projects/byte-vision/rag/emp.txt").Load(context.Background())
	//documents, _ := NewTextLoader("C:/Projects/byte-vision/rag/random-test.txt", metadataStr).Load(context.Background())
	if err != nil {
		fmt.Println("Error:", err)
	}
	//textSplitter := NewRecursiveCharacterTextSplitter(53, 0)
	//documentChunks := textSplitter.SplitDocuments(documents)

	return documents

}
