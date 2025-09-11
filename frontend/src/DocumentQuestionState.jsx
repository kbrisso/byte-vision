import { useCallback, useState, useRef, useEffect, useReducer } from "react";
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

// Constants
const DOCUMENT_SCOPE = "document";

// Form state reducer
const formStateReducer = (state, action) => {
    switch (action.type) {
        case 'UPDATE_FIELD':
            return {
                ...state,
                [action.field]: action.value
            };
        case 'RESET':
            return {
                embeddingPrompt: "",
                documentPrompt: "",
                searchKeywords: []
            };
        case 'SET_EMBEDDING_PROMPT':
            return {
                ...state,
                embeddingPrompt: action.value
            };
        case 'CLEAR_DOCUMENT_PROMPT':
            return {
                ...state,
                documentPrompt: ""
            };
        default:
            return state;
    }
};

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

    // Form State - SINGLE SOURCE OF TRUTH using reducer
    const [formState, dispatchFormState] = useReducer(formStateReducer, {
        embeddingPrompt: "",
        documentPrompt: "",
        searchKeywords: []
    });

    // Update form fields
    const updateFormField = useCallback((field, value) => {
        console.log(`Updating field ${field} to:`, value); // Debug log
        dispatchFormState({
            type: 'UPDATE_FIELD',
            field,
            value
        });
    }, []);

    // Reset form state
    const resetFormState = useCallback(() => {
        dispatchFormState({ type: 'RESET' });
    }, []);

    // Validate form state
    const validateFormState = useCallback(() => {
        const errors = [];
        
        if (!formState.embeddingPrompt.trim()) {
            errors.push("Embedding prompt is required");
        }
        
        if (!formState.documentPrompt.trim()) {
            errors.push("Document prompt is required");
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }, [formState]);

    // UI State for keyword dropdown
    const [keywordDropdownOpen, setKeywordDropdownOpen] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);
    const multiSelectRef = useRef(null);

    // Document Query State
    const [progressMessage, setProgressMessage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentRequestId, setCurrentRequestId] = useState(null);

    // Other state
    const [loading, setLoading] = useState(false);
    const [selectedDocPrompt, setSelectedDocPrompt] = useState("");
    const setSelectedDocPromptWithLogging = useCallback((value) => {
        setSelectedDocPrompt(value);
    }, [selectedDocPrompt]);
    const [documentHistory, setDocumentHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [leftActiveTab, setLeftActiveTab] = useState("history");
    const [exportingPDF, setExportingPDF] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState(null);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

    const eventListenersRef = useRef(false);

    // Document history operations
    const loadDocumentHistory = useCallback(async () => {
        if (!docId) return;

        try {
            setHistoryLoading(true);
            LogInfo(`Loading document history for: ${docId}`);

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

    // Event handlers for document query responses and progress
    const handleDocumentQueryResponse = useCallback((response) => {
        try {
            const requestId = response?.requestId || response?.RequestID || response?.request_id || null;

            setIsProcessing(false);
            setCurrentRequestId(null);
            setProgressMessage(null);
            setLoading(false);

            let success = false;
            if (response?.success === true || response?.Success === true) {
                success = true;
            }

            const result = response?.result || response?.Result || response?.response || "";
            const errorMessage = response?.error || response?.Error || response?.errorMessage || "";
            const processingTime = response?.processingTime || response?.ProcessingTime || response?.processing_time || null;

            if (success && (!result || !result.trim())) {
                success = false;
            }

            setChatHistory(prevHistory => {
                const newHistory = [...prevHistory];

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

            setProgressMessage(prevProgress => {
                if (prevProgress && prevProgress.progress > currentProgress) {
                    return prevProgress;
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
    }, []);

    // Event handling initialization
    const initializeDocumentQueryListeners = useCallback(() => {
        if (eventListenersRef.current) {
            return;
        }

        EventsOff("query-document-response");
        EventsOff("query-document-progress");

        EventsOn("query-document-response", handleDocumentQueryResponse);
        EventsOn("query-document-progress", handleDocumentQueryProgress);

        eventListenersRef.current = true;
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

    // Keyword Selection Operations - ALL use formState
    const handleKeywordToggle = useCallback((keyword) => {
        const currentKeywords = formState.searchKeywords;
        const newKeywords = currentKeywords.includes(keyword)
            ? currentKeywords.filter(k => k !== keyword)
            : [...currentKeywords, keyword];
        updateFormField('searchKeywords', newKeywords);
    }, [formState.searchKeywords, updateFormField]);

    const handleRemoveKeyword = useCallback((keywordToRemove) => {
        const newKeywords = formState.searchKeywords.filter(keyword => keyword !== keywordToRemove);
        updateFormField('searchKeywords', newKeywords);
    }, [formState.searchKeywords, updateFormField]);

    const clearKeywords = useCallback(() => {
        updateFormField('searchKeywords', []);
        setKeywordDropdownOpen(false);
        setHoveredOption(null);
    }, [updateFormField]);

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

    // Document Query Operations
    const submitQuery = useCallback(async (queryParams) => {
        if (isProcessing) {
            LogError("Query already in progress");
            return;
        }

        try {
            initializeDocumentQueryListeners();

            setIsProcessing(true);
            setLoading(true);

            const requestId = generateRequestId();
            setCurrentRequestId(requestId);

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

            addMessageToChat(
                "assistant",
                "Processing your query...",
                true,
                null,
                requestId
            );

            const payload = {
                ...queryParams,
                requestId,
            };

            EventsEmit("query-document-request", payload);

        } catch (error) {
            LogError(`Document query submission failed: ${error.message}`);

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

    // Update embedding prompt when doc prompt changes
    useEffect(() => {
        if (selectedDocPrompt && DOC_PROMPTS[selectedDocPrompt]) {
            const promptTemplate = DOC_PROMPTS[selectedDocPrompt];
            dispatchFormState({
                type: 'SET_EMBEDDING_PROMPT',
                value: promptTemplate
            });
        } else {
            dispatchFormState({
                type: 'SET_EMBEDDING_PROMPT',
                value: ""
            });
        }
    }, [selectedDocPrompt]);

    // Load document history when modal opens
    useEffect(() => {
        if (show && docId) {
            loadDocumentHistory().catch((error) => {
                LogError(`Failed to load document history: ${error}`);
            });
        }
    }, [show, docId, loadDocumentHistory]);

    // Add this handleSubmit function before the return statement
const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateFormState();
    if (!validation.isValid) {
        LogError(`Form validation failed: ${validation.errors.join(', ')}`);
        return;
    }

    // Check if already processing
    if (isProcessing || loading) {
        LogInfo("Already processing a request, ignoring submit");
        return;
    }

    try {
        setLoading(true);
        setIsProcessing(true);
        
        const requestId = generateRequestId();
        setCurrentRequestId(requestId);
        
        // Add user message to chat history
        const userMessage = {
            id: Date.now() + Math.random(),
            sender: "user",
            content: formState.documentPrompt,
            timestamp: new Date().toISOString(),
        };
        
        const loadingMessage = {
            id: Date.now() + Math.random() + 1,
            sender: "assistant",
            content: "",
            isLoading: true,
            timestamp: new Date().toISOString(),
            requestId,
        };
        
        setChatHistory(prev => [...prev, userMessage, loadingMessage]);
        
        // Prepare request payload
        const payload = {
            requestId: requestId,
            llamaCliArgs: cliState || {},
            llamaEmbedArgs: embState || {},
            indexId: indexValue,
            documentId: docId,
            embeddingPrompt: formState.embeddingPrompt,
            documentPrompt: formState.documentPrompt,
            promptType: selectedPromptType,
            searchKeywords: formState.searchKeywords || []
        };
        
        LogInfo("Submitting document query:", payload);
        
        // Emit the query request
        EventsEmit("query-document-request", payload);
        
        // Clear the document prompt after submission
        dispatchFormState({ type: 'CLEAR_DOCUMENT_PROMPT' });
        
    } catch (error) {
        LogError(`Failed to submit query: ${error}`);
        setLoading(false);
        setIsProcessing(false);
        setCurrentRequestId(null);
        setProgressMessage(null);
    }
}, [formState, validateFormState, isProcessing, loading, docId, indexValue, selectedDocPrompt]);

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Enter" && !e.shiftKey && !loading && formState.documentPrompt.trim()) {
                e.preventDefault();
                handleSubmit(e);
            }
        },
        [loading, formState.documentPrompt, handleSubmit]
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

    // Multi-select renderer - uses formState consistently
    const renderMultiSelect = useCallback(() => {
        return (
            <div className="position-relative" ref={multiSelectRef}>
                <div
                    className="form-control d-flex flex-wrap align-items-center"
                    onClick={() => setKeywordDropdownOpen(!keywordDropdownOpen)}
                    style={{
                        cursor: "pointer",
                        height: "40px",
                        fontSize: "0.85rem",
                        backgroundColor: "var(--bg-input)",
                        borderColor: "var(--border-secondary)",
                        color: "var(--text-primary)",
                        overflowY: "auto", // Add vertical scrollbar when content overflows
                        overflowX: "hidden", // Hide horizontal scrollbar to prevent horizontal overflow

                    }}
                >
                    {formState.searchKeywords.length > 0 ? (
                        formState.searchKeywords.map((keyword) => (
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
                                        checked={formState.searchKeywords.includes(keyword)}
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
        formState.searchKeywords,
        hoveredOption,
        handleRemoveKeyword,
        handleKeywordToggle,
        LEGAL_KEYWORDS,
    ]);

    // Computed values - uses formState
    const isSubmitDisabled = useCallback(() => {
        return (
            !formState.documentPrompt.trim() ||
            loading ||
            !selectedDocPrompt ||
            !formState.embeddingPrompt.trim() ||
            isProcessing
        );
    }, [formState, loading, selectedDocPrompt, isProcessing]);

    // Add this new function to handle reloading historical data
    const handleReloadHistoryToForm = useCallback(() => {
        if (!selectedHistoryItem) {
            LogError("No history item selected to reload");
            return;
        }

        try {
            LogInfo(`Reloading history item to form: ${selectedHistoryItem._id?.$oid || selectedHistoryItem._id}`);
            
            // Update form state with historical data
            dispatchFormState({
                type: 'UPDATE_FIELD',
                field: 'embeddingPrompt',
                value: selectedHistoryItem.embedPrompt || ""
            });
            
            dispatchFormState({
                type: 'UPDATE_FIELD',
                field: 'documentPrompt',
                value: selectedHistoryItem.docPrompt || ""
            });
            
            dispatchFormState({
                type: 'UPDATE_FIELD',
                field: 'searchKeywords',
                value: selectedHistoryItem.keywords || []
            });
            
            // Set the prompt type if it exists in settings
            if (selectedHistoryItem.promptType && setSelectedPromptType) {
                setSelectedPromptType(selectedHistoryItem.promptType);
            }
            
            // Find and set the matching document prompt template
            if (selectedHistoryItem.promptType && DOC_PROMPTS[selectedHistoryItem.promptType]) {
                setSelectedDocPrompt(selectedHistoryItem.promptType);
            }
            
            // Switch to chat tab to show the loaded form
            setLeftActiveTab("chat");
            
            LogInfo("Historical data successfully loaded to form");
            
        } catch (error) {
            LogError(`Failed to reload historical data: ${error}`);
        }
    }, [selectedHistoryItem, setSelectedPromptType, DOC_PROMPTS, setSelectedDocPrompt, setLeftActiveTab]);

    // Return the complete document question state interface
    return {
        // Form state - Primary interface
        formState,
        updateFormField,
        resetFormState,
        validateFormState,

        // Backward compatibility
        question: formState.documentPrompt,
        setQuestion: (value) => updateFormField('documentPrompt', value),
        embeddingPrompt: formState.embeddingPrompt,
        setEmbeddingPrompt: (value) => updateFormField('embeddingPrompt', value),
        selectedKeywords: formState.searchKeywords,

        // Other state
        loading,
        setLoading,
        selectedDocPrompt,
        setSelectedDocPrompt: setSelectedDocPromptWithLogging,

        // History state
        documentHistory,
        historyLoading,
        selectedHistoryId,
        selectedHistoryItem,

        // UI state
        leftActiveTab,
        setLeftActiveTab,
        exportingPDF,

        // Chat state
        chatHistory,
        chatContainerRef,
        addMessageToChat,
        updateMessageInChat,
        clearChatHistory,

        // Keyword state
        keywordDropdownOpen,
        hoveredOption,
        multiSelectRef,
        setKeywordDropdownOpen,
        setHoveredOption,
        handleKeywordToggle,
        handleRemoveKeyword,
        clearKeywords,

        // Query state
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

        // Add a manual clear function
        clearFormAndChat: useCallback(() => {
            clearChatHistory();
            clearKeywords();
            resetFormState();
            setSelectedDocPrompt("");
            setSelectedHistoryId(null);
            setSelectedHistoryItem(null);
        }, [clearChatHistory, clearKeywords, resetFormState]),

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
            
        // Add the new reload function
        handleReloadHistoryToForm,
    };
};

export { formatDate, DOCUMENT_SCOPE };