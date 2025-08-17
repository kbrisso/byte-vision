import { Button, Form, Modal, Spinner } from "react-bootstrap";
import MarkdownPreview from "@uiw/react-markdown-preview";
import "../public/main.css";
import PDFDocumentViewer from "./PDFDocumentViewer";
import { useDocumentQuestionState } from "./DocumentQuestionState.jsx";

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
  // Use the dedicated document question state hook
  const doc = useDocumentQuestionState({
    show,
    docId,
    indexValue,
    sourceLocation,
    cliState,
    embState,
  });

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

    const HistoryItem = ({ item, index, selectedHistoryId, onSelectHistoryItem, formatDate }) => {
        const isSelected = selectedHistoryId === (item._id?.$oid || item._id);

        return (
            <div
                key={item._id?.$oid || item._id || index}
                className={`border rounded p-2 mb-2 cursor-pointer chat-history-item ${
                    isSelected ? "border-primary bg-primary bg-opacity-10 active" : "border-secondary"
                }`}
                style={{
                    cursor: "pointer",
                    transition: "all 0.15s ease-in-out",
                }}
                onClick={() => onSelectHistoryItem(item)}
            >
                <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                        <h6 className="mb-1" style={{ fontSize: "0.9rem" }}>
                            {item.promptType || "Unknown Type"}
                        </h6>
                        <p className="mb-1 text-muted" style={{ fontSize: "0.8rem" }}>
                            {item.docPrompt ? item.docPrompt.substring(0, 80) + "..." : "No query"}
                        </p>
                        <small className="text-muted">{formatDate(item.createdAt)}</small>
                    </div>
                    <div className="flex-shrink-0 ms-2">
                        {item.processTime && (
                            <span className="badge bg-secondary" style={{ fontSize: "0.7rem" }}>
              {(item.processTime / 1000).toFixed(1)}s
            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

  const renderHistoryList = () => {
    if (doc.historyLoading) {
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

    if (!Array.isArray(doc.documentHistory) || doc.documentHistory.length === 0) {
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
        {doc.documentHistory.map((item, index) => (
          <HistoryItem
            key={item._id?.$oid || item._id || index}
            item={item}
            index={index}
            selectedHistoryId={doc.selectedHistoryId}
            onSelectHistoryItem={doc.handleSelectHistoryItem}
            formatDate={doc.formatDate}
          />
        ))}
      </div>
    );
  };

  const renderSelectedHistory = () => {
    if (!doc.selectedHistoryItem) {
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
            onClick={doc.handleExportHistoryReport}
            disabled={doc.exportingPDF}
          >
            {doc.exportingPDF ? (
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

        <div className="flex-grow-1 p-3 theme-scrollbar" style={{ overflowY: "auto" }}>
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">Analysis Summary</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <strong>Prompt Type:</strong>
                  <p className="text-muted">{doc.selectedHistoryItem.promptType || "Unknown"}</p>
                </div>
                <div className="col-md-6">
                  <strong>Processing Time:</strong>
                  <p className="text-muted">
                    {doc.selectedHistoryItem.processTime
                      ? `${(doc.selectedHistoryItem.processTime / 1000).toFixed(2)}s`
                      : "Unknown"}
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <strong>Created:</strong>
                  <p className="text-muted">{doc.formatDate(doc.selectedHistoryItem.createdAt)}</p>
                </div>
              </div>
              {doc.selectedHistoryItem.keywords && doc.selectedHistoryItem.keywords.length > 0 && (
                <div className="row">
                  <div className="col-12">
                    <strong>Keywords:</strong>
                    <div className="mt-1">
                      {doc.selectedHistoryItem.keywords.map((keyword, index) => (
                        <span key={index} className="badge bg-primary me-1 mb-1">
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
                {doc.selectedHistoryItem.embedPrompt || "No embedding prompt"}
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
                {doc.selectedHistoryItem.docPrompt || "No document query"}
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
                <MarkdownPreview source={doc.selectedHistoryItem.response} />
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
              Document Q&A <span className="badge text-bg-secondary">{title}</span>
            </h5>
          </div>
          <div className="p-2">
            <Button onClick={handleClose} variant="primary" size="sm" style={{ fontSize: "0.8rem" }}>
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
                    className={`btn btn-sm ${
                      doc.leftActiveTab === "history" ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    onClick={() => doc.setLeftActiveTab("history")}
                  >
                    <i className="bi bi-clock-history me-1"></i>
                    History
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      doc.leftActiveTab === "chat" ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    onClick={() => doc.setLeftActiveTab("chat")}
                  >
                    <i className="bi bi-chat-dots me-1"></i>
                    Chat
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-grow-1 d-flex flex-column theme-scrollbar" style={{ overflowY: "auto" }}>
                {doc.leftActiveTab === "history" ? (
                  <div className="flex-grow-1 p-2">{renderHistoryList()}</div>
                ) : (
                  <div className="d-flex flex-column h-100">
                    {/* Chat Messages - Reduced Height */}
                    <div
                      className="flex-grow-1 p-2 theme-scrollbar"
                      ref={doc.chatContainerRef}
                      style={{
                        overflowY: "auto",
                        backgroundColor: "var(--bg-tertiary)",
                        minHeight: "150px",
                        maxHeight: "50vh",
                      }}
                    >
                      {doc.chatHistory.length === 0 ? (
                        <div className="text-center" style={{ color: "var(--text-quaternary)" }}>
                          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>💬</div>
                          <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                            Start a conversation about this document
                          </p>
                        </div>
                      ) : (
                        doc.chatHistory.map((message, index) => (
                          <div
                            key={message.id || index}
                            className={`mb-2 ${message.sender === "user" ? "text-end" : "text-start"}`}
                          >
                            <div
                              className={`d-inline-block p-2 rounded ${
                                message.sender === "user" ? "bg-primary text-white" : "bg-light text-dark"
                              }`}
                              style={{
                                maxWidth: "85%",
                                fontSize: "0.9rem",
                                backgroundColor:
                                  message.sender === "user" ? "var(--btn-primary-bg)" : "var(--bg-card)",
                                color:
                                  message.sender === "user" ? "var(--btn-primary-text)" : "var(--text-primary)",
                                borderColor: "var(--border-secondary)",
                              }}
                            >
                              {message.isLoading ? (
                                <div className="progress mt-2" style={{ height: "4px" }}>
                                  <div
                                    className="progress-bar progress-bar-striped progress-bar-animated"
                                    style={{ width: `${message.progress || 0}%` }}
                                  />
                                </div>
                              ) : (
                                <div style={{ whiteSpace: "pre-wrap" }}>
                                  <MarkdownPreview source={message.content} />
                                </div>
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
                      <Form onSubmit={doc.handleSubmit}>
                        <div className="row g-2 mb-2">
                          <div className="col-6">
                            <Form.Label className="mb-1" style={{ fontSize: "0.8rem" }} column={"lg"}>
                              Embedding prompt types:
                            </Form.Label>
                            <Form.Select
                              className="theme-form-control form-select"
                              value={doc.selectedDocPrompt}
                              onChange={(e) => doc.setSelectedDocPrompt(e.target.value)}
                              required
                              size="sm"
                              style={{ fontSize: "0.85rem" }}
                            >
                              <option value="">Select a prompt</option>
                              {Object.keys(doc.DOC_PROMPTS).map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </Form.Select>
                          </div>
                          <div className="col-6">
                            <Form.Label className="mb-1" style={{ fontSize: "0.8rem" }} column={"lg"}>
                              Embedding keywords
                            </Form.Label>
                            <div style={{ fontSize: "0.85rem" }}>{doc.renderMultiSelect()}</div>
                          </div>
                        </div>

                        <div className="mb-2">
                          <Form.Label className="mb-1" style={{ fontSize: "0.8rem" }} column={"lg"}>
                            Embedding prompt text:
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={1}
                            id="embeddingPrompt"
                            value={doc.embeddingPrompt}
                            onChange={(e) => doc.setEmbeddingPrompt(e.target.value)}
                            placeholder="Choose an embedding prompt type..."
                            required
                            size="sm"
                            style={{ fontSize: "0.85rem" }}
                          />
                        </div>

                        <div className="mb-2">
                          <Form.Label className="mb-1" style={{ fontSize: "0.8rem" }} column={"lg"}>
                            Ask a question
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            id="question-input"
                            rows={2}
                            value={doc.question}
                            onChange={(e) => doc.setQuestion(e.target.value)}
                            onKeyDown={doc.handleKeyDown}
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
                              onClick={doc.clearChatHistory}
                              disabled={doc.chatHistory.length === 0}
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
                              onClick={doc.handleExportPDF}
                              disabled={doc.chatHistory.length === 0 || doc.exportingPDF}
                              size="sm"
                              style={{ fontSize: "0.8rem" }}
                            >
                              {doc.exportingPDF ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-1" />
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
                            {doc.isProcessing && (
                              <Button
                                type="button"
                                variant="outline-warning"
                                onClick={doc.handleCancel}
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
                              disabled={doc.isSubmitDisabled()}
                              size="sm"
                              style={{ fontSize: "0.8rem" }}
                            >
                              {doc.loading ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-1" />
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
              {doc.leftActiveTab === "history" ? (
                <div className="h-100 d-flex flex-column">{renderSelectedHistory()}</div>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center">
                  <PDFDocumentViewer sourceLocation={sourceLocation} show={true} onClose={() => {}} />
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* Progress Overlay - rendered conditionally when progressMessage exists */}
      {doc.isProcessing && doc.progressMessage && (
        <ProgressMessageContainer progressMessage={doc.progressMessage} onCancel={doc.handleCancel} />
      )}
    </>
  );
};

export default DocumentQuestionModal;
