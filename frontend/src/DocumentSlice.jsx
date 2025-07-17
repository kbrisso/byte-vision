export const createDocumentSlice = (set) => ({
  // Document state
  documents: [],
  title: "",
  selectedDocument: null,
  searchResults: [],
  searchQuery: "",
  isSearching: false,
  searchError: null,
  docId: "",
  isQAOpen: false,
  isViewOpen: false,
  selectedIndexValue: "",
  sourceLocation: "",
  abortController: null,
  isValidIndexSelected: false,

  // Add searchFilters to the state
  searchFilters: {
    title: "",
    metaTextDesc: "",
    metaKeyWords: "",
    indexName: "",
  },

  setIsValidIndexSelected: (isValidIndexSelected) =>
    set({ isValidIndexSelected }),

  setSourceLocation: (sourceLocation) => set({ sourceLocation }),

  setTitle: (title) => set({ title }),

  setViewOpen: (isViewOpen) => set({ isViewOpen }),

  setQAOpen: (isQAOpen) => set({ isQAOpen }),

  setSelectedIndex: (selectedIndexValue) => set({ selectedIndexValue }),

  setModalOpen: (isOpen) => set({ isOpen }),

  setDocId: (docId) => set({ docId }),

  setDocuments: (documents) => set({ documents }),

  setSelectedDocPrompt: (prompt) => set({ prompt }),

  setAbortController: (controller) =>
    set((state) => {
      state.abortController = controller;
    }),

  addDocument: (document) =>
    set((state) => ({
      documents: [...state.documents, document],
    })),

  removeDocument: (documentId) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== documentId),
      selectedDocument:
        state.selectedDocument?.id === documentId
          ? null
          : state.selectedDocument,
    })),

  selectDocument: (document) => set({ selectedDocument: document }),

  clearSelectedDocument: () => set({ selectedDocument: null }),

  setSearchFilters: (filters) =>
    set((state) => {
      state.searchFilters = filters;
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearching: (isSearching) => set({ isSearching }),

  setSearchResults: (results) =>
    set({
      searchResults: results,
      searchError: null,
    }),

  setSearchError: (error) =>
    set({
      searchError: error,
      searchResults: [],
    }),

  clearSearchResults: () =>
    set({
      searchResults: [],
      searchQuery: "",
      searchError: null,
    }),
  // Actions
  resetSearch: () =>
    set((state) => {
      state.documents = [];
      state.searchResults = [];
      state.searchQuery = "";
      state.searchError = null;
      state.isSearching = false;
      state.searchFilters = {
        title: "",
        metaTextDesc: "",
        metaKeyWords: "",
        indexName: "",
      };
      state.sortConfig = { key: null, direction: "asc" };
      if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
      }
    }),
});
