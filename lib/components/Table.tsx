import { useState, useCallback, useMemo, useRef } from "react";
import { AgGridReact, CustomCellRendererProps } from "@ag-grid-community/react"; // React Data Grid Component
import "@ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "@ag-grid-community/styles/ag-theme-quartz.min.css"; // Optional Theme applied to the Data Grid
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import {
  ColDef,
  GridOptions,
  SortChangedEvent,
  ModuleRegistry,
  ITooltipParams,
} from "@ag-grid-community/core";
import { CsvExportModule } from "@ag-grid-community/csv-export";
import { useQuery } from "@tanstack/react-query";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Pagination from "react-bootstrap/Pagination";
import Stack from "react-bootstrap/Stack";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import DropdownDivider from "react-bootstrap/DropdownDivider";
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { ResultData, ExportStatus } from "../types";
import { DataProps, ExportHandlerProps } from "../interfaces";
import ExportModal from "./ExportModal";

ModuleRegistry.registerModules([ClientSideRowModelModule, CsvExportModule]);

type FormattedResultData = Record<string, string | number>[];

interface BaseTableProps extends DataProps {
  rowData: FormattedResultData;
  columnDefs: ColDef[];
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
  gridRef: React.RefObject<AgGridReact<Record<string, string | number>>>;
}

interface TableProps extends DataProps {
  data: ResultData;
  defaultFileNamePrefix: string;
  headerNames?: Map<string, string>;
  headerTooltips?: Map<string, string>;
  headerTooltipPrefix?: string;
  tooltipFields?: string[];
  flexOnly?: string[];
  footer?: string;
  cellRenderers?: Map<string, (params: CustomCellRendererProps) => JSX.Element>;
  handleRecordModalShow?: (climbID: string) => void;
}

interface ServerPaginatedTableProps extends TableProps {
  searchParameters: string;
}

function formatResultData(resultData: ResultData) {
  // For table display, we allow string and number values
  // All other types are converted to strings
  return (
    resultData.data?.map((row) =>
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
    ) || []
  );
}

function getColDefs(props: TableProps, defaultColDef: (key: string) => ColDef) {
  let colDefs: ColDef[];

  if (props.data.data && props.data.data.length > 0) {
    colDefs = Object.keys(props.data.data[0]).map((key) => {
      if (key === "climb_id") {
        return {
          ...defaultColDef(key),
          pinned: "left",
          cellRenderer: (params: CustomCellRendererProps) => {
            return (
              <Button
                className="p-0"
                size="sm"
                variant="link"
                onClick={() =>
                  props.handleRecordModalShow &&
                  props.handleRecordModalShow(params.value)
                }
              >
                {params.value}
              </Button>
            );
          },
        };
      } else {
        const colDef = defaultColDef(key);

        if (props.cellRenderers?.get(key)) {
          colDef.cellRenderer = props.cellRenderers.get(key);
          colDef.autoHeight = true;
          colDef.wrapText = true;
        }

        if (props.tooltipFields?.includes(key)) {
          colDef.tooltipValueGetter = (p: ITooltipParams) => p.value.toString();
        }

        if (!props.flexOnly || props.flexOnly.includes(key)) {
          colDef.flex = 1;
        }
        return colDef;
      }
    });
  } else {
    colDefs = [];
  }

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
        disabled={!props.isPaginated}
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

function sortData(data: FormattedResultData, field: string, direction: string) {
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
    });

    const datas: FormattedResultData[] = [];
    let nRows = 0;
    let nextParams = new URLSearchParams(props.searchParameters);

    while (nextParams) {
      const search = new URLSearchParams(nextParams);

      await props
        .httpPathHandler(`projects/${props.project}/?${search.toString()}`)
        .then((response) => response.json())
        .then((result) => {
          if (exportProps.statusToken.status === ExportStatus.CANCELLED)
            throw new Error("export_cancelled");

          const data = formatResultData(result);
          datas.push(data);
          nextParams = result.next?.split("?", 2)[1] || "";
          nRows += data.length;

          exportProps.setExportProgress(
            (nRows / props.rowDisplayParams.of) * 100
          );
        });
    }

    const resultData = Array.prototype.concat.apply([], datas);

    // If there are no results, return the empty string
    if (resultData.length === 0) return "";
    else {
      // If an order is specified, sort the data
      if (props.paginationParams.order) {
        sortData(
          resultData,
          props.paginationParams.order.replace(/^-/, ""),
          props.paginationParams.order.startsWith("-") ? "desc" : "asc"
        );
      }

      const csvData = asString(generateCsv(csvConfig)(resultData));
      return csvData;
    }
  };

  const getUnpaginatedData = async () => {
    const csvData = props.gridRef.current?.api.getDataAsCsv();
    return csvData || "";
  };

  const handleCSVExport = (exportProps: ExportHandlerProps) => {
    const fileWriter = props.fileWriter;

    if (fileWriter) {
      let getDataFunction: () => Promise<string>;

      if (props.isPaginated)
        getDataFunction = () => getPaginatedData(exportProps);
      else getDataFunction = getUnpaginatedData;

      getDataFunction()
        .then((data) => {
          exportProps.setExportStatus(ExportStatus.WRITING);
          fileWriter(exportProps.fileName, data).then(() =>
            exportProps.setExportStatus(ExportStatus.FINISHED)
          );
        })
        .catch((error: Error) => {
          if (error.message === "export_cancelled")
            exportProps.setExportStatus(ExportStatus.CANCELLED);
          else {
            exportProps.setExportError(error);
            exportProps.setExportStatus(ExportStatus.ERROR);
          }
        });
    }
  };

  return (
    <Pagination size="sm">
      <ExportModal
        {...props}
        fileExtension=".csv"
        show={exportModalShow}
        handleExport={handleCSVExport}
        onHide={() => setExportModalShow(false)}
        exportProgressMessage={`Gathering ${props.rowDisplayParams.of} records...`}
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
          disabled={!props.fileWriter}
          onClick={() => setExportModalShow(true)}
        >
          Export to CSV
        </Dropdown.Item>
      </DropdownButton>
    </Pagination>
  );
}

function BaseTable(props: BaseTableProps) {
  const gridRef = useRef<AgGridReact<Record<string, string | number>>>(null);
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [displayedRowCount, setDisplayedRowCount] = useState(0);

  const updateDisplayedRowCount = useCallback(() => {
    if (!props.isPaginated) {
      setDisplayedRowCount(gridRef.current?.api.getDisplayedRowCount() || 0);
    }
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
            <Stack direction="horizontal" gap={2}>
              <Pagination size="sm">
                <Pagination.Item>
                  {props.isCountLoading
                    ? "Loading..."
                    : `${props.rowDisplayParams.from} to ${
                        props.isPaginated
                          ? props.rowDisplayParams.to
                          : displayedRowCount
                      } of ${props.rowDisplayParams.of}`}
                </Pagination.Item>
              </Pagination>
              <TablePagination {...props} />
              <TableOptions
                {...props}
                gridRef={gridRef}
                isFilterable={props.isFilterable}
              />
            </Stack>
          </Container>
        </div>
      </div>
    </Stack>
  );
}

function Table(props: TableProps) {
  const [rowData, setRowData] = useState<FormattedResultData>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

  const defaultColDef = (key: string) => {
    const prefix = props.headerTooltipPrefix || "";

    return {
      field: key,
      headerName: props.headerNames?.get(key) || key,
      minWidth: 200,
      headerTooltip: props.headerTooltips?.get(prefix + key),
    } as ColDef;
  };

  const onGridReady = useCallback(() => {
    setRowData(formatResultData(props.data));
    setColumnDefs(getColDefs(props, defaultColDef));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BaseTable
      {...props}
      rowData={rowData}
      columnDefs={columnDefs}
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
  const [resultData, setResultData] = useState<FormattedResultData>([]);
  const [rowData, setRowData] = useState<FormattedResultData>([]);
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

  const {
    isFetching: isCountLoading,
    data: countData = { count: 0, numPages: 0 },
  } = useQuery({
    queryKey: ["count", props.project, props.searchParameters],
    queryFn: async () => {
      const search = new URLSearchParams(props.searchParameters).toString();
      return props
        .httpPathHandler(`projects/${props.project}/count/?${search}`)
        .then((response) => response.json())
        .then((data) => {
          return {
            count: data.data.count,
            numPages: data.data.count
              ? Math.ceil(data.data.count / userPageSize)
              : 1,
          };
        });
    },
    enabled: !!props.project,
    cacheTime: 0.5 * 60 * 1000,
  });

  const prevPage = !!(prevParams || userPageNumber > 1);
  const nextPage = !!(nextParams || userPageNumber < countData.numPages);

  const getRowData = (resultData: FormattedResultData, resultsPage: number) => {
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

  const handleRowData = (rowData: FormattedResultData, userPage: number) => {
    setRowData(rowData);
    setUserRowCounts({
      fromCount: (userPage - 1) * userPageSize + (rowData.length >= 1 ? 1 : 0),
      toCount: (userPage - 1) * userPageSize + rowData.length,
    });
  };

  const handleResultData = (
    resultData: ResultData,
    resultsPage: number,
    userPage: number
  ) => {
    const formattedResultData = formatResultData(resultData);
    setResultData(formattedResultData);
    handleRowData(getRowData(formattedResultData, resultsPage), userPage);
    setPrevParams(resultData.previous?.split("?", 2)[1] || "");
    setNextParams(resultData.next?.split("?", 2)[1] || "");
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
        .httpPathHandler(`projects/${props.project}/?${search.toString()}`)
        .then((response) => response.json())
        .then((response) => handleResultData(response, resultsPage, userPage))
        .finally(() => setLoading(false));
    } else {
      handleRowData(getRowData(resultData, resultsPage), userPage);
    }
  };

  const defaultColDef = (key: string) => {
    const prefix = props.headerTooltipPrefix || "";

    return {
      field: key,
      headerName: props.headerNames?.get(key) || key,
      minWidth: 200,
      headerTooltip: props.headerTooltips?.get(prefix + key),
      comparator: () => 0,
    } as ColDef;
  };

  const onGridReady = useCallback(() => {
    handleResultData(props.data, 1, 1);
    setColumnDefs(getColDefs(props, defaultColDef));
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
      isCountLoading={isCountLoading}
      isFilterable={false}
      isPaginated
      paginationParams={{
        pageCountMessage: isCountLoading
          ? "Loading..."
          : `Page ${userPageNumber} of ${countData.numPages}`,
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
