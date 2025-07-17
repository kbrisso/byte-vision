import { LogError, LogInfo } from "../wailsjs/runtime/runtime.js";
import {
  GenerateCompletion,
  GetInferenceHistory,
} from "../wailsjs/go/main/App.js";

export const createChatSlice = (set, get) => ({
  // Chat state
  selectedPromptType: "",
  currentMessage: "",
  chatHistory: [],
  savedChats: [],
  selectedChatId: null,
  hoveredHistoryId: null,
  isGenerating: false,
  isLoadingHistory: false,
  textareaFocused: false,
  generationError: null,
  isInitialized: false,
  streamingEnabled: false,
  abortController: null,

  // Chat actions
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

  // Message management
  addMessageToChat: (message) => {
    const newMessage = {
      id: Date.now(),
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

  // Saved chats management
  setSavedChats: (chats) =>
    set((state) => {
      state.savedChats = chats;
    }),

  loadSavedChat: (chat) => {
    const { clearChatHistory, addMessageToChat, setSelectedChatId } = get();

    clearChatHistory();
    setSelectedChatId(chat._id);

    // Extract user question
    const extractUserQuestion = (questionText) => {
      if (!questionText) return "";
      const parts = questionText.split("User");
      if (parts.length > 1) {
        return parts[1].trim();
      }
      return questionText.trim();
    };

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

      let chatHistoryData = [];

      // Handle different response formats
      if (Array.isArray(result)) {
        chatHistoryData = result;
      } else if (result && result.history) {
        chatHistoryData = result.history;
      } else if (result && result.data) {
        chatHistoryData = result.data;
      } else if (result && typeof result === "object") {
        const possibleArrayKeys = ["id", "response", "question", "createdAt"];
        for (const key of possibleArrayKeys) {
          if (result[key] && Array.isArray(result[key])) {
            chatHistoryData = result[key];
            break;
          }
        }
      }

      // Format chats consistently
      const formattedChats = chatHistoryData.map((chat) => ({
        _id: chat._id || chat.id || `chat_${Date.now()}_${Math.random()}`,
        response: chat.response || chat.answer || chat.content || "",
        args: chat.args || {
          id: "",
          description: "Default",
          promptCmd: "--prompt",
          promptCmdEnabled: true,
        },
        question: chat.question || chat.query || "",
        createdAt: chat.createdAt || chat.timestamp || new Date().toISOString(),
      }));

      setSavedChats(formattedChats);
      LogInfo(`Loaded chat history: ${formattedChats.length}`);
    } catch (error) {
      LogError(`Error loading chat history: ${error}`);
      setSavedChats([]);
    } finally {
      setLoadingHistory(false);
    }
  },

  // Generation management
  generateCompletion: async (promptType, message, cliState) => {
    const {
      setGenerating,
      setGenerationError,
      clearGenerationError,
      addMessageToChat,
      updateMessageInChat,
      setCurrentMessage,
      setSelectedChatId,
      setAbortController,
    } = get();

    try {
      setGenerating(true);
      clearGenerationError();

      const startTime = Date.now();
      const controller = new AbortController();
      setAbortController(controller);

      // Add user message
      addMessageToChat({
        sender: "user",
        content: message,
      });

      // Add loading message for assistant
      const loadingMessage = addMessageToChat({
        sender: "assistant",
        content: "",
        isLoading: true,
      });

      // Update cliState with message text
      cliState.PromptText = message;

      // Generate completion
      const result = await GenerateCompletion(cliState, promptType);
      const processTime = Date.now() - startTime;

      // Update loading message with result
      updateMessageInChat(loadingMessage.id, {
        content: result,
        isLoading: false,
        processTime,
      });

      // Clear input and selection
      setCurrentMessage("");
      setSelectedChatId(null);

      return result;
    } catch (error) {
      LogError(`Error in chat process: ${error}`);
      setGenerationError(error.message);

      // Update loading message with error
      const { chatHistory } = get();
      const loadingMessage = chatHistory.find((msg) => msg.isLoading);
      if (loadingMessage) {
        updateMessageInChat(loadingMessage.id, {
          content: "An error occurred while processing your request.",
          isLoading: false,
          sender: "system",
        });
      }

      throw error;
    } finally {
      setGenerating(false);
      setAbortController(null);
    }
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

  // Initialization
  initializeChat: async () => {
    const { isInitialized, loadSavedChats, setInitialized } = get();

    if (!isInitialized) {
      await loadSavedChats();
      setInitialized(true);
    }
  },
});
