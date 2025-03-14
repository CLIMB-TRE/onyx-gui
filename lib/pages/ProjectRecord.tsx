import { useState, useMemo } from "react";
import Card from "react-bootstrap/Card";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import Table from "../components/Table";
import History from "../components/History";
import QueryHandler from "../components/QueryHandler";
import { useRecordQuery, useRecordAnalysesQuery } from "../api";
import { IDProps } from "../interfaces";
import { UnpublishedBadge } from "../components/Badges";
import { AnalysisIDCellRendererFactory } from "../components/CellRenderers";
import { MdArrowBackIosNew } from "react-icons/md";
import DataPanel from "../components/DataPanel";

interface ProjectRecordProps extends IDProps {
  onHide: () => void;
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

function ProjectRecord(props: ProjectRecordProps) {
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
              <Tab.Pane eventKey="record-history-tab" className="h-100">
                <History
                  {...props}
                  name="record"
                  searchPath={`projects/${props.project}`}
                  ID={props.ID}
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
