package main

import (
	"fmt"
	"os"
)

var (
	ErrInternal = fmt.Errorf("internal error")
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
		return fmt.Errorf("%w: %w", ErrInternal, err)
	}

	if fileStat.IsDir() {
		return fmt.Errorf("%w: %w", ErrInternal, os.ErrNotExist)
	}

	return nil
}
