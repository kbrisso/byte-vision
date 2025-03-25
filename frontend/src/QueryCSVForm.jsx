import {useState, useEffect} from 'react';
import {Card, Button} from 'react-bootstrap';

import {QueryCSVEmbeddingWithCancel} from "../wailsjs/go/main/App.js";
import {LogError} from "../wailsjs/runtime/runtime.js";

import {useLlamaEmbedSettings} from "./LlamaEmbedSettingsContextHooks.jsx";
import {useLlamaCliSettings} from "./LlamaCliSettingsContextHooks.jsx";


const INITIAL_FORM_STATE = {
    dbPath: '',
    reportTemplatePath: '',
    reportDataPath: '',
    queryField: '',
    queryValue: '',
    tableList: [''],
    whereKey: ''
};

const OUTPUT_STYLES = {
    preWrap: {whiteSpace: "pre-wrap", height: "50vh"}
};

const useLocalStorage = (key, initialValue) => {
    const loadFromStorage = () => {
        const saved = window.localStorage.getItem(key);
        return saved ? JSON.parse(saved) : initialValue;
    };

    const saveToStorage = (data) => {
        window.localStorage.setItem(key, JSON.stringify(data));
    };

    return [loadFromStorage, saveToStorage];
};

const QueryOutput = ({content}) => (<div className="overflow-y-scroll">
        <p style={OUTPUT_STYLES.preWrap} className="font-monospace fw-medium lh-small">
            {content}
        </p>
    </div>);

const FormInput = ({label, name, value, onChange, className = "w-100"}) => (<div className="col">
        <label className="w-auto form-label">{label}</label>
        <input
            className={`${className} form-control form-control-sm`}
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            minLength={1}
        />
    </div>);

const useFormHandlers = (initialState, onSave) => {
    const [formData, setFormData] = useState(initialState);

    const handleChange = (e) => {
        const {name, value} = e.target;
        const newData = {...formData, [name]: value};
        setFormData(newData);
        onSave(newData);
    };

    const handleTableListChange = (e) => {
        const tables = e.target.value.split(',').map(table => table.trim());
        const newData = {...formData, tableList: tables};
        setFormData(newData);
        onSave(newData);
    };

    return {formData, setFormData, handleChange, handleTableListChange};
};

export const QueryCSVForm = () => {
    const [queryOutput, setQueryOutput] = useState("");
    const embedSettings = useLlamaEmbedSettings();
    const cliSettings = useLlamaCliSettings();
    const [loadStorage, saveStorage] = useLocalStorage('state', INITIAL_FORM_STATE);

    const {
        formData,
        setFormData,
        handleChange,
        handleTableListChange
    } = useFormHandlers(INITIAL_FORM_STATE, saveStorage);

    useEffect(() => {
        const savedState = loadStorage();
        if (savedState) {
            setFormData(savedState);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await QueryCSVEmbeddingWithCancel(cliSettings, embedSettings, formData.dbPath, formData.reportTemplatePath, formData.reportDataPath, formData.whereKey, formData.queryField, formData.queryValue, formData.tableList);
            setQueryOutput(result);
        }catch (error){
            LogError(error)
        }
    };

    return (<div className="d-flex flex-column flex-fill w-100">
            <QueryOutput content={queryOutput}/>
            <div className="d-flex flex-column w-100">
                <Card className="shadow rounded">
                    <Card.Body>
                        <Card.Title>CSV Query configuration</Card.Title>
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <FormInput
                                    label="Database path:"
                                    name="dbPath"
                                    value={formData.dbPath}
                                    onChange={handleChange}
                                />
                                <FormInput
                                    label="Report template path:"
                                    name="reportTemplatePath"
                                    value={formData.reportTemplatePath}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="row">
                                <FormInput
                                    label="Report data path:"
                                    name="reportDataPath"
                                    value={formData.reportDataPath}
                                    onChange={handleChange}
                                />
                                <FormInput
                                    label="Query field:"
                                    name="queryField"
                                    value={formData.queryField}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="row">
                                <div className="col">
                                    <div className="row">
                                        <FormInput
                                            label="Query value"
                                            name="queryValue"
                                            value={formData.queryValue}
                                            onChange={handleChange}
                                        />
                                        <FormInput
                                            label="Table List (comma-separated)"
                                            name="tableList"
                                            value={formData.tableList.join(', ')}
                                            onChange={handleTableListChange}
                                        />
                                    </div>
                                </div>
                                <FormInput
                                    label="Where Key"
                                    name="whereKey"
                                    value={formData.whereKey}
                                    onChange={handleChange}
                                    className="w-50"
                                />
                            </div>
                            <div className="w-100 p-2">
                                <Button variant="primary" type="submit" className="float-end">
                                    Submit Query
                                </Button>
                            </div>
                        </form>
                    </Card.Body>
                </Card>
            </div>
        </div>);
};