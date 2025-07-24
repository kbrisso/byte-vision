import { Document, Page, pdf, Text, View } from "@react-pdf/renderer";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { useCallback, useEffect, useState } from "react";

import { GetDocumentQuestionResponse } from "../wailsjs/go/main/App.js";
import { LogError } from "../wailsjs/runtime/runtime.js";

import { useChatHistory } from "./ChatHistoryManager.jsx";
import { useDocumentQuery } from "./DocumentQueryHook.jsx";
// eslint-disable-next-line import/order
import { useKeywordSelection } from "./KeywordSelectionHook.jsx";

import "../public/main.css";

import PDFDocumentViewer from "./PDFDocumentViewer";
import { LEGAL_KEYWORDS, DOC_PROMPTS } from "./CommonUtils.jsx";
import { useInferenceState } from "./StoreConfig.jsx";

// PDF Report Component for Document Analysis
const PDFReportDocument = ({ reportData }) => (
  <Document>
    <Page
      size="A4"
      style={{
        fontFamily: "Helvetica",
        fontSize: 10,
        padding: 30,
        lineHeight: 1.6,
      }}
    >
      {/* Header Section */}
      <View
        style={{
          marginBottom: 20,
          borderBottom: "1px solid #ccc",
          paddingBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 8,
          }}
        >
          Legal Document Analysis Report
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
          Document ID: {reportData.documentId}
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
          Index: {reportData.indexName}
        </Text>
        <Text style={{ fontSize: 10, color: "#666" }}>
          Generated: {new Date().toLocaleString()}
        </Text>
      </View>

      {/* Analysis Overview */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 10,
          }}
        >
          Analysis Overview
        </Text>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#555" }}>
            Prompt Type: {reportData.promptType}
          </Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#555" }}>
            Processing Time: {(reportData.processTime / 1000).toFixed(2)}s
          </Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#555" }}>
            Created: {new Date(reportData.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Document Query */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 10,
          }}
        >
          Document Query
        </Text>
        <View
          style={{
            backgroundColor: "#f5f5f5",
            padding: 10,
            borderRadius: 4,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
              color: "#555",
              marginBottom: 5,
            }}
          >
            Embed Prompt:
          </Text>
          <Text style={{ fontSize: 10, color: "#333", lineHeight: 1.4 }}>
            {reportData.embedPrompt}
          </Text>
        </View>
        <View
          style={{ backgroundColor: "#f5f5f5", padding: 10, borderRadius: 4 }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
              color: "#555",
              marginBottom: 5,
            }}
          >
            Document Prompt:
          </Text>
          <Text style={{ fontSize: 10, color: "#333", lineHeight: 1.4 }}>
            {reportData.docPrompt}
          </Text>
        </View>
      </View>

      {/* Keywords Section */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 10,
          }}
        >
          Key Legal Terms
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          {reportData.keywords &&
            reportData.keywords.map((keyword, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: "#e3f2fd",
                  padding: 4,
                  borderRadius: 3,
                  marginRight: 4,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{ fontSize: 9, color: "#1976d2", fontWeight: "bold" }}
                >
                  {keyword}
                </Text>
              </View>
            ))}
        </View>
      </View>

      {/* Analysis Response */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 10,
          }}
        >
          Legal Analysis Response
        </Text>
        <View
          style={{ backgroundColor: "#f9f9f9", padding: 12, borderRadius: 4 }}
        >
          <Text style={{ fontSize: 10, color: "#333", lineHeight: 1.5 }}>
            {reportData.response}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View
        style={{
          marginTop: 30,
          borderTop: "1px solid #ccc",
          paddingTop: 10,
        }}
      >
        <Text style={{ fontSize: 8, color: "#666", textAlign: "center" }}>
          Legal Document Analysis Report | Page 1 | ID: {reportData.id}
        </Text>
      </View>
    </Page>
  </Document>
);

// PDF Export Components
const PDFExportDocument = ({ chatHistory, documentTitle }) => (
  <Document>
    <Page
      size="A4"
      style={{
        fontFamily: "Helvetica",
        fontSize: 11,
        padding: 30,
        lineHeight: 1.6,
      }}
    >
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
          Chat Session Export
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginBottom: 5 }}>
          Document: {documentTitle || "Unknown Document"}
        </Text>
        <Text style={{ fontSize: 10, color: "#666" }}>
          Exported on: {new Date().toLocaleString()}
        </Text>
      </View>

      {chatHistory &&
        chatHistory.map((message, index) => (
          <View key={message.id || index} style={{ marginBottom: 15 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "bold",
                color: message.sender === "user" ? "#0066cc" : "#333",
                marginBottom: 5,
              }}
            >
              {message.sender === "user" ? "User" : "Assistant"} -{" "}
              {new Date(message.timestamp).toLocaleString()}
            </Text>
            <Text
              style={{
                fontSize: 11,
                marginLeft: 10,
              }}
            >
              {message.content}
            </Text>
            {message.processTime && (
              <Text
                style={{
                  fontSize: 9,
                  color: "#666",
                  marginLeft: 10,
                  fontStyle: "italic",
                }}
              >
                Processing time: {(message.processTime / 1000).toFixed(1)}s
              </Text>
            )}
          </View>
        ))}
    </Page>
  </Document>
);

const DocumentQuestionModal = ({
  show,
  handleClose,
  cliState,
  embState,
  docId,
  indexValue,
  sourceLocation,
  title,
}) => {
  // State management
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDocPrompt, setSelectedDocPrompt] = useState("");
  const [embeddingPrompt, setEmbeddingPrompt] = useState("");
  const [documentHistory, setDocumentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [leftActiveTab, setLeftActiveTab] = useState("history");
  const [exportingPDF, setExportingPDF] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Custom hooks
    const { selectedPromptType } = useInferenceState();
    const { chatHistory, chatContainerRef, addMessageToChat, clearChatHistory } =
        useChatHistory();
    const {
        selectedKeywords,
        clearKeywords,
        keywordDropdownOpen,
        setKeywordDropdownOpen,
        hoveredOption,
        setHoveredOption,
        multiSelectRef,
        handleKeywordToggle,
        handleRemoveKeyword
    } = useKeywordSelection();

  const loadDocumentHistory = useCallback(async () => {
    if (!docId) return;

    try {
      setHistoryLoading(true);
      const response = await GetDocumentQuestionResponse(docId);
      const historyData = Array.isArray(JSON.parse(response))
        ? JSON.parse(response)
        : [];
      setDocumentHistory(historyData);
    } catch (error) {
      LogError(`Failed to load document history: ${error}`);
      setDocumentHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [docId]);

  const { progressMessage, isProcessing, submitQuery, handleCancel } =
    useDocumentQuery({
      addMessageToChat,
      loadDocumentHistory,
    });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!show) {
      clearChatHistory();
      clearKeywords();
      setQuestion("");
      setSelectedDocPrompt("");
      setEmbeddingPrompt("");
      setDocumentHistory([]);
      setLoading(false);
    }
  }, [show, clearChatHistory, clearKeywords]);

  // Update embedding prompt when doc prompt changes
  useEffect(() => {
    const promptTemplate = selectedDocPrompt && DOC_PROMPTS[selectedDocPrompt];
    setEmbeddingPrompt(promptTemplate || "");
  }, [selectedDocPrompt]);

  // Load document history when modal opens
  useEffect(() => {
    if (show && docId) {
      loadDocumentHistory();
    }
  }, [show, docId, loadDocumentHistory]);

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            if (!question.trim() || loading || isProcessing) return;

            // Validation - do this BEFORE adding message to chat
            if (!selectedDocPrompt) {
                LogError("Please select a prompt type");
                return;
            }
            if (!embeddingPrompt.trim()) {
                LogError("Embedding prompt is required");
                return;
            }

            try {
                // Add user message only after validation passes
                addMessageToChat("user", question);

                // Submit query
                await submitQuery({
                    llamaCliArgs: cliState,
                    llamaEmbedArgs: embState,
                    indexId: indexValue,
                    documentId: docId,
                    embeddingPrompt: embeddingPrompt.trim(),
                    documentPrompt: question.trim(),
                    promptType: selectedPromptType,
                    searchKeywords: selectedKeywords,
                });

                // Clear question only on successful submission
                setQuestion("");
            } catch (error) {
                // Handle submission error - you might want to remove the user message
                // or add an error message to chat here
                LogError(`Query submission failed: ${error.message}`);
            }
        },
        [
            question,
            loading,
            isProcessing,
            selectedDocPrompt,
            embeddingPrompt,
            addMessageToChat,
            submitQuery,
            cliState,
            embState,
            indexValue,
            docId,
            selectedPromptType,
            selectedKeywords,
        ],
    );
    const formatDate = (dateValue) => {
        if (!dateValue) return "Unknown Date";
        try {
            const date = new Date(dateValue);
            return date.toLocaleDateString();
        } catch (error) {
            LogError(`Failed to format date: ${error}`);
            return "Invalid Date";
        }
    };

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!show) {
            clearChatHistory();
            clearKeywords();
            setQuestion("");
            setSelectedDocPrompt("");
            setEmbeddingPrompt("");
            setDocumentHistory([]);
            setLoading(false);
            setLeftActiveTab("history"); // Reset tab
            setSelectedHistoryId(null);
            setSelectedHistoryItem(null);
            setExportingPDF(false);
        }
    }, [show, clearChatHistory, clearKeywords]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey && !loading && question.trim()) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [loading, question, handleSubmit],
  );

  const handleExportPDF = async () => {
    if (!chatHistory.length || exportingPDF) return;

    try {
      setExportingPDF(true);

      const documentTitle = sourceLocation
        ? sourceLocation.split("/").pop() || sourceLocation.split("\\").pop()
        : "Unknown Document";

      const pdfBlob = await pdf(
        <PDFExportDocument
          chatHistory={chatHistory}
          documentTitle={documentTitle}
        />,
      ).toBlob();

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chat-session-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      LogError(`PDF export failed: ${error}`);
    } finally {
      setExportingPDF(false);
    }
  };

  // Function to handle an exporting detailed history report
  const handleExportHistoryReport = async () => {
    if (!selectedHistoryItem || exportingPDF) return;

    try {
      setExportingPDF(true);

      const reportData = {
        documentId: docId,
        indexName: indexValue,
        promptType: selectedHistoryItem.promptType,
        processTime: selectedHistoryItem.processTime,
        createdAt: selectedHistoryItem.createdAt,
        embedPrompt: selectedHistoryItem.embedPrompt,
        docPrompt: selectedHistoryItem.docPrompt,
        keywords: selectedHistoryItem.keywords,
        response: selectedHistoryItem.response,
        id: selectedHistoryItem._id?.$oid || selectedHistoryItem._id,
      };

      const pdfBlob = await pdf(
        <PDFReportDocument reportData={reportData} />,
      ).toBlob();

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `legal-analysis-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      LogError(`PDF report export failed: ${error}`);
    } finally {
      setExportingPDF(false);
    }
  };
  // Progress Message Container Component
  const ProgressMessageContainer = ({ progressMessage, onCancel }) => {
    if (!progressMessage) return null;

    return (
      <div
        className="position-fixed"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          minWidth: "400px",
          maxWidth: "600px",
        }}
      >
        <div
          className="card shadow-lg border-0"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-secondary)",
          }}
        >
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Spinner animation="border" size="sm" className="me-2" />
              <h6 className="mb-0">Processing Query</h6>
            </div>
            {onCancel && (
              <Button
                variant="outline-light"
                size="sm"
                onClick={onCancel}
                className="btn-close-custom"
              >
                <i className="bi bi-x-lg"></i>
              </Button>
            )}
          </div>
          <div className="card-body">
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Progress</span>
                <span className="badge bg-primary">
                  {progressMessage.progress || 0}%
                </span>
              </div>
              <div className="progress" style={{ height: "8px" }}>
                <div
                  className="progress-bar bg-primary"
                  role="progressbar"
                  style={{ width: `${progressMessage.progress || 0}%` }}
                  aria-valuenow={progressMessage.progress || 0}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>

            <div className="mb-3">
              <h6 className="mb-2">Current Step:</h6>
              <p className="mb-0 text-muted">
                {progressMessage.message || "Initializing..."}
              </p>
            </div>

            {progressMessage.details && (
              <div className="mb-3">
                <h6 className="mb-2">Details:</h6>
                <div
                  className="p-2 rounded"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    fontSize: "0.9rem",
                  }}
                >
                  {progressMessage.details}
                </div>
              </div>
            )}

            {progressMessage.startTime && (
              <div className="text-muted small">
                <i className="bi bi-clock me-1"></i>
                Elapsed:{" "}
                {Math.floor((Date.now() - progressMessage.startTime) / 1000)}s
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const formatMessageText = useCallback((text) => {
    if (!text) return "";

    if (text.includes("```")) {
      const parts = text.split(/(```[\s\S]*?```)/g);
      return (
        <>
          {parts.map((part, i) => {
            if (part.startsWith("```") && part.endsWith("```")) {
              const code = part.slice(3, -3);
              const firstLineBreak = code.indexOf("\n");
              const language =
                firstLineBreak > 0 ? code.slice(0, firstLineBreak).trim() : "";
              const codeContent =
                firstLineBreak > 0 ? code.slice(firstLineBreak + 1) : code;

              return (
                <div key={i} className="code-block">
                  {language && (
                    <div
                      className="text-primary mb-2"
                      style={{ fontSize: "0.8rem", fontWeight: "700" }}
                    >
                      {language}
                    </div>
                  )}
                  <pre className="bg-secondary p-2 rounded text-light">
                    {codeContent}
                  </pre>
                </div>
              );
            } else {
              return part.split("\n\n").map((paragraph, j) => (
                <p key={`${i}-${j}`} className="p-1">
                  {paragraph}
                </p>
              ));
            }
          })}
        </>
      );
    }

    return text.split("\n\n").map((paragraph, i) => (
      <p key={i} className="mb-3">
        {paragraph}
      </p>
    ));
  }, []);

  const handleSelectHistoryItem = useCallback((historyItem) => {
    setSelectedHistoryId(historyItem._id?.$oid || historyItem._id);
    setSelectedHistoryItem(historyItem);
  }, []);

  const renderMultiSelect = () => {
    return (
      <div className="position-relative" ref={multiSelectRef}>
        <div
          className="form-control d-flex flex-wrap align-items-center"
          onClick={() => setKeywordDropdownOpen(!keywordDropdownOpen)}
          style={{
            cursor: "pointer",
            minHeight: "32px",
            fontSize: "0.85rem",
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-secondary)",
            color: "var(--text-primary)",
          }}
        >
          {selectedKeywords.length > 0 ? (
            selectedKeywords.map((keyword) => (
              <span
                key={keyword}
                className="badge bg-primary me-1 mb-1 d-flex align-items-center"
                style={{ fontSize: "0.7rem" }}
              >
                {keyword}
                <button
                  type="button"
                  className="btn-close btn-close-white ms-1"
                  aria-label="Remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveKeyword(keyword);
                  }}
                  style={{ fontSize: "0.5rem" }}
                />
              </span>
            ))
          ) : (
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>
              Select embedding keywords related to document subject.
            </span>
          )}
          <i
            className={`bi bi-chevron-${keywordDropdownOpen ? "up" : "down"} ms-auto`}
            style={{ fontSize: "0.8rem" }}
          ></i>
        </div>

        {keywordDropdownOpen && (
          <div
            className="position-absolute w-100 mt-1 border rounded shadow-lg"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-secondary)",
              zIndex: 1000,
              maxHeight: "150px",
              overflowY: "auto",
              fontSize: "0.85rem",
            }}
          >
            {LEGAL_KEYWORDS.map((keyword) => (
              <div
                key={keyword}
                className="p-2 border-bottom"
                style={{
                  cursor: "pointer",
                  backgroundColor:
                    hoveredOption === keyword
                      ? "var(--bg-secondary)"
                      : "transparent",
                  borderColor: "var(--border-tertiary)",
                  color: "var(--text-primary)",
                }}
                onMouseEnter={() => setHoveredOption(keyword)}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={() => handleKeywordToggle(keyword)}
              >
                <div className="d-flex align-items-center">
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    checked={selectedKeywords.includes(keyword)}
                    onChange={() => {}}
                    style={{ transform: "scale(0.9)" }}
                  />
                  <span style={{ fontSize: "0.85rem" }}>{keyword}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderHistoryList = () => {
    if (historyLoading) {
      return (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "200px" }}
        >
          <div className="text-center">
            <Spinner animation="border" className="theme-loading-spinner" />
            <div className="theme-loading-text">Loading history...</div>
          </div>
        </div>
      );
    }

    if (!Array.isArray(documentHistory) || documentHistory.length === 0) {
      return (
        <div
          className="text-center d-flex flex-column justify-content-center align-items-center"
          style={{
            minHeight: "200px",
            color: "var(--text-quaternary)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📋</div>
          <p className="mb-2">No history found</p>
          <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>
            Previous queries will appear here
          </p>
        </div>
      );
    }

    return (
      <div>
        {documentHistory.map((item, index) => (
          <div
            key={item._id?.$oid || item._id || index}
            className={`card mb-2 ${selectedHistoryId === (item._id?.$oid || item._id) ? "border-primary" : ""}`}
            style={{
              cursor: "pointer",
              backgroundColor:
                selectedHistoryId === (item._id?.$oid || item._id)
                  ? "var(--bg-secondary)"
                  : "var(--bg-card)",
              borderColor:
                selectedHistoryId === (item._id?.$oid || item._id)
                  ? "var(--border-focus)"
                  : "var(--border-secondary)",
            }}
            onClick={() => handleSelectHistoryItem(item)}
          >
            <div className="card-body p-3 history-hover-div">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6
                  className="card-title mb-0 focus-ring"
                  style={{ fontSize: "0.9rem" }}
                >
                  {item.promptType || "Unknown Type"}
                </h6>
                <small className="text-muted">
                  {formatDate(item.createdAt)}
                </small>
              </div>
              <p className="card-text mb-2" style={{ fontSize: "0.85rem" }}>
                <strong>Q:</strong> {item.docPrompt?.slice(0, 100)}...
              </p>
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {item.keywords?.length > 0
                    ? `${item.keywords.length} keywords`
                    : "No keywords"}
                </small>
                <small className="text-muted">
                  {item.processTime
                    ? `${(item.processTime / 1000).toFixed(1)}s`
                    : "Unknown time"}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSelectedHistory = () => {
    if (!selectedHistoryItem) {
      return (
        <div className="text-center d-flex flex-column justify-content-center align-items-center h-100">
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</div>
          <p className="mb-2">Select a history item</p>
          <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>
            Click on a history item to view details
          </p>
        </div>
      );
    }

    return (
      <div className="h-100 d-flex flex-column">
        <div className="flex-shrink-0 p-3 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Query Details</h6>
          <Button
            variant="outline-success"
            size="sm"
            onClick={handleExportHistoryReport}
            disabled={exportingPDF}
          >
            {exportingPDF ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Exporting...
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-pdf me-1"></i>
                Export
              </>
            )}
          </Button>
        </div>

        <div
          className="flex-grow-1 p-3 theme-scrollbar"
          style={{ overflowY: "auto" }}
        >
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">Analysis Summary</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <strong>Prompt Type:</strong>
                  <p className="text-muted">
                    {selectedHistoryItem.promptType || "Unknown"}
                  </p>
                </div>
                <div className="col-md-6">
                  <strong>Processing Time:</strong>
                  <p className="text-muted">
                    {selectedHistoryItem.processTime
                      ? `${(selectedHistoryItem.processTime / 1000).toFixed(2)}s`
                      : "Unknown"}
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <strong>Created:</strong>
                  <p className="text-muted">
                    {formatDate(selectedHistoryItem.createdAt)}
                  </p>
                </div>
              </div>
              {selectedHistoryItem.keywords &&
                selectedHistoryItem.keywords.length > 0 && (
                  <div className="row">
                    <div className="col-12">
                      <strong>Keywords:</strong>
                      <div className="mt-1">
                        {selectedHistoryItem.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="badge bg-primary me-1 mb-1"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">Embedding Prompt</h6>
            </div>
            <div className="card-body">
              <pre
                className="bg-secondary p-3 rounded text-light"
                style={{ fontSize: "0.8rem", whiteSpace: "pre-wrap" }}
              >
                {selectedHistoryItem.embedPrompt || "No embedding prompt"}
              </pre>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">Document Query</h6>
            </div>
            <div className="card-body">
              <pre
                className="bg-secondary p-3 rounded text-light"
                style={{ fontSize: "0.8rem", whiteSpace: "pre-wrap" }}
              >
                {selectedHistoryItem.docPrompt || "No document query"}
              </pre>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Response</h6>
            </div>
            <div className="card-body">
              <pre
                className="bg-dark p-3 rounded"
                style={{
                  fontSize: "0.8rem",
                  lineHeight: "1.4",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedHistoryItem.response || "No document query"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        size="modal-fullscreen"
        centered
        backdrop="static"
        className="document-question-modal"
        style={{
          "--bs-modal-width": "95vw",
          "--bs-modal-height": "95vh",
        }}
      >
        <div className="modal-header">
          <div className="p-2 flex-grow-1">
            <h5 className="modal-title">
              Document Q&A{" "}
              <span className="badge text-bg-secondary">{title}</span>
            </h5>
          </div>
          <div className="p-2">
            <Button
              onClick={handleClose}
              variant="primary"
              size="sm"
              style={{ fontSize: "0.8rem" }}
            >
              Close
            </Button>
          </div>
        </div>
        <Modal.Body className="p-0" style={{ height: "90vh" }}>
          <div className="h-100 d-flex">
            {/* Left Panel - Chat History and Controls */}
            <div
              className="w-50 border-end border-1 border-opacity-25 d-flex flex-column"
              style={{ borderColor: "#334155" }}
            >
              {/* Tab Navigation */}
              <div
                className="p-2 border-bottom border-1 border-opacity-25 flex-shrink-0"
                style={{ borderColor: "#334155" }}
              >
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${leftActiveTab === "history" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setLeftActiveTab("history")}
                  >
                    <i className="bi bi-clock-history me-1"></i>
                    History
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${leftActiveTab === "chat" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setLeftActiveTab("chat")}
                  >
                    <i className="bi bi-chat-dots me-1"></i>
                    Chat
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-grow-1 d-flex flex-column theme-scrollbar" style={{ overflowY: "auto" }}>
                {leftActiveTab === "history" ? (
                  <div className="flex-grow-1 p-2">

                    {renderHistoryList()}
                  </div>
                ) : (
                  <div className="d-flex flex-column h-100">
                    {/* Chat Messages - Reduced Height */}
                    <div
                      className="flex-grow-1 p-2 theme-scrollbar"
                      ref={chatContainerRef}
                      style={{
                        overflowY: "auto",
                        backgroundColor: "var(--bg-tertiary)",
                        minHeight: "150px",
                        maxHeight: "50vh",
                      }}
                    >
                      {chatHistory.length === 0 ? (
                        <div
                          className="text-center"
                          style={{ color: "var(--text-quaternary)" }}
                        >
                          <div
                            style={{
                              fontSize: "1.5rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            💬
                          </div>
                          <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                            Start a conversation about this document
                          </p>
                        </div>
                      ) : (
                        chatHistory.map((message, index) => (
                          <div
                            key={message.id || index}
                            className={`mb-2 ${message.sender === "user" ? "text-end" : "text-start"}`}
                          >
                            <div
                              className={`d-inline-block p-2 rounded ${
                                message.sender === "user"
                                  ? "bg-primary text-white"
                                  : "bg-light text-dark"
                              }`}
                              style={{
                                maxWidth: "85%",
                                fontSize: "0.9rem",
                                backgroundColor:
                                  message.sender === "user"
                                    ? "var(--btn-primary-bg)"
                                    : "var(--bg-card)",
                                color:
                                  message.sender === "user"
                                    ? "var(--btn-primary-text)"
                                    : "var(--text-primary)",
                                borderColor: "var(--border-secondary)",
                              }}
                            >
                              {message.isLoading ? (
                                <div
                                  className="progress mt-2"
                                  style={{ height: "4px" }}
                                >
                                  <div
                                    className="progress-bar progress-bar-striped progress-bar-animated"
                                    style={{
                                      width: `${message.progress || 0}%`,
                                    }}
                                  />
                                </div>
                              ) : (
                                <div style={{whiteSpace: "pre-wrap"}}>{formatMessageText(message.content)}</div>
                              )}
                              {message.processTime && (
                                <small className="d-block mt-1 opacity-75">
                                  {(message.processTime / 1000).toFixed(1)}s
                                </small>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Question Input Controls - Compact */}
                    <div
                      className="p-2 border-top flex-shrink-0"
                      style={{ borderColor: "var(--border-secondary)" }}
                    >
                      <Form onSubmit={handleSubmit}>
                        <div className="row g-2 mb-2">
                          <div className="col-6">
                            <Form.Label
                              className="mb-1"
                              style={{ fontSize: "0.8rem" }}
                              column={"lg"}
                            >
                              Embedding prompt types:
                            </Form.Label>
                            <Form.Select
                              className="theme-form-control form-select"
                              value={selectedDocPrompt}
                              onChange={(e) =>
                                setSelectedDocPrompt(e.target.value)
                              }
                              required
                              size="sm"
                              style={{ fontSize: "0.85rem" }}
                            >
                              <option value="">Select a prompt</option>
                              {Object.keys(DOC_PROMPTS).map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </Form.Select>
                          </div>
                          <div className="col-6">
                            <Form.Label
                              className="mb-1"
                              style={{ fontSize: "0.8rem" }}
                              column={"lg"}
                            >
                              Embedding keywords
                            </Form.Label>
                            <div style={{ fontSize: "0.85rem" }}>
                              {renderMultiSelect()}
                            </div>
                          </div>
                        </div>

                        <div className="mb-2">
                          <Form.Label
                            className="mb-1"
                            style={{ fontSize: "0.8rem" }}
                            column={"lg"}
                          >
                            Embedding prompt text:
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={1}
                            id="embeddingPrompt"
                            value={embeddingPrompt}
                            onChange={(e) => setEmbeddingPrompt(e.target.value)}
                            placeholder="Choose an embedding prompt type..."
                            required
                            size="sm"
                            style={{ fontSize: "0.85rem" }}
                          />
                        </div>

                        <div className="mb-2">
                          <Form.Label
                            className="mb-1"
                            style={{ fontSize: "0.8rem" }}
                            column={"lg"}
                          >
                            Ask a question
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            id="question-input"
                            rows={2}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question about this document..."
                            required
                            size="sm"
                            style={{ fontSize: "0.85rem" }}
                          />
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <Button
                              type="button"
                              variant="outline-secondary"
                              onClick={clearChatHistory}
                              disabled={chatHistory.length === 0}
                              className="me-2"
                              size="sm"
                              style={{ fontSize: "0.8rem" }}
                            >
                              <i className="bi bi-trash"></i>
                              Clear
                            </Button>
                            <Button
                              type="button"
                              variant="outline-info"
                              onClick={handleExportPDF}
                              disabled={
                                chatHistory.length === 0 || exportingPDF
                              }
                              size="sm"
                              style={{ fontSize: "0.8rem" }}
                            >
                              {exportingPDF ? (
                                <>
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-1"
                                  />
                                  Export...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-file-earmark-pdf"></i>
                                  Export
                                </>
                              )}
                            </Button>
                          </div>
                          <div>
                            {isProcessing && (
                              <Button
                                type="button"
                                variant="outline-warning"
                                onClick={handleCancel}
                                className="me-2"
                                size="sm"
                                style={{ fontSize: "0.8rem" }}
                              >
                                <i className="bi bi-stop-circle"></i>
                                Cancel
                              </Button>
                            )}
                            <Button
                              type="submit"
                              variant="primary"
                              disabled={
                                !question.trim() ||
                                loading ||
                                !selectedDocPrompt ||
                                !embeddingPrompt.trim()
                              }
                              size="sm"
                              style={{ fontSize: "0.8rem" }}
                            >
                              {loading ? (
                                <>
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-1"
                                  />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-send"></i>
                                  Send
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </Form>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - History Details or Document Viewer */}
            <div className="w-50 d-flex flex-column">
              {leftActiveTab === "history" ? (
                <div className="h-100 d-flex flex-column">
                  {renderSelectedHistory()}
                </div>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center">
                  <PDFDocumentViewer
                    sourceLocation={sourceLocation}
                    show={true}
                    onClose={() => {}}
                  />
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* Progress Overlay - rendered conditionally when progressMessage exists */}
        {isProcessing && progressMessage && (
            <ProgressMessageContainer
                progressMessage={progressMessage}
                onCancel={handleCancel}
            />
        )}

    </>
  );
};

export default DocumentQuestionModal;
