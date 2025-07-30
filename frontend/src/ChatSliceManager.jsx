import { GetInferenceHistory } from "../wailsjs/go/main/App.js";
import {
  EventsEmit,
  EventsOff,
  EventsOn,
  LogError,
  LogInfo,
} from "../wailsjs/runtime/runtime.js";

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

// State management
const createInitialState = () => ({
  // UI State
  selectedPromptType: "",
  currentMessage: "",
  textareaFocused: false,
  hoveredHistoryId: null,
  selectedChatId: null,

  // Generation State
  isGenerating: false,
  generationError: null,
  abortController: null,

  // Data State
  chatHistory: [],
  savedChats: [],

  // Loading State
  isLoadingHistory: false,
  isInitialized: false,

  // Features
  streamingEnabled: false,
});

// Action creators
const createStateActions = (set, get) => ({
  // Simple state setters
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

  setGenerationError: (error) =>
      set((state) => {
        state.generationError = error;
        state.isGenerating = false;
      }),

  clearGenerationError: () =>
      set((state) => {
        state.generationError = null;
      }),

  setAbortController: (controller) =>
      set((state) => {
        state.abortController = controller;
      }),

  setSavedChats: (chats) =>
      set((state) => {
        state.savedChats = chats;
      }),
});

// Message management
const createMessageActions = (set, get) => ({
  addMessageToChat: (message) => {
    const newMessage = {
      id: generateMessageId(),
      timestamp: new Date().toISOString(),
      ...message,
    };

    set((state) => {
      state.chatHistory.push(newMessage);
    });

    return newMessage;
  },

  updateMessageInChat: (messageId, updates) =>
      set((state) => {
        const messageIndex = state.chatHistory.findIndex(
            (msg) => msg.id === messageId,
        );
        if (messageIndex !== -1) {
          state.chatHistory[messageIndex] = {
            ...state.chatHistory[messageIndex],
            ...updates,
          };
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
      addMessageToChat({
        sender: "user",
        content: userQuestion,
      });
    }

    // Add assistant's response
    if (chat.response) {
      addMessageToChat({
        sender: "assistant",
        content: chat.response,
        isLoading: false,
      });
    }

    LogInfo(`Loaded chat: ${chat._id}`);
  },

  loadSavedChats: async () => {
    const { setLoadingHistory, setSavedChats, clearChatHistory } = get();

    try {
      setLoadingHistory(true);
      clearChatHistory();

      const result = await GetInferenceHistory();
      const chatHistoryData = parseHistoryResponse(result);
      const formattedChats = chatHistoryData.map(formatChatData);

      setSavedChats(formattedChats);
      LogInfo(`Loaded chat history: ${formattedChats.length}`);
    } catch (error) {
      LogError(`Error loading chat history: ${error}`);
      setSavedChats([]);
    } finally {
      setLoadingHistory(false);
    }
  },

  initializeChat: async () => {
    const { isInitialized, loadSavedChats, setInitialized } = get();

    if (!isInitialized) {
      await loadSavedChats();
      setInitialized(true);
    }
  },
});

// Generation management
const createGenerationActions = (set, get) => ({
  generateCompletion: async (promptType, message, cliState) => {
    const actions = get();

    return new Promise((resolve, reject) => {
      try {
        const requestId = generateRequestId();
        const startTime = Date.now();
        const controller = new AbortController();

        // Initialize generation state
        actions.setGenerating(true);
        actions.clearGenerationError();
        actions.setAbortController(controller);

        // Add messages to chat
        actions.addMessageToChat({
          sender: "user",
          content: message,
        });

        const loadingMessage = actions.addMessageToChat({
          sender: "assistant",
          content: "",
          isLoading: true,
        });

        // Prepare request data
        const requestData = {
          requestId,
          llamaCliArgs: {
            ...cliState,
            PromptText: message,
          },
          promptType,
        };

        // Create event handlers
        const handleResponse = createResponseHandler(
            requestId,
            startTime,
            loadingMessage,
            actions,
            resolve,
            reject
        );

        const handleProgress = createProgressHandler(requestId);
        const handleAbort = createAbortHandler(loadingMessage, actions, reject);

        // Set up event listeners and abort handling
        controller.signal.addEventListener("abort", handleAbort);
        EventsOn("inference-completion-response", handleResponse);
        EventsOn("inference-completion-progress", handleProgress);

        // Emit the request
        EventsEmit("inference-completion-request", requestData);

      } catch (error) {
        LogError(`Error setting up inference request: ${error}`);
        actions.setGenerationError(error.message);
        actions.setGenerating(false);
        actions.setAbortController(null);
        reject(error);
      }
    });
  },

  cancelGeneration: () => {
    const { abortController, setGenerating, setAbortController } = get();

    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setGenerating(false);
      LogInfo("Generation cancelled by user");
    }
  },
});

const createResponseHandler = (requestId, startTime, loadingMessage, actions, resolve, reject) => {
  return (response) => {
    LogInfo(`Response received: ${JSON.stringify(response)}`);

    if (response.requestId !== requestId) return;

    const processTime = Date.now() - startTime;

    // Cleanup event listeners first
    EventsOff("inference-completion-response");
    EventsOff("inference-completion-progress");

    // Reset generation state for both success and error cases
    actions.setGenerating(false);
    actions.setAbortController(null);

    if (response.success) {
      // Update with successful result
      actions.updateMessageInChat(loadingMessage.id, {
        content: response.result,
        isLoading: false, // Explicitly set to false
        processTime,
      });

      // Reset form state
      actions.setCurrentMessage("");
      actions.setSelectedChatId(null);

      resolve(response.result);
    } else {
      // Handle error - CRITICAL FIX: Ensure isLoading is set to false
      LogError(`Error in chat process: ${response.error}`);
      actions.setGenerationError(response.error);

      actions.updateMessageInChat(loadingMessage.id, {
        content: "An error occurred while processing your request.",
        isLoading: false, // This was missing the explicit false assignment
        sender: "system",
      });

      reject(new Error(response.error));
    }
  };
};
const createProgressHandler = (requestId) => {
  return (progress) => {
    if (progress.requestId === requestId) {
      LogInfo(`Progress: ${progress.status} - ${progress.message} (${progress.progress}%)`);
    }
  };
};

const createAbortHandler = (loadingMessage, actions, reject) => {
  return () => {
    // Update loading message with cancellation
    actions.updateMessageInChat(loadingMessage.id, {
      content: "Operation cancelled by user.",
      isLoading: false, // Explicitly set to false
      sender: "system",
    });

    // Reset generation state
    actions.setGenerating(false);
    actions.setAbortController(null);

    // Cleanup event listeners
    EventsOff("inference-completion-response");
    EventsOff("inference-completion-progress");

    reject(new Error("Operation cancelled by user"));
  };
};

// Main slice creator
export const createChatSlice = (set, get) => ({
  // Initial state
  ...createInitialState(),

  // Actions
  ...createStateActions(set, get),
  ...createMessageActions(set, get),
  ...createChatActions(set, get),
  ...createGenerationActions(set, get),
});