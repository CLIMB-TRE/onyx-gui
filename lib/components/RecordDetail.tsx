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
import { useQuery } from "@tanstack/react-query";
import Table from "./Table";
import { DelayedLoadingAlert } from "./LoadingAlert";
import ErrorMessages from "./ErrorMessages";
import { ResultData, ResultType } from "../types";
import { DataProps } from "../interfaces";

interface RecordDetailProps extends DataProps {
  recordID: string;
  show: boolean;
  onHide: () => void;
}

interface RecordDataProps extends RecordDetailProps {
  record: ResultType;
}

function RecordData(props: RecordDataProps) {
  const [showExportToast, setShowExportToast] = useState(false);

  const handleExportToJSON = () => {
    const jsonData = JSON.stringify(props.record);

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

  return (
    <Tab.Container id="left-tabs-example" defaultActiveKey="Details">
      <Row style={{ height: "100%" }}>
        <Col sm={2}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="Details">Details</Nav.Link>
            </Nav.Item>
            {Object.entries(props.record)
              .filter(
                ([key]) => props.projectFields.get(key)?.type === "relation"
              )
              .map(([key]) => (
                <Nav.Item key={key}>
                  <Nav.Link eventKey={key}>{formatTitle(key)}</Nav.Link>
                </Nav.Item>
              ))}
          </Nav>
          <hr />
          <Stack gap={2}>
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
        <Col sm={10}>
          <Tab.Content style={{ height: "100%" }}>
            <Tab.Pane eventKey="Details" style={{ height: "100%" }}>
              <h5>Details</h5>
              <Table
                data={
                  {
                    data: Object.entries(props.record)
                      .filter(
                        ([key]) =>
                          props.projectFields.get(key)?.type !== "relation"
                      )
                      .map(([key, value]) => ({
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
            {Object.entries(props.record)
              .filter(
                ([key]) => props.projectFields.get(key)?.type === "relation"
              )
              .map(([key, value]) => (
                <Tab.Pane key={key} eventKey={key} style={{ height: "100%" }}>
                  <h5>{formatTitle(key)}</h5>
                  <Table
                    data={{ data: value } as ResultData}
                    titles={props.fieldDescriptions}
                    titlePrefix={key + "__"}
                    s3PathHandler={props.s3PathHandler}
                    footer={
                      props.fieldDescriptions.get(key) || "No Description"
                    }
                  />
                </Tab.Pane>
              ))}
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
}

function RecordHistory(props: RecordDetailProps) {
  // Fetch record history, depending on project and record ID
  const {
    isFetching: recordHistoryPending,
    error: recordHistoryError,
    data: recordHistory = {},
  } = useQuery({
    queryKey: ["history", props.project, props.recordID],
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
    recordHistory.data && (
      <>
        <h5>History</h5>
        <Table
          data={{ data: recordHistory.data.history } as ResultData}
          flexColumns={["changes"]}
          formatTitles
          footer="Table showing the complete change history for the record."
        />
      </>
    )
  );
}

function RecordDetail(props: RecordDetailProps) {
  // Fetch record, depending on project and record ID
  const {
    isFetching: recordPending,
    error: recordError,
    data: recordData = {},
  } = useQuery({
    queryKey: ["results", props.project, props.recordID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/${props.recordID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.recordID),
    staleTime: 1 * 60 * 1000,
  });

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
        {recordPending ? (
          <DelayedLoadingAlert />
        ) : recordError ? (
          <Alert variant="danger">
            Error: {(recordError as Error).message}
          </Alert>
        ) : recordData.messages ? (
          <ErrorMessages messages={recordData.messages} />
        ) : (
          recordData.data && (
            <>
              <Stack gap={2}>
                <h5>
                  Published Date:{" "}
                  <span className="onyx-text-pink">
                    {recordData.data["published_date"]}
                  </span>
                </h5>
                <h5>
                  Site:{" "}
                  <span className="onyx-text-pink">
                    {recordData.data["site"]}
                  </span>
                </h5>
              </Stack>
              <hr />
              <Tabs
                defaultActiveKey="data"
                id="uncontrolled-tab-example"
                className="mb-3"
              >
                <Tab
                  eventKey="data"
                  title="Data"
                  className="onyx-modal-tab-pane"
                >
                  <RecordData {...props} record={recordData.data} />
                </Tab>
                <Tab
                  eventKey="history"
                  title="History"
                  mountOnEnter
                  className="onyx-modal-tab-pane"
                >
                  <RecordHistory {...props} />
                </Tab>
              </Tabs>
            </>
          )
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={props.onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RecordDetail;
