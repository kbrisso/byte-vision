import { LogError, LogInfo } from "../wailsjs/runtime/runtime.js";

export const createSettingsSlice = (set, get) => ({
  // Settings state
  settings: {
    llamaCli: {},
    llamaEmbed: {},
    document: {},
    app: {},
  },
  settingsLoading: false,
  settingsError: null,
  settingsInitialized: false,

  // Settings actions
  setSettings: (newSettings) =>
    set((state) => {
      state.settings = { ...state.settings, ...newSettings };
    }),

  updateLlamaCliSettings: (settings) =>
    set((state) => {
      state.settings.llamaCli = { ...state.settings.llamaCli, ...settings };
    }),

  updateLlamaEmbedSettings: (settings) =>
    set((state) => {
      state.settings.llamaEmbed = { ...state.settings.llamaEmbed, ...settings };
    }),

  updateDocumentSettings: (settings) =>
    set((state) => {
      state.settings.document = { ...state.settings.document, ...settings };
    }),

  updateAppSettings: (settings) =>
    set((state) => {
      state.settings.app = { ...state.settings.app, ...settings };
    }),

  setSettingsLoading: (loading) =>
    set((state) => {
      state.settingsLoading = loading;
    }),

  setSettingsError: (error) =>
    set((state) => {
      state.settingsError = error;
    }),

  setSettingsInitialized: (initialized) =>
    set((state) => {
      state.settingsInitialized = initialized;
    }),

  // Complex actions
  loadSettings: async () => {
    const {
      setSettingsLoading,
      setSettingsError,
      setSettings,
      setSettingsInitialized,
    } = get();

    try {
      setSettingsLoading(true);
      setSettingsError(null);

      // Load settings from API or local storage
      // This is a placeholder - implement your actual settings loading logic
      const settings = {
        llamaCli: {},
        llamaEmbed: {},
        document: {},
        app: {},
      };

      setSettings(settings);
      setSettingsInitialized(true);
      LogInfo("Settings loaded successfully");
    } catch (error) {
      setSettingsError(error.message);
      LogError(`Failed to load settings: ${error}`);
    } finally {
      setSettingsLoading(false);
    }
  },

  saveSettings: async (settingsToSave) => {
    const { setSettingsLoading, setSettingsError, setSettings } = get();

    try {
      setSettingsLoading(true);
      setSettingsError(null);

      // Save settings to API or local storage
      // This is a placeholder - implement your actual settings saving logic

      setSettings(settingsToSave);
      LogInfo("Settings saved successfully");
    } catch (error) {
      setSettingsError(error.message);
      LogError(`Failed to save settings: ${error}`);
    } finally {
      setSettingsLoading(false);
    }
  },

  resetSettings: () =>
    set((state) => {
      state.settings = {
        llamaCli: {},
        llamaEmbed: {},
        document: {},
        app: {},
      };
    }),
});
