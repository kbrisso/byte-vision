package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/logger"
)

// SetMetadata sets the document metadata key to value
func (d *Document) SetMetadata(key string, value interface{}) {
	if d.Metadata == nil {
		d.Metadata = make(Meta)
	}
	d.Metadata[key] = value
}

// GetMetadata returns the document metadata
func (d *Document) GetMetadata(key string) (interface{}, bool) {
	value, ok := d.Metadata[key]
	return value, ok
}

// GetContent returns the document content
func (d *Document) GetContent() string {
	return d.Content
}

// GetEnrichedContent returns the document content with the metadata appended
func (d *Document) GetEnrichedContent() string {
	if d.Metadata == nil {
		return d.Content
	}

	return d.Content + "\n\n" + d.Metadata.String()
}
func SaveAsText(dir string, fileName string, text string, log logger.Logger) error {
	var filePath string
	if fileName != "" {
		filePath = filepath.Join(dir, fileName)
	} else {
		filePath = dir
	}
	// Create a file
	file, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer func(file *os.File) {
		err := file.Close()
		if err != nil {
			log.Error("Failed to close file: " + err.Error())
		}
	}(file)

	// Write the actual document content
	_, err = file.WriteString(text)
	if err != nil {
		log.Error(err.Error())
		return fmt.Errorf("error writing text data: %w", err)
	}

	return nil
}

// TransformMultipleElasticResponsesToJSON converts multiple Elasticsearch responses to a formatted JSON array
func TransformMultipleElasticResponsesToJSON(responses []map[string]interface{}) (string, error) {
	docs := make([]ElasticDocumentResponse, 0, len(responses))

	for _, response := range responses {
		var doc ElasticDocumentResponse

		if id, ok := response["_id"].(string); ok {
			doc.Id = id
		}
		// Extract version
		if metaKeyWords, ok := response["metaKeyWords"].(string); ok {
			doc.MetaKeyWords = metaKeyWords
		}
		// Extract source document
		if metaTextDesc, ok := response["metaTextDesc"].(string); ok {
			doc.MetaTextDesc = metaTextDesc
		}

		// Extract score if present
		if title, ok := response["title"].(string); ok {
			doc.Title = title
		}

		// Extract highlight if present
		if sourceLocation, ok := response["sourceLocation"].(string); ok {
			doc.SourceLocation = sourceLocation
		}

		if timeStamp, ok := response["timestamp"].(string); ok {
			doc.Timestamp = timeStamp
		}

		docs = append(docs, doc)
	}

	// Marshal the documents array to JSON
	jsonBytes, err := json.MarshalIndent(docs, "", "  ")
	if err != nil {
		return "", fmt.Errorf("error marshaling documents to JSON: %w", err)
	}

	return string(jsonBytes), nil
}
