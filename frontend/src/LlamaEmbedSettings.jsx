import React, {useEffect, useState} from 'react';


import {GetModelFiles} from "../wailsjs/go/main/App.js";
import {LogError, LogInfo} from "../wailsjs/runtime/runtime.js";

import {useLlamaEmbedSettingsDispatch} from "./LlamaEmbedSettingsContextHooks.jsx";



export const LlamaEmbedSettingsForm = ({embedState, appState = {}}) => {

    const embedSettingsDispatch = useLlamaEmbedSettingsDispatch(); // Dispatch updates
    const [models, setModels] = useState([]); // To store the list of models
    const [selectedModel, setSelectedModel] = useState(""); // To store the selec
    const [errors, setErrors] = useState({});


    useEffect(() => {
     let selectedId = "";
        (async () => {
            if (models.length === 0) {
                GetModelFiles().then((result) => {
                    result.forEach((item) => {
                        models.push({id: item.FullPath, ModelName: item.FileName, FullPath: item.FullPath});
                    });
                    setModels(models);
                    if (embedState.ModelFullPath.length) {
                        selectedId = embedState.ModelFullPath;
                    }else {
                        selectedId = appState.ModelFolderName.replace(/\//g, "\\") + appState.EmbedModelFileName;
                    }
                    const selected = models.find(item => item.id === selectedId)?.FullPath;
                    const modelName = models.find(item => item.id === selectedId)?.ModelName;
                    let value  = appState.AppLogPath + (modelName + ".log");
                    embedSettingsDispatch({
                        type: "SET_FIELD", field:"EmbedModelLogFileNameVal", value,
                    });
                    embedSettingsDispatch({
                        type: "SET_FIELD", field:"EmbedModelFullPath", selectedId,
                    });
                    setSelectedModel(selected);
                },).catch((error) => {LogError(error)});
            }
        })();

    }, []);

    // Handler to update a field
    const handleChange = (field, value) => {
        embedSettingsDispatch({
            type: "SET_FIELD", field, value,
        });
        validateField(field, value);
    };
    const handleEmbedModelLogChange = (field, value) => {
        if (value.length) {
            if (appState.ModelLogFolderNamePath.length > value.length) {
                value = appState.ModelLogFolderNamePath + value;
                embedSettingsDispatch({
                    type: "SET_FIELD", field, value,
                });
            }else{
                value = value.substring(appState.ModelLogFolderNamePath.length, value.length);
                value = appState.ModelLogFolderNamePath + value;
                embedSettingsDispatch({
                    type: "SET_FIELD", field, value,
                });
            }
        }else{
            embedSettingsDispatch({
                type: "SET_FIELD", field, value,
            });
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // Check for validation errors
        let allFieldsValid = true;
        // Iterate through inputs to validate everything
        const requiredFields = [{field: "Description", value: embedState.Description}, {
            field: "GPULayersCmd", value: embedState.GPULayersCmd
        },];

        requiredFields.forEach(({field, value}) => {
            validateField(field, value);
            if (!value || errors[field]) {
                allFieldsValid = false;
            }
        });

        if (!allFieldsValid) {
            return;
        }
        // Submit form data if valid
        LogInfo(embedState); // Replace with the actual submit logic
    };

    const handleModelChange = (event) => {
        event.preventDefault()
        const selectedId = event.target.value.replace(/\\/g, "\\");
        const selected = models.find(model => model.FullPath === selectedId).FullPath;
        const modelName = models.find(item => item.id === selectedId)?.ModelName;
        let value  = modelName + ".log";

        if (appState.ModelLogFolderNamePath.length < embedState.EmbedModelLogFileNameVal.length) {
            value = appState.ModelLogFolderNamePath + value;
            embedSettingsDispatch({
                type: "SET_FIELD", field:"EmbedModelLogFileNameVal", value,
            });
        }else{
            value = appState.ModelLogFolderNamePath.substring(appState.ModelLogFolderNamePath.length, value.length);
            value = appState.ModelLogFolderNamePath + value;
            embedSettingsDispatch({
                type: "SET_FIELD", field:"EmbedModelLogFileNameVal", value,
            });
        }
        setSelectedModel(selected);
        value = selectedId
        embedSettingsDispatch({
            type: "SET_FIELD", field:"EmbedModelPathVal", value,
        });
    };
    const validateField = (field, value) => {
        let error = "";

        switch (field) {
            case "Description":
                if (!value || value === "") {
                    error = "Description is required.";
                } else if (value.length < 5) {
                    error = "Description must be at least 5 characters.";
                }
                break;

            case "GPULayersCmd":
                if (!value || value.trim() === "") {
                    error = "GPU Layers Command cannot be empty.";
                }
                break;

            case "LLamaCppPath":
                if (!value || value.trim() === "") {
                    error = "Llama CPP Path is required.";
                }
                break;

            default:
                break;
        }
    }

    return (<>
            <form onSubmit={handleSubmit}>
                <div className="row w-75 p-2">
                    <div className="col w-100 float-end">
                        <button className="btn btn-primary  float-end" type="submit">Save</button>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex justify-content-start">
                        <label className="pe-1">
                            Description:
                        </label>
                    </div>
                    <div className="d-flex flex-fill">
                        <input className="w-100" type="text"
                               value={"Description"}
                               onChange={(e) => handleChange("Description", e.target.value)}
                        />

                        {errors.Description && (<span className="text-danger">{errors.Description}</span>)}
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex justify-content-start">
                        <label className="me-4">
                            Model:
                        </label>
                        <select
                            id="modelFullPath"
                            className="input-group-sm"
                            value={selectedModel}
                            onChange={handleModelChange}
                        >
                            {models.map((model) => (<option key={model.id} value={model.FullPath}>
                                {model.ModelName}
                            </option>))}
                        </select>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex w-50 justify-content-start">
                            <label className="pe-1 me-4">
                                Prompt: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedPromptCmd}</span>
                            </label>
                            <label className="pe-1"> Enabled:</label>
                            <input className="input-group-sm"
                                   id="PromptCmdEnabled"
                                   type="checkbox"
                                   checked={embedState.EmbedPromptCmdEnabled}
                                   onChange={(e) => handleChange("EmbedPromptCmdEnabled", e.target.checked)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex w-50 justify-content-start">
                            <label className="pe-1 me-4">
                                Flash Attention: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedFlashAttentionCmd}</span>
                            </label>
                            <label className="pe-1"> Enabled:</label>
                            <input className="input-group-sm"
                                   id="PromptCmdEnabled"
                                   type="checkbox"
                                   checked={!!embedState.EmbedFlashAttentionCmdEnabled}
                                   onChange={(e) => handleChange("EmbedFlashAttentionCmdEnabled", e.target.checked)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-1">
                                Context Size: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedCtxSizeCmd}</span>
                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:</label>
                            <input className="input-group-sm"
                                   id="CtxSizeVal"
                                   type="text"
                                   value={embedState.EmbedCtxSizeVal}
                                   onChange={(e) => handleChange("EmbedCtxSizeVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-2">
                                Temperature: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedTemperatureCmd}</span>

                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:
                            </label>
                            <input className="input-group-sm"
                                   id="TemperatureVal"
                                   type="text"
                                   value={embedState.EmbedTemperatureVal}
                                   onChange={(e) => handleChange("EmbedTemperatureVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-1">
                                Threads Batch: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedThreadsBatchCmd}</span>
                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:
                            </label>
                            <input className="input-group-sm"
                                   id="ThreadsBatchVal"
                                   type="text"
                                   value={embedState.EmbedThreadsBatchVal}
                                   onChange={(e) => handleChange("EmbedThreadsBatchVal", e.target.value)}
                            />
                        </div>

                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-1">
                                Threads: <span
                                className="p-2 fw-semiboldfont-monospace">{embedState.EmbedThreadsCmd}</span>
                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:
                            </label>
                            <input className="input-group-sm"
                                   id="ThreadsVal"
                                   type="text"
                                   value={embedState.EmbedThreadsVal}
                                   onChange={(e) => handleChange("EmbedThreadsVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-1">
                                Keep: <span className="p-2 fw-semibold font-monospace">{embedState.EmbedKeepCmd}</span>
                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value: </label>
                            <input className="input-group-sm"
                                   type="text"
                                   id="KeepVal"
                                   value={embedState.EmbedKeepVal}
                                   onChange={(e) => handleChange("EmbedKeepVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-1">
                                Top K: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedTopKCmd}</span>
                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:
                            </label>
                            <input className="input-group-sm"
                                   type="text"
                                   id="TopKVal"
                                   value={embedState.EmbedTopKVal}
                                   onChange={(e) => handleChange("EmbedTopKVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-1">
                                Main gpu: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedMainGPUCmd}</span>
                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:
                            </label>
                            <input className="input-group-sm"
                                   type="text"
                                   id="TopKVal"
                                   value={embedState.EmbedMainGPUVal}
                                   onChange={(e) => handleChange("EmbedMainGPUVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-1">
                                GPU layers: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedGPULayersCmd}</span>
                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:
                            </label>
                            <input className="input-group-sm"
                                   id="MainGPUVal"
                                   type="text"
                                   value={embedState.EmbedGPULayersVal}
                                   onChange={(e) => handleChange("EmbedGPULayersVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-1">
                                Repeat Penalty: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedRepeatPenaltyCmd}</span>
                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:
                            </label>
                            <input className="input-group-sm"
                                   type="text"
                                   id="PromptCacheVal"
                                   value={embedState.EmbedRepeatPenaltyVal}
                                   onChange={(e) => handleChange("EmbedRepeatPenaltyVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-1">
                                Prompt File: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedPromptFileCmd}</span>

                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:
                            </label>
                            <input className="input-group-sm w-100"
                                   id="PromptFileVal"
                                   type="text"
                                   value={embedState.EmbedPromptFileVal}
                                   onChange={(e) => handleChange("EmbedPromptFileVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-1">
                                Model Log: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedModelLogFileCmd}</span>

                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:
                            </label>
                            <input className="input-group-sm w-100"
                                   id="EmbedModelLogFileNameVal"
                                   type="text"
                                   value={embedState.EmbedModelLogFileNameVal}
                                   onChange={(e) => handleEmbedModelLogChange("EmbedModelLogFileNameVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start">
                            <label className="pe-1">
                                Separator: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedSeparatorCmd}</span>
                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:</label>
                            <input className="input-group-sm"
                                   id="ReversePromptVal"
                                   type="text"
                                   value={embedState.EmbedSeparatorVal}
                                   onChange={(e) => handleChange("EmbedSeparatorVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="row w-75 p-2">
                    <div className="d-flex">
                        <div className="d-flex flex-fill w-25 justify-content-start ">
                            <label className="pe-1">
                                Rope Scale: <span
                                className="p-2 fw-semibold font-monospace">{embedState.EmbedOutputFormatCmd}</span>

                            </label>
                        </div>
                        <div className="d-flex flex-fill w-50 justify-content-start">
                            <label className="pe-1">
                                Value:
                            </label>
                            <input className="input-group-sm"
                                   id="RopeScaleVal"
                                   type="text"
                                   value={embedState.EmbedOutputFormatVal}
                                   onChange={(e) => handleChange("EmbedOutputFormatVal", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

            </form>
        </>);
};