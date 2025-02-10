import { useEffect, useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { QueryTextEmbeddingWithCancel } from "../wailsjs/go/main/App.js";
import { useLlamaEmbedSettings } from "./LlamaEmbedSettingsContextHooks.jsx";
import { useLlamaCliSettings } from "./LlamaCliSettingsContextHooks.jsx";

const INITIAL_FORM_STATE = {
    dbPath: '',
    reportDataPath: '',
    whereKey: '',
    queryField: '',
    queryValue: '',
    collection: ''
};

const FORM_FIELDS = [
    { name: 'dbPath', label: 'Database path:', colSpan: 12 },
    { name: 'collection', label: 'Collection name:', colSpan: 12 },
    { name: 'queryField', label: 'Query field:', colSpan: 12 },
    { name: 'queryValue', label: 'Query value', colSpan: 6 },
    { name: 'whereKey', label: 'Where Key', colSpan: 6 }
];

const FormInput = ({ name, label, value, onChange, colSpan }) => (
    <div className={`col-${colSpan}`}>
        <label className="w-auto form-label">{label}</label>
        <input
            className="w-100 form-control form-control-sm"
            type="text"
            name={name}
            value={value}
            onChange={onChange}
        />
    </div>
);

export const QueryTextForm = () => {
    const [queryResult, setQueryResult] = useState("");
    const embedSettings = useLlamaEmbedSettings();
    const cliSettings = useLlamaCliSettings();
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    useEffect(() => {
        const savedState = localStorage.getItem('state');
        if (savedState) {
            setFormData(JSON.parse(savedState));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const updatedFormData = { ...formData, [name]: value };
        setFormData(updatedFormData);
        localStorage.setItem('state', JSON.stringify(updatedFormData));
    };

    const handleQuerySubmit = async (e) => {
        console.log(embedSettings);
        console.log(cliSettings);
        e.preventDefault();
        const result = await QueryTextEmbeddingWithCancel(
            cliSettings,
            embedSettings,
            formData.dbPath,
            formData.collection,
            formData.whereKey,
            formData.queryField,
            formData.queryValue
        );
        setQueryResult(result);
        console.log(result);
    };

    return (
        <div className="d-flex flex-column flex-fill">
            <div className="overflow-y-scroll">
                <p style={{ whiteSpace: "pre-wrap", height: "50vh" }}
                   className="font-monospace fw-medium lh-small">
                    {queryResult}
                </p>
            </div>
            <div className="d-flex flex-column w-100">
                <Card>
                    <Card.Body>
                        <Card.Title>CSV Query configuration</Card.Title>
                        <form onSubmit={handleQuerySubmit}>
                            <div className="row">
                                {FORM_FIELDS.map(field => (
                                    <FormInput
                                        key={field.name}
                                        {...field}
                                        value={formData[field.name]}
                                        onChange={handleInputChange}
                                    />
                                ))}
                            </div>
                            <div className="w-100">
                                <Button variant="primary" className="float-end" type="submit">
                                    Submit Query
                                </Button>
                            </div>
                        </form>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};