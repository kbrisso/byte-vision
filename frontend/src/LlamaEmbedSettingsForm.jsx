import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";

import { LogError } from "../wailsjs/runtime/runtime.js";
import "../public/main.css";

import { useLlamaEmbedSettings } from "./LlamaEmbedSettingsHooks.jsx";
import { useSettingsState } from "./StoreConfig.jsx";

export const LlamaEmbedSettingsForm = () => {
  const {
    llamaEmbedSettings,
    settingsLoading,
    settingsError,
    isLoading,
    loadModels,
    loadSavedSettings,
    saveEmbedSettings,
    updateEmbedField,
    updateEmbedFields,
    loadSavedSetting,
    validateSettings,
  } = useLlamaEmbedSettings();

  const { settings } = useSettingsState();
  const appSettings = useMemo(
    () => settings?.appSettings ?? {},
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

  const stableLlamaEmbedSettings = useMemo(
    () => llamaEmbedSettings,
    [llamaEmbedSettings],
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
        if (stableLlamaEmbedSettings.EmbedModelFullPathVal?.length) {
          selectedId = stableLlamaEmbedSettings.EmbedModelFullPathVal;
        } else if (stableAppSettings.EmbedModelFullPathVal?.length) {
          selectedId = stableAppSettings.EmbedModelFullPathVal;
          updateEmbedField("EmbedModelFullPathVal", selectedId);
        } else if (
          stableAppSettings.ModelPath &&
          stableAppSettings.EmbedModelFileName
        ) {
          selectedId = `${stableAppSettings.ModelPath}${stableAppSettings.EmbedModelFileName}`;
        }

        if (selectedId) {
          const selectedModel = formattedModels.find(
            (item) => item.id === selectedId,
          );
          if (selectedModel) {
            const logFileName = `${stableAppSettings.AppLogPath || ""}${selectedModel.ModelName}.log`;
            updateEmbedFields({
              EmbedModelLogFileNameVal: logFileName,
              EmbedModelFullPathVal: selectedId,
            });
            setSelectedModel(selectedModel.FullPath);
          }
        }
      } catch (error) {
        LogError(`Failed to initialize embed models: ${error}`);
      }
    };

    initializeModels().catch();
  }, [
    models.length,
    settingsLoading,
    initialized,
    stableAppSettings,
    stableLlamaEmbedSettings,
    loadModels,
    updateEmbedField,
    updateEmbedFields,
  ]);

  // Load saved settings when component mounts
  useEffect(() => {
    const loadSaved = async () => {
      try {
        setLoadingSavedSettings(true);
        const savedSettingsData = await loadSavedSettings();
        setSavedSettings(savedSettingsData);
      } catch (error) {
        LogError("Failed to load saved embed settings: " + error);
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
      updateEmbedField(field, value);

      // Validate the field
      const tempSettings = { ...llamaEmbedSettings, [field]: value };
      const validation = validateSettings(tempSettings);

      setErrors(validation.errors);
    },
    [updateEmbedField, llamaEmbedSettings, validateSettings],
  );

  // Handle path-based field changes
  const handlePathChange = useCallback(
    (basePath, field, value) => {
      if (!value.length) {
        updateEmbedField(field, value);
        return;
      }

      const newValue =
        value.length <= basePath.length
          ? basePath + value
          : basePath + value.substring(basePath.length);

      updateEmbedField(field, newValue);
    },
    [updateEmbedField],
  );

  // Handle model log changes
  const handleEmbedModelLogChange = useCallback(
    (field, value) => {
      handlePathChange(appSettings.ModelLogPath || "", field, value);
    },
    [handlePathChange, appSettings.ModelLogPath],
  );

  // Handle model selection
  const handleModelChange = useCallback(
    (event) => {
      const selectedId = event.target.value;
      const selectedModelData = models.find(
        (model) => model.FullPath === selectedId,
      );

      if (selectedModelData) {
        const logFileName = `${appSettings.ModelLogPath || ""}${selectedModelData.ModelName}.log`;

        updateEmbedFields({
          EmbedModelLogFileNameVal: logFileName,
          EmbedModelFullPathVal: selectedId,
        });

        setSelectedModel(selectedModelData.FullPath);
      }
    },
    [models, appSettings.ModelLogPath, updateEmbedFields],
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

        if (loadedSettings && loadedSettings.EmbedModelFullPathVal) {
          setSelectedModel(loadedSettings.EmbedModelFullPathVal);
        }
      } catch (error) {
        LogError("Failed to load saved embed setting: " + error);
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
      await saveEmbedSettings(
        llamaEmbedSettings.Description,
        llamaEmbedSettings,
      );

      // Refresh saved settings list
      const updatedSavedSettings = await loadSavedSettings();
      setSavedSettings(updatedSavedSettings);
    } catch (error) {
      LogError(error);
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
                      "EmbedTemperatureVal",
                      "EmbedRepeatPenaltyVal",
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
              column={"lg"}
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
                className="bi bi-cpu me-2 theme-icon"
                style={{ fontSize: "1.1rem" }}
              ></i>
              <div>
                <h5 className="mb-0" style={{ fontSize: "1rem" }}>
                  Llama Embed Settings
                </h5>
                <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                  Configure LlamaCpp embedding parameters for document
                  processing and search
                </small>
              </div>
            </div>
            <Button
              type="submit"
              form="embed-settings-form"
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
          <small>Error loading embed settings: {settingsError}</small>
        </Alert>
      )}

      {/* Main Form - Scrollable */}
      <Card className="theme-main-card d-flex flex-column">
        <Card.Body className="p-3 d-flex flex-column">
          <div className="flex-grow-1">
            <Form id="embed-settings-form" onSubmit={handleSubmit}>
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
                    value={llamaEmbedSettings.Description ?? ""}
                    onChange={(e) =>
                      handleChange("Description", e.target.value)
                    }
                    placeholder="Enter a description for this embed configuration"
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
                    Load Saved Settings
                  </Form.Label>
                  <Form.Select
                    value={selectedSavedSetting}
                    onChange={handleLoadSavedSetting}
                    disabled={loadingSavedSettings}
                    className="theme-form-control"
                    size="sm"
                  >
                    <option value="">
                      Select saved embed settings to load...
                    </option>
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
                      Loading saved embed settings...
                    </Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="theme-spacing-sm">
                  <Form.Label className="theme-form-label" column={"lg"}>
                    Embed Model Selection
                  </Form.Label>
                  <Form.Select
                    value={selectedModel}
                    onChange={handleModelChange}
                    disabled={models.length === 0}
                    className="theme-form-control"
                    size="sm"
                  >
                    <option value="">Select an embed model...</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.FullPath}>
                        {model.ModelName} - {model.FullPath}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              {/* Embedding Configuration */}
              <Card className="theme-nested-card theme-spacing-md">
                <Card.Body className="p-3">
                  <h6 className="theme-section-title">
                    <i className="bi bi-vector-pen me-1"></i>
                    Embedding Configuration
                  </h6>

                  {renderFormField(
                    "Embed Model Path",
                    "--model",
                    "EmbedModelFullPathVal",
                    {
                      type: "text",
                      value: llamaEmbedSettings.EmbedModelFullPathVal,
                      onChange: (value) =>
                        handleChange("EmbedModelFullPathVal", value),
                      helperText: "Path to the embedding model file",
                    },
                  )}

                  {renderFormField(
                    "Embed Log File",
                    "--log-file",
                    "EmbedModelLogFileNameVal",
                    {
                      type: "text",
                      value: llamaEmbedSettings.EmbedModelLogFileNameVal,
                      onChange: (value) =>
                        handleEmbedModelLogChange(
                          "EmbedModelLogFileNameVal",
                          value,
                        ),
                      helperText: "Path to embedding log file",
                    },
                  )}

                  {renderFormField(
                    "Context Size",
                    "--ctx-size",
                    "EmbedCtxSizeVal",
                    {
                      type: "text",
                      value: llamaEmbedSettings.EmbedCtxSizeVal,
                      onChange: (value) =>
                        handleChange("EmbedCtxSizeVal", value),
                      min: "1",
                      helperText: "Context window size for embeddings",
                    },
                  )}

                  {renderFormField(
                    "Batch Size",
                    "--batch-size",
                    "EmbedBatchSizeVal",
                    {
                      type: "text",
                      value: llamaEmbedSettings.EmbedBatchSizeVal,
                      onChange: (value) =>
                        handleChange("EmbedBatchSizeVal", value),
                      min: "1",
                      helperText: "Batch size for embedding processing",
                    },
                  )}

                  {renderFormField(
                    "UBatch Size",
                    "--ubatch-size",
                    "EmbedUbatchSizeVal",
                    {
                      type: "text",
                      value: llamaEmbedSettings.EmbedUbatchSizeVal,
                      onChange: (value) =>
                        handleChange("EmbedUbatchSizeVal", value),
                      min: "1",
                      helperText: "Micro-batch size for embedding processing",
                    },
                  )}
                </Card.Body>
              </Card>

              {/* Threading Configuration */}
              <Card className="theme-nested-card theme-spacing-md">
                <Card.Body className="p-3">
                  <h6 className="theme-section-title">
                    <i className="bi bi-cpu me-1"></i>
                    Threading Configuration
                  </h6>

                  {renderFormField("Threads", "--threads", "EmbedThreadsVal", {
                    type: "text",
                    value: llamaEmbedSettings.EmbedThreadsVal,
                    onChange: (value) => handleChange("EmbedThreadsVal", value),
                    min: "1",
                    helperText: "Number of threads for embedding processing",
                  })}

                  {renderFormField(
                    "Threads Batch",
                    "--threads-batch",
                    "EmbedThreadsBatchVal",
                    {
                      type: "text",
                      value: llamaEmbedSettings.EmbedThreadsBatchVal,
                      onChange: (value) =>
                        handleChange("EmbedThreadsBatchVal", value),
                      min: "1",
                      helperText: "Number of threads for batch processing",
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

                  {renderFormField(
                    "GPU Layers",
                    "--gpu-layers",
                    "EmbedGpuLayersVal",
                    {
                      type: "text",
                      value: llamaEmbedSettings.EmbedGpuLayersVal,
                      onChange: (value) =>
                        handleChange("EmbedGpuLayersVal", value),
                      min: "0",
                      helperText: "Number of layers to offload to GPU",
                    },
                  )}

                  {renderFormField(
                    "Main GPU",
                    "--main-gpu",
                    "EmbedMainGpuVal",
                    {
                      type: "text",
                      value: llamaEmbedSettings.EmbedMainGpuVal,
                      onChange: (value) =>
                        handleChange("EmbedMainGpuVal", value),
                      min: "0",
                      helperText: "Main GPU device ID for embeddings",
                    },
                  )}

                  {renderCheckboxField(
                    "Verbose",
                    "--verbose",
                    "EmbedVerboseVal",
                    llamaEmbedSettings.EmbedVerboseVal,
                    "Enable verbose output for embedding processing",
                  )}

                  {renderCheckboxField(
                    "Log Disable",
                    "--log-disable",
                    "EmbedLogDisableVal",
                    llamaEmbedSettings.EmbedLogDisableVal,
                    "Disable logging for embedding processing",
                  )}

                  {renderCheckboxField(
                    "Embedding Only",
                    "--embedding",
                    "EmbeddingOnlyVal",
                    llamaEmbedSettings.EmbeddingOnlyVal,
                    "Only compute embeddings, skip text generation",
                  )}
                </Card.Body>
              </Card>

              {/* Pooling Configuration */}
              <Card className="theme-nested-card theme-spacing-md">
                <Card.Body className="p-3">
                  <h6 className="theme-section-title">
                    <i className="bi bi-collection me-1"></i>
                    Pooling Configuration
                  </h6>

                  {renderCheckboxField(
                    "Pooling None",
                    "--pooling-none",
                    "EmbedPoolingNoneVal",
                    llamaEmbedSettings.EmbedPoolingNoneVal,
                    "Disable pooling for embeddings",
                  )}

                  {renderCheckboxField(
                    "Pooling Mean",
                    "--pooling-mean",
                    "EmbedPoolingMeanVal",
                    llamaEmbedSettings.EmbedPoolingMeanVal,
                    "Use mean pooling for embeddings",
                  )}

                  {renderCheckboxField(
                    "Pooling CLS",
                    "--pooling-cls",
                    "EmbedPoolingClsVal",
                    llamaEmbedSettings.EmbedPoolingClsVal,
                    "Use CLS token pooling for embeddings",
                  )}

                  {renderCheckboxField(
                    "Pooling Last",
                    "--pooling-last",
                    "EmbedPoolingLastVal",
                    llamaEmbedSettings.EmbedPoolingLastVal,
                    "Use last token pooling for embeddings",
                  )}
                </Card.Body>
              </Card>

              {/* Normalization Options */}
              <Card className="theme-nested-card theme-spacing-md">
                <Card.Body className="p-3">
                  <h6 className="theme-section-title">
                    <i className="bi bi-arrows-expand me-1"></i>
                    Normalization Options
                  </h6>

                  {renderCheckboxField(
                    "Normalize",
                    "--normalize",
                    "EmbedNormalizeVal",
                    llamaEmbedSettings.EmbedNormalizeVal,
                    "Normalize embedding vectors",
                  )}

                  {renderCheckboxField(
                    "Normalize Gradient",
                    "--normalize-gradient",
                    "EmbedNormalizeGradientVal",
                    llamaEmbedSettings.EmbedNormalizeGradientVal,
                    "Normalize gradients during training",
                  )}
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

export default LlamaEmbedSettingsForm;
