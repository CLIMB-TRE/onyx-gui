import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Button from "react-bootstrap/Button";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import { useQuery } from "@tanstack/react-query";
import { DataProps, ExportHandlerProps } from "../interfaces";
import QueryHandler from "./QueryHandler";
import Table from "./Table";
import ExportModal from "./ExportModal";
import { AnalysisData, AnalysisType, ExportStatus } from "../types";
import { ClimbIDCellRendererFactory } from "./CellRenderers";

interface AnalysisModalProps extends DataProps {
  analysisID: string;
  show: boolean;
  onHide: () => void;
}

interface AnalysisDataProps extends AnalysisModalProps {
  analysisDataPending: boolean;
  analysisDataError: Error | null;
  analysisData: AnalysisData;
}

function AnalysisDetails(props: AnalysisDataProps) {
  const [exportModalShow, setExportModalShow] = useState(false);

  const handleJSONExport = (exportProps: ExportHandlerProps) => {
    const jsonData = JSON.stringify(props.analysisData.data);
    exportProps.setExportStatus(ExportStatus.WRITING);
    props
      .fileWriter(exportProps.fileName, jsonData)
      .then(() => exportProps.setExportStatus(ExportStatus.FINISHED))
      .catch((error: Error) => {
        exportProps.setExportError(error);
        exportProps.setExportStatus(ExportStatus.ERROR);
      });
  };

  return (
    <QueryHandler
      isFetching={props.analysisDataPending}
      error={props.analysisDataError as Error}
      data={props.analysisData}
    >
      <Tab.Container
        id="analysis-data-tabs"
        defaultActiveKey="analysis-data-details"
      >
        <ExportModal
          {...props}
          defaultFileNamePrefix={props.analysisID}
          fileExtension=".json"
          show={exportModalShow}
          handleExport={handleJSONExport}
          onHide={() => setExportModalShow(false)}
          exportProgressMessage={"Exporting record data to JSON..."}
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
                  data={
                    {
                      data: Object.entries(props.analysisData?.data || {})
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
                        })),
                    } as unknown as AnalysisData
                  }
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

function AnalysisRecords(props: AnalysisDataProps) {
  return (
    <>
      <h5>Records</h5>
      <QueryHandler
        isFetching={props.analysisDataPending}
        error={props.analysisDataError as Error}
        data={props.analysisData}
      >
        <Table
          {...props}
          data={
            {
              // TODO: Sort out response types because this is a mess
              data: (
                props.analysisData?.data as unknown as AnalysisType
              ).records.map((climb_id: string) => ({
                climb_id: climb_id,
              })),
            } as unknown as AnalysisData
          }
          defaultFileNamePrefix={`${props.analysisID}_records`}
          footer="Table showing all records involved in the analysis."
          cellRenderers={
            new Map([["climb_id", ClimbIDCellRendererFactory(props)]])
          }
        />
      </QueryHandler>
    </>
  );
}

function AnalysisModal(props: AnalysisModalProps) {
  // Fetch analysis data, depending on project and analysis ID
  const {
    isFetching: analysisDataPending,
    error: analysisDataError,
    data: analysisData = { data: {} },
  } = useQuery({
    queryKey: ["analysis-data", props.project, props.analysisID],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/analysis/${props.analysisID}/`
        )
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.analysisID),
    staleTime: 1 * 60 * 1000,
  });

  return (
    <Modal
      className="onyx-modal"
      dialogClassName="onyx-modal-dialog"
      contentClassName="onyx-modal-content"
      show={props.show}
      onHide={props.onHide}
      aria-labelledby="record-modal-title"
      scrollable
      centered
      animation={false}
    >
      <Modal.Header closeButton>
        <Modal.Title id="record-modal-title">
          Analysis ID:{" "}
          <span className="onyx-text-pink">{props.analysisID}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs
          defaultActiveKey="analysis-data"
          id="analysis-modal-tabs"
          className="mb-3"
        >
          <Tab
            eventKey="analysis-data"
            title="Data"
            className="onyx-modal-tab-pane"
            mountOnEnter
          >
            <AnalysisDetails
              {...props}
              analysisDataPending={analysisDataPending}
              analysisDataError={analysisDataError as Error}
              analysisData={analysisData}
            />
          </Tab>
          <Tab
            eventKey="analysis-records"
            title="Records"
            className="onyx-modal-tab-pane"
            mountOnEnter
          >
            <AnalysisRecords
              {...props}
              analysisDataPending={analysisDataPending}
              analysisDataError={analysisDataError as Error}
              analysisData={analysisData}
            />
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
