import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/shallow";
import { useEffect } from "react";

import { LogInfo } from "../wailsjs/runtime/runtime.js";

import { createAppSlice } from "./AppSliceManager.jsx";
import { createChatSlice } from "./ChatSliceManager.jsx";
import { createDocumentSlice } from "./DocumentSlice.jsx";
import { createParserSlice } from "./DocumentParserSlice.jsx";
import { createSettingsSlice } from "./SettingsSliceManager.jsx";
import { createUISlice } from "./UISliceManager.jsx";

// Store configuration
const storeConfig = {
  name: "byte-vision-store",
  version: 1,
  partialize: (state) => ({
    // App state
    theme: state.theme,
    notifications: state.notifications,

    // Settings (full persistence)
    settings: state.settings,

    // Chat state (partial persistence) - UPDATED
    selectedPromptType: state.selectedPromptType,
    savedChats: state.savedChats, // Persist saved chats

    // UI preferences
    sidebarCollapsed: state.sidebarCollapsed,
    activeTab: state.activeTab,

    // Document state (partial persistence)
    selectedDocumentId: state.selectedDocument?.id,

    // Parser state (partial persistence)
    lastParserConfig: state.lastParserConfig,
  }),

  // State migration for version updates
  migrate: (persistedState, version) => {
    if (version < 1) {
      return {
        ...persistedState,
        // Add any new default values or transform existing ones
        currentRequestId: null,
        progressMessage: null,
        eventListenersInitialized: false,
      };
    }
    return persistedState;
  },

  // Storage options
  storage: {
    getItem: (name) => {
      LogInfo(`Getting ${name} from localStorage`);
      const str = localStorage.getItem(name);
      if (!str) return null;
      try {
        LogInfo(
          `Retrieved data from localStorage: ${str.substring(0, 100)}...`,
        );
        return JSON.parse(str);
      } catch (error) {
        LogInfo(`Failed to parse localStorage data: ${error.message}`);
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        localStorage.setItem(name, JSON.stringify(value));
        LogInfo(`Saved ${name} to localStorage`);
      } catch (error) {
        LogInfo(`Failed to save to localStorage: ${error.message}`);
      }
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
      LogInfo(`Removed ${name} from localStorage`);
    },
  },
};

export const useStore = create()(
  subscribeWithSelector(
    devtools(
      persist(
        immer((...args) => ({
          ...createAppSlice(...args),
          ...createChatSlice(...args),
          ...createDocumentSlice(...args),
          ...createParserSlice(...args),
          ...createSettingsSlice(...args),
          ...createUISlice(...args),
        })),
        storeConfig,
      ),
      {
        name: "byte-vision-devtools",
        enabled: process.env.NODE_ENV === "development",
      },
    ),
  ),
);

// FIXED: Updated chat state selector with all required properties
const selectChatState = (state) => ({
  // Core State
  selectedPromptType: state.selectedPromptType,
  currentMessage: state.currentMessage,
  chatHistory: state.chatHistory,
  savedChats: state.savedChats,
  selectedChatId: state.selectedChatId,
  hoveredHistoryId: state.hoveredHistoryId,
  textareaFocused: state.textareaFocused,
  setSelectedChatId: state.setSelectedChatId,
  setLoadingHistory: state.setLoadingHistory,
  setSavedChats: state.setSavedChats,

  // Generation State
  isGenerating: state.isGenerating,
  generationError: state.generationError,
  currentRequestId: state.currentRequestId, // ADDED
  progressMessage: state.progressMessage, // ADDED

  // Loading State
  isLoadingHistory: state.isLoadingHistory,
  isInitialized: state.isInitialized,
  isExportingPDF: state.isExportingPDF,

  // Event State
  eventListenersInitialized: state.eventListenersInitialized, // ADDED

  // Basic Actions
  setSelectedPromptType: state.setSelectedPromptType,
  setCurrentMessage: state.setCurrentMessage,
  setTextareaFocused: state.setTextareaFocused,
  setHoveredHistoryId: state.setHoveredHistoryId,
  setInitialized: state.setInitialized,
  clearGenerationError: state.clearGenerationError,
  clearChatHistory: state.clearChatHistory,

  // Generation Actions
  setGenerating: state.setGenerating,
  setGenerationError: state.setGenerationError,
  setCurrentRequestId: state.setCurrentRequestId, // ADDED
  setProgressMessage: state.setProgressMessage, // ADDED

  // Event Management Actions - ADDED
  initializeEventListeners: state.initializeEventListeners,
  cleanupEventListeners: state.cleanupEventListeners,
  handleInferenceResponse: state.handleInferenceResponse,
  handleInferenceProgress: state.handleInferenceProgress,

  // Chat Actions
  loadSavedChat: state.loadSavedChat,
  loadSavedChats: state.loadSavedChats,
  initializeChat: state.initializeChat,

  // Message Actions
  addMessageToChat: state.addMessageToChat,
  updateMessageInChat: state.updateMessageInChat,
  removeMessageFromChat: state.removeMessageFromChat,

  // UI Handler Actions
  handleClear: state.handleClear,
  handleCancel: state.handleCancel,
  handleSubmit: state.handleSubmit,
  handleKeyDown: state.handleKeyDown,
  handleExportPDF: state.handleExportPDF,

  // Utilities
  formatDate: state.formatDate,
  extractUserQuestion: state.extractUserQuestion,

  // Computed Functions
  getIsButtonDisabled: state.getIsButtonDisabled,
  getIsLoading: state.getIsLoading,
});

// Keep other selectors unchanged
const selectAppState = (state) => ({
  isLoading: state.isLoading,
  error: state.error,
  theme: state.theme,
  notifications: state.notifications,
  // Actions
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
  setTheme: state.setTheme,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
});

const selectDocumentState = (state) => ({
  documents: state.documents,
  selectedDocument: state.selectedDocument,
  searchResults: state.searchResults,
  searchQuery: state.searchQuery,
  isSearching: state.isSearching,
  searchError: state.searchError,
  searchFilters: state.searchFilters,
  sortConfig: state.sortConfig,
  abortController: state.abortController,
  // Actions
  setDocuments: state.setDocuments,
  addDocument: state.addDocument,
  removeDocument: state.removeDocument,
  selectDocument: state.selectDocument,
  clearSelectedDocument: state.clearSelectedDocument,
  setSearchQuery: state.setSearchQuery,
  setSearching: state.setSearching,
  setSearchResults: state.setSearchResults,
  setSearchError: state.setSearchError,
  clearSearchResults: state.clearSearchResults,
  // Enhanced actions
  searchDocuments: state.searchDocuments,
  resetSearch: state.resetSearch,
  sortDocuments: state.sortDocuments,
  setSearchFilters: state.setSearchFilters,
  setSortConfig: state.setSortConfig,
  setAbortController: state.setAbortController,
  setSelectedIndex: state.setSelectedIndex,
  selectedIndexValue: state.selectedIndexValue,
  setModalOpen: state.setModalOpen,
  setViewOpen: state.setViewOpen,
  setQAOpen: state.setQAOpen,
  isQAOpen: state.isQAOpen,
  isViewOpen: state.isViewOpen,
  setDocId: state.setDocId,
  docId: state.docId,
  show: state.show,
  setShow: state.setShow,
  setSourceLocation: state.setSourceLocation,
  sourceLocation: state.sourceLocation,
  isValidIndexSelected: state.isValidIndexSelected,
  setIsValidIndexSelected: state.setIsValidIndexSelected,
  setSelectedDocPrompt: state.setSelectedDocPrompt,
  selectedDocPrompt: state.selectedDocPrompt,
  setTitle: state.setTitle,
  title: state.title,
});

const selectParserState = (state) => ({
  isProcessing: state.isProcessing,
  processingOutput: state.processingOutput,
  lastParserConfig: state.lastParserConfig,
  parserError: state.parserError,
  abortController: state.abortController,
  loading: state.loading,
  error: state.error,
  // Actions
  setProcessing: state.setProcessing,
  setProcessingOutput: state.setProcessingOutput,
  setLastParserConfig: state.setLastParserConfig,
  setParserError: state.setParserError,
  setAbortController: state.setAbortController,
  startDocumentParsing: state.startDocumentParsing,
  cancelDocumentParsing: state.cancelDocumentParsing,
  resetParser: state.resetParser,
});

const selectSettingsState = (state) => ({
  // Settings
  settings: state.settings,
  settingsLoading: state.settingsLoading,
  settingsError: state.settingsError,
  settingsInitialized: state.settingsInitialized,

  // Models
  models: state.models,
  modelsLoading: state.modelsLoading,

  // Saved settings
  savedCliSettings: state.savedCliSettings,
  savedEmbedSettings: state.savedEmbedSettings,
  savedSettingsLoading: state.savedSettingsLoading,

  // Form state
  formState: state.formState,

  // Basic actions
  setSettings: state.setSettings,
  updateLlamaCliSettings: state.updateLlamaCliSettings,
  updateLlamaEmbedSettings: state.updateLlamaEmbedSettings,
  updateDocumentSettings: state.updateDocumentSettings,
  updateAppSettings: state.updateAppSettings,
  setSettingsLoading: state.setSettingsLoading,
  setSettingsError: state.setSettingsError,
  setSettingsInitialized: state.setSettingsInitialized,
  setModels: state.setModels,
  setModelsLoading: state.setModelsLoading,
  setSavedCliSettings: state.setSavedCliSettings,
  setSavedEmbedSettings: state.setSavedEmbedSettings,
  setSavedSettingsLoading: state.setSavedSettingsLoading,
  initialized: state.initialized,
  setInitialized: state.setInitialized,

  // Form actions
  updateCliFormState: state.updateCliFormState,
  updateEmbedFormState: state.updateEmbedFormState,

  // Complex actions
  loadDefaultSettings: state.loadDefaultSettings,
  loadModels: state.loadModels,
  loadSavedCliSettings: state.loadSavedCliSettings,
  loadSavedEmbedSettings: state.loadSavedEmbedSettings,
  saveCliSettings: state.saveCliSettings,
  saveEmbedSettings: state.saveEmbedSettings,

  // Field updates
  updateCliField: state.updateCliField,
  updateCliFields: state.updateCliFields,
  updateEmbedField: state.updateEmbedField,
  updateEmbedFields: state.updateEmbedFields,

  // Load saved settings
  loadSavedCliSetting: state.loadSavedCliSetting,
  loadSavedEmbedSetting: state.loadSavedEmbedSetting,

  // Validation
  validateCliSettings: state.validateCliSettings,
  validateEmbedSettings: state.validateEmbedSettings,

  // Reset
  resetSettings: state.resetSettings,
});

const selectUIState = (state) => ({
  sidebarCollapsed: state.sidebarCollapsed,
  activeTab: state.activeTab,
  modalState: state.modalState,
  // Actions
  setSidebarCollapsed: state.setSidebarCollapsed,
  setActiveTab: state.setActiveTab,
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeAllModals: state.closeAllModals,
});

// ENHANCED: Selector hooks with better error handling
export const useAppState = () => useStore(useShallow(selectAppState));

export const useChatState = () => {
  const state = useStore(useShallow(selectChatState));

  // Extract specific functions to avoid stale closures
  const {
    eventListenersInitialized,
    initializeEventListeners,
    cleanupEventListeners,
  } = state;

  // Initialize event listeners on first use with proper dependencies
  useEffect(() => {
    if (!eventListenersInitialized && initializeEventListeners) {
      initializeEventListeners();
    }

    // Cleanup on unmount
    return () => {
      if (cleanupEventListeners) {
        cleanupEventListeners();
      }
    };
  }, [
    eventListenersInitialized,
    initializeEventListeners,
    cleanupEventListeners,
  ]);

  return state;
};

// FIXED: Cleanup hook with proper dependencies
export const useEventCleanup = () => {
  const cleanupEventListeners = useStore(
    (state) => state.cleanupEventListeners,
  );

  useEffect(() => {
    return () => {
      if (cleanupEventListeners) {
        cleanupEventListeners();
      }
    };
  }, []);
};

export const useDocumentState = () => useStore(useShallow(selectDocumentState));

export const useParserState = () => useStore(useShallow(selectParserState));

export const useSettingsState = () => useStore(useShallow(selectSettingsState));

export const useUIState = () => useStore(useShallow(selectUIState));
