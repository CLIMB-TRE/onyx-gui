import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import {
  ColDef,
  ITooltipParams,
  ModuleRegistry,
  SortChangedEvent,
  SortDirection,
} from "@ag-grid-community/core";
import { CsvExportModule } from "@ag-grid-community/csv-export";
import { AgGridReact, CustomCellRendererProps } from "@ag-grid-community/react"; // React Data Grid Component
import "@ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "@ag-grid-community/styles/ag-theme-quartz.min.css"; // Optional Theme applied to the Data Grid
import { useCallback, useMemo, useRef, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import DropdownDivider from "react-bootstrap/DropdownDivider";
import Pagination from "react-bootstrap/Pagination";
import Row from "react-bootstrap/Row";
import Stack from "react-bootstrap/Stack";
import { ExportHandlerProps, OnyxProps } from "../interfaces";
import {
  ExportStatus,
  DefaultPrimaryID,
  TableRow,
  InputRow,
  Fields,
  Field,
} from "../types";
import ExportModal from "./ExportModal";

ModuleRegistry.registerModules([ClientSideRowModelModule, CsvExportModule]);

interface BaseTableProps extends OnyxProps {
  rowData: TableRow[];
  columnDefs: ColDef[];
  defaultFileNamePrefix: string;
  handleExportData: (
    exportProps: ExportHandlerProps,
    gridRef?: React.RefObject<AgGridReact<TableRow>>
  ) => Promise<string>;
  handlePageChange?: (page: number) => void;
  handleSortChange?: (event: SortChangedEvent) => void;
  footer?: string;
  isResultsFetching?: boolean;
  isCountFetching?: boolean;
  isFilterable: boolean;
  count: number;
  fromCount: number;
  toCount: number;
  setToCount?: (toCount: number) => void;
  pageNumber: number;
  numPages: number;
  isPrevPage?: boolean;
  isNextPage?: boolean;
}

interface TableOptionsProps extends BaseTableProps {
  gridRef: React.RefObject<AgGridReact<TableRow>>;
}

interface TableProps extends OnyxProps {
  fields?: Fields;
  defaultFileNamePrefix: string;
  headerNames?: Map<string, string>;
  headerTooltips?: Map<string, string>;
  headerTooltipPrefix?: string;
  tooltipFields?: string[];
  flexOnly?: string[];
  includeOnly?: string[];
  defaultSort?: Map<string, SortDirection>;
  footer?: string;
  cellRenderers?: Map<string, (params: CustomCellRendererProps) => JSX.Element>;
  recordPrimaryID?: string;
  analysisPrimaryID?: string;
}

interface ClientTableProps extends TableProps {
  data: InputRow[];
}

interface ServerTableProps extends TableProps {
  columns: Field[];
  isResultsFetching: boolean;
  data: TableRow[];
  count: number;
  isCountFetching: boolean;
  page: number;
  pageSize: number;
  handleExportData: (exportProps: ExportHandlerProps) => Promise<string>;
  handleSortChange: (event: SortChangedEvent) => void;
  handlePageChange: (page: number) => void;
}

/** Converts InputRow[] to TableRow[]. All non-string/number values are converted to strings. */
function formatData(data: InputRow[]): TableRow[] {
  return data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === "string" || typeof value === "number"
          ? value
          : typeof value === "boolean" || value === null
          ? value?.toString() || ""
          : JSON.stringify(value),
      ])
    )
  );
}

/** Generates column definitions for the table. */
function getColDefs(
  props: TableProps,
  data: InputRow[],
  isServerPaginated: boolean
): ColDef[] {
  let colDefs: ColDef[];

  if (data && data.length > 0) {
    let keys: string[];
    if (props.includeOnly) keys = props.includeOnly;
    else keys = Object.keys(data[0]);

    colDefs = keys.map((key) => {
      const width = 100 + 20 * Math.round(Math.log(key.length));
      const colDef: ColDef = {
        field: key,
        headerName: props.headerNames?.get(key) || key,
        minWidth: width,
        width: isServerPaginated ? width : undefined,
        headerTooltip: props.headerTooltips?.get(
          (props.headerTooltipPrefix || "") + key
        ),
        unSortIcon: true,
      };

      // Disable AGGrid sorting for server paginated tables
      if (isServerPaginated) colDef.comparator = () => 0;

      // Apply custom cell renderers
      if (props.cellRenderers?.get(key))
        colDef.cellRenderer = props.cellRenderers.get(key);

      if (
        key === DefaultPrimaryID.RECORD ||
        key === DefaultPrimaryID.ANALYSIS ||
        key === props.recordPrimaryID ||
        key === props.analysisPrimaryID
      ) {
        // ID fields pinned to the left
        colDef.pinned = "left";
      } else if (key === "changes" || key === "error_messages") {
        // History 'changes' field is a special case
        // where we want variable height and wrapped text
        colDef.autoHeight = true;
        colDef.wrapText = true;
      }

      // Apply default sorts
      if (props.defaultSort?.has(key)) colDef.sort = props.defaultSort.get(key);

      // Apply tooltip value getter for fields that should display tooltips
      if (props.tooltipFields?.includes(key))
        colDef.tooltipValueGetter = (p: ITooltipParams) => p.value.toString();

      // Apply flex to all fields unless the table is server paginated
      // or there is a list of flex-only fields
      if (!props.flexOnly || props.flexOnly.includes(key)) colDef.flex = 1;

      return colDef;
    });
  } else colDefs = [];

  return colDefs;
}

function TableCount(props: BaseTableProps) {
  return (
    <Pagination size="sm" style={{ whiteSpace: "nowrap" }}>
      <Pagination.Item as="span">
        {props.isCountFetching
          ? "Loading..."
          : `${props.fromCount.toLocaleString()} to ${props.toCount.toLocaleString()} of ${props.count.toLocaleString()}`}
      </Pagination.Item>
    </Pagination>
  );
}

function TablePagination(props: BaseTableProps) {
  return (
    <Pagination size="sm">
      <Pagination.First
        disabled={!(props.handlePageChange && props.isPrevPage)}
        onClick={() => props.handlePageChange && props.handlePageChange(1)}
      />
      <Pagination.Prev
        disabled={!(props.handlePageChange && props.isPrevPage)}
        onClick={() =>
          props.handlePageChange && props.handlePageChange(props.pageNumber - 1)
        }
      />
      <Pagination.Item
        as="span"
        style={{ textAlign: "center", whiteSpace: "nowrap" }}
      >
        {props.isCountFetching
          ? "Loading..."
          : `Page ${props.pageNumber.toLocaleString()} of ${props.numPages.toLocaleString()}`}
      </Pagination.Item>
      <Pagination.Next
        disabled={!(props.handlePageChange && props.isNextPage)}
        onClick={() =>
          props.handlePageChange && props.handlePageChange(props.pageNumber + 1)
        }
      />
      <Pagination.Last
        disabled={!(props.handlePageChange && props.isNextPage)}
        onClick={() =>
          props.handlePageChange && props.handlePageChange(props.numPages)
        }
      />
    </Pagination>
  );
}

function TableOptions(props: TableOptionsProps) {
  const [exportModalShow, setExportModalShow] = useState(false);

  const resetAllColumns = useCallback(() => {
    props.gridRef.current?.api.resetColumnState();
    props.gridRef.current?.api.sizeColumnsToFit();
  }, [props.gridRef]);

  const unpinAllColumns = useCallback(
    () =>
      props.gridRef.current?.api.setColumnsPinned(
        props.gridRef.current?.api.getColumns()?.map((col) => col.getId()) ||
          [],
        null
      ),
    [props.gridRef]
  );

  const clearTableFilters = useCallback(
    () => props.gridRef.current?.api.setFilterModel(null),
    [props.gridRef]
  );

  const handleCSVExport = (exportProps: ExportHandlerProps) => {
    props
      .handleExportData(exportProps, props.gridRef)
      .then((data) => {
        exportProps.setExportStatus(ExportStatus.WRITING);
        props
          .fileWriter(exportProps.fileName, data)
          .then(() => exportProps.setExportStatus(ExportStatus.FINISHED))
          .catch((error: Error) => {
            // Display file write errors
            exportProps.setExportError(error);
            exportProps.setExportStatus(ExportStatus.ERROR);
          });
      })
      .catch((error: Error) => {
        if (error.message === "export_cancelled")
          // Display cancel message
          exportProps.setExportStatus(ExportStatus.CANCELLED);
        else {
          // Display errors during data retrieval
          exportProps.setExportError(error);
          exportProps.setExportStatus(ExportStatus.ERROR);
        }
      });
  };

  return (
    <>
      <ExportModal
        {...props}
        defaultFileExtension=".csv"
        fileExtensions={[".csv", ".tsv"]}
        show={exportModalShow}
        handleExport={handleCSVExport}
        onHide={() => setExportModalShow(false)}
      />
      <DropdownButton
        id="table-options"
        title="Options"
        size="sm"
        variant="secondary"
      >
        <Dropdown.Header>Column Controls</Dropdown.Header>
        <Dropdown.Item key="resetAllColumns" onClick={resetAllColumns}>
          Reset All Columns
        </Dropdown.Item>
        <Dropdown.Item key="unpinAllColumns" onClick={unpinAllColumns}>
          Unpin All Columns
        </Dropdown.Item>
        <DropdownDivider />
        <Dropdown.Header>Filter Controls</Dropdown.Header>
        <Dropdown.Item
          key="clearTableFilters"
          disabled={!props.isFilterable}
          onClick={clearTableFilters}
        >
          Clear Table Filters
        </Dropdown.Item>
        <DropdownDivider />
        <Dropdown.Header>Export Data</Dropdown.Header>
        <Dropdown.Item
          key="exportToCSV"
          onClick={() => setExportModalShow(true)}
        >
          Export to CSV/TSV
        </Dropdown.Item>
      </DropdownButton>
    </>
  );
}

function BaseTable(props: BaseTableProps) {
  const gridRef = useRef<AgGridReact<TableRow>>(null);
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

  const updateDisplayedRowCount = useCallback(() => {
    if (!props.handlePageChange && props.setToCount)
      props.setToCount(gridRef.current?.api.getDisplayedRowCount() || 0);
  }, [gridRef, props]);

  return (
    <Stack gap={2} style={containerStyle}>
      <div className="ag-theme-quartz" style={gridStyle}>
        <AgGridReact
          ref={gridRef}
          rowData={props.rowData}
          columnDefs={props.columnDefs}
          tooltipMouseTrack={true}
          tooltipHideDelay={5000}
          enableCellTextSelection={true}
          defaultColDef={{
            filter: props.isFilterable,
          }}
          onSortChanged={props.handleSortChange}
          onRowDataUpdated={updateDisplayedRowCount}
          onFilterChanged={updateDisplayedRowCount}
          suppressMultiSort={true}
          suppressColumnVirtualisation={true}
          suppressCellFocus={true}
          rowBuffer={50}
          loading={props.isResultsFetching}
        />
      </div>
      <Container fluid>
        <Row className="g-2">
          <Col lg>
            <i className="text-secondary">{props.footer || ""}</i>
          </Col>
          <Col xs="auto">
            <Container fluid>
              <Row className="gx-2">
                <Col>
                  <TableCount {...props} />
                </Col>
                <Col>
                  <TablePagination {...props} />
                </Col>
                <Col>
                  <TableOptions
                    {...props}
                    gridRef={gridRef}
                    isFilterable={props.isFilterable}
                  />
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </Stack>
  );
}

export default function Table(props: ClientTableProps) {
  const [toCount, setToCount] = useState(0);

  const rowData = useMemo(() => {
    return formatData(props.data);
  }, [props.data]);

  const columnDefs = useMemo(() => {
    return getColDefs(props, props.data, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.data]);

  const handleExportData = async (
    exportProps: ExportHandlerProps,
    gridRef?: React.RefObject<AgGridReact<TableRow>>
  ) => {
    const csvData = gridRef?.current?.api.getDataAsCsv({
      columnSeparator: exportProps.fileName.endsWith(".tsv") ? "\t" : ",",
    });
    return csvData || "";
  };

  return (
    <BaseTable
      {...props}
      rowData={rowData}
      columnDefs={columnDefs}
      handleExportData={handleExportData}
      count={rowData.length}
      fromCount={toCount >= 1 ? 1 : 0}
      toCount={toCount}
      setToCount={setToCount}
      footer={props.footer}
      isFilterable
      pageNumber={1}
      numPages={1}
    />
  );
}

export function ServerTable(props: ServerTableProps) {
  const columnDefs = useMemo(() => {
    const fieldsRow: TableRow[] = [
      Object.fromEntries(
        props.columns.map((field) => [field.code, field.description])
      ),
    ];

    return getColDefs(props, fieldsRow, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.columns]);

  // Calculate number of pages
  const numPages = useMemo(() => {
    return Math.ceil(props.count / props.pageSize);
  }, [props.count, props.pageSize]);

  const isPrevPage = !!(props.page > 1);
  const isNextPage = !!(props.page < numPages);
  const fromCount = (props.page - 1) * props.pageSize + 1;
  const toCount = Math.min(props.page * props.pageSize, props.count);

  return (
    <BaseTable
      {...props}
      rowData={props.data}
      columnDefs={columnDefs}
      handleExportData={props.handleExportData}
      handlePageChange={props.handlePageChange}
      handleSortChange={props.handleSortChange}
      footer={props.footer}
      isResultsFetching={props.isResultsFetching}
      isCountFetching={props.isCountFetching}
      count={props.count}
      fromCount={fromCount}
      toCount={toCount}
      isFilterable={false}
      pageNumber={props.page}
      numPages={numPages}
      isPrevPage={isPrevPage}
      isNextPage={isNextPage}
    />
  );
}
