import { useState } from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Toast from "react-bootstrap/Toast";
import { mkConfig, generateCsv, asString } from "export-to-csv";
import Table from "./Table";
import { ServerPaginatedTable } from "./Table";
import QueryHandler from "./QueryHandler";
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
  handleRecordModalShow: (climbID: string) => void;
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
  const [showExportToast, setShowExportToast] = useState(false);

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
      setShowExportToast(true);
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
        <Toast
          onClose={() => setShowExportToast(false)}
          show={showExportToast}
          delay={3000}
          autohide
          style={{
            position: "absolute",
            top: 50,
            right: 15,
            zIndex: 9999,
          }}
        >
          <Toast.Header>
            <strong className="me-auto">Export Started</strong>
          </Toast.Header>
          <Toast.Body>
            File: <strong>{fileName}.csv</strong>
          </Toast.Body>
        </Toast>
      </Card.Header>
      <Container fluid className="onyx-results-panel-body p-2 pb-0">
        <QueryHandler
          isFetching={props.resultPending}
          error={props.resultError}
          data={props.resultData}
        >
          {props.searchParameters.includes("summarise=") ? (
            <Table
              data={props.resultData || {}}
              headerTooltips={props.fieldDescriptions}
              handleRecordModalShow={props.handleRecordModalShow}
              s3PathHandler={props.s3PathHandler}
            />
          ) : (
            <ServerPaginatedTable
              project={props.project}
              data={props.resultData || {}}
              searchParameters={props.searchParameters}
              headerTooltips={props.fieldDescriptions}
              handleRecordModalShow={props.handleRecordModalShow}
              httpPathHandler={props.httpPathHandler}
              s3PathHandler={props.s3PathHandler}
            />
          )}
        </QueryHandler>
      </Container>
    </Card>
  );
}

export default ResultsPanel;
