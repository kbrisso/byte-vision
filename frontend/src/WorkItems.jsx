import {useEffect, useState} from "react";
import {Form, Button, Modal, Tab, Table, Tabs} from "react-bootstrap";
import DOMPurify from 'dompurify';

import {GetWorkItems, WorkItemsDiff} from "../wailsjs/go/main/App.js";
import {LogError} from "../wailsjs/runtime/runtime.js";


const WorkItems = () => {
    const [workItems, setWorkItems] = useState([]);
    const [key, setKey] = useState('inference-history');
    const [selectedItems, setSelectedItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [diffResult, setDiffResult] = useState('');
    const [diffOption, setDiffOption] = useState('completion');
    const [diffItemOne, setDiffItemOne] = useState('');
    const [diffItemTwo, setDiffItemTwo] = useState('');
    const optionToProperty = {
        completion: 'completion',
        prompt: 'prompt',
        args: 'args'
    };


    useEffect(() => {

        const fetchData = async () => {
            try {
                const workItems = await GetWorkItems();
                setWorkItems(JSON.parse(workItems));
            } catch (error) {
                LogError(error)
            }
        };

        fetchData().then();

    }, [])

    const handleClose = () => setShowModal(false);

    function cleanData(diffResult) {
        return new Promise((resolve) => {
            resolve(diffResult)
                return diffResult
                    .replace(/[{}]/g, '')                              // Remove curly braces
                    .replace(/<span.*?>/g, '')
                    .replace(/<\/span>/g, '') // Remove span tags
                    .replace(/\\r\\n/g, ' ')
                    .replace(/\r\n/g, ' ')
                    .replace(/\\/g, '')
                    .trim();

        });
    }

    function cleanDiffResult(diffResult) {
        return diffResult
            .replace(/[{}]/g, '')                              // Remove curly braces
            .replace(/<span.*?>/g, '')
            .replace(/<\/span>/g, '') // Remove span tags
            .replace(/\\r\\n/g, ' ')
            .replace(/\r?\n/g, ' ')
            .replace(/\\/g, '')
            .trim();
    }

    const handleCheckboxChange = (idx) => {
        setSelectedItems(prevSelected => {
            // If already selected, remove it
            if (prevSelected.includes(idx)) {
                return prevSelected.filter(id => id !== idx);
            }
            // If less than 2 items are selected, add new item
            if (prevSelected.length < 2) {
                return [...prevSelected, idx];
            }
            // If already 2 items selected, replace the first one
            return [prevSelected[1], idx];
        });
    };

    const handleSendSelected = async () => {
            try {
                const selectedRecords = workItems.filter(item => selectedItems.includes(item.idx));
                const property = optionToProperty[diffOption];



                WorkItemsDiff(JSON.stringify(selectedRecords[0]?.[property]), JSON.stringify(selectedRecords[1]?.[property]))
                    .then((diffResult) => {
                        cleanData(diffResult).then(result => {
                            setDiffResult(result);
                            cleanData(selectedRecords[0]?.[property]).then(result => {
                                setDiffItemOne(result);
                            })
                           cleanData(selectedRecords[1]?.[property]).then(result => {
                               setDiffItemTwo(result);
                           })

                        })
                        setShowModal(true);
                    })
                    .catch((error) => {
                        LogError(error);
                    });
            }catch (error) {
                LogError(error);
            }
    };
    const DiffOptionsSelector = () => {
        return (
            <Form>
                <Form.Group className="form-check-inline">
                    <Form.Check className="form-check-inline"
                        type="radio"
                        id="completion"
                        name="diffOption"
                        label="Diff Completion"
                        value="completion"
                        checked={diffOption === 'completion'}
                        onChange={(e) => setDiffOption(e.target.value)}
                    />
                    <Form.Check className="form-check-inline"
                        type="radio"
                        id="prompt"
                        name="diffOption"
                        label="Diff Prompt"
                        value="prompt"
                        checked={diffOption === 'prompt'}
                        onChange={(e) => setDiffOption(e.target.value)}
                    />
                    <Form.Check className="form-check-inline"
                        type="radio"
                        id="args"
                        name="diffOption"
                        label="Diff Args"
                        value="args"
                        checked={diffOption === 'args'}
                        onChange={(e) => setDiffOption(e.target.value)}
                    />
                </Form.Group>
            </Form>
        );
    };

    const ResultModal = () => {
        return (
            <Modal
                show={showModal}
                onHide={handleClose}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Comparison Result</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="alert alert-light" role="alert">
                        {diffItemOne}
                    </div>
                    <div className="alert alert-light" role="alert">
                        {diffItemTwo}
                    </div>


                    <div
                        className="overflow-auto"
                        style={{
                            maxHeight: "70vh",
                            whiteSpace: "pre-wrap",
                            fontFamily: "monospace",
                            fontWeight: "fst-normal",
                        }}

                        dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(diffResult, {USE_PROFILES: {html: true}})}}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    };

    const TaskHistoryTable = ({data}) => {
        return (<>
                <Table  table-sm striped bordered hover>
                    <thead>
                    <tr>
                        <th></th>
                        <th>#</th>
                        <th>Prompt</th>
                        <th>Completion</th>
                        <th>Args</th>
                        <th>Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((row) => (<tr key={row.idx}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(row.idx)}
                                    onChange={() => handleCheckboxChange(row.idx)}
                                    disabled={selectedItems.length >= 2 && !selectedItems.includes(row.idx)}
                                />
                            </td>
                            <td>{row.idx}</td>
                            <td className="w-25">{row.prompt}</td>
                            <td className="w-25">
                                <div className="overflow-y-scroll"
                                    style={{height: "250px", whiteSpace: "pre-wrap"}}>
                                    {row.completion}
                            </div></td>
                            <td>
                                <div className="overflow-y-scroll"
                                     style={{height: "250px", whiteSpace: "pre-wrap"}}>
                                    {cleanDiffResult(row.args)}
                                </div>
                            </td>
                            <td>{row.date}</td>
                        </tr>))}

                    </tbody>
                </Table>
                <div className="mb-3">
                    <Button
                        variant="primary"
                        onClick={handleSendSelected}
                        disabled={selectedItems.length !== 2}
                    >
                        Send Selected Records ({selectedItems.length}/2)
                    </Button>
                    <DiffOptionsSelector/>
                </div>
            <ResultModal />
        </>);
    };


    return (<div className="h-auto" style={{
            overflowY: "auto"
        }}>
            <Tabs
                id="controlled-tab-example"
                activeKey={key}
                onSelect={(k) => setKey(k)}
                className="mb-3"
            >

                <Tab eventKey="inference-history" title="Inference history">
                    <div className="container">
                        <TaskHistoryTable data={workItems}/>
                    </div>
                </Tab>
                <Tab eventKey="query-text-history" title="Query text history">
                    <div className="container">

                    </div>
                </Tab>
                <Tab eventKey="query-csv-history" title="Query csv history">
                    <div className="container">

                    </div>
                </Tab>
            </Tabs>
        </div>);
};

export default WorkItems;