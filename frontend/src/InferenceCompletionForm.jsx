import { useCallback, useEffect, useRef } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import MarkdownPreview from "@uiw/react-markdown-preview";

import { LogError } from "../wailsjs/runtime/runtime.js";
import "../public/main.css";

import {
  useChatState,
  useSettingsState,
} from "./StoreConfig.jsx";
import { PROMPT_TYPES } from "./CommonUtils.jsx";
import { PDFConversationDocument } from "./CommonUtils.jsx";

const InferenceCompletionForm = () => {
  // Store state - everything is now managed by ChatSliceManager
  // Data
  const {
    chatHistory,
    savedChats,
    currentMessage,
    selectedChatId,
    textareaFocused,
    hoveredHistoryId,
    isLoadingHistory,
    isInitialized,
    isExportingPDF,

    // Generation State
    isGenerating,
    selectedPromptType,
    setSelectedPromptType,

    // Actions
    loadSavedChat,
    setHoveredHistoryId,
    setTextareaFocused,
    setCurrentMessage,
    initializeChat,

    // UI Handlers
    handleClear,
    handleCancel,
    handleSubmit,
    handleKeyDown,
    handleExportPDF,

    // Utilities
    formatDate,
    extractUserQuestion,

    // Computed values
    getIsButtonDisabled,
    getIsLoading,
  } = useChatState();

  const { settings, settingsLoading } = useSettingsState();

  // Refs
  const chatContainerRef = useRef(null);

  // Computed values from ChatSliceManager
  const isButtonDisabled = getIsButtonDisabled(
    selectedPromptType,
    currentMessage,
  );
  const isLoading = getIsLoading(settingsLoading);

  // Effects
  useEffect(() => {
    if (!settingsLoading && !isInitialized) {
      initializeChat().catch((error) => {
        LogError(`Failed to initialize chat: ${error}`);
      });
    }
  }, [settingsLoading, isInitialized, initializeChat]);

  useEffect(() => {
    if (PROMPT_TYPES.length > 0 && !selectedPromptType) {
      setSelectedPromptType(PROMPT_TYPES[0]);
    }
  }, [selectedPromptType, setSelectedPromptType]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Wrapped handlers that pass required parameters
  const onSubmit = useCallback(
    (e) => {
      handleSubmit(e, selectedPromptType, currentMessage, settings);
    },
    [handleSubmit, selectedPromptType, currentMessage, settings],
  );

  const onKeyDown = useCallback(
    (e) => {
      handleKeyDown(e, selectedPromptType, currentMessage, settings);
    },
    [handleKeyDown, selectedPromptType, currentMessage, settings],
  );

  const onExportPDF = useCallback(() => {
    handleExportPDF(PDFConversationDocument);
  }, [handleExportPDF]);

  // Loading state
  if (isLoading) {
    return (
      <div className="theme-container">
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
            <div className="theme-loading-text">
              Loading AI Chat Inference...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="theme-container"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Card
        className="theme-header-card theme-spacing-sm"
        style={{ flexShrink: 0 }}
      >
        <Card.Body className="py-2 px-3">
          <div className="d-flex align-items-center">
            <i
              className="bi bi-chat-dots me-2 theme-icon"
              style={{ fontSize: "1.1rem" }}
            ></i>
            <div>
              <h5 className="mb-0" style={{ fontSize: "1rem" }}>
                AI Inference
              </h5>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                Generate AI completions using various prompt templates and
                models
              </small>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Status Alert */}
      <Alert
        className="theme-alert-info theme-spacing-sm"
        style={{ flexShrink: 0 }}
      >
        <span style={{ marginRight: "0.5rem", fontSize: "0.8rem" }}>
          {Object.keys(settings?.llamaCli || {}).length > 0 ? "✅" : "⚠️"}
        </span>
        {Object.keys(settings?.llamaCli || {}).length > 0
          ? `Configuration Active: ${settings?.llamaCli?.Description || "Unnamed Configuration"}`
          : "Using Default Configuration - Configure CLI settings for optimal performance"}
      </Alert>

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
          <Container
            fluid
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Row
              style={{
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {/* Main Chat Area */}
              <Col
                xl={8}
                lg={7}
                md={6}
                className="left-column"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {/* Prompt Type Selection */}
                <div className="theme-spacing-md" style={{ flexShrink: 0 }}>
                  <h6 className="theme-section-title">
                    <i className="bi bi-gear me-1"></i>
                    Prompt Template
                  </h6>
                  <Form.Group>
                    <Form.Label className="theme-form-label" column={"sm"}>
                      Select Template
                    </Form.Label>
                    <Form.Select
                      value={selectedPromptType}
                      onChange={(e) => setSelectedPromptType(e.target.value)}
                      className="theme-form-control"
                      style={{ maxWidth: "300px" }}
                    >
                      <option value="">Choose your prompt template...</option>
                      {PROMPT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>

                {/* Chat Container */}
                <div
                  className="theme-spacing-md"
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                >
                  <h6 className="theme-section-title" style={{ flexShrink: 0 }}>
                    <i className="bi bi-chat-text me-1"></i>
                    Conversation
                  </h6>
                  <div
                    ref={chatContainerRef}
                    className="theme-scrollbar"
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      overflowX: "hidden",
                      backgroundColor: "var(--bg-tertiary)",
                      border: "1px solid var(--border-secondary)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--spacing-md)",
                      minHeight: 0,
                    }}
                  >
                    {chatHistory.length === 0 ? (
                      <div
                        className="text-center d-flex flex-column justify-content-center align-items-center"
                        style={{
                          height: "100%",
                          color: "var(--text-quaternary)",
                        }}
                      >
                        <div
                          style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                        ></div>
                        <div>Ready to start your conversation!</div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            marginTop: "0.375rem",
                            opacity: 0.7,
                          }}
                        >
                          Select a prompt template and send your first message
                        </div>
                      </div>
                    ) : (
                      chatHistory.map((msg, index) => (
                        <div
                          key={`${msg.id || "msg"}-${index}-${msg.timestamp || Date.now()}`}
                          className={`d-flex ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}
                          style={{ marginBottom: "var(--spacing-md)" }}
                        >
                          <div
                            style={{
                              maxWidth: "85%",
                              minWidth: "200px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.3px",
                                marginBottom: "0.375rem",
                                color: "var(--text-quaternary)",
                                textAlign:
                                  msg.role === "user" ? "right" : "left",
                              }}
                            >
                              {msg.role === "user"
                                ? "You"
                                : msg.role === "error"
                                  ? "System Error"
                                  : "AI Assistant"}
                            </div>
                            <div
                              style={{
                                padding: "0.5rem 0.75rem",
                                borderRadius: "0.5rem",
                                wordBreak: "break-word",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.4,
                                fontSize: "0.8rem",
                                backgroundColor:
                                  msg.role === "user"
                                    ? "#334155"
                                    : msg.role === "error"
                                      ? "#dc3545"
                                      : msg.isLoading
                                        ? "#f8f9fa"
                                        : "var(--bg-input)",
                                color:
                                  msg.role === "user" || msg.role === "error"
                                    ? "#ffffff"
                                    : msg.isLoading
                                      ? "#6c757d"
                                      : "var(--text-primary)",
                                border:
                                  msg.role === "assistant"
                                    ? "1px solid var(--border-secondary)"
                                    : "none",
                                borderBottomRightRadius:
                                  msg.role === "user" ? "0.125rem" : "0.5rem",
                                borderBottomLeftRadius:
                                  msg.role === "assistant"
                                    ? "0.125rem"
                                    : "0.5rem",
                              }}
                            >
                              {msg.isLoading ? (
                                <div className="d-flex align-items-center">
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-2"
                                  />
                                  <span>AI is thinking...</span>
                                </div>
                              ) : (
                                <MarkdownPreview
                                  source={msg.content || "No content"}
                                  style={{
                                    padding: 0,
                                    backgroundColor: "transparent",
                                  }}
                                />
                              )}
                              {msg.processingTime && (
                                <div
                                  style={{
                                    fontSize: "0.65rem",
                                    marginTop: "0.375rem",
                                    opacity: 0.8,
                                  }}
                                >
                                  Generated in{" "}
                                  {(msg.processingTime / 1000).toFixed(2)}{" "}
                                  seconds
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "0.65rem",
                                color: "var(--text-muted)",
                                marginTop: "0.375rem",
                                fontWeight: 500,
                                textAlign:
                                  msg.role === "user" ? "right" : "left",
                              }}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Input Section */}
                <div style={{ marginTop: "var(--spacing-md)", flexShrink: 0 }}>
                  <Form onSubmit={onSubmit}>
                    <Form.Control
                      as="textarea"
                      id="chat-input"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyDown={onKeyDown}
                      className="theme-form-control"
                      onFocus={() => setTextareaFocused(true)}
                      onBlur={() => setTextareaFocused(false)}
                      placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
                      style={{
                        resize: "none",
                        minHeight: "80px",
                        maxHeight: "80px",
                        borderColor: textareaFocused
                          ? "var(--border-focus)"
                          : "var(--border-secondary)",
                        boxShadow: textareaFocused
                          ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)"
                          : "none",
                      }}
                      disabled={isGenerating}
                    />
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <div className="d-grid gap-2 d-md-block">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleClear}
                          className="theme-btn-secondary"
                          disabled={
                            chatHistory.length === 0 && !currentMessage.trim()
                          }
                        >
                          <i className="bi bi-trash me-1"></i>
                          Clear
                        </Button>

                        <Button
                          className="theme-btn-secondary"
                          variant="outline-secondary"
                          size="sm"
                          disabled={!chatHistory?.length || isExportingPDF}
                          onClick={onExportPDF}
                        >
                          {isExportingPDF ? (
                            <>
                              <Spinner
                                animation="border"
                                size="sm"
                                className="me-1"
                              />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-file-earmark-pdf me-1"></i>
                              Export to PDF
                            </>
                          )}
                        </Button>

                        {isGenerating && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={handleCancel}
                            className="theme-btn-danger"
                          >
                            <i className="bi bi-x-circle me-1"></i>
                            Cancel
                          </Button>
                        )}
                      </div>
                      <Button
                        type="submit"
                        disabled={isButtonDisabled}
                        className="theme-btn-primary"
                      >
                        {isGenerating ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              className="me-1"
                            />
                            Generating...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send me-1"></i>
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              </Col>

              {/* Chat History Sidebar */}
              <Col
                xl={4}
                lg={5}
                md={6}
                className="right-column"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                <h6 className="theme-section-title" style={{ flexShrink: 0 }}>
                  <i className="bi bi-clock-history me-1"></i>
                  Chat History
                </h6>
                <div
                  className="theme-scrollbar"
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-secondary)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--spacing-md)",
                    minHeight: 0,
                  }}
                >
                  {isLoadingHistory ? (
                    <div className="d-flex align-items-center">
                      <Spinner
                        animation="border"
                        size="sm"
                        className="theme-loading-spinner me-2"
                      />
                      <span className="theme-loading-text">
                        Loading history...
                      </span>
                    </div>
                  ) : savedChats.length === 0 ? (
                    <div
                      className="text-center d-flex flex-column justify-content-center align-items-center"
                      style={{
                        height: "100%",
                        color: "var(--text-quaternary)",
                      }}
                    >
                      <div
                        style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}
                      ></div>
                      <div>No conversations yet</div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          marginTop: "0.375rem",
                          opacity: 0.7,
                        }}
                      >
                        Your chat history will appear here
                      </div>
                    </div>
                  ) : (
                    <div>
                      {savedChats.map((chat) => (
                        <div
                          key={chat._id}
                          style={{
                            cursor: "pointer",
                            borderRadius: "var(--radius-md)",
                            transition: "all 0.15s ease-in-out",
                            margin: "0.375rem 0",
                            padding: "0.5rem",
                            backgroundColor:
                              hoveredHistoryId === chat._id
                                ? "var(--bg-secondary)"
                                : selectedChatId === chat._id
                                  ? "var(--bg-quaternary)"
                                  : "transparent",
                            border: "1px solid transparent",
                            color: "var(--text-primary)",
                            wordBreak: "break-word",
                            overflow: "hidden",
                          }}
                          onMouseEnter={() => setHoveredHistoryId(chat._id)}
                          onMouseLeave={() => setHoveredHistoryId(null)}
                          onClick={() => loadSavedChat(chat)}
                        >
                          <div
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              marginBottom: "0.25rem",
                              color: "var(--text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {extractUserQuestion(chat.question).substring(
                              0,
                              40,
                            )}
                            ...
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-tertiary)",
                              marginBottom: "0.25rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {chat.response.substring(0, 80)}...
                          </div>
                          <div
                            style={{
                              fontSize: "0.65rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {formatDate(chat.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Container>
        </Card.Body>
      </Card>
    </div>
  );
};

export default InferenceCompletionForm;
