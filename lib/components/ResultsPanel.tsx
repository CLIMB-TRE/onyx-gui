import { ColDef, SortChangedEvent } from "@ag-grid-community/core";
import { CustomCellRendererProps } from "@ag-grid-community/react";
import Card from "react-bootstrap/Card";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { MdTableRows } from "react-icons/md";
import { ExportHandlerProps, ResultsProps } from "../interfaces";
import { ErrorResponse, InputRow, ListResponse, RecordType } from "../types";
import { SidebarButton } from "./Buttons";
import PageTitle from "./PageTitle";
import QueryHandler from "./QueryHandler";
import Table, { ServerTable } from "./Table";

interface ResultsPanelProps extends ResultsProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (sideBarCollapsed: boolean) => void;
  setColumnsModalShow: (show: boolean) => void;
  isServerTable: boolean;
  data: InputRow[];
  cellRenderers: Map<string, (params: CustomCellRendererProps) => JSX.Element>;
  headerTooltips: Map<string, string>;
  defaultFileNamePrefix: string;
  isResultsFetching: boolean;
  resultsError: Error | null;
  resultsResponse: ListResponse<RecordType> | ErrorResponse | undefined;
  isCountFetching: boolean;
  count: number;
  page: number;
  pageSize: number;
  order: string;
  handleExportData: (exportProps: ExportHandlerProps) => Promise<string>;
  handleSortChange: (event: SortChangedEvent) => void;
  handlePageChange: (page: number) => void;
  colDefs: ColDef[];
}

function ResultsPanel(props: ResultsPanelProps) {
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
              props.isServerTable
                ? "Edit Columns"
                : "Columns cannot be edited in summarised results"
            }
          >
            <Button
              disabled={!props.isServerTable}
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
        <QueryHandler
          isFetching={false}
          error={props.resultsError}
          data={props.resultsResponse}
        >
          {props.isServerTable ? (
            <ServerTable
              data={props.data}
              isDataFetching={props.isResultsFetching}
              isCountFetching={props.isCountFetching}
              cellRenderers={props.cellRenderers}
              headerTooltips={props.headerTooltips}
              fileWriter={props.fileWriter}
              defaultFileNamePrefix={props.defaultFileNamePrefix}
              colDefs={props.colDefs}
              count={props.count}
              page={props.page}
              pageSize={props.pageSize}
              order={props.order}
              handleExportData={props.handleExportData}
              handleSortChange={props.handleSortChange}
              handlePageChange={props.handlePageChange}
            />
          ) : (
            <Table
              data={props.data}
              isDataFetching={props.isResultsFetching}
              isCountFetching={props.isResultsFetching}
              cellRenderers={props.cellRenderers}
              headerTooltips={props.headerTooltips}
              fileWriter={props.fileWriter}
              defaultFileNamePrefix={props.defaultFileNamePrefix}
            />
          )}
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

export default ResultsPanel;
