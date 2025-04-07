import { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Stack from "react-bootstrap/Stack";
import Tab from "react-bootstrap/Tab";
import { MdArrowBackIosNew } from "react-icons/md";
import { useRecordAnalysesQuery, useRecordQuery } from "../api";
import { UnpublishedBadge } from "../components/Badges";
import { AnalysisIDCellRendererFactory } from "../components/CellRenderers";
import DataPanel from "../components/DataPanel";
import History from "../components/History";
import QueryHandler from "../components/QueryHandler";
import Table from "../components/Table";
import { IDProps } from "../interfaces";
import { RecordTabKeys } from "../types";

function Analyses(props: IDProps) {
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
          defaultFileNamePrefix={`${props.ID}_analyses`}
          footer="Table showing all analysis results for the record."
          cellRenderers={
            new Map([["analysis_id", AnalysisIDCellRendererFactory(props)]])
          }
        />
      </>
    </QueryHandler>
  );
}

function ProjectRecord(props: IDProps) {
  const [published, setPublished] = useState(true);

  return (
    <Container fluid className="g-2 h-100">
      <Card className="h-100">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <Button
              size="sm"
              variant="dark"
              title="Back to Records"
              onClick={props.onHide}
            >
              <MdArrowBackIosNew />
            </Button>
            <big className="me-auto">
              CLIMB ID: <span className="onyx-text-pink">{props.ID}</span>
            </big>
            {!published && <UnpublishedBadge />}
          </Stack>
        </Card.Header>
        <Card.Body className="pt-2 overflow-y-auto">
          <Tab.Container
            activeKey={props.tabKey}
            onSelect={(key) => props.setTabKey(key || RecordTabKeys.Data)}
            mountOnEnter
          >
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey={RecordTabKeys.Data}>Data</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={RecordTabKeys.History}>History</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={RecordTabKeys.Analyses}>Analyses</Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content
              className="p-3"
              style={{ height: "calc(100% - 60px)" }}
            >
              <Tab.Pane eventKey={RecordTabKeys.Data} className="h-100">
                <DataPanel
                  {...props}
                  queryHook={useRecordQuery}
                  setUnpublished={() => setPublished(false)}
                  dataFields={
                    new Map([
                      ["published_date", "Date"],
                      ["site", "Site"],
                      ["platform", "Platform"],
                    ])
                  }
                />
              </Tab.Pane>
              <Tab.Pane eventKey={RecordTabKeys.History} className="h-100">
                <History
                  {...props}
                  name="record"
                  searchPath={`projects/${props.project}`}
                  ID={props.ID}
                />
              </Tab.Pane>
              <Tab.Pane eventKey={RecordTabKeys.Analyses} className="h-100">
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
