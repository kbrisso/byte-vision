import { useCallback, useState, useRef, useEffect } from "react";

import {
  EventsEmit,
  EventsOff,
  EventsOn,
  LogError,
  LogInfo,
} from "../wailsjs/runtime/runtime.js";
import { GetInferenceHistory, CancelProcess } from "../wailsjs/go/main/App.js";

import { useSettingsState } from "./StoreConfig.jsx";

// Constants specific to inference completion
const INFERENCE_SCOPE = "inference";
const INFERENCE_CLI_ARGS = {
  id: "",
  description: "Inference Configuration",
  promptCmd: "--prompt",
  promptCmdEnabled: true,
};

// Helper functions
const generateRequestId = () =>
  `inference_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateMessageId = () => 
  `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

const extractUserQuestion = (questionText) => {
  if (!questionText) return "";
  const parts = String(questionText).split("User");
  return parts.length > 1 ? parts[1].trim() : String(questionText).trim();
};

const formatChatData = (chat) => ({
  _id: chat._id || chat.id || `chat_${Date.now()}_${Math.random()}`,
  response: chat.response || chat.answer || chat.content || "",
  args: chat.args || INFERENCE_CLI_ARGS,
  question: chat.question || chat.query || "",
  createdAt: chat.createdAt || chat.timestamp || new Date().toISOString(),
});

const parseHistoryResponse = (result) => {
  if (Array.isArray(result)) return result;
  if (result?.history) return result.history;
  if (result?.data) return result.data;

  if (result && typeof result === "object") {
    const keys = ["id", "response", "question", "createdAt"];
    for (const k of keys) {
      if (Array.isArray(result[k])) return result[k];
    }
  }
  return [];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.abs(now - date);
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return "Today";
  if (days === 2) return "Yesterday";
  if (days <= 7) return `${days - 1} days ago`;
  return date.toLocaleDateString();
};

/**
 * Self-contained inference state management hook
 * Does NOT depend on useChatState - manages its own state internally
 */
export const useInferenceState = () => {
  // Settings from external hook (only settings, not chat state)
  const { settings, settingsLoading } = useSettingsState();

  // Internal state management (no useChatState dependency)
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [selectedPromptType, setSelectedPromptType] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hoveredHistoryId, setHoveredHistoryId] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [eventListenersInitialized, setEventListenersInitialized] = useState(false);

  const eventListenersRef = useRef(false);

  // Response and progress handlers
    const handleInferenceResponse = useCallback((response) => {
        try {
            const requestId = response?.requestId || response?.RequestID || response?.requestID || null;

            // Reset generating state
            setIsGenerating(false);
            setCurrentRequestId(null);
            setProgress(null);
            setGenerationError(null);

            let success = response?.success === true || response?.Success === true || false;
            const result = response?.result || response?.Result || "";
            const errorMessage = response?.error || response?.Error || "";
            const processingTime = response?.processingTime || response?.ProcessingTime || null;

            if (success && (!result || !result.trim())) success = false;

            setMessages(prevMessages => {
                const newMessages = [...prevMessages];

                // Prefer matching the loading message by requestId; fallback to the first assistant loading message
                let loadingIndex = -1;
                if (requestId) {
                    loadingIndex = newMessages.findIndex(
                        (m) => m.role === "assistant" && m.isLoading && m.requestId === requestId
                    );
                }
                if (loadingIndex === -1) {
                    loadingIndex = newMessages.findIndex(
                        (m) => m.role === "assistant" && m.isLoading
                    );
                }

                if (loadingIndex !== -1) {
                    if (success) {
                        newMessages[loadingIndex] = {
                            ...newMessages[loadingIndex],
                            content: result,
                            isLoading: false,
                            processingTime,
                            requestId,
                        };
                    } else {
                        newMessages[loadingIndex] = {
                            ...newMessages[loadingIndex],
                            content: `Error: ${errorMessage || "Failed to generate response"}`,
                            isLoading: false,
                            role: "error",
                            requestId,
                        };
                    }
                } else {
                    if (success) {
                        newMessages.push({
                            id: generateMessageId(),
                            scope: INFERENCE_SCOPE,
                            role: "assistant",
                            content: result,
                            timestamp: new Date().toISOString(),
                            processingTime,
                            requestId,
                        });
                    } else {
                        newMessages.push({
                            id: generateMessageId(),
                            scope: INFERENCE_SCOPE,
                            role: "error",
                            content: `Error: ${errorMessage || "Failed to generate response"}`,
                            timestamp: new Date().toISOString(),
                            requestId,
                        });
                    }
                }

                return newMessages;
            });
        } catch (err) {
            LogError(`Error handling inference response: ${err?.message || err}`);
        }
    }, []);

  const handleInferenceProgress = useCallback((progressData) => {
    try {
      setProgress({
        status: progressData?.status,
        message: progressData?.message,
        progress: progressData?.progress,
        requestId: progressData?.requestId,
      });
    } catch (err) {
      LogError(`Error handling inference progress: ${err?.message || err}`);
    }
  }, []);

  // Event handling initialization
  const initializeInferenceListeners = useCallback(() => {
    if (eventListenersRef.current) {
      return; // Already initialized
    }

    // Prevent duplicates
    EventsOff("inference-completion-response");
    EventsOff("inference-completion-progress");

    EventsOn("inference-completion-response", handleInferenceResponse);
    EventsOn("inference-completion-progress", handleInferenceProgress);

    eventListenersRef.current = true;
    setEventListenersInitialized(true);
  }, [handleInferenceResponse, handleInferenceProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventListenersRef.current) {
        EventsOff("inference-completion-response");
        EventsOff("inference-completion-progress");
        eventListenersRef.current = false;
      }
    };
  }, []);

  // Message operations
  const addMessage = useCallback((role, content, metadata = {}) => {
    const messageId = metadata?.id || generateMessageId();
    const newMessage = {
      id: messageId,
      scope: INFERENCE_SCOPE,
      role,
      content,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
    
    setMessages(prev => [...prev, newMessage]);
    return messageId;
  }, []);

  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates, timestamp: updates.timestamp || msg.timestamp }
          : msg
      )
    );
  }, []);

  const clearMessages = useCallback(() => {
    LogInfo("Clearing inference messages");
    setMessages([]);
    setGenerationError(null);
    setIsGenerating(false);
    setCurrentRequestId(null);
    setProgress(null);
    LogInfo("Inference messages cleared");
  }, []);

  // Message submission
    const submitMessage = useCallback(
        async (selectedPromptType, currentMessage, settings) => {
            if (!selectedPromptType || !currentMessage?.trim()) {
                console.warn("Cannot submit message: missing requirements");
                return;
            }

            if (isGenerating) {
                console.warn("Already generating, ignoring submit");
                return;
            }

            LogInfo("Submitting inference message:", {
                promptType: selectedPromptType,
                messageLength: currentMessage.length,
                scope: INFERENCE_SCOPE,
            });

            try {
                // Initialize listeners
                initializeInferenceListeners();

                // Clear any previous errors
                setGenerationError(null);

                const messageToSend = currentMessage.trim();

                // Add user message
                addMessage("user", messageToSend);

                // Generate request ID and set current request
                const requestId = generateRequestId();
                setCurrentRequestId(requestId);

                // Add loading assistant message WITH requestId so we can target it later
                const loadingId = addMessage("assistant", "AI is thinking...", {
                    isLoading: true,
                    requestId,
                });

                // Set generating state
                setIsGenerating(true);

                // Prepare payload
                const payload = {
                    requestId,
                    promptType: selectedPromptType,
                    scope: INFERENCE_SCOPE,
                    llamaCliArgs: {
                        ...settings?.llamaCli,
                        PromptText: messageToSend,
                        PromptType: selectedPromptType,
                    },
                };

                // Emit the request
                EventsEmit("inference-completion-request", payload);
                LogInfo(`Inference request submitted: ${requestId} (loadingId: ${loadingId})`);
            } catch (err) {
                LogError("Failed to submit inference message:", err);
                LogError(`Failed to submit inference request: ${err?.message || err}`);

                // Set error state
                setGenerationError(err?.message || "Failed to submit");

                // Reset generating state
                setIsGenerating(false);
                setCurrentRequestId(null);
            }
        },
        [isGenerating, initializeInferenceListeners, addMessage]
    );

  // Cancel generation
  const cancelGeneration = useCallback(async () => {
    LogInfo("Cancelling inference generation");

    try {
      // Find and update loading message
      const loadingMsgIndex = messages.findIndex(
        (m) => m.role === "assistant" && m.isLoading
      );

      if (loadingMsgIndex !== -1) {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[loadingMsgIndex] = {
            ...newMessages[loadingMsgIndex],
            content: "Generation cancelled by user",
            isLoading: false,
            role: "error",
          };
          return newMessages;
        });
      }

      // Cancel the process
      await CancelProcess();
    } catch (err) {
      LogError(`Cancel failed: ${err?.message || err}`);
    } finally {
      // Reset state
      setIsGenerating(false);
      setCurrentRequestId(null);
      setProgress(null);
    }
  }, [messages]);

  // History operations
  const loadSavedChats = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const result = await GetInferenceHistory();
      const data = parseHistoryResponse(result).map(formatChatData);
      setSavedChats(data);
      LogInfo(`Loaded inference chat history: ${data.length} items`);
    } catch (err) {
      LogError(`Error loading inference chat history: ${err?.message || err}`);
      setSavedChats([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const loadSavedChat = useCallback((chatItem) => {
    try {
      LogInfo("Loading saved chat into inference scope:", chatItem._id);

      // Clear current chat history
      setMessages([]);

      // Load user question
      const userQuestion = extractUserQuestion(chatItem?.question);
      if (userQuestion) {
        addMessage("user", userQuestion, {
          timestamp: chatItem?.createdAt || new Date().toISOString(),
          chatId: chatItem?._id,
        });
      }

      // Load assistant response
      if (chatItem?.response) {
        addMessage("assistant", chatItem.response, {
          timestamp: chatItem?.createdAt || new Date().toISOString(),
          chatId: chatItem?._id,
          args: chatItem?.args,
        });
      }

      LogInfo(`Loaded saved chat: ${chatItem?._id} into inference scope`);
    } catch (err) {
      LogError("Error loading saved chat:", err);
      LogError(`Failed to load saved chat: ${err?.message || err}`);
    }
  }, [addMessage]);

  // Initialize inference system
  const initializeInference = useCallback(async () => {
    LogInfo("Initializing inference system");

    // Check if already initialized
    if (isInitialized) {
      LogInfo("Inference already initialized");
      return;
    }

    try {
      // Initialize event listeners
      initializeInferenceListeners();

      // Load saved chats
      await loadSavedChats();

      // Set initialized state
      setIsInitialized(true);

      LogInfo("Inference system initialized successfully");
    } catch (err) {
      LogError("Failed to initialize inference:", err);
      LogError(`Failed to initialize inference system: ${err?.message || err}`);
      throw err;
    }
  }, [isInitialized, initializeInferenceListeners, loadSavedChats]);

  // PDF Export handler
  const handleExportPDF = useCallback(
    async (PDFExportDocument, title = "Inference Chat") => {
      if (!PDFExportDocument || typeof PDFExportDocument !== "function") {
        throw new Error("PDFExportDocument function is required");
      }

      try {
        setIsExportingPDF(true);

        if (!messages || messages.length === 0) {
          throw new Error("No messages to export");
        }

        await PDFExportDocument(messages, title);
        LogInfo("PDF export completed successfully");
      } catch (err) {
        LogError("PDF export failed:", err);
        LogError(`PDF export failed: ${err?.message || err}`);
        throw err;
      } finally {
        setIsExportingPDF(false);
      }
    },
    [messages]
  );

  // Utility handlers
  const handleClear = useCallback(() => {
    LogInfo("Handling inference clear action");
    try {
      clearMessages();
      setCurrentMessage("");
      LogInfo("Inference chat cleared successfully");
    } catch (err) {
      LogError("Error clearing inference chat:", err);
      LogError(`Failed to clear inference chat: ${err?.message || err}`);
    }
  }, [clearMessages]);

  const handleRefresh = useCallback(async () => {
    LogInfo("Handling inference refresh action");
    try {
      await loadSavedChats();
      LogInfo("Inference saved chats refreshed successfully");
    } catch (err) {
      LogError("Refresh action failed:", err);
      LogError(`Failed to refresh saved chats: ${err?.message || err}`);
    }
  }, [loadSavedChats]);

  // Computed values
  const isSubmitDisabled = useCallback(
    (selectedPromptType, currentMessage) => {
      return !selectedPromptType || !currentMessage?.trim() || isGenerating;
    },
    [isGenerating]
  );

  const isLoadingComputed = useCallback(
    (settingsLoading) => {
      return settingsLoading || !isInitialized;
    },
    [isInitialized]
  );

  // Return the complete inference state interface
  return {
    // State
    messages,
    isGenerating,
    progress,
    selectedPromptType,
    setSelectedPromptType,
    currentMessage,
    setCurrentMessage,
    textareaFocused,
    setTextareaFocused,
    savedChats,
    isLoadingHistory,
    isInitialized,
    hoveredHistoryId,
    setHoveredHistoryId,
    selectedChatId,
    setSelectedChatId,
    isExportingPDF,
    generationError,

    // Actions
    submitMessage,
    cancelGeneration,
    clearMessages,
    loadSavedChat,
    loadSavedChats,
    initializeInference,
    handleExportPDF,
    handleClear,
    handleRefresh,

    // Computed
    isSubmitDisabled,
    isLoadingComputed,
    isRefreshing: isLoadingHistory,

    // Utilities
    formatDate,
    extractUserQuestion,

    // Settings
    settings,
    settingsLoading,

    // Constants
    INFERENCE_SCOPE,
  };
};

// Export utility functions that might be needed elsewhere
export { formatDate, INFERENCE_SCOPE };
