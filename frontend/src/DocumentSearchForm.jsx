import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

import {
  CancelProcess,
  GetAllIndices,
  GetDocumentsByFieldsSettings,
} from "../wailsjs/go/main/App.js";
import { LogError, LogInfo } from "../wailsjs/runtime/runtime.js";
import "../public/main.css";

import DocumentQuestionModal from "./DocumentQuestionModal.jsx";
import {
  useDocumentState,
  useSettingsState,
  useUIState,
} from "./StoreConfig.jsx";
import PDFViewerModal from "./PDFViewerModal.jsx";

const DocumentSearchForm = () => {
  // Store state
  const { settings, settingsLoading, settingsError } = useSettingsState();
  const {
    setDocId,
    docId,
    setModalOpen,
    setSelectedIndex,
    setSourceLocation,
    selectedIndexValue,
    documents,
    isSearching,
    searchError,
    // Actions
    setDocuments,
    selectDocument,
    clearSelectedDocument,
    setSearching,
    setSearchResults,
    setSearchError,
    resetSearch,
    setSearchFilters,
    searchFilters,
    sourceLocation,
    abortController,
    setAbortController,
    setQAOpen,
    isQAOpen,
    isViewOpen,
    setViewOpen,
    isValidIndexSelected,
    setIsValidIndexSelected,
    title,
    setTitle,
  } = useDocumentState();

  const { openModal } = useUIState();
  const [indexOptions, setIndexOptions] = useState([]);
  const [sortConfigLocal, setSortConfigLocal] = useState({
    key: null,
    direction: "asc",
  });

  // Form state - using store for searchQuery and local state for other fields
  const [formState, setFormState] = useState({
    title: searchFilters?.title || "",
    metaTextDesc: searchFilters?.metaTextDesc || "",
    metaKeyWords: searchFilters?.metaKeyWords || "",
  });

  const cliState = useMemo(
    () => settings?.llamaCli || {},
    [settings?.llamaCli],
  );
  const embState = useMemo(
    () => settings?.llamaEmbed || {},
    [settings?.llamaEmbed],
  );

  // Load indices on mount
  useEffect(() => {
    const loadIndices = async () => {
      try {
        const indices = await GetAllIndices();
        setIndexOptions(indices);
        if (indices.length > 0) {
          setSelectedIndex(indices[0]);
          setIsValidIndexSelected(true);
        }
      } catch (error) {
        LogError(`Failed to load indices: ${error}`);
      }
    };

    loadIndices().catch((error) => {
      LogError(`Failed to load indices: ${error}`);
    });
  }, [setIsValidIndexSelected, setSelectedIndex]);

  // Update search filters when form changes
  useEffect(() => {
    setSearchFilters({
      title: formState.title,
      metaTextDesc: formState.metaTextDesc,
      metaKeyWords: formState.metaKeyWords,
      indexName: selectedIndexValue,
    });
  }, [formState, selectedIndexValue, setSearchFilters]);

  // Form handlers
  const handleFormChange = useCallback((field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleIndexChange = useCallback(
    (event) => {
      const newValue = event.target.value;
      setSelectedIndex(newValue);
      setIsValidIndexSelected(newValue !== "");
    },
    [setIsValidIndexSelected, setSelectedIndex],
  );

  const handleReset = useCallback(() => {
    setFormState({
      title: "",
      metaTextDesc: "",
      metaKeyWords: "",
    });
    setSelectedIndex("");
    setIsValidIndexSelected(false);
    resetSearch();
    setSortConfigLocal({ key: null, direction: "asc" });
    clearSelectedDocument();
  }, [
    setSelectedIndex,
    setIsValidIndexSelected,
    resetSearch,
    clearSelectedDocument,
  ]);

  // Sorting
  const handleSort = useCallback((key) => {
    setSortConfigLocal((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  }, []);

  const sortedDocuments = useMemo(() => {
    if (!sortConfigLocal.key || !documents.length) return documents;

    return [...documents].sort((a, b) => {
      const aValue = a[sortConfigLocal.key];
      const bValue = b[sortConfigLocal.key];

      if (sortConfigLocal.key === "timestamp") {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortConfigLocal.direction === "asc"
          ? aDate - bDate
          : bDate - aDate;
      }

      if (aValue < bValue) return sortConfigLocal.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfigLocal.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [documents, sortConfigLocal]);

  const getSortIcon = useCallback(
    (columnKey) => {
      if (sortConfigLocal.key !== columnKey) {
        return (
          <i
            className="bi bi-arrow-down-up"
            style={{
              marginLeft: "0.375rem",
              fontSize: "0.6rem",
              color: "#94a3b8",
            }}
          ></i>
        );
      }
      return sortConfigLocal.direction === "asc" ? (
        <i
          className="bi bi-arrow-up"
          style={{
            marginLeft: "0.375rem",
            fontSize: "0.6rem",
            color: "#0d6efd",
          }}
        ></i>
      ) : (
        <i
          className="bi bi-arrow-down"
          style={{
            marginLeft: "0.375rem",
            fontSize: "0.6rem",
            color: "#0d6efd",
          }}
        ></i>
      );
    },
    [sortConfigLocal],
  );

  const handleCloseViewPDFModal = useCallback(() => {
    setViewOpen(false);
    clearSelectedDocument();
  }, [setViewOpen, clearSelectedDocument]);

  const handleCloseQAModal = useCallback(() => {
    setQAOpen(false);
    clearSelectedDocument();
    setModalOpen(false);
  }, [setQAOpen, clearSelectedDocument, setModalOpen]);

  const handleViewDocument = useCallback(
    (sourceLocation, title, event) => {
      event.stopPropagation();
      if (sourceLocation) {
        setViewOpen(true);
        setQAOpen(false);
        setSourceLocation(sourceLocation);
        setTitle(title);
        const isPDF = sourceLocation.toLowerCase().endsWith(".pdf");

        if (isPDF) {
          openModal("pdfViewerModal", {
            sourceLocation,
            title,
            loading: false,
            isQAOpen,
            isViewOpen,
          });
        } else {
          window.open(`file:///${sourceLocation}`, "_blank");
        }
        setModalOpen(true);
      }
    },
    [
      isQAOpen,
      isViewOpen,
      openModal,
      setModalOpen,
      setQAOpen,
      setSourceLocation,
      setTitle,
      setViewOpen,
    ],
  );

  const handleQuestionDocument = useCallback(
    (documentId, sourceLocation, title, event) => {
      event.stopPropagation();
      // Ensure all required values are set before opening modal
      if (!documentId || !sourceLocation) {
        LogError("Missing required document information");
        return;
      }
      setViewOpen(false);
      setQAOpen(true);
      setDocId(documentId);
      setSourceLocation(sourceLocation);
      setTitle(title);
      setModalOpen(true);

      // Open the modal with the values directly
      const document = documents.find((doc) => doc.id === documentId);
      if (document) {
        selectDocument(document);
      }

      openModal("documentQuestion", {
        isOpen: true,
        documentId,
        sourceLocation,
        cliState,
        embState,
        indexValue: selectedIndexValue,
        title,
      });

      setModalOpen(true);
    },
    [
      setViewOpen,
      setQAOpen,
      setDocId,
      setSourceLocation,
      setModalOpen,
      documents,
      openModal,
      cliState,
      embState,
      selectedIndexValue,
      selectDocument,
    ],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSearching(true);
      if (!isValidIndexSelected) {
        setSearchError("Please select an index.");
        return;
      }

      // Cancel any existing request
      if (abortController) {
        abortController.abort();
      }

      // Create a new abort controller for this request
      const newAbortController = new AbortController();
      setAbortController(newAbortController);

      try {
        setSearching(true);
        setDocuments([]);
        setSearchError(null);
        setSortConfigLocal({ key: null, direction: "asc" });
        setSelectedIndex(selectedIndexValue);

        const result = await GetDocumentsByFieldsSettings(
          selectedIndexValue,
          formState.metaKeyWords,
          formState.metaTextDesc,
          formState.title,
        );

        // Check if the request was canceled
        if (newAbortController.signal.aborted) {
          LogError("Search was cancelled by user");
          setSearchError("Search was cancelled by user");
          setDocuments([]);
          return; // This will still go to finally block
        }

        let parsedResult;
        if (typeof result === "string") {
          try {
            parsedResult = JSON.parse(result);
          } catch (parseError) {
            LogError(`Failed to parse search results: ${parseError.message}`);
            setSearchError(
              `Failed to parse search results: ${parseError.message}`,
            );
            setDocuments([]);
            return; // This will still go to finally block
          }
        } else if (Array.isArray(result)) {
          parsedResult = result;
        } else if (result && typeof result === "object") {
          parsedResult = [result];
        } else {
          parsedResult = [];
        }

        const documentsArray = Array.isArray(parsedResult) ? parsedResult : [];
        setDocuments(documentsArray);
        setSearchResults(documentsArray);
      } catch (error) {
        if (error.name === "AbortError" || newAbortController.signal.aborted) {
          LogError("Search was cancelled by user");
          setSearchError("Search was cancelled by user");
          setDocuments([]);
        } else {
          LogError(`Search failed: ${error}`);
          setSearchError(`Search failed: ${error.message || error}`);
          setDocuments([]);
        }
      } finally {
        // This will ALWAYS run, ensuring isSearching is reset
        setSearching(false);
        setAbortController(null);
      }
    },
    [
      setSearching,
      isValidIndexSelected,
      abortController,
      setAbortController,
      setSearchError,
      setDocuments,
      setSelectedIndex,
      selectedIndexValue,
      formState.metaKeyWords,
      formState.metaTextDesc,
      formState.title,
      setSearchResults,
    ],
  );

  // Add cancel function
  const handleCancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      CancelProcess()
        .then((result) => {
          LogInfo(result);
        })
        .catch((error) => {
          LogError(error);
        });
      setSearching(false);
      setAbortController(null);
      LogInfo("Search cancelled by user..");
    }
  }, [abortController, setSearching, setAbortController]);

  // Clean up on unmounting
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const renderTable = () => {
    if (isSearching) {
      return (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "300px" }}
        >
          <div className="text-center">
            <Spinner
              animation="border"
              className="theme-loading-spinner"
              style={{ width: "2rem", height: "2rem" }}
            />
            <div className="theme-loading-text">Searching documents...</div>
          </div>
        </div>
      );
    }
    if (!Array.isArray(documents) || documents.length === 0) {
      return (
        <div
          className="text-center d-flex flex-column justify-content-center align-items-center"
          style={{
            minHeight: "300px",
            color: "var(--text-quaternary)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
          <p className="mb-2">No documents found</p>
          <p className="mb-0" style={{ fontSize: "0.8rem", opacity: 0.7 }}>
            Try adjusting your search criteria or leave fields blank to see all
            documents
          </p>
        </div>
      );
    }

    return (
      <div
        className="theme-scrollbar"
        style={{
          height: "100%",
          overflowY: "auto",
          overflowX: "auto",
          backgroundColor: "var(--bg-tertiary)",
          border: "1px solid var(--border-secondary)",
          borderRadius: "var(--radius-md)",
          padding: 0,
        }}
      >
        <Table
          responsive
          hover
          className="theme-table mb-0"
          style={{
            minWidth: "800px", // Ensure minimum width for proper column display
          }}
        >
          <thead
            className="ttable-bordered"
            style={{
              position: "sticky",
              top: 0,
              backgroundColor: "var(--bg-primary)",
              zIndex: 10,
              borderBottom: "2px solid var(--border-primary)",
            }}
          >
            <tr>
              <th
                style={{ width: "20%", cursor: "pointer", padding: "12px" }}
                onClick={() => handleSort("title")}
              >
                Title {getSortIcon("title")}
              </th>
              <th
                style={{ width: "15%", cursor: "pointer", padding: "12px" }}
                onClick={() => handleSort("metaTextDesc")}
              >
                Meta Desc {getSortIcon("metaTextDesc")}
              </th>
              <th
                style={{ width: "20%", cursor: "pointer", padding: "12px" }}
                onClick={() => handleSort("metaKeyWords")}
              >
                Key Words {getSortIcon("metaKeyWords")}
              </th>
              <th
                style={{ width: "20%", cursor: "pointer", padding: "12px" }}
                onClick={() => handleSort("sourceLocation")}
              >
                Source Location {getSortIcon("sourceLocation")}
              </th>
              <th
                style={{ width: "15%", cursor: "pointer", padding: "12px" }}
                onClick={() => handleSort("timestamp")}
              >
                Date {getSortIcon("timestamp")}
              </th>
              <th style={{ width: "10%", padding: "12px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedDocuments.map((item, index) => (
              <tr key={item.id || index} className="theme-table-row">
                <td
                  className="theme-table-cell"
                  style={{
                    padding: "12px",
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={item.title || "No title"}
                >
                  {item.title || "No title"}
                </td>
                <td
                  className="theme-table-cell"
                  style={{
                    padding: "12px",
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={item.metaTextDesc || "No metaTextDesc"}
                >
                  {item.metaTextDesc || "No metaTextDesc"}
                </td>
                <td
                  className="theme-table-cell"
                  style={{
                    padding: "12px",
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={item.metaKeyWords || "No metaTextDesc"}
                >
                  {item.metaKeyWords || "No metaTextDesc"}
                </td>
                <td
                  className="theme-table-cell"
                  style={{
                    padding: "12px",
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={item.sourceLocation || "No source location"}
                >
                  {item.sourceLocation || "No source location"}
                </td>
                <td
                  style={{
                    padding: "12px",
                    whiteSpace: "nowrap",
                    fontSize: "0.875rem",
                  }}
                >
                  {item.timestamp
                    ? new Date(item.timestamp).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "No date"}
                </td>
                <td
                  style={{
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="theme-btn-secondary me-1"
                    onClick={(e) =>
                      handleViewDocument(item.sourceLocation, item.title, e)
                    }
                    disabled={!item.sourceLocation}
                    title={
                      item.sourceLocation
                        ? "Open document"
                        : "No source location available"
                    }
                  >
                    <i className="bi bi-eye me-1"></i>
                    View
                  </Button>
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="theme-btn-primary"
                    onClick={(e) =>
                      handleQuestionDocument(
                        item.id,
                        item.sourceLocation,
                        item.title,
                        e,
                      )
                    }
                    title="Ask questions about this document"
                  >
                    <i className="bi bi-chat-right-text me-1"></i>
                    Ask
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  if (settingsLoading) {
    return (
      <div className="theme-container" style={{ height: "100vh" }}>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "300px" }}
        >
          <div className="text-center">
            <Spinner
              animation="border"
              className="theme-loading-spinner"
              style={{ width: "2rem", height: "2rem" }}
            />
            <div className="theme-loading-text">Loading configuration...</div>
          </div>
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="theme-container" style={{ height: "100vh" }}>
        <Alert className="theme-alert-danger theme-spacing-sm">
          <Alert.Heading className="h6">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Configuration Error
          </Alert.Heading>
          <small>Error loading settings: {settingsError}</small>
        </Alert>
      </div>
    );
  }

  return (
    <div
      className="theme-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Search Error Display */}
      {searchError && (
        <Alert
          className="theme-alert-danger theme-spacing-sm"
          style={{ flexShrink: 0 }}
        >
          <Alert.Heading className="h6">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Search Error
          </Alert.Heading>
          <small>{searchError}</small>
        </Alert>
      )}

      {/* Header */}
      <Card
        className="theme-header-card theme-spacing-sm"
        style={{ flexShrink: 0 }}
      >
        <Card.Body className="py-2 px-3">
          <div className="d-flex align-items-center">
            <i
              className="bi bi-search me-2 theme-icon"
              style={{ fontSize: "1.1rem" }}
            ></i>
            <div>
              <h5 className="mb-0" style={{ fontSize: "1rem" }}>
                Document Search & Analysis
              </h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                Search through documents and perform AI-powered analysis
              </small>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Main Content */}
      <Card
        className="theme-main-card"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Card.Body
          className="p-3"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Search Form */}
          <div className="theme-spacing-md" style={{ flexShrink: 0 }}>
            <h6 className="theme-section-title">
              <i className="bi bi-funnel me-1"></i>
              Search Filters
            </h6>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="theme-form-label">Index</Form.Label>
                    <Form.Select
                      value={selectedIndexValue}
                      onChange={handleIndexChange}
                      className="theme-form-control"
                      required
                    >
                      <option value="">Select an index...</option>
                      {indexOptions.map((index) => (
                        <option key={index} value={index}>
                          {index}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="theme-form-label">Title</Form.Label>
                    <Form.Control
                      type="text"
                      value={formState.title}
                      onChange={(e) =>
                        handleFormChange("title", e.target.value)
                      }
                      placeholder="Enter document title..."
                      className="theme-form-control"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="theme-form-label">
                      Meta Text Desc
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formState.metaTextDesc}
                      onChange={(e) =>
                        handleFormChange("metaTextDesc", e.target.value)
                      }
                      placeholder="Enter metaTextDesc name..."
                      className="theme-form-control"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="theme-form-label">
                      Meta Keywords
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formState.metaKeyWords}
                      onChange={(e) =>
                        handleFormChange("metaKeyWords", e.target.value)
                      }
                      placeholder="Enter metaTextDesc..."
                      className="theme-form-control"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="outline-secondary"
                  onClick={handleReset}
                  className="theme-btn-secondary"
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Reset
                </Button>
                {isSearching && (
                  <Button
                    variant="outline-danger"
                    onClick={handleCancel}
                    className="theme-btn-danger"
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSearching || !isValidIndexSelected}
                  className="theme-btn-primary"
                >
                  {isSearching ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        className="me-1"
                      />
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search me-1"></i>
                      Search
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </div>

          {/* Results Section */}
          <div
            className="theme-spacing-md"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <h6 className="theme-section-title" style={{ flexShrink: 0 }}>
              <i className="bi bi-table me-1"></i>
              Search Results
              {documents.length > 0 && (
                <span className="ms-2 badge bg-primary">
                  {documents.length}
                </span>
              )}
            </h6>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              {renderTable()}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Document Question Modal */}
      <DocumentQuestionModal
        show={isQAOpen}
        handleClose={handleCloseQAModal}
        cliState={cliState}
        embState={embState}
        docId={docId}
        indexValue={selectedIndexValue}
        sourceLocation={sourceLocation}
        title={title}
      />
      <PDFViewerModal
        sourceLocation={sourceLocation}
        loading={settingsLoading}
        show={isViewOpen}
        placeholder={title}
        onHide={handleCloseViewPDFModal}
      />
    </div>
  );
};

export default DocumentSearchForm;
