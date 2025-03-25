import {useEffect, useState} from 'react';


import {GetModelFiles} from "../wailsjs/go/main/App.js";
import {LogError, LogInfo} from "../wailsjs/runtime/runtime.js";

import {useLlamaCliSettingsDispatch} from "./LlamaCliSettingsContextHooks.jsx";


export const LlamaCliSettingsForm = ({cliState, appState = {}}) => {


    const cliSettingsDispatch = useLlamaCliSettingsDispatch();
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState("");
    const [errors, setErrors] = useState({});

    const REQUIRED_FIELDS = [{field: "Description", value: cliState.Description}, {
        field: "GPULayersCmd",
        value: cliState.GPULayersCmd
    }];

    const dispatchField = (field, value) => {
        cliSettingsDispatch({type: "SET_FIELD", field, value});
    };

    const handlePathChange = (basePath, field, value) => {
        if (!value.length) {
            dispatchField(field, value);
            return;
        }

        const newValue = value.length <= basePath.length ? basePath + value : basePath + value.substring(basePath.length);

        dispatchField(field, newValue);
    };

    useEffect(() => {
        let formattedModels
        let selectedId
        const initializeModels = async () => {
            if (models.length > 0) return;
            try {
                const result = await GetModelFiles();
                formattedModels = result.map(item => ({
                    id: item.FullPath.replace(/\\/g, '/'), ModelName: item.FileName, FullPath: item.FullPath.replace(/\\/g, '/')

                }));
            } catch (error) {
                LogError(error)
            }

            setModels(formattedModels);
            if (cliState.ModelFullPath.length) {
                selectedId = cliState.ModelFullPath;
            }else {
                selectedId = `${appState.ModelFolderName.replace(/\//g, "//")}${appState.ModelFileName}`;           }
            const selectedModel = formattedModels.find(item => item.id === selectedId);
            if (selectedModel) {
                const logFileName = `${appState.AppLogPath}${selectedModel.ModelName}.log`;
                dispatchField("ModelLogFileNameVal", logFileName);
                dispatchField("ModelFullPath", selectedId);
                setSelectedModel(selectedModel.FullPath);
            }

            if (cliState.PromptFileVal.length) {
                const promptCacheValue = appState.PromptCacheFolderName.substring(appState.PromptCacheFolderName.length, cliState.PromptFileVal);
                dispatchField("PromptCacheVal", promptCacheValue);
            }
        };

        initializeModels().catch();
    }, []);

    const handleChange = (field, value) => {
        dispatchField(field, value);
        validateField(field, value);
    };

    const handlePromptCacheChange = (field, value) => {
        handlePathChange(appState.PromptCacheFolderName, field, value);
    };

    const handleModelLogChange = (field, value) => {
        handlePathChange(appState.ModelLogFolderNamePath, field, value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const hasErrors = REQUIRED_FIELDS.some(({field, value}) => {
            validateField(field, value);
            return !value || errors[field];
        });

        if (hasErrors) return;
        LogInfo(cliState);
    };

    const handleModelChange = (event) => {
        event.preventDefault();
        const selectedId = event.target.value.replace(/\\/g, "//");
        const selectedModel = models.find(model => model.FullPath === selectedId);

        if (selectedModel) {
            const logFileName = `${appState.ModelLogFolderNamePath}${selectedModel.ModelName}.log`;
            dispatchField("ModelLogFileNameVal", logFileName);
            setSelectedModel(selectedModel.FullPath);
            dispatchField("ModelFullPath", selectedId);
        }
    };

    const validateField = (field, value) => {
        const validations = {
            Description: () => {
                if (!value || value === "") return "Description is required.";
                if (value.length < 5) return "Description must be at least 5 characters.";
                return "";
            },
            GPULayersCmd: () => (!value || value.trim() === "") ? "GPU Layers Command cannot be empty." : "",
            LLamaCppPath: () => (!value || value.trim() === "") ? "Llama CPP Path is required." : ""
        };

        const error = validations[field] ? validations[field]() : "";
        setErrors(prev => ({...prev, [field]: error}));
        return error;
    };

    return (<>
        <form onSubmit={handleSubmit}>
            <div className="row w-100 p-2">
                <div className="col w-75 float-end">
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
                           value={cliState.Description}
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
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex w-100 justify-content-start">
                        <label className="pe-1 me-4">
                            Prompt: <span
                            className="p-2 fw-semibold font-monospace">{cliState.PromptCmd}</span>
                        </label>
                        <label className="pe-1"> Enabled:</label>
                        <input className="input-group-sm"
                               id="PromptCmdEnabled"
                               type="checkbox"
                               checked={cliState.PromptCmdEnabled}
                               onChange={(e) => handleChange("PromptCmdEnabled", e.target.checked)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">If enabled enter prompt on home page. If disabled provide prompt file below.</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-75 p-2">
                <div className="d-flex">
                    <div className="d-flex w-50 justify-content-start">
                        <label className="pe-1 me-4">
                            Flash Attention: <span
                            className="p-2 fw-semibold font-monospace">{cliState.FlashAttentionCmd}</span>
                        </label>
                        <label className="pe-1"> Enabled:</label>
                        <input className="input-group-sm"
                               id="PromptCmdEnabled"
                               type="checkbox"
                               checked={!!cliState.FlashAttentionCmdEnabled}
                               onChange={(e) => handleChange("FlashAttentionCmdEnabled", e.target.checked)}
                        />
                    </div>
                </div>
            </div>
            <div className="row w-75 p-2">
                <div className="d-flex">
                    <div className="d-flex justify-content-start">
                        <label className="pe-1 me-4">
                            Multi line input : <span
                            className="p-2 fw-semibold font-monospace">{cliState.MultilineInputCmd}</span>
                        </label>
                        <label className="pe-1"> Enabled:</label>
                        <input className="input-group-sm"
                               id="MultilineInputCmdEnabled"
                               type="checkbox"
                               checked={!!cliState.MultilineInputCmdEnabled}
                               onChange={(e) => handleChange("MultilineInputCmdEnabled", e.target.checked)}
                        />
                    </div>
                </div>
            </div>

            <div className="row w-75 p-2">
                <div className="d-flex">
                    <div className="d-flex justify-content-center">
                        <label className="pe-2 me-4">
                            Mem Lock: <span
                            className="p-2 fw-semibold font-monospace">{cliState.MemLockCmd}</span>
                        </label>
                        <label className="pe-1"> Enabled:</label>
                        <input className="input-group-sm"
                               id="MemLockCmdEnabled"
                               type="checkbox"
                               checked={!!cliState.MemLockCmdEnabled}
                               onChange={(e) => handleChange("MemLockCmdEnabled", e.target.checked)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">Force system to keep model in RAM rather than swapping or compressing</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-75 p-2">
                <div className="d-flex">
                    <div className="d-flex justify-content-center">
                        <label className="pe-2 me-4">
                            Escape New Lines: <span
                            className="p-2 fw-semibold font-monospace">{cliState.EscapeNewLinesCmd}</span>
                        </label>
                        <label className="pe-1"> Enabled:</label>
                        <input className="input-group-sm"
                               id="EscapeNewLinesCmdEnabled"
                               type="checkbox"
                               checked={!!cliState.EscapeNewLinesCmdEnabled}
                               onChange={(e) => handleChange("EscapeNewLinesCmdEnabled", e.target.checked)}
                        />

                    </div>
                </div>
            </div>
            <div className="row w-75 p-2">
                <div className="d-flex">
                    <div className="d-flex justify-content-center">
                        <label className="pe-2 me-4">
                            Don't display prompt: <span
                            className="p-2 fw-semibold font-monospace">{cliState.NoDisplayPromptCmd}</span>
                        </label>
                        <label className="pe-1"> Enabled:</label>
                        <input className="input-group-sm"
                               id="NoDisplayPromptEnabled"
                               type="checkbox"
                               checked={!!cliState.NoDisplayPromptEnabled}
                               onChange={(e) => handleChange("NoDisplayPromptEnabled", e.target.checked)}
                        />
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Context Size: <span
                            className="p-2 fw-semibold font-monospace">{cliState.CtxSizeCmd}</span>
                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:</label>
                        <input type="number" className="input-group-sm"
                               min="0" max="128000" step="10"
                               id="CtxSizeVal"
                               value={cliState.CtxSizeVal}
                               onChange={(e) => handleChange("CtxSizeVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">Setting of 0 defaults to model size.</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Temperature: <span
                            className="p-2 fw-semibold font-monospace">{cliState.TemperatureCmd}</span>

                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="TemperatureVal"
                               type="number"
                               min="0.5" max="100" step="0.1" data-decimals="2"
                               value={cliState.TemperatureVal}
                               onChange={(e) => handleChange("TemperatureVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">.8 is default. Lower value more precise.</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Threads Batch: <span
                            className="p-2 fw-semibold font-monospace">{cliState.ThreadsBatchCmd}</span>
                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="ThreadsBatchVal"
                               type="number"
                               min="0" max="100" step="1"
                               value={cliState.ThreadsBatchVal}
                               onChange={(e) => handleChange("ThreadsBatchVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">Number of threads to use during batch and prompt processing (default: same as --threads)</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Threads: <span
                            className="p-2 fw-semibold font-monospace">{cliState.ThreadsCmd}</span>
                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="ThreadsVal"
                               type="number"
                               min="0" max="100" step="1"
                               value={cliState.ThreadsVal}
                               onChange={(e) => handleChange("ThreadsVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">Number of threads to use during generation (default: -1)</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Keep: <span className="p-2 fw-semibold font-monospace">{cliState.KeepCmd}</span>
                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value: </label>
                        <input className="input-group-sm"
                               type="number"
                               min="-1" max="100" step="1"
                               id="KeepVal"
                               value={cliState.KeepVal}
                               onChange={(e) => handleChange("KeepVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">Number of tokens to keep from the initial prompt (default: 0, -1 = all)</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Top K: <span
                            className="p-2 fw-semibold font-monospace">{cliState.TopKCmd}</span>
                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               type="number"
                               min="-1" max="100" step="1"
                               id="TopKVal"
                               value={cliState.TopKVal}
                               onChange={(e) => handleChange("TopKVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">Top-k sampling (default: 40, 0 = disabled)</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Top P: <span
                            className="p-2 fw-semibold font-monospace">{cliState.TopPCmd}</span>
                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               type="number"
                               min="-1" max="100" step="1"
                               id="TopPVal"
                               value={cliState.TopPVal}
                               onChange={(e) => handleChange("TopPVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">Top-p sampling (default: 0.9, 1.0 = disabled)</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Min P: <span
                            className="p-2 fw-semibold font-monospace">{cliState.MinPCmd}</span>
                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               type="number"
                               min="-1" max="100" step="1"
                               id="MinPVal"
                               value={cliState.MinPVal}
                               onChange={(e) => handleChange("MinPVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">Min-p sampling (default: 0.1, 0.0 = disabled)</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Main GPU: <span
                            className="p-2 fw-semibold font-monospace">{cliState.MainGPUCmd}</span>
                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="MainGPUVal"
                               type="text"
                               value={cliState.MainGPUVal}
                               onChange={(e) => handleChange("MainGPUVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fst-italic text-nowrap"><small>The GPU to use for the model (with split-mode = none), or for
                            intermediate results and KV (with split-mode = row) (default: 0)</small></span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            GPU Layers: <span
                            className="p-2 fw-semibold font-monospace">{cliState.GPULayersCmd}</span>
                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="GPULayersVal"
                               type="number"
                               min="-1" max="100" step="1"
                               value={cliState.GPULayersVal}
                               onChange={(e) => handleChange("GPULayersVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">Number of layers to store in VRAM</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Prompt Cache: <span
                            className="p-2 fw-semibold font-monospace">{cliState.PromptCacheCmd}</span>
                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm w-100"
                               type="text"
                               id="PromptCacheVal"
                               value={cliState.PromptCacheVal}
                               onChange={(e) => handlePromptCacheChange("PromptCacheVal", e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Prompt File: <span
                            className="p-2 fw-semibold font-monospace">{cliState.PromptFileCmd}</span>

                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm w-100"
                               id="PromptFileVal"
                               type="text"
                               value={cliState.PromptFileVal}
                               onChange={(e) => handleChange("PromptFileVal", e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Model log file name: <span
                            className="p-2 fw-semibold font-monospace">{cliState.ModelLogFileCmd}</span>

                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm w-100"
                               id="LogFileVal"
                               type="text"
                               value={cliState.ModelLogFileNameVal}
                               onChange={(e) => handleModelLogChange("ModelLogFileNameVal", e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Chat Template: <span
                            className="p-2 fw-semibold font-monospace">{cliState.ChatTemplateCmd}</span>

                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="ChatTemplateVal"
                               type="text"
                               value={cliState.ChatTemplateVal}
                               onChange={(e) => handleChange("ChatTemplateVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic"></span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Reverse Prompt: <span
                            className="p-2 fw-semibold font-monospace">{cliState.ReversePromptCmd}</span>
                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:</label>
                        <input className="input-group-sm"
                               id="ReversePromptVal"
                               type="text"
                               value={cliState.ReversePromptVal}
                               onChange={(e) => handleChange("ReversePromptVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic"></span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start ">
                        <label className="pe-1">
                            Rope Scale: <span
                            className="p-2 fw-semibold font-monospace">{cliState.RopeScaleCmd}</span>

                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="RopeScaleVal"
                               type="text"
                               value={cliState.RopeScaleVal}
                               onChange={(e) => handleChange("RopeScaleVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic"></span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            In Prefix: <span
                            className="p-2 fw-semibold font-monospace">{cliState.InPrefixCmd}</span>

                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="InPrefixVal"
                               type="text"
                               value={cliState.InPrefixVal}
                               onChange={(e) => handleChange("InPrefixVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic"></span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex ">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            In Suffix: <span
                            className="p-2 fw-semibold font-monospace">{cliState.InSuffixCmd}</span>

                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="InSuffixVal"
                               type="text"
                               value={cliState.InSuffixVal}
                               onChange={(e) => handleChange("InSuffixVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic"></span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-1">
                            Repeat Last Penalty: <span
                            className="p-2 fw-semibold font-monospace">{cliState.RepeatLastPenaltyCmd}</span>

                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="RepeatLastPenaltyVal"
                               type="number"
                               min="-1" max="100" step="1"
                               value={cliState.RepeatLastPenaltyVal}
                               onChange={(e) => handleChange("RepeatLastPenaltyVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">Last n tokens to consider for penalize (default: 64, 0 = disabled, -1</span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-2">
                            Repeat Penalty: <span
                            className="p-2 fw-semibold font-monospace">{cliState.RepeatPenaltyCmd}</span>

                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="RepeatPenaltyVal"
                               type="text"
                               value={cliState.RepeatPenaltyVal}
                               onChange={(e) => handleChange("RepeatPenaltyVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic">Penalize repeat sequence of tokens (default: 1.0, 1.0 = disabled)</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="row w-100 p-2">
                <div className="d-flex">
                    <div className="d-flex flex-fill w-25 justify-content-start">
                        <label className="pe-2">
                            Predict: <span
                            className="p-2 fw-semibold font-monospace">{cliState.PredictCmd}</span>

                        </label>
                    </div>
                    <div className="d-flex flex-fill w-75 justify-content-start">
                        <label className="pe-1">
                            Value:
                        </label>
                        <input className="input-group-sm"
                               id="PredictVal"
                               type="text"
                               value={cliState.PredictVal}
                               onChange={(e) => handleChange("PredictVal", e.target.value)}
                        />
                        <label className="pe-1"><span
                            className="p-2 fs-6 fst-italic"></span>
                        </label>
                    </div>
                </div>
            </div>
        </form>
    </>);
};