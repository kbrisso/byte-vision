import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Spinner } from "react-bootstrap";

import "../public/main.css";
import { LogError } from "../wailsjs/runtime/runtime.js";
import { GetPDFAsBase64 } from "../wailsjs/go/main/App.js";

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// Professional styles matching the existing theme
const pdfViewerStyles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#1e293b",
    borderRadius: "0.5rem",
    overflow: "hidden",
  },
  toolbar: {
    backgroundColor: "#0f172a",
    borderBottom: "1px solid #64748b",
    padding: "0.75rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
  },
  toolbarSection: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  pageInfo: {
    color: "#f8f9fa",
    fontSize: "0.9rem",
    fontWeight: "500",
    letterSpacing: "0.25px",
  },
  zoomInfo: {
    color: "#adb5bd",
    fontSize: "0.75rem",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#64748b",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#64748b",
    color: "#f8f9fa",
    borderRadius: "0.375rem",
    padding: "0.375rem 0.75rem",
    fontSize: "0.75rem",
    fontWeight: "500",
    transition: "all 0.15s ease-in-out",
    cursor: "pointer",
    minWidth: "auto",
  },
  buttonHover: {
    backgroundColor: "#5a6268",
    borderColor: "#545b62",
    transform: "translateY(-1px)",
  },
  buttonDisabled: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
    color: "#6c757d",
    cursor: "not-allowed",
    transform: "none",
  },
  documentContainer: {
    flex: 1,
    overflowY: "auto",
    overflowX: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "1rem",
    backgroundColor: "#2c3034",
    scrollbarWidth: "thin",
    scrollbarColor: "#6c757d #2c3034",
  },
  documentWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "100%",
  },
  pageWrapper: {
    marginBottom: "1rem",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    borderRadius: "0.5rem",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    color: "#f8f9fa",
    fontSize: "0.95rem",
    gap: "1rem",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    color: "#dc3545",
    fontSize: "0.95rem",
    textAlign: "center",
    padding: "2rem",
  },
  errorIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
    opacity: 0.6,
  },
  spinner: {
    marginBottom: "0.75rem",
  },
  textFallback: {
    flex: 1,
    overflowY: "auto",
    padding: "1.5rem",
    backgroundColor: "#1e293b",
    color: "#f8f9fa",
    fontSize: "0.9rem",
    lineHeight: "1.6",
    fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    whiteSpace: "pre-wrap",
    scrollbarWidth: "thin",
    scrollbarColor: "#6c757d #1e293b",
  },
};

const PDFDocumentViewer = ({
  documentContent,
  sourceLocation,
  loading = false,
  onError = null,
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfError, setPdfError] = useState(null);
  const [renderMode, setRenderMode] = useState("pdf"); // 'pdf' or 'text'

  const [hoveredPrevButton, setHoveredPrevButton] = useState(false);
  const [hoveredNextButton, setHoveredNextButton] = useState(false);
  const [hoveredZoomInButton, setHoveredZoomInButton] = useState(false);
  const [hoveredZoomOutButton, setHoveredZoomOutButton] = useState(false);
  const [hoveredResetButton, setHoveredResetButton] = useState(false);
  const [hoveredTextButton, setHoveredTextButton] = useState(false);

  const [pdfData, setPdfData] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  useRef(null);

  // Reset state when document changes
  useEffect(() => {
    setPageNumber(1);
    setNumPages(null);
    setPdfError(null);
    setScale(1.0);
    setRenderMode("pdf");
  }, [documentContent, sourceLocation]);

  // Load PDF data when sourceLocation changes
  useEffect(() => {
    if (sourceLocation) {
      const loadPDF = async () => {
        try {
          setLoadingPdf(true);
          setPdfError(null);

          // Get PDF as base64 from Go backend
          const base64Data = await GetPDFAsBase64(sourceLocation);
          const dataUrl = `data:application/pdf;base64,${base64Data}`;
          setPdfData(dataUrl);
        } catch (error) {
          setPdfError(error);
          if (onError) {
            onError(error);
          }
          LogError(`Failed to load PDF: ${error}`);
        } finally {
          setLoadingPdf(false);
        }
      };

      loadPDF().catch();
    }
  }, [onError, sourceLocation]);

  // Determine if we should try to render as PDF
  const isPDFFile = useCallback(() => {
    if (!sourceLocation) return false;
    const extension = sourceLocation.toLowerCase().split(".").pop();
    return extension === "pdf";
  }, [sourceLocation]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPdfError(null);
  }, []);

  const onDocumentLoadError = useCallback(
    (error) => {
      LogError(`PDF load error: ${error}`);
      setPdfError(error);
      if (onError) {
        onError(error);
      }
    },
    [onError],
  );
  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  const toggleTextMode = useCallback(() => {
    setRenderMode((prev) => (prev === "pdf" ? "text" : "pdf"));
  }, []);

  const renderToolbar = () => (
    <div style={pdfViewerStyles.toolbar}>
      <div style={pdfViewerStyles.toolbarSection}>
        {renderMode === "pdf" && numPages && (
          <>
            <button
              style={{
                ...pdfViewerStyles.button,
                ...(hoveredPrevButton ? pdfViewerStyles.buttonHover : {}),
                ...(pageNumber <= 1 ? pdfViewerStyles.buttonDisabled : {}),
              }}
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              onMouseEnter={() => setHoveredPrevButton(true)}
              onMouseLeave={() => setHoveredPrevButton(false)}
              title="Previous page"
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            <span style={pdfViewerStyles.pageInfo}>
              Page {pageNumber} of {numPages}
            </span>

            <button
              style={{
                ...pdfViewerStyles.button,
                ...(hoveredNextButton ? pdfViewerStyles.buttonHover : {}),
                ...(pageNumber >= numPages
                  ? pdfViewerStyles.buttonDisabled
                  : {}),
              }}
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              onMouseEnter={() => setHoveredNextButton(true)}
              onMouseLeave={() => setHoveredNextButton(false)}
              title="Next page"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </>
        )}
      </div>

      <div style={pdfViewerStyles.toolbarSection}>
        {renderMode === "pdf" && (
          <>
            <span style={pdfViewerStyles.zoomInfo}>
              {Math.round(scale * 100)}%
            </span>

            <button
              style={{
                ...pdfViewerStyles.button,
                ...(hoveredZoomOutButton ? pdfViewerStyles.buttonHover : {}),
                ...(scale <= 0.5 ? pdfViewerStyles.buttonDisabled : {}),
              }}
              onClick={zoomOut}
              disabled={scale <= 0.5}
              onMouseEnter={() => setHoveredZoomOutButton(true)}
              onMouseLeave={() => setHoveredZoomOutButton(false)}
              title="Zoom out"
            >
              <i className="bi bi-zoom-out"></i>
            </button>

            <button
              style={{
                ...pdfViewerStyles.button,
                ...(hoveredResetButton ? pdfViewerStyles.buttonHover : {}),
              }}
              onClick={resetZoom}
              onMouseEnter={() => setHoveredResetButton(true)}
              onMouseLeave={() => setHoveredResetButton(false)}
              title="Reset zoom"
            >
              <i className="bi bi-aspect-ratio"></i>
            </button>

            <button
              style={{
                ...pdfViewerStyles.button,
                ...(hoveredZoomInButton ? pdfViewerStyles.buttonHover : {}),
                ...(scale >= 3.0 ? pdfViewerStyles.buttonDisabled : {}),
              }}
              onClick={zoomIn}
              disabled={scale >= 3.0}
              onMouseEnter={() => setHoveredZoomInButton(true)}
              onMouseLeave={() => setHoveredZoomInButton(false)}
              title="Zoom in"
            >
              <i className="bi bi-zoom-in"></i>
            </button>
          </>
        )}

        {isPDFFile() && (
          <button
            style={{
              ...pdfViewerStyles.button,
              ...(hoveredTextButton ? pdfViewerStyles.buttonHover : {}),
            }}
            onClick={toggleTextMode}
            onMouseEnter={() => setHoveredTextButton(true)}
            onMouseLeave={() => setHoveredTextButton(false)}
            title={
              renderMode === "pdf"
                ? "Switch to text view"
                : "Switch to PDF view"
            }
          >
            <i
              className={`bi bi-${renderMode === "pdf" ? "file-text" : "file-pdf"}`}
            ></i>
          </button>
        )}
      </div>
    </div>
  );
  const renderPDFContent = () => {
    if (loadingPdf || loading) {
      return (
        <div style={pdfViewerStyles.loadingContainer}>
          <Spinner
            animation="border"
            size="sm"
            style={pdfViewerStyles.spinner}
          />
          <span>Loading PDF...</span>
        </div>
      );
    }

    if (pdfError) {
      return (
        <div style={pdfViewerStyles.errorContainer}>
          <i
            className="bi bi-exclamation-triangle"
            style={pdfViewerStyles.errorIcon}
          ></i>
          <h5>Unable to load PDF</h5>
          <p>The document could not be loaded.</p>
          <small>{pdfError.toString()}</small>
        </div>
      );
    }

    if (!pdfData) {
      return (
        <div style={pdfViewerStyles.errorContainer}>
          <i
            className="bi bi-file-earmark"
            style={pdfViewerStyles.errorIcon}
          ></i>
          <h5>No document</h5>
          <p>No PDF document to display.</p>
        </div>
      );
    }

    return (
      <div style={pdfViewerStyles.documentWrapper}>
        <Document
          file={pdfData}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div style={pdfViewerStyles.loadingContainer}>
              <Spinner
                animation="border"
                size="sm"
                style={pdfViewerStyles.spinner}
              />
              <span>Loading PDF...</span>
            </div>
          }
        >
          <div style={pdfViewerStyles.pageWrapper}>
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        </Document>
      </div>
    );
  };

  return (
    <div style={pdfViewerStyles.container}>
      {renderToolbar()}
      <div style={pdfViewerStyles.documentContainer}>{renderPDFContent()}</div>
    </div>
  );
};

export default PDFDocumentViewer;
