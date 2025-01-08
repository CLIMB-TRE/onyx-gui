import { useState, useMemo } from "react";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import Table from "./Table";
import ErrorModal from "./ErrorModal";
import QueryHandler from "./QueryHandler";
import {
  useRecordQuery,
  useRecordHistoryQuery,
  useRecordAnalysesQuery,
} from "../api";
import {
  RecordDetailResponse,
  AnalysisListResponse,
  ErrorResponse,
  RecordType,
} from "../types";
import { DataProps } from "../interfaces";
import ExportModal from "./ExportModal";
import {
  DetailCellRendererFactory,
  AnalysisIDCellRendererFactory,
  TimestampCellRenderer,
  ActionCellRenderer,
  ChangeCellRenderer,
} from "./CellRenderers";
import { handleJSONExport } from "../utils/functions";
import { s3BucketsMessage } from "../utils/messages";

interface RecordModalProps extends DataProps {
  recordID: string;
  show: boolean;
  onHide: () => void;
}

interface RecordDetailResponseProps extends RecordModalProps {
  response: RecordDetailResponse | ErrorResponse;
}

interface AnalysisListResponseProps extends RecordModalProps {
  response: AnalysisListResponse | ErrorResponse;
}

interface RecordDataFieldProps {
  record: RecordType;
  field: string;
  name: string;
}

function RecordDataField(props: RecordDataFieldProps) {
  return (
    <Row>
      <Col md={6}>
        <h6>{props.name}:</h6>
      </Col>
      <Col md={6}>
        <span className="onyx-text-pink">
          {props.record[props.field]?.toString() || ""}
        </span>
      </Col>
    </Row>
  );
}

function RecordDataContent(props: RecordDetailResponseProps) {
  const [exportModalShow, setExportModalShow] = useState(false);
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);

  const handleErrorModalShow = (error: Error) => {
    setS3ReportError(error);
    setErrorModalShow(true);
  };

  const formatTitle = (str: string) => {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const recordData = useMemo(() => {
    if (props.response.status !== "success") return [];
    return Object.entries(props.response.data)
      .filter(([key]) => props.projectFields.get(key)?.type !== "relation")
      .map(([key, value]) => ({
        Field: key,
        Value: value,
      }));
  }, [props.response, props.projectFields]);

  const relationsData = useMemo(() => {
    if (props.response.status !== "success") return [];
    return Object.entries(props.response.data)
      .filter(([key]) => props.projectFields.get(key)?.type === "relation")
      .sort(([key1], [key2]) => (key1 < key2 ? -1 : 1)) as [
      string,
      RecordType[]
    ][];
  }, [props.response, props.projectFields]);

  return (
    <Tab.Container id="record-data-tabs" defaultActiveKey="record-data-details">
      <ErrorModal
        title="S3 Reports"
        message={s3BucketsMessage}
        error={s3ReportError}
        show={errorModalShow}
        onHide={() => setErrorModalShow(false)}
      />
      <ExportModal
        show={exportModalShow}
        onHide={() => setExportModalShow(false)}
        defaultFileNamePrefix={props.recordID}
        fileExtension=".json"
        exportProgressMessage={"Exporting record data to JSON..."}
        handleExport={handleJSONExport(props)}
      />
      <Row className="h-100">
        <Col xs={3} xl={2}>
          <Stack gap={1}>
            <hr />
            {props.response.status === "success" && (
              <Container>
                <RecordDataField
                  record={props.response.data}
                  field="published_date"
                  name="Date"
                />
                <RecordDataField
                  record={props.response.data}
                  field="site"
                  name="Site"
                />
                {props.response.data?.platform && (
                  <RecordDataField
                    record={props.response.data}
                    field="platform"
                    name="Platform"
                  />
                )}
              </Container>
            )}
            <hr />
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link eventKey="record-data-details">Details</Nav.Link>
              </Nav.Item>
              {relationsData.map(([key]) => (
                <Nav.Item key={key}>
                  <Nav.Link eventKey={key}>{formatTitle(key)}</Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
            <hr />
            <Button
              size="sm"
              variant="dark"
              onClick={() => setExportModalShow(true)}
            >
              Export Record to JSON
            </Button>
          </Stack>
        </Col>
        <Col xs={9} xl={10}>
          <Tab.Content className="h-100">
            <Tab.Pane eventKey="record-data-details" className="h-100">
              <h5>Details</h5>
              <Table
                {...props}
                data={recordData}
                defaultFileNamePrefix={`${props.recordID}_details`}
                footer="Table showing the top-level fields for the record."
                cellRenderers={
                  new Map([
                    [
                      "Value",
                      DetailCellRendererFactory({
                        ...props,
                        handleErrorModalShow,
                      }),
                    ],
                  ])
                }
              />
            </Tab.Pane>
            {relationsData.map(([key, relationData]) => (
              <Tab.Pane key={key} eventKey={key} className="h-100">
                <h5>{formatTitle(key)}</h5>
                <Table
                  {...props}
                  data={relationData}
                  defaultFileNamePrefix={`${props.recordID}_${key}`}
                  headerTooltips={props.fieldDescriptions}
                  headerTooltipPrefix={key + "__"}
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

function RecordData(props: RecordModalProps) {
  const {
    isFetching: recordPending,
    error: recordError,
    data: recordResponse,
  } = useRecordQuery({
    props,
    recordID: props.recordID,
  });

  return (
    <QueryHandler
      isFetching={recordPending}
      error={recordError as Error}
      data={recordResponse}
    >
      <RecordDataContent {...props} response={recordResponse} />
    </QueryHandler>
  );
}

function RecordHistoryContent(props: RecordDetailResponseProps) {
  const recordHistoryData = useMemo(() => {
    if (props.response.status !== "success") return [];
    return props.response.data?.history as RecordType[];
  }, [props.response]);

  return (
    <>
      <h5>History</h5>
      <Table
        {...props}
        data={recordHistoryData}
        defaultFileNamePrefix={`${props.recordID}_history`}
        flexOnly={["changes"]}
        tooltipFields={["timestamp"]}
        headerNames={
          new Map([
            ["username", "User"],
            ["timestamp", "Date"],
            ["action", "Action"],
            ["changes", "Changes"],
          ])
        }
        footer="Table showing the complete change history for the record."
        cellRenderers={
          new Map([
            ["timestamp", TimestampCellRenderer],
            ["action", ActionCellRenderer],
            ["changes", ChangeCellRenderer],
          ])
        }
      />
    </>
  );
}

function RecordHistory(props: RecordModalProps) {
  const {
    isFetching: recordHistoryPending,
    error: recordHistoryError,
    data: recordHistoryResponse,
  } = useRecordHistoryQuery({
    props,
    recordID: props.recordID,
  });

  return (
    <QueryHandler
      isFetching={recordHistoryPending}
      error={recordHistoryError as Error}
      data={recordHistoryResponse}
    >
      <RecordHistoryContent {...props} response={recordHistoryResponse} />
    </QueryHandler>
  );
}

function RecordAnalysesContent(props: AnalysisListResponseProps) {
  const recordAnalysesData = useMemo(() => {
    if (props.response.status !== "success") return [];
    return props.response.data;
  }, [props.response]);

  return (
    <>
      <h5>Analyses</h5>
      <Table
        {...props}
        data={recordAnalysesData}
        defaultFileNamePrefix={`${props.recordID}_analyses`}
        footer="Table showing all analysis results for the record."
        cellRenderers={
          new Map([["analysis_id", AnalysisIDCellRendererFactory(props)]])
        }
      />
    </>
  );
}

function RecordAnalyses(props: RecordModalProps) {
  const {
    isFetching: recordAnalysesPending,
    error: recordAnalysesError,
    data: recordAnalysesResponse,
  } = useRecordAnalysesQuery({
    props,
    recordID: props.recordID,
  });

  return (
    <QueryHandler
      isFetching={recordAnalysesPending}
      error={recordAnalysesError as Error}
      data={recordAnalysesResponse}
    >
      <RecordAnalysesContent {...props} response={recordAnalysesResponse} />
    </QueryHandler>
  );
}

function RecordModal(props: RecordModalProps) {
  return (
    <Modal
      className="onyx-modal"
      dialogClassName="onyx-modal-dialog"
      contentClassName="onyx-modal-content"
      aria-labelledby="record-modal-title"
      show={props.show}
      onHide={props.onHide}
      scrollable
      centered
      animation={false}
    >
      <Modal.Header closeButton>
        <Modal.Title id="record-modal-title">
          CLIMB ID: <span className="onyx-text-pink">{props.recordID}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs
          id="record-modal-tabs"
          defaultActiveKey="record-data-tab"
          className="mb-3"
          mountOnEnter
        >
          <Tab
            eventKey="record-data-tab"
            title="Data"
            className="onyx-modal-tab-pane"
          >
            <RecordData {...props} />
          </Tab>
          <Tab
            eventKey="record-history-tab"
            title="History"
            className="onyx-modal-tab-pane"
          >
            <RecordHistory {...props} />
          </Tab>
          <Tab
            eventKey="record-analyses-tab"
            title="Analyses"
            className="onyx-modal-tab-pane"
          >
            <RecordAnalyses {...props} />
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
