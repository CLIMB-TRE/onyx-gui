import { useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Button from "react-bootstrap/Button";
import CloseButton from "react-bootstrap/CloseButton";
import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import { DataProps } from "../interfaces";
import QueryHandler from "../components/QueryHandler";
import History from "../components/History";
import {
  useAnalysisQuery,
  useAnalysisRecordsQuery,
  useAnalysisUpstreamQuery,
  useAnalysisDownstreamQuery,
} from "../api";
import Table from "../components/Table";
import ExportModal from "../components/ExportModal";
import DataField from "../components/DataField";
import {
  ClimbIDCellRendererFactory,
  AnalysisIDCellRendererFactory,
} from "../components/CellRenderers";
import { handleJSONExport } from "../utils/functions";
import { RecordType } from "../types";

interface AnalysisProps extends DataProps {
  analysisID: string;
  onHide: () => void;
}

function Details(props: AnalysisProps) {
  const [exportModalShow, setExportModalShow] = useState(false);
  const { isFetching, error, data } = useAnalysisQuery(props);

  // Get the analysis details
  const analysis = useMemo(() => {
    if (data?.status !== "success") return [];
    return Object.entries(data.data)
      .filter(
        ([key]) =>
          key !== "upstream_analyses" &&
          key !== "downstream_analyses" &&
          key !== "identifiers" &&
          key !== "records"
      )
      .map(([key, value]) => ({
        Field: key,
        Value: value,
      })) as RecordType[];
  }, [data]);

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
  return (
    <Container fluid className="g-2 h-100">
      <Card className="h-100">
        <Card.Header>
          <Stack direction="horizontal">
            <Card.Title className="me-auto">
              Analysis ID:{" "}
              <span className="onyx-text-pink">{props.analysisID}</span>
            </Card.Title>
            <CloseButton variant="dark" onClick={props.onHide} />
          </Stack>
        </Card.Header>
        <Card.Body>
          <Tabs
            id="analysis-modal-tabs"
            defaultActiveKey="analysis-data-tab"
            className="mb-3"
            mountOnEnter
          >
            <Tab
              eventKey="analysis-data-tab"
              title="Data"
              className="onyx-modal-tab-pane"
            >
              <Details {...props} />
            </Tab>
            <Tab
              eventKey="analysis-history-tab"
              title="History"
              className="onyx-modal-tab-pane"
            >
              <History
                {...props}
                name="analysis"
                searchPath={`projects/${props.project}/analysis`}
                ID={props.analysisID}
              />
            </Tab>
            <Tab
              eventKey="analysis-records-tab"
              title="Records"
              className="onyx-modal-tab-pane"
            >
              <Records {...props} />
            </Tab>
            <Tab
              eventKey="analysis-upstream-tab"
              title="Upstream"
              className="onyx-modal-tab-pane"
            >
              <Upstream {...props} />
            </Tab>
            <Tab
              eventKey="analysis-downstream-tab"
              title="Downstream"
              className="onyx-modal-tab-pane"
            >
              <Downstream {...props} />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Analysis;
