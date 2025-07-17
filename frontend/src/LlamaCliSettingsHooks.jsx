import { useCallback, useEffect, useMemo } from "react";

import { LogError, LogInfo, LogWarning } from "../wailsjs/runtime/runtime.js";
import {
  GetDefaultSettings,
  GetModelFiles,
  GetSavedCliSettings,
  SaveCliSettings,
} from "../wailsjs/go/main/App.js";

import { useStore } from "./StoreConfig.jsx";

export const useLlamaCliSettings = () => {
  const {
    settings,
    settingsLoading,
    settingsError,
    updateLlamaCliSettings,
    setSettingsLoading,
    setSettingsError,
    isLoading,
    setLoading,
  } = useStore();

  const llamaCliSettings = useMemo(
    () => settings?.llamaCli ?? {},
    [settings?.llamaCli],
  );

  // Initialize default settings if llamaCli is empty
  useEffect(() => {
    const initializeDefaults = async () => {
      // Only initialize if llamaCli settings are empty and not already loading
      if (Object.keys(llamaCliSettings).length === 0 && !settingsLoading) {
        try {
          setSettingsLoading(true);

          const result = await GetDefaultSettings();
          const [llamaEmbed, llamaCpp, appSettings] = JSON.parse(result);

          if (llamaCpp && Object.keys(llamaCpp).length > 0) {
            updateLlamaCliSettings(llamaCpp);
            LogInfo(`Default LlamaCli settings loaded: ${llamaCpp}`);
          }
        } catch (error) {
          LogError(`Failed to load default CLI settings: ${error}`);
          setSettingsError(error.message);
        } finally {
          setSettingsLoading(false);
        }
      }
    };

    initializeDefaults().catch();
  }, [
    llamaCliSettings,
    settingsLoading,
    updateLlamaCliSettings,
    setSettingsLoading,
    setSettingsError,
  ]);

  // Load available models
  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      const result = await GetModelFiles();

      const formattedModels = result.map((item) => ({
        id: item.FullPath.replace(/\\/g, "/"),
        ModelName: item.FileName,
        FullPath: item.FullPath.replace(/\\/g, "/"),
      }));

      return formattedModels;
    } catch (error) {
      LogError(`Failed to load models: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  // Load saved CLI settings
  const loadSavedSettings = useCallback(async () => {
    try {
      setLoading(true);
      const result = await GetSavedCliSettings();

      let settingsData = [];

      if (typeof result === "string") {
        try {
          settingsData = JSON.parse(result);
        } catch (parseError) {
          LogError("Failed to parse JSON string:", parseError);
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

      return settingsData;
    } catch (error) {
      LogError("Failed to load saved settings: " + error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  // Save CLI settings
  const saveCliSettings = useCallback(
    async (description, settingsToSave) => {
      try {
        setLoading(true);
        setSettingsError(null);

        await SaveCliSettings(description, settingsToSave);

        // Update the store with the saved settings
        updateLlamaCliSettings(settingsToSave);

        LogInfo("Settings saved as: " + description);
        return settingsToSave;
      } catch (error) {
        const errorMessage = "Failed to save settings: " + error;
        setSettingsError(errorMessage);
        LogError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setSettingsError, updateLlamaCliSettings],
  );

  // Update specific CLI setting field
  const updateCliField = useCallback(
    (field, value) => {
      const updatedSettings = {
        ...llamaCliSettings,
        [field]: value,
      };

      updateLlamaCliSettings(updatedSettings);
    },
    [llamaCliSettings, updateLlamaCliSettings],
  );

  // Update multiple CLI setting fields
  const updateCliFields = useCallback(
    (fieldsToUpdate) => {
      const updatedSettings = {
        ...llamaCliSettings,
        ...fieldsToUpdate,
      };

      updateLlamaCliSettings(updatedSettings);
    },
    [llamaCliSettings, updateLlamaCliSettings],
  );

  // Load saved setting by index
  const loadSavedSetting = useCallback(
    async (savedSettings, selectedIndex) => {
      try {
        if (!selectedIndex || selectedIndex === "") return;

        const index = parseInt(selectedIndex, 10);
        const selectedSetting = savedSettings[index];

        if (selectedSetting) {
          const settingsToLoad = selectedSetting.settings || selectedSetting;

          // Update the CLI settings in the store
          updateLlamaCliSettings(settingsToLoad);

          LogInfo(
            `Loaded settings: ${selectedSetting.description || settingsToLoad.Description || "Unnamed"}`,
          );
          return settingsToLoad;
        }
      } catch (error) {
        LogError("Failed to load saved setting: " + error);
        throw error;
      }
    },
    [updateLlamaCliSettings],
  );

  // Validate CLI settings
  const validateSettings = useCallback(
    (settingsToValidate = llamaCliSettings) => {
      const errors = {};

      // Required field validations
      if (
        !settingsToValidate.Description ||
        settingsToValidate.Description === ""
      ) {
        errors.Description = "Description is required.";
      } else if (settingsToValidate.Description.length < 5) {
        errors.Description = "Description must be at least 5 characters.";
      }

      if (
        !settingsToValidate.GPULayersCmd ||
        settingsToValidate.GPULayersCmd.trim() === ""
      ) {
        errors.GPULayersCmd = "GPU Layers Command cannot be empty.";
      }

      if (
        !settingsToValidate.LLamaCppPath ||
        settingsToValidate.LLamaCppPath.trim() === ""
      ) {
        errors.LLamaCppPath = "Llama CPP Path is required.";
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
    [llamaCliSettings],
  );

  return {
    // State
    llamaCliSettings,
    settingsLoading,
    settingsError,
    isLoading,

    // Actions
    loadModels,
    loadSavedSettings,
    saveCliSettings,
    updateCliField,
    updateCliFields,
    loadSavedSetting,
    validateSettings,
  };
};
