import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  Row,
  Spinner,
} from "react-bootstrap";

import { ChooseDocParseDir, CancelProcess } from "../wailsjs/go/main/App.js";
import { LogError, LogInfo } from "../wailsjs/runtime/runtime.js";
import "../public/main.css";

import { useSettingsState, useParserState } from "./StoreConfig.jsx";

export const DocumentParserSettings = () => {
  const DOCUMENT_TYPES = {
    PDF: "pdf",
    TEXT: "text",
    CSV: "csv",
  };

  const INITIAL_FORM_STATE = useMemo(
      () => ({
        indexName: "",
        chunkSize: 0,
        chunkOverlap: 0,
        title: "",
        metaTextDesc: "",
        metaKeyWords: "",
        sourceLocation: "",
      }),
      [],
  );

  const FORM_STORAGE_KEY = "documentParserFormState";

  const { settings } = useSettingsState();

  const {
    isProcessing,
    error,
    processingOutput,
    startDocumentParsing,
    cancelDocumentParsing,
    resetParser,
    loading,
  } = useParserState();

  const [formData, setFormData] = useState(() => {
    const savedFormData = localStorage.getItem(FORM_STORAGE_KEY);
    return savedFormData ? JSON.parse(savedFormData) : INITIAL_FORM_STATE;
  });
  const [selectedDocType, setSelectedDocType] = useState(() => {
    const savedDocType = localStorage.getItem(`${FORM_STORAGE_KEY}_docType`);
    return savedDocType || DOCUMENT_TYPES.PDF;
  });

  // Add state for abort controller
  const [abortController, setAbortController] = useState(null);

  // Save form state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem(`${FORM_STORAGE_KEY}_docType`, selectedDocType);
  }, [selectedDocType]);

  const clearSavedFormState = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
    localStorage.removeItem(`${FORM_STORAGE_KEY}_docType`);
  };

  // Handlers
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleFormSubmit = useCallback(
      async (e) => {
        e.preventDefault();

        const config = {
          selectedDocType,
          indexName: formData.indexName,
          title: formData.title,
          metaTextDesc: formData.metaTextDesc,
          metaKeyWords: formData.metaKeyWords,
          sourceLocation: formData.sourceLocation,
          chunkSize: formData.chunkSize,
          chunkOverlap: formData.chunkOverlap,
        };

        try {
          // Create abort controller for cancellation
          const controller = new AbortController();
          setAbortController(controller);

          await startDocumentParsing(settings, config);

          // Reset form on success
          setFormData(INITIAL_FORM_STATE);
          setSelectedDocType(DOCUMENT_TYPES.PDF);
          clearSavedFormState();
          setAbortController(null);
        } catch (error) {
          LogError(`Error starting document parsing ${error}`);
          setAbortController(null);
        }
      },
      [
        DOCUMENT_TYPES.PDF,
        INITIAL_FORM_STATE,
        formData.metaKeyWords,
        formData.chunkOverlap,
        formData.chunkSize,
        formData.metaTextDesc,
        formData.indexName,
        formData.sourceLocation,
        formData.title,
        selectedDocType,
        settings,
        startDocumentParsing,
      ],
  );

  // Add a cancel handler following the same pattern as InferenceCompletionForm
  const handleCancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      CancelProcess((result) => {
        LogInfo(result);
      }).catch((error) => {
        LogError(error);
      });
      setAbortController(null);
      LogInfo("Document parsing cancelled by user..");
    }
    cancelDocumentParsing();
  }, [abortController, cancelDocumentParsing]);

  const handleResetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setSelectedDocType(DOCUMENT_TYPES.PDF);
    clearSavedFormState();
    resetParser();
  }, [DOCUMENT_TYPES.PDF, INITIAL_FORM_STATE, resetParser]);

  if (loading) {
    return (
        <div
            className="d-flex justify-content-center align-items-center theme-container"
            style={{ minHeight: "300px" }}
        >
          <div className="text-center">
            <Spinner
                animation="border"
                role="status"
                style={{ width: "2rem", height: "2rem", color: "#64748b" }}
            >
              <span className="visually-hidden">Loading settings...</span>
            </Spinner>
            <div
                className="mt-2 fw-medium"
                style={{ color: "#cbd5e1", fontSize: "0.875rem" }}
            >
              Loading configuration...
            </div>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="theme-container">
          <Alert className="m-2 alert-danger">
            <Alert.Heading className="h6">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Configuration Error
            </Alert.Heading>
            <small>Error loading settings: {error.message}</small>
          </Alert>
        </div>
    );
  }

  return (
      <div className="theme-container">
        {/* Header */}
        <Card className="theme-theme-header-card theme-extra-compact-spacing">
          <Card.Body className="py-2 px-3">
            <div className="d-flex align-items-center">
              <i
                  className="bi bi-file-earmark-binary me-2 theme-icon"
                  style={{ fontSize: "1.1rem" }}
              ></i>
              <div>
                <h5 className="mb-0" style={{ fontSize: "1rem" }}>
                  Document Parser & Indexing
                </h5>
                <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                  Process and index documents for AI vector search and analysis
                </small>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Main Form */}
        <Card className="theme-main-card theme-extra-compact-spacing">
          <Card.Body className="p-3">
            <Form onSubmit={handleFormSubmit}>
              {/* Document Type Selection */}
              <div className="theme-doc-type-section theme-compact-spacing">
                <h6 className="theme-section-title">
                  <i className="bi bi-file-earmark me-1"></i>
                  Document Type
                </h6>
                <Form.Group>
                  <Form.Label className="theme-form-control" column={1}>
                    Select Document Format
                  </Form.Label>
                  <div className="d-flex gap-2">
                    {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                        <Form.Check
                            key={value}
                            type="radio"
                            id={`docType-${value}`}
                            name="documentType"
                            value={value}
                            checked={selectedDocType === value}
                            onChange={(e) => setSelectedDocType(e.target.value)}
                            label={
                              <span className="d-flex align-items-center">
                          <Badge
                              bg={
                                selectedDocType === value ? "secondary" : "dark"
                              }
                              className="me-1"
                              style={{ fontSize: "0.65rem" }}
                          >
                            {key}
                          </Badge>
                          <span style={{ fontSize: "0.8rem" }}>
                            {key} Documents
                          </span>
                        </span>
                            }
                        />
                    ))}
                  </div>
                </Form.Group>
              </div>

              {/* Source Location */}
              <div className="theme-compact-spacing">
                <h6 className="theme-section-title">
                  <i className="bi bi-folder2-open me-1"></i>
                  Source Configuration
                </h6>
                <Form.Group>
                  <Form.Label
                      htmlFor="sourceLocation"
                      className="theme-form-control"
                      column={"lg"}
                  >
                    Document Source Location
                  </Form.Label>
                  <InputGroup size="sm">
                    <Form.Control
                        id="sourceLocation"
                        name="sourceLocation"
                        type="text"
                        value={formData.sourceLocation}
                        onChange={handleFormChange}
                        placeholder="Select folder containing documents to process..."
                        className="theme-form-control"
                        required
                    />
                    <Button
                        className="theme-input-group-button"
                        onClick={() => {
                          ChooseDocParseDir().then((dir) => {
                            if (dir && !dir.includes("Error")) {
                              setFormData({ ...formData, sourceLocation: dir });
                            }
                          });
                        }}
                    >
                      <i className="bi bi-folder2-open me-1"></i>
                      Browse
                    </Button>
                  </InputGroup>
                  <Form.Text style={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                    <i className="bi bi-info-circle me-1"></i>
                    Select the directory containing your documents for processing
                  </Form.Text>
                </Form.Group>
              </div>

              {/* Document Metadata */}
              <Card className="theme-nested-card theme-compact-spacing">
                <Card.Body className="p-2">
                  <h6 className="theme-section-title">
                    <i className="bi bi-tags me-1"></i>
                    Document Metadata
                  </h6>

                  <Row className="g-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label
                            htmlFor="indexName"
                            className="theme-form-label"
                            column={"lg"}
                        >
                          Index Name
                        </Form.Label>
                        <Form.Control
                            id="indexName"
                            name="indexName"
                            type="text"
                            value={formData.indexName}
                            onChange={handleFormChange}
                            placeholder="e.g., document-meta-index"
                            className="theme-form-control"
                            size="sm"
                            required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label
                            htmlFor="title"
                            className="theme-form-label"
                            column={"lg"}
                        >
                          Document Title
                        </Form.Label>
                        <Form.Control
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleFormChange}
                            placeholder="Document title"
                            className="formControl"
                            size="sm"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label
                            htmlFor="metaKeyWords"
                            className="theme-form-label"
                            column={"lg"}
                        >
                          Meta Keywords
                        </Form.Label>
                        <Form.Control
                            id="metaKeyWords"
                            name="metaKeyWords"
                            type="text"
                            value={formData.metaKeyWords}
                            onChange={handleFormChange}
                            placeholder="Meta Keywords"
                            className="theme-form-control"
                            size="sm"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label
                            htmlFor="metaTextDesc"
                            className="theme-form-label"
                            column={"lg"}
                        >
                          Meta Text Desc
                        </Form.Label>
                        <Form.Control
                            id="metaTextDesc"
                            name="metaTextDesc"
                            type="text"
                            value={formData.metaTextDesc}
                            onChange={handleFormChange}
                            placeholder="Meta Text Desc"
                            className="theme-form-control"
                            size="sm"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Processing Configuration */}
              <Card className="theme-nested-card theme-compact-spacing">
                <Card.Body className="p-2">
                  <h6 className="theme-section-title">
                    <i className="bi bi-cpu me-1"></i>
                    Processing Configuration
                  </h6>

                  <Row className="g-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label
                            htmlFor="chunkSize"
                            className="theme-form-label"
                            column={"lg"}
                        >
                          Chunk Size
                        </Form.Label>
                        <Form.Control
                            id="chunkSize"
                            name="chunkSize"
                            type="number"
                            value={formData.chunkSize}
                            onChange={handleFormChange}
                            placeholder="1000"
                            min="100"
                            max="10000"
                            className="theme-form-control"
                            size="sm"
                            required
                        />
                        <Form.Text
                            style={{ color: "#94a3b8", fontSize: "0.7rem" }}
                        >
                          Number of characters per text chunk (100-10000)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label
                            htmlFor="chunkOverlap"
                            className="theme-form-label"
                            column={"lg"}
                        >
                          Chunk Overlap
                        </Form.Label>
                        <Form.Control
                            id="chunkOverlap"
                            name="chunkOverlap"
                            type="number"
                            value={formData.chunkOverlap}
                            onChange={handleFormChange}
                            placeholder="200"
                            min="0"
                            max="1000"
                            className="theme-form-control"
                            size="sm"
                            required
                        />
                        <Form.Text
                            style={{ color: "#94a3b8", fontSize: "0.7rem" }}
                        >
                          Character overlap between chunks (0-1000)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end theme-button-group">
                <Button
                    type="button"
                    onClick={handleResetForm}
                    disabled={isProcessing}
                    className="btn-outline-secondary"
                    size="sm"
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Reset Form
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
                    type="submit"
                    disabled={isProcessing}
                    className="btn-primary"
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
                        <i className="bi bi-play-circle me-1"></i>
                        Start Processing
                      </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Processing Results */}
        {(processingOutput || isProcessing) && (
            <Card className="theme-main-card">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center mb-2">
                  <i
                      className="bi bi-terminal me-2 theme-icon"
                      style={{ fontSize: "1rem" }}
                  ></i>
                  <h6 className="mb-0 theme-section-title">Processing Results</h6>
                </div>

                {isProcessing && !processingOutput && (
                    <div className="text-center py-3">
                      <Spinner
                          animation="border"
                          role="status"
                          style={{ width: "2rem", height: "2rem", color: "#64748b" }}
                      >
                        <span className="visually-hidden">Processing...</span>
                      </Spinner>
                      <div className="mt-2">
                        <strong style={{ color: "#e2e8f0", fontSize: "0.875rem" }}>
                          Processing documents...
                        </strong>
                        <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                          This may take several minutes depending on document size and
                          quantity.
                        </div>
                      </div>
                    </div>
                )}

                {processingOutput && (
                    <div className="position-relative">
                <pre
                    className="p-2 rounded theme-terminal-output"
                    style={{
                      fontSize: "0.75rem",
                      maxHeight: "250px",
                      overflow: "auto",
                      fontFamily:
                          "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    }}
                >
                  {processingOutput}
                </pre>
                    </div>
                )}
              </Card.Body>
            </Card>
        )}
      </div>
  );
};