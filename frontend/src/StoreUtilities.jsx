
import { useStore } from "./StoreConfig.jsx";

// Constants for store sections
export const STORE_SECTIONS = {
  CHAT: "chat",
  DOCUMENTS: "documents",
  PARSER: "parser",
  INFERENCE: "inference",
  SETTINGS: "settings",
  ALL: "all"
};

// Store subscription utilities with error handling
export const createStoreSubscription = (selector, callback) => {
  if (typeof selector !== 'function') {
    throw new Error('Selector must be a function');
  }
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }

  return useStore.subscribe(selector, callback);
};

// Enhanced store reset utilities with validation
export const resetStoreSection = (section) => {
  const store = useStore.getState();

  if (!Object.values(STORE_SECTIONS).includes(section)) {
    console.warn(`Unknown store section: ${section}. Valid sections:`, Object.values(STORE_SECTIONS));
    return false;
  }

  try {
    switch (section) {
      case STORE_SECTIONS.CHAT:
        store.clearChatHistory?.();
        store.clearGenerationError?.();
        store.setCurrentMessage?.("");
        store.setSelectedPromptType?.("");
        break;

      case STORE_SECTIONS.DOCUMENTS:
        store.clearSelectedDocument?.();
        store.clearSearchResults?.();
        store.clearDocuments?.();
        break;

      case STORE_SECTIONS.PARSER:
        store.resetParser?.();
        break;

      case STORE_SECTIONS.INFERENCE:
        store.setGenerating?.(false);
        store.clearGenerationError?.();
        store.setAbortController?.(null);
        break;

      case STORE_SECTIONS.SETTINGS:
        // Only reset non-persistent settings
        store.clearSettingsError?.();
        break;

      case STORE_SECTIONS.ALL:
        // Reset all store sections except persistent settings
        store.clearChatHistory?.();
        store.clearSelectedDocument?.();
        store.resetParser?.();
        store.clearError?.();
        store.clearNotifications?.();
        store.clearGenerationError?.();
        store.setGenerating?.(false);
        store.setCurrentMessage?.("");
        break;

      default:
        console.warn(`Unhandled store section: ${section}`);
        return false;
    }

    console.log(`Successfully reset store section: ${section}`);
    return true;
  } catch (error) {
    console.error(`Error resetting store section ${section}:`, error);
    return false;
  }
};

// Enhanced store persistence utilities
export const PERSISTABLE_KEYS = {
  SETTINGS: "settings",
  THEME: "theme",
  SELECTED_PROMPT_TYPE: "selectedPromptType",
  USER_PREFERENCES: "userPreferences",
  SAVED_CLI_SETTINGS: "savedCliSettings"
};

export const exportStoreState = (keys = Object.values(PERSISTABLE_KEYS)) => {
  const state = useStore.getState();
  const exportData = {};

  keys.forEach(key => {
    if (state[key] !== undefined) {
      exportData[key] = state[key];
    }
  });

  return {
    ...exportData,
    exportedAt: new Date().toISOString(),
    version: "1.0.0"
  };
};

export const importStoreState = (importedState) => {
  if (!importedState || typeof importedState !== 'object') {
    throw new Error('Invalid imported state format');
  }

  const store = useStore.getState();
  const imported = [];
  const failed = [];

  Object.entries(importedState).forEach(([key, value]) => {
    if (key === 'exportedAt' || key === 'version') return;

    try {
      const setterName = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
      if (typeof store[setterName] === 'function') {
        store[setterName](value);
        imported.push(key);
      } else {
        console.warn(`No setter found for key: ${key}`);
        failed.push(key);
      }
    } catch (error) {
      console.error(`Failed to import ${key}:`, error);
      failed.push(key);
    }
  });

  return { imported, failed };
};

// Enhanced store debugging utilities
export const logStoreState = (sections = []) => {
  const state = useStore.getState();

  if (sections.length === 0) {
    console.group("🏪 Complete Store State");
    console.log(state);
    console.groupEnd();
  } else {
    sections.forEach(section => {
      const sectionData = {};
      Object.keys(state).forEach(key => {
        if (key.toLowerCase().includes(section.toLowerCase())) {
          sectionData[key] = state[key];
        }
      });

      console.group(`🏪 Store Section: ${section}`);
      console.log(sectionData);
      console.groupEnd();
    });
  }
};

export const getStoreMetrics = () => {
  const state = useStore.getState();

  return {
    // Data metrics
    chatHistoryLength: state.chatHistory?.length || 0,
    savedChatsLength: state.savedChats?.length || 0,
    documentsLength: state.documents?.length || 0,
    notificationsLength: state.notifications?.length || 0,
    modelsLength: state.models?.length || 0,
    savedCliSettingsLength: state.savedCliSettings?.length || 0,

    // State metrics
    isProcessing: Boolean(state.isProcessing),
    isGenerating: Boolean(state.isGenerating),
    isLoading: Boolean(state.isLoading || state.settingsLoading || state.modelsLoading),
    hasErrors: Boolean(state.error || state.parserError || state.generationError || state.settingsError),

    // Memory usage estimation
    estimatedMemoryUsage: JSON.stringify(state).length,

    // Timestamps
    lastUpdated: new Date().toISOString()
  };
};

// Store validation utilities
export const validateStoreState = () => {
  const state = useStore.getState();
  const validationResults = {
    isValid: true,
    warnings: [],
    errors: []
  };

  // Check for required state properties
  const requiredProperties = ['chatHistory', 'settings', 'isGenerating'];
  requiredProperties.forEach(prop => {
    if (state[prop] === undefined) {
      validationResults.errors.push(`Missing required property: ${prop}`);
      validationResults.isValid = false;
    }
  });

  // Check for potential memory leaks
  if (state.chatHistory?.length > 1000) {
    validationResults.warnings.push('Chat history is very large, consider clearing old messages');
  }

  if (state.notifications?.length > 100) {
    validationResults.warnings.push('Too many notifications, consider clearing old ones');
  }

  return validationResults;
};

// Store performance utilities
export const measureStorePerformance = (operation, ...args) => {
  const startTime = performance.now();
  const result = operation(...args);
  const endTime = performance.now();

  console.log(`Store operation took ${(endTime - startTime).toFixed(2)}ms`);
  return result;
};

// Store cleanup utilities
export const cleanupStore = () => {
  const store = useStore.getState();
  const metrics = getStoreMetrics();

  console.log('🧹 Starting store cleanup...');

  // Clean up old notifications
  if (metrics.notificationsLength > 50) {
    store.clearNotifications?.();
    console.log('✅ Cleared old notifications');
  }

  // Clean up large chat history
  if (metrics.chatHistoryLength > 500) {
    const recentMessages = store.chatHistory?.slice(-100) || [];
    store.setChatHistory?.(recentMessages);
    console.log('✅ Trimmed chat history to recent 100 messages');
  }

  // Clear errors
  store.clearError?.();
  store.clearGenerationError?.();
  store.clearSettingsError?.();

  console.log('🧹 Store cleanup completed');
  return getStoreMetrics();
};