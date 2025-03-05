import { useMemo, useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Tab from "react-bootstrap/Tab";
import Button from "react-bootstrap/Button";
import CloseButton from "react-bootstrap/CloseButton";
import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Badge from "react-bootstrap/Badge";
import QueryHandler from "../components/QueryHandler";
import History from "../components/History";
import Table from "../components/Table";
import ExportModal from "../components/ExportModal";
import DataField from "../components/DataField";
import { JsonSearch } from "../components/Json";
import {
  ClimbIDCellRendererFactory,
  AnalysisIDCellRendererFactory,
} from "../components/CellRenderers";
import {
  useAnalysisQuery,
  useAnalysisRecordsQuery,
  useAnalysisUpstreamQuery,
  useAnalysisDownstreamQuery,
} from "../api";
import { handleJSONExport } from "../utils/functions";
import { DataProps } from "../interfaces";
import { RecordType } from "../types";

interface AnalysisProps extends DataProps {
  analysisID: string;
  onHide: () => void;
}

interface DetailsProps extends AnalysisProps {
  setUnpublished: () => void;
}

function Details(props: DetailsProps) {
  const [exportModalShow, setExportModalShow] = useState(false);
  const { isFetching, error, data } = useAnalysisQuery(props);

  // Get the analysis details
  const analysis = useMemo(() => {
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

  useEffect(() => {
    if (data?.status === "success" && !data.data.is_published)
      props.setUnpublished();
  }, [data, props]);

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
        id="analysis-data-tabs"
        defaultActiveKey="analysis-data-details"
      >
        <ExportModal
          show={exportModalShow}
          onHide={() => setExportModalShow(false)}
          defaultFileNamePrefix={props.analysisID}
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
                </Container>
              )}
              <hr />
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link eventKey="analysis-data-details">Details</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="analysis-data-experiment-details">
                    Experiment Details
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              <hr />
              <Button
                size="sm"
                variant="dark"
                onClick={() => setExportModalShow(true)}
              >
                Export Analysis to JSON
              </Button>
            </Stack>
          </Col>
          <Col xs={9} xl={10}>
            <Tab.Content className="h-100">
              <Tab.Pane eventKey="analysis-data-details" className="h-100">
                <h5>Details</h5>
                <Table
                  {...props}
                  data={analysis}
                  defaultFileNamePrefix={`${props.analysisID}_details`}
                  footer="Table showing the top-level fields for the analysis."
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey="analysis-data-experiment-details"
                className="h-100"
              >
                <h5>Experiment Details</h5>
                <Card
                  body
                  className="overflow-y-auto h-100"
                  style={{ maxHeight: "100vh" }}
                >
                  <JsonSearch {...props} data={data.data.experiment_details} />
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </QueryHandler>
  );
}

function Records(props: AnalysisProps) {
  const { isFetching, error, data } = useAnalysisRecordsQuery(props);

  // Get the records
  const records = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data;
  }, [data]);

  return (
    <QueryHandler isFetching={isFetching} error={error as Error} data={data}>
      <>
        <h5>Records</h5>
        <Table
          {...props}
          data={records}
          defaultFileNamePrefix={`${props.analysisID}_records`}
          footer="Table showing all records involved in the analysis."
          cellRenderers={
            new Map([["climb_id", ClimbIDCellRendererFactory(props)]])
          }
        />
      </>
    </QueryHandler>
  );
}

function Upstream(props: AnalysisProps) {
  const { isFetching, error, data } = useAnalysisUpstreamQuery(props);

  // Get the analyses
  const analyses = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data;
  }, [data]);

  return (
    <QueryHandler isFetching={isFetching} error={error as Error} data={data}>
      <>
        <h5>Upstream Analyses</h5>
        <Table
          {...props}
          data={analyses}
          defaultFileNamePrefix={`${props.analysisID}_upstream`}
          footer="Table showing all analyses that were used for the analysis."
          cellRenderers={
            new Map([["analysis_id", AnalysisIDCellRendererFactory(props)]])
          }
        />
      </>
    </QueryHandler>
  );
}

function Downstream(props: AnalysisProps) {
  const { isFetching, error, data } = useAnalysisDownstreamQuery(props);

  // Get the analyses
  const analyses = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data;
  }, [data]);

  return (
    <QueryHandler isFetching={isFetching} error={error as Error} data={data}>
      <>
        <h5>Downstream Analyses</h5>
        <Table
          {...props}
          data={analyses}
          defaultFileNamePrefix={`${props.analysisID}_downstream`}
          footer="Table showing all analyses that used the analysis."
          cellRenderers={
            new Map([["analysis_id", AnalysisIDCellRendererFactory(props)]])
          }
        />
      </>
    </QueryHandler>
  );
}

function Analysis(props: AnalysisProps) {
  const [published, setPublished] = useState(false);

  return (
    <Container fluid className="g-2 h-100">
      <Card className="h-100">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <Card.Title>
              Analysis ID:{" "}
              <span className="onyx-text-pink">{props.analysisID}</span>
            </Card.Title>
            <Card.Title className="me-auto">
              {!published && (
                <Badge bg="secondary" className="m-0 p-1">
                  Unpublished
                </Badge>
              )}
            </Card.Title>
            <CloseButton onClick={props.onHide} />
          </Stack>
        </Card.Header>
        <Card.Body className="pt-2 overflow-y-auto">
          <Tab.Container defaultActiveKey="analysis-data-tab" mountOnEnter>
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="analysis-data-tab">Data</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="analysis-history-tab">History</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="analysis-records-tab">Records</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="analysis-upstream-tab">Upstream</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="analysis-downstream-tab">
                  Downstream
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content
              className="p-3"
              style={{ height: "calc(100% - 60px)" }}
            >
              <Tab.Pane eventKey="analysis-data-tab" className="h-100">
                <Details
                  {...props}
                  setUnpublished={() => setPublished(false)}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="analysis-history-tab" className="h-100">
                <History
                  {...props}
                  name="analysis"
                  searchPath={`projects/${props.project}/analysis`}
                  ID={props.analysisID}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="analysis-records-tab" className="h-100">
                <Records {...props} />
              </Tab.Pane>
              <Tab.Pane eventKey="analysis-upstream-tab" className="h-100">
                <Upstream {...props} />
              </Tab.Pane>
              <Tab.Pane eventKey="analysis-downstream-tab" className="h-100">
                <Downstream {...props} />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Analysis;
