import { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';

import {QueryCSVEmbeddingWithCancel} from "../wailsjs/go/main/App.js";

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

const FormInput = ({ label, name, value, onChange, className = "w-100" }) => (
    <div className="col">
        <label className="w-auto form-label">{label}</label>
        <input
            className={`${className} form-control form-control-sm`}
            type="text"
            name={name}
            value={value}
            onChange={onChange}
        />
    </div>
);

export const QueryCSVForm = () => {
    const [out, setOut] = useState("");
    const embedState = useLlamaEmbedSettings();
    const cliState = useLlamaCliSettings();
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    useEffect(() => {
        const savedState = JSON.parse(window.localStorage.getItem('state'));
        if (savedState) {
            setFormData(savedState);
        }
    }, []);

    const saveToLocalStorage = (data) => {
        window.localStorage.setItem('state', JSON.stringify(data));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFormData = {
            ...formData,
            [name]: value
        };
        setFormData(newFormData);
        saveToLocalStorage(newFormData);
    };

    const handleTableListChange = (e) => {
        const tables = e.target.value.split(',').map(table => table.trim());
        const newFormData = {
            ...formData,
            tableList: tables
        };
        setFormData(newFormData);
        saveToLocalStorage(newFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await QueryCSVEmbeddingWithCancel(
            cliState,
            embedState,
            formData.dbPath,
            formData.reportTemplatePath,
            formData.reportDataPath,
            formData.whereKey,
            formData.queryField,
            formData.queryValue,
            formData.tableList
        );
        setOut(result);
        console.log(result);
    };

    return (
        <div className="d-flex flex-column flex-fill">
            <div className="overflow-y-scroll">
                <p style={{ whiteSpace: "pre-wrap", height: "50vh" }}
                   className="font-monospace fw-medium lh-small">
                    {out}
                </p>
            </div>
            <div className="d-flex flex-column w-100">
                <Card>
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
                            <div className="w-100">
                                <Button variant="primary" type="submit" className="float-end">
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

