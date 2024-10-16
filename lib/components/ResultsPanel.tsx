import { useMemo } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
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
  const defaultFileNamePrefix = useMemo(
    () => getDefaultFileNamePrefix(props.project, props.searchParameters),
    [props.project, props.searchParameters]
  );

  return (
    <Card>
      <Card.Header>Results</Card.Header>
      <Container fluid className="onyx-results-panel-body p-2 pb-0">
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
              handleRecordModalShow={props.handleRecordModalShow}
            />
          ) : (
            <ServerPaginatedTable
              {...props}
              searchParameters={props.searchParameters}
              defaultFileNamePrefix={defaultFileNamePrefix}
              data={props.resultData || {}}
              headerTooltips={props.fieldDescriptions}
              handleRecordModalShow={props.handleRecordModalShow}
            />
          )}
        </QueryHandler>
      </Container>
    </Card>
  );
}

export default ResultsPanel;
