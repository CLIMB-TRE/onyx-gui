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
  setSearchParameters: (params: string) => void;
  handleRecordModalShow: (climbID: string) => void;
}

function ResultsPanel(props: ResultsPanelProps) {
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
              headerTooltips={props.fieldDescriptions}
              handleRecordModalShow={props.handleRecordModalShow}
            />
          ) : (
            <ServerPaginatedTable
              {...props}
              searchParameters={props.searchParameters}
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
