import { useState, useMemo, useCallback } from "react";
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
import History from "./History";
import QueryHandler from "./QueryHandler";
import { useRecordQuery, useRecordAnalysesQuery } from "../api";
import { RecordType } from "../types";
import { DataProps } from "../interfaces";
import ExportModal from "./ExportModal";
import {
  DetailCellRendererFactory,
  AnalysisIDCellRendererFactory,
} from "./CellRenderers";
import { handleJSONExport } from "../utils/functions";
import { s3BucketsMessage } from "../utils/messages";

interface RecordModalProps extends DataProps {
  recordID: string;
  show: boolean;
  onHide: () => void;
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

function Details(props: RecordModalProps) {
  const [exportModalShow, setExportModalShow] = useState(false);
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);
  const { isFetching, error, data } = useRecordQuery(props);

  const handleErrorModalShow = useCallback((error: Error) => {
    setS3ReportError(error);
    setErrorModalShow(true);
  }, []);

  const formatTitle = (str: string) => {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get the record details
  const record = useMemo(() => {
    if (data?.status !== "success") return [];
    return Object.entries(data.data)
      .filter(([key]) => props.projectFields.get(key)?.type !== "relation")
      .map(([key, value]) => ({
        Field: key,
        Value: value,
      })) as RecordType[];
  }, [data, props.projectFields]);

  // Get the relations details
  const relations = useMemo(() => {
    if (data?.status !== "success") return [];
    return Object.entries(data.data)
      .filter(([key]) => props.projectFields.get(key)?.type === "relation")
      .sort(([key1], [key2]) => (key1 < key2 ? -1 : 1)) as [
      string,
      RecordType[]
    ][];
  }, [data, props.projectFields]);

  const errorModalProps = useMemo(
    () => ({
      ...props,
      handleErrorModalShow,
    }),
    [props, handleErrorModalShow]
  );

  const jsonExportProps = useMemo(
    () => ({
      ...props,
      response: data,
    }),
    [props, data]
  );

  return (
    <QueryHandler isFetching={isFetching} error={error as Error} data={data}>
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
          show={exportModalShow}
          onHide={() => setExportModalShow(false)}
          defaultFileNamePrefix={props.recordID}
          fileExtension=".json"
          exportProgressMessage={"Exporting record data to JSON..."}
          handleExport={handleJSONExport(jsonExportProps)}
        />
        <Row className="h-100">
          <Col xs={3} xl={2}>
            <Stack gap={1}>
              <hr />
              {data?.status === "success" && (
                <Container>
                  <RecordDataField
                    record={data.data}
                    field="published_date"
                    name="Date"
                  />
                  <RecordDataField
                    record={data.data}
                    field="site"
                    name="Site"
                  />
                  {data.data?.platform && (
                    <RecordDataField
                      record={data.data}
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
                {relations.map(([key]) => (
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
                  data={record}
                  defaultFileNamePrefix={`${props.recordID}_details`}
                  footer="Table showing the top-level fields for the record."
                  cellRenderers={
                    new Map([
                      ["Value", DetailCellRendererFactory(errorModalProps)],
                    ])
                  }
                />
              </Tab.Pane>
              {relations.map(([key, relation]) => (
                <Tab.Pane key={key} eventKey={key} className="h-100">
                  <h5>{formatTitle(key)}</h5>
                  <Table
                    {...props}
                    data={relation}
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

function Analyses(props: RecordModalProps) {
  const { isFetching, error, data } = useRecordAnalysesQuery(props);

  // Get the analyses
  const analyses = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data;
  }, [data]);

  return (
    <QueryHandler isFetching={isFetching} error={error as Error} data={data}>
      <>
        <h5>Analyses</h5>
        <Table
          {...props}
          data={analyses}
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
            <Details {...props} />
          </Tab>
          <Tab
            eventKey="record-history-tab"
            title="History"
            className="onyx-modal-tab-pane"
          >
            <History
              {...props}
              name="record"
              searchPath={`projects/${props.project}`}
              ID={props.recordID}
            />
          </Tab>
          <Tab
            eventKey="record-analyses-tab"
            title="Analyses"
            className="onyx-modal-tab-pane"
          >
            <Analyses {...props} />
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
