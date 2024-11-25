import { useState } from "react";
import { CustomCellRendererProps } from "@ag-grid-community/react";
import Badge from "react-bootstrap/Badge";
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
import QueryHandler from "./QueryHandler";
import { ResultData, ResultType, ExportStatus } from "../types";
import { DataProps, ExportHandlerProps } from "../interfaces";
import ExportModal from "./ExportModal";

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

  const DetailCellRenderer = (cellRendererProps: CustomCellRendererProps) => {
    if (
      typeof cellRendererProps.value === "string" &&
      cellRendererProps.value.startsWith("s3://") &&
      cellRendererProps.value.endsWith(".html")
    ) {
      return (
        <Button
          className="p-0"
          size="sm"
          variant="link"
          onClick={() => props.s3PathHandler(cellRendererProps.value)}
        >
          {cellRendererProps.value}
        </Button>
      );
    } else {
      return cellRendererProps.value;
    }
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

  const detailFields = Object.entries(recordData.data).filter(
    ([key]) => props.projectFields.get(key)?.type !== "relation"
  );

  const relationFields = Object.entries(recordData.data)
    .filter(([key]) => props.projectFields.get(key)?.type === "relation")
    .sort(([key1], [key2]) => (key1 < key2 ? -1 : 1));

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
                  cellRenderers={new Map([["Value", DetailCellRenderer]])}
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

function TimestampCellRenderer(props: CustomCellRendererProps) {
  const date = new Date(props.value.toString());
  return <span>{date.toDateString()}</span>;
}

function ActionCellRenderer(props: CustomCellRendererProps) {
  const action = props.value.toString().toLowerCase();

  // Change text colour based on action type
  if (action === "add") {
    return <Badge bg="dark">{action}</Badge>;
  } else if (action === "change") {
    return (
      <Badge bg="info" className="text-dark">
        {action}
      </Badge>
    );
  } else if (action === "delete") {
    return <Badge bg="danger">{action}</Badge>;
  } else {
    return <Badge bg="secondary">{action}</Badge>;
  }
}

function ChangeCellRenderer(props: CustomCellRendererProps) {
  const changes = JSON.parse(props.value);

  return (
    <ul>
      {changes.map((change: ResultType, index: number) => {
        if (change.type === "relation") {
          let verb: string;
          if (change.action === "add") {
            verb = "Added";
          } else if (change.action === "change") {
            verb = "Changed";
          } else if (change.action === "delete") {
            verb = "Deleted";
          } else {
            verb = "Modified";
          }
          return (
            <li key={index}>
              <strong>{change.field?.toString()}</strong>: {verb}{" "}
              <span className="onyx-text-pink">{change.count?.toString()}</span>{" "}
              record{change.count === 1 ? "" : "s"}.
            </li>
          );
        } else {
          return (
            <li key={index}>
              <strong>{change.field?.toString()}</strong>:{" "}
              <span className="onyx-text-pink">
                {JSON.stringify(change.from)}
              </span>{" "}
              &rarr;{" "}
              <span className="onyx-text-pink">
                {JSON.stringify(change.to)}
              </span>
            </li>
          );
        }
      })}
    </ul>
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
