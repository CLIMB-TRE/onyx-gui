import { useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Tab from "react-bootstrap/Tab";
import Button from "react-bootstrap/Button";
import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import QueryHandler from "../components/QueryHandler";
import History from "../components/History";
import Table from "../components/Table";
import { UnpublishedBadge } from "../components/Badges";
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
import { IDProps } from "../interfaces";
import { MdArrowBackIosNew } from "react-icons/md";
import DataPanel from "../components/DataPanel";
import { AnalysisTabKeys } from "../types";

function Records(props: IDProps) {
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
          defaultFileNamePrefix={`${props.ID}_records`}
          footer="Table showing all records involved in the analysis."
          cellRenderers={
            new Map([["climb_id", ClimbIDCellRendererFactory(props)]])
          }
        />
      </>
    </QueryHandler>
  );
}

function Upstream(props: IDProps) {
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
          defaultFileNamePrefix={`${props.ID}_upstream`}
          footer="Table showing all analyses that were used for the analysis."
          cellRenderers={
            new Map([["analysis_id", AnalysisIDCellRendererFactory(props)]])
          }
        />
      </>
    </QueryHandler>
  );
}

function Downstream(props: IDProps) {
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
          defaultFileNamePrefix={`${props.ID}_downstream`}
          footer="Table showing all analyses that used the analysis."
          cellRenderers={
            new Map([["analysis_id", AnalysisIDCellRendererFactory(props)]])
          }
        />
      </>
    </QueryHandler>
  );
}

function Analysis(props: IDProps) {
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
              Analysis ID: <span className="onyx-text-pink">{props.ID}</span>
            </big>
            {!published && <UnpublishedBadge />}
          </Stack>
        </Card.Header>
        <Card.Body className="pt-2 overflow-y-auto">
          <Tab.Container
            activeKey={props.tabKey}
            onSelect={(key) => props.setTabKey(key || AnalysisTabKeys.Data)}
            mountOnEnter
          >
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey={AnalysisTabKeys.Data}>Data</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisTabKeys.History}>History</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisTabKeys.Records}>Records</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisTabKeys.Upstream}>
                  Upstream
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisTabKeys.Downstream}>
                  Downstream
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content
              className="p-3"
              style={{ height: "calc(100% - 60px)" }}
            >
              <Tab.Pane eventKey={AnalysisTabKeys.Data} className="h-100">
                <DataPanel
                  {...props}
                  queryHook={useAnalysisQuery}
                  setUnpublished={() => setPublished(false)}
                  dataFields={
                    new Map([
                      ["published_date", "Date"],
                      ["site", "Site"],
                      ["name", "Name"],
                    ])
                  }
                  hideRelations
                />
              </Tab.Pane>
              <Tab.Pane eventKey={AnalysisTabKeys.History} className="h-100">
                <History
                  {...props}
                  name="analysis"
                  searchPath={`projects/${props.project}/analysis`}
                  ID={props.ID}
                />
              </Tab.Pane>
              <Tab.Pane eventKey={AnalysisTabKeys.Records} className="h-100">
                <Records {...props} />
              </Tab.Pane>
              <Tab.Pane eventKey={AnalysisTabKeys.Upstream} className="h-100">
                <Upstream {...props} />
              </Tab.Pane>
              <Tab.Pane eventKey={AnalysisTabKeys.Downstream} className="h-100">
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
