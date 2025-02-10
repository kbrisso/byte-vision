package main

import (
	"fmt"
	"os"
)

type TextSplitterLoader interface {
	SplitDocuments(documents []Document) []Document
}

type Loader struct {
	textSplitter TextSplitterLoader
}

func isFile(filename string) error {
	fileStat, err := os.Stat(filename)
	if err != nil {
		Log.Error(err.Error())
	}

	if fileStat.IsDir() {
		return fmt.Errorf("%w: %w", "File is directory", os.ErrNotExist)
	}

	return nil
}
