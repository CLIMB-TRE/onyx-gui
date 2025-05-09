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
        {`Are you sure you want to remove all ${props.item.toLowerCase()}?`}
        <br />
        <strong>This action cannot be undone.</strong>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={props.onHide}>
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
