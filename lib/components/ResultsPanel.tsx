import { useMemo, useState } from "react";
import { CustomCellRendererProps } from "@ag-grid-community/react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Table from "./Table";
import ErrorModal from "./ErrorModal";
import { ServerPaginatedTable } from "./Table";
import QueryHandler from "./QueryHandler";
import { ResultData } from "../types";
import { DataProps } from "../interfaces";
import { s3BucketsMessage } from "../utils/errorMessages";

interface ResultsPanelProps extends DataProps {
  resultPending: boolean;
  resultError: Error | null;
  resultData: ResultData;
  searchParameters: string;
  handleRecordModalShow: (climbID: string) => void;
}

function getDefaultFileNamePrefix(project: string, searchParameters: string) {
  // Create the default file name prefix based on the project and search parameters
  // Uses filter/search values only, replaces commas and spaces with underscores,
  // removes special characters, and truncates to 50 characters
  return [["", project]]
    .concat(Array.from(new URLSearchParams(searchParameters).entries()))
    .map(([, value]) =>
      value.split(/[ ,]+/).map((v) => v.replace(/[^a-zA-Z0-9_/-]/, ""))
    )
    .flat()
    .join("_")
    .slice(0, 50);
}

function ResultsPanel(props: ResultsPanelProps) {
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);

  const defaultFileNamePrefix = useMemo(
    () => getDefaultFileNamePrefix(props.project, props.searchParameters),
    [props.project, props.searchParameters]
  );

  const handleErrorModalShow = (error: Error) => {
    setS3ReportError(error);
    setErrorModalShow(true);
  };

  const ClimbIDCellRenderer = (cellRendererProps: CustomCellRendererProps) => {
    return (
      <Button
        className="p-0"
        size="sm"
        variant="link"
        onClick={() => props.handleRecordModalShow(cellRendererProps.value)}
      >
        {cellRendererProps.value}
      </Button>
    );
  };

  const S3ReportCellRenderer = (cellRendererProps: CustomCellRendererProps) => {
    return (
      <Button
        className="p-0"
        size="sm"
        variant="link"
        onClick={() =>
          props
            .s3PathHandler(cellRendererProps.value)
            .catch((error: Error) => handleErrorModalShow(error))
        }
      >
        {cellRendererProps.value}
      </Button>
    );
  };

  const cellRenderers = new Map([
    ["climb_id", ClimbIDCellRenderer],
    ["ingest_report", S3ReportCellRenderer],
  ]);

  return (
    <Card className="h-100">
      <Card.Header>Results</Card.Header>
      <Container fluid className="p-2 pb-0 h-100">
        <ErrorModal
          title="S3 Reports"
          message={s3BucketsMessage}
          error={s3ReportError}
          show={errorModalShow}
          onHide={() => setErrorModalShow(false)}
        />
        <QueryHandler
          isFetching={props.resultPending}
          error={props.resultError}
          data={props.resultData}
        >
          {props.searchParameters.includes("summarise=") ? (
            <Table
              {...props}
              data={props.resultData || {}}
              defaultFileNamePrefix={defaultFileNamePrefix}
              headerTooltips={props.fieldDescriptions}
              cellRenderers={cellRenderers}
            />
          ) : (
            <ServerPaginatedTable
              {...props}
              searchParameters={props.searchParameters}
              defaultFileNamePrefix={defaultFileNamePrefix}
              data={props.resultData || {}}
              headerTooltips={props.fieldDescriptions}
              cellRenderers={cellRenderers}
            />
          )}
        </QueryHandler>
      </Container>
    </Card>
  );
}

export default ResultsPanel;
