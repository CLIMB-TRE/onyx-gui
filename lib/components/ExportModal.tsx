import { useState, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Stack from "react-bootstrap/Stack";
import Spinner from "react-bootstrap/Spinner";
import { ExportHandlerProps } from "../interfaces";
import { ExportStatus } from "../types";
import { ErrorModalContents } from "./ErrorModal";

interface ExportModalProps {
  show: boolean;
  onHide: () => void;
  defaultFileNamePrefix: string;
  fileExtension: string;
  exportProgressMessage: string;
  handleExport: (exportProps: ExportHandlerProps) => void;
}

function useExportStatusToken() {
  const statusRef = useRef({ status: ExportStatus.READY });
  const cancelExport = () =>
    (statusRef.current.status = ExportStatus.CANCELLED);
  const readyExport = () => (statusRef.current.status = ExportStatus.READY);
  return {
    statusToken: statusRef.current,
    readyExport,
    cancelExport,
  };
}

function isInvalidPrefix(prefix: string) {
  return (
    // Prefix must begin and end with alphanumeric, underscore or dash characters
    !/^[a-zA-Z0-9_-]+$/.test(prefix.trim()) ||
    // Prefix must be 5 to 50 characters long
    prefix.trim().length < 5 ||
    prefix.trim().length > 50
  );
}

function ExportModal(props: ExportModalProps) {
  const [exportStatus, setExportStatus] = useState(ExportStatus.READY);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<Error | null>(null);
  const [fileNamePrefix, setFileNamePrefix] = useState("");
  const [fileNameIsInvalid, setFileNameIsInvalid] = useState(false);
  const { statusToken, readyExport, cancelExport } = useExportStatusToken();

  const handleExportRunning = () => {
    const prefix = fileNamePrefix
      ? fileNamePrefix
      : props.defaultFileNamePrefix;

    if (isInvalidPrefix(prefix)) {
      setFileNameIsInvalid(true);
      return;
    } else setFileNameIsInvalid(false);

    setExportProgress(0);
    setExportError(null);
    readyExport();
    props.handleExport({
      fileName: prefix + props.fileExtension,
      statusToken,
      setExportStatus,
      setExportProgress,
      setExportError,
    });
  };

  const handleExportCancel = () => {
    cancelExport();
    setExportStatus(ExportStatus.CANCELLED);
  };

  const handleFileNamePrefixChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFileNameIsInvalid(false);
    setFileNamePrefix(e.target.value);
  };

  return (
    <Modal
      className="onyx-modal"
      centered
      animation={false}
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
              value={fileNamePrefix}
              placeholder={props.defaultFileNamePrefix}
              onChange={handleFileNamePrefixChange}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  props.defaultFileNamePrefix.startsWith(fileNamePrefix)
                )
                  setFileNamePrefix(props.defaultFileNamePrefix);
              }}
              isInvalid={fileNameIsInvalid}
            />
            <InputGroup.Text>{props.fileExtension}</InputGroup.Text>
            <Form.Control.Feedback type="invalid">
              Prefix must be 5 to 50 alphanumeric, underscore or dash
              characters.
            </Form.Control.Feedback>
            <Form.Text muted>
              <span>
                <b>Warning:</b> If the file already exists, it will be
                overwritten.
              </span>
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
        {exportStatus === ExportStatus.ERROR && (
          <ErrorModalContents error={exportError} />
        )}
        {exportStatus === ExportStatus.WRITING && (
          <Form.Group className="mb-3">
            <Form.Label className="d-flex justify-content-center">
              <Stack direction="horizontal" gap={2}>
                <Spinner />
                <span>Writing File...</span>
              </Stack>
            </Form.Label>
          </Form.Group>
        )}
        {exportStatus === ExportStatus.FINISHED && (
          <Form.Group className="mb-3">
            <Form.Label className="d-flex justify-content-center">
              Export Finished.
            </Form.Label>
            <Form.Text className="d-flex justify-content-center">
              <span>
                File Name:{" "}
                <b>
                  {(fileNamePrefix
                    ? fileNamePrefix
                    : props.defaultFileNamePrefix) + props.fileExtension}
                </b>
              </span>
            </Form.Text>
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
        {(exportStatus === ExportStatus.CANCELLED ||
          exportStatus === ExportStatus.ERROR) && (
          <Button
            variant="primary"
            onClick={() => setExportStatus(ExportStatus.READY)}
          >
            Retry
          </Button>
        )}
        {(exportStatus === ExportStatus.WRITING ||
          exportStatus === ExportStatus.FINISHED) && (
          <Button variant="primary" onClick={props.onHide}>
            Done
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default ExportModal;
