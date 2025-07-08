import { useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Modal from "react-bootstrap/Modal";
import ProgressBar from "react-bootstrap/ProgressBar";
import Stack from "react-bootstrap/Stack";
import { ExportHandlerProps } from "../interfaces";
import { BaseSpinner } from "./QueryHandler";
import { ExportStatus } from "../types";
import { ErrorModalContents } from "./ErrorModal";
import { defaultExportProgressMessage } from "../utils/messages";
import ContainerModal from "./ContainerModal";

interface ExportModalProps {
  show: boolean;
  onHide: () => void;
  defaultFileNamePrefix: string;
  defaultFileExtension: string;
  fileExtensions?: string[];
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
  const [exportProgressMessage, setExportProgressMessage] = useState(
    defaultExportProgressMessage
  );
  const [exportError, setExportError] = useState<Error | null>(null);
  const [fileNamePrefix, setFileNamePrefix] = useState("");
  const [fileNameIsInvalid, setFileNameIsInvalid] = useState(false);
  const [fileExtension, setFileExtension] = useState(
    props.defaultFileExtension
  );
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
    setExportProgressMessage(defaultExportProgressMessage);
    setExportError(null);
    readyExport();
    props.handleExport({
      fileName: prefix + fileExtension,
      statusToken,
      setExportStatus,
      setExportProgress,
      setExportProgressMessage,
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
    <ContainerModal
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
            {props.fileExtensions ? (
              <DropdownButton variant="secondary" title={fileExtension}>
                {props.fileExtensions?.map((ext) => (
                  <Dropdown.Item
                    key={ext}
                    onClick={() => setFileExtension(ext)}
                  >
                    {ext}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
            ) : (
              <InputGroup.Text>{fileExtension}</InputGroup.Text>
            )}
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
              {exportProgressMessage}
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
                <BaseSpinner delay={0}>
                  <span>Writing File...</span>
                </BaseSpinner>
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
                    : props.defaultFileNamePrefix) + fileExtension}
                </b>
              </span>
            </Form.Text>
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onHide}>
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
    </ContainerModal>
  );
}

export default ExportModal;
