import { useMemo, useEffect, useState, useCallback } from "react";
import Card from "react-bootstrap/Card";
import Tab from "react-bootstrap/Tab";
import Button from "react-bootstrap/Button";
import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import QueryHandler from "../components/QueryHandler";
import History from "../components/History";
import Table from "../components/Table";
import ErrorModal from "../components/ErrorModal";
import ExportModal from "../components/ExportModal";
import DataField from "../components/DataField";
import { JsonSearch } from "../components/Json";
import { UnpublishedBadge } from "../components/Badges";
import ObjectDetails from "../components/ObjectDetails";
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
import { s3BucketsMessage } from "../utils/messages";
import { DataProps } from "../interfaces";
import { JsonData } from "json-edit-react";
import { MdArrowBackIosNew } from "react-icons/md";

interface AnalysisProps extends DataProps {
  analysisID: string;
  onHide: () => void;
}

interface DetailsProps extends AnalysisProps {
  setUnpublished: () => void;
}

function Details(props: DetailsProps) {
  const [exportModalShow, setExportModalShow] = useState(false);
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);
  const { isFetching, error, data } = useAnalysisQuery(props);

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
                  <DataField record={data.data} field="name" name="Name" />
                </Container>
              )}
              <hr />
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link eventKey="analysis-data-details">Details</Nav.Link>
                </Nav.Item>
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
                Export Analysis to JSON
              </Button>
            </Stack>
          </Col>
          <Col xs={9} xl={10}>
            <Tab.Content className="h-100">
              <Tab.Pane eventKey="analysis-data-details" className="h-100">
                <ObjectDetails
                  {...props}
                  data={data}
                  handleErrorModalShow={handleErrorModalShow}
                />
              </Tab.Pane>
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
  const [published, setPublished] = useState(true);

  return (
    <Container fluid className="g-2 h-100">
      <Card className="h-100">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <Button
              size="sm"
              variant="dark"
              title="Back to Analyses"
              onClick={props.onHide}
            >
              <MdArrowBackIosNew />
            </Button>
            <big className="me-auto">
              Analysis ID:{" "}
              <span className="onyx-text-pink">{props.analysisID}</span>
            </big>
            {!published && <UnpublishedBadge />}
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
