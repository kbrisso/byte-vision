import "react";
import { Spinner } from "react-bootstrap";
import MarkdownPreview from "@uiw/react-markdown-preview";

const ChatMessage = ({ 
  message, 
  index, 
  showAvatar = true, 
  showTimestamp = true,
  showProcessingTime = true,
  compact = false 
}) => {
  // Normalize message structure - handle different field names
  const messageData = {
    id: message.id || message._id || index,
    role: message.role || message.sender || "assistant",
    content: message.content || message.response || "",
    timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
    isLoading: message.isLoading || false,
    processTime: message.processTime || message.processingTime || null,
    requestId: message.requestId || null
  };

  // Determine message alignment and styling
  const isUser = messageData.role === "user";
  const isError = messageData.role === "error";
  const isAssistant = messageData.role === "assistant";

  // Message container classes
  const containerClasses = compact 
    ? `mb-2 ${isUser ? "text-end" : "text-start"}`
    : "message-item mb-3";

  // Message content classes
  const contentClasses = compact
    ? `d-inline-block p-2 rounded ${
        isUser 
          ? "bg-primary text-white" 
          : isError 
            ? "bg-danger text-white"
            : "bg-light text-dark"
      }`
    : "message-content flex-grow-1";

  // Avatar component
  const Avatar = () => {
    if (!showAvatar || compact) return null;
    
    return (
      <div className={`message-avatar me-2 ${isUser ? "user-avatar" : "assistant-avatar"}`}>
        <i className={isUser ? "bi bi-person-fill" : isError ? "bi bi-exclamation-triangle" : "bi bi-robot"} />
      </div>
    );
  };

  // Message header with sender and timestamp
  const MessageHeader = () => {
    if (compact || !showTimestamp) return null;
    
    return (
      <div className="message-header d-flex align-items-center mb-1">
        <strong className="me-2">
          {isUser ? "You" : isError ? "Error" : "AI Assistant"}
        </strong>
        {messageData.timestamp && (
          <small className="text-muted">
            {new Date(messageData.timestamp).toLocaleTimeString()}
          </small>
        )}
      </div>
    );
  };

  // Message content renderer
  const MessageContent = () => {
    if (messageData.isLoading) {
      return (
        <div className="d-flex align-items-center">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>{messageData.content || "Processing your request..."}</span>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-danger">
          <i className="bi bi-exclamation-triangle me-2" />
          <MarkdownPreview 
            source={messageData.content || "An error occurred"}
            style={{
              backgroundColor: "transparent",
              color: "inherit",
              margin: 0
            }}
          />
        </div>
      );
    }

    // For compact mode (like DocumentQuestionModal), use inline styling
    if (compact) {
      return (
        <div
          className={contentClasses}
          style={{
            maxWidth: "85%",
            fontSize: "0.9rem",
            backgroundColor: isUser ? "var(--btn-primary-bg)" : "var(--bg-card)",
            color: isUser ? "var(--btn-primary-text)" : "var(--text-primary)",
            borderColor: "var(--border-secondary)",
          }}
        >
          <div style={{ whiteSpace: "pre-wrap" }}>
            <MarkdownPreview 
              source={messageData.content || ""}
              style={{
                backgroundColor: "transparent",
                color: "inherit",
                margin: 0,
                fontSize: "inherit"
              }}
            />
          </div>
          {showProcessingTime && messageData.processTime && (
            <small className="d-block mt-1 opacity-75">
              {(messageData.processTime / 1000).toFixed(1)}s
            </small>
          )}
        </div>
      );
    }

    // For full mode (like InferenceCompletionForm), use card-style layout
    return (
      <div className="message-body">
        <div 
          className="message-content-card p-3 rounded"
          style={{
            backgroundColor: isUser ? "var(--bg-primary)" : "var(--bg-secondary)",
            border: "1px solid var(--border-secondary)",
            color: isUser ? "var(--text-primary-contrast)" : "var(--text-primary)"
          }}
        >
          <MarkdownPreview
            source={messageData.content || ""}
            style={{
              backgroundColor: "transparent",
              color: "inherit",
              margin: 0,
              fontSize: "0.9rem",
              lineHeight: "1.5"
            }}
          />
        </div>
        {showProcessingTime && messageData.processTime && (
          <small className="text-muted mt-1 d-block">
            <i className="bi bi-clock me-1" />
            Processing time: {(messageData.processTime / 1000).toFixed(1)}s
          </small>
        )}
      </div>
    );
  };

  return (
    <div className={containerClasses}>
      {compact ? (
        <MessageContent />
      ) : (
        <div className="d-flex align-items-start">
          <Avatar />
          <div className="message-content flex-grow-1">
            <MessageHeader />
            <MessageContent />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
