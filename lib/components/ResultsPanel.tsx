import { useCallback, useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { MdTableRows } from "react-icons/md";
import { ExportHandlerProps, ResultsProps } from "../interfaces";
import {
  ErrorResponse,
  Field,
  ListResponse,
  RecordType,
  TableRow,
} from "../types";
import { getDefaultFileNamePrefix } from "../utils/functions";
import { s3BucketsMessage } from "../utils/messages";
import { SidebarButton } from "./Buttons";
import {
  AnalysisIDCellRendererFactory,
  RecordIDCellRendererFactory,
  S3ReportCellRendererFactory,
} from "./CellRenderers";
import ErrorModal from "./ErrorModal";
import PageTitle from "./PageTitle";
import QueryHandler from "./QueryHandler";
import Table, { ServerTable } from "./Table";
import { useFieldDescriptions } from "../api/hooks";
import { SortChangedEvent } from "@ag-grid-community/core";

interface ResultsPanelProps extends ResultsProps {
  searchParameters: string;
  pageSize: number;
  data: ListResponse<RecordType> | ErrorResponse | undefined;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (sideBarCollapsed: boolean) => void;
  setColumnsModalShow: (show: boolean) => void;
  columns: Field[];
  isResultsFetching: boolean;
  resultsError: Error | null;
  results: TableRow[];
  isCountFetching: boolean;
  count: number;
  page: number;
  order: string;
  handleExportData: (exportProps: ExportHandlerProps) => Promise<string>;
  handleSortChange: (event: SortChangedEvent) => void;
  handlePageChange: (page: number) => void;
}

function ResultsPanel(props: ResultsPanelProps) {
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);

  const defaultFileNamePrefix = useMemo(
    () =>
      getDefaultFileNamePrefix(
        `${props.project.code}_${props.title.toLowerCase()}`,
        props.searchParameters
      ),
    [props.project, props.title, props.searchParameters]
  );

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

  const cellRenderers = useMemo(() => {
    return new Map([
      [props.recordPrimaryID, RecordIDCellRendererFactory(props)],
      [props.analysisPrimaryID, AnalysisIDCellRendererFactory(props)],
      ["ingest_report", S3ReportCellRendererFactory(errorModalProps)],
      ["report", S3ReportCellRendererFactory(errorModalProps)],
    ]);
  }, [props, errorModalProps]);

  const fieldDescriptions = useFieldDescriptions(props.fields.fields_map);

  const isSummarise = useMemo(() => {
    return props.searchParameters.includes("summarise=");
  }, [props.searchParameters]);

  return (
    <Card className="h-100 overflow-y-auto">
      <Card.Header>
        <Stack gap={2} direction="horizontal">
          <SidebarButton
            sidebarCollapsed={props.sidebarCollapsed}
            setSidebarCollapsed={props.setSidebarCollapsed}
          />
          <span className="me-auto text-truncate">
            <PageTitle
              title={props.title}
              description={props.fields.description}
            />
          </span>
          <div
            title={
              isSummarise
                ? "Columns cannot be edited in summarised results"
                : "Edit Columns"
            }
          >
            <Button
              disabled={isSummarise}
              size="sm"
              variant="secondary"
              title="Edit Columns"
              onClick={() => props.setColumnsModalShow(true)}
            >
              <MdTableRows /> Edit Columns
            </Button>
          </div>
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
          isFetching={false}
          error={props.resultsError}
          data={props.data}
        >
          {!props.searchParameters.includes("summarise=") ? (
            <ServerTable
              {...props}
              defaultFileNamePrefix={defaultFileNamePrefix}
              headerTooltips={fieldDescriptions}
              cellRenderers={cellRenderers}
              data={props.results}
              columns={props.columns}
              isResultsFetching={props.isResultsFetching}
              count={props.count}
              isCountFetching={props.isCountFetching}
              page={props.page}
              defaultSort={
                new Map<string, "asc" | "desc">([
                  props.order.startsWith("-")
                    ? [props.order.slice(1), "desc"]
                    : [props.order, "asc"],
                ])
              }
              handleExportData={props.handleExportData}
              handleSortChange={props.handleSortChange}
              handlePageChange={props.handlePageChange}
            />
          ) : (
            <Table
              {...props}
              data={props.results}
              defaultFileNamePrefix={defaultFileNamePrefix}
              headerTooltips={fieldDescriptions}
              cellRenderers={cellRenderers}
            />
          )}
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

export default ResultsPanel;
