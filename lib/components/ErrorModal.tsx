import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { errorModalMessage } from "../utils/messages";

interface ErrorModalContentsProps {
  error: Error | null;
  message?: string;
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
        {props.message && (
          <Form.Text className="d-flex justify-content-center">
            <b className="onyx-text-pink">{props.message}</b>
          </Form.Text>
        )}
        <Form.Text className="d-flex justify-content-center">
          {errorModalMessage}
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
      animation={false}
      show={props.show}
      onHide={props.onHide}
    >
      <Modal.Header closeButton>
        <Modal.Title>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ErrorModalContents {...props} />
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
