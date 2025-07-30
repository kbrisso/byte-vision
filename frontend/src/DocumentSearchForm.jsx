import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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

// Constants for better maintainability
const INITIAL_FORM_STATE = {
  title: "",
  metaTextDesc: "",
  metaKeyWords: "",
};

const INITIAL_SORT_CONFIG = {
  key: null,
  direction: "asc",
};

const TABLE_COLUMNS = [
  { key: "title", label: "Title", width: "20%" },
  { key: "metaTextDesc", label: "Meta Desc", width: "15%" },
  { key: "metaKeyWords", label: "Key Words", width: "20%" },
  { key: "sourceLocation", label: "Source Location", width: "20%" },
  { key: "timestamp", label: "Date", width: "15%" },
  { key: "actions", label: "Actions", width: "10%", sortable: false },
];

// Custom hooks for better separation of concerns
const useFormState = (initialFilters) => {
  const [formState, setFormState] = useState({
    title: initialFilters?.title || "",
    metaTextDesc: initialFilters?.metaTextDesc || "",
    metaKeyWords: initialFilters?.metaKeyWords || "",
  });

  const handleFormChange = useCallback((field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
  }, []);

  return { formState, handleFormChange, resetForm };
};

const useIndexSelection = () => {
  const [indexOptions, setIndexOptions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState("");
  const [isValidIndex, setIsValidIndex] = useState(false);

  const loadIndices = useCallback(async () => {
    try {
      const indices = await GetAllIndices();
      setIndexOptions(indices);
      if (indices.length > 0) {
        setSelectedIndex(indices[0]);
        setIsValidIndex(true);
      }
    } catch (error) {
      LogError(`Failed to load indices: ${error}`);
    }
  }, []);

  const handleIndexChange = useCallback((value) => {
    setSelectedIndex(value);
    setIsValidIndex(value !== "");
  }, []);

  const resetIndex = useCallback(() => {
    setSelectedIndex("");
    setIsValidIndex(false);
  }, []);

  return {
    indexOptions,
    selectedIndex,
    isValidIndex,
    loadIndices,
    handleIndexChange,
    resetIndex,
  };
};

const useSorting = (documents) => {
  const [sortConfig, setSortConfig] = useState(INITIAL_SORT_CONFIG);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const sortedDocuments = useMemo(() => {
    if (!sortConfig.key || !documents.length) return documents;

    return [...documents].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === "timestamp") {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [documents, sortConfig]);

  const getSortIcon = useCallback(
    (columnKey) => {
      if (sortConfig.key !== columnKey) {
        return (
          <i
            className="bi bi-arrow-down-up"
            style={{
              marginLeft: "0.375rem",
              fontSize: "0.6rem",
              color: "#94a3b8",
            }}
          />
        );
      }
      return sortConfig.direction === "asc" ? (
        <i
          className="bi bi-arrow-up"
          style={{
            marginLeft: "0.375rem",
            fontSize: "0.6rem",
            color: "#0d6efd",
          }}
        />
      ) : (
        <i
          className="bi bi-arrow-down"
          style={{
            marginLeft: "0.375rem",
            fontSize: "0.6rem",
            color: "#0d6efd",
          }}
        />
      );
    },
    [sortConfig],
  );

  const resetSort = useCallback(() => {
    setSortConfig(INITIAL_SORT_CONFIG);
  }, []);

  return { sortedDocuments, handleSort, getSortIcon, resetSort };
};

// Utility functions
const formatDate = (timestamp) => {
  if (!timestamp) return "No date";
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseSearchResults = (result) => {
  if (typeof result === "string") {
    try {
      return JSON.parse(result);
    } catch (parseError) {
      throw new Error(`Failed to parse search results: ${parseError.message}`);
    }
  } else if (Array.isArray(result)) {
    return result;
  } else if (result && typeof result === "object") {
    return [result];
  }
  return [];
};

// Main component
const DocumentSearchForm = () => {
  // Store state
  const { settings, settingsLoading, settingsError } = useSettingsState();
  const {
    documents,
    isSearching,
    searchError,
    searchFilters,
    abortController,
    isQAOpen,
    isViewOpen,
    docId,
    sourceLocation,
    title,
    // Actions
    setDocuments,
    selectDocument,
    clearSelectedDocument,
    setSearching,
    setSearchResults,
    setSearchError,
    resetSearch,
    setSearchFilters,
    setAbortController,
    setQAOpen,
    setViewOpen,
    setDocId,
    setSourceLocation,
    setTitle,
    setModalOpen,
  } = useDocumentState();

  const { openModal } = useUIState();

  // Custom hooks
  const { formState, handleFormChange, resetForm } =
    useFormState(searchFilters);
  const {
    indexOptions,
    selectedIndex,
    isValidIndex,
    loadIndices,
    handleIndexChange,
    resetIndex,
  } = useIndexSelection();
  const { sortedDocuments, handleSort, getSortIcon, resetSort } =
    useSorting(documents);

  // Refs for cleanup
  const abortControllerRef = useRef(null);

  // Memoized values
  const cliState = useMemo(
    () => settings?.llamaCli || {},
    [settings?.llamaCli],
  );
  const embState = useMemo(
    () => settings?.llamaEmbed || {},
    [settings?.llamaEmbed],
  );

  // Effects
  useEffect(() => {
    loadIndices();
  }, [loadIndices]);

  useEffect(() => {
    setSearchFilters({
      title: formState.title,
      metaTextDesc: formState.metaTextDesc,
      metaKeyWords: formState.metaKeyWords,
      indexName: selectedIndex,
    });
  }, [formState, selectedIndex, setSearchFilters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Event handlers
  const handleReset = useCallback(() => {
    resetForm();
    resetIndex();
    resetSearch();
    resetSort();
    clearSelectedDocument();
  }, [resetForm, resetIndex, resetSearch, resetSort, clearSelectedDocument]);

  const handleIndexSelect = useCallback(
    (event) => {
      handleIndexChange(event.target.value);
    },
    [handleIndexChange],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!isValidIndex) {
        setSearchError("Please select an index.");
        return;
      }

      // Cancel existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const newAbortController = new AbortController();
      abortControllerRef.current = newAbortController;
      setAbortController(newAbortController);

      try {
        setSearching(true);
        setDocuments([]);
        setSearchError(null);
        resetSort();

        const result = await GetDocumentsByFieldsSettings(
          selectedIndex,
          formState.metaKeyWords,
          formState.metaTextDesc,
          formState.title,
        );

        if (newAbortController.signal.aborted) {
          throw new Error("Search was cancelled by user");
        }

        const parsedResult = parseSearchResults(result);
        const documentsArray = Array.isArray(parsedResult) ? parsedResult : [];

        setDocuments(documentsArray);
        setSearchResults(documentsArray);
      } catch (error) {
        if (error.name === "AbortError" || newAbortController.signal.aborted) {
          LogError("Search was cancelled by user");
          setSearchError("Search was cancelled by user");
        } else {
          LogError(`Search failed: ${error}`);
          setSearchError(`Search failed: ${error.message || error}`);
        }
        setDocuments([]);
      } finally {
        setSearching(false);
        setAbortController(null);
        abortControllerRef.current = null;
      }
    },
    [
      isValidIndex,
      selectedIndex,
      formState,
      setSearchError,
      setSearching,
      setDocuments,
      setSearchResults,
      setAbortController,
      resetSort,
    ],
  );

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      CancelProcess()
        .then((result) => LogInfo(result))
        .catch((error) => LogError(error));
      setSearching(false);
      setAbortController(null);
      abortControllerRef.current = null;
      LogInfo("Search cancelled by user");
    }
  }, [setSearching, setAbortController]);

  const handleViewDocument = useCallback(
    (sourceLocation, title, event) => {
      event.stopPropagation();
      if (!sourceLocation) return;

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
    },
    [
      setViewOpen,
      setQAOpen,
      setSourceLocation,
      setTitle,
      openModal,
      setModalOpen,
      isQAOpen,
      isViewOpen,
    ],
  );

  const handleQuestionDocument = useCallback(
    (documentId, sourceLocation, title, event) => {
      event.stopPropagation();

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
        indexValue: selectedIndex,
        title,
      });
    },
    [
      setViewOpen,
      setQAOpen,
      setDocId,
      setSourceLocation,
      setTitle,
      setModalOpen,
      documents,
      selectDocument,
      openModal,
      cliState,
      embState,
      selectedIndex,
    ],
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

  // Render functions
  const renderLoadingState = () => (
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

  const renderEmptyState = () => (
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

  const renderTableHeader = () => (
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
        {TABLE_COLUMNS.map((column) => (
          <th
            key={column.key}
            style={{
              width: column.width,
              cursor: column.sortable !== false ? "pointer" : "default",
              padding: "12px",
            }}
            onClick={
              column.sortable !== false
                ? () => handleSort(column.key)
                : undefined
            }
          >
            {column.label}
            {column.sortable !== false && getSortIcon(column.key)}
          </th>
        ))}
      </tr>
    </thead>
  );

  const renderTableRow = (item, index) => (
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
        title={item.metaKeyWords || "No metaKeyWords"}
      >
        {item.metaKeyWords || "No metaKeyWords"}
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
        {formatDate(item.timestamp)}
      </td>
      <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
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
          <i className="bi bi-eye me-1" />
          View
        </Button>
        <Button
          variant="outline-info"
          size="sm"
          className="theme-btn-primary"
          onClick={(e) =>
            handleQuestionDocument(item.id, item.sourceLocation, item.title, e)
          }
          title="Ask questions about this document"
        >
          <i className="bi bi-chat-right-text me-1" />
          Ask
        </Button>
      </td>
    </tr>
  );

  const renderTable = () => {
    if (isSearching) return renderLoadingState();
    if (!Array.isArray(documents) || documents.length === 0)
      return renderEmptyState();

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
          style={{ minWidth: "800px" }}
        >
          {renderTableHeader()}
          <tbody>
            {sortedDocuments.map((item, index) => renderTableRow(item, index))}
          </tbody>
        </Table>
      </div>
    );
  };

  // Loading and error states
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
            <i className="bi bi-exclamation-triangle me-2" />
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
            <i className="bi bi-exclamation-triangle me-2" />
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
            />
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
              <i className="bi bi-funnel me-1" />
              Search Filters
            </h6>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="theme-form-label">Index</Form.Label>
                    <Form.Select
                      value={selectedIndex}
                      onChange={handleIndexSelect}
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
                      placeholder="Enter meta text description..."
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
                      placeholder="Enter meta keywords..."
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
                  <i className="bi bi-arrow-clockwise me-1" />
                  Reset
                </Button>
                {isSearching && (
                  <Button
                    variant="outline-danger"
                    onClick={handleCancel}
                    className="theme-btn-danger"
                  >
                    <i className="bi bi-x-circle me-1" />
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSearching || !isValidIndex}
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
                      <i className="bi bi-search me-1" />
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
              <i className="bi bi-table me-1" />
              Search Results
              {documents.length > 0 && (
                <span className="ms-2 badge bg-primary">
                  {documents.length}
                </span>
              )}
            </h6>
            <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
              {renderTable()}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Modals */}
      <DocumentQuestionModal
        show={isQAOpen}
        handleClose={handleCloseQAModal}
        cliState={cliState}
        embState={embState}
        docId={docId}
        indexValue={selectedIndex}
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
