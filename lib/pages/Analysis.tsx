import { UseQueryResult } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
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
import {
  AnalysisIDCellRendererFactory,
  ClimbIDCellRendererFactory,
  S3ReportCellRendererFactory,
} from "../components/CellRenderers";
import DataPanel from "../components/DataPanel";
import ErrorModal from "../components/ErrorModal";
import History from "../components/History";
import QueryHandler from "../components/QueryHandler";
import Table from "../components/Table";
import { IDProps } from "../interfaces";
import { AnalysisDetailTabKeys, ErrorResponse, ListResponse } from "../types";
import { s3BucketsMessage } from "../utils/messages";

interface RelatedAnalysesProps extends IDProps {
  queryHook: (
    props: IDProps
  ) => UseQueryResult<ListResponse | ErrorResponse, Error>;
  title: string;
  description: string;
  defaultFileNamePrefix: string;
}

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

function RelatedAnalyses(props: RelatedAnalysesProps) {
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);
  const { isFetching, error, data } = props.queryHook(props);

  const handleErrorModalShow = useCallback((error: Error) => {
    setS3ReportError(error);
    setErrorModalShow(true);
  }, []);

  const errorModalProps = useMemo(
    () => ({
      ...props,
      handleErrorModalShow,
    }),
    [props, handleErrorModalShow]
  );

  // Get the analyses
  const analyses = useMemo(() => {
    if (data?.status !== "success") return [];
    return data.data;
  }, [data]);

  return (
    <QueryHandler
      isFetching={isFetching}
      error={error}
      data={data as ListResponse}
    >
      <>
        <ErrorModal
          title="S3 Reports"
          message={s3BucketsMessage}
          error={s3ReportError}
          show={errorModalShow}
          onHide={() => setErrorModalShow(false)}
        />
        <h5>{props.title}</h5>
        <Table
          {...props}
          data={analyses}
          defaultFileNamePrefix={props.defaultFileNamePrefix}
          footer={props.description}
          cellRenderers={
            new Map([
              ["analysis_id", AnalysisIDCellRendererFactory(props)],
              ["report", S3ReportCellRendererFactory(errorModalProps)],
            ])
          }
        />
      </>
    </QueryHandler>
  );
}

function Upstream(props: IDProps) {
  return (
    <RelatedAnalyses
      {...props}
      queryHook={useAnalysisUpstreamQuery}
      title="Upstream Analyses"
      description="Table showing all analyses that were used for the analysis."
      defaultFileNamePrefix={`${props.ID}_upstream`}
    />
  );
}

function Downstream(props: IDProps) {
  return (
    <RelatedAnalyses
      {...props}
      queryHook={useAnalysisDownstreamQuery}
      title="Downstream Analyses"
      description="Table showing all analyses that used the analysis."
      defaultFileNamePrefix={`${props.ID}_downstream`}
    />
  );
}

function Analysis(props: IDProps) {
  const [published, setPublished] = useState(true);

  return (
    <Container fluid className="g-0 h-100">
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
            onSelect={(key) =>
              props.setTabKey(key || AnalysisDetailTabKeys.DATA)
            }
            mountOnEnter
          >
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey={AnalysisDetailTabKeys.DATA}>Data</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisDetailTabKeys.HISTORY}>
                  History
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisDetailTabKeys.RECORDS}>
                  Records
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisDetailTabKeys.UPSTREAM}>
                  Upstream
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey={AnalysisDetailTabKeys.DOWNSTREAM}>
                  Downstream
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content
              className="p-3"
              style={{ height: "calc(100% - 60px)" }}
            >
              <Tab.Pane eventKey={AnalysisDetailTabKeys.DATA} className="h-100">
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
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey={AnalysisDetailTabKeys.HISTORY}
                className="h-100"
              >
                <History
                  {...props}
                  name="analysis"
                  searchPath={`projects/${props.project}/analysis`}
                  ID={props.ID}
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey={AnalysisDetailTabKeys.RECORDS}
                className="h-100"
              >
                <Records {...props} />
              </Tab.Pane>
              <Tab.Pane
                eventKey={AnalysisDetailTabKeys.UPSTREAM}
                className="h-100"
              >
                <Upstream {...props} />
              </Tab.Pane>
              <Tab.Pane
                eventKey={AnalysisDetailTabKeys.DOWNSTREAM}
                className="h-100"
              >
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
