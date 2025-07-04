import { useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Stack from "react-bootstrap/Stack";
import Tab from "react-bootstrap/Tab";
import { MdArrowBackIosNew } from "react-icons/md";
import { useRecordAnalysesQuery, useRecordQuery } from "../api";
import { UnpublishedBadge } from "../components/Badges";
import DataPanel from "../components/DataPanel";
import RelatedPanel from "../components/RelatedPanel";
import HistoryPanel from "../components/HistoryPanel";
import { IDProps } from "../interfaces";
import { DataPanelTabKeys, RecordDetailTabKeys } from "../types";

function ProjectRecord(props: IDProps) {
  const [published, setPublished] = useState(true);

  const handleRecordDetailTabChange = (tabKey: string | null) => {
    props.setTabState((prevState) => ({
      ...prevState,
      recordDetailTabKey: tabKey as RecordDetailTabKeys,
    }));
  };

  const handleDataPanelTabChange = (tabKey: string | null) => {
    props.setTabState((prevState) => ({
      ...prevState,
      recordDataPanelTabKey: tabKey as DataPanelTabKeys,
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
            activeKey={props.tabState.recordDetailTabKey}
            onSelect={handleRecordDetailTabChange}
            mountOnEnter
            transition={false}
          >
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey={RecordDetailTabKeys.DATA}>Data</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={RecordDetailTabKeys.HISTORY}>
                  History
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={RecordDetailTabKeys.ANALYSES}>
                  Analyses
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content
              className="p-3"
              style={{ height: "calc(100% - 60px)" }}
            >
              <Tab.Pane eventKey={RecordDetailTabKeys.DATA} className="h-100">
                <DataPanel
                  {...props}
                  dataPanelTabKey={props.tabState.recordDataPanelTabKey}
                  setDataPanelTabKey={handleDataPanelTabChange}
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
              <Tab.Pane
                eventKey={RecordDetailTabKeys.HISTORY}
                className="h-100"
              >
                <HistoryPanel
                  {...props}
                  name="record"
                  searchPath={`projects/${props.project.code}`}
                  ID={props.ID}
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey={RecordDetailTabKeys.ANALYSES}
                className="h-100"
              >
                <RelatedPanel
                  {...props}
                  queryHook={useRecordAnalysesQuery}
                  title="Analyses"
                  description="Table showing all analysis results for the record."
                  defaultFileNamePrefix={`${props.ID}_analyses`}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ProjectRecord;
