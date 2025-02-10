import {Button, Card, Form, InputGroup} from "react-bootstrap";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";


import {GenerateCompletion} from "../wailsjs/go/main/App.js";

import {useLlamaCliSettings, useLlamaCliSettingsDispatch} from "./LlamaCliSettingsContextHooks.jsx";
import {initState} from "./Common.jsx";



export const  Home = () => {
    useEffect(() => {
        (async () => {
            await initState();
        })();
        } , []);

    const [out, setOut] = useState("");
    const cliState = useLlamaCliSettings();
    const llamaCliDispatch = useLlamaCliSettingsDispatch();
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/Settings'); // Replace '/about' with the desired path
    };

    const handleChange = (field, value) => {
        llamaCliDispatch({
            type: "SET_FIELD", field, value,
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        GenerateCompletion(cliState).then((val) => {
            setOut(val);
        });
    }
    return (
        <>
            <div className="d-flex vh-100 overflow-y-scroll"><p style={{whiteSpace: "pre-wrap"}}
                                                                className="font-monospace fw-medium lh-small">{out}</p>
            </div>
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
                                <Button
                                    variant="btn btn-primary"
                                    type="submit"
                                    id="submit"
                                >
                                    <i className="bi bi-search"></i>
                                </Button>

                            </InputGroup>
                            <div className="pt-2">
                                <div className="d-flex flex-row mb-3 align-items-center">
                                    <div className="p-2 flex-fill">
                                        <label htmlFor="filePath" className="form-label float-start pe-2">Choose prompt
                                            type:</label>
                                        <select className="w-auto input-group-sm">
                                            <option value="pdf">PDF</option>
                                            <option value="text">Text</option>
                                            <option value="text">CSV</option>
                                        </select>
                                    </div>
                                    <div className="p-2 flex-fill">
                                        <label htmlFor="filePath" className="form-label float-start pe-2">Current
                                            llama-cli
                                            settings:</label>
                                        <input
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
        </>
    );
};

export default Home;
