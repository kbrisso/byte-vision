import { useCallback, useState } from "react";
import { Alert, Button, Card, Form, Spinner } from "react-bootstrap";

import { ChooseDocParseDir, OCRFromPDF, CancelProcess } from "../wailsjs/go/main/App.js";
import { LogError, LogInfo } from "../wailsjs/runtime/runtime.js";
import "../public/main.css";

export const DocumentOCRSettings = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [error, setError] = useState("");

  // Add state for abort controller
  const [abortController, setAbortController] = useState(null);

  const getFileExtension = (filePath) => {
    return filePath.split(".").pop().toLowerCase();
  };

  const isPDFFile = (filePath) => {
    return getFileExtension(filePath) === "pdf";
  };

  const handleSelectAndProcess = async () => {
    try {
      setError("");
      setIsProcessing(true);

      // Create abort controller for cancellation
      const controller = new AbortController();
      setAbortController(controller);

      // Select file (image or PDF)
      const filePath = await ChooseDocParseDir();
      if (!filePath || filePath.startsWith("Error:")) {
        if (filePath && filePath.startsWith("Error:")) {
          setError(filePath);
        }
        setAbortController(null);
        return;
      }

      setSelectedFile(filePath);
      setExtractedText("");

      // Check the file type and call the appropriate OCR method
      let result;
      if (isPDFFile(filePath)) {
        result = await OCRFromPDF(filePath);
      }

      if (result.startsWith("Error:")) {
        setError(result);
      } else {
        setExtractedText(result);
      }

      setAbortController(null);
    } catch (err) {
      setError("Failed to process file: " + err.message);
      setAbortController(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add cancel handler following the same pattern as other components
  const handleCancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      CancelProcess((result) => {
        LogInfo(result);
      }).catch((error) => {
        LogError(error);
      });
      setAbortController(null);
      LogInfo("OCR processing cancelled by user..");
    }
    setIsProcessing(false);
  }, [abortController]);

  const clearResults = () => {
    setSelectedFile("");
    setExtractedText("");
    setError("");
  };

  const getFileTypeIcon = () => {
    if (!selectedFile) return "bi-file-earmark";
    return isPDFFile(selectedFile) ? "bi-file-pdf" : "bi-file-image";
  };

  return (
      <div className="document-ocr-container">
        {/* Header */}
        <Card className="theme-header-card document-ocr-extra-compact-spacing">
          <Card.Body className="py-2 px-3">
            <div className="d-flex align-items-center">
              <i
                  className="bi bi-file-text me-2"
                  style={{ fontSize: "1.1rem", color: "document-ocr-icon" }}
              ></i>
              <div>
                <h5 className="mb-0" style={{ fontSize: "1rem" }}>
                  OCR Document Processing
                </h5>
                <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                  Extract text from PDF documents and images using OCR technology
                </small>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Main Content */}
        <Card className="document-ocr-main-card document-ocr-extra-compact-spacing">
          <Card.Body className="p-3">
            {/* Controls Section */}
            <div className="theme-compact-spacing">
              <h6 className="document-ocr-section-title">
                <i className="bi bi-upload me-1"></i>
                File Processing
              </h6>

              <div className="d-flex theme-button-group">
                <Button
                    onClick={handleSelectAndProcess}
                    disabled={isProcessing}
                    className="theme-btn-primary"
                    size="sm"
                >
                  {isProcessing ? (
                      <>
                        <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-1"
                        />
                        Processing...
                      </>
                  ) : (
                      <>
                        <i className="bi bi-file-earmark-text me-1"></i>
                        Select & Process File
                      </>
                  )}
                </Button>
                {isProcessing && (
                    <Button
                        type="button"
                        onClick={handleCancel}
                        className="btn-outline-danger"
                        size="sm"
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Cancel Process
                    </Button>
                )}
                <Button
                    onClick={clearResults}
                    disabled={isProcessing || (!selectedFile && !extractedText)}
                    className="document-ocr-secondary-button"
                    size="sm"
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Clear
                </Button>
              </div>
            </div>

            {/* Selected File Display */}
            {selectedFile && (
                <div className="document-ocr-file-label document-ocr-compact-spacing">
                  <div className="d-flex align-items-center">
                    <i
                        className={`${getFileTypeIcon()} me-2`}
                        style={{ color: "document-ocr-icon" }}
                    ></i>
                    <div>
                      <div>
                        <small style={{ color: "#cbd5e1", fontSize: "0.7rem" }}>
                          FILE:{" "}
                        </small>
                        <small
                            style={{
                              color: "#f8fafc",
                              fontWeight: "700",
                              fontSize: "0.75rem",
                            }}
                        >
                          {selectedFile.split("/").pop() ||
                              selectedFile.split("\\").pop()}
                        </small>
                      </div>
                      <div>
                        <small style={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                          Type:{" "}
                          {isPDFFile(selectedFile) ? "PDF Document" : "Image File"}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <Alert className="document-ocr-alert-danger document-ocr-compact-spacing py-2">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error.replace("Error: ", "")}
                </Alert>
            )}

            {/* Results Display */}
            {extractedText && (
                <div className="document-ocr-compact-spacing">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label
                        className="mb-0 document-ocr-form-label"
                        column={"sm"}
                    >
                      Extracted Text
                    </Form.Label>
                    <small style={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                      {extractedText.length} characters
                    </small>
                  </div>
                  <Form.Control
                      as="textarea"
                      rows={10}
                      value={extractedText}
                      readOnly
                      className="document-ocr-text-area"
                      placeholder="Extracted text will appear here..."
                  />
                </div>
            )}

            {/* Empty State */}
            {!selectedFile && !extractedText && !error && !isProcessing && (
                <div className="empty-state-icon">
                  <i
                      className="bi bi-files"
                      style={{
                        fontSize: "3rem",
                        color: "document-ocr-icon",
                        marginBottom: "1rem",
                        display: "block",
                      }}
                  ></i>
                  <p className="mb-1" style={{ fontWeight: "700" }}>
                    Select a file to extract text using OCR
                  </p>
                  <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                    Supported formats: PDF, PNG, JPG, JPEG, TIFF, BMP
                  </small>
                </div>
            )}
          </Card.Body>
        </Card>

        {/* Info Card */}
        <Card className="document-ocr-main-card">
          <Card.Body className="p-3">
            <Alert className="document-ocr-alert-info py-2 mb-0">
              <div className="d-flex align-items-start">
                <i
                    className="bi bi-info-circle me-2 mt-1"
                    style={{ fontSize: "0.875rem" }}
                ></i>
                <div>
                  <div style={{ fontWeight: "700", marginBottom: "0.375rem" }}>
                    OCR Processing Information
                  </div>
                  <small style={{ lineHeight: "1.3" }}>
                    This tool uses Optical Character Recognition (OCR) to extract
                    text from PDF documents and images. Processing time depends on
                    file size and complexity. For best results, use high-quality,
                    clear images or PDFs.
                  </small>
                </div>
              </div>
            </Alert>
          </Card.Body>
        </Card>
      </div>
  );
};
