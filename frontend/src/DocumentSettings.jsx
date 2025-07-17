import { useState } from "react";
import { Tab, Tabs } from "react-bootstrap";

import { DocumentParserSettings } from "./DocumentParserSettings.jsx";
import { DocumentOCRSettings } from "./DocumentOCRSettings.jsx";
import "../public/main.css";

const DocumentSettings = () => {
  const [activeTab, setActiveTab] = useState("parser");

  return (
    <div className="p-2">
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="parser" title="Document Parser">
          <DocumentParserSettings />
        </Tab>
        <Tab eventKey="ocr" title="OCR">
          <DocumentOCRSettings />
        </Tab>
      </Tabs>
    </div>
  );
};

export default DocumentSettings;
