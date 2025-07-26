import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

import { LogError } from "../wailsjs/runtime/runtime.js";
import "../public/main.css";

import { useSettingsState } from "./StoreConfig.jsx";

export const LlamaCliSettingsForm = () => {
    const {
        settings,
        settingsLoading,
        settingsError,
        models,
        modelsLoading,
        savedCliSettings,
        savedSettingsLoading,
        formState,
        loadDefaultSettings,
        loadModels,
        loadSavedCliSettings,
        saveCliSettings,
        updateCliField,
        updateCliFields,
        loadSavedCliSetting,
        validateCliSettings,
        updateCliFormState,
    } = useSettingsState();

    // Local initialization state to avoid cross-component interference
    const [localInitialized, setLocalInitialized] = useState(false);
    const [errors, setErrors] = useState({});
    const [saveState, setSaveState] = useState('idle'); // 'idle', 'saving', 'success', 'error'
    const [saveMessage, setSaveMessage] = useState('');
    const initializationRef = useRef(false);
    const saveTimeoutRef = useRef(null);

    // Derived state - memoized to prevent unnecessary re-renders
    const llamaCliSettings = useMemo(() => settings.llamaCli || {}, [settings.llamaCli]);
    const appSettings = useMemo(() => settings?.app || {}, [settings?.app]);
    const savedSettings = useMemo(() => savedCliSettings || [], [savedCliSettings]);
    const selectedModel = useMemo(() => formState.cli?.selectedModel || "", [formState.cli?.selectedModel]);
    const selectedSavedSetting = useMemo(() => formState.cli?.selectedSavedSetting || "", [formState.cli?.selectedSavedSetting]);

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
                if (savedCliSettings.length === 0) {
                    await loadSavedCliSettings();
                }

                // Load default settings if no saved settings exist and no current settings
                if (savedCliSettings.length === 0 && Object.keys(llamaCliSettings).length === 0) {
                    await loadDefaultSettings();
                }

                // Load models if needed
                if (models.length === 0) {
                    await loadModels();
                }

                setLocalInitialized(true);
            } catch (error) {
                LogError(`Failed to initialize CLI data: ${error}`);
                initializationRef.current = false;
            }
        };

        initializeData();
    }, []); // Empty dependency array - run only once

    // Model initialization effect - separate from main initialization
    useEffect(() => {
        if (!localInitialized || models.length === 0 || Object.keys(llamaCliSettings).length === 0) return;

        const initializeModels = async () => {
            try {
                // Set the initially selected model if available
                let selectedId;
                if (llamaCliSettings.ModelFullPathVal?.length) {
                    selectedId = llamaCliSettings.ModelFullPathVal;
                } else if (appSettings?.ModelFullPathVal?.length) {
                    selectedId = appSettings?.ModelFullPathVal;
                    updateCliField("ModelFullPathVal", selectedId);
                } else if (appSettings?.ModelPath && appSettings?.ModelFileName) {
                    selectedId = `${appSettings.ModelPath}${appSettings.ModelFileName}`;
                }

                if (selectedId) {
                    const selectedModel = models.find((item) => item.id === selectedId);
                    if (selectedModel) {
                        const logFileName = `${appSettings?.AppLogPath || ""}${selectedModel.ModelName}.log`;
                        updateCliFields({
                            ModelLogFileNameVal: logFileName,
                            ModelFullPathVal: selectedId,
                        });
                        updateCliFormState({ selectedModel: selectedModel.FullPath });
                    }
                }

            } catch (error) {
                LogError(`Failed to initialize CLI models: ${error}`);
            }
        };

        initializeModels();
    }, [localInitialized, models.length, Object.keys(llamaCliSettings).length]);

    // Add this helper function at the top of your component
    const convertToString = (value) => {
        if (value === null || value === undefined) return "";
        return String(value);
    };
    // Stable callback functions
    const handleChange = useCallback(
        (field, value) => {
            // Convert numeric values to strings for Go backend compatibility
            const stringValue = convertToString(value);
            updateCliField(field, stringValue);

            const tempSettings = { ...llamaCliSettings, [field]: stringValue };
            const validation = validateCliSettings(tempSettings);
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
        [llamaCliSettings, updateCliField, validateCliSettings, saveState]
    );

     const handlePromptCacheChange = useCallback(
        (field, value) => {
            if (!value.length) {
                updateCliField(field, value);
                return;
            }

            const basePath = appSettings?.PromptCachePath || "";
            const fullPath = value.startsWith(basePath) ? value : basePath + value;
            updateCliField(field, fullPath);

            // Reset save state when user makes changes
            if (saveState !== 'idle') {
                setSaveState('idle');
                setSaveMessage('');
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
            }
        },
        [updateCliField, appSettings?.PromptCachePath, saveState]
    );

    const handleModelLogChange = useCallback(
        (field, value) => {
            if (!value.length) {
                updateCliField(field, value);
                return;
            }

            const basePath = appSettings?.ModelLogPath || "";
            const fullPath = value.startsWith(basePath) ? value : basePath + value;
            updateCliField(field, fullPath);

            // Reset save state when user makes changes
            if (saveState !== 'idle') {
                setSaveState('idle');
                setSaveMessage('');
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
            }
        },
        [updateCliField, appSettings?.ModelLogPath, saveState]
    );

    const handleModelChange = useCallback(
        (event) => {
            const selectedId = event.target.value;
            const selectedModelData = models.find((model) => model.FullPath === selectedId);

            if (selectedModelData) {
                const logFileName = `${appSettings?.ModelLogPath || ""}${selectedModelData.ModelName}.log`;

                updateCliFields({
                    ModelLogFileNameVal: logFileName,
                    ModelFullPathVal: selectedId,
                });

                updateCliFormState({ selectedModel: selectedModelData.FullPath });
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
        [models, appSettings?.ModelLogPath, updateCliFields, updateCliFormState, saveState]
    );

    const handleLoadSavedSetting = useCallback(
        async (event) => {
            const selectedIndex = event.target.value;
            updateCliFormState({ selectedSavedSetting: selectedIndex });

            if (!selectedIndex || selectedIndex === "") return;

            try {
                const loadedSettings = await loadSavedCliSetting(selectedIndex);

                if (loadedSettings && loadedSettings.ModelFullPathVal) {
                    updateCliFormState({ selectedModel: loadedSettings.ModelFullPathVal });
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
                LogError("Failed to load saved setting: " + error);
            }
        },
        [updateCliFormState, loadSavedCliSetting, saveState]
    );



    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();

            const validation = validateCliSettings();
            setErrors(validation.errors);

            if (!validation.isValid) {
                LogError("Please fix validation errors before saving.");
                setSaveState('error');
                setSaveMessage('Please fix validation errors before saving.');
                return;
            }

            try {
                setSaveState('saving');
                setSaveMessage('Saving CLI settings...');

                await saveCliSettings(llamaCliSettings.Description, llamaCliSettings);

                setSaveState('success');
                setSaveMessage('CLI settings saved successfully!');

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
                setSaveMessage('Failed to save CLI settings: ' + error);
                LogError("Failed to save settings: " + error);
            }
        },
        [llamaCliSettings, validateCliSettings, saveCliSettings]
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
                                    Llama CLI Settings
                                </h5>
                                <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                                    Configure LlamaCpp CLI parameters for AI inference and generation
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
                                        onChange={(e) => handleChange("Description", e.target.value)}
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
                                        "Prompt Cache Path",
                                        "--prompt-cache",
                                        "PromptCacheVal",
                                        {
                                            type: "text",
                                            value: llamaCliSettings.PromptCacheVal,
                                            onChange: (value) =>
                                                handlePromptCacheChange("PromptCacheVal", value),
                                            helperText: "Path to prompt cache file for faster processing",
                                        }
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
                                            helperText: "Output logging file path",
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

                                    {renderFormField("Threads", "--threads (-t)", "ThreadsVal", {
                                        type: "number",
                                        value: llamaCliSettings.ThreadsVal,
                                        onChange: (value) => handleChange("ThreadsVal", value),
                                        min: "1",
                                        helperText: "Number of threads for generation (default: -1)",
                                    })}

                                    {renderFormField(
                                        "Threads Batch",
                                        "--threads-batch (-tb)",
                                        "ThreadsBatchVal",
                                        {
                                            type: "number",
                                            value: llamaCliSettings.ThreadsBatchVal,
                                            onChange: (value) => handleChange("ThreadsBatchVal", value),
                                            min: "1",
                                            helperText:
                                                "Threads for batch processing (default: same as --threads)",
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
                                        "CtxSizeVal",
                                        {
                                            type: "number",
                                            value: llamaCliSettings.CtxSizeVal,
                                            onChange: (value) => handleChange("CtxSizeVal", value),
                                            min: "1",
                                            helperText:
                                                "Size of the prompt context (default: 4096, 0 = loaded from model)",
                                        }
                                    )}

                                    {renderFormField("Predict Tokens", "--predict (-n)", "PredictVal", {
                                        type: "number",
                                        value: llamaCliSettings.PredictVal,
                                        onChange: (value) => handleChange("PredictVal", value),
                                        helperText:
                                            "Number of tokens to predict (default: -1, -1 = infinity, -2 = until context filled)",
                                    })}

                                    {renderFormField(
                                        "Batch Size",
                                        "--batch-size (-b)",
                                        "BatchCmdVal",
                                        {
                                            type: "number",
                                            value: llamaCliSettings.BatchCmdVal,
                                            onChange: (value) => handleChange("BatchCmdVal", value),
                                            min: "1",
                                            helperText: "Logical maximum batch size (default: 2048)",
                                        }
                                    )}

                                    {renderFormField(
                                        "UBatch Size",
                                        "--ubatch-size (-ub)",
                                        "UBatchCmdVal",
                                        {
                                            type: "number",
                                            value: llamaCliSettings.UBatchCmdVal,
                                            onChange: (value) => handleChange("UBatchCmdVal", value),
                                            min: "1",
                                            helperText: "Physical maximum batch size (default: 512)",
                                        }
                                    )}

                                    {renderFormField("Keep Tokens", "--keep", "KeepVal", {
                                        type: "number",
                                        value: llamaCliSettings.KeepVal,
                                        onChange: (value) => handleChange("KeepVal", value),
                                        min: "0",
                                        helperText:
                                            "Number of tokens to keep from the initial prompt (default: 0, -1 = all)",
                                    })}
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
                                        "GPULayersVal",
                                        {
                                            type: "number",
                                            value: llamaCliSettings.GPULayersVal,
                                            onChange: (value) => handleChange("GPULayersVal", value),
                                            min: "0",
                                            helperText: "Number of layers to store in VRAM",
                                        }
                                    )}

                                    {renderFormField(
                                        "Split Mode",
                                        "--split-mode (-sm)",
                                        "SplitModeCmdVal",
                                        {
                                            value: llamaCliSettings.SplitModeCmdVal,
                                            onChange: (value) => handleChange("SplitModeCmdVal", value),
                                            options: [
                                                { value: "", label: "Default" },
                                                { value: "none", label: "None" },
                                                { value: "layer", label: "Layer" },
                                                { value: "row", label: "Row" },
                                            ],
                                            helperText: "How to split the model across multiple GPUs",
                                        }
                                    )}

                                    {renderFormField("Main GPU", "--main-gpu (-mg)", "MainGPUVal", {
                                        type: "number",
                                        value: llamaCliSettings.MainGPUVal,
                                        onChange: (value) => handleChange("MainGPUVal", value),
                                        min: "0",
                                        helperText: "The GPU to use for the model (default: 0)",
                                    })}
                                </Card.Body>
                            </Card>

                            {/* Sampling Parameters */}
                            <Card className="theme-nested-card theme-spacing-md">
                                <Card.Body className="p-3">
                                    <h6 className="theme-section-title">
                                        <i className="bi bi-sliders me-1"></i>
                                        Sampling Parameters
                                    </h6>

                                    {renderFormField("Random Seed", "--seed (-s)", "RandomSeedVal", {
                                        type: "number",
                                        value: llamaCliSettings.RandomSeedVal,
                                        onChange: (value) => handleChange("RandomSeedVal", value),
                                        helperText: "RNG seed (default: -1, use random seed for -1)",
                                    })}

                                    {renderFormField("Temperature", "--temp", "TemperatureVal", {
                                        type: "number",
                                        value: llamaCliSettings.TemperatureVal,
                                        onChange: (value) => handleChange("TemperatureVal", value),
                                        min: "0",
                                        max: "2",
                                        step: "0.1",
                                        helperText: "Temperature (default: 0.8)",
                                    })}

                                    {renderFormField("Top-K", "--top-k", "TopKVal", {
                                        type: "number",
                                        value: llamaCliSettings.TopKVal,
                                        onChange: (value) => handleChange("TopKVal", value),
                                        min: "0",
                                        helperText: "Top-k sampling (default: 40, 0 = disabled)",
                                    })}

                                    {renderFormField("Top-P", "--top-p", "TopPVal", {
                                        type: "number",
                                        value: llamaCliSettings.TopPVal,
                                        onChange: (value) => handleChange("TopPVal", value),
                                        min: "0",
                                        max: "1",
                                        step: "0.01",
                                        helperText: "Top-p sampling (default: 0.9, 1.0 = disabled)",
                                    })}

                                    {renderFormField("Min-P", "--min-p", "MinPVal", {
                                        type: "number",
                                        value: llamaCliSettings.MinPVal,
                                        onChange: (value) => handleChange("MinPVal", value),
                                        min: "0",
                                        max: "1",
                                        step: "0.01",
                                        helperText: "Min-p sampling (default: 0.1, 0.0 = disabled)",
                                    })}

                                    {renderFormField(
                                        "Repeat Last N",
                                        "--repeat-last-n",
                                        "RepeatLastPenaltyVal",
                                        {
                                            type: "number",
                                            value: llamaCliSettings.RepeatLastPenaltyVal,
                                            onChange: (value) => handleChange("RepeatLastPenaltyVal", value),
                                            min: "0",
                                            helperText:
                                                "Last n tokens to consider for penalize (default: 64, 0 = disabled, -1 = ctx_size)",
                                        }
                                    )}

                                    {renderFormField(
                                        "Repeat Penalty",
                                        "--repeat-penalty",
                                        "RepeatPenaltyVal",
                                        {
                                            type: "number",
                                            value: llamaCliSettings.RepeatPenaltyVal,
                                            onChange: (value) => handleChange("RepeatPenaltyVal", value),
                                            min: "0",
                                            step: "0.01",
                                            helperText:
                                                "Penalize repeat sequence of tokens (default: 1.0, 1.0 = disabled)",
                                        }
                                    )}

                                    {renderFormField(
                                        "Mirostat Learning Rate",
                                        "--mirostat-lr",
                                        "MirostatLrVal",
                                        {
                                            type: "number",
                                            value: llamaCliSettings.MirostatLrVal,
                                            onChange: (value) => handleChange("MirostatLrVal", value),
                                            min: "0",
                                            step: "0.01",
                                            helperText:
                                                "Mirostat learning rate, parameter eta (default: 0.1)",
                                        }
                                    )}

                                    {renderFormField(
                                        "Mirostat Entropy",
                                        "--mirostat-ent",
                                        "MirostatEntVal",
                                        {
                                            type: "number",
                                            value: llamaCliSettings.MirostatEntVal,
                                            onChange: (value) => handleChange("MirostatEntVal", value),
                                            min: "0",
                                            step: "0.1",
                                            helperText:
                                                "Mirostat target entropy, parameter tau (default: 5.0)",
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
                                        "MemLockCmdEnabled",
                                        llamaCliSettings.MemLockCmdEnabled,
                                        "Force system to keep model in RAM rather than swapping or compressing"
                                    )}

                                    {renderCheckboxField(
                                        "No Memory Map",
                                        "--no-mmap",
                                        "NoMmapCmdEnabled",
                                        llamaCliSettings.NoMmapCmdEnabled,
                                        "Do not memory-map model (slower load but may reduce pageouts if not using mlock)"
                                    )}

                                    {renderCheckboxField(
                                        "Flash Attention",
                                        "--flash-attn (-fa)",
                                        "FlashAttentionCmdEnabled",
                                        llamaCliSettings.FlashAttentionCmdEnabled,
                                        "Enable Flash Attention (default: disabled)"
                                    )}

                                    {renderCheckboxField(
                                        "Log Disable",
                                        "--log-disable",
                                        "LogDisableCmdEnabled",
                                        llamaCliSettings.LogDisableCmdEnabled,
                                        "Log disable"
                                    )}

                                    {renderCheckboxField(
                                        "Verbose Prompt",
                                        "--verbose-prompt",
                                        "VerbosePromptCmdEnabled",
                                        llamaCliSettings.VerbosePromptCmdEnabled,
                                        "Print a verbose prompt before generation (default: false)"
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