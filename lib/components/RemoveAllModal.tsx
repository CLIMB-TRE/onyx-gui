import { Stack } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

interface RemoveAllModalProps {
  show: boolean;
  onHide: () => void;
  item: string;
  handleRemove: () => void;
}

function RemoveAllModal(props: RemoveAllModalProps) {
  return (
    <Modal
      className="onyx-modal"
      centered
      show={props.show}
      onHide={props.onHide}
    >
      <Modal.Header closeButton>
        <Modal.Title>{`Remove All ${props.item}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <Stack gap={1}>
          {`Are you sure you want to remove all ${props.item.toLowerCase()}?`}
          <b>This action cannot be undone.</b>
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onHide}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            props.handleRemove();
            props.onHide();
          }}
        >
          Remove All
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RemoveAllModal;
