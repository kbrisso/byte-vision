import { LogError, LogInfo, LogWarning } from "../wailsjs/runtime/runtime.js";
import {
  GetDefaultSettings,
  GetModelFiles,
  GetSavedCliSettings,
  GetSavedEmbedSettings,
  SaveCliSettings,
  SaveEmbedSettings,
} from "../wailsjs/go/main/App.js";

export const createSettingsState = (set, get) => ({
  // Settings state
  settings: {
    llamaCli: {},
    llamaEmbed: {},
    document: {},
    app: {},
  },
  settingsLoading: false,
  settingsError: null,
  initialized: false,

  // Models and saved settings state
  models: [],
  modelsLoading: false,
  savedCliSettings: [],
  savedEmbedSettings: [],
  savedSettingsLoading: false,

  // Form state (centralized)
  formState: {
    cli: {
      selectedModel: "",
      errors: {},
      selectedSavedSetting: "",
      initialized: false,
    },
    embed: {
      selectedModel: "",
      errors: {},
      selectedSavedSetting: "",
      initialized: false,
      showAdvanced: false,
    },
  },

  // Basic actions
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

  // Models management
  setModels: (models) =>
    set((state) => {
      state.models = models;
    }),

  setModelsLoading: (loading) =>
    set((state) => {
      state.modelsLoading = loading;
    }),

  // Saved settings management
  setSavedCliSettings: (settings) =>
    set((state) => {
      state.savedCliSettings = settings;
    }),

  setSavedEmbedSettings: (settings) =>
    set((state) => {
      state.savedEmbedSettings = settings;
    }),

  setSavedSettingsLoading: (loading) =>
    set((state) => {
      state.savedSettingsLoading = loading;
    }),

  // Form state management
  updateCliFormState: (updates) =>
    set((state) => {
      state.formState.cli = { ...state.formState.cli, ...updates };
    }),

  updateEmbedFormState: (updates) =>
    set((state) => {
      state.formState.embed = { ...state.formState.embed, ...updates };
    }),

  // Complex actions - Default Settings Loading
  loadDefaultSettings: async () => {
    const {
      setSettingsLoading,
      setSettingsError,
      updateLlamaCliSettings,
      updateLlamaEmbedSettings,
      updateAppSettings,
      settings,
    } = get();

    try {
      setSettingsLoading(true);
      setSettingsError(null);

      const result = await GetDefaultSettings();
      const [llamaCli, llamaEmbed, appSettings] = JSON.parse(result);

      if (
        llamaCli &&
        Object.keys(llamaCli).length > 0 &&
        Object.keys(settings.llamaCli).length === 0
      ) {
        updateLlamaCliSettings(llamaCli);
        LogInfo("Default LlamaCli settings loaded");
      }

      if (
        llamaEmbed &&
        Object.keys(llamaEmbed).length > 0 &&
        Object.keys(settings.llamaEmbed).length === 0
      ) {
        updateLlamaEmbedSettings(llamaEmbed);
        LogInfo("Default LlamaEmbed settings loaded");
      }

      if (
        appSettings &&
        Object.keys(appSettings).length > 0 &&
        Object.keys(settings.app).length === 0
      ) {
        updateAppSettings(appSettings);
        LogInfo("Default App settings loaded");
      }
    } catch (error) {
      setSettingsError(error.message);
      LogError(`Failed to load default settings: ${error}`);
    } finally {
      setSettingsLoading(false);
    }
  },

  // Models loading
  loadModels: async () => {
    const { setModelsLoading, setModels } = get();

    try {
      setModelsLoading(true);
      const result = await GetModelFiles();

      const formattedModels = result.map((item) => ({
        id: item.FullPath.replace(/\\/g, "/"),
        ModelName: item.FileName,
        FullPath: item.FullPath.replace(/\\/g, "/"),
      }));

      setModels(formattedModels);
      return formattedModels;
    } catch (error) {
      LogError(`Failed to load models: ${error}`);
      throw error;
    } finally {
      setModelsLoading(false);
    }
  },

  // Saved CLI settings
  loadSavedCliSettings: async () => {
    const { setSavedSettingsLoading, setSavedCliSettings } = get();

    try {
      setSavedSettingsLoading(true);
      const result = await GetSavedCliSettings();

      let settingsData = [];
      if (typeof result === "string") {
        try {
          settingsData = JSON.parse(result);
        } catch (parseError) {
          LogError("Failed to parse CLI settings JSON:", parseError);
          settingsData = [];
        }
      } else if (Array.isArray(result)) {
        settingsData = result;
      } else if (result && Array.isArray(result.data)) {
        settingsData = result.data;
      }

      if (!Array.isArray(settingsData)) {
        LogWarning("Expected array but got:", typeof settingsData);
        settingsData = [];
      }

      setSavedCliSettings(settingsData);
      return settingsData;
    } catch (error) {
      LogError("Failed to load saved CLI settings:", error);
      throw error;
    } finally {
      setSavedSettingsLoading(false);
    }
  },

  // Saved Embed settings
  loadSavedEmbedSettings: async () => {
    const { setSavedSettingsLoading, setSavedEmbedSettings } = get();

    try {
      setSavedSettingsLoading(true);
      const result = await GetSavedEmbedSettings();

      let settingsData = [];
      if (typeof result === "string") {
        try {
          settingsData = JSON.parse(result);
        } catch (error) {
          settingsData = [];
          LogError(`Failed to parse embed settings JSON: ${error}`);
        }
      } else if (Array.isArray(result)) {
        settingsData = result;
      } else if (result && Array.isArray(result.data)) {
        settingsData = result.data;
      }

      if (!Array.isArray(settingsData)) {
        LogWarning(`Expected array but got: ${typeof settingsData}`);
        settingsData = [];
      }

      setSavedEmbedSettings(settingsData);
      return settingsData;
    } catch (error) {
      LogError(`Failed to load saved embed settings: ${error}`);
      throw error;
    } finally {
      setSavedSettingsLoading(false);
    }
  },

  // Save CLI settings
  saveCliSettings: async (description, settingsToSave) => {
    const {
      setSettingsLoading,
      setSettingsError,
      updateLlamaCliSettings,
      loadSavedCliSettings,
    } = get();

    try {
      setSettingsLoading(true);
      setSettingsError(null);

      await SaveCliSettings(description, settingsToSave);
      updateLlamaCliSettings(settingsToSave);

      // Refresh saved settings list
      await loadSavedCliSettings();

      LogInfo("CLI settings saved as: " + description);
      return settingsToSave;
    } catch (error) {
      const errorMessage = "Failed to save CLI settings: " + error;
      setSettingsError(errorMessage);
      LogError(errorMessage);
      throw error;
    } finally {
      setSettingsLoading(false);
    }
  },

  // Save Embed settings
  saveEmbedSettings: async (description, settingsToSave) => {
    const {
      setSettingsLoading,
      setSettingsError,
      updateLlamaEmbedSettings,
      loadSavedEmbedSettings,
    } = get();

    try {
      setSettingsLoading(true);
      setSettingsError(null);

      await SaveEmbedSettings(description, settingsToSave);
      updateLlamaEmbedSettings(settingsToSave);

      // Refresh saved settings list
      await loadSavedEmbedSettings();

      LogInfo(`Embed settings saved as: ${description}`);
      return settingsToSave;
    } catch (error) {
      const errorMessage = `Failed to save embed settings: ${error}`;
      setSettingsError(errorMessage);
      LogError(errorMessage);
      throw error;
    } finally {
      setSettingsLoading(false);
    }
  },

  // Field update methods
  updateCliField: (field, value) => {
    const { settings, updateLlamaCliSettings } = get();
    const updatedSettings = {
      ...settings.llamaCli,
      [field]: value,
    };
    updateLlamaCliSettings(updatedSettings);
  },

  updateCliFields: (fieldsToUpdate) => {
    const { settings, updateLlamaCliSettings } = get();
    const updatedSettings = {
      ...settings.llamaCli,
      ...fieldsToUpdate,
    };
    updateLlamaCliSettings(updatedSettings);
  },

  updateEmbedField: (field, value) => {
    const { settings, updateLlamaEmbedSettings } = get();
    const updatedSettings = {
      ...settings.llamaEmbed,
      [field]: value,
    };
    updateLlamaEmbedSettings(updatedSettings);
  },

  updateEmbedFields: (fieldsToUpdate) => {
    const { settings, updateLlamaEmbedSettings } = get();
    const updatedSettings = {
      ...settings.llamaEmbed,
      ...fieldsToUpdate,
    };
    updateLlamaEmbedSettings(updatedSettings);
  },

  // Load saved setting by index
  loadSavedCliSetting: async (selectedIndex) => {
    const { savedCliSettings, updateLlamaCliSettings } = get();

    try {
      if (!selectedIndex || selectedIndex === "") return;

      const index = parseInt(selectedIndex, 10);
      const selectedSetting = savedCliSettings[index];

      if (selectedSetting) {
        const settingsToLoad = selectedSetting.settings || selectedSetting;
        updateLlamaCliSettings(settingsToLoad);

        LogInfo(
          `Loaded CLI settings: ${selectedSetting.description || settingsToLoad.Description || "Unnamed"}`,
        );
        return settingsToLoad;
      }
    } catch (error) {
      LogError("Failed to load saved CLI setting: " + error);
      throw error;
    }
  },

  loadSavedEmbedSetting: async (selectedIndex) => {
    const { savedEmbedSettings, updateLlamaEmbedSettings } = get();

    try {
      if (!selectedIndex || selectedIndex === "") return;

      const index = parseInt(selectedIndex, 10);
      const selectedSetting = savedEmbedSettings[index];

      if (selectedSetting) {
        const settingsToLoad = selectedSetting.settings || selectedSetting;
        updateLlamaEmbedSettings(settingsToLoad);

        LogInfo(
          `Loaded embed settings: ${selectedSetting.description || settingsToLoad.Description || "Unnamed"}`,
        );
        return settingsToLoad;
      }
    } catch (error) {
      LogError(`Failed to load saved embed setting: ${error}`);
      throw error;
    }
  },

  // Validation methods
  validateCliSettings: (settingsToValidate) => {
    const { settings } = get();
    const currentSettings = settingsToValidate || settings.llamaCli;
    const errors = {};

    // Required field validations
    if (!currentSettings.Description || currentSettings.Description === "") {
      errors.Description = "Description is required.";
    } else if (currentSettings.Description.length < 5) {
      errors.Description = "Description must be at least 5 characters.";
    }

    if (
      !currentSettings.GPULayersCmd ||
      currentSettings.GPULayersCmd.trim() === ""
    ) {
      errors.GPULayersCmd = "GPU Layers Command cannot be empty.";
    }


    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  validateEmbedSettings: (settingsToValidate) => {
    const { settings } = get();
    const currentSettings = settingsToValidate || settings.llamaEmbed;
    const errors = {};

    // Required field validations
    if (!currentSettings.Description || currentSettings.Description === "") {
      errors.Description = "Description is required.";
    } else if (currentSettings.Description.length < 5) {
      errors.Description = "Description must be at least 5 characters.";
    }

    if (
      !currentSettings.EmbedGPULayersVal ||
      currentSettings.EmbedGPULayersVal === ""
    ) {
      errors.EmbedGPULayersVal = "GPU Layers cannot be empty.";
    }


    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Reset methods
  resetSettings: () =>
    set((state) => {
      state.settings = {
        llamaCli: {},
        llamaEmbed: {},
        document: {},
        app: {},
      };
      state.formState = {
        cli: {
          selectedModel: "",
          errors: {},
          selectedSavedSetting: "",
          initialized: false,
        },
        embed: {
          selectedModel: "",
          errors: {},
          selectedSavedSetting: "",
          initialized: false,
          showAdvanced: false,
        },
      };
    }),
});
