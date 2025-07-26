import { GetInferenceHistory } from "../wailsjs/go/main/App.js";
import {
  EventsEmit,
  EventsOff,
  EventsOn,
  LogError,
  LogInfo,
} from "../wailsjs/runtime/runtime.js";

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

    return new Promise((resolve, reject) => {
      try {
        setGenerating(true);
        clearGenerationError();

        const startTime = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

        // Prepare the request data
        const requestData = {
          requestId: requestId,
          llamaCliArgs: {
            ...cliState,
            PromptText: message,
          },
          promptType: promptType,
        };

        // Set up event listeners for this specific request
        const handleResponse = (response) => {
          if (response.requestId === requestId) {
            const processTime = Date.now() - startTime;

            if (response.success) {
              // Update loading message with result
              updateMessageInChat(loadingMessage.id, {
                content: response.result,
                isLoading: false,
                processTime,
              });

              // Clear input and selection
              setCurrentMessage("");
              setSelectedChatId(null);

              resolve(response.result);
            } else {
              // Handle error
              LogError(`Error in chat process: ${response.error}`);
              setGenerationError(response.error);

              // Update loading message with error
              updateMessageInChat(loadingMessage.id, {
                content: "An error occurred while processing your request.",
                isLoading: false,
                sender: "system",
              });

              reject(new Error(response.error));
            }

            // Cleanup
            setGenerating(false);
            setAbortController(null);

            // Remove event listeners
            EventsOff("inference-completion-response", handleResponse);
            EventsOff("inference-completion-progress", handleProgress);
          }
        };

        const handleProgress = (progress) => {
          if (progress.requestId === requestId) {
            // Optional: Update loading message with progress status
            // You could update the loading message here if you want to show progress
            LogInfo(
              `Inference progress: ${progress.status} - ${progress.message} (${progress.progress}%)`,
            );
          }
        };

        // Handle cancellation
        const handleAbort = () => {
          // Update loading message with cancellation
          updateMessageInChat(loadingMessage.id, {
            content: "Operation cancelled by user.",
            isLoading: false,
            sender: "system",
          });

          setGenerating(false);
          setAbortController(null);

          // Remove event listeners
          EventsOff("inference-completion-response", handleResponse);
          EventsOff("inference-completion-progress", handleProgress);

          reject(new Error("Operation cancelled by user"));
        };

        // Set up abort signal handling
        controller.signal.addEventListener("abort", handleAbort);

        // Register event listeners
        EventsOn("inference-completion-response", handleResponse);
        EventsOn("inference-completion-progress", handleProgress);

        // Emit the inference completion request event
        EventsEmit("inference-completion-request", requestData);
      } catch (error) {
        LogError(`Error setting up inference request: ${error}`);
        setGenerationError(error.message);
        setGenerating(false);
        setAbortController(null);
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

  // Initialization
  initializeChat: async () => {
    const { isInitialized, loadSavedChats, setInitialized } = get();

    if (!isInitialized) {
      await loadSavedChats();
      setInitialized(true);
    }
  },
});
