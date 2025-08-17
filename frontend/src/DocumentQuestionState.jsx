import { useCallback, useState, useRef, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";

import { LogError, LogInfo } from "../wailsjs/runtime/runtime.js";
import { GetDocumentQuestionResponse} from "../wailsjs/go/main/App.js";

import { useSettingsState } from "./StoreConfig.jsx";
import { LEGAL_KEYWORDS, DOC_PROMPTS, PDFReportDocument, PDFExportDocument } from "./CommonUtils.jsx";

// Constants specific to document question functionality
const DOCUMENT_SCOPE = "document";

// Helper functions
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
 * Consolidates all functionality from ChatHistoryManager, DocumentQueryHook, and KeywordSelectionHook
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
  const { settings, settingsLoading } = useSettingsState();

  // Chat History State (from ChatHistoryManager)
  const [chatHistory, setChatHistory] = useState([]);
  const chatContainerRef = useRef(null);

  // Keyword Selection State (from KeywordSelectionHook)
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [keywordDropdownOpen, setKeywordDropdownOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const multiSelectRef = useRef(null);

  // Document Query State (from DocumentQueryHook)
  const [progressMessage, setProgressMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Chat History Operations (from ChatHistoryManager)
  const addMessageToChat = useCallback((sender, content, isLoading = false, processTime = null) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      sender,
      content,
      timestamp: new Date().toISOString(),
      isLoading,
      processTime,
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

  // Auto-scroll to bottom when new messages are added (from ChatHistoryManager)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Keyword Selection Operations (from KeywordSelectionHook)
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

  // Close dropdown when clicking outside (from KeywordSelectionHook)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (multiSelectRef.current && !multiSelectRef.current.contains(event.target)) {
        setKeywordDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Document Query Operations (from DocumentQueryHook)
  const submitQuery = useCallback(async (queryParams) => {
    if (isProcessing) {
      LogError("Query already in progress");
      return;
    }

    try {
      setIsProcessing(true);
      setProgressMessage({ 
        progress: 0, 
        message: "Initializing query...",
        startTime: Date.now()
      });

      LogInfo("Submitting document query:", queryParams);

      // Add loading message to chat
      const loadingMessage = addMessageToChat("assistant", "Processing your query...", true);

      // Update progress
      setProgressMessage({ 
        progress: 25, 
        message: "Submitting query to server...",
        startTime: Date.now()
      });

      // Submit the query
      const response = await GetDocumentQuestionResponse(queryParams);

      // Update progress
      setProgressMessage({ 
        progress: 75, 
        message: "Processing response...",
        startTime: Date.now()
      });

      // Parse response
      const result = typeof response === 'string' ? JSON.parse(response) : response;
      
      if (result.success) {
        // Update the loading message with the actual response
        updateMessageInChat(loadingMessage, {
          content: result.response || "Query completed successfully",
          isLoading: false,
          processTime: result.processTime || null
        });

        // Reload document history after successful query
        await loadDocumentHistory();
      } else {
        // Update with error message
        updateMessageInChat(loadingMessage, {
          content: `Error: ${result.error || "Query failed"}`,
          isLoading: false,
          sender: "error"
        });
      }

      setProgressMessage({ 
        progress: 100, 
        message: "Query completed",
        startTime: Date.now()
      });

    } catch (error) {
      LogError(`Document query failed: ${error.message}`);
      
      // Find and update any loading message
      setChatHistory(prev => 
        prev.map(msg => 
          msg.isLoading 
            ? { ...msg, content: `Error: ${error.message}`, isLoading: false, sender: "error" }
            : msg
        )
      );

      setProgressMessage({ 
        progress: 0, 
        message: `Query failed: ${error.message}`,
        startTime: Date.now()
      });
    } finally {
      setIsProcessing(false);
      // Clear progress after a short delay
      setTimeout(() => {
        setProgressMessage(null);
      }, 2000);
    }
  }, [isProcessing, addMessageToChat, updateMessageInChat]);

  const handleCancel = useCallback(async () => {
    if (!isProcessing) return;

    try {
      LogInfo("Cancelling document query");
      await CancelDocumentQuery();
      
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
    }
  }, [isProcessing]);

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

      try {
        LogInfo("Submitting document question:", {
          docId,
          question: question.substring(0, 50) + "...",
          selectedDocPrompt,
        });

        // Add a user message only after validation passes
        addMessageToChat("user", question);

        // Submit query
        await submitQuery({
          llamaCliArgs: cliState,
          llamaEmbedArgs: embState,
          indexId: indexValue,
          documentId: docId,
          embeddingPrompt: embeddingPrompt.trim(),
          documentPrompt: question.trim(),
          promptType: selectedDocPrompt,
          searchKeywords: selectedKeywords,
        });

        // Clear question only on successful submission
        setQuestion("");
        LogInfo("Document question submitted successfully");
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
      addMessageToChat,
      submitQuery,
      cliState,
      embState,
      indexValue,
      docId,
      selectedKeywords,
    ]
  );

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey && !loading && question.trim()) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [loading, question, handleSubmit]
  );

  // History selection handler
  const handleSelectHistoryItem = useCallback((historyItem) => {
    const itemId = historyItem._id?.$oid || historyItem._id;
    setSelectedHistoryId(itemId);
    setSelectedHistoryItem(historyItem);
    LogInfo(`Selected history item: ${itemId}`);
  }, []);

  // PDF export handlers
  const handleExportPDF = useCallback(async () => {
    if (!chatHistory.length || exportingPDF) return;

    try {
      setExportingPDF(true);
      LogInfo("Exporting chat session to PDF");

      const documentTitle = sourceLocation
        ? sourceLocation.split("/").pop() || sourceLocation.split("\\").pop()
        : "Unknown Document";

      const pdfBlob = await pdf(
        <PDFExportDocument
          chatHistory={chatHistory}
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

  // Multi-select renderer
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

    // Query state (consolidated from DocumentQueryHook)
    progressMessage,
    isProcessing,
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
