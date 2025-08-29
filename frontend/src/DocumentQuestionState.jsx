import { useCallback, useState, useRef, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";

import {
    EventsEmit,
    EventsOff,
    EventsOn,
    LogError,
    LogInfo,
} from "../wailsjs/runtime/runtime.js";
import { CancelProcess, GetDocumentQuestionResponse} from "../wailsjs/go/main/App.js";

import { useSettingsState } from "./StoreConfig.jsx";
import { LEGAL_KEYWORDS, DOC_PROMPTS, PDFReportDocument, PDFExportDocument } from "./CommonUtils.jsx";

// Constants specific to document question functionality
const DOCUMENT_SCOPE = "document";

// Helper functions
const generateRequestId = () =>
    `document_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

/**
 * Self-contained document question state management hook
 * Now uses event-driven communication with the backend
 */
export const useDocumentQuestionState = ({
                                             show,
                                             docId,
                                             indexValue,
                                             sourceLocation,
                                             cliState,
                                             embState,
                                         }) => {
    // Settings from external hook
    const { settings, settingsLoading, selectedPromptType, setSelectedPromptType } = useSettingsState();

    // Chat History State
    const [chatHistory, setChatHistory] = useState([]);
    const chatContainerRef = useRef(null);

    // Keyword Selection State
    const [selectedKeywords, setSelectedKeywords] = useState([]);
    const [keywordDropdownOpen, setKeywordDropdownOpen] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);
    const multiSelectRef = useRef(null);

    // Document Query State - now event-driven
    const [progressMessage, setProgressMessage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentRequestId, setCurrentRequestId] = useState(null);

    // Internal document question state
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
    const [eventListenersInitialized, setEventListenersInitialized] = useState(false);

    const eventListenersRef = useRef(false);

    // Document history operations - moved up before event handlers
    const loadDocumentHistory = useCallback(async () => {
        if (!docId) return;

        try {
            setHistoryLoading(true);
            LogInfo(`Loading document history for: ${docId}`);

            // For history loading, we could also use events, but keeping direct call for now
            // since it's a simpler read operation
            const response = await GetDocumentQuestionResponse(docId);
            const historyData = Array.isArray(JSON.parse(response))
                ? JSON.parse(response)
                : [];

            setDocumentHistory(historyData);
            LogInfo(`Loaded ${historyData.length} document history items`);
        } catch (error) {
            LogError(`Failed to load document history: ${error}`);
            setDocumentHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    }, [docId]);

    // Event handlers for document query responses and progress - now properly ordered
    const handleDocumentQueryResponse = useCallback((response) => {
        try {
            // Fixed: Handle both camelCase and PascalCase variations
            const requestId = response?.requestId || response?.RequestID || response?.request_id || null;

            // Reset processing state
            setIsProcessing(false);
            setCurrentRequestId(null);
            setProgressMessage(null);
            setLoading(false);

            // Fixed: Handle both success field variations and ensure proper boolean conversion
            let success = false;
            if (response?.success === true || response?.Success === true) {
                success = true;
            }

            // Fixed: Handle all possible result field names
            const result = response?.result || response?.Result || response?.response || "";
            const errorMessage = response?.error || response?.Error || response?.errorMessage || "";
            const processingTime = response?.processingTime || response?.ProcessingTime || response?.processing_time || null;

            // Validate successful response has content
            if (success && (!result || !result.trim())) {
                success = false;
            }

            setChatHistory(prevHistory => {
                const newHistory = [...prevHistory];

                // Find and update the loading message
                let loadingIndex = -1;
                if (requestId) {
                    loadingIndex = newHistory.findIndex(
                        (msg) => msg.isLoading && msg.requestId === requestId
                    );
                }
                if (loadingIndex === -1) {
                    loadingIndex = newHistory.findIndex((msg) => msg.isLoading);
                }

                if (loadingIndex !== -1) {
                    if (success) {
                        newHistory[loadingIndex] = {
                            ...newHistory[loadingIndex],
                            content: result,
                            isLoading: false,
                            processTime: processingTime,
                            requestId,
                        };
                    } else {
                        newHistory[loadingIndex] = {
                            ...newHistory[loadingIndex],
                            content: `Error: ${errorMessage || "Failed to process query"}`,
                            isLoading: false,
                            sender: "error",
                            requestId,
                        };
                    }
                } else {
                    // Add new message if no loading message found
                    if (success) {
                        newHistory.push({
                            id: Date.now() + Math.random(),
                            sender: "assistant",
                            content: result,
                            timestamp: new Date().toISOString(),
                            processTime: processingTime,
                            requestId,
                        });
                    } else {
                        newHistory.push({
                            id: Date.now() + Math.random(),
                            sender: "error",
                            content: `Error: ${errorMessage || "Failed to process query"}`,
                            timestamp: new Date().toISOString(),
                            requestId,
                        });
                    }
                }

                return newHistory;
            });

            // Reload document history after successful query
            if (success) {
                loadDocumentHistory().catch((error) => {
                    LogError(`Failed to reload document history: ${error}`);
                });
            }

        } catch (err) {
            LogError(`Error handling document query response: ${err?.message || err}`);
        }
    }, [loadDocumentHistory]);

    const handleDocumentQueryProgress = useCallback((progressData) => {
        try {
            const currentProgress = progressData?.progress || progressData?.Progress || 0;

            // Fix: Only update if progress is moving forward (prevent race conditions)
            setProgressMessage(prevProgress => {
                if (prevProgress && prevProgress.progress > currentProgress) {
                    return prevProgress; // Don't go backwards in progress
                }

                return {
                    status: progressData?.status || progressData?.Status,
                    message: progressData?.message || progressData?.Message,
                    progress: currentProgress,
                    requestId: progressData?.requestId || progressData?.RequestID || progressData?.request_id,
                    startTime: prevProgress?.startTime || progressData?.startTime || progressData?.start_time || Date.now(),
                };
            });
        } catch (err) {
            LogError(`Error handling document query progress: ${err?.message || err}`);
        }
    }, [isProcessing]);

    // Event handling initialization - now has access to both handlers
    const initializeDocumentQueryListeners = useCallback(() => {
        if (eventListenersRef.current) {
            return; // Already initialized
        }

        // Prevent duplicates
        EventsOff("query-document-response");
        EventsOff("query-document-progress");

        EventsOn("query-document-response", handleDocumentQueryResponse);
        EventsOn("query-document-progress", handleDocumentQueryProgress);

        eventListenersRef.current = true;
        setEventListenersInitialized(true);
        LogInfo("Document query event listeners initialized");
    }, [handleDocumentQueryResponse, handleDocumentQueryProgress]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventListenersRef.current) {
                EventsOff("query-document-response");
                EventsOff("query-document-progress");
                eventListenersRef.current = false;
            }
        };
    }, []);

    // Initialize listeners when modal shows
    useEffect(() => {
        if (show && !eventListenersRef.current) {
            initializeDocumentQueryListeners();
        }
    }, [show, initializeDocumentQueryListeners]);

    // Chat History Operations
    const addMessageToChat = useCallback((sender, content, isLoading = false, processTime = null, requestId = null) => {
        const newMessage = {
            id: Date.now() + Math.random(),
            sender,
            content,
            timestamp: new Date().toISOString(),
            isLoading,
            processTime,
            requestId,
        };

        setChatHistory(prevHistory => [...prevHistory, newMessage]);
        return newMessage;
    }, []);

    const updateMessageInChat = useCallback((messageToUpdate, updates) => {
        setChatHistory(prevHistory =>
            prevHistory.map(msg =>
                msg.id === messageToUpdate.id ? { ...msg, ...updates } : msg
            )
        );
    }, []);

    const clearChatHistory = useCallback(() => {
        setChatHistory([]);
    }, []);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // Keyword Selection Operations
    const handleKeywordToggle = useCallback((keyword) => {
        setSelectedKeywords(prev =>
            prev.includes(keyword)
                ? prev.filter(k => k !== keyword)
                : [...prev, keyword]
        );
    }, []);

    const handleRemoveKeyword = useCallback((keywordToRemove) => {
        setSelectedKeywords(prev => prev.filter(keyword => keyword !== keywordToRemove));
    }, []);

    const clearKeywords = useCallback(() => {
        setSelectedKeywords([]);
        setKeywordDropdownOpen(false);
        setHoveredOption(null);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (multiSelectRef.current && !multiSelectRef.current.contains(event.target)) {
                setKeywordDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Document Query Operations - now event-driven
    const submitQuery = useCallback(async (queryParams) => {
        if (isProcessing) {
            LogError("Query already in progress");
            return;
        }

        try {
            // Initialize listeners
            initializeDocumentQueryListeners();

            setIsProcessing(true);
            setLoading(true);

            // Generate request ID
            const requestId = generateRequestId();
            setCurrentRequestId(requestId);

            // Set initial progress with startTime
            const startTime = Date.now();
            setProgressMessage({
                status: "initializing",
                message: "Starting document query...",
                progress: 0,
                requestId,
                startTime,
            });

            LogInfo("Submitting document query via events:", {
                requestId,
                documentId: queryParams.documentId,
                indexId: queryParams.indexId,
            });

            // Add loading message to chat
            const loadingMessage = addMessageToChat(
                "assistant",
                "Processing your query...",
                true,
                null,
                requestId
            );

            // Emit the query request event
            const payload = {
                ...queryParams,
                requestId,
            };

            EventsEmit("query-document-request", payload);

        } catch (error) {
            LogError(`Document query submission failed: ${error.message}`);

            // Update any loading messages with error
            setChatHistory(prev =>
                prev.map(msg =>
                    msg.isLoading
                        ? { ...msg, content: `Error: ${error.message}`, isLoading: false, sender: "error" }
                        : msg
                )
            );

            setIsProcessing(false);
            setLoading(false);
            setCurrentRequestId(null);
            setProgressMessage(null);
        }
    }, [isProcessing, initializeDocumentQueryListeners, addMessageToChat]);
    const handleCancel = useCallback(async () => {
        if (!isProcessing) return;

        try {
            LogInfo("Cancelling document query");
            await CancelProcess();

            // Update any loading messages
            setChatHistory(prev =>
                prev.map(msg =>
                    msg.isLoading
                        ? { ...msg, content: "Query cancelled by user", isLoading: false, sender: "error" }
                        : msg
                )
            );

            setProgressMessage(null);
        } catch (error) {
            LogError(`Failed to cancel query: ${error.message}`);
        } finally {
            setIsProcessing(false);
            setLoading(false);
            setCurrentRequestId(null);
        }
    }, [isProcessing]);

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
            setLeftActiveTab("history");
            setSelectedHistoryId(null);
            setSelectedHistoryItem(null);
            setExportingPDF(false);
            setProgressMessage(null);
            setIsProcessing(false);
            setCurrentRequestId(null);
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
            loadDocumentHistory().catch((error) => {
                LogError(`Failed to load document history: ${error}`);
            });
        }
    }, [show, docId, loadDocumentHistory]);

    // Form submission handler
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
            // Add validation for selectedPromptType from global state
            if (!selectedPromptType) {
                LogError("Please select a prompt type from global settings");
                return;
            }

            try {
                LogInfo("Submitting document question:", {
                    docId,
                    question: question.substring(0, 50) + "...",
                    selectedDocPrompt,
                    selectedPromptType, // Log both for debugging
                });

                // Add a user message only after validation passes
                addMessageToChat("user", question);

                // Submit query via events - use selectedPromptType from global state
                await submitQuery({
                    llamaCliArgs: cliState,
                    llamaEmbedArgs: embState,
                    indexId: indexValue,
                    documentId: docId,
                    embeddingPrompt: embeddingPrompt.trim(),
                    documentPrompt: question.trim(),
                    promptType: selectedPromptType, // Use global selectedPromptType instead of selectedDocPrompt
                    searchKeywords: selectedKeywords,
                });

                // Clear question only on successful submission
                setQuestion("");
                LogInfo("Document question submitted successfully via events");
            } catch (error) {
                LogError(`Query submission failed: ${error.message}`);
            }
        },
        [
            question,
            loading,
            isProcessing,
            selectedDocPrompt,
            embeddingPrompt,
            selectedPromptType, // Add selectedPromptType to dependencies
            addMessageToChat,
            submitQuery,
            cliState,
            embState,
            indexValue,
            docId,
            selectedKeywords,
        ]
    );
    // Rest of the component remains the same (keyboard handler, history selection, PDF export, etc.)
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Enter" && !e.shiftKey && !loading && question.trim()) {
                e.preventDefault();
                handleSubmit(e);
            }
        },
        [loading, question, handleSubmit]
    );

    const handleSelectHistoryItem = useCallback((historyItem) => {
        const itemId = historyItem._id?.$oid || historyItem._id;
        setSelectedHistoryId(itemId);
        setSelectedHistoryItem(historyItem);
        LogInfo(`Selected history item: ${itemId}`);
    }, []);

    const handleExportPDF = useCallback(async () => {
        if (!chatHistory.length || exportingPDF) return;

        try {
            setExportingPDF(true);
            LogInfo("Exporting chat session to PDF");

            const documentTitle = sourceLocation
                ? sourceLocation.split("/").pop() || sourceLocation.split("\\").pop()
                : "Unknown Document";

            // Convert chat history to the format expected by PDFExportDocument
            const formattedChatHistory = chatHistory.map(message => ({
                id: message.id,
                sender: message.sender,
                content: message.content,
                timestamp: message.timestamp,
                processTime: message.processTime,
            }));

            const pdfBlob = await pdf(
                <PDFExportDocument
                    chatHistory={formattedChatHistory}
                    documentTitle={documentTitle}
                />
            ).toBlob();

            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `chat-session-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            LogInfo("Chat session PDF exported successfully");
        } catch (error) {
            LogError(`PDF export failed: ${error}`);
            LogError(`PDF export failed: ${error.message}`);
        } finally {
            setExportingPDF(false);
        }
    }, [chatHistory, sourceLocation, exportingPDF]);

    const handleExportHistoryReport = useCallback(async () => {
        if (!selectedHistoryItem || exportingPDF) return;

        try {
            setExportingPDF(true);
            LogInfo("Exporting history report to PDF");

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

            const pdfBlob = await pdf(<PDFReportDocument reportData={reportData} />).toBlob();

            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `legal-analysis-report-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            LogInfo("History report PDF exported successfully");
        } catch (error) {
            LogError(`PDF report export failed: ${error}`);
        } finally {
            setExportingPDF(false);
        }
    }, [selectedHistoryItem, docId, indexValue, exportingPDF]);

    // Multi-select renderer (unchanged)
    const renderMultiSelect = useCallback(() => {
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
                    />
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
                                        hoveredOption === keyword ? "var(--bg-secondary)" : "transparent",
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
    }, [
        multiSelectRef,
        keywordDropdownOpen,
        setKeywordDropdownOpen,
        selectedKeywords,
        handleRemoveKeyword,
        hoveredOption,
        setHoveredOption,
        handleKeywordToggle,
    ]);

    // Computed values
    const isSubmitDisabled = useCallback(() => {
        return (
            !question.trim() ||
            loading ||
            !selectedDocPrompt ||
            !embeddingPrompt.trim() ||
            isProcessing
        );
    }, [question, loading, selectedDocPrompt, embeddingPrompt, isProcessing]);

    // Return the complete document question state interface
    return {
        // Form state
        question,
        setQuestion,
        loading,
        setLoading,
        selectedDocPrompt,
        setSelectedDocPrompt,
        embeddingPrompt,
        setEmbeddingPrompt,

        // History state
        documentHistory,
        historyLoading,
        selectedHistoryId,
        selectedHistoryItem,

        // UI state
        leftActiveTab,
        setLeftActiveTab,
        exportingPDF,

        // Chat state (consolidated from ChatHistoryManager)
        chatHistory,
        chatContainerRef,
        addMessageToChat,
        updateMessageInChat,
        clearChatHistory,

        // Keyword state (consolidated from KeywordSelectionHook)
        selectedKeywords,
        keywordDropdownOpen,
        hoveredOption,
        multiSelectRef,
        setKeywordDropdownOpen,
        setHoveredOption,
        handleKeywordToggle,
        handleRemoveKeyword,
        clearKeywords,

        // Query state (now event-driven)
        progressMessage,
        isProcessing,
        currentRequestId,
        submitQuery,
        handleCancel,

        // Actions
        handleSubmit,
        handleKeyDown,
        handleSelectHistoryItem,
        handleExportPDF,
        handleExportHistoryReport,
        loadDocumentHistory,

        // Computed
        isSubmitDisabled,

        // Renderers
        renderMultiSelect,

        // Utilities
        formatDate,

        // Settings
        settings,
        settingsLoading,

        // Constants
        DOCUMENT_SCOPE,
        DOC_PROMPTS,
        LEGAL_KEYWORDS,
    };
};

// Export utility functions that might be needed elsewhere
export { formatDate, DOCUMENT_SCOPE };