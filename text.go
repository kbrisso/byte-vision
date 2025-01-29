package main

import (
	"context"
	"fmt"
	"os"
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

func (t *TextLoader) Load(ctx context.Context) ([]Document, error) {
	_ = ctx
	err := t.validate()
	if err != nil {
		return nil, err
	}

	text, err := os.ReadFile(t.filename)
	if err != nil {
		return nil, fmt.Errorf("%w: %w", ErrInternal, err)
	}

	documents := []Document{
		{
			Content:  string(text),
			Metadata: t.metadata,
		},
	}

	if t.loader.textSplitter != nil {
		documents = t.loader.textSplitter.SplitDocuments(documents)
	}

	return documents, nil
}

func (t *TextLoader) LoadFromSource(ctx context.Context, source string) ([]Document, error) {
	t.filename = source
	return t.Load(ctx)
}

func (t *TextLoader) validate() error {
	if t.metadata == nil {
		t.metadata = make(Meta)
	} else {
		_, ok := t.metadata[SourceMetadataKey]
		if ok {
			return fmt.Errorf("%w: metadata key %s is reserved", ErrInternal, SourceMetadataKey)
		}
	}

	t.metadata[SourceMetadataKey] = t.filename

	fileStat, err := os.Stat(t.filename)
	if err != nil {
		return fmt.Errorf("%w: %w", ErrInternal, err)
	}

	if fileStat.IsDir() {
		return fmt.Errorf("%w: %w", ErrInternal, os.ErrNotExist)
	}

	return nil
}
