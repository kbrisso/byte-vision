package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"

	"github.com/wailsapp/wails/v2/pkg/logger"
)

var (
	ErrPdfToTextNotFound = fmt.Errorf("pdftotext not found")
	defaultPdfToTextPath = "pdftotext"
)

func NewPDFToTextLoader(path string) *PDFLoader {
	return &PDFLoader{
		pdfToTextPath: defaultPdfToTextPath,
		path:          path,
	}
}

func NewPDFToText() *PDFLoader {
	return &PDFLoader{
		pdfToTextPath: defaultPdfToTextPath,
	}
}

func (p *PDFLoader) WithPDFToTextPath(pdfToTextPath string) *PDFLoader {
	p.pdfToTextPath = pdfToTextPath
	return p
}

func (p *PDFLoader) WithTextSplitter(textSplitter TextSplitterLoader) *PDFLoader {
	p.loader.textSplitter = textSplitter
	return p
}

func (p *PDFLoader) Load(ctx context.Context, logger logger.Logger, appArgs DefaultAppArgs, enableStopWordRemoval bool) ([]Document, error) {
	fileInfo, err := os.Stat(p.path)
	if err != nil {
		return nil, err
	}

	var documents []Document
	if fileInfo.IsDir() {
		documents, err = p.loadDir(ctx)
	} else {
		documents, err = p.loadFile(ctx)
	}
	if err != nil {
		return nil, err
	}

	if p.loader.textSplitter != nil {
		documents = p.loader.textSplitter.SplitDocuments(logger, appArgs, enableStopWordRemoval, documents)
	}

	return documents, nil
}

func (p *PDFLoader) LoadFromSource(ctx context.Context, source string, logger logger.Logger, appArgs DefaultAppArgs, enableStopWordRemoval bool) ([]Document, error) {
	p.path = source
	return p.Load(ctx, logger, appArgs, enableStopWordRemoval)
}

func (p *PDFLoader) loadFile(ctx context.Context) ([]Document, error) {
	//nolint:gosec
	cmd := exec.CommandContext(ctx, p.pdfToTextPath, "-enc", "UTF-8", p.path, "-")
	// Hide the window on Windows
	if runtime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow: true,
		}
	}
	out, err := cmd.Output()
	if err != nil {
		fmt.Println(p.path)
		return nil, nil
	}
	metadata := make(Meta)
	metadata[SourceMetadataKey] = p.path
	return []Document{
		{
			Content:  string(out),
			Metadata: metadata,
		},
	}, nil
}

func (p *PDFLoader) loadDir(ctx context.Context) ([]Document, error) {
	docs := []Document{}

	err := filepath.Walk(p.path, func(path string, info os.FileInfo, err error) error {
		if err == nil && strings.HasSuffix(info.Name(), ".pdf") {
			d, errLoad := NewPDFToTextLoader(path).WithPDFToTextPath(p.pdfToTextPath).loadFile(ctx)
			if errLoad != nil {
				return errLoad
			}
			docs = append(docs, d...)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return docs, nil
}
