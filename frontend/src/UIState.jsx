export const createUIState = (set, get) => ({
  // UI state
  sidebarCollapsed: false,
  activeTab: "chat",
  modalState: {
    isQAOpen: false,
    isViewOpen: false,
    type: null,
    data: null,
    config: {},
  },

  // UI actions
  setSidebarCollapsed: (collapsed) =>
    set((state) => {
      state.sidebarCollapsed = collapsed;
    }),

  setActiveTab: (tab) =>
    set((state) => {
      state.activeTab = tab;
    }),

  openModal: (type, data = null, config = {}) =>
    set((state) => {
      state.modalState = {
        isQAOpen: false,
        isViewOpen: false,
        type,
        data,
        config: {
          closable: true,
          ...config,
        },
      };
    }),

  closeModal: () =>
    set((state) => {
      state.modalState = {
        isQAOpen: false,
        isViewOpen: false,
        type: null,
        data: null,
        config: {},
      };
    }),

  closeAllModals: () =>
    set((state) => {
      state.modalState = {
        isQAOpen: false,
        isViewOpen: false,
        type: null,
        data: null,
        config: {},
      };
    }),

  // Complex UI actions
  toggleSidebar: () => {
    const { sidebarCollapsed, setSidebarCollapsed } = get();
    setSidebarCollapsed(!sidebarCollapsed);
  },

  navigateToTab: (tab) => {
    const { setActiveTab, closeAllModals } = get();
    closeAllModals();
    setActiveTab(tab);
  },
});
