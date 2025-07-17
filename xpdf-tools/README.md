## Overview

XPDF is a powerful PDF manipulation toolkit that provides command-line utilities for extracting text, images, and metadata from PDF documents. Byte Vision uses these tools for comprehensive document processing, including:

- **Direct text extraction** from text-based PDFs
- **Image extraction for OCR processing** from scanned PDFs or PDFs containing text as images
- **Metadata retrieval** for document analysis
- **Page-to-image conversion** for visual previews

### Critical for OCR Functionality

Many PDFs contain text as images rather than selectable text (common with scanned documents, older PDFs, or image-based documents). For these documents, XPDF tools are **essential** for the OCR (Optical Character Recognition) workflow:

1. **`pdfimages.exe`** extracts embedded images from PDF pages
2. **OCR Engine** then processes these images to extract readable text
3. **Byte Vision** combines both direct text extraction and OCR results for comprehensive document analysis

Without XPDF tools, the application cannot process image-based PDFs, significantly limiting document analysis capabilities.

## Required Executables

The following XPDF utilities are used by Byte Vision:

| Utility | Purpose | OCR Role |
|---------|---------|----------|
| `pdftotext.exe` | Extract direct text content from PDF files | Primary text extraction |
| `pdfimages.exe` | **Extract images from PDF files** | **Primary tool for OCR image extraction** |

## Usage in Application

XPDF tools are integrated into the following application features:

- **Document Text Extraction**: Converts PDF content to searchable text
- **OCR Processing**: **Extracts images from scanned PDFs for text recognition**

This workflow is crucial for processing:
- Scanned documents
- Legacy PDFs
- Image-based reports
- Screenshots saved as PDFs
- Documents with embedded charts/diagrams containing text
- 
## Installation

### Automatic Installation (Recommended)

The XPDF tools are already included in this directory structure:

### Manual Installation

If you need to reinstall or update XPDF tools:

1. **Download XPDF Tools**
    - Visit: https://www.xpdfreader.com/download.html
    - Download the appropriate version for your architecture

2. **Extract to Project Directory**
   ```bash
   # Extract downloaded archive to xpdf-tools directory
   unzip xpdf-tools-win-x.xx.zip -d xpdf-tools/
   ```

3. **Verify Installation**
   ```bash
   # Test pdftotext utility
   ./xpdf-tools/bin64/pdftotext.exe -v
   ```

## Architecture Selection

The application automatically selects the appropriate binary directory based on your system:

- **Windows 64-bit**: Uses `bin64/` directory
- **Windows 32-bit**: Uses `bin32/` directory
- **ARM Architecture**: Uses `binARM/` directory


## Configuration

### Environment Variables

The application automatically configures the XPDF tools path. No manual environment setup is required.

### Path Configuration

XPDF tools are accessed via relative paths from the application root:

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Ensure executables have proper permissions
   chmod +x xpdf-tools/bin64/*.exe
   ```

2. **Missing Dependencies**
    - Ensure Visual C++ Redistributable is installed on Windows
    - Download from: https://aka.ms/vs/17/release/vc_redist.x64.exe

3. **Architecture Mismatch**
    - Verify you're using the correct binary directory for your system
    - Check system architecture: `systeminfo | findstr "System Type"`

### Verification Commands

```bash
# Test text extraction
./xpdf-tools/bin64/pdftotext.exe -help

# Test PDF info
./xpdf-tools/bin64/pdfinfo.exe -help

# Test image conversion
./xpdf-tools/bin64/pdftoppm.exe -help
```

