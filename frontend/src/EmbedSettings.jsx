import {useState} from "react";
import {Button, Card, Form, InputGroup, Tab, Tabs} from "react-bootstrap";

import {DocumentParserSettings} from "./DocumentParserSettings.jsx";
import {QueryCSVForm} from "./QueryCSVForm.jsx";
import {QueryTextForm} from "./QueryTextForm.jsx";


const EmbedSettings = () => {
    let out = ''
    let PromptText = ''
    const [key, setKey] = useState('query-embed');

    const handleSubmit = (event) => {
        event.preventDefault();

    }

    return (
        <div className="h-100" style={{
            overflowY: "auto"
        }}>
            <Tabs
                id="controlled-tab-example"
                activeKey={key}
                onSelect={(k) => setKey(k)}
                className="mb-3"
            >
                <Tab eventKey="query-embed" title="Query Embedding">
                    <div className="overflow-y-scroll">
                        <div className="d-flex flex-column flex-fill">
                            <p style={{whiteSpace: "pre-wrap", height: "50vh"}}
                               className="font-monospace fw-medium lh-small">{out}</p>
                        </div>
                        <div className="d-flex p-2 flex-column justify-content-end">
                            <Form onSubmit={handleSubmit}>
                                <Card className="w-100 rounded shadow-lg">
                                    <Card.Body>
                                        <span className="badge">Query</span>
                                        <InputGroup hasValidation>
                                            <Form.Control
                                                required
                                                as="textarea"
                                                rows={10}
                                                value={PromptText}
                                                id="PromptText"
                                                name="PromptText"
                                                className="form-control"
                                                maxLength={50000}
                                                minLength={1}
                                                aria-label=""
                                                aria-describedby="button-addon2"
                                            />
                                            <Button

                                                variant="btn btn-primary"
                                                type="submit"
                                                id="submit"
                                            >
                                                <i className="bi bi-search"></i>
                                            </Button>

                                        </InputGroup>
                                    </Card.Body>
                                </Card>
                            </Form>
                        </div>
                    </div>
                </Tab>
                <Tab eventKey="text-query" title="Query Text">
                    <div className="container">
                        <QueryTextForm/>
                    </div>
                </Tab>
                <Tab eventKey="csv-query" title="Query CSV">
                    <div className="container">
                        <QueryCSVForm/>
                    </div>
                </Tab>
                <Tab eventKey="doc-parser" title="Document parser">
                    <div className="container">
                        <DocumentParserSettings/>
                    </div>
                </Tab>
            </Tabs>
        </div>
    );
};

export default EmbedSettings;