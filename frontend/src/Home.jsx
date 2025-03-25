import {Button, Card, CardTitle, Form, InputGroup, Spinner} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";


import {GenerateCompletion} from "../wailsjs/go/main/App.js";
import {LogError, LogInfo} from "../wailsjs/runtime/runtime.js";

import {useLlamaCliSettings, useLlamaCliSettingsDispatch} from "./LlamaCliSettingsContextHooks.jsx";
import InferenceHelpIcon from "./InferenceHelpIcon.jsx";




export const Home = () => {


    const [out, setOut] = useState("");
    const llamaCliDispatch = useLlamaCliSettingsDispatch();
    const navigate = useNavigate();
    const cliState =  useLlamaCliSettings();
    const [loading, setLoading] = useState(false); // Spinner visibility state
    const [selectedValue, setSelectedPrompt] = useState("");
    const [isValidOptionSelected, setIsValidOptionSelected] = useState(false); // Add state for validation


    useEffect(() => {

        if (!cliState) {
            setLoading(true);
        }else {
            setLoading(false);
        }

    },[cliState])

    const handleClick = () => {
        navigate("/Settings"); // Replace '/about' with the desired path
    };

    const handleChange = (field, value) => {
            llamaCliDispatch({
            type: "SET_FIELD", field, value,
        });
    };

    // Handler for when the dropdown changes
    const handleOptionChange = (event) => {
        event.preventDefault();
        const newValue = event.target.value;
        setSelectedPrompt(newValue);
        setIsValidOptionSelected(newValue !== "");
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!isValidOptionSelected) { // Check if a valid option is selected
            alert("Please select a prompt template."); // Or display a message in your UI
            return;
        }

        setLoading(true); // Show spinner when submission starts

        const promptName = event.target.elements.promptName?.value;
        GenerateCompletion(cliState, promptName)
            .then((val) => {
                setOut(val);
            })
            .catch((error) => {
                LogError(error);
            })
            .finally(() => {
                setLoading(false); // Hide spinner after submission completes
            });

    }
    return (<>

        <div className="d-flex w-75 align-self-center vh-100 overflow-y-scroll"><p style={{whiteSpace: "pre-wrap"}}
                                                            className="font-monospace fw-medium lh-small">{out}</p>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="d-flex align-items-center p-2 flex-column">
                <Card className="w-75 shadow rounded">
                    <Card.Body>
                        <CardTitle> Prompt: <InferenceHelpIcon />
                        </CardTitle>
                        <InputGroup hasValidation>
                            <Form.Control
                                required
                                placeholder={"Input text..."}
                                as="textarea"
                                rows={5}
                                value={cliState.PromptText}
                                id="PromptText"
                                name="promptText"
                                className="form-control"
                                maxLength={50000}
                                minLength={1}
                                aria-label=""
                                aria-describedby="button-addon2"
                                onChange={(e) => handleChange("PromptText", e.target.value)}
                            />
                            <Button variant="btn btn-primary" type="submit" id="submit" disabled={loading || !isValidOptionSelected
                            }>
                                {loading ? (
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <i className="bi bi-search"></i>
                                )}
                            </Button>


                        </InputGroup>
                        <div className="pt-2">
                            <div className="d-flex flex-row justify-content-end">
                                <label className="pe-1"> Auto save work enabled:</label>
                                <input className="input-group-sm"
                                       id="PromptCmdEnabled"
                                       type="checkbox"
                                       defaultChecked={true}
                                />
                            </div>
                            <div className="d-flex flex-row mb-3 align-items-center">
                                <div className="p-2 flex-fill">
                                    {isValidOptionSelected ? (
                                        <label htmlFor="promptName" className="form-label float-start pe-2">Choose prompt: </label>
                                    ) : (
                                        <label htmlFor="promptName" className="form-label float-start pe-2 text-danger">Choose prompt: </label>
                                    )}
                                        <select onChange={handleOptionChange} value={selectedValue}
                                            id="promptName"
                                            className="input-group-sm"
                                            >
                                            <option value="">Select a prompt template..</option>
                                            <option value="LLAMA2">LLAMA 2 Instruct</option>
                                            <option value="LLAMA3">LLAMA 3 Instruct</option>
                                            <option value="SystemUserAssistant">System User Assistant</option>
                                            <option value="UserAssistantDeepSeek">User Assistant Deep Seek</option>
                                        </select>


                                </div>
                                <div className="p-2 flex-fill">
                                    <label htmlFor="filePath" className="form-label float-start pe-2">Current
                                        llama-cli
                                        settings:</label>
                                    <input
                                        readOnly={true}
                                        type="text"
                                        id="description"
                                        name="description"
                                        value={cliState.Description}
                                        className="w-50 input-group-sm"
                                    />
                                </div>
                                <div className="p-2 flex-fill">
                                    <Button
                                        variant="btn btn-primary float-start"
                                        type="submit"
                                        id="submit"
                                        onClick={handleClick}
                                    >
                                        Change settings
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </form>
    </>);
};

export default Home;
