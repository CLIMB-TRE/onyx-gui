import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import {
  ColDef,
  ModuleRegistry,
  SortChangedEvent,
} from "@ag-grid-community/core";
import { CsvExportModule } from "@ag-grid-community/csv-export";
import { AgGridReact, CustomCellRendererProps } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.min.css";
import { useCallback, useMemo, useRef, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import DropdownDivider from "react-bootstrap/DropdownDivider";
import Pagination from "react-bootstrap/Pagination";
import Row from "react-bootstrap/Row";
import Stack from "react-bootstrap/Stack";
import { ExportHandlerProps } from "../interfaces";
import { ExportStatus, TableRow, InputRow } from "../types";
import ExportModal from "./ExportModal";
import { formatData, getColDefs } from "../utils/functions";

ModuleRegistry.registerModules([ClientSideRowModelModule, CsvExportModule]);

interface BaseTableProps {
  fileWriter: (fileName: string, data: string) => Promise<void>;
  gridRef: React.RefObject<AgGridReact<TableRow>>;
  rowData: TableRow[];
  colDefs: ColDef[];
  defaultFileNamePrefix: string;
  handleExportData: (
    exportProps: ExportHandlerProps,
    gridRef?: React.RefObject<AgGridReact<TableRow>>
  ) => Promise<string>;
  handlePageChange?: (page: number) => void;
  handleSortChange?: (event: SortChangedEvent) => void;
  handleRowDataChange?: () => void;
  footer?: string;
  isDataFetching?: boolean;
  isCountFetching?: boolean;
  count: number;
  fromCount: number;
  toCount: number;
  page: number;
  numPages: number;
  isPrevPage?: boolean;
  isNextPage?: boolean;
  isFilterable?: boolean;
}

interface TableOptionsProps extends BaseTableProps {
  gridRef: React.RefObject<AgGridReact<TableRow>>;
}

interface TableProps {
  data: InputRow[];
  isDataFetching?: boolean;
  isCountFetching?: boolean;
  cellRenderers?: Map<string, (params: CustomCellRendererProps) => JSX.Element>;
  headerNames?: Map<string, string>;
  headerTooltips?: Map<string, string>;
  headerTooltipPrefix?: string;
  tooltipFields?: string[];
  fileWriter: (fileName: string, data: string) => Promise<void>;
  defaultFileNamePrefix: string;
  flexOnly?: string[];
  includeOnly?: string[];
  order?: string;
  footer?: string;
  recordPrimaryID?: string;
  analysisPrimaryID?: string;
}

interface ServerTableProps extends TableProps {
  colDefs: ColDef[];
  count: number;
  page: number;
  pageSize: number;
  handleExportData: (exportProps: ExportHandlerProps) => Promise<string>;
  handleSortChange: (event: SortChangedEvent) => void;
  handlePageChange: (page: number) => void;
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
          props.handlePageChange && props.handlePageChange(props.page - 1)
        }
      />
      <Pagination.Item
        as="span"
        style={{ textAlign: "center", whiteSpace: "nowrap" }}
      >
        {props.isCountFetching
          ? "Loading..."
          : `Page ${props.page.toLocaleString()} of ${props.numPages.toLocaleString()}`}
      </Pagination.Item>
      <Pagination.Next
        disabled={!(props.handlePageChange && props.isNextPage)}
        onClick={() =>
          props.handlePageChange && props.handlePageChange(props.page + 1)
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

  const rearrangeColumns = useCallback(() => {
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
        if (error.message === ExportStatus.CANCELLED)
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
        <Dropdown.Item key="rearrangeColumns" onClick={rearrangeColumns}>
          Rearrange Columns
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
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

  return (
    <Stack gap={2} style={containerStyle}>
      <div className="ag-theme-quartz" style={gridStyle}>
        <AgGridReact
          ref={props.gridRef}
          rowData={props.rowData}
          columnDefs={props.colDefs}
          tooltipMouseTrack={true}
          tooltipHideDelay={5000}
          enableCellTextSelection={true}
          defaultColDef={{
            filter: props.isFilterable,
          }}
          onSortChanged={props.handleSortChange}
          onRowDataUpdated={props.handleRowDataChange}
          onFilterChanged={props.handleRowDataChange}
          suppressMultiSort={true}
          suppressColumnVirtualisation={true}
          suppressCellFocus={true}
          rowBuffer={50}
          loading={props.isDataFetching}
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
                    gridRef={props.gridRef}
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

export default function Table(props: TableProps) {
  const gridRef = useRef<AgGridReact<TableRow>>(null);
  const [toCount, setToCount] = useState(0);

  const handleRowDataChange = useCallback(() => {
    setToCount(gridRef.current?.api.getDisplayedRowCount() || 0);
  }, [gridRef]);

  const rowData = useMemo(() => {
    return formatData(props.data);
  }, [props.data]);

  const colDefs = useMemo(() => {
    return getColDefs({ ...props, isServerTable: false });
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
      gridRef={gridRef}
      rowData={rowData}
      colDefs={colDefs}
      handleExportData={handleExportData}
      handleRowDataChange={handleRowDataChange}
      fromCount={toCount >= 1 ? 1 : 0}
      toCount={toCount}
      count={rowData.length}
      page={1}
      numPages={1}
      isFilterable
    />
  );
}

export function ServerTable(props: ServerTableProps) {
  const gridRef = useRef<AgGridReact<TableRow>>(null);
  const rowData = useMemo(() => {
    return formatData(props.data);
  }, [props.data]);

  const fromCount = (props.page - 1) * props.pageSize + 1;
  const toCount = Math.min(props.page * props.pageSize, props.count);
  const numPages = useMemo(() => {
    return Math.ceil(props.count / props.pageSize);
  }, [props.count, props.pageSize]);
  const isPrevPage = !!(props.page > 1);
  const isNextPage = !!(props.page < numPages);

  return (
    <BaseTable
      {...props}
      gridRef={gridRef}
      rowData={rowData}
      fromCount={fromCount}
      toCount={toCount}
      numPages={numPages}
      isPrevPage={isPrevPage}
      isNextPage={isNextPage}
    />
  );
}
