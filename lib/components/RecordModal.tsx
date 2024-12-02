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
import { useQuery } from "@tanstack/react-query";
import Table from "./Table";
import ErrorModal from "./ErrorModal";
import QueryHandler from "./QueryHandler";
import { ResultData, ResultType, ExportStatus } from "../types";
import { DataProps, ExportHandlerProps } from "../interfaces";
import ExportModal from "./ExportModal";
import {
  DetailCellRendererFactory,
  AnalysisIDCellRendererFactory,
  TimestampCellRenderer,
  ActionCellRenderer,
  ChangeCellRenderer,
} from "./CellRenderers";
import { s3BucketsMessage } from "../utils/errorMessages";

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
      <Col md={6}>
        <h6>{name}:</h6>
      </Col>
      <Col md={6}>
        <span className="onyx-text-pink">
          {record[field]?.toString() || ""}
        </span>
      </Col>
    </Row>
  );
}

function RecordData(props: RecordModalProps) {
  const [exportModalShow, setExportModalShow] = useState(false);
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);

  const handleErrorModalShow = (error: Error) => {
    setS3ReportError(error);
    setErrorModalShow(true);
  };

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

  const formatTitle = (str: string) => {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const detailFields = useMemo(
    () =>
      Object.entries(recordData?.data || {}).filter(
        ([key]) => props.projectFields.get(key)?.type !== "relation"
      ),
    [recordData, props.projectFields]
  );

  const relationFields = useMemo(
    () =>
      Object.entries(recordData?.data || {})
        .filter(([key]) => props.projectFields.get(key)?.type === "relation")
        .sort(([key1], [key2]) => (key1 < key2 ? -1 : 1)),
    [recordData, props.projectFields]
  );

  const handleJSONExport = (exportProps: ExportHandlerProps) => {
    const jsonData = JSON.stringify(recordData.data);
    exportProps.setExportStatus(ExportStatus.WRITING);
    props
      .fileWriter(exportProps.fileName, jsonData)
      .then(() => exportProps.setExportStatus(ExportStatus.FINISHED))
      .catch((error: Error) => {
        exportProps.setExportError(error);
        exportProps.setExportStatus(ExportStatus.ERROR);
      });
  };

  return (
    <QueryHandler
      isFetching={recordDataPending}
      error={recordDataError as Error}
      data={recordData}
    >
      <Tab.Container
        id="record-data-tabs"
        defaultActiveKey="record-data-details"
      >
        <ErrorModal
          title="S3 Reports"
          message={s3BucketsMessage}
          error={s3ReportError}
          show={errorModalShow}
          onHide={() => setErrorModalShow(false)}
        />
        <ExportModal
          {...props}
          defaultFileNamePrefix={props.recordID}
          fileExtension=".json"
          show={exportModalShow}
          handleExport={handleJSONExport}
          onHide={() => setExportModalShow(false)}
          exportProgressMessage={"Exporting record data to JSON..."}
        />
        <Row className="h-100">
          <Col xs={3} xl={2}>
            <Stack gap={1}>
              <hr />
              <Container>
                <RecordDataField
                  record={recordData?.data}
                  field="published_date"
                  name="Date"
                />
                <RecordDataField
                  record={recordData?.data}
                  field="site"
                  name="Site"
                />
                {recordData?.data?.platform && (
                  <RecordDataField
                    record={recordData?.data}
                    field="platform"
                    name="Platform"
                  />
                )}
              </Container>
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
                  data={
                    {
                      data: detailFields.map(([key, value]) => ({
                        Field: key,
                        Value: value,
                      })),
                    } as unknown as ResultData
                  }
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
              {relationFields.map(([key, value]) => (
                <Tab.Pane key={key} eventKey={key} className="h-100">
                  <h5>{formatTitle(key)}</h5>
                  <Table
                    {...props}
                    data={{ data: value } as ResultData}
                    defaultFileNamePrefix={`${props.recordID}_${key}`}
                    headerTooltips={props.fieldDescriptions}
                    headerTooltipPrefix={key + "__"}
                    footer={
                      props.fieldDescriptions.get(key) || "No Description."
                    }
                  />
                </Tab.Pane>
              ))}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </QueryHandler>
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

  return (
    <QueryHandler
      isFetching={recordHistoryPending}
      error={recordHistoryError as Error}
      data={recordHistory}
    >
      <>
        <h5>History</h5>
        <Table
          {...props}
          data={{ data: recordHistory.data?.history } as ResultData}
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
    </QueryHandler>
  );
}

function RecordAnalyses(props: RecordModalProps) {
  // Fetch record analyses, depending on project
  const {
    isFetching: resultPending,
    error: resultError,
    data: resultData = {},
  } = useQuery({
    queryKey: ["analyses", props.project],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/analysis/`)
        .then((response) => response.json());
    },
    enabled: !!props.project,
    cacheTime: 0.5 * 60 * 1000,
  });

  return (
    <QueryHandler
      isFetching={resultPending}
      error={resultError as Error}
      data={resultData}
    >
      <>
        <h5>Analyses</h5>
        <Table
          {...props}
          data={resultData}
          defaultFileNamePrefix={`${props.recordID}_analyses`}
          footer="Table showing all analysis results for the record."
          cellRenderers={
            new Map([["analysis_id", AnalysisIDCellRendererFactory(props)]])
          }
        />
      </>
    </QueryHandler>
  );
}

function RecordModal(props: RecordModalProps) {
  return (
    <Modal
      className="onyx-modal"
      dialogClassName="onyx-modal-dialog"
      contentClassName="onyx-modal-content"
      show={props.show}
      onHide={props.onHide}
      aria-labelledby="record-modal-title"
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
          defaultActiveKey="record-data"
          id="record-modal-tabs"
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
          <Tab
            eventKey="record-analysis"
            title="Analyses"
            className="onyx-modal-tab-pane"
            mountOnEnter
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
