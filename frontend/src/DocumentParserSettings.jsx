import {useState, useEffect} from 'react';
import {Card} from 'react-bootstrap';

import {CreateEmbedding} from "../wailsjs/go/main/App.js";

import {useLlamaEmbedSettings} from "./LlamaEmbedSettingsContextHooks.jsx";
import {useLlamaCliSettings} from "./LlamaCliSettingsContextHooks.jsx";


const DOCUMENT_TYPES = {
    PDF: 'pdf', TEXT: 'text', CSV: 'csv'
};

const INITIAL_FORM_STATE = {
    filePath: '', dbPath: '', chunkSize: '', chunkOverlap: '', collectionName: '', metaData: '', metaDataKey: ''
};

const FormInput = ({label, id, type = 'text', value, onChange, className = 'w-50'}) => (<div className="mb-3">
    <label htmlFor={id} className="form-label pe-2">{label}:</label>
    <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className={`form-control form-control-sm ${className}`}
    />
</div>);

export const DocumentParserSettings = () => {
    const [processingOutput, setProcessingOutput] = useState('');
    const embedSettings = useLlamaEmbedSettings();
    const cliSettings = useLlamaCliSettings();
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [selectedDocType, setSelectedDocType] = useState(DOCUMENT_TYPES.PDF);

    useEffect(() => {
        const savedState = JSON.parse(window.localStorage.getItem('state'));
        if (savedState) {
            setFormData(savedState);
        }
    }, []);

    const handleFormChange = (e) => {
        const {name, value} = e.target;
        const updatedFormData = {
            ...formData, [name]: value
        };
        setFormData(updatedFormData);
        window.localStorage.setItem('state', JSON.stringify(updatedFormData));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const result = await CreateEmbedding(cliSettings, embedSettings, selectedDocType, formData.filePath, formData.dbPath, parseInt(formData.chunkSize), parseInt(formData.chunkOverlap), formData.collectionName, formData.metaData, formData.metaDataKey);
        setProcessingOutput(result);
    };

    return (<div className="align-items-centered-flex flex-column w-100">
        <Card>
            <Card.Body>
                <Card.Title>Document Parser Settings</Card.Title>
                <div className="flex-column w-100 align-content-center">
                    <form onSubmit={handleFormSubmit}>

                        <div className="mb-3">
                            <label htmlFor="documentType" className="form-label pe-2">Document type:</label>
                            <select
                                className="w-25 form-control form-control-sm"
                                value={selectedDocType}
                                onChange={(e) => setSelectedDocType(e.target.value)}
                            >
                                {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                                    <option key={value} value={value}>{key}</option>))}
                            </select>
                        </div>

                        <FormInput label="File path" id="filePath" value={formData.filePath}
                                   onChange={handleFormChange}/>
                        <FormInput label="DB path" id="dbPath" value={formData.dbPath}
                                   onChange={handleFormChange}/>
                        <FormInput label="Chunk size" id="chunkSize" type="number" value={formData.chunkSize}
                                   onChange={handleFormChange} className="w-25"/>
                        <FormInput label="Chunk overlap" id="chunkOverlap" type="number"
                                   value={formData.chunkOverlap} onChange={handleFormChange} className="w-25"/>
                        <FormInput label="Collection name" id="collectionName" value={formData.collectionName}
                                   onChange={handleFormChange} className="w-25"/>
                        <FormInput label="Meta data" id="metaData" value={formData.metaData}
                                   onChange={handleFormChange} className="w-25"/>
                        <FormInput label="Meta data key" id="metaDataKey" value={formData.metaDataKey}
                                   onChange={handleFormChange} className="w-25"/>
                        <div className="row w-100 p-2">
                            <div className="col w-100 float-end">
                                <button className="btn btn-primary float-end" type="submit">Start embedding</button>
                            </div>
                        </div>
                    </form>
                </div>
            </Card.Body>
        </Card>

    </div>);
};