import {useEffect, useState} from 'react';
import {Tab, Tabs} from "react-bootstrap";

import {GetFilesInDirectory} from "../wailsjs/go/main/App.js";
import {LogInfo} from "../wailsjs/runtime/runtime.js";

import {useSettings, useSettingsDispatch} from "./SettingsContextHooks.jsx";



// Add

const Settings = () => {

    const state = useSettings(); // Access global state
    const dispatch = useSettingsDispatch(); // Dispatch updates
    const [models, setModels] = useState([]); // To store the list of models
    const [selectedModel, setSelectedModel] = useState({}); // To store the selec
    const [errors, setErrors] = useState({});


    useEffect(() => {
        setSelectedModel(state.ModelFullPath.String);
    }, [state.ModelFullPath.String]);

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

        setErrors((prevErrors) => ({
            ...prevErrors, [field]: error,
        }));
    };

    // Handler to update a field
    const handleChange = (field, value) => {
        value.Bool = value.Bool === "on";
        dispatch({
            type: "SET_FIELD", field, value,
        });
        validateField(field, value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Check for validation errors
        let allFieldsValid = true;

        // Iterate through inputs to validate everything
        const requiredFields = [{field: "Description", value: state.Description}, {
            field: "GPULayersCmd",
            value: state.GPULayersCmd.String
        },];

        requiredFields.forEach(({field, value}) => {
            validateField(field, value);
            if (!value.String || errors[field]) {
                allFieldsValid = false;
            }
        });

        if (!allFieldsValid) {
            return;
        }
        // Submit form data if valid
        LogInfo(state); // Replace with the actual submit logic

    };

    useEffect(() => {
        let model = [];
        let i;
        GetFilesInDirectory().then((result) => {
            result.forEach((item) => {
                i++;
                model.push({id: item.FullPath, modelName: item.FileName, fullPath: item.FullPath});
            });
            setModels(model);
        },);
    }, []);

    const handleModelChange = (event) => {
        const selectedId = event.target.value;
        const selected = models.find((model) => model.fullPath === selectedId);
        setSelectedModel(selected);
        let value ={String:selectedId}
        let field = "ModelFullPath"
        dispatch({
            type: "SET_FIELD", field, value,
        });
    };

    return (<div className="h-auto" style={{
        overflowY: "auto"
    }}
    >
            <Tabs
                defaultActiveKey="model"
                id="uncontrolled-tab-example"
                className="mb-3"
            >
                <Tab eventKey="model" title="LLAMA CPP Inference Settings">
                    <form onSubmit={handleSubmit}>
                        <div className="row w-75 p-2">
                            <div className="col w-100 float-end">
                                <button className="btn btn-light float-end" type="submit">Save</button>
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
                                       value={state.Description}
                                       onChange={(e) => handleChange("Description", {
                                           ...state.Description, String: e.target.value,
                                       })}
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
                                    value={state.ModelFullPath.String || ""}
                                    onChange={handleModelChange}
                                >
                                    {models.map((model) => (<option key={model.id} value={model.fullPath}>
                                            {model.modelName}
                                        </option>))}
                                </select>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                            <div className="d-flex w-50 justify-content-start">
                                <label className="pe-1 me-4">
                                    Prompt:  <span className="p-2 fw-semibold font-monospace">{state.PromptCmd.String}</span>
                                </label>
                                <label className="pe-1"> Enabled:</label>
                                <input className="input-group-sm"
                                       id="PromptCmdEnabled"
                                       type="checkbox"
                                       checked={!!state.PromptCmdEnabled.Bool}
                                       onChange={(e) => handleChange("PromptCmdEnabled", {
                                           ...state.PromptCmdEnabled.Bool, Bool: e.target.value,
                                       })}
                                />
                            </div>
                        </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex justify-content-start">
                                    <label className="pe-1 me-4">
                                        Multi line input :  <span className="p-2 fw-semibold font-monospace">{state.MultilineInputCmd.String}</span>
                                    </label>
                                    <label className="pe-1"> Enabled:</label>
                                    <input className="input-group-sm"
                                           id="MultilineInputCmdEnabled"
                                           type="checkbox"
                                           checked={!!state.MultilineInputCmdEnabled.Bool}
                                           onChange={(e) => handleChange("MultilineInputCmdEnabled", {
                                               ...state.MultilineInputCmdEnabled.Bool, Bool: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                                <div className="row w-75 p-2">
                                    <div className="d-flex">
                                        <div className="d-flex justify-content-start">
                                            <label className="pe-1 me-4">
                                                Conversation: <span className="p-2 fw-semibold font-monospace">{state.ConversationCmd.String}</span>
                                            </label>
                                            <label className="pe-1 float-end"> Enabled:</label>
                                            <input className="input-group-sm"
                                                   id="ConversationCmdEnabled"
                                                   type="checkbox"
                                                   checked={!!state.ConversationCmdEnabled.Bool}
                                                   onChange={(e) => handleChange("ConversationCmdEnabled", {
                                                       ...state.ConversationCmdEnabled.Bool, Bool: e.target.value,
                                                   })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row w-75 p-2">
                                    <div className="d-flex">
                                        <div className="d-flex justify-content-start">
                                            <label className="pe-1 me-4">
                                                Interactive Mode: <span className="p-2 fw-semibold font-monospace">{state.InteractiveModeCmd.String}</span>
                                            </label>
                                            <label className="pe-1 float-end"> Enabled:</label>
                                            <input className="input-group-sm float-end"
                                                   id="InteractiveModeCmdEnabled"
                                                   type="checkbox"
                                                   checked={!!state.InteractiveModeCmdEnabled.Bool}
                                                   onChange={(e) => handleChange("InteractiveModeCmdEnabled", {
                                                       ...state.InteractiveModeCmdEnabled.Bool, Bool: e.target.value,
                                                   })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row w-75 p-2">
                                    <div className="d-flex">
                                        <div className="d-flex justify-content-start">
                                            <label className="pe-1 me-4">
                                                Interactive First: <span className=" p-2 fw-semibold font-monospace">{state.InteractiveFirstCmd.String}</span>
                                            </label>
                                            <label className="pe-1"> Enabled:</label>
                                            <input className="input-group-sm"
                                                   id="InteractiveFirstCmdEnabled"
                                                   type="checkbox"
                                                   checked={!!state.InteractiveFirstCmdEnabled.Bool}
                                                   onChange={(e) => handleChange("InteractiveFirstCmdEnabled", {
                                                       ...state.InteractiveFirstCmdEnabled.Bool, Bool: e.target.value,
                                                   })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row w-75 p-2">
                                    <div className="d-flex">
                                        <div className="d-flex justify-content-center">
                                            <label className="pe-2 me-4">
                                                Mem Lock:  <span className="p-2 fw-semibold font-monospace">{state.MemLockCmd.String}</span>
                                            </label>
                                            <label className="pe-1"> Enabled:</label>
                                            <input className="input-group-sm"
                                                   id="MemLockCmdEnabled"
                                                   type="checkbox"
                                                   checked={!!state.MemLockCmdEnabled.Bool}
                                                   onChange={(e) => handleChange("MemLockCmdEnabled", {
                                                       ...state.MemLockCmdEnabled.Bool, Bool: e.target.value,
                                                   })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            <div className="row w-75 p-2">
                                <div className="d-flex">
                                    <div className="d-flex justify-content-center">
                                        <label className="pe-2 me-4">
                                            Mem Lock:  <span className="p-2 fw-semibold font-monospace">{state.EscapeNewLinesCmd.String}</span>
                                        </label>
                                        <label className="pe-1"> Enabled:</label>
                                        <input className="input-group-sm"
                                               id="EscapeNewLinesCmdEnabled"
                                               type="checkbox"
                                               checked={!!state.EscapeNewLinesCmdEnabled.Bool}
                                               onChange={(e) => handleChange("EscapeNewLinesCmdEnabled", {
                                                   ...state.EscapeNewLinesCmdEnabled.Bool, Bool: e.target.value,
                                               })}
                                        />

                                    </div>
                                </div>
                            </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex justify-content-center">
                                    <label className="pe-2 me-4">
                                        Don't display prompt:  <span className="p-2 fw-semibold font-monospace">{state.NoDisplayPromptCmd.String}</span>
                                    </label>
                                    <label className="pe-1"> Enabled:</label>
                                    <input className="input-group-sm"
                                           id="NoDisplayPromptEnabled"
                                           type="checkbox"
                                           checked={!!state.NoDisplayPromptEnabled.Bool}
                                           onChange={(e) => handleChange("NoDisplayPromptEnabled", {
                                               ...state.NoDisplayPromptEnabled.Bool, Bool: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-1">
                                        Context Size: <span className="p-2 fw-semibold font-monospace">{state.CtxSizeCmd.String}</span>
                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:</label>
                                    <input className="input-group-sm"
                                           id="CtxSizeVal"
                                           type="text"
                                           value={state.CtxSizeVal.String}
                                           onChange={(e) => handleChange("CtxSizeVal", {
                                               ...state.CtxSizeVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-2">
                                        Temperature: <span className="p-2 fw-semibold font-monospace">{state.TemperatureCmd.String}</span>

                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-2">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id = "TemperatureVal"
                                           type="text"
                                           value={state.TemperatureVal.String}
                                           onChange={(e) => handleChange("TemperatureVal", {
                                               ...state.TemperatureVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-1">
                                        Threads Batch: <span className="p-2 fw-semibold font-monospace">{state.ThreadsBatchCmd.String}</span>
                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id="ThreadsBatchVal"
                                           type="text"
                                           value={state.ThreadsBatchVal.String}
                                           onChange={(e) => handleChange("ThreadsBatchVal", {
                                               ...state.ThreadsBatchVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>

                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-1">
                                        Threads: <span className="p-2 fw-semiboldfont-monospace">{state.ThreadsCmd.String}</span>
                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id="ThreadsVal"
                                           type="text"
                                           value={state.ThreadsVal.String}
                                           onChange={(e) => handleChange("ThreadsVal", {
                                               ...state.ThreadsVal, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                <label className="pe-1">
                                    Keep: <span className="p-2 fw-semibold font-monospace">{state.KeepCmd.String}</span>
                                </label>
                                </div>
                            <div className="d-flex flex-fill w-50 justify-content-start">
                                <label className="pe-1">
                                    Value: </label>
                                    <input className="input-group-sm"
                                           type="text"
                                           id = "KeepVal"
                                           value={state.KeepVal.String}
                                           onChange={(e) => handleChange("KeepVal", {
                                               ...state.KeepVal.String, String: e.target.value,
                                           })}
                                    />
                            </div>
                         </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                <label className="pe-1">
                                    Top K: <span className="p-2 fw-semibold font-monospace">{state.TopKCmd.String}</span>
                                </label>
                            </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                <label className="pe-1">
                                    Value:
                                </label>
                                    <input className="input-group-sm"
                                           type="text"
                                           id = "TopKVal"
                                           value={state.TopKVal.String}
                                           onChange={(e) => handleChange("TopKVal", {
                                               ...state.TopKVal.String, String: e.target.value,
                                           })}
                                    />
                            </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-1">
                                        Top P: <span className="p-2 fw-semibold font-monospace">{state.TopPCmd.String}</span>
                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           type="text"
                                           id = "TopKVal"
                                           value={state.TopPVal.String}
                                           onChange={(e) => handleChange("TopPVal", {
                                               ...state.TopPVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                <label className="pe-1">
                                    Main GPU: <span className="p-2 fw-semibold font-monospace">{state.MainGPUCmd.String}</span>
                                </label>
                            </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                <label className="pe-1">
                                    Value:
                                </label>
                                    <input className="input-group-sm"
                                           id = "MainGPUVal"
                                           type="text"
                                           value={state.MainGPUVal.String}
                                           onChange={(e) => handleChange("MainGPUVal", {
                                               ...state.MainGPUVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-1">
                                        GPU Layers: <span className="p-2 fw-semibold font-monospace">{state.GPULayersCmd.String}</span>
                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id = "GPULayersVal"
                                           type="text"
                                           value={state.GPULayersVal.String}
                                           onChange={(e) => handleChange("GPULayersVal", {
                                               ...state.GPULayersVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                <label className="pe-1">
                                    Prompt Cache: <span className="p-2 fw-semibold font-monospace">{state.PromptCacheCmd.String}</span>
                                </label>
                            </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                <label className="pe-1">
                                    Value:
                                </label>
                                    <input className="input-group-sm"
                                           type="text"
                                           id = "PromptCacheVal"
                                           value={state.PromptCacheVal.String}
                                           onChange={(e) => handleChange("PromptCacheVal", {
                                               ...state.PromptCacheVal.String, String: e.target.value,
                                           })}
                                    />
                            </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                <label className="pe-1">
                                    Prompt File: <span className="p-2 fw-semiboldfont-monospace">{state.PromptFileCmd.String}</span>

                                </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                <label className="pe-1">
                                    Value:
                                </label>
                                    <input className="input-group-sm"
                                           id = "PromptFileVal"
                                           type="text"
                                           value={state.PromptFileVal.String}
                                           onChange={(e) => handleChange("PromptFileVal", {
                                               ...state.PromptFileVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-1">
                                        Log File: <span className="p-2 fw-semiboldfont-monospace">{state.LogFileCmd.String}</span>

                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id = "LogFileVal"
                                           type="text"
                                           value={state.LogFileVal.String}
                                           onChange={(e) => handleChange("LogFileVal", {
                                               ...state.LogFileVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-1">
                                        Chat Template: <span className="p-2 fw-semibold font-monospace">{state.ChatTemplateCmd.String}</span>

                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id = "ChatTemplateVal"
                                           type="text"
                                           value={state.ChatTemplateVal.String}
                                           onChange={(e) => handleChange("ChatTemplateVal", {
                                               ...state.ChatTemplateVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-1">
                                        Reverse Prompt: <span className="p-2 fw-semibold font-monospace">{state.ReversePromptCmd.String}</span>
                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:</label>
                                    <input className="input-group-sm"
                                           id="ReversePromptVal"
                                           type="text"
                                           value={state.ReversePromptVal.String}
                                           onChange={(e) => handleChange("ReversePromptVal", {
                                               ...state.ReversePromptVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start ">
                                    <label className="pe-1">
                                        Rope Scale: <span className="p-2 fw-semibold font-monospace">{state.RopeScaleCmd.String}</span>

                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id = "RopeScaleVal"
                                           type="text"
                                           value={state.RopeScaleVal.String}
                                           onChange={(e) => handleChange("RopeScaleVal", {
                                               ...state.RopeScaleVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-1">
                                        In Prefix: <span className="p-2 fw-semibold font-monospace">{state.InPrefixCmd.String}</span>

                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id = "InPrefixVal"
                                           type="text"
                                           value={state.InPrefixVal.String}
                                           onChange={(e) => handleChange("InPrefixVal", {
                                               ...state.InPrefixVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                         <div className="row w-75 p-2">
                            <div className="d-flex ">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-1">
                                        In Suffix: <span className="p-2 fw-semibold font-monospace">{state.InSuffixCmd.String}</span>

                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id = "InSuffixVal"
                                           type="text"
                                           value={state.InSuffixVal.String}
                                           onChange={(e) => handleChange("InSuffixVal", {
                                               ...state.InSuffixVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-1">
                                        Repeat Last Penalty: <span className="p-2 fw-semibold font-monospace">{state.RepeatLastPenaltyCmd.String}</span>

                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-1">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id = "RepeatLastPenaltyVal"
                                           type="text"
                                           value={state.RepeatLastPenaltyVal.String}
                                           onChange={(e) => handleChange("RepeatLastPenaltyVal", {
                                               ...state.RepeatLastPenaltyVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-2">
                                        Repeat Penalty: <span className="p-2 fw-semibold font-monospace">{state.RepeatPenaltyCmd.String}</span>

                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-2">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id = "RepeatPenaltyVal"
                                           type="text"
                                           value={state.RepeatPenaltyVal.String}
                                           onChange={(e) => handleChange("RepeatPenaltyVal", {
                                               ...state.RepeatPenaltyVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="row w-75 p-2">
                            <div className="d-flex">
                                <div className="d-flex flex-fill w-25 justify-content-start">
                                    <label className="pe-2">
                                        Predict: <span className="p-2 fw-semibold font-monospace">{state.PredictCmd.String}</span>

                                    </label>
                                </div>
                                <div className="d-flex flex-fill w-50 justify-content-start">
                                    <label className="pe-2">
                                        Value:
                                    </label>
                                    <input className="input-group-sm"
                                           id ="PredictVal"
                                           type="text"
                                           value={state.PredictVal.String}
                                           onChange={(e) => handleChange("PredictVal", {
                                               ...state.PredictVal.String, String: e.target.value,
                                           })}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </Tab>
                <Tab eventKey="rag" title="LLAMA CPP RAG Settings">
                    Tab content for Profile
                </Tab>
                <Tab eventKey="contact" title="Contact" disabled>
                    Tab content for Contact
                </Tab>
            </Tabs>

        </div>);
};

export default Settings;
