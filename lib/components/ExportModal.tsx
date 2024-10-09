import { useState, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import { DataProps } from "../interfaces";
import { ExportStatus } from "../types";

interface ExportModalProps extends DataProps {
  show: boolean;
  onHide: () => void;
  defaultFileNamePrefix: string;
  fileExtension: string;
  exportProgressMessage: string;
  handleExport: (
    fileName: string,
    statusToken: { status: ExportStatus },
    setExportProgress: (exportProgress: number) => void,
    setExportStatus: (exportStatus: ExportStatus) => void
  ) => void;
}

function useExportStatusToken() {
  const statusRef = useRef({ status: ExportStatus.READY });
  const cancelExport = () =>
    (statusRef.current.status = ExportStatus.CANCELLED);
  const readyExport = () => (statusRef.current.status = ExportStatus.READY);
  return {
    statusToken: statusRef.current,
    cancelExport,
    readyExport,
  };
}

function ExportModal(props: ExportModalProps) {
  const [exportStatus, setExportStatus] = useState(ExportStatus.READY);
  const [exportProgress, setExportProgress] = useState(0);
  const [fileNamePrefix, setFileNamePrefix] = useState(
    props.defaultFileNamePrefix
  );
  const { statusToken, readyExport, cancelExport } = useExportStatusToken();

  const handleExportRunning = () => {
    setExportProgress(0);
    readyExport();
    setExportStatus(ExportStatus.RUNNING);
    props.handleExport(
      fileNamePrefix.trim().replace(/\.csv$/, ""),
      statusToken,
      setExportProgress,
      setExportStatus
    );
  };

  const handleExportCancel = () => {
    cancelExport();
    setExportStatus(ExportStatus.CANCELLED);
  };

  return (
    <Modal
      centered
      show={props.show}
      onHide={props.onHide}
      onExited={() => {
        if (
          exportStatus === ExportStatus.FINISHED ||
          exportStatus === ExportStatus.CANCELLED
        )
          setExportStatus(ExportStatus.READY);
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Export Data</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {exportStatus === ExportStatus.READY && (
          <InputGroup className="mb-3">
            <InputGroup.Text>File Name</InputGroup.Text>
            <Form.Control
              placeholder={`${props.defaultFileNamePrefix}`}
              onChange={(e) => setFileNamePrefix(e.target.value)}
            />
            <InputGroup.Text>{props.fileExtension}</InputGroup.Text>
            <Form.Text muted>
              <b>Warning:</b> If the file already exists, it will be
              overwritten.
            </Form.Text>
          </InputGroup>
        )}
        {exportStatus === ExportStatus.RUNNING && (
          <Form.Group className="mb-3">
            <Form.Label className="d-flex justify-content-center">
              {props.exportProgressMessage}
            </Form.Label>
            <ProgressBar now={exportProgress} />
          </Form.Group>
        )}
        {exportStatus === ExportStatus.CANCELLED && (
          <Form.Group className="mb-3">
            <Form.Label className="d-flex justify-content-center">
              Cancelled Operation.
            </Form.Label>
            <ProgressBar now={exportProgress} variant="danger" />
          </Form.Group>
        )}
        {exportStatus === ExportStatus.FINISHED && (
          <Form.Group className="mb-3">
            <Form.Label className="d-flex justify-content-center">
              Export Finished.
            </Form.Label>
            <ProgressBar now={exportProgress} />
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={props.onHide}>
          Close
        </Button>
        {exportStatus === ExportStatus.READY && (
          <Button variant="primary" onClick={handleExportRunning}>
            Export
          </Button>
        )}
        {exportStatus === ExportStatus.RUNNING && (
          <Button variant="danger" onClick={handleExportCancel}>
            Cancel
          </Button>
        )}
        {exportStatus === ExportStatus.CANCELLED && (
          <Button
            variant="primary"
            onClick={() => setExportStatus(ExportStatus.READY)}
          >
            Retry
          </Button>
        )}
        {exportStatus === ExportStatus.FINISHED && (
          <Button variant="primary" onClick={props.onHide}>
            Done
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default ExportModal;
