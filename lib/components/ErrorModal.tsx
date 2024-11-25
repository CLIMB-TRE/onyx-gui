import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";

interface ErrorModalContentsProps {
  error: Error | null;
}

interface ErrorModalProps extends ErrorModalContentsProps {
  show: boolean;
  onHide: () => void;
  title: string;
}

function ErrorModalContents(props: ErrorModalContentsProps) {
  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label className="d-flex justify-content-center">
          Error Occurred.
        </Form.Label>
        <Form.Text className="d-flex justify-content-center">
          Please try again or contact CLIMB-TRE support if the problem persists.
        </Form.Text>
      </Form.Group>
      <Accordion>
        <Accordion.Item eventKey="0">
          <Accordion.Header>View Error Message</Accordion.Header>
          <Accordion.Body>
            <small className="onyx-text-pink font-monospace">
              {props.error
                ? `${props.error.name}: ${props.error.message}`
                : "No error message."}
            </small>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </Form>
  );
}

function ErrorModal(props: ErrorModalProps) {
  return (
    <Modal
      className="onyx-modal"
      centered
      show={props.show}
      onHide={props.onHide}
    >
      <Modal.Header closeButton>
        <Modal.Title>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ErrorModalContents error={props.error} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={props.onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ErrorModal;
export { ErrorModalContents };
