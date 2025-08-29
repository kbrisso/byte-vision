import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/shallow";

import { createDocumentState } from "./DocumentState.jsx";
import { createParserState} from "./DocumentParserState.jsx";
import { createSettingsState } from "./SettingsState.jsx";
import { createUIState } from "./UIState.jsx";

// Simplified store configuration
const storeConfig = {
    name: "byte-vision-store",
    version: 1,
    partialize: (state) => ({
        // App and settings
        theme: state.theme,
        notifications: state.notifications,
        settings: state.settings,

        // UI preferences
        sidebarCollapsed: state.sidebarCollapsed,
        activeTab: state.activeTab,

        // Document and parser
        selectedDocumentId: state.selectedDocument?.id,
        lastParserConfig: state.lastParserConfig,

        // Add selectedPromptType to persistence
        selectedPromptType: state.selectedPromptType,
    }),
};

export const useStore = create()(
    subscribeWithSelector(
        devtools(
            persist(
                immer((...args) => ({
                    ...createDocumentState(...args),
                    ...createParserState(...args),
                    ...createSettingsState(...args),
                    ...createUIState(...args),
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

    selectedPromptType: state.selectedPromptType,
    setSelectedPromptType: state.setSelectedPromptType,

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

// Simplified exports - remove chat-related hooks
export const useDocumentState = () => useStore(useShallow(selectDocumentState));
export const useParserState = () => useStore(useShallow(selectParserState));
export const useSettingsState = () => useStore(useShallow(selectSettingsState));
export const useUIState = () => useStore(useShallow(selectUIState));