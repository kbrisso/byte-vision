package main

import (
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/logger"
)

func NewCSVLoader(logger logger.Logger, filename string) *CSVLoader {
	return &CSVLoader{
		filename:  filename,
		separator: ',',
		logger:    logger,
	}
}

func NewCSV(logger logger.Logger) *CSVLoader {
	return &CSVLoader{
		separator: ',',
		logger:    logger,
	}
}

func (c *CSVLoader) WithLazyQuotes() *CSVLoader {
	c.lazyQuotes = true
	return c
}

func (c *CSVLoader) WithSeparator(separator rune) *CSVLoader {
	c.separator = separator
	return c
}

//nolint:revive
func (c *CSVLoader) WithTextSplitter(textSplitter TextSplitterLoader) *CSVLoader {
	// can't split csv
	return c
}

func (c *CSVLoader) Load(ctx context.Context) ([]Document, error) {
	_ = ctx
	err := c.validate()
	if err != nil {
		return nil, err
	}
	documents, err := c.readCSV()
	if err != nil {
		c.logger.Error(err.Error())
		return nil, err
	}
	return documents, nil
}

func (c *CSVLoader) LoadFromSource(ctx context.Context, source string) ([]Document, error) {
	c.filename = source
	return c.Load(ctx)
}

func (c *CSVLoader) validate() error {
	fileStat, err := os.Stat(c.filename)
	if err != nil {
		c.logger.Error(err.Error())
		return err
	}

	if fileStat.IsDir() {
		return fmt.Errorf("%w: %w", "Is directory", os.ErrNotExist)
	}

	return nil
}

func (c *CSVLoader) readCSV() ([]Document, error) {
	csvFile, err := os.Open(c.filename)
	if err != nil {
		c.logger.Error(err.Error())
	}
	defer func(csvFile *os.File) {
		err := csvFile.Close()
		if err != nil {
			c.logger.Error(err.Error())
		}
	}(csvFile)

	reader := csv.NewReader(csvFile)
	reader.Comma = c.separator
	reader.LazyQuotes = c.lazyQuotes

	var documents []Document
	var titles []string

	for {
		record, errRead := reader.Read()
		if errors.Is(errRead, io.EOF) {
			break
		}
		if errRead != nil {
			return nil, errRead
		}

		if titles == nil {
			titles = make([]string, len(record))
			for i, r := range record {
				titles[i] = strings.ReplaceAll(r, "\"", "")
				titles[i] = strings.TrimSpace(titles[i])
			}

			continue
		}

		var content string
		for i, title := range titles {
			value := strings.ReplaceAll(record[i], "\"", "")
			value = strings.TrimSpace(value)
			content += fmt.Sprintf("%s %s", title, value)
			content += " "
		}

		documents = append(documents, Document{
			Content: content,
			Metadata: Meta{
				SourceMetadataKey: c.filename,
			},
		})
	}

	return documents, nil
}
