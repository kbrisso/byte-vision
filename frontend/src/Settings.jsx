import { useState } from "react";
import { Tab, Tabs } from "react-bootstrap";

import { LlamaCliSettingsForm } from "./LlamaCliSettingsForm.jsx";
import { LlamaEmbedSettingsForm } from "./LlamaEmbedSettingsForm.jsx";
import "../public/main.css";

const Settings = () => {
  const [key, setKey] = useState("cli");

  return (
    <div className="d-flex flex-column h-100 w-75 mt-2 p2">
      <Tabs
        id="controlled-tab-example"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3 w-100"
        style={{ flexShrink: 0 }}
      >
        <Tab eventKey="cli" title="llama-cli settings">
          <div
            className="w-100 border overflow-y-scroll"
            style={{ height: "100vh" }}
          >
            <LlamaCliSettingsForm />
          </div>
        </Tab>
        <Tab eventKey="embed" title="llama-embed settings">
          <div
            className="border w-100 overflow-y-scroll"
            style={{ height: "100vh" }}
          >
            <LlamaEmbedSettingsForm />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Settings;
