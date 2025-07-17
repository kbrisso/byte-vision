import { useStore } from "./StoreConfig.jsx";

// Store subscription utilities
export const createStoreSubscription = (selector, callback) => {
  return useStore.subscribe(selector, callback);
};

// Store reset utilities
export const resetStoreSection = (section) => {
  const store = useStore.getState();

  switch (section) {
    case "chat":
      store.clearChatHistory();
      store.clearGenerationError();
      break;
    case "documents":
      store.clearSelectedDocument();
      store.clearSearchResults();
      break;
    case "parser":
      store.resetParser();
      break;
    case "all":
      // Reset all store sections
      store.clearChatHistory();
      store.clearSelectedDocument();
      store.resetParser();
      store.clearError();
      store.clearNotifications();
      break;
    default:
      console.warn(`Unknown store section: ${section}`);
  }
};

// Store persistence utilities
export const exportStoreState = () => {
  const state = useStore.getState();
  return {
    settings: state.settings,
    theme: state.theme,
    selectedPromptType: state.selectedPromptType,
    // Add other persistable state as needed
  };
};

export const importStoreState = (importedState) => {
  const store = useStore.getState();

  if (importedState.settings) {
    store.setSettings(importedState.settings);
  }

  if (importedState.theme) {
    store.setTheme(importedState.theme);
  }

  if (importedState.selectedPromptType) {
    store.setSelectedPromptType(importedState.selectedPromptType);
  }
};

// Store debugging utilities
export const logStoreState = () => {
  console.log("Current store state:", useStore.getState());
};

export const getStoreMetrics = () => {
  const state = useStore.getState();

  return {
    chatHistoryLength: state.chatHistory.length,
    savedChatsLength: state.savedChats.length,
    documentsLength: state.documents.length,
    notificationsLength: state.notifications.length,
    isProcessing: state.isProcessing,
    isGenerating: state.isGenerating,
    isLoading: state.isLoading,
  };
};
