package main

type TextSplitterLoader interface {
	SplitDocuments(documents []Document) []Document
}

type Loader struct {
	textSplitter TextSplitterLoader
}
