import { pdf } from "@react-pdf/renderer";

import { GetInferenceHistory } from "../wailsjs/go/main/App.js";
import {
    EventsEmit,
    EventsOff,
    EventsOn,
    LogError,
    LogInfo,
} from "../wailsjs/runtime/runtime.js";
import { CancelProcess } from "../wailsjs/go/main/App.js";

// Constants
const DEFAULT_CLI_ARGS = {
    id: "",
    description: "Default",
    promptCmd: "--prompt",
    promptCmdEnabled: true,
};

// Utility functions
const generateRequestId = () =>
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateMessageId = () => Date.now();

const extractUserQuestion = (questionText) => {
    if (!questionText) return "";
    const parts = questionText.split("User");
    return parts.length > 1 ? parts[1].trim() : questionText.trim();
};

const formatChatData = (chat) => ({
    _id: chat._id || chat.id || `chat_${Date.now()}_${Math.random()}`,
    response: chat.response || chat.answer || chat.content || "",
    args: chat.args || DEFAULT_CLI_ARGS,
    question: chat.question || chat.query || "",
    createdAt: chat.createdAt || chat.timestamp || new Date().toISOString(),
});

const parseHistoryResponse = (result) => {
    if (Array.isArray(result)) return result;
    if (result?.history) return result.history;
    if (result?.data) return result.data;

    // Check for arrays in object properties
    if (result && typeof result === "object") {
        const possibleArrayKeys = ["id", "response", "question", "createdAt"];
        for (const key of possibleArrayKeys) {
            if (result[key] && Array.isArray(result[key])) {
                return result[key];
            }
        }
    }

    return [];
};

// Date formatting utility
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return "Today";
    } else if (diffDays === 2) {
        return "Yesterday";
    } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
    } else {
        return date.toLocaleDateString();
    }
};

// PDF export utility
const exportConversationToPDF = async (chatHistory, documentTitle, PDFConversationDocument) => {
    try {
        const blob = await pdf(
            <PDFConversationDocument
                chatHistory={chatHistory}
                documentTitle={documentTitle}
            />,
        ).toBlob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `conversation-export-${documentTitle || "session"}-${new Date().toISOString().split("T")[0]}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        LogError("PDF conversation export failed: " + error);
        throw error;
    }
};

// State management
const createInitialState = () => ({
    // UI State
    selectedPromptType: "",
    currentMessage: "",
    textareaFocused: false,
    hoveredHistoryId: null,
    selectedChatId: null,

    // Generation State (consolidated from InferenceStateSlice)
    isGenerating: false,
    generationError: null,
    currentRequestId: null,
    progressMessage: null,
    currentPrompt: "", // From InferenceStateSlice
    streamingResponse: "", // From InferenceStateSlice

    // Data State
    chatHistory: [],
    savedChats: [],

    // Loading State
    isLoadingHistory: false,
    isInitialized: false,
    isExportingPDF: false,

    // Event listeners state
    eventListenersInitialized: false,
});

// Event Management Actions
const createEventActions = (set, get) => ({
    initializeEventListeners: () => {
        const { eventListenersInitialized } = get();

        if (eventListenersInitialized) {
            LogInfo("Event listeners already initialized");
            return;
        }

        LogInfo("Initializing chat event listeners");

        // Clean up any existing listeners first
        //EventsOff("inference-completion-response");
       // EventsOff("inference-completion-progress");

        // Listen for inference completion responses
        EventsOn("inference-completion-response", (data) => {
            LogInfo("=== EVENT RECEIVED: inference-completion-response ===");
            LogInfo(`Event data: ${JSON.stringify(data)}`);

            const { handleInferenceResponse } = get();
            if (handleInferenceResponse) {
                handleInferenceResponse(data);
            } else {
                LogError("handleInferenceResponse method not found!");
            }
        });

        // Listen for inference completion progress
        EventsOn("inference-completion-progress", (data) => {
            LogInfo("=== EVENT RECEIVED: inference-completion-progress ===");
            LogInfo(`Progress data: ${JSON.stringify(data)}`);

            const { handleInferenceProgress } = get();
            if (handleInferenceProgress) {
                handleInferenceProgress(data);
            } else {
                LogError("handleInferenceProgress method not found!");
            }
        });

        set((state) => {
            state.eventListenersInitialized = true;
        });

        LogInfo("Chat event listeners initialized successfully");
    },

    cleanupEventListeners: () => {
        LogInfo("Cleaning up chat event listeners");

        // Only cleanup if listeners are actually initialized
        const { eventListenersInitialized } = get();
        if (!eventListenersInitialized) {
            LogInfo("Event listeners already cleaned up");
            return;
        }

        //EventsOff("inference-completion-response");
        //EventsOff("inference-completion-progress");

        LogInfo("Chat event listeners cleaned up successfully");
    },

    handleInferenceResponse: (response) => {
        const { setGenerating, setCurrentRequestId, setProgressMessage, addMessageToChat, clearGenerationError, updateMessageInChat, chatHistory } = get();

        LogInfo(`=== RECEIVED INFERENCE RESPONSE ===`);
        LogInfo(`Raw response received: ${typeof response}`);
        LogInfo(`Raw response content: ${JSON.stringify(response)}`);

        try {
            // FIRST: Always reset generating state
            setGenerating(false);
            setCurrentRequestId(null);
            setProgressMessage(null);
            clearGenerationError();

            // Find any loading message to replace
            const loadingMessageIndex = chatHistory.findIndex(msg =>
                msg.role === "assistant" && msg.isLoading === true
            );

            let result, processingTime, success, requestId, errorMessage;

            // ✅ FIXED: Handle the actual Wails event response format
            if (response && typeof response === 'object') {
                // The Wails runtime might wrap the response differently
                // Let's check all possible field variations

                LogInfo(`Response object keys: ${Object.keys(response)}`);

                // Try different possible field names (Go struct fields vs JSON tags)
                success = response.success === true || response.Success === true;
                result = response.result || response.Result || "";
                errorMessage = response.error || response.Error || "";
                processingTime = response.processingTime || response.ProcessingTime;
                requestId = response.requestId || response.RequestID || response.requestID;

                LogInfo(`Extracted values:`);
                LogInfo(`  success: ${success} (from: ${response.success} or ${response.Success})`);
                LogInfo(`  result length: ${result ? result.length : 0}`);
                LogInfo(`  error: ${errorMessage}`);
                LogInfo(`  processingTime: ${processingTime}`);
                LogInfo(`  requestId: ${requestId}`);

            } else if (typeof response === 'string') {
                // Handle edge case where response is a string
                LogInfo(`Received string response: ${response.substring(0, 200)}...`);

                // Check if it's an error string containing "ProcessingTime:"
                if (response.includes('ProcessingTime:')) {
                    success = false;
                    result = response;
                    errorMessage = response;
                    processingTime = null;
                    requestId = null;
                } else {
                    success = true;
                    result = response;
                    errorMessage = "";
                    processingTime = null;
                    requestId = null;
                }
            } else {
                LogError(`Unexpected response type: ${typeof response}`);
                success = false;
                result = "Invalid response format";
                errorMessage = "Invalid response format";
                processingTime = null;
                requestId = null;
            }

            // Final validation - if we have an error message but success is true, flip it
            if (success && errorMessage && errorMessage.trim() !== "") {
                LogInfo("Detected error message, setting success to false");
                success = false;
                result = errorMessage;
            }

            // If result is empty but we have success, that's also an error
            if (success && (!result || result.trim() === "")) {
                LogInfo("Success is true but result is empty - treating as error");
                success = false;
                result = errorMessage || "No content generated";
            }

            LogInfo(`Final processed values: success=${success}, result=${result ? result.substring(0, 100) + '...' : 'null'}`);

            if (loadingMessageIndex !== -1) {
                const loadingMessage = chatHistory[loadingMessageIndex];

                if (success && result && result.trim() !== "") {
                    LogInfo("Updating loading message with successful response");
                    updateMessageInChat(loadingMessage.id, {
                        content: result,
                        isLoading: false,
                        processingTime: processingTime,
                        requestId: requestId
                    });
                } else {
                    LogInfo("Updating loading message with error response");
                    updateMessageInChat(loadingMessage.id, {
                        content: `Error: ${result || errorMessage || "Failed to generate response"}`,
                        isLoading: false,
                        role: "error",
                        requestId: requestId
                    });
                }
            } else {
                // Fallback: add new message if no loading message found
                LogInfo("No loading message found, adding new message");

                if (success && result && result.trim() !== "") {
                    addMessageToChat("assistant", result, {
                        requestId: requestId,
                        processingTime: processingTime,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    addMessageToChat("error", `Error: ${result || errorMessage || "Failed to generate response"}`, {
                        requestId: requestId,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            LogInfo("=== RESPONSE PROCESSING COMPLETE ===");
        } catch (error) {
            LogError(`Error handling inference response: ${error.message}`);
            LogError(`Stack trace: ${error.stack}`);

            // Always reset state on error
            setGenerating(false);
            setCurrentRequestId(null);
            setProgressMessage(null);

            // Add error message to chat as fallback
            addMessageToChat("error", `Failed to process response: ${error.message}`, {
                timestamp: new Date().toISOString()
            });
        }
    },
    handleInferenceProgress: (progress) => {
        const { currentRequestId, setProgressMessage } = get();

        // Only handle progress for the current request
        if (progress.requestId !== currentRequestId) {
            return;
        }

        LogInfo(`Inference progress: ${progress.message} (${progress.progress}%)`);

        setProgressMessage({
            status: progress.status,
            message: progress.message,
            progress: progress.progress,
            requestId: progress.requestId
        });
    },
});

// Action creators (consolidated with InferenceStateSlice actions)
const createStateActions = (set, get) => ({

    // Chat-specific state setters
    setSelectedPromptType: (selectedPromptType) =>
        set((state) => {
            state.selectedPromptType = selectedPromptType;
        }),

    setCurrentMessage: (message) =>
        set((state) => {
            state.currentMessage = message;
        }),

    setTextareaFocused: (focused) =>
        set((state) => {
            state.textareaFocused = focused;
        }),

    setHoveredHistoryId: (id) =>
        set((state) => {
            state.hoveredHistoryId = id;
        }),

    setSelectedChatId: (id) =>
        set((state) => {
            state.selectedChatId = id;
        }),

    setGenerating: (isGenerating) =>
        set((state) => {
            state.isGenerating = isGenerating;
        }),

    setLoadingHistory: (isLoading) =>
        set((state) => {
            state.isLoadingHistory = isLoading;
        }),


    setInitialized: (initialized) =>
        set((state) => {
            state.isInitialized = initialized;
        }),

    setExportingPDF: (isExporting) =>
        set((state) => {
            state.isExportingPDF = isExporting;
        }),

    setGenerationError: (error) =>
        set((state) => {
            state.generationError = error;
        }),

    clearGenerationError: () =>
        set((state) => {
            state.generationError = null;
        }),

    setCurrentRequestId: (requestId) =>
        set((state) => {
            state.currentRequestId = requestId;
        }),

    setProgressMessage: (progress) =>
        set((state) => {
            state.progressMessage = progress;
        }),

    setSavedChats: (chats) =>
        set((state) => {
            state.savedChats = chats;
        }),

    // Inference-specific state setters (consolidated from InferenceStateSlice)
    setCurrentPrompt: (prompt) =>
        set((state) => {
            state.currentPrompt = prompt;
        }),

    setStreamingResponse: (response) =>
        set((state) => {
            state.streamingResponse = response;
        }),
});

// Message management
const createMessageActions = (set, get) => ({
    addMessageToChat: (role, content, metadata = {}) =>
        set((state) => {
            const newMessage = {
                id: generateMessageId(),
                role, // "user", "assistant", or "error"
                content,
                timestamp: new Date().toISOString(),
                ...metadata
            };

            state.chatHistory.push(newMessage);

            // Fixed: Add null check and safe string handling
            const contentPreview = content && typeof content === 'string'
                ? content.substring(0, 100)
                : content ? String(content).substring(0, 100)
                    : 'empty content';

            LogInfo(`Added message to chat: ${role} - ${contentPreview}`);
        }),

    updateMessageInChat: (messageId, updates) =>
        set((state) => {
            const messageIndex = state.chatHistory.findIndex(
                (msg) => msg.id === messageId,
            );
            if (messageIndex !== -1) {
                state.chatHistory[messageIndex] = {
                    ...state.chatHistory[messageIndex],
                    ...updates,
                    // Ensure timestamp is preserved unless explicitly updated
                    timestamp: updates.timestamp || state.chatHistory[messageIndex].timestamp
                };

                LogInfo(`Updated message in chat: ${messageId} - ${JSON.stringify(updates)}`);
            } else {
                LogError(`Message not found for update: ${messageId}`);
            }
        }),

    removeMessageFromChat: (messageId) =>
        set((state) => {
            state.chatHistory = state.chatHistory.filter(
                (msg) => msg.id !== messageId,
            );
        }),

    clearChatHistory: () =>
        set((state) => {
            state.chatHistory = [];
            state.selectedChatId = null;
            state.currentMessage = "";
            state.generationError = null;
        }),

    // Consolidated method from InferenceStateSlice (simplified)
    addToChatHistory: (entry) =>
        set((state) => {
            const newMessage = {
                id: generateMessageId(),
                timestamp: new Date().toISOString(),
                role: entry.type || entry.role || "assistant",
                content: entry.content || "",
                ...entry,
            };
            state.chatHistory.push(newMessage);
        }),
});

// Chat management
const createChatActions = (set, get) => ({
    loadSavedChat: (chat) => {
        const { clearChatHistory, addMessageToChat, setSelectedChatId } = get();

        clearChatHistory();
        setSelectedChatId(chat._id);

        const userQuestion = extractUserQuestion(chat.question);

        // Add user's original question
        if (userQuestion) {
            addMessageToChat("user", userQuestion, {
                timestamp: chat.createdAt || new Date().toISOString(),
                chatId: chat._id
            });
        }

        // Add assistant's response
        if (chat.response) {
            addMessageToChat("assistant", chat.response, {
                timestamp: chat.createdAt || new Date().toISOString(),
                chatId: chat._id,
                args: chat.args
            });
        }

        LogInfo(`Loaded chat: ${chat._id}`);
    },

    loadSavedChats: async () => {
        const { setLoadingHistory, setSavedChats } = get();

        try {
            setLoadingHistory(true);

            const result = await GetInferenceHistory();
            LogInfo(`Raw history result: ${JSON.stringify(result)}`);

            const chatHistoryData = parseHistoryResponse(result);
            LogInfo(`Parsed history data: ${JSON.stringify(chatHistoryData)}`);

            const formattedChats = chatHistoryData.map(formatChatData);
            LogInfo(`Formatted chats: ${JSON.stringify(formattedChats)}`);

            setSavedChats(formattedChats);
            LogInfo(`Loaded chat history: ${formattedChats.length} items`);
        } catch (error) {
            LogError(`Error loading chat history: ${error}`);
            setSavedChats([]);
        } finally {
            setLoadingHistory(false);
        }
    },

    initializeChat: async () => {
        const { isInitialized, loadSavedChats, setInitialized, initializeEventListeners } = get();

        if (!isInitialized) {
            try {
                // Initialize event listeners first
                initializeEventListeners();

                // Load saved chats
                await loadSavedChats();
                setInitialized(true);

                LogInfo("Chat initialized successfully");
            } catch (error) {
                LogError(`Failed to initialize chat: ${error}`);
            }
        }
    },

    // Simplified inference starter (consolidated from InferenceStateSlice)
    startInference: async (prompt, context = {}) => {
        const { setGenerating, setGenerationError, addToChatHistory } = get();

        try {
            setGenerating(true);
            setGenerationError(null);

            // Add user prompt to history
            addToChatHistory({
                role: "user",
                content: prompt,
                context,
            });

            // This would be replaced with your actual API call
            LogInfo(`Starting inference for prompt: ${prompt}`);
        } catch (error) {
            setGenerationError(error.message);
        }
    },

    // Format date for display
    formatDate,

    // Extract user question for display
    extractUserQuestion,
});

// UI Actions
const createUIActions = (set, get) => ({
    // Handle clear action
    handleClear: () => {
        const { clearChatHistory } = get();
        clearChatHistory();
    },

    // Handle cancel action
    handleCancel: async () => {
        const { currentRequestId, setGenerating, setCurrentRequestId, setProgressMessage, updateMessageInChat, chatHistory } = get();

        if (!currentRequestId) {
            LogInfo("No active generation to cancel");
            return;
        }

        try {
            // Find and update any loading messages
            const loadingMessage = chatHistory.find(msg =>
                msg.role === "assistant" && msg.isLoading === true
            );

            if (loadingMessage) {
                updateMessageInChat(loadingMessage.id, {
                    content: "Generation cancelled by user",
                    isLoading: false,
                    role: "error"
                });
            }

            // Cancel backend process
            await CancelProcess();

            // Reset state
            setGenerating(false);
            setCurrentRequestId(null);
            setProgressMessage(null);

            LogInfo("Generation cancelled by user");
        } catch (error) {
            LogError("Failed to cancel generation: " + error);

            // Still reset state even if cancel fails
            setGenerating(false);
            setCurrentRequestId(null);
            setProgressMessage(null);
        }
    },

    // Handle submit action using events
    handleSubmit: async (event, selectedPromptType, currentMessage, settings) => {
        event?.preventDefault();

        const {
            isGenerating,
            addMessageToChat,
            setCurrentMessage,
            clearGenerationError,
            setGenerationError,
            setGenerating,
            setCurrentRequestId,
            initializeEventListeners
        } = get();

        LogInfo(`=== STARTING SUBMIT ===`);
        LogInfo(`Current isGenerating: ${isGenerating}`);
        LogInfo(`Selected prompt type: ${selectedPromptType}`);
        LogInfo(`Current message: ${currentMessage}`);

        // Validation
        if (!selectedPromptType || !currentMessage.trim() || isGenerating) {
            LogInfo("Submit blocked: validation failed");
            LogInfo(`Validation details: promptType=${!!selectedPromptType}, message=${!!currentMessage.trim()}, isGenerating=${isGenerating}`);
            return;
        }

        // Store the current message before clearing it
        const messageToSend = currentMessage.trim();

        try {
            LogInfo(`Submitting message: ${messageToSend} with prompt type: ${selectedPromptType}`);

            // Ensure event listeners are initialized
            initializeEventListeners();

            // Clear any previous errors
            clearGenerationError();

            // Clear the input field FIRST to provide immediate feedback
            setCurrentMessage("");

            // Add user message to chat
            addMessageToChat("user", messageToSend, {
                timestamp: new Date().toISOString()
            });

            // Add loading message for AI response
            const loadingMessageId = generateMessageId();
            LogInfo(`Creating loading message with ID: ${loadingMessageId}`);

            addMessageToChat("assistant", "AI is thinking...", {
                id: loadingMessageId,
                isLoading: true,
                timestamp: new Date().toISOString()
            });

            // Generate request ID and set state
            const requestId = generateRequestId();
            LogInfo(`Generated request ID: ${requestId}`);

            setCurrentRequestId(requestId);
            setGenerating(true);

            LogInfo(`Set isGenerating to true, current state: ${get().isGenerating}`);

            // Prepare request data for the event-based system
            const requestData = {
                requestId: requestId,
                promptType: selectedPromptType,
                llamaCliArgs: {
                    ...settings?.llamaCli,
                    PromptText: messageToSend,
                    PromptType: selectedPromptType
                }
            };

            LogInfo(`Emitting inference-completion-request event with data: ${JSON.stringify(requestData, null, 2)}`);

            // Emit the inference request event
            EventsEmit("inference-completion-request", requestData);

            LogInfo("=== SUBMIT COMPLETE ===");

        } catch (error) {
            LogError("Submit error:", error);
            setGenerationError(error.message || "Failed to submit message");

            // Restore the message to the input field if there was an error
            setCurrentMessage(messageToSend);

            // Add error message to chat
            addMessageToChat("error", `Error: ${error.message || "Failed to process your request"}`, {
                timestamp: new Date().toISOString()
            });

            // Reset state
            setGenerating(false);
            setCurrentRequestId(null);
        }
    },

    // Handle key down
    handleKeyDown: (e, selectedPromptType, currentMessage, settings) => {
        const { handleSubmit, isGenerating } = get();
        const isButtonDisabled = !selectedPromptType || !currentMessage.trim() || isGenerating;

        if (e.key === "Enter" && !e.shiftKey && !isButtonDisabled) {
            e.preventDefault();
            LogInfo("Enter key pressed, submitting form");
            handleSubmit(e, selectedPromptType, currentMessage, settings).catch((error) => {
                LogError(`KeyDown error: ${error}`);
            });
        }
    },

    // Handle PDF export
    handleExportPDF: async (PDFConversationDocument) => {
        const { chatHistory, isExportingPDF, setExportingPDF } = get();

        if (!chatHistory.length || isExportingPDF) return;

        try {
            setExportingPDF(true);
            await exportConversationToPDF(chatHistory, "Inference Chat", PDFConversationDocument);
        } catch (error) {
            LogError(`PDF export failed: ${error}`);
        } finally {
            setExportingPDF(false);
        }
    },

    // Computed values
    getIsButtonDisabled: (selectedPromptType, currentMessage) => {
        const { isGenerating } = get();
        return !selectedPromptType || !currentMessage.trim() || isGenerating;
    },

    getIsLoading: (settingsLoading) => {
        const { isInitialized } = get();
        return settingsLoading || !isInitialized;
    },
});

// Main slice creator - consolidated functionality from both slices
export const createChatSlice = (set, get) => ({
    // Initial state (includes consolidated inference state)
    ...createInitialState(),

    // Actions
    ...createEventActions(set, get),
    ...createStateActions(set, get),
    ...createMessageActions(set, get),
    ...createChatActions(set, get),
    ...createUIActions(set, get),
});