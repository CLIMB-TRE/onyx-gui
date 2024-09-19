import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { mkConfig, generateCsv, asString } from "export-to-csv";
import Table from "./Table";
import { LoadingAlert } from "./LoadingAlert";
import ErrorMessages from "./ErrorMessages";
import { ResultData } from "../types";
import { DataProps } from "../interfaces";

interface ResultsPanelProps extends DataProps {
  resultPending: boolean;
  resultError: Error | null;
  resultData: ResultData;
  searchParameters: string;
  setSearchParameters: (params: string) => void;
  pageNumber: number;
  setPageNumber: (page: number) => void;
  handleRecordDetailShow: (climbID: string) => void;
}

function formatResultData(resultData: ResultData) {
  // For CSV export, we allow string, number and boolean values
  // All other types are converted to strings
  return (
    resultData.data?.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
            ? value
            : value === null
            ? ""
            : JSON.stringify(value),
        ])
      )
    ) || []
  );
}

function ResultsPanel(props: ResultsPanelProps) {
  const fileName = `${props.project}${
    props.pageNumber > 1 ? "_" + props.pageNumber.toString() : ""
  }`;

  const csvConfig = mkConfig({
    filename: fileName,
    useKeysAsHeaders: true,
  });

  const handleExportToCSV = () => {
    const csvData = asString(
      generateCsv(csvConfig)(formatResultData(props.resultData))
    );

    if (props.fileWriter) {
      props.fileWriter(fileName + ".csv", csvData);
    }
  };

  return (
    <Card>
      <Card.Header>
        <span>Results</span>
        <Button
          className="float-end"
          size="sm"
          disabled={!props.fileWriter}
          variant="success"
          onClick={handleExportToCSV}
        >
          Export Page to CSV
        </Button>
      </Card.Header>
      <Container fluid className="onyx-results-panel-body p-2">
        {props.resultPending ? (
          <LoadingAlert />
        ) : props.resultError ? (
          <Alert variant="danger">Error: {props.resultError.message}</Alert>
        ) : props.resultData.messages ? (
          <ErrorMessages messages={props.resultData.messages} />
        ) : (
          <Table
            project={props.project}
            data={props.resultData || {}}
            searchParameters={props.searchParameters}
            titles={props.fieldDescriptions}
            handleRecordDetailShow={props.handleRecordDetailShow}
            httpPathHandler={props.httpPathHandler}
            s3PathHandler={props.s3PathHandler}
            isServerData={
              !(!props.resultData?.next && !props.resultData?.previous)
            }
          />
        )}
      </Container>
    </Card>
  );
}

export default ResultsPanel;
