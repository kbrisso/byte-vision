package main

import (
	"context"
	"fmt"
	"os"

	"github.com/wailsapp/wails/v2/pkg/logger"
)

type TextLoader struct {
	loader Loader

	filename string
	metadata Meta
}

func NewTextLoader(filename string, metadata Meta) *TextLoader {
	return &TextLoader{
		filename: filename,
		metadata: metadata,
	}
}

func NewText() *TextLoader {
	return &TextLoader{}
}

func (t *TextLoader) WithTextSplitter(textSplitter TextSplitterLoader) *TextLoader {
	t.loader.textSplitter = textSplitter
	return t
}

func (t *TextLoader) WithMetadata(metadata Meta) *TextLoader {
	t.metadata = metadata
	return t
}

func (t *TextLoader) Load(log logger.Logger, ctx context.Context, appArgs DefaultAppArgs, enableStopWordRemoval bool) ([]Document, error) {
	_ = ctx
	err := t.validate()
	if err != nil {
		return nil, err
	}
	text, err := os.ReadFile(t.filename)
	if err != nil {
		log.Error(err.Error())
	}
	documents := []Document{
		{
			Content:  string(text),
			Metadata: t.metadata,
		},
	}
	if t.loader.textSplitter != nil {
		documents = t.loader.textSplitter.SplitDocuments(log, appArgs, enableStopWordRemoval, documents)
	}
	return documents, nil
}

func (t *TextLoader) LoadFromSource(logger logger.Logger, ctx context.Context, source string, appArgs DefaultAppArgs, enableStopWordRemoval bool) ([]Document, error) {
	t.filename = source
	return t.Load(logger, ctx, appArgs, enableStopWordRemoval)
}

func (t *TextLoader) validate() error {
	if t.metadata == nil {
		t.metadata = make(Meta)
	} else {
		_, ok := t.metadata[SourceMetadataKey]
		if ok {
			return fmt.Errorf("%w: metadata key %s is reserved", "ErrInternal", SourceMetadataKey)
		}
	}
	t.metadata[SourceMetadataKey] = t.filename
	fileStat, err := os.Stat(t.filename)
	if err != nil {
		return fmt.Errorf("%w: %w", "ErrInternal", err)
	}

	if fileStat.IsDir() {
		return fmt.Errorf("%w: %w", "ErrInternal", os.ErrNotExist)
	}

	return nil
}
