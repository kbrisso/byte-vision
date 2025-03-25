import {useEffect, useState} from 'react';
import {Tab, Tabs} from "react-bootstrap";

import {GetAppLogFile, GetCurrentModelLogFile, GetCurrentEmbedModelLogFile} from "../wailsjs/go/main/App.js";

import {useLlamaEmbedSettings} from "./LlamaEmbedSettingsContextHooks.jsx";
import {useLlamaCliSettings} from "./LlamaCliSettingsContextHooks.jsx"
import {useAppSettings} from "./AppSettingsContextHooks.jsx";
import {LlamaCliSettingsForm} from './LlamaCliSettings.jsx';
import {LlamaEmbedSettingsForm} from './LlamaEmbedSettings.jsx';


const Settings = () => {
    const embedState = useLlamaEmbedSettings();
    const cliState = useLlamaCliSettings()
    const appState = useAppSettings();
    const [modelLog, setModelLog] = useState("");
    const [embedModelLog, setEmbedModelLog] = useState("");
    const [appLog, setAppLog] = useState("");
    const [key, setKey] = useState('llama-cli');


    useEffect(() => {
        if (appState.AppLogFileName.length) {
            GetAppLogFile(appState.AppLogPath + appState.AppLogFileName).then((result) => {
                setAppLog(result);

            })
        }
        if (cliState.ModelLogFileNameVal.length) {
            GetCurrentModelLogFile(cliState.ModelLogFileNameVal).then((result) => {
                setModelLog(result);
            })
        }
        if (embedState.EmbedModelLogFileNameVal.length) {
            GetCurrentEmbedModelLogFile(embedState.EmbedModelLogFileNameVal).then((result) => {
                setEmbedModelLog(result);
            })
        }
    }, []);

    const refreshAppLog = () => {
        if (appState.AppLogFileName.length) {
            GetAppLogFile(appState.AppLogPath + appState.AppLogFileName).then((result) => {
                setAppLog(result);

            })
        }
    }
    const refreshModelLog = () => {
        if (cliState.ModelLogFileNameVal.length) {
            GetCurrentModelLogFile(cliState.ModelLogFileNameVal).then((result) => {
                setModelLog(result);
            })
        }
    }
    const refreshEmbedModelLog = () => {
        if (embedState.EmbedModelLogFileNameVal.length) {
            GetCurrentEmbedModelLogFile(embedState.EmbedModelLogFileNameVal).then((result) => {
                setEmbedModelLog(result);
            })
        }
    }


    return (<>
        <div className="h-auto" style={{
            overflowY: "auto"
        }}>
            <Tabs
                id="controlled-tab-example"
                activeKey={key}
                onSelect={(k) => setKey(k)}
                className="mb-3"
            >
                <Tab eventKey="llama-cli" title="llama-cli settings">
                    <div className="container">
                        <LlamaCliSettingsForm cliState={cliState} appState={appState}/>
                    </div>

                </Tab>
                <Tab eventKey="llama-embed" title="llama-embed settings">
                    <div className="container">
                        <LlamaEmbedSettingsForm embedState={embedState} appState={appState}/>
                    </div>
                </Tab>
                <Tab eventKey="model-log" title="Inference model log">
                    <div className="row w-100 p-2">
                        <div className="col w-100 float-end">
                            <button id="refreshModelLog" onClick={refreshModelLog}
                                    className="btn btn-primary  float-end">Refresh
                            </button>
                        </div>
                        <div className="d-flex vh-100 overflow-y-scroll"><p style={{whiteSpace: "pre-wrap"}}
                                                                            className="font-monospace fw-medium lh-small">{modelLog}</p>
                        </div>

                    </div>
                </Tab>
                <Tab eventKey="emded-model-log" title="Embedding model log">
                    <div className="row w-100 p-2">
                        <div className="col w-100 float-end">
                            <button id="refreshModelLog" onClick={refreshEmbedModelLog}
                                    className="btn btn-primary  float-end">Refresh
                            </button>
                        </div>
                        <div className="d-flex vh-100 overflow-y-scroll"><p style={{whiteSpace: "pre-wrap"}}
                                                                            className="font-monospace fw-medium lh-small">{embedModelLog}</p>
                        </div>

                    </div>
                </Tab>
                <Tab eventKey="app-log" title="App log">
                    <div className="row w-100 p-2">
                        <div className="col w-100 float-end">
                            <button id="refreshAppLog" onClick={refreshAppLog}
                                    className="btn btn-primary float-end">Refresh
                            </button>
                        </div>
                        <div className="d-flex vh-100 overflow-y-scroll"><p style={{whiteSpace: "pre-wrap"}}
                                                                            className="font-monospace fw-medium lh-small">{appLog}</p>
                        </div>
                    </div>
                </Tab>
            </Tabs>


        </div>
    </>);
};

export default Settings;
