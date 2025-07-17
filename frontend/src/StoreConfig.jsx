import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/shallow";

import { createAppSlice } from "./AppSliceManager.jsx";
import { createChatSlice } from "./ChatSliceManager.jsx";
import { createDocumentSlice } from "./DocumentSlice.jsx";
import { createInferenceSlice } from "./InferenceStateSlice.jsx";
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

    // Chat state (partial persistence)
    selectedPromptType: state.selectedPromptType,

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
      // Migration logic for version 1
      return {
        ...persistedState,
        // Add any new default values or transform existing ones
      };
    }
    return persistedState;
  },

  // Storage options
  storage: {
    getItem: (name) => {
      const str = localStorage.getItem(name);
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      localStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name) => localStorage.removeItem(name),
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
          ...createInferenceSlice(...args),
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
// Create selectors as separate functions to avoid recreation on each render
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

const selectChatState = (state) => ({
  setInitialized: state.setInitialized,
  selectedPromptType: state.selectedPromptType,
  currentMessage: state.currentMessage,
  chatHistory: state.chatHistory,
  savedChats: state.savedChats,
  selectedChatId: state.selectedChatId,
  hoveredHistoryId: state.hoveredHistoryId,
  isGenerating: state.isGenerating,
  isLoadingHistory: state.isLoadingHistory,
  textareaFocused: state.textareaFocused,
  generationError: state.generationError,
  isInitialized: state.isInitialized,
  // Actions
  setSelectedPromptType: state.setSelectedPromptType,
  setCurrentMessage: state.setCurrentMessage,
  setTextareaFocused: state.setTextareaFocused,
  setHoveredHistoryId: state.setHoveredHistoryId,
  clearGenerationError: state.clearGenerationError,
  clearChatHistory: state.clearChatHistory,
  loadSavedChat: state.loadSavedChat,
  loadSavedChats: state.loadSavedChats,
  generateCompletion: state.generateCompletion,
  setLoadingHistory: state.setLoadingHistory,
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
  // New enhanced actions
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

const selectInferenceState = (state) => ({
  currentPrompt: state.currentPrompt,
  isGenerating: state.isGenerating,
  generationError: state.generationError,
  streamingResponse: state.streamingResponse,
  // Actions
  setCurrentPrompt: state.setCurrentPrompt,
  setGenerating: state.setGenerating,
  setStreamingResponse: state.setStreamingResponse,
  setGenerationError: state.setGenerationError,
  clearGenerationError: state.clearGenerationError,
  startInference: state.startInference,
  setSelectedPromptType: state.setSelectedPromptType,
  selectedPromptType: state.selectedPromptType,
});

const selectParserState = (state) => ({
  isProcessing: state.isProcessing,
  processingOutput: state.processingOutput,
  lastParserConfig: state.lastParserConfig,
  parserError: state.parserError,
  abortController: state.abortController,
  // Actions
  setProcessing: state.setProcessing,
  setProcessingOutput: state.setProcessingOutput,
  setLastParserConfig: state.setLastParserConfig,
  setParserError: state.setParserError,
  setAbortController: state.setAbortController,
  startDocumentParsing: state.startDocumentParsing,
  cancelDocumentParsing: state.cancelDocumentParsing,
});

const selectSettingsState = (state) => ({
  settings: state.settings,
  settingsLoading: state.settingsLoading,
  // Actions
  setSettings: state.setSettings,
  updateLlamaCliSettings: state.updateLlamaCliSettings,
  updateLlamaEmbedSettings: state.updateLlamaEmbedSettings,
  updateDocumentSettings: state.updateDocumentSettings,
  updateAppSettings: state.updateAppSettings,
  setSettingsLoading: state.setSettingsLoading,
  setSettingsError: state.setSettingsError,
  loadSettings: state.loadSettings,
  saveSettings: state.saveSettings,
  settingsError: state.settingsError,
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

// Selector hooks using the predefined selector functions
export const useAppState = () => useStore(useShallow(selectAppState));

export const useChatState = () => useStore(useShallow(selectChatState));

export const useDocumentState = () => useStore(useShallow(selectDocumentState));

export const useInferenceState = () =>
  useStore(useShallow(selectInferenceState));

export const useParserState = () => useStore(useShallow(selectParserState));

export const useSettingsState = () => useStore(useShallow(selectSettingsState));

export const useUIState = () => useStore(useShallow(selectUIState));
