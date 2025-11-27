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
import { useFieldDescriptions } from "../api/hooks";

interface ResultsPanelProps extends ResultsProps {
  defaultFileNamePrefix: string;
  pageSize: number;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (sideBarCollapsed: boolean) => void;
  setColumnsModalShow: (show: boolean) => void;
  colDefs: ColDef[];
  isResultsFetching: boolean;
  resultsError: Error | null;
  resultsResponse: ListResponse<RecordType> | ErrorResponse | undefined;
  data: InputRow[];
  isCountFetching: boolean;
  count: number;
  page: number;
  order: string;
  isServerTable: boolean;
  handleExportData: (exportProps: ExportHandlerProps) => Promise<string>;
  handleSortChange: (event: SortChangedEvent) => void;
  handlePageChange: (page: number) => void;
  cellRenderers: Map<string, (params: CustomCellRendererProps) => JSX.Element>;
}

function ResultsPanel(props: ResultsPanelProps) {
  const fieldDescriptions = useFieldDescriptions(props.fields.fields_map);

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
            <ServerTable {...props} headerTooltips={fieldDescriptions} />
          ) : (
            <Table {...props} headerTooltips={fieldDescriptions} />
          )}
        </QueryHandler>
      </Card.Body>
    </Card>
  );
}

export default ResultsPanel;
