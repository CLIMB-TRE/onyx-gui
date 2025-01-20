import { useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import ErrorModal from "./ErrorModal";
import Table, { ServerPaginatedTable } from "./Table";
import QueryHandler from "./QueryHandler";
import {
  RecordType,
  RecordListResponse,
  AnalysisListResponse,
  ErrorResponse,
} from "../types";
import { DataProps } from "../interfaces";
import {
  ClimbIDCellRendererFactory,
  AnalysisIDCellRendererFactory,
  S3ReportCellRendererFactory,
} from "./CellRenderers";
import { s3BucketsMessage } from "../utils/messages";
import { getDefaultFileNamePrefix } from "../utils/functions";

interface ResultsPanelProps extends DataProps {
  title: string;
  searchPath: string;
  searchParameters: string;
  resultsPending: boolean;
  resultsError: Error | null;
  resultsResponse: RecordListResponse | AnalysisListResponse | ErrorResponse;
}

interface ResultsPanelContentProps extends ResultsPanelProps {
  handleErrorModalShow: (error: Error) => void;
}

function ResultsPanelContent(props: ResultsPanelContentProps) {
  const defaultFileNamePrefix = useMemo(
    () => getDefaultFileNamePrefix(props.project, props.searchParameters),
    [props.project, props.searchParameters]
  );

  const resultsResponse = useMemo(() => {
    if (props.resultsResponse.status !== "success")
      return { data: [] as RecordType[] } as RecordListResponse;
    return props.resultsResponse;
  }, [props.resultsResponse]);

  const cellRenderers = new Map([
    ["climb_id", ClimbIDCellRendererFactory(props)],
    ["analysis_id", AnalysisIDCellRendererFactory(props)],
    ["ingest_report", S3ReportCellRendererFactory(props)],
  ]);

  return !props.searchParameters.includes("summarise=") ? (
    <ServerPaginatedTable
      {...props}
      response={resultsResponse}
      defaultFileNamePrefix={defaultFileNamePrefix}
      headerTooltips={props.fieldDescriptions}
      cellRenderers={cellRenderers}
    />
  ) : (
    <Table
      {...props}
      data={resultsResponse.data}
      defaultFileNamePrefix={defaultFileNamePrefix}
      headerTooltips={props.fieldDescriptions}
      cellRenderers={cellRenderers}
    />
  );
}

function ResultsPanel(props: ResultsPanelProps) {
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);

  const handleErrorModalShow = (error: Error) => {
    setS3ReportError(error);
    setErrorModalShow(true);
  };

  return (
    <Card className="h-100">
      <Card.Header>{props.title}</Card.Header>
      <Container fluid className="p-2 pb-0 h-100">
        <ErrorModal
          title="S3 Reports"
          message={s3BucketsMessage}
          error={s3ReportError}
          show={errorModalShow}
          onHide={() => setErrorModalShow(false)}
        />
        <QueryHandler
          isFetching={props.resultsPending}
          error={props.resultsError}
          data={props.resultsResponse}
        >
          <ResultsPanelContent
            {...props}
            handleErrorModalShow={handleErrorModalShow}
          />
        </QueryHandler>
      </Container>
    </Card>
  );
}

export default ResultsPanel;
