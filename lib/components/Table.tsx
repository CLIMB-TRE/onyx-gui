import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import {
  ColDef,
  GridOptions,
  ITooltipParams,
  ModuleRegistry,
  SortChangedEvent,
  SortDirection,
} from "@ag-grid-community/core";
import { CsvExportModule } from "@ag-grid-community/csv-export";
import { AgGridReact, CustomCellRendererProps } from "@ag-grid-community/react"; // React Data Grid Component
import "@ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "@ag-grid-community/styles/ag-theme-quartz.min.css"; // Optional Theme applied to the Data Grid
import { asString, generateCsv, mkConfig } from "export-to-csv";
import { useCallback, useMemo, useRef, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import DropdownDivider from "react-bootstrap/DropdownDivider";
import Pagination from "react-bootstrap/Pagination";
import Row from "react-bootstrap/Row";
import Stack from "react-bootstrap/Stack";
import { useCountQuery } from "../api";
import { ExportHandlerProps, OnyxProps } from "../interfaces";
import { ExportStatus, ListResponse } from "../types";
import ExportModal from "./ExportModal";
import { formatResponseStatus } from "../utils/functions";

ModuleRegistry.registerModules([ClientSideRowModelModule, CsvExportModule]);

type InputData = Record<string, string | number | boolean | object | null>[];
type TableRow = Record<string, string | number>;
type TableData = TableRow[];

interface BaseTableProps extends OnyxProps {
  rowData: TableData;
  columnDefs: ColDef[];
  searchPath: string;
  searchParameters: string;
  defaultFileNamePrefix: string;
  gridOptions?: GridOptions;
  onGridReady: () => void;
  footer?: string;
  isDataLoading?: boolean;
  isCountLoading?: boolean;
  isFilterable: boolean;
  isPaginated: boolean;
  rowDisplayParams: {
    from: number;
    to: number;
    of: number;
  };
  paginationParams: {
    pageCountMessage: string;
    pageNumber: number;
    numPages: number;
    prevPage: boolean;
    nextPage: boolean;
    prevParams: string;
    nextParams: string;
    userPageSize: number;
    handleUserPageChange: (params: string, userPage: number) => void;
    order: string;
  };
}

interface TableOptionsProps extends BaseTableProps {
  gridRef: React.RefObject<AgGridReact<TableRow>>;
}

interface TableProps extends OnyxProps {
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
}

interface ClientTableProps extends TableProps {
  data: InputData;
}

interface ServerPaginatedTableProps extends TableProps {
  project: string;
  response: ListResponse;
  searchPath: string;
  searchParameters: string;
}

/** Converts InputData to TableData. All non-string/number values are converted to strings. */
function formatData(data: InputData): TableData {
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

/** Sorts TableData in-place, on the specified field and direction. */
function sortData(data: TableData, field: string, direction: string): void {
  if (data.length > 0 && direction === "asc") {
    if (typeof data[0][field] === "number") {
      data.sort((a, b) => (a[field] as number) - (b[field] as number));
    } else {
      data.sort((a, b) =>
        (a[field] as string) > (b[field] as string) ? 1 : -1
      );
    }
  } else if (data.length > 0 && direction === "desc") {
    if (typeof data[0][field] === "number") {
      data.sort((a, b) => (b[field] as number) - (a[field] as number));
    } else {
      data.sort((a, b) =>
        (a[field] as string) < (b[field] as string) ? 1 : -1
      );
    }
  }
}

/** Generates column definitions for the table. */
function getColDefs(
  props: TableProps,
  data: InputData,
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
      };

      // Disable AGGrid sorting for server paginated tables
      if (isServerPaginated) colDef.comparator = () => 0;

      // Apply custom cell renderers
      if (props.cellRenderers?.get(key))
        colDef.cellRenderer = props.cellRenderers.get(key);

      if (key === "climb_id" || key === "analysis_id") {
        // 'climb_id' and 'analysis_id' fields are a special case
        // where we want them pinned to the left
        colDef.pinned = "left";
      } else if (key === "changes" || key === "error_messages") {
        // History 'changes' field is a special case
        // where we want variable height and wrapped text
        colDef.autoHeight = true;
        colDef.wrapText = true;
      }

      // Apply default sorts
      // TODO: Implement default sorts for server paginated tables
      if (!isServerPaginated && props.defaultSort?.has(key))
        colDef.sort = props.defaultSort.get(key);

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

function TablePagination(props: BaseTableProps) {
  return (
    <Pagination size="sm">
      <Pagination.First
        disabled={!(props.isPaginated && props.paginationParams.prevPage)}
        onClick={() =>
          props.paginationParams.handleUserPageChange(
            props.paginationParams.prevParams,
            1
          )
        }
      />
      <Pagination.Prev
        disabled={!(props.isPaginated && props.paginationParams.prevPage)}
        onClick={() =>
          props.paginationParams.handleUserPageChange(
            props.paginationParams.prevParams,
            props.paginationParams.pageNumber - 1
          )
        }
      />
      <Pagination.Item
        as="span"
        style={{ minWidth: "125px", textAlign: "center" }}
      >
        {props.paginationParams.pageCountMessage}
      </Pagination.Item>
      <Pagination.Next
        disabled={!(props.isPaginated && props.paginationParams.nextPage)}
        onClick={() =>
          props.paginationParams.handleUserPageChange(
            props.paginationParams.nextParams,
            props.paginationParams.pageNumber + 1
          )
        }
      />
      <Pagination.Last
        disabled={!(props.isPaginated && props.paginationParams.nextPage)}
        onClick={() =>
          props.paginationParams.handleUserPageChange(
            props.paginationParams.nextParams,
            props.paginationParams.numPages
          )
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

  const getPaginatedData = async (exportProps: ExportHandlerProps) => {
    exportProps.setExportStatus(ExportStatus.RUNNING);

    const csvConfig = mkConfig({
      useKeysAsHeaders: true,
      fieldSeparator: exportProps.fileName.endsWith(".tsv") ? "\t" : ",",
    });
    const pages: TableData[] = [];
    let nRows = 0;
    let search: URLSearchParams | null = new URLSearchParams(
      props.searchParameters
    );

    // Fetch pages of data until the 'next' field is not present
    while (search instanceof URLSearchParams) {
      await props
        .httpPathHandler(`${props.searchPath}/?${search.toString()}`)
        .then((response) => {
          if (!response.ok) throw new Error(formatResponseStatus(response));
          return response.json();
        })
        .then((response: ListResponse) => {
          if (exportProps.statusToken.status === ExportStatus.CANCELLED)
            throw new Error("export_cancelled");

          const page = formatData(response.data);
          pages.push(page);
          nRows += page.length;
          search = response.next
            ? new URLSearchParams(response.next.split("?", 2)[1])
            : null;

          exportProps.setExportProgress(
            (nRows / props.rowDisplayParams.of) * 100
          );
          exportProps.setExportProgressMessage(
            `Fetched ${nRows.toLocaleString()}/${props.rowDisplayParams.of.toLocaleString()} items...`
          );
        });
    }

    // Concatenate all pages into a single array
    const data: TableData = Array.prototype.concat.apply([], pages);

    // If there is no data, return the empty string
    if (data.length === 0) return "";
    else {
      // If an order is specified, sort the data
      if (props.paginationParams.order) {
        sortData(
          data,
          props.paginationParams.order.replace(/^-/, ""),
          props.paginationParams.order.startsWith("-") ? "desc" : "asc"
        );
      }

      // Convert the data to a CSV string
      const csvData = asString(generateCsv(csvConfig)(data));
      return csvData;
    }
  };

  const getUnpaginatedData = async (exportProps: ExportHandlerProps) => {
    const csvData = props.gridRef.current?.api.getDataAsCsv({
      columnSeparator: exportProps.fileName.endsWith(".tsv") ? "\t" : ",",
    });
    return csvData || "";
  };

  const handleCSVExport = (exportProps: ExportHandlerProps) => {
    let getDataFunction: (exportProps: ExportHandlerProps) => Promise<string>;

    if (props.isPaginated) getDataFunction = getPaginatedData;
    else getDataFunction = getUnpaginatedData;

    getDataFunction(exportProps)
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
    <Pagination size="sm">
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
        variant="dark"
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
    </Pagination>
  );
}

function BaseTable(props: BaseTableProps) {
  const gridRef = useRef<AgGridReact<TableRow>>(null);
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [displayedRowCount, setDisplayedRowCount] = useState(0);

  const updateDisplayedRowCount = useCallback(() => {
    if (!props.isPaginated)
      setDisplayedRowCount(gridRef.current?.api.getDisplayedRowCount() || 0);
  }, [gridRef, props.isPaginated]);

  return (
    <Stack gap={2} style={containerStyle}>
      <div className="ag-theme-quartz" style={gridStyle}>
        <AgGridReact
          ref={gridRef}
          rowData={props.rowData}
          columnDefs={props.columnDefs}
          tooltipMouseTrack={true}
          tooltipHideDelay={5000}
          gridOptions={{
            ...props.gridOptions,
            enableCellTextSelection: true,
            defaultColDef: {
              filter: props.isFilterable,
            },
          }}
          onGridReady={props.onGridReady}
          onRowDataUpdated={updateDisplayedRowCount}
          onFilterChanged={updateDisplayedRowCount}
          suppressMultiSort={true}
          suppressColumnVirtualisation={true}
          suppressCellFocus={true}
          rowBuffer={50}
          loading={props.isDataLoading}
        />
      </div>
      <div>
        <i className="text-secondary">{props.footer || ""}</i>
        <div style={{ float: "right" }}>
          <Container>
            <Row className="g-2">
              <Col style={{ whiteSpace: "nowrap" }}>
                <Pagination size="sm">
                  <Pagination.Item as="span">
                    {props.isCountLoading
                      ? "Loading..."
                      : `${props.rowDisplayParams.from.toLocaleString()} to ${(props.isPaginated
                          ? props.rowDisplayParams.to
                          : displayedRowCount
                        ).toLocaleString()} of ${props.rowDisplayParams.of.toLocaleString()}`}
                  </Pagination.Item>
                </Pagination>
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
        </div>
      </div>
    </Stack>
  );
}

function Table(props: ClientTableProps) {
  const [rowData, setRowData] = useState<TableData>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

  const onGridReady = useCallback(() => {
    setRowData(formatData(props.data));
    setColumnDefs(getColDefs(props, props.data, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BaseTable
      {...props}
      rowData={rowData}
      columnDefs={columnDefs}
      searchPath=""
      searchParameters=""
      onGridReady={onGridReady}
      rowDisplayParams={{
        from: rowData.length >= 1 ? 1 : 0,
        to: rowData.length,
        of: rowData.length,
      }}
      footer={props.footer}
      isFilterable
      isPaginated={false}
      paginationParams={{
        pageNumber: 1,
        numPages: 1,
        pageCountMessage: "Page 1 of 1",
        prevPage: false,
        nextPage: false,
        prevParams: "",
        nextParams: "",
        userPageSize: 0,
        handleUserPageChange: () => {},
        order: "",
      }}
    />
  );
}

function ServerPaginatedTable(props: ServerPaginatedTableProps) {
  const [resultData, setResultData] = useState<TableData>([]);
  const [rowData, setRowData] = useState<TableData>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [userPageNumber, setUserPageNumber] = useState(1);
  const [serverPageNumber, setServerPageNumber] = useState(1);
  const [prevParams, setPrevParams] = useState("");
  const [nextParams, setNextParams] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRowCounts, setUserRowCounts] = useState({
    fromCount: 0,
    toCount: 0,
  });
  const [order, setOrder] = useState("");

  const resultsPageSize = 1000;
  const userPageSize = 50;

  const { isFetching: countPending, data: countResponse } =
    useCountQuery(props);

  //  Get count data
  const countData = useMemo(() => {
    if (countResponse?.status !== "success") return { count: 0, numPages: 0 };
    return {
      count: countResponse.data.count,
      numPages: countResponse.data.count
        ? Math.ceil(countResponse.data.count / userPageSize)
        : 1,
    };
  }, [countResponse]);

  const prevPage = !!(prevParams || userPageNumber > 1);
  const nextPage = !!(nextParams || userPageNumber < countData.numPages);

  const getRowData = (resultData: TableData, resultsPage: number) => {
    return resultData.slice(
      (resultsPage - 1) * userPageSize,
      resultsPage * userPageSize
    );
  };

  const getPageNumbers = (userPage: number) => {
    const numResultsPages = resultsPageSize / userPageSize;

    return {
      resultsPage: userPage % numResultsPages || numResultsPages,
      serverPage: Math.ceil((userPage * userPageSize) / resultsPageSize),
    };
  };

  const handleRowData = (rowData: TableData, userPage: number) => {
    setRowData(rowData);
    setUserRowCounts({
      fromCount: (userPage - 1) * userPageSize + (rowData.length >= 1 ? 1 : 0),
      toCount: (userPage - 1) * userPageSize + rowData.length,
    });
  };

  const handleResponse = (
    response: ListResponse,
    resultsPage: number,
    userPage: number
  ) => {
    const formattedResultData = formatData(response.data);
    setResultData(formattedResultData);
    handleRowData(getRowData(formattedResultData, resultsPage), userPage);
    setPrevParams(response.previous?.split("?", 2)[1] || "");
    setNextParams(response.next?.split("?", 2)[1] || "");
  };

  const handleSortColumn = (event: SortChangedEvent) => {
    const search = new URLSearchParams(props.searchParameters);

    if (event.columns && event.columns.length > 0) {
      const field = event.columns[event.columns.length - 1].getId();
      const direction = event.columns[event.columns.length - 1].getSort() || "";

      if (direction === "asc") {
        search.set("order", field);
        setOrder(field);
      } else if (direction === "desc") {
        search.set("order", `-${field}`);
        setOrder(`-${field}`);
      } else {
        setOrder("");
      }
    }

    handleUserPageChange(search.toString(), 1, true);
  };

  const handleUserPageChange = (
    params: string,
    userPage: number,
    refresh = false
  ) => {
    const { resultsPage, serverPage } = getPageNumbers(userPage);
    setUserPageNumber(userPage);
    setServerPageNumber(serverPage);

    if (!loading && (refresh || serverPage !== serverPageNumber)) {
      setLoading(true);
      const search = new URLSearchParams(params);
      search.set("page", serverPage.toString());
      search.delete("cursor");

      props
        .httpPathHandler(`${props.searchPath}/?${search.toString()}`)
        .then((response) => {
          if (!response.ok) throw new Error(formatResponseStatus(response));
          return response.json();
        })
        .then((response) => handleResponse(response, resultsPage, userPage))
        .finally(() => setLoading(false));
    } else {
      handleRowData(getRowData(resultData, resultsPage), userPage);
    }
  };

  const onGridReady = useCallback(() => {
    handleResponse(props.response, 1, 1);
    setColumnDefs(getColDefs(props, props.response.data, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BaseTable
      {...props}
      rowData={rowData}
      columnDefs={columnDefs}
      gridOptions={{
        onSortChanged: handleSortColumn,
      }}
      onGridReady={onGridReady}
      rowDisplayParams={{
        from: userRowCounts.fromCount,
        to: userRowCounts.toCount,
        of: countData.count,
      }}
      footer={props.footer}
      isDataLoading={loading}
      isCountLoading={countPending}
      isFilterable={false}
      isPaginated
      paginationParams={{
        pageCountMessage: countPending
          ? "Loading..."
          : `Page ${userPageNumber.toLocaleString()} of ${countData.numPages.toLocaleString()}`,
        pageNumber: userPageNumber,
        numPages: countData.numPages,
        prevPage,
        nextPage,
        prevParams,
        nextParams,
        userPageSize,
        handleUserPageChange,
        order,
      }}
    />
  );
}

export default Table;
export { ServerPaginatedTable };
