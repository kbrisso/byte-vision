import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";

import { LogError } from "../wailsjs/runtime/runtime.js";
import "../public/main.css";

import { useLlamaCliSettings } from "./LlamaCliSettingsHooks.jsx";
import { useSettingsState } from "./StoreConfig.jsx";

export const LlamaCliSettingsForm = () => {
  const {
    llamaCliSettings,
    settingsLoading,
    settingsError,
    isLoading,
    loadModels,
    loadSavedSettings,
    saveCliSettings,
    updateCliField,
    updateCliFields,
    loadSavedSetting,
    validateSettings,
  } = useLlamaCliSettings();

  const { settings } = useSettingsState();

  const appSettings = useMemo(
    () => settings?.appSettings || {},
    [settings?.appSettings],
  );

  // Local component state
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [errors, setErrors] = useState({});
  const [savedSettings, setSavedSettings] = useState([]);
  const [selectedSavedSetting, setSelectedSavedSetting] = useState("");
  const [loadingSavedSettings, setLoadingSavedSettings] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Memoize stable values to prevent infinite re-renders
  const stableAppSettings = useMemo(() => appSettings, [appSettings]);

  const stableLlamaCliSettings = useMemo(
    () => llamaCliSettings,
    [llamaCliSettings],
  );

  // Initialize models when the component mounts
  useEffect(() => {
    const initializeModels = async () => {
      if (models.length > 0 || settingsLoading || initialized) return;

      try {
        setInitialized(true);
        const formattedModels = await loadModels();
        setModels(formattedModels);

        // Set the initially selected model if available
        let selectedId;
        if (stableLlamaCliSettings.ModelFullPathVal?.length) {
          selectedId = stableLlamaCliSettings.ModelFullPathVal;
        } else if (stableAppSettings?.ModelFullPathVal?.length) {
          selectedId = stableAppSettings?.ModelFullPathVal;
          updateCliField("ModelFullPathVal", selectedId);
        } else if (
          stableAppSettings?.ModelPath &&
          stableAppSettings?.ModelFileName
        ) {
          selectedId = `${stableAppSettings?.ModelPath}${stableAppSettings?.ModelFileName}`;
        }

        if (selectedId) {
          const selectedModel = formattedModels.find(
            (item) => item.id === selectedId,
          );
          if (selectedModel) {
            const logFileName = `${stableAppSettings?.AppLogPath || ""}${selectedModel.ModelName}.log`;
            updateCliFields({
              ModelLogFileNameVal: logFileName,
              ModelFullPathVal: selectedId,
            });
            setSelectedModel(selectedModel.FullPath);
          }
        }

        // Handle prompt cache
        if (
          stableLlamaCliSettings.PromptFileVal?.length &&
          stableAppSettings?.PromptCachePath
        ) {
          const promptCacheValue =
            stableLlamaCliSettings.PromptFileVal.substring(
              stableAppSettings?.PromptCachePath.length,
            );
          updateCliField("PromptCacheVal", promptCacheValue);
        }
      } catch (error) {
        LogError(`Failed to initialize models: ${error}`);
      }
    };

    initializeModels().catch();
  }, [
    models.length,
    settingsLoading,
    initialized,
    stableAppSettings,
    stableLlamaCliSettings,
    loadModels,
    updateCliField,
    updateCliFields,
  ]);

  // Load saved settings when the component mounts
  useEffect(() => {
    const loadSaved = async () => {
      try {
        setLoadingSavedSettings(true);
        const savedSettingsData = await loadSavedSettings();
        setSavedSettings(savedSettingsData);
      } catch (error) {
        LogError("Failed to load saved settings: " + error);
        setSavedSettings([]);
      } finally {
        setLoadingSavedSettings(false);
      }
    };

    loadSaved().catch();
  }, [loadSavedSettings]);

  // Handle field changes
  const handleChange = useCallback(
    (field, value) => {
      // Update the field in the store
      updateCliField(field, value);

      // Validate the field
      const tempSettings = { ...llamaCliSettings, [field]: value };
      const validation = validateSettings(tempSettings);

      setErrors(validation.errors);
    },
    [updateCliField, llamaCliSettings, validateSettings],
  );

  // Handle path-based field changes
  const handlePathChange = useCallback(
    (basePath, field, value) => {
      if (!value.length) {
        updateCliField(field, value);
        return;
      }

      const newValue =
        value.length <= basePath.length
          ? basePath + value
          : basePath + value.substring(basePath.length);

      updateCliField(field, newValue);
    },
    [updateCliField],
  );

  // Handle model log changes
  const handleModelLogChange = useCallback(
    (field, value) => {
      handlePathChange(appSettings?.ModelLogPath || "", field, value);
    },
    [handlePathChange, appSettings?.ModelLogPath],
  );

  // Handle model selection
  const handleModelChange = useCallback(
    (event) => {
      const selectedId = event.target.value;
      const selectedModelData = models.find(
        (model) => model.FullPath === selectedId,
      );

      if (selectedModelData) {
        const logFileName = `${appSettings?.ModelLogPath || ""}${selectedModelData.ModelName}.log`;

        updateCliFields({
          ModelLogFileNameVal: logFileName,
          ModelFullPathVal: selectedId,
        });

        setSelectedModel(selectedModelData.FullPath);
      }
    },
    [models, appSettings?.ModelLogPath, updateCliFields],
  );

  // Handle loading saved settings
  const handleLoadSavedSetting = useCallback(
    async (event) => {
      const selectedIndex = event.target.value;
      setSelectedSavedSetting(selectedIndex);

      if (!selectedIndex || selectedIndex === "") return;

      try {
        const loadedSettings = await loadSavedSetting(
          savedSettings,
          selectedIndex,
        );

        if (loadedSettings && loadedSettings.ModelFullPathVal) {
          setSelectedModel(loadedSettings.ModelFullPathVal);
        }
      } catch (error) {
        LogError("Failed to load saved setting: " + error);
      }
    },
    [savedSettings, loadSavedSetting],
  );

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateSettings();
    setErrors(validation.errors);

    if (!validation.isValid) {
      LogError("Please fix validation errors before saving.");
      return;
    }

    try {
      await saveCliSettings(llamaCliSettings.Description, llamaCliSettings);

      // Refresh saved settings list
      const updatedSavedSettings = await loadSavedSettings();
      setSavedSettings(updatedSavedSettings);
    } catch (error) {
      LogError("Failed to save settings: " + error);
    }
  };

  // Format date helper
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      LogError(`Error formatting date: ${error}`);
      return dateString;
    }
  }, []);

  // Render form field helper with theme styling
  const renderFormField = (label, cmdValue, fieldId, inputProps = {}) => {
    const { helperText, value, onChange, type, ...cleanInputProps } =
      inputProps;

    return (
      <div className="theme-spacing-sm">
        <Row className="g-2 align-items-center">
          <Col md={3}>
            <Form.Label className="theme-form-label mb-0" column={"lg"}>
              {label}
            </Form.Label>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--text-quaternary)",
                fontFamily: "monospace",
              }}
            >
              {cmdValue || ""}
            </div>
          </Col>
          <Col md={6}>
            <Form.Control
              id={fieldId}
              type={type}
              value={value ?? ""}
              onChange={(e) => {
                let processedValue = e.target.value;

                if (type === "number") {
                  if (processedValue === "") {
                    processedValue = "";
                  } else {
                    const isFloatField = [
                      "TemperatureVal",
                      "TopPVal",
                      "MinPVal",
                      "RepeatPenaltyVal",
                      "MirostatLrVal",
                      "MirostatEntVal",
                      "RopeScaleVal",
                      "RopeFreqBaseVal",
                      "RopeFreqScaleVal",
                      "YarnExtFactorVal",
                      "YarnAttnFactorVal",
                      "YarnBetaSlowVal",
                      "YarnBetaFastVal",
                      "DefragTholdVal",
                      "TopNSigmaVal",
                      "XtcProbabilityVal",
                      "XtcThresholdVal",
                      "TypicalVal",
                      "PresencePenaltyVal",
                      "FrequencyPenaltyVal",
                      "DryMultiplierVal",
                      "DryBaseVal",
                      "DynatempRangeVal",
                      "DynatempExpVal",
                    ].includes(fieldId);
                    processedValue = isFloatField
                      ? parseFloat(processedValue)
                      : parseInt(processedValue, 10);

                    if (isNaN(processedValue)) {
                      processedValue = "";
                    }
                  }
                }

                onChange(processedValue);
              }}
              className="theme-form-control"
              size="sm"
              isInvalid={!!errors[fieldId]}
              {...cleanInputProps}
            />
            {errors[fieldId] && (
              <Form.Control.Feedback type="invalid">
                {errors[fieldId]}
              </Form.Control.Feedback>
            )}
          </Col>
          {helperText && (
            <Col md={3}>
              <small
                style={{
                  color: "var(--text-quaternary)",
                  fontSize: "0.75rem",
                }}
              >
                {helperText}
              </small>
            </Col>
          )}
        </Row>
      </div>
    );
  };

  // Render checkbox field helper with theme styling
  const renderCheckboxField = (
    label,
    cmdValue,
    fieldId,
    isChecked,
    helperText,
  ) => (
    <div className="theme-spacing-sm">
      <Row className="g-2 align-items-center">
        <Col md={3}>
          <Form.Label className="theme-form-label mb-0" column={"lg"}>
            {label}
          </Form.Label>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-quaternary)",
              fontFamily: "monospace",
            }}
          >
            {cmdValue || ""}
          </div>
        </Col>
        <Col md={2}>
          <div className="d-flex align-items-center gap-2">
            <Form.Check
              type="checkbox"
              id={fieldId}
              checked={!!isChecked}
              onChange={(e) => handleChange(fieldId, e.target.checked)}
              className="theme-form-check"
            />
            <Form.Label
              htmlFor={fieldId}
              className="theme-form-label mb-0"
              style={{ fontSize: "0.75rem" }}
            >
              Enabled
            </Form.Label>
          </div>
        </Col>
        {helperText && (
          <Col md={7}>
            <small
              style={{
                color: "var(--text-quaternary)",
                fontSize: "0.75rem",
              }}
            >
              {helperText}
            </small>
          </Col>
        )}
      </Row>
    </div>
  );

  // Show loading state if settings haven't loaded yet
  if (settingsLoading) {
    return (
      <div className="theme-container">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "300px" }}
        >
          <div className="text-center">
            <Spinner
              animation="border"
              className="theme-loading-spinner"
              style={{ width: "2rem", height: "2rem" }}
            />
            <div className="theme-loading-text">Loading configuration...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-container d-flex flex-column">
      {/* Header */}
      <Card
        className="theme-header-card theme-spacing-sm"
        style={{ flexShrink: 0 }}
      >
        <Card.Body className="py-2 px-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i
                className="bi bi-gear me-2 theme-icon"
                style={{ fontSize: "1.1rem" }}
              ></i>
              <div>
                <h5 className="mb-0" style={{ fontSize: "1rem" }}>
                  Llama CLI Settings
                </h5>
                <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                  Configure LlamaCpp CLI parameters for AI inference and
                  generation
                </small>
              </div>
            </div>
            <Button
              type="submit"
              form="cli-settings-form"
              disabled={isLoading}
              className="theme-btn-primary"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-1"></i>
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Error Display */}
      {settingsError && (
        <Alert
          className="theme-alert-danger theme-spacing-sm"
          style={{ flexShrink: 0 }}
        >
          <Alert.Heading className="h6">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Configuration Error
          </Alert.Heading>
          <small>Error loading settings: {settingsError}</small>
        </Alert>
      )}

      {/* Main Form - Scrollable */}
      <Card className="theme-main-card flex-grow-1 d-flex flex-column">
        <Card.Body className="p-3 d-flex flex-column">
          <div className="flex-grow-1">
            <Form id="cli-settings-form" onSubmit={handleSubmit}>
              {/* Basic Configuration */}
              <div className="theme-spacing-md">
                <h6 className="theme-section-title">
                  <i className="bi bi-info-circle me-1"></i>
                  Basic Configuration
                </h6>

                <Form.Group className="theme-spacing-sm">
                  <Form.Label className="theme-form-label" column={"lg"}>
                    Description *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={llamaCliSettings.Description ?? ""}
                    onChange={(e) =>
                      handleChange("Description", e.target.value)
                    }
                    placeholder="Enter a description for this CLI configuration"
                    className="theme-form-control"
                    size="sm"
                    isInvalid={!!errors.Description}
                  />
                  {errors.Description && (
                    <Form.Control.Feedback type="invalid">
                      {errors.Description}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Form.Group className="theme-spacing-sm">
                  <Form.Label className="theme-form-label" column={"lg"}>
                    Load Saved CLI Settings
                  </Form.Label>
                  <Form.Select
                    value={selectedSavedSetting}
                    onChange={handleLoadSavedSetting}
                    disabled={loadingSavedSettings}
                    className="theme-form-control"
                    size="sm"
                  >
                    <option value="">Select saved settings to load...</option>
                    {savedSettings.map((setting, index) => (
                      <option key={index} value={index}>
                        {setting.description ||
                          setting.settings?.Description ||
                          "Unnamed Setting"}
                        {setting.createdAt &&
                          ` - ${formatDate(setting.createdAt)}`}
                      </option>
                    ))}
                  </Form.Select>
                  {loadingSavedSettings && (
                    <Form.Text
                      style={{
                        color: "var(--text-quaternary)",
                        fontSize: "0.75rem",
                      }}
                    >
                      <Spinner animation="border" size="sm" className="me-1" />
                      Loading saved settings...
                    </Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="theme-spacing-sm">
                  <Form.Label className="theme-form-label" column={"lg"}>
                    Model Selection
                  </Form.Label>
                  <Form.Select
                    value={selectedModel}
                    onChange={handleModelChange}
                    disabled={models.length === 0}
                    className="theme-form-control"
                    size="sm"
                  >
                    <option value="">Select a model...</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.FullPath}>
                        {model.ModelName} - {model.FullPath}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              {/* Threading & CPU Configuration */}
              <Card className="theme-nested-card theme-spacing-md">
                <Card.Body className="p-3">
                  <h6 className="theme-section-title">
                    <i className="bi bi-cpu me-1"></i>
                    Threading & CPU Configuration
                  </h6>

                  {renderFormField("Threads", "--threads", "ThreadsVal", {
                    type: "number",
                    value: llamaCliSettings.ThreadsVal,
                    onChange: (value) => handleChange("ThreadsVal", value),
                    min: "1",
                    helperText: "Number of threads to use",
                  })}

                  {renderFormField(
                    "Threads Batch",
                    "--threads-batch",
                    "ThreadsBatchVal",
                    {
                      type: "number",
                      value: llamaCliSettings.ThreadsBatchVal,
                      onChange: (value) =>
                        handleChange("ThreadsBatchVal", value),
                      min: "1",
                      helperText:
                        "Number of threads to use for batch processing",
                    },
                  )}

                  {renderFormField("CPU Mask", "--cpu-mask", "CpuMaskVal", {
                    type: "text",
                    value: llamaCliSettings.CpuMaskVal,
                    onChange: (value) => handleChange("CpuMaskVal", value),
                    helperText: "CPU core mask for thread affinity",
                  })}

                  {renderCheckboxField(
                    "CPU Mask Strict",
                    "--cpu-mask-strict",
                    "CpuMaskStrictVal",
                    llamaCliSettings.CpuMaskStrictVal,
                    "Enforce strict CPU mask usage",
                  )}

                  {renderCheckboxField(
                    "No KV Offload",
                    "--no-kv-offload",
                    "NoKvOffloadVal",
                    llamaCliSettings.NoKvOffloadVal,
                    "Disable KV cache offloading",
                  )}
                </Card.Body>
              </Card>

              {/* Memory & Context Configuration */}
              <Card className="theme-nested-card theme-spacing-md">
                <Card.Body className="p-3">
                  <h6 className="theme-section-title">
                    <i className="bi bi-memory me-1"></i>
                    Memory & Context Configuration
                  </h6>

                  {renderFormField("Context Size", "--ctx-size", "CtxSizeVal", {
                    type: "number",
                    value: llamaCliSettings.CtxSizeVal,
                    onChange: (value) => handleChange("CtxSizeVal", value),
                    min: "1",
                    helperText: "Context window size in tokens",
                  })}

                  {renderFormField(
                    "Batch Size",
                    "--batch-size",
                    "BatchSizeVal",
                    {
                      type: "number",
                      value: llamaCliSettings.BatchSizeVal,
                      onChange: (value) => handleChange("BatchSizeVal", value),
                      min: "1",
                      helperText: "Batch size for processing",
                    },
                  )}

                  {renderFormField(
                    "UBatch Size",
                    "--ubatch-size",
                    "UbatchSizeVal",
                    {
                      type: "number",
                      value: llamaCliSettings.UbatchSizeVal,
                      onChange: (value) => handleChange("UbatchSizeVal", value),
                      min: "1",
                      helperText: "Micro-batch size for processing",
                    },
                  )}

                  {renderFormField("Keep Context", "--keep", "KeepVal", {
                    type: "number",
                    value: llamaCliSettings.KeepVal,
                    onChange: (value) => handleChange("KeepVal", value),
                    min: "0",
                    helperText: "Number of tokens to keep from initial prompt",
                  })}

                  {renderCheckboxField(
                    "Flash Attention",
                    "--flash-attn",
                    "FlashAttnVal",
                    llamaCliSettings.FlashAttnVal,
                    "Enable flash attention optimization",
                  )}
                </Card.Body>
              </Card>

              {/* Generation Parameters */}
              <Card className="theme-nested-card theme-spacing-md">
                <Card.Body className="p-3">
                  <h6 className="theme-section-title">
                    <i className="bi bi-sliders me-1"></i>
                    Generation Parameters
                  </h6>

                  {renderFormField("Temperature", "--temp", "TemperatureVal", {
                    type: "number",
                    value: llamaCliSettings.TemperatureVal,
                    onChange: (value) => handleChange("TemperatureVal", value),
                    min: "0",
                    max: "2",
                    step: "0.1",
                    helperText: "Sampling temperature (0.0 to 2.0)",
                  })}

                  {renderFormField("Top-K", "--top-k", "TopKVal", {
                    type: "number",
                    value: llamaCliSettings.TopKVal,
                    onChange: (value) => handleChange("TopKVal", value),
                    min: "1",
                    helperText: "Top-K sampling parameter",
                  })}

                  {renderFormField("Top-P", "--top-p", "TopPVal", {
                    type: "number",
                    value: llamaCliSettings.TopPVal,
                    onChange: (value) => handleChange("TopPVal", value),
                    min: "0",
                    max: "1",
                    step: "0.01",
                    helperText: "Top-P (nucleus) sampling parameter",
                  })}

                  {renderFormField(
                    "Repeat Penalty",
                    "--repeat-penalty",
                    "RepeatPenaltyVal",
                    {
                      type: "number",
                      value: llamaCliSettings.RepeatPenaltyVal,
                      onChange: (value) =>
                        handleChange("RepeatPenaltyVal", value),
                      min: "0",
                      step: "0.01",
                      helperText: "Penalty for token repetition",
                    },
                  )}

                  {renderFormField(
                    "Repeat Last N",
                    "--repeat-last-n",
                    "RepeatLastNVal",
                    {
                      type: "number",
                      value: llamaCliSettings.RepeatLastNVal,
                      onChange: (value) =>
                        handleChange("RepeatLastNVal", value),
                      min: "0",
                      helperText:
                        "Last N tokens to consider for repetition penalty",
                    },
                  )}

                  {renderFormField("Seed", "--seed", "SeedVal", {
                    type: "number",
                    value: llamaCliSettings.SeedVal,
                    onChange: (value) => handleChange("SeedVal", value),
                    helperText: "Random seed for generation (-1 for random)",
                  })}
                </Card.Body>
              </Card>

              {/* File Paths */}
              <Card className="theme-nested-card theme-spacing-md">
                <Card.Body className="p-3">
                  <h6 className="theme-section-title">
                    <i className="bi bi-folder me-1"></i>
                    File Paths
                  </h6>

                  {renderFormField(
                    "Model Path",
                    "--model",
                    "ModelFullPathVal",
                    {
                      type: "text",
                      value: llamaCliSettings.ModelFullPathVal,
                      onChange: (value) =>
                        handleChange("ModelFullPathVal", value),
                      helperText: "Path to the model file",
                    },
                  )}

                  {renderFormField(
                    "Log File",
                    "--log-file",
                    "ModelLogFileNameVal",
                    {
                      type: "text",
                      value: llamaCliSettings.ModelLogFileNameVal,
                      onChange: (value) =>
                        handleModelLogChange("ModelLogFileNameVal", value),
                      helperText: "Path to log file",
                    },
                  )}

                  {renderFormField(
                    "Prompt Cache",
                    "--prompt-cache",
                    "PromptCacheVal",
                    {
                      type: "text",
                      value: llamaCliSettings.PromptCacheVal,
                      onChange: (value) =>
                        handleChange("PromptCacheVal", value),
                      helperText: "Prompt cache file name",
                    },
                  )}
                </Card.Body>
              </Card>

              {/* Advanced Options */}
              <Card className="theme-nested-card theme-spacing-md">
                <Card.Body className="p-3">
                  <h6 className="theme-section-title">
                    <i className="bi bi-gear-wide-connected me-1"></i>
                    Advanced Options
                  </h6>

                  {renderCheckboxField(
                    "Verbose",
                    "--verbose",
                    "VerboseVal",
                    llamaCliSettings.VerboseVal,
                    "Enable verbose output",
                  )}

                  {renderCheckboxField(
                    "Log Disable",
                    "--log-disable",
                    "LogDisableVal",
                    llamaCliSettings.LogDisableVal,
                    "Disable logging",
                  )}

                  {renderCheckboxField(
                    "Simple IO",
                    "--simple-io",
                    "SimpleIoVal",
                    llamaCliSettings.SimpleIoVal,
                    "Use simple input/output mode",
                  )}

                  {renderCheckboxField(
                    "Continuous Batching",
                    "--cont-batching",
                    "ContBatchingVal",
                    llamaCliSettings.ContBatchingVal,
                    "Enable continuous batching",
                  )}

                  {renderFormField(
                    "GPU Layers",
                    "--gpu-layers",
                    "GpuLayersVal",
                    {
                      type: "number",
                      value: llamaCliSettings.GpuLayersVal,
                      onChange: (value) => handleChange("GpuLayersVal", value),
                      min: "0",
                      helperText: "Number of layers to offload to GPU",
                    },
                  )}

                  {renderFormField("Main GPU", "--main-gpu", "MainGpuVal", {
                    type: "number",
                    value: llamaCliSettings.MainGpuVal,
                    onChange: (value) => handleChange("MainGpuVal", value),
                    min: "0",
                    helperText: "Main GPU device ID",
                  })}
                </Card.Body>
              </Card>

              {/* Add bottom padding to ensure last elements are fully visible */}
              <div style={{ height: "40px" }}></div>
            </Form>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
