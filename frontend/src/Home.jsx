import {Button, Card, Form, InputGroup} from "react-bootstrap";
import {useEffect, useState} from "react";

import {LogError, LogInfo} from "../wailsjs/runtime/runtime.js";
import {DomGetDefaultSettings, GenerateCompletion, Embed, EmbedCompletion} from "../wailsjs/go/main/App.js";

import {initialState, useSettings, useSettingsDispatch} from "./SettingsContextHooks.jsx";



const Home = () => {
    useEffect(() => {
        DomGetDefaultSettings().then((settings) => {
            initialState.ID = settings.ID
            initialState.Description = settings.Description
            initialState.PromptCmd.String = settings.PromptCmd.String
            initialState.PromptCmdEnabled.Bool = settings.PromptCmdEnabled.Bool
            initialState.ConversationCmd.String = settings.ConversationCmd.String
            initialState.ConversationCmdEnabled.Bool = settings.ConversationCmdEnabled.Bool
            initialState.ChatTemplateCmd.String = settings.ChatTemplateCmd.String
            initialState.ChatTemplateVal.String = settings.ChatTemplateVal.String
            initialState.MultilineInputCmd.String = settings.MultilineInputCmd.String
            initialState.MultilineInputCmdEnabled.Bool = settings.MultilineInputCmdEnabled.Bool
            initialState.CtxSizeCmd.String = settings.CtxSizeCmd.String
            initialState.CtxSizeVal.String = settings.CtxSizeVal.String
            initialState.RopeScaleVal.String = settings.RopeScaleVal.String
            initialState.RopeScaleCmd.String = settings.RopeScaleCmd.String
            initialState.PromptCacheCmd.String = settings.PromptCacheCmd.String
            initialState.PromptCacheVal.String = settings.PromptCacheVal.String
            initialState.PromptFileCmd.String = settings.PromptFileCmd.String
            initialState.PromptFileVal.String = settings.PromptFileVal.String
            initialState.InteractiveFirstCmd.String = settings.InteractiveFirstCmd.String
            initialState.InteractiveFirstCmdEnabled.Bool = settings.InteractiveFirstCmdEnabled.Bool
            initialState.InteractiveModeCmd.String = settings.InteractiveModeCmd.String
            initialState.InteractiveModeCmdEnabled.Bool = settings.InteractiveModeCmdEnabled.Bool
            initialState.ReversePromptCmd.String = settings.ReversePromptCmd.String
            initialState.ReversePromptVal.String = settings.ReversePromptVal.String
            initialState.InPrefixCmd.String = settings.InPrefixCmd.String
            initialState.InPrefixVal.String = settings.InPrefixVal.String
            initialState.InSuffixCmd.String = settings.InSuffixCmd.String
            initialState.InSuffixVal.String = settings.InSuffixVal.String
            initialState.GPULayersCmd.String = settings.GPULayersCmd.String
            initialState.GPULayersVal.String = settings.GPULayersVal.String
            initialState.ThreadsBatchCmd.String = settings.ThreadsBatchCmd.String
            initialState.ThreadsBatchVal.String = settings.ThreadsBatchVal.String
            initialState.ThreadsCmd.String = settings.ThreadsCmd.String
            initialState.ThreadsVal.String = settings.ThreadsVal.String
            initialState.KeepCmd.String = settings.KeepCmd.String
            initialState.KeepVal.String = settings.KeepVal.String
            initialState.TopKCmd.String = settings.TopKCmd.String
            initialState.TopKVal.String = settings.TopKVal.String
            initialState.MainGPUCmd.String = settings.MainGPUCmd.String
            initialState.MainGPUVal.String = settings.MainGPUVal.String
            initialState.RepeatPenaltyCmd.String = settings.RepeatPenaltyCmd.String
            initialState.RepeatPenaltyVal.String = settings.RepeatPenaltyVal.String
            initialState.RepeatLastPenaltyCmd.String = settings.RepeatLastPenaltyCmd.String
            initialState.RepeatLastPenaltyVal.String = settings.RepeatLastPenaltyVal.String
            initialState.MemLockCmd.String = settings.MemLockCmd.String
            initialState.MemLockCmdEnabled.Bool = settings.MemLockCmdEnabled.Bool
            initialState.EscapeNewLinesCmd.String = settings.EscapeNewLinesCmd.String
            initialState.EscapeNewLinesCmdEnabled.Bool = settings.EscapeNewLinesCmdEnabled.Bool
            initialState.LogVerboseCmd.String = settings.LogVerboseCmd.String
            initialState.LogVerboseEnabled.Bool = settings.LogVerboseEnabled.Bool
            initialState.TemperatureVal.String = settings.TemperatureVal.String
            initialState.TemperatureCmd.String = settings.TemperatureCmd.String
            initialState.PredictCmd.String = settings.PredictCmd.String
            initialState.PredictVal.String = settings.PredictVal.String
            initialState.ModelFullPath.String = settings.ModelFullPath.String
            initialState.ModelCmd.String = settings.ModelCmd.String
            initialState.PromptText.String = settings.PromptText.String
            initialState.NoDisplayPromptCmd.String = settings.NoDisplayPromptCmd.String
            initialState.NoDisplayPromptEnabled.Bool = settings.NoDisplayPromptEnabled.Bool
            initialState.TopPCmd.String = settings.TopPCmd.String
            initialState.TopPVal.String = settings.TopPVal.String
            initialState.LogFileCmd.String = settings.LogFileCmd.String
            initialState.LogFileVal.String = settings.LogFileVal.String
        }).catch(err => {
            LogError(err);
        });
    }, []);

    const [out, setOut] = useState("");
    const state = useSettings();
    const dispatch = useSettingsDispatch();


    // Handler to update a field
    const handleChange = (field, value) => {
        dispatch({
            type: "SET_FIELD", field, value,
        });
    };

    const embed = () => {
        Embed().then((val) => {
            LogInfo(val);
        });

    }

    const embedCompletion = () => {
        EmbedCompletion(state).then((val) => {
            setOut(val);
        });

    }

    const handleSubmit = (event) => {
        event.preventDefault();
        GenerateCompletion(state).then((val) => {
            setOut(val);
         });
    }
    return (
        <>
            <div className="d-flex vh-100 overflow-y-scroll"><p style={{whiteSpace:"pre-wrap"}} className="font-monospace fw-medium lh-small">{out}</p></div>
            <form onSubmit={handleSubmit}>
            <div className="d-flex p-2 flex-column justify-content-end">
                <Card className="w-100 rounded shadow-lg">
                    <Card.Body>
                        <span className="badge">Query</span>
                        <InputGroup hasValidation>
                            <Form.Control
                                required
                                as="textarea"
                                rows={10}
                                value={state.PromptText.String}
                                id="PromptText"
                                name="PromptText"
                                className="form-control"
                                maxLength={50000}
                                minLength={1}
                                aria-label=""
                                aria-describedby="button-addon2"
                                onChange={(e) => handleChange("PromptText", {
                                    ...state.PromptText.String, String: e.target.value,
                                })}
                            />
                            <Button

                                variant="btn btn-primary"
                                type="submit"
                                id="submit"
                            >
                                <i className="bi bi-search"></i>
                            </Button>

                        </InputGroup>
                        <div className="pt-2">
                            <Button
                                onClick={embedCompletion}
                                type="button"
                                variant="btn btn-primary float-end"
                            >
                                Embed Completion
                            </Button>
                            <Button
                                type="button"
                                variant="btn btn-primary float-end"
                                onClick={embed}
                            >
                                Embed
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </div>
            </form>
        </>
    );
};

export default Home;
