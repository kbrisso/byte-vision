package main

import (
	"context"
	"fmt"

	"github.com/tiagomelo/go-ocr/ocr"
)

// OCRDocument performs OCR on an image file and returns the extracted text
func (a *App) OCRDocument(imagePath string) string {
	t, err := ocr.New(ocr.TesseractPath(a.appArgs.TesseractPath))
	if err != nil {
		a.log.Error("Failed to initialize OCR: " + err.Error())
		return "Error: Failed to initialize OCR - " + err.Error()
	}

	extractedText, err := t.TextFromImageFile(imagePath)
	if err != nil {
		a.log.Error("Failed to extract text from image: " + err.Error())
		return "Error: Failed to extract text from image - " + err.Error()
	}

	a.log.Info("Successfully extracted text from image: " + imagePath)
	return extractedText
}

// PDFToImages converts a PDF file to JPEG images and returns the paths of created images
func (a *App) PDFToImages(pdfPath string) []string {
	// Create PDF images loader with JPEG format
	loader := NewPDFImagesLoader(pdfPath).
		WithFormat("jpg").
		WithPDFImagesPath(a.appArgs.PdfToImagesPath).
		WithOutputDir(a.appArgs.DocumentPath)

	// Convert PDF to images
	imageDocuments, err := loader.Load(context.Background())
	if err != nil {
		a.log.Error("Failed to convert PDF to images: " + err.Error())
		return []string{"Error: Failed to convert PDF to images - " + err.Error()}
	}

	if len(imageDocuments) == 0 {
		a.log.Error("No images were created from PDF")
		return []string{"Error: No images were successfully created from PDF"}
	}

	// Extract image paths from ImageDocument slice
	var imagePaths []string
	for _, doc := range imageDocuments {
		imagePaths = append(imagePaths, doc.ImagePath)
		a.log.Info(fmt.Sprintf("Created image: %s", doc.ImagePath))
	}

	a.log.Info(fmt.Sprintf("Successfully converted PDF to %d images", len(imagePaths)))
	return imagePaths
}

// OCRFromPDF converts a PDF to images and then performs OCR on all pages
func (a *App) OCRFromPDF(pdfPath string) string {
	// Create PDF images loader with JPEG format
	loader := NewPDFImagesLoader(pdfPath).
		WithFormat("jpg").
		WithPDFImagesPath(a.appArgs.PdfToImagesPath)

	// Convert PDF to images
	imageDocuments, err := loader.Load(context.Background())
	if err != nil {
		a.log.Error("Failed to convert PDF to images: " + err.Error())
		return "Error: Failed to convert PDF to images - " + err.Error()
	}

	if len(imageDocuments) == 0 {
		a.log.Error("No images were created from PDF")
		return "Error: No images created from PDF"
	}

	// Initialize OCR
	t, err := ocr.New(ocr.TesseractPath(a.appArgs.TesseractPath))
	if err != nil {
		a.log.Error("Failed to initialize OCR: " + err.Error())
		// Clean up images before returning an error
		err := loader.CleanupImages(imageDocuments)
		if err != nil {
			return err.Error()
		}
	}

	var allText string
	successCount := 0

	a.log.Info(fmt.Sprintf("Starting OCR processing for %d images", len(imageDocuments)))

	// Process each image with OCR
	for i, doc := range imageDocuments {
		a.log.Info(fmt.Sprintf("Processing OCR for page %d/%d: %s", i+1, len(imageDocuments), doc.ImagePath))

		extractedText, err := t.TextFromImageFile(doc.ImagePath)
		if err != nil {
			a.log.Error(fmt.Sprintf("Failed to extract text from page %d: %s", i+1, err.Error()))
			allText += fmt.Sprintf("\n--- Page %d: OCR Failed ---\n", i+1)
			continue
		}

		allText += fmt.Sprintf("\n--- Page %d ---\n", i+1)
		allText += extractedText
		allText += "\n"
		successCount++
	}

	// Clean up temporary images
	err = loader.CleanupOutputDirectory()
	if err != nil {
		a.log.Error("Failed to cleanup temporary images: " + err.Error())
	} else {
		a.log.Info("Cleaned up temporary image files")
	}

	if successCount == 0 {
		return "Error: OCR failed for all pages"
	}

	a.log.Info(fmt.Sprintf("Successfully processed OCR for %d/%d pages", successCount, len(imageDocuments)))

	// Create an output path for a text file
	outputPath := pdfPath[:len(pdfPath)-4] + ".txt"
	if err := SaveAsText(outputPath, "", allText, a.log); err != nil {
		a.log.Error("Failed to save text file: " + err.Error())
		return "Error: Failed to save text file - " + err.Error()
	}

	a.log.Info(fmt.Sprintf("Saved extracted text to: %s", outputPath))

	return allText
}
