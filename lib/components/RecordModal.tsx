import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Toast from "react-bootstrap/Toast";
import Container from "react-bootstrap/Container";
import { useQuery } from "@tanstack/react-query";
import Table from "./Table";
import { DelayedLoadingAlert } from "./LoadingAlert";
import ErrorMessages from "./ErrorMessages";
import { ResultData, ResultType } from "../types";
import { DataProps } from "../interfaces";

interface RecordModalProps extends DataProps {
  recordID: string;
  show: boolean;
  onHide: () => void;
}

function RecordDataField({
  record,
  field,
  name,
}: {
  record: ResultType;
  field: string;
  name: string;
}) {
  return (
    <Row>
      <Col xs={6}>
        <h6>{name}:</h6>
      </Col>
      <Col xs={6}>
        <h6>
          <span className="onyx-text-pink">
            {record[field]?.toString() || ""}
          </span>
        </h6>
      </Col>
    </Row>
  );
}

function RecordData(props: RecordModalProps) {
  const [showExportToast, setShowExportToast] = useState(false);

  // Fetch record data, depending on project and record ID
  const {
    isFetching: recordDataPending,
    error: recordDataError,
    data: recordData = { data: {} },
  } = useQuery({
    queryKey: ["record-data", props.project, props.recordID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/${props.recordID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.recordID),
    staleTime: 1 * 60 * 1000,
  });

  const handleExportToJSON = () => {
    const jsonData = JSON.stringify(recordData.data);

    if (props.fileWriter) {
      setShowExportToast(true);
      props.fileWriter(props.recordID + ".json", jsonData);
    }
  };

  const formatTitle = (str: string) => {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const detailFields = Object.entries(recordData.data).filter(
    ([key]) => props.projectFields.get(key)?.type !== "relation"
  );

  const relationFields = Object.entries(recordData.data).filter(
    ([key]) => props.projectFields.get(key)?.type === "relation"
  );

  return recordDataPending ? (
    <DelayedLoadingAlert />
  ) : recordDataError ? (
    <Alert variant="danger">Error: {(recordDataError as Error).message}</Alert>
  ) : recordData.messages ? (
    <ErrorMessages messages={recordData.messages} />
  ) : (
    <Tab.Container
      id="left-tabs-example"
      defaultActiveKey="record-data-details"
    >
      <Row style={{ height: "100%" }}>
        <Col xl={2}>
          <Stack gap={1}>
            <Row>
              <Col xs={6} xl={12}>
                <hr />
                <Container>
                  <RecordDataField
                    record={recordData.data}
                    field="published_date"
                    name="Date"
                  />
                  <RecordDataField
                    record={recordData.data}
                    field="site"
                    name="Site"
                  />
                  {recordData.data["platform"] && (
                    <RecordDataField
                      record={recordData.data}
                      field="platform"
                      name="Platform"
                    />
                  )}
                </Container>
              </Col>
              <Col xs={6} xl={12}>
                <hr />
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="record-data-details">Details</Nav.Link>
                  </Nav.Item>
                  {relationFields.map(([key]) => (
                    <Nav.Item key={key}>
                      <Nav.Link eventKey={key}>{formatTitle(key)}</Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
              </Col>
            </Row>
            <hr />
            <Button
              size="sm"
              disabled={!props.fileWriter}
              variant="dark"
              onClick={handleExportToJSON}
            >
              Export Record to JSON
            </Button>
            <Toast
              onClose={() => setShowExportToast(false)}
              show={showExportToast}
              delay={3000}
              autohide
            >
              <Toast.Header>
                <strong className="me-auto">Export Started</strong>
              </Toast.Header>
              <Toast.Body>
                File: <strong>{props.recordID}.json</strong>
              </Toast.Body>
            </Toast>
          </Stack>
        </Col>
        <Col xl={10}>
          <Tab.Content style={{ height: "100%" }}>
            <Tab.Pane eventKey="record-data-details" style={{ height: "100%" }}>
              <h5>Details</h5>
              <Table
                data={
                  {
                    data: detailFields.map(([key, value]) => ({
                      Field: key,
                      Value: value,
                    })),
                  } as unknown as ResultData
                }
                flexColumns={["Field", "Value"]}
                s3PathHandler={props.s3PathHandler}
                footer="Table showing the top-level fields for the record."
              />
            </Tab.Pane>
            {relationFields.map(([key, value]) => (
              <Tab.Pane key={key} eventKey={key} style={{ height: "100%" }}>
                <h5>{formatTitle(key)}</h5>
                <Table
                  data={{ data: value } as ResultData}
                  titles={props.fieldDescriptions}
                  titlePrefix={key + "__"}
                  s3PathHandler={props.s3PathHandler}
                  footer={props.fieldDescriptions.get(key) || "No Description."}
                />
              </Tab.Pane>
            ))}
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
}

function RecordHistory(props: RecordModalProps) {
  // Fetch record history, depending on project and record ID
  const {
    isFetching: recordHistoryPending,
    error: recordHistoryError,
    data: recordHistory = { data: {} },
  } = useQuery({
    queryKey: ["record-history", props.project, props.recordID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/history/${props.recordID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.recordID),
    staleTime: 1 * 60 * 1000,
  });

  return recordHistoryPending ? (
    <DelayedLoadingAlert />
  ) : recordHistoryError ? (
    <Alert variant="danger">
      Error: {(recordHistoryError as Error).message}
    </Alert>
  ) : recordHistory.messages ? (
    <ErrorMessages messages={recordHistory.messages} />
  ) : (
    <>
      <h5>History</h5>
      <Table
        data={{ data: recordHistory.data.history } as ResultData}
        flexColumns={["changes"]}
        formatTitles
        footer="Table showing the complete change history for the record."
      />
    </>
  );
}

function RecordModal(props: RecordModalProps) {
  return (
    <Modal
      dialogClassName="onyx-modal-dialog"
      contentClassName="onyx-modal-content"
      show={props.show}
      onHide={props.onHide}
      aria-labelledby="contained-modal-title-vcenter"
      scrollable
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          CLIMB ID: <span className="onyx-text-pink">{props.recordID}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs
          defaultActiveKey="record-data"
          id="uncontrolled-tab-example"
          className="mb-3"
        >
          <Tab
            eventKey="record-data"
            title="Data"
            className="onyx-modal-tab-pane"
            mountOnEnter
          >
            <RecordData {...props} />
          </Tab>
          <Tab
            eventKey="record-history"
            title="History"
            className="onyx-modal-tab-pane"
            mountOnEnter
          >
            <RecordHistory {...props} />
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={props.onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RecordModal;
