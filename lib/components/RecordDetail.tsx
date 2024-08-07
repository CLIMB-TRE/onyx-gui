import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { useQuery } from "@tanstack/react-query";
import ResultsTable from "./ResultsTable";
import { DelayedLoadingAlert } from "./LoadingAlert";
import ErrorMessages from "./ErrorMessages";
import { ResultType } from "../types";
import { DataProps } from "../interfaces";

interface RecordDetailProps extends DataProps {
  recordID: string;
  show: boolean;
  onHide: () => void;
}

function RecordDetail(props: RecordDetailProps) {
  // Fetch record, depending on project and record ID
  const {
    isFetching: recordPending,
    error: recordError,
    data: recordData = {},
  } = useQuery({
    queryKey: ["results", props.project, props.recordID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/${props.recordID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.recordID),
    staleTime: 1 * 60 * 1000,
  });

  const handleExportToJSON = () => {
    const jsonData = JSON.stringify(recordData.data || {});

    if (props.fileWriter) {
      props.fileWriter(props.recordID + ".json", jsonData);
    }
  };

  return (
    <Modal
      className="onyx-record-detail"
      show={props.show}
      onHide={props.onHide}
      dialogClassName="modal-xl"
      aria-labelledby="contained-modal-title-vcenter"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          <Container fluid>
            CLIMB ID: <span className="onyx-text-pink">{props.recordID}</span>
          </Container>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {recordPending ? (
          <DelayedLoadingAlert />
        ) : recordError ? (
          <Alert variant="danger">
            Error: {(recordError as Error).message}
          </Alert>
        ) : recordData.messages ? (
          <ErrorMessages messages={recordData.messages} />
        ) : (
          recordData.data && (
            <Container fluid>
              <Stack gap={2} direction="vertical">
                <h5>
                  Published Date:{" "}
                  <span className="onyx-text-pink">
                    {recordData.data["published_date"]}
                  </span>
                  <Button
                    className="float-end"
                    size="sm"
                    disabled={!props.fileWriter}
                    variant="success"
                    onClick={handleExportToJSON}
                  >
                    Export Record to JSON
                  </Button>
                </h5>

                <h5>
                  Site:{" "}
                  <span className="onyx-text-pink">
                    {recordData.data["site"]}
                  </span>
                </h5>
              </Stack>
              <hr />
              <Tabs
                defaultActiveKey="recordDetails"
                id="uncontrolled-tab-example"
                className="mb-3"
              >
                <Tab eventKey="recordDetails" title="Details">
                  <ResultsTable
                    data={
                      Object.entries(recordData.data)
                        .filter(([, value]) => {
                          return !(value instanceof Array);
                        })
                        .map(([key, value]) => ({
                          Field: key,
                          Value: value,
                        })) as ResultType[]
                    }
                    s3PathHandler={props.s3PathHandler}
                  />
                </Tab>
                {Object.entries(recordData.data)
                  .filter(([, value]) => value instanceof Array)
                  .sort()
                  .map(([key, value], index) => (
                    <Tab key={key} eventKey={index} title={key}>
                      <ResultsTable
                        data={value as ResultType[]}
                        s3PathHandler={props.s3PathHandler}
                      />
                    </Tab>
                  ))}
              </Tabs>
            </Container>
          )
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={props.onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RecordDetail;
