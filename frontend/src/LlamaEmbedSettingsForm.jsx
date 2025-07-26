import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";

import { LogError } from "../wailsjs/runtime/runtime.js";
import "../public/main.css";

import { useSettingsState } from "./StoreConfig.jsx";

export const LlamaEmbedSettingsForm = () => {
    const {
        settings,
        settingsLoading,
        settingsError,
        models,
        modelsLoading,
        savedEmbedSettings,
        savedSettingsLoading,
        formState,
        loadDefaultSettings,
        loadModels,
        loadSavedEmbedSettings,
        saveEmbedSettings,
        updateEmbedField,
        updateEmbedFields,
        loadSavedEmbedSetting,
        validateEmbedSettings,
        updateEmbedFormState,
    } = useSettingsState();

    // Local initialization state to avoid cross-component interference
    const [localInitialized, setLocalInitialized] = useState(false);
    const [errors, setErrors] = useState({});
    const [saveState, setSaveState] = useState('idle'); // 'idle', 'saving', 'success', 'error'
    const [saveMessage, setSaveMessage] = useState('');
    const initializationRef = useRef(false);
    const saveTimeoutRef = useRef(null);

    // Derived state - memoized to prevent unnecessary re-renders
    const llamaEmbedSettings = useMemo(() => settings.llamaEmbed || {}, [settings.llamaEmbed]);
    const appSettings = useMemo(() => settings?.app || {}, [settings?.app]);
    const savedSettings = useMemo(() => savedEmbedSettings || [], [savedEmbedSettings]);
    const selectedModel = useMemo(() => formState.embed?.selectedModel || "", [formState.embed?.selectedModel]);
    const selectedSavedSetting = useMemo(() => formState.embed?.selectedSavedSetting || "", [formState.embed?.selectedSavedSetting]);

    // Combined loading state
    const isLoading = useMemo(() =>
            settingsLoading || modelsLoading || savedSettingsLoading || saveState === 'saving',
        [settingsLoading, modelsLoading, savedSettingsLoading, saveState]
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Single initialization effect
    useEffect(() => {
        if (initializationRef.current || localInitialized) return;

        const initializeData = async () => {
            initializationRef.current = true;

            try {
                // Load saved settings first if needed
                if (savedEmbedSettings.length === 0) {
                    await loadSavedEmbedSettings();
                }

                // Load default settings if no saved settings exist and no current settings
                if (savedEmbedSettings.length === 0 && Object.keys(llamaEmbedSettings).length === 0) {
                    await loadDefaultSettings();
                }

                // Load models if needed
                if (models.length === 0) {
                    await loadModels();
                }

                setLocalInitialized(true);
            } catch (error) {
                LogError(`Failed to initialize embed data: ${error}`);
                initializationRef.current = false;
            }
        };

        initializeData();
    }, []); // Empty dependency array - run only once

    // Model initialization effect - separate from main initialization
    useEffect(() => {
        if (!localInitialized || models.length === 0 || Object.keys(llamaEmbedSettings).length === 0) return;

        const initializeModels = async () => {
            try {
                // Set the initially selected model if available
                let selectedId;
                if (llamaEmbedSettings.EmbedModelFullPathVal?.length) {
                    selectedId = llamaEmbedSettings.EmbedModelFullPathVal;
                } else if (appSettings?.EmbedModelFullPathVal?.length) {
                    selectedId = appSettings?.EmbedModelFullPathVal;
                    updateEmbedField("EmbedModelFullPathVal", selectedId);
                } else if (appSettings?.ModelPath && appSettings?.EmbedModelFileName) {
                    selectedId = `${appSettings.ModelPath}${appSettings.EmbedModelFileName}`;
                }

                if (selectedId) {
                    const selectedModel = models.find((item) => item.id === selectedId);
                    if (selectedModel) {
                        const logFileName = `${appSettings?.AppLogPath || ""}${selectedModel.ModelName}.log`;
                        updateEmbedFields({
                            EmbedModelLogFileNameVal: logFileName,
                            EmbedModelFullPathVal: selectedId,
                        });
                        updateEmbedFormState({ selectedModel: selectedModel.FullPath });
                    }
                }

            } catch (error) {
                LogError(`Failed to initialize embed models: ${error}`);
            }
        };

        initializeModels();
    }, [localInitialized, models.length, Object.keys(llamaEmbedSettings).length]);

    // Stable callback functions
    const handleChange = useCallback(
        (field, value) => {
            updateEmbedField(field, value);

            const tempSettings = { ...llamaEmbedSettings, [field]: value };
            const validation = validateEmbedSettings(tempSettings);
            setErrors(validation.errors);

            // Reset save state when user makes changes
            if (saveState !== 'idle') {
                setSaveState('idle');
                setSaveMessage('');
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
            }
        },
        [llamaEmbedSettings, updateEmbedField, validateEmbedSettings, saveState]
    );

    const handlePromptFileChange = useCallback(
        (field, value) => {
            if (!value.length) {
                updateEmbedField(field, value);
                return;
            }

            const basePath = appSettings?.PromptCachePath || "";
            const fullPath = value.startsWith(basePath) ? value : basePath + value;
            updateEmbedField(field, fullPath);

            // Reset save state when user makes changes
            if (saveState !== 'idle') {
                setSaveState('idle');
                setSaveMessage('');
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
            }
        },
        [updateEmbedField, appSettings?.PromptCachePath, saveState]
    );

    const handleModelLogChange = useCallback(
        (field, value) => {
            if (!value.length) {
                updateEmbedField(field, value);
                return;
            }

            const basePath = appSettings?.ModelLogPath || "";
            const fullPath = value.startsWith(basePath) ? value : basePath + value;
            updateEmbedField(field, fullPath);

            // Reset save state when user makes changes
            if (saveState !== 'idle') {
                setSaveState('idle');
                setSaveMessage('');
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
            }
        },
        [updateEmbedField, appSettings?.ModelLogPath, saveState]
    );

    const handleModelChange = useCallback(
        (event) => {
            const selectedId = event.target.value;
            const selectedModelData = models.find((model) => model.FullPath === selectedId);

            if (selectedModelData) {
                const logFileName = `${appSettings?.ModelLogPath || ""}${selectedModelData.ModelName}.log`;

                updateEmbedFields({
                    EmbedModelLogFileNameVal: logFileName,
                    EmbedModelFullPathVal: selectedId,
                });

                updateEmbedFormState({ selectedModel: selectedModelData.FullPath });
            }

            // Reset save state when user makes changes
            if (saveState !== 'idle') {
                setSaveState('idle');
                setSaveMessage('');
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
            }
        },
        [models, appSettings?.ModelLogPath, updateEmbedFields, updateEmbedFormState, saveState]
    );

    const handleLoadSavedSetting = useCallback(
        async (event) => {
            const selectedIndex = event.target.value;
            updateEmbedFormState({ selectedSavedSetting: selectedIndex });

            if (!selectedIndex || selectedIndex === "") return;

            try {
                const loadedSettings = await loadSavedEmbedSetting(selectedIndex);

                if (loadedSettings && loadedSettings.EmbedModelFullPathVal) {
                    updateEmbedFormState({
                        selectedModel: loadedSettings.EmbedModelFullPathVal,
                    });
                }

                // Reset save state when user loads settings
                if (saveState !== 'idle') {
                    setSaveState('idle');
                    setSaveMessage('');
                    if (saveTimeoutRef.current) {
                        clearTimeout(saveTimeoutRef.current);
                    }
                }
            } catch (error) {
                LogError("Failed to load saved embed setting: " + error);
            }
        },
        [updateEmbedFormState, loadSavedEmbedSetting, saveState]
    );

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();

            const validation = validateEmbedSettings();
            setErrors(validation.errors);

            if (!validation.isValid) {
                LogError("Please fix validation errors before saving.");
                setSaveState('error');
                setSaveMessage('Please fix validation errors before saving.');
                return;
            }

            try {
                setSaveState('saving');
                setSaveMessage('Saving embed settings...');

                await saveEmbedSettings(llamaEmbedSettings.Description, llamaEmbedSettings);

                setSaveState('success');
                setSaveMessage('Embed settings saved successfully!');

                // Auto-hide success message after 3 seconds
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
                saveTimeoutRef.current = setTimeout(() => {
                    setSaveState('idle');
                    setSaveMessage('');
                }, 3000);

            } catch (error) {
                setSaveState('error');
                setSaveMessage('Failed to save embed settings: ' + error);
                LogError("Failed to save embed settings: " + error);
            }
        },
        [llamaEmbedSettings, validateEmbedSettings, saveEmbedSettings]
    );

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

    // Render helpers - now stable with useCallback
    const renderFormField = useCallback(
        (label, cmdValue, fieldId, inputProps = {}) => {
            const { helperText, value, onChange, type, options, ...cleanInputProps } = inputProps;

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
                            {options ? (
                                <Form.Select
                                    id={fieldId}
                                    value={value ?? ""}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="theme-form-control"
                                    size="sm"
                                    isInvalid={!!errors[fieldId]}
                                    {...cleanInputProps}
                                >
                                    {options.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Form.Select>
                            ) : (
                                <Form.Control
                                    id={fieldId}
                                    type={type}
                                    value={value ?? ""}
                                    onChange={(e) => {
                                        // Fix: Handle the event properly
                                        if (type === "number") {
                                            // Convert to string for Go backend compatibility
                                            const stringValue = e.target.value === '' ? '' : String(e.target.value);
                                            onChange(stringValue);
                                        } else {
                                            onChange(e.target.value);
                                        }
                                    }}
                                    className="theme-form-control"
                                    size="sm"
                                    isInvalid={!!errors[fieldId]}
                                    {...cleanInputProps}
                                />
                            )}
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
        },
        [errors]
    );

    const renderCheckboxField = useCallback(
        (label, cmdValue, fieldId, isChecked, helperText) => (
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
        ),
        [handleChange]
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
                                    Llama Embed Settings
                                </h5>
                                <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                                    Configure LlamaCpp embedding parameters for document processing and search
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
                            {saveState === 'saving' ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Saving...
                                </>
                            ) : saveState === 'success' ? (
                                <>
                                    <i className="bi bi-check-circle me-1" style={{ color: '#28a745' }}></i>
                                    Saved!
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

            {/* Save Status Display */}
            {saveState !== 'idle' && (
                <Alert
                    className={`theme-spacing-sm ${
                        saveState === 'success' ? 'theme-alert-success' :
                            saveState === 'error' ? 'theme-alert-danger' : 'theme-alert-info'
                    }`}
                    style={{ flexShrink: 0 }}
                >
                    <div className="d-flex align-items-center">
                        {saveState === 'saving' && (
                            <Spinner animation="border" size="sm" className="me-2" />
                        )}
                        {saveState === 'success' && (
                            <i className="bi bi-check-circle-fill me-2" style={{ color: '#28a745' }}></i>
                        )}
                        {saveState === 'error' && (
                            <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: '#dc3545' }}></i>
                        )}
                        <span>{saveMessage}</span>
                    </div>
                </Alert>
            )}

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
                                        onChange={(e) => handleChange("Description", e.target.value)}
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
                                        Load Saved Embed Settings
                                    </Form.Label>
                                    <Form.Select
                                        value={selectedSavedSetting}
                                        onChange={handleLoadSavedSetting}
                                        disabled={savedSettingsLoading}
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
                                    {savedSettingsLoading && (
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

                            {/* Essential Settings */}
                            <Card className="theme-nested-card theme-spacing-md">
                                <Card.Body className="p-3">
                                    <h6 className="theme-section-title">
                                        <i className="bi bi-file-text me-1"></i>
                                        Essential Settings
                                    </h6>

                                    {renderFormField(
                                        "Prompt File Path",
                                        "--file (-f)",
                                        "EmbedPromptFileVal",
                                        {
                                            type: "text",
                                            value: llamaEmbedSettings.EmbedPromptFileVal,
                                            onChange: (value) =>
                                                handlePromptFileChange("EmbedPromptFileVal", value),
                                            helperText: "Path to prompt file for embedding processing",
                                        }
                                    )}

                                    {renderFormField(
                                        "Log File",
                                        "--log-file",
                                        "EmbedModelLogFileNameVal",
                                        {
                                            type: "text",
                                            value: llamaEmbedSettings.EmbedModelLogFileNameVal,
                                            onChange: (value) =>
                                                handleModelLogChange("EmbedModelLogFileNameVal", value),
                                            helperText: "Output logging file path for embeddings",
                                        }
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Performance & Threading */}
                            <Card className="theme-nested-card theme-spacing-md">
                                <Card.Body className="p-3">
                                    <h6 className="theme-section-title">
                                        <i className="bi bi-speedometer2 me-1"></i>
                                        Performance & Threading
                                    </h6>

                                    {renderFormField(
                                        "Threads",
                                        "--threads (-t)",
                                        "EmbedThreadsVal",
                                        {
                                            type: "number",
                                            value: llamaEmbedSettings.EmbedThreadsVal,
                                            onChange: (value) => handleChange("EmbedThreadsVal", value),
                                            min: "1",
                                            helperText: "Number of threads for embedding generation (default: -1)",
                                        }
                                    )}

                                    {renderFormField(
                                        "Threads Batch",
                                        "--threads-batch (-tb)",
                                        "EmbedThreadsBatchVal",
                                        {
                                            type: "number",
                                            value: llamaEmbedSettings.EmbedThreadsBatchVal,
                                            onChange: (value) => handleChange("EmbedThreadsBatchVal", value),
                                            min: "1",
                                            helperText: "Threads for batch processing (default: same as --threads)",
                                        }
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Context & Batch Settings */}
                            <Card className="theme-nested-card theme-spacing-md">
                                <Card.Body className="p-3">
                                    <h6 className="theme-section-title">
                                        <i className="bi bi-layers me-1"></i>
                                        Context & Batch Settings
                                    </h6>

                                    {renderFormField(
                                        "Context Size",
                                        "--ctx-size (-c)",
                                        "EmbedCtxtSizeVal",
                                        {
                                            type: "number",
                                            value: llamaEmbedSettings.EmbedCtxtSizeVal,
                                            onChange: (value) => handleChange("EmbedCtxtSizeVal", value),
                                            min: "1",
                                            helperText: "Size of the prompt context for embeddings (default: 4096, 0 = loaded from model)",
                                        }
                                    )}

                                    {renderFormField(
                                        "Batch Size",
                                        "--batch-size (-b)",
                                        "EmbedBatchVal",
                                        {
                                            type: "number",
                                            value: llamaEmbedSettings.EmbedBatchVal,
                                            onChange: (value) => handleChange("EmbedBatchVal", value),
                                            min: "1",
                                            helperText: "Logical maximum batch size for embeddings (default: 2048)",
                                        }
                                    )}

                                    {renderFormField(
                                        "Keep Tokens",
                                        "--keep",
                                        "EmbedKeepVal",
                                        {
                                            type: "number",
                                            value: llamaEmbedSettings.EmbedKeepVal,
                                            onChange: (value) => handleChange("EmbedKeepVal", value),
                                            min: "-1",
                                            helperText: "Number of tokens to keep from initial prompt (default: 0, -1 = all)",
                                        }
                                    )}
                                </Card.Body>
                            </Card>

                            {/* GPU Settings */}
                            <Card className="theme-nested-card theme-spacing-md">
                                <Card.Body className="p-3">
                                    <h6 className="theme-section-title">
                                        <i className="bi bi-gpu-card me-1"></i>
                                        GPU Settings
                                    </h6>

                                    {renderFormField(
                                        "GPU Layers",
                                        "--gpu-layers (-ngl)",
                                        "EmbedGPULayersVal",
                                        {
                                            type: "number",
                                            value: llamaEmbedSettings.EmbedGPULayersVal,
                                            onChange: (value) => handleChange("EmbedGPULayersVal", value),
                                            min: "0",
                                            helperText: "Number of layers to store in VRAM for embeddings",
                                        }
                                    )}

                                    {renderFormField(
                                        "Split Mode",
                                        "--split-mode (-sm)",
                                        "EmbedSplitModeVal",
                                        {
                                            value: llamaEmbedSettings.EmbedSplitModeVal,
                                            onChange: (value) => handleChange("EmbedSplitModeVal", value),
                                            options: [
                                                { value: "", label: "Default" },
                                                { value: "none", label: "None" },
                                                { value: "layer", label: "Layer" },
                                                { value: "row", label: "Row" },
                                            ],
                                            helperText: "How to split the embedding model across multiple GPUs",
                                        }
                                    )}

                                    {renderFormField(
                                        "Main GPU",
                                        "--main-gpu (-mg)",
                                        "EmbedMainGPUVal",
                                        {
                                            type: "number",
                                            value: llamaEmbedSettings.EmbedMainGPUVal,
                                            onChange: (value) => handleChange("EmbedMainGPUVal", value),
                                            min: "0",
                                            helperText: "The GPU to use for the embedding model (default: 0)",
                                        }
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Sampling Parameters */}
                            <Card className="theme-nested-card theme-spacing-md">
                                <Card.Body className="p-3">
                                    <h6 className="theme-section-title">
                                        <i className="bi bi-sliders me-1"></i>
                                        Sampling Parameters
                                    </h6>

                                    {renderFormField(
                                        "Temperature",
                                        "--temp",
                                        "EmbedTemperatureVal",
                                        {
                                            type: "number",
                                            value: llamaEmbedSettings.EmbedTemperatureVal,
                                            onChange: (value) => handleChange("EmbedTemperatureVal", value),
                                            min: "0",
                                            step: "0.1",
                                            helperText: "Temperature for embeddings sampling (default: 0.8)",
                                        }
                                    )}

                                    {renderFormField(
                                        "Top-K",
                                        "--top-k",
                                        "EmbedTopKVal",
                                        {
                                            type: "number",
                                            value: llamaEmbedSettings.EmbedTopKVal,
                                            onChange: (value) => handleChange("EmbedTopKVal", value),
                                            min: "0",
                                            helperText: "Top-k sampling for embeddings (default: 40, 0 = disabled)",
                                        }
                                    )}

                                    {renderFormField(
                                        "Top-P",
                                        "--top-p",
                                        "EmbedTopPVal",
                                        {
                                            type: "number",
                                            value: llamaEmbedSettings.EmbedTopPVal,
                                            onChange: (value) => handleChange("EmbedTopPVal", value),
                                            min: "0",
                                            max: "1",
                                            step: "0.1",
                                            helperText: "Top-p sampling for embeddings (default: 0.9, 1.0 = disabled)",
                                        }
                                    )}

                                    {renderFormField(
                                        "Min-P",
                                        "--min-p",
                                        "EmbedMinPVal",
                                        {
                                            type: "number",
                                            value: llamaEmbedSettings.EmbedMinPVal,
                                            onChange: (value) => handleChange("EmbedMinPVal", value),
                                            min: "0",
                                            max: "1",
                                            step: "0.1",
                                            helperText: "Min-p sampling for embeddings (default: 0.1, 0.0 = disabled)",
                                        }
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Embedding-Specific Settings */}
                            <Card className="theme-nested-card theme-spacing-md">
                                <Card.Body className="p-3">
                                    <h6 className="theme-section-title">
                                        <i className="bi bi-diagram-3 me-1"></i>
                                        Embedding-Specific Settings
                                    </h6>

                                    {renderFormField(
                                        "Pooling Type",
                                        "--pooling",
                                        "EmbedPoolingVal",
                                        {
                                            value: llamaEmbedSettings.EmbedPoolingVal,
                                            onChange: (value) => handleChange("EmbedPoolingVal", value),
                                            options: [
                                                { value: "", label: "Model Default" },
                                                { value: "none", label: "None" },
                                                { value: "mean", label: "Mean" },
                                                { value: "cls", label: "CLS" },
                                                { value: "last", label: "Last" },
                                                { value: "rank", label: "Rank" },
                                            ],
                                            helperText: "Pooling type for embeddings, use model default if unspecified",
                                        }
                                    )}

                                    {renderFormField(
                                        "Normalize",
                                        "--embd-normalize",
                                        "EmbedNormalizeVal",
                                        {
                                            value: llamaEmbedSettings.EmbedNormalizeVal,
                                            onChange: (value) => handleChange("EmbedNormalizeVal", value),
                                            options: [
                                                { value: "", label: "Default" },
                                                { value: "-1", label: "None" },
                                                { value: "0", label: "Max Absolute Int16" },
                                                { value: "1", label: "Taxicab (L1)" },
                                                { value: "2", label: "Euclidean (L2)" },
                                            ],
                                            helperText: "Normalization for embeddings (default: 2 = euclidean)",
                                        }
                                    )}

                                    {renderFormField(
                                        "Output Format",
                                        "--embd-output-format",
                                        "EmbedOutputFormatVal",
                                        {
                                            value: llamaEmbedSettings.EmbedOutputFormatVal,
                                            onChange: (value) => handleChange("EmbedOutputFormatVal", value),
                                            options: [
                                                { value: "", label: "Default" },
                                                { value: "array", label: "Array Format [[],[],...]" },
                                                { value: "json", label: "OpenAI Style JSON" },
                                                { value: "json+", label: "JSON + Cosine Similarity Matrix" },
                                            ],
                                            helperText: "Output format for embeddings",
                                        }
                                    )}

                                    {renderFormField(
                                        "Separator",
                                        "--embd-separator",
                                        "EmbedSeparatorVal",
                                        {
                                            type: "text",
                                            value: llamaEmbedSettings.EmbedSeparatorVal,
                                            onChange: (value) => handleChange("EmbedSeparatorVal", value),
                                            helperText: "Separator of embeddings (default: \\n)",
                                        }
                                    )}
                                </Card.Body>
                            </Card>

                            {/* System Resource Parameters */}
                            <Card className="theme-nested-card theme-spacing-md">
                                <Card.Body className="p-3">
                                    <h6 className="theme-section-title">
                                        <i className="bi bi-hdd me-1"></i>
                                        System Resource Parameters
                                    </h6>

                                    {renderCheckboxField(
                                        "Memory Lock",
                                        "--mlock",
                                        "EmbedMemLockCmdEnabled",
                                        llamaEmbedSettings.EmbedMemLockCmdEnabled,
                                        "Force system to keep embedding model in RAM rather than swapping or compressing"
                                    )}

                                    {renderCheckboxField(
                                        "No Memory Map",
                                        "--no-mmap",
                                        "EmbedNoMmapCmdEnabled",
                                        llamaEmbedSettings.EmbedNoMmapCmdEnabled,
                                        "Do not memory-map embedding model (slower load but may reduce pageouts if not using mlock)"
                                    )}

                                    {renderCheckboxField(
                                        "Flash Attention",
                                        "--flash-attn (-fa)",
                                        "EmbedFlashAttentionCmdEnabled",
                                        llamaEmbedSettings.EmbedFlashAttentionCmdEnabled,
                                        "Enable Flash Attention for embeddings (default: disabled)"
                                    )}

                                    {renderCheckboxField(
                                        "Log Disable",
                                        "--log-disable",
                                        "EmbedLogDisableCmdEnabled",
                                        llamaEmbedSettings.EmbedLogDisableCmdEnabled,
                                        "Disable logging for embeddings"
                                    )}

                                    {renderCheckboxField(
                                        "Verbose Prompt",
                                        "--verbose-prompt",
                                        "EmbedVerbosePromptCmdEnabled",
                                        llamaEmbedSettings.EmbedVerbosePromptCmdEnabled,
                                        "Print a verbose prompt before embedding generation (default: false)"
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