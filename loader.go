package main

import "github.com/wailsapp/wails/v2/pkg/logger"

type TextSplitterLoader interface {
	SplitDocuments(logger logger.Logger, appArgs DefaultAppArgs, enableStopWordRemoval bool, documents []Document) []Document
}

type Loader struct {
	textSplitter TextSplitterLoader
}
