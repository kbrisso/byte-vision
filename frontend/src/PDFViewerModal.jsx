import { useCallback } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";

import { LogError } from "../wailsjs/runtime/runtime.js";
import { GetPDFAsBase64 } from "../wailsjs/go/main/App.js"; // Add this import

import PDFDocumentViewer from "./PDFDocumentViewer.jsx";
import "../public/main.css";

const modalStyles = {
  modal: {
    backgroundColor: "transparent !important",
    backdropFilter: "blur(4px)",
    opacity: "0.5 !important",
  },
  modalDialog: {
    maxWidth: "100vw",
    maxHeight: "95vh",
    margin: "2.5vh auto",
  },
  modalContent: {
    backgroundColor: "transparent !important",
    border: "none",
    borderRadius: "0.5rem",
    boxShadow: "none",
    height: "95vh",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    backgroundColor: "#0f172a",
    borderBottom: "1px solid #64748b",
    padding: "1rem 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "0.5rem 0.5rem 0 0",
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#f8f9fa",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  modalBody: {
    padding: "0",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: "#2c3034",
  },
  modalFooter: {
    backgroundColor: "#0f172a",
    borderTop: "1px solid #64748b",
    padding: "1rem 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "0 0 0.5rem 0.5rem",
    flexShrink: 0,
  },
  closeButton: {
    backgroundColor: "#64748b",
    borderColor: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    fontSize: "0.75rem",
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem",
  },
  downloadButton: {
    backgroundColor: "#64748b",
    borderColor: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    fontSize: "0.75rem",
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    color: "#f8f9fa",
    fontSize: "1rem",
    gap: "1rem",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    color: "#dc3545",
    fontSize: "1rem",
    textAlign: "center",
    padding: "2rem",
  },
  errorIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
    opacity: 0.6,
  },
  documentPath: {
    fontSize: "0.8rem",
    color: "#adb5bd",
    fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    backgroundColor: "#1e293b",
    padding: "0.375rem 0.5rem",
    borderRadius: "0.375rem",
    border: "1px solid #64748b",
    maxWidth: "400px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  buttonGroup: {
    display: "flex",
    gap: "0.75rem",
  },
};

const PDFViewerModal = ({
  show,
  onHide,
  sourceLocation,
  documentTitle = null,
  loading = false,
}) => {
  // Extract filename from the source location for display
  const getFileName = useCallback((path) => {
    if (!path) return "Document";
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] || "Document";
  }, []);

  // Handle download functionality
  const handleDownload = useCallback(async () => {
    if (sourceLocation) {
      try {
        // Get PDF as base64 from Go backend (similar to PDFDocumentViewer)
        const base64Data = await GetPDFAsBase64(sourceLocation);

        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${getFileName(sourceLocation)}-${new Date().toISOString().split("T")[0]}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        LogError("PDF download failed: " + error);
      }
    }
  }, [getFileName, sourceLocation]);

  // Handle external opening - modified to work with blob
  const handleOpenExternal = useCallback(async () => {
    if (sourceLocation) {
      try {
        // Get PDF as base64 from Go backend
        const base64Data = await GetPDFAsBase64(sourceLocation);

        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        // Create temporary URL and open in new tab
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${getFileName(sourceLocation)}-${new Date().toISOString().split("T")[0]}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        LogError("PDF external open failed: " + error);
      }
    }
  }, [getFileName, sourceLocation]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onHide();
      }
    },
    [onHide],
  );

  // Render modal content based on state
  const renderModalContent = () => {
    if (loading) {
      return (
        <div style={modalStyles.loadingContainer}>
          <Spinner
            animation="border"
            variant="primary"
            style={{ width: "3rem", height: "3rem" }}
          />
          <div>Loading PDF document...</div>
          <div style={{ fontSize: "0.75rem", color: "#adb5bd" }}>
            Please wait while the document is being prepared
          </div>
        </div>
      );
    }

    if (!sourceLocation) {
      return (
        <div style={modalStyles.errorContainer}>
          <i className="bi bi-file-earmark-x" style={modalStyles.errorIcon}></i>
          <h5>No Document</h5>
          <p>No document source location provided.</p>
          <p style={{ fontSize: "0.75rem", color: "#6c757d" }}>
            Please select a document to view.
          </p>
        </div>
      );
    }

    return (
      <PDFDocumentViewer
        sourceLocation={sourceLocation}
        loading={loading}
        onError={(error) => {
          LogError(`PDF Viewer Error:' ${error}`);
        }}
      />
    );
  };

  if (!show) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      onKeyDown={handleKeyDown}
      size="xl"
      centered
      backdrop="static"
      keyboard={true}
      style={modalStyles.modal}
      dialogClassName="pdf-viewer-modal"
    >
      <div className="p-0, m-0" style={modalStyles.modalDialog}>
        <div style={modalStyles.modalContent}>
          {/* Modal Header */}
          <div style={modalStyles.modalHeader}>
            <div>
              <h5 style={modalStyles.modalTitle}>
                <i className="bi bi-file-earmark-pdf"></i>
                {documentTitle || getFileName(sourceLocation)}
              </h5>
              {sourceLocation && (
                <div style={modalStyles.documentPath} title={sourceLocation}>
                  {sourceLocation}
                </div>
              )}
            </div>
            <Button
              variant="outline-light"
              size="sm"
              onClick={onHide}
              style={modalStyles.closeButton}
            >
              <i className="bi bi-x-lg"></i>
              Close
            </Button>
          </div>

          {/* Modal Body */}
          <div style={modalStyles.modalBody}>{renderModalContent()}</div>

          {/* Modal Footer */}
          {sourceLocation && !loading && (
            <div style={modalStyles.modalFooter}>
              <div style={{ fontSize: "0.75rem", color: "#adb5bd" }}>
                <i className="bi bi-info-circle me-1"></i>
                Use Ctrl+Mouse Wheel to zoom, or use the toolbar controls
              </div>
              <div style={modalStyles.buttonGroup}>
                <Button
                  onClick={handleDownload}
                  style={modalStyles.downloadButton}
                  title="Download PDF file"
                >
                  <i className="bi bi-download"></i>
                  Download
                </Button>
                <Button
                  onClick={handleOpenExternal}
                  style={modalStyles.downloadButton}
                  title="Open in external application"
                >
                  <i className="bi bi-box-arrow-up-right"></i>
                  Open External
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PDFViewerModal;
