import { useCallback, useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Stack from "react-bootstrap/Stack";
import { ResultsProps } from "../interfaces";
import { ErrorResponse, ListResponse, RecordType } from "../types";
import { getDefaultFileNamePrefix } from "../utils/functions";
import { s3BucketsMessage } from "../utils/messages";
import { SidebarButton } from "./Buttons";
import {
  AnalysisIDCellRendererFactory,
  ClimbIDCellRendererFactory,
  S3ReportCellRendererFactory,
} from "./CellRenderers";
import ErrorModal from "./ErrorModal";
import PageTitle from "./PageTitle";
import QueryHandler from "./QueryHandler";
import Table, { ServerPaginatedTable } from "./Table";

interface ResultsPanelProps extends ResultsProps {
  searchParameters: string;
  isFetching: boolean;
  error: Error | null;
  data: ListResponse | ErrorResponse;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (sideBarCollapsed: boolean) => void;
}

function ResultsPanel(props: ResultsPanelProps) {
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);

  const defaultFileNamePrefix = useMemo(
    () =>
      getDefaultFileNamePrefix(
        `${props.project}_${props.title.toLowerCase()}`,
        props.searchParameters
      ),
    [props.project, props.title, props.searchParameters]
  );

  // Get the result data
  const results = useMemo(() => {
    if (props.data?.status !== "success")
      return { data: [] as RecordType[] } as ListResponse;
    return props.data;
  }, [props.data]);

  const handleErrorModalShow = useCallback((error: Error) => {
    setS3ReportError(error);
    setErrorModalShow(true);
  }, []);

  const errorModalProps = useMemo(
    () => ({
      ...props,
      handleErrorModalShow,
    }),
    [props, handleErrorModalShow]
  );

  const cellRenderers = new Map([
    ["climb_id", ClimbIDCellRendererFactory(props)],
    ["analysis_id", AnalysisIDCellRendererFactory(props)],
    ["ingest_report", S3ReportCellRendererFactory(errorModalProps)],
    ["report", S3ReportCellRendererFactory(errorModalProps)],
  ]);

  return (
    <Card className="h-100 overflow-y-auto">
      <Card.Header>
        <Stack gap={2} direction="horizontal">
          <SidebarButton {...props} />
          <PageTitle {...props} />
        </Stack>
      </Card.Header>
      <Card.Body className="h-100 p-2 overflow-y-auto">
        <ErrorModal
          title="S3 Reports"
          message={s3BucketsMessage}
          error={s3ReportError}
          show={errorModalShow}
          onHide={() => setErrorModalShow(false)}
        />
        <QueryHandler
          isFetching={props.isFetching}
          error={props.error}
          data={props.data}
        >
          {!props.searchParameters.includes("summarise=") ? (
            <ServerPaginatedTable
              {...props}
              response={results}
              defaultFileNamePrefix={defaultFileNamePrefix}
              headerTooltips={props.fieldDescriptions}
              cellRenderers={cellRenderers}
            />
          ) : (
            <Table
              {...props}
              data={results.data}
              defaultFileNamePrefix={defaultFileNamePrefix}
              headerTooltips={props.fieldDescriptions}
              cellRenderers={cellRenderers}
            />
          )}
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

export default ResultsPanel;
