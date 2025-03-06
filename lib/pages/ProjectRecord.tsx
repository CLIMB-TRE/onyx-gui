import { useState, useEffect, useMemo, useCallback } from "react";
import Card from "react-bootstrap/Card";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import CloseButton from "react-bootstrap/CloseButton";
import Tab from "react-bootstrap/Tab";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import Table from "../components/Table";
import ErrorModal from "../components/ErrorModal";
import History from "../components/History";
import DataField from "../components/DataField";
import QueryHandler from "../components/QueryHandler";
import { useRecordQuery, useRecordAnalysesQuery } from "../api";
import { RecordType } from "../types";
import { DataProps } from "../interfaces";
import ExportModal from "../components/ExportModal";
import { JsonSearch } from "../components/Json";
import { UnpublishedBadge } from "../components/Badges";
import {
  DetailCellRendererFactory,
  AnalysisIDCellRendererFactory,
} from "../components/CellRenderers";
import { handleJSONExport } from "../utils/functions";
import { s3BucketsMessage } from "../utils/messages";
import { JsonData } from "json-edit-react";

interface ProjectRecordProps extends DataProps {
  recordID: string;
  onHide: () => void;
}

interface DetailsProps extends ProjectRecordProps {
  setUnpublished: () => void;
}

function Details(props: DetailsProps) {
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
      .filter(
        ([key]) =>
          props.projectFields.get(key)?.type !== "relation" &&
          props.projectFields.get(key)?.type !== "structure" &&
          key !== "is_published"
      )
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

  // Get the structure details
  const structures = useMemo(() => {
    if (data?.status !== "success") return [];
    return Object.entries(data.data).filter(
      ([key]) => props.projectFields.get(key)?.type === "structure"
    );
  }, [data, props.projectFields]);

  useEffect(() => {
    if (data?.status === "success" && !data.data.is_published)
      props.setUnpublished();
  }, [data, props]);

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
          defaultFileExtension=".json"
          exportProgressMessage={"Exporting record data to JSON..."}
          handleExport={handleJSONExport(jsonExportProps)}
        />
        <Row className="h-100">
          <Col xs={3} xl={2}>
            <Stack gap={1}>
              <hr />
              {data?.status === "success" && (
                <Container>
                  <DataField
                    record={data.data}
                    field="published_date"
                    name="Date"
                  />
                  <DataField record={data.data} field="site" name="Site" />
                  {data.data?.platform && (
                    <DataField
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
                {structures.map(([key]) => (
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
              {structures.map(([key, structure]) => (
                <Tab.Pane key={key} eventKey={key} className="h-100">
                  <h5>{formatTitle(key)}</h5>
                  <Card
                    body
                    className="overflow-y-auto h-100"
                    style={{ maxHeight: "100vh" }}
                  >
                    <JsonSearch {...props} data={structure as JsonData} />
                  </Card>
                </Tab.Pane>
              ))}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </QueryHandler>
  );
}

function Analyses(props: ProjectRecordProps) {
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

function ProjectRecord(props: ProjectRecordProps) {
  const [published, setPublished] = useState(true);

  return (
    <Container fluid className="g-2 h-100">
      <Card className="h-100">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <Card.Title>
              CLIMB ID: <span className="onyx-text-pink">{props.recordID}</span>
            </Card.Title>
            <Card.Title className="me-auto">
              {!published && <UnpublishedBadge />}
            </Card.Title>
            <CloseButton onClick={props.onHide} />
          </Stack>
        </Card.Header>
        <Card.Body className="pt-2 overflow-y-auto">
          <Tab.Container defaultActiveKey="record-data-tab" mountOnEnter>
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="record-data-tab">Data</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="record-history-tab">History</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="record-analyses-tab">Analyses</Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content
              className="p-3"
              style={{ height: "calc(100% - 60px)" }}
            >
              <Tab.Pane eventKey="record-data-tab" className="h-100">
                <Details
                  {...props}
                  setUnpublished={() => setPublished(false)}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="record-history-tab" className="h-100">
                <History
                  {...props}
                  name="record"
                  searchPath={`projects/${props.project}`}
                  ID={props.recordID}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="record-analyses-tab" className="h-100">
                <Analyses {...props} />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ProjectRecord;
