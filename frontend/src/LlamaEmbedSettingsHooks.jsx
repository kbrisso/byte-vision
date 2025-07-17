import { useCallback, useEffect, useMemo } from "react";

import { LogError, LogInfo, LogWarning } from "../wailsjs/runtime/runtime.js";
import {
  GetDefaultSettings,
  GetModelFiles,
  GetSavedEmbedSettings,
  SaveEmbedSettings,
} from "../wailsjs/go/main/App.js";

import { useStore } from "./StoreConfig.jsx";

export const useLlamaEmbedSettings = () => {
  const {
    settings,
    settingsLoading,
    settingsError,
    updateLlamaEmbedSettings,
    setSettingsLoading,
    setSettingsError,
    isLoading,
    setLoading,
  } = useStore();

  const llamaEmbedSettings = useMemo(() => {
    return settings.llamaEmbed || {};
  }, [settings.llamaEmbed]);

  // Initialize default settings if llamaEmbed is empty
  useEffect(() => {
    const initializeDefaults = async () => {
      // Only initialize if llamaEmbed settings are empty and not already loading
      if (Object.keys(llamaEmbedSettings).length === 0 && !settingsLoading) {
        try {
          setSettingsLoading(true);
          const result = await GetDefaultSettings();
          const [llamaEmbed, llamaCpp, appSettings] = JSON.parse(result);

          if (llamaEmbed && Object.keys(llamaEmbed).length > 0) {
            updateLlamaEmbedSettings(llamaEmbed);
            LogInfo(`Default LlamaEmbed settings loaded: ${llamaEmbed}`);
          }
        } catch (error) {
          LogError(`Failed to load default embed settings: ${error}`);
          setSettingsError(error.message);
        } finally {
          setSettingsLoading(false);
        }
      }
    };

    initializeDefaults().catch((error) =>
      LogError(`Failed to load default embed settings: ${error}`),
    );
  }, [
    llamaEmbedSettings,
    settingsLoading,
    updateLlamaEmbedSettings,
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

  // Load saved embed settings
  const loadSavedSettings = useCallback(async () => {
    try {
      setLoading(true);
      const result = await GetSavedEmbedSettings();

      let settingsData = [];

      if (typeof result === "string") {
        try {
          settingsData = JSON.parse(result);
        } catch (error) {
          settingsData = [];
          LogError(`Failed to parse JSON string: ${error}`);
        }
      } else if (Array.isArray(result)) {
        settingsData = result;
      } else if (result && Array.isArray(result.data)) {
        settingsData = result.data;
      }

      if (!Array.isArray(settingsData)) {
        LogWarning(`Expected array but got: typeof ${settingsData}`);
        settingsData = [];
      }

      return settingsData;
    } catch (error) {
      LogError(`Failed to load saved embed settings: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  // Save embed settings
  const saveEmbedSettings = useCallback(
    async (description, settingsToSave) => {
      try {
        setLoading(true);
        setSettingsError(null);

        await SaveEmbedSettings(description, settingsToSave);

        // Update the store with the saved settings
        updateLlamaEmbedSettings(settingsToSave);

        LogInfo(`Embed settings saved as: ${description}`);
        return settingsToSave;
      } catch (error) {
        const errorMessage = `Failed to save embed settings: ${error}`;
        setSettingsError(errorMessage);
        LogError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setSettingsError, updateLlamaEmbedSettings],
  );

  // Update a specific embed setting field
  const updateEmbedField = useCallback(
    (field, value) => {
      const updatedSettings = {
        ...llamaEmbedSettings,
        [field]: value,
      };

      updateLlamaEmbedSettings(updatedSettings);
    },
    [llamaEmbedSettings, updateLlamaEmbedSettings],
  );

  // Update multiple embed setting fields
  const updateEmbedFields = useCallback(
    (fieldsToUpdate) => {
      const updatedSettings = {
        ...llamaEmbedSettings,
        ...fieldsToUpdate,
      };

      updateLlamaEmbedSettings(updatedSettings);
    },
    [llamaEmbedSettings, updateLlamaEmbedSettings],
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

          // Update the embed settings in the store
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
    [updateLlamaEmbedSettings],
  );

  // Validate embed settings
  const validateSettings = useCallback(
    (settingsToValidate = llamaEmbedSettings) => {
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
        !settingsToValidate.EmbedGPULayersVal ||
        settingsToValidate.EmbedGPULayersVal === ""
      ) {
        errors.EmbedGPULayersVal = "GPU Layers cannot be empty.";
      }

      if (
        !settingsToValidate.EmbedModelFullPathVal ||
        settingsToValidate.EmbedModelFullPathVal.trim() === ""
      ) {
        errors.EmbedModelFullPathVal = "Embed model path is required.";
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
    [llamaEmbedSettings],
  );

  return {
    // State
    llamaEmbedSettings,
    settingsLoading,
    settingsError,
    isLoading,

    // Actions
    loadModels,
    loadSavedSettings,
    saveEmbedSettings,
    updateEmbedField,
    updateEmbedFields,
    loadSavedSetting,
    validateSettings,
  };
};
