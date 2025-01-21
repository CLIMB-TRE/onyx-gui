import { useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Button from "react-bootstrap/Button";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import { DataProps } from "../interfaces";
import QueryHandler from "./QueryHandler";
import History from "./History";
import { useAnalysisQuery, useAnalysisRecordsQuery } from "../api";
import Table from "./Table";
import ExportModal from "./ExportModal";
import { ClimbIDCellRendererFactory } from "./CellRenderers";
import { handleJSONExport } from "../utils/functions";
import { RecordType } from "../types";

interface AnalysisModalProps extends DataProps {
  analysisID: string;
  show: boolean;
  onHide: () => void;
}

function Details(props: AnalysisModalProps) {
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

function Records(props: AnalysisModalProps) {
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
