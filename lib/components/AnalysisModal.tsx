import { useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Button from "react-bootstrap/Button";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import { useQuery } from "@tanstack/react-query";
import { DataProps } from "../interfaces";
import QueryHandler from "./QueryHandler";
import Table from "./Table";
import ExportModal from "./ExportModal";
import {
  AnalysisDetailResponse,
  RecordListResponse,
  ErrorResponse,
} from "../types";
import { ClimbIDCellRendererFactory } from "./CellRenderers";
import { handleJSONExport } from "../utils/functions";

interface AnalysisModalProps extends DataProps {
  analysisID: string;
  show: boolean;
  onHide: () => void;
}

interface AnalysisDetailResponseProps extends AnalysisModalProps {
  response: AnalysisDetailResponse | ErrorResponse;
}

interface RecordListResponseProps extends AnalysisModalProps {
  response: RecordListResponse | ErrorResponse;
}

function AnalysisDataContent(props: AnalysisDetailResponseProps) {
  const [exportModalShow, setExportModalShow] = useState(false);

  const analysisDetailsData = useMemo(() => {
    if (props.response.status !== "success") return [];
    return Object.entries(props.response.data)
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
      }));
  }, [props.response]);

  return (
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
        handleExport={handleJSONExport(props)}
      />
      <Row className="h-100">
        <Col xs={3} xl={2}>
          <Stack gap={1}>
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
                data={analysisDetailsData}
                defaultFileNamePrefix={`${props.analysisID}_details`}
                footer="Table showing the top-level fields for the analysis."
              />
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
}

function AnalysisRecordsContent(props: RecordListResponseProps) {
  const analysisRecordsData = useMemo(() => {
    if (props.response.status !== "success") return [];
    return props.response.data;
  }, [props.response]);

  return (
    <>
      <h5>Records</h5>
      <Table
        {...props}
        data={analysisRecordsData}
        defaultFileNamePrefix={`${props.analysisID}_records`}
        footer="Table showing all records involved in the analysis."
        cellRenderers={
          new Map([["climb_id", ClimbIDCellRendererFactory(props)]])
        }
      />
    </>
  );
}

function AnalysisData(props: AnalysisModalProps) {
  // Fetch analysis data, depending on project and analysis ID
  const {
    isFetching: analysisDetailPending,
    error: analysisDetailError,
    data: analysisDetailResponse,
  } = useQuery({
    queryKey: ["analysis-detail", props.project, props.analysisID],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/analysis/${props.analysisID}/`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.analysisID),
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: {} },
  });

  return (
    <QueryHandler
      isFetching={analysisDetailPending}
      error={analysisDetailError as Error}
      data={analysisDetailResponse}
    >
      <AnalysisDataContent {...props} response={analysisDetailResponse} />
    </QueryHandler>
  );
}

function AnalysisRecords(props: AnalysisModalProps) {
  // Fetch analysis records, depending on project and analysis ID
  const {
    isFetching: analysisRecordsPending,
    error: analysisRecordsError,
    data: analysisRecordsResponse,
  } = useQuery({
    queryKey: ["analysis-records", props.project, props.analysisID],
    queryFn: async () => {
      // TODO: Proper endpoint doesn't actually exist
      return props
        .httpPathHandler(`projects/${props.project}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.analysisID),
    staleTime: 1 * 60 * 1000,
    placeholderData: { data: [] },
  });

  return (
    <QueryHandler
      isFetching={analysisRecordsPending}
      error={analysisRecordsError as Error}
      data={analysisRecordsResponse}
    >
      <AnalysisRecordsContent {...props} response={analysisRecordsResponse} />
    </QueryHandler>
  );
}

function AnalysisModal(props: AnalysisModalProps) {
  return (
    <Modal
      className="onyx-modal"
      dialogClassName="onyx-modal-dialog"
      contentClassName="onyx-modal-content"
      aria-labelledby="analysis-modal-title"
      show={props.show}
      onHide={props.onHide}
      scrollable
      centered
      animation={false}
    >
      <Modal.Header closeButton>
        <Modal.Title id="analysis-modal-title">
          Analysis ID:{" "}
          <span className="onyx-text-pink">{props.analysisID}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
            <AnalysisData {...props} />
          </Tab>
          <Tab
            eventKey="analysis-records-tab"
            title="Records"
            className="onyx-modal-tab-pane"
            mountOnEnter
          >
            <AnalysisRecords {...props} />
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={props.onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AnalysisModal;
