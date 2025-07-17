import { LogError } from "../wailsjs/runtime/runtime.js";

export const createAppSlice = (set, get) => ({
  // App-wide state
  isLoading: false,
  error: null,
  theme: "dark",
  notifications: [],
  appVersion: "1.0.0",
  isOnline: navigator.onLine,

  // App actions
  setLoading: (loading) =>
    set((state) => {
      state.isLoading = loading;
    }),

  setError: (error) =>
    set((state) => {
      state.error = error
        ? {
            message: error,
            timestamp: Date.now(),
            id: Date.now(),
          }
        : null;
    }),

  clearError: () =>
    set((state) => {
      state.error = null;
    }),

  setTheme: (theme) =>
    set((state) => {
      state.theme = theme;
      // Apply theme to document
      document.documentElement.setAttribute("data-theme", theme);
    }),

  addNotification: (notification) =>
    set((state) => {
      const newNotification = {
        id: Date.now(),
        timestamp: Date.now(),
        type: "info",
        duration: 5000,
        ...notification,
      };

      state.notifications.push(newNotification);

      // Auto-remove notification after duration
      if (newNotification.duration > 0) {
        setTimeout(() => {
          get().removeNotification(newNotification.id);
        }, newNotification.duration);
      }
    }),

  removeNotification: (id) =>
    set((state) => {
      state.notifications = state.notifications.filter((n) => n.id !== id);
    }),

  clearNotifications: () =>
    set((state) => {
      state.notifications = [];
    }),

  setOnlineStatus: (isOnline) =>
    set((state) => {
      state.isOnline = isOnline;
    }),

  // Complex actions
  handleGlobalError: (error, context = "") => {
    const { setError, addNotification } = get();

    LogError(`Global error ${context}:${error}`);

    setError(error.message || error);
    addNotification({
      type: "error",
      title: "Error",
      message: error.message || error,
      duration: 0, // Don't auto-remove errors
    });
  },

  initializeApp: async () => {
    const { setLoading, setError, addNotification } = get();

    try {
      setLoading(true);

      // Initialize app services
      // This could include loading settings, checking online status, etc.

      addNotification({
        type: "success",
        title: "Welcome",
        message: "Application initialized successfully",
      });
    } catch (error) {
      get().handleGlobalError(error, "during app initialization");
    } finally {
      setLoading(false);
    }
  },
});
