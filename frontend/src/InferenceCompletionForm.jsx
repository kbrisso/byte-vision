import { useCallback, useState, useEffect, useRef } from "react";
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


import { LogError } from "../wailsjs/runtime/runtime.js";

import "../public/main.css";
import ChatMessage from "./ChatMessageComponent.jsx";
import { useInferenceState } from "./InferenceCompletionState.jsx";
import { PROMPT_TYPES, PDFExportDocument } from "./CommonUtils.jsx";

const InferenceCompletionForm = () => {
    // Use the dedicated inference state hook
    const inference = useInferenceState();

    // Local component state
    const [initError, setInitError] = useState(null);
    const chatContainerRef = useRef(null);

    // Auto-scroll effect
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [inference.messages]);

    // Initialize inference system
    useEffect(() => {
        if (!inference.settingsLoading && !inference.isInitialized) {
            inference.initializeInference()
                .then(() => {
                    console.log("Inference initialized successfully");
                    setInitError(null);
                })
                .catch((err) => {
                    console.error("Inference initialization failed:", err);
                    setInitError(err?.message || "Failed to initialize inference");
                    LogError(`Failed to initialize inference: ${err?.message || err}`);
                });
        }
    }, [inference.settingsLoading, inference.isInitialized, inference.initializeInference, inference]);

    // Set default prompt type
    useEffect(() => {
        if (PROMPT_TYPES.length > 0 && !inference.selectedPromptType) {
            inference.setSelectedPromptType(PROMPT_TYPES[0]);
        }
    }, [inference, inference.selectedPromptType, inference.setSelectedPromptType]);

    // Handlers
    const onSubmit = useCallback((e) => {
    e?.preventDefault?.();
    console.log('Form submit triggered');
    
    // Check if form is in a valid state to submit
    if (inference.isSubmitDisabled(inference.selectedPromptType, inference.currentMessage)) {
        console.warn('Submit prevented: form is disabled');
        return;
    }
    
    inference.submitMessage(
        inference.selectedPromptType,
        inference.currentMessage,
        inference.settings
    ).catch((error) => {
        console.error('Submit message failed:', error);
        LogError(`Failed to submit message: ${error?.message || error}`);
    });
}, [inference]);

const onKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey && !inference.isSubmitDisabled(inference.selectedPromptType, inference.currentMessage)) {
        e.preventDefault();
        console.log('Enter key submit triggered');
        
        inference.submitMessage(
            inference.selectedPromptType,
            inference.currentMessage,
            inference.settings
        ).catch((error) => {
            console.error('Enter key submit failed:', error);
            LogError(`Failed to submit message via Enter key: ${error?.message || error}`);
        });
    }
}, [inference]);

const onClear = useCallback((e) => {
    e?.preventDefault?.();
    console.log('Clear button clicked');
    
    try {
        inference.handleClear();
        console.log('Clear operation completed successfully');
    } catch (error) {
        console.error('Clear operation failed:', error);
        LogError(`Failed to clear: ${error?.message || error}`);
    }
}, [inference]);

const onRefresh = useCallback(async (e) => {
    e?.preventDefault?.();
    console.log('Refresh button clicked');
    
    // Prevent multiple simultaneous refresh operations
    if (inference.isRefreshing) {
        console.warn('Refresh already in progress, skipping');
        return;
    }
    
    try {
        await inference.handleRefresh();
        console.log('Refresh completed successfully');
    } catch (err) {
        console.error('Refresh failed:', err);
        LogError(`Refresh operation failed: ${err?.message || err}`);
    }
}, [inference]);

const onCancel = useCallback(() => {
    console.log('Cancel triggered');
    
    try {
        inference.cancelGeneration().catch((error) => {
            console.error('Cancel operation failed:', error);
            LogError(`Failed to cancel generation: ${error?.message || error}`);
        });
    } catch (error) {
        console.error('Cancel operation threw synchronous error:', error);
        LogError(`Cancel operation error: ${error?.message || error}`);
    }
}, [inference]);

const onExportPDF = useCallback(async () => {
    console.log('PDF export initiated');
    
    // Check if export is already in progress
    if (inference.isExportingPDF) {
        console.warn('PDF export already in progress, skipping');
        return;
    }
    
    // Check if there's content to export
    if (!inference.messages || inference.messages.length === 0) {
        console.warn('No messages to export');
        LogError('Cannot export PDF: no messages available');
        return;
    }
    
    try {
        await inference.handleExportPDF(PDFExportDocument, "Inference Chat");
        console.log('PDF export completed successfully');
    } catch (err) {
        console.error('PDF export failed:', err);
        LogError(`PDF export failed: ${err?.message || err}`);
    }
}, [inference]);


    // Computed values
    const isSubmitDisabled = inference.isSubmitDisabled(inference.selectedPromptType, inference.currentMessage);
    const isLoading = inference.isLoadingComputed(inference.settingsLoading);

    if (initError) {
        return (
            <div className="theme-container">
                <Alert variant="danger" className="m-3">
                    <Alert.Heading>Inference Initialization Failed</Alert.Heading>
                    <p>{initError}</p>
                    <Button
                        variant="outline-danger"
                        onClick={() => {
                            setInitError(null);
                            inference.initializeInference().catch(setInitError);
                        }}
                    >
                        Retry
                    </Button>
                </Alert>
            </div>
        );
    }

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
                        />
                        <div>
                            <h5 className="mb-0" style={{ fontSize: "1rem" }}>
                                AI Inference
                            </h5>
                            <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                                Generate AI completions using various prompt templates and models
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
                    {Object.keys(inference.settings?.llamaCli || {}).length > 0 ? "✅" : "⚠️"}
                </span>
                {Object.keys(inference.settings?.llamaCli || {}).length > 0
                    ? `Configuration Active: ${inference.settings?.llamaCli?.Description || "Unnamed Configuration"}`
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
                        <Row style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
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
                                <Row className="mb-3">
                                    <Col>
                                        <Form.Group>
                                            <Form.Label className="small mb-1">
                                                <i className="bi bi-gear-fill me-1" />
                                                Prompt Type
                                            </Form.Label>
                                            <Form.Select
                                                value={inference.selectedPromptType}
                                                onChange={(e) => inference.setSelectedPromptType(e.target.value)}
                                                className="theme-form-control"
                                                size="sm"
                                            >
                                                {PROMPT_TYPES.map((type) => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Chat Messages */}
                                <div
                                    ref={chatContainerRef}
                                    className="chat-container theme-chat-container mb-3"
                                    style={{
                                        flex: 1,
                                        overflowY: "auto",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: "8px",
                                        padding: "1rem",
                                        backgroundColor: "var(--bg-secondary)",
                                    }}
                                >
                                    {inference.messages.length === 0 ? (
                                        <div className="text-center text-muted py-5">
                                            <i className="bi bi-chat-text" style={{ fontSize: "2rem" }} />
                                            <p className="mt-2">Start a conversation with AI</p>
                                            <small>Select a prompt type and enter your message below</small>
                                        </div>
                                    ) : (
                                        inference.messages.map((msg, index) => (
                                          <ChatMessage
                                            key={msg.id || index}
                                            message={msg}
                                            index={index}
                                            compact={false}
                                            showAvatar={true}
                                            showTimestamp={true}
                                            showProcessingTime={true}
                                          />
                                        ))
                                    )}

                                    {/* Progress Message */}
                                    {inference.progress && (
                                        <div className="progress-message text-center text-muted py-2">
                                            <small>
                                                <i className="bi bi-gear-fill me-1" />
                                                {inference.progress.message || "Processing..."}
                                            </small>
                                        </div>
                                    )}
                                </div>

                                {/* Message Input Form */}
                                <Form onSubmit={onSubmit} className="mt-auto">
                                    <Row className="align-items-end">
                                        <Col>
                                            <Form.Group>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    placeholder="Enter your message here..."
                                                    value={inference.currentMessage}
                                                    onChange={(e) => inference.setCurrentMessage(e.target.value)}
                                                    onKeyDown={onKeyDown}
                                                    onFocus={() => inference.setTextareaFocused(true)}
                                                    onBlur={() => inference.setTextareaFocused(false)}
                                                    className="theme-form-control"
                                                    disabled={inference.isGenerating}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs="auto">
                                            <div className="d-flex flex-column gap-2">
                                                {inference.isGenerating ? (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={onCancel}
                                                        className="d-flex align-items-center"
                                                    >
                                                        <i className="bi bi-stop-fill me-1" />
                                                        Stop
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="submit"
                                                        variant="primary"
                                                        size="sm"
                                                        disabled={isSubmitDisabled}
                                                        className="d-flex align-items-center"
                                                    >
                                                        <i className="bi bi-send-fill me-1" />
                                                        Send
                                                    </Button>
                                                )}
                                                <div className="d-flex gap-1">
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={onClear}
                                                        title="Clear Chat"
                                                        disabled={inference.isGenerating}
                                                    >
                                                        <i className="bi bi-trash" />
                                                    </Button>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={onRefresh}
                                                        title="Refresh History"
                                                        disabled={inference.isGenerating}
                                                    >
                                                        <i className="bi bi-arrow-clockwise" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Form>
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
                                <Card className="h-100">
                                    <Card.Header className="py-2">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <h6 className="mb-0">
                                                <i className="bi bi-clock-history me-2" />
                                                Chat History
                                            </h6>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={onExportPDF}
                                                disabled={inference.messages.length === 0 || inference.isExportingPDF}
                                                title="Export as PDF"
                                            >
                                                {inference.isExportingPDF ? (
                                                    <Spinner animation="border" size="sm" />
                                                ) : (
                                                    <i className="bi bi-file-pdf" />
                                                )}
                                            </Button>
                                        </div>
                                    </Card.Header>
                                    <Card.Body
                                        className="p-0"
                                        style={{
                                            overflow: "hidden",
                                            display: "flex",
                                            flexDirection: "column"
                                        }}
                                    >
                                        <div style={{ flex: 1, overflowY: "auto" }}>
                                            {inference.isLoadingHistory ? (
                                                <div className="text-center py-4">
                                                    <Spinner animation="border" size="sm" />
                                                    <div className="mt-2 small text-muted">Loading history...</div>
                                                </div>
                                            ) : inference.savedChats.length === 0 ? (
                                                <div className="text-center py-4 text-muted">
                                                    <i className="bi bi-inbox" style={{ fontSize: "2rem" }} />
                                                    <p className="mt-2 small">No saved chats yet</p>
                                                </div>
                                            ) : (
                                                <div className="list-group list-group-flush">
                                                    {inference.savedChats.map((chat, index) => (
                                                        <div
                                                            key={chat._id || index}
                                                            className={`list-group-item list-group-item-action cursor-pointer chat-history-item ${
                                                                inference.selectedChatId === chat._id ? "active" : ""
                                                            }`}
                                                            onClick={() => {
                                                                inference.loadSavedChat(chat);
                                                                inference.setSelectedChatId(chat._id);
                                                            }}
                                                            onMouseEnter={() => inference.setHoveredHistoryId(chat._id)}
                                                            onMouseLeave={() => inference.setHoveredHistoryId(null)}
                                                            style={{
                                                                borderLeft: inference.selectedChatId === chat._id
                                                                    ? "3px solid var(--bs-primary)"
                                                                    : "3px solid transparent"
                                                            }}
                                                        >
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div className="flex-grow-1 min-w-0">
                                                                    <div className="small fw-medium text-truncate">
                                                                        {inference.extractUserQuestion(chat.question) || "Untitled Chat"}
                                                                    </div>
                                                                    <div className="small text-muted text-truncate mt-1">
                                                                        {chat.response?.substring(0, 60) || "No response"}
                                                                        {chat.response?.length > 60 ? "..." : ""}
                                                                    </div>
                                                                    <div className="small text-muted mt-1">
                                                                        {inference.formatDate(chat.createdAt)}
                                                                    </div>
                                                                </div>
                                                                {inference.hoveredHistoryId === chat._id && (
                                                                    <i className="bi bi-chevron-right text-muted" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </Card.Body>
            </Card>

            {/* Progress Overlay */}
            {inference.isGenerating && inference.progress && (
                <div
                    className="position-fixed"
                    style={{
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 9999,
                        minWidth: "360px",
                        maxWidth: "560px",
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
                                <h6 className="mb-0">Processing</h6>
                            </div>
                            <Button
                                variant="outline-light"
                                size="sm"
                                onClick={onCancel}
                                className="btn-close-custom"
                            >
                                <i className="bi bi-x-lg" />
                            </Button>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-muted small">Progress</span>
                                    <span className="badge bg-primary">
                                        {inference.progress?.progress || 0}%
                                    </span>
                                </div>
                                <div className="progress" style={{ height: "8px" }}>
                                    <div
                                        className="progress-bar bg-primary"
                                        role="progressbar"
                                        style={{ width: `${inference.progress?.progress || 0}%` }}
                                        aria-valuenow={inference.progress?.progress || 0}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    />
                                </div>
                            </div>

                            <div className="mb-0">
                                <h6 className="mb-2">Current Step:</h6>
                                <p className="mb-0 text-muted">
                                    {inference.progress?.message || "Initializing..."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InferenceCompletionForm;