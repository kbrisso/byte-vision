import {useState} from "react";
import {  Tab, Tabs} from "react-bootstrap";

import {DocumentParserSettings} from "./DocumentParserSettings.jsx";
import {QueryCSVForm} from "./QueryCSVForm.jsx";
import {QueryTextForm} from "./QueryTextForm.jsx";


const EmbedSettings = () => {
   
    const [key, setKey] = useState('text-query');
 
    return (
        <div className="h-auto" style={{
            overflowY: "auto"
        }}>
            <Tabs
                id="controlled-tab-example"
                activeKey={key}
                onSelect={(k) => setKey(k)}
                className="mb-3"
            >
               
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