import {Button, Modal} from "react-bootstrap";
import {useState} from "react";

function InferenceHelpIcon() {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <i onClick={handleShow} className="p-2 position-absolute top-0 end-0 bi bi-info-circle"></i>


            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Byte-Vision Help</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        This is the primary prompt screen for inference. You can modify the llama-cli settings by clicking the button or the settings icon. Default settings are applied at application startup and can be edited, duplicated, renamed, or saved as needed.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default InferenceHelpIcon;




