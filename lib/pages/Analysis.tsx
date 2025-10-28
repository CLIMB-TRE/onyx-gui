import { useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Stack from "react-bootstrap/Stack";
import Tab from "react-bootstrap/Tab";
import { MdArrowBackIosNew } from "react-icons/md";
import {
  useAnalysisDownstreamQuery,
  useAnalysisQuery,
  useAnalysisRecordsQuery,
  useAnalysisUpstreamQuery,
} from "../api";
import { UnpublishedBadge } from "../components/Badges";
import DataPanel from "../components/DataPanel";
import RelatedPanel from "../components/RelatedPanel";
import HistoryPanel from "../components/HistoryPanel";
import { IDProps } from "../interfaces";
import { AnalysisDetailTabKey, DataPanelTabKey, ObjectType } from "../types";

function Analysis(props: IDProps) {
  const [published, setPublished] = useState(true);

  const handleAnalysisDetailTabChange = (tabKey: string | null) => {
    props.setTabState((prevState) => ({
      ...prevState,
      analysisDetailTabKey: tabKey as AnalysisDetailTabKey,
    }));
  };

  const handleDataPanelTabChange = (tabKey: string | null) => {
    props.setTabState((prevState) => ({
      ...prevState,
      analysisDataPanelTabKey: tabKey as DataPanelTabKey,
    }));
  };

  return (
    <Container fluid className="g-0 h-100">
      <Card className="h-100">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <Button
              size="sm"
              variant="secondary"
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
            activeKey={props.tabState.analysisDetailTabKey}
            onSelect={handleAnalysisDetailTabChange}
            mountOnEnter
            transition={false}
          >
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey={AnalysisDetailTabKey.DATA}>Data</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisDetailTabKey.HISTORY}>
                  History
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisDetailTabKey.RECORDS}>
                  Records
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisDetailTabKey.UPSTREAM}>
                  Upstream
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisDetailTabKey.DOWNSTREAM}>
                  Downstream
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content
              className="p-3"
              style={{ height: "calc(100% - 60px)" }}
            >
              <Tab.Pane eventKey={AnalysisDetailTabKey.DATA} className="h-100">
                <DataPanel
                  {...props}
                  dataPanelTabKey={props.tabState.analysisDataPanelTabKey}
                  setDataPanelTabKey={handleDataPanelTabChange}
                  queryHook={useAnalysisQuery}
                  setUnpublished={() => setPublished(false)}
                  dataFields={
                    new Map([
                      ["published_date", "Date"],
                      ["site", "Site"],
                      ["name", "Name"],
                    ])
                  }
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey={AnalysisDetailTabKey.HISTORY}
                className="h-100"
              >
                <HistoryPanel
                  {...props}
                  name={ObjectType.ANALYSIS}
                  searchPath={`projects/${props.project.code}/analysis`}
                  ID={props.ID}
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey={AnalysisDetailTabKey.RECORDS}
                className="h-100"
              >
                <RelatedPanel
                  {...props}
                  queryHook={useAnalysisRecordsQuery}
                  title="Records"
                  description="Table showing all records involved in the analysis."
                  defaultFileNamePrefix={`${props.ID}_records`}
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey={AnalysisDetailTabKey.UPSTREAM}
                className="h-100"
              >
                <RelatedPanel
                  {...props}
                  queryHook={useAnalysisUpstreamQuery}
                  title="Upstream Analyses"
                  description="Table showing all analyses that were used for the analysis."
                  defaultFileNamePrefix={`${props.ID}_upstream`}
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey={AnalysisDetailTabKey.DOWNSTREAM}
                className="h-100"
              >
                <RelatedPanel
                  {...props}
                  queryHook={useAnalysisDownstreamQuery}
                  title="Downstream Analyses"
                  description="Table showing all analyses that used the analysis."
                  defaultFileNamePrefix={`${props.ID}_downstream`}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Analysis;
