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
)

var (
	ErrPdfImagesToNotFound = fmt.Errorf("pdfimages not found")
	defaultPdfImagesPath   = "pdfimages"
)

type PDFImagesLoader struct {
	pdfImagesPath string
	path          string
	outputDir     string
	format        string // jpg, png, ppm, etc.
	firstPage     int
	lastPage      int
}

type ImageDocument struct {
	ImagePath string
	Metadata  Meta
}

func NewPDFImagesLoader(path string) *PDFImagesLoader {
	return &PDFImagesLoader{
		pdfImagesPath: defaultPdfImagesPath,
		path:          path,
		format:        "jpg", // default format
		firstPage:     -1,    // -1 means not set
		lastPage:      -1,    // -1 means not set
	}
}

func NewPDFImages() *PDFImagesLoader {
	return &PDFImagesLoader{
		pdfImagesPath: defaultPdfImagesPath,
		format:        "jpg",
		firstPage:     -1,
		lastPage:      -1,
	}
}

func (p *PDFImagesLoader) WithPDFImagesPath(pdfImagesPath string) *PDFImagesLoader {
	p.pdfImagesPath = pdfImagesPath
	return p
}

func (p *PDFImagesLoader) WithOutputDir(outputDir string) *PDFImagesLoader {
	p.outputDir = outputDir
	return p
}

func (p *PDFImagesLoader) WithFormat(format string) *PDFImagesLoader {
	p.format = format
	return p
}

func (p *PDFImagesLoader) WithPageRange(firstPage, lastPage int) *PDFImagesLoader {
	p.firstPage = firstPage
	p.lastPage = lastPage
	return p
}

func (p *PDFImagesLoader) Load(ctx context.Context) ([]ImageDocument, error) {
	fileInfo, err := os.Stat(p.path)
	if err != nil {
		return nil, err
	}

	var documents []ImageDocument
	if fileInfo.IsDir() {
		documents, err = p.loadDir(ctx)
	} else {
		documents, err = p.loadFile(ctx)
	}
	if err != nil {
		return nil, err
	}

	return documents, nil
}

func (p *PDFImagesLoader) LoadFromSource(ctx context.Context, source string) ([]ImageDocument, error) {
	p.path = source
	return p.Load(ctx)
}

func (p *PDFImagesLoader) loadFile(ctx context.Context) ([]ImageDocument, error) {
	// Create output directory if not specified
	if p.outputDir == "" {
		tempDir, err := os.MkdirTemp(os.TempDir(), "pdfimages")
		if err != nil {
			return nil, err
		}
		p.outputDir = tempDir
	}

	// Ensure output directory exists
	if err := os.MkdirAll(p.outputDir, 0755); err != nil {
		return nil, err
	}

	// Build command arguments
	args := []string{}

	// Add format flag
	switch p.format {
	case "jpg", "jpeg":
		args = append(args, "-j") // JPEG format
	case "png":
		args = append(args, "-png") // PNG format
	case "tiff":
		args = append(args, "-tiff") // TIFF format
	case "ppm":
		args = append(args, "-all") // PPM format (default)
	default:
		args = append(args, "-j") // Default to JPEG
	}

	// Add page range if specified
	if p.firstPage > 0 {
		args = append(args, "-f", fmt.Sprintf("%d", p.firstPage))
	}
	if p.lastPage > 0 {
		args = append(args, "-l", fmt.Sprintf("%d", p.lastPage))
	}

	// Add input PDF and output prefix
	baseFileName := strings.TrimSuffix(filepath.Base(p.path), filepath.Ext(p.path))
	outputPrefix := filepath.Join(p.outputDir, baseFileName)
	args = append(args, p.path, outputPrefix)

	// Execute pdf images command
	cmd := exec.CommandContext(ctx, p.pdfImagesPath, args...)

	// Hide the window on Windows
	if runtime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow: true,
		}
	}

	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("pdfimages execution failed: %w", err)
	}

	// Find generated image files
	imageFiles, err := p.findGeneratedImages(outputPrefix)
	if err != nil {
		return nil, err
	}

	// Create ImageDocument entries
	var documents []ImageDocument
	for _, imagePath := range imageFiles {
		metadata := make(Meta)
		metadata[SourceMetadataKey] = p.path
		metadata["image_path"] = imagePath
		metadata["output_format"] = p.format

		documents = append(documents, ImageDocument{
			ImagePath: imagePath,
			Metadata:  metadata,
		})
	}

	return documents, nil
}

func (p *PDFImagesLoader) loadDir(ctx context.Context) ([]ImageDocument, error) {
	docs := []ImageDocument{}

	err := filepath.Walk(p.path, func(path string, info os.FileInfo, err error) error {
		if err == nil && strings.HasSuffix(strings.ToLower(info.Name()), ".pdf") {
			loader := NewPDFImagesLoader(path).
				WithPDFImagesPath(p.pdfImagesPath).
				WithFormat(p.format).
				WithOutputDir(p.outputDir)

			if p.firstPage > 0 || p.lastPage > 0 {
				loader = loader.WithPageRange(p.firstPage, p.lastPage)
			}

			d, errLoad := loader.loadFile(ctx)
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

func (p *PDFImagesLoader) findGeneratedImages(outputPrefix string) ([]string, error) {
	var imageFiles []string

	// Get the directory containing the output files
	outputDir := filepath.Dir(outputPrefix)
	basePrefix := filepath.Base(outputPrefix)

	// Read directory contents
	entries, err := os.ReadDir(outputDir)
	if err != nil {
		return nil, err
	}

	// Find files that start with our prefix
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasPrefix(entry.Name(), basePrefix) {
			// Check if it's an image file based on an extension
			ext := strings.ToLower(filepath.Ext(entry.Name()))
			if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".tiff" || ext == ".ppm" || ext == ".pbm" {
				imageFiles = append(imageFiles, filepath.Join(outputDir, entry.Name()))
			}
		}
	}

	return imageFiles, nil
}

// GetOutputDirectory returns the output directory used for generated images
func (p *PDFImagesLoader) GetOutputDirectory() string {
	return p.outputDir
}

// CleanupImages removes all generated image files
func (p *PDFImagesLoader) CleanupImages(imageDocuments []ImageDocument) error {
	for _, doc := range imageDocuments {
		if err := os.Remove(doc.ImagePath); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	return nil
}

// CleanupOutputDirectory removes the entire output directory
func (p *PDFImagesLoader) CleanupOutputDirectory() error {
	if p.outputDir != "" {
		return os.RemoveAll(p.outputDir)
	}
	return nil
}
