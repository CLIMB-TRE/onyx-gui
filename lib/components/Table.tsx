import { useState, useCallback, useMemo, useRef } from "react";
import { AgGridReact, CustomCellRendererProps } from "@ag-grid-community/react"; // React Data Grid Component
import "@ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "@ag-grid-community/styles/ag-theme-quartz.min.css"; // Optional Theme applied to the Data Grid
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import {
  ColDef,
  SortChangedEvent,
  ModuleRegistry,
  ITooltipParams,
} from "@ag-grid-community/core";
import { useQuery } from "@tanstack/react-query";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Pagination from "react-bootstrap/Pagination";
import Stack from "react-bootstrap/Stack";
import { ResultData, ResultType } from "../types";
import { DataProps } from "../interfaces";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

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

interface TableProps extends DataProps {
  data: ResultData;
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

function Table(props: TableProps) {
  const gridRef = useRef<AgGridReact<ResultType>>(null);
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [rowData, setRowData] = useState<ResultType[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

  const defaultCellRenderer = (params: CustomCellRendererProps) => {
    if (
      props.s3PathHandler &&
      typeof params.value === "string" &&
      params.value.startsWith("s3://") &&
      params.value.endsWith(".html")
    ) {
      return (
        <Button
          size="sm"
          variant="link"
          onClick={() =>
            props.s3PathHandler && props.s3PathHandler(params.value)
          }
        >
          {params.value}
        </Button>
      );
    } else {
      return params.value;
    }
  };

  const defaultColDef = (key: string) => {
    return {
      field: key,
      headerName: props.headerNames?.get(key) || key,
      minWidth: 200,
      headerTooltip: props.headerTooltips?.get(props.headerTooltipPrefix + key),
      cellRenderer: defaultCellRenderer,
    } as ColDef;
  };

  const onGridReady = useCallback(() => {
    let colDefs: ColDef[];

    if (props.data.data && props.data.data.length > 0) {
      colDefs = Object.keys(props.data.data[0]).map((key) => {
        if (props.handleRecordModalShow && key === "climb_id") {
          return {
            ...defaultColDef(key),
            pinned: "left",
            cellRenderer: (params: CustomCellRendererProps) => {
              return (
                <Button
                  size="sm"
                  variant="link"
                  onClick={() =>
                    props.handleRecordModalShow
                      ? props.handleRecordModalShow(params.value)
                      : null
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
            colDef.tooltipValueGetter = (p: ITooltipParams) =>
              p.value.toString();
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
    setRowData(formatResultData(props.data));
    setColumnDefs(colDefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gridOptions = {
    enableCellTextSelection: true,
    defaultColDef: {
      filter: true,
    },
  };

  const clearTableFilters = useCallback(() => {
    gridRef.current!.api.setFilterModel(null);
  }, []);

  return (
    <Stack gap={2} style={containerStyle}>
      <div className="ag-theme-quartz" style={gridStyle}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          tooltipMouseTrack={true}
          tooltipHideDelay={5000}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          suppressMultiSort={true}
          suppressColumnVirtualisation={true}
          rowBuffer={30}
        />
      </div>
      <div>
        <i className="text-secondary">{props.footer}</i>
        <div style={{ float: "right" }}>
          <Container>
            <Stack direction="horizontal" gap={2}>
              <Pagination size="sm">
                <Pagination.Item>
                  {`${rowData.length >= 1 ? 1 : 0} to ${rowData.length} of ${
                    rowData.length
                  }`}
                </Pagination.Item>
              </Pagination>
              <Pagination size="sm">
                <Button size="sm" variant="dark" onClick={clearTableFilters}>
                  Clear Table Filters
                </Button>
              </Pagination>
            </Stack>
          </Container>
        </div>
      </div>
    </Stack>
  );
}

function ServerPaginatedTable(props: ServerPaginatedTableProps) {
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [resultData, setResultData] = useState<ResultType[]>([]);
  const [rowData, setRowData] = useState<ResultType[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [userPageNumber, setUserPageNumber] = useState(1);
  const [serverPageNumber, setServerPageNumber] = useState(1);
  const [prevParams, setPrevParams] = useState("");
  const [nextParams, setNextParams] = useState("");
  const [loading, setLoading] = useState(false);

  const { isFetching: isCountLoading, data: countData = { count: 0 } } =
    useQuery({
      queryKey: ["count", props.project, props.searchParameters],
      queryFn: async () => {
        const search = new URLSearchParams(props.searchParameters).toString();
        return props
          .httpPathHandler(`projects/${props.project}/count/?${search}`)
          .then((response) => response.json())
          .then((data) => {
            return { count: data.data.count };
          });
      },
      enabled: !!props.project,
      cacheTime: 0.5 * 60 * 1000,
    });

  const defaultCellRenderer = (params: CustomCellRendererProps) => {
    if (
      props.s3PathHandler &&
      typeof params.value === "string" &&
      params.value.startsWith("s3://") &&
      params.value.endsWith(".html")
    ) {
      return (
        <Button
          size="sm"
          variant="link"
          onClick={() =>
            props.s3PathHandler && props.s3PathHandler(params.value)
          }
        >
          {params.value}
        </Button>
      );
    } else {
      return params.value;
    }
  };

  const defaultColDef = (key: string) => {
    return {
      field: key,
      headerName: props.headerNames?.get(key) || key,
      minWidth: 200,
      headerTooltip: props.headerTooltips?.get(props.headerTooltipPrefix + key),
      cellRenderer: defaultCellRenderer,
      comparator: () => 0,
    } as ColDef;
  };

  const userPageMaxRows = 50;
  const resultsPageMaxRows = 1000;
  const numUserPages = Math.ceil(countData.count / userPageMaxRows);
  const numResultsPages = resultsPageMaxRows / userPageMaxRows;
  const fromCount =
    (userPageNumber - 1) * userPageMaxRows + (rowData.length >= 1 ? 1 : 0);
  const toCount = (userPageNumber - 1) * userPageMaxRows + rowData.length;
  const prevPage = prevParams || userPageNumber > 1;
  const nextPage = nextParams || userPageNumber < numUserPages;

  const getRowData = (resultData: ResultType[], resultsPage: number) => {
    return resultData.slice(
      (resultsPage - 1) * userPageMaxRows,
      resultsPage * userPageMaxRows
    );
  };

  const getPageNumbers = (userPage: number) => {
    return {
      resultsPage: userPage % numResultsPages || numResultsPages,
      serverPage: Math.ceil((userPage * userPageMaxRows) / resultsPageMaxRows),
    };
  };

  const handleResultData = (resultData: ResultData, resultsPage: number) => {
    const formattedResultData = formatResultData(resultData);
    setResultData(formattedResultData);
    setRowData(getRowData(formattedResultData, resultsPage));
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
      } else if (direction === "desc") {
        search.set("order", `-${field}`);
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
        .then((response) => handleResultData(response, resultsPage))
        .finally(() => setLoading(false));
    } else {
      setRowData(getRowData(resultData, resultsPage));
    }
  };

  const onGridReady = useCallback(() => {
    let colDefs: ColDef[];

    if (props.data.data && props.data.data.length > 0) {
      colDefs = Object.keys(props.data.data[0]).map((key) => {
        if (props.handleRecordModalShow && key === "climb_id") {
          return {
            ...defaultColDef(key),
            pinned: "left",
            cellRenderer: (params: CustomCellRendererProps) => {
              return (
                <Button
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
            colDef.tooltipValueGetter = (p: ITooltipParams) =>
              p.value.toString();
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
    handleResultData(props.data, 1);
    setColumnDefs(colDefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gridOptions = {
    enableCellTextSelection: true,
    onSortChanged: handleSortColumn,
  };

  return (
    <Stack gap={2} style={containerStyle}>
      <div className="ag-theme-quartz" style={gridStyle}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          tooltipMouseTrack={true}
          tooltipHideDelay={5000}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          suppressMultiSort={true}
          loading={loading}
          suppressColumnVirtualisation={true}
          rowBuffer={30}
        />
      </div>
      <div>
        <i className="text-secondary">{props.footer}</i>
        <div style={{ float: "right" }}>
          <Container>
            <Stack direction="horizontal" gap={2}>
              <Pagination size="sm">
                <Pagination.Item>
                  {isCountLoading
                    ? "Loading..."
                    : `${fromCount} to ${toCount} of ${countData.count}`}
                </Pagination.Item>
              </Pagination>
              <Pagination size="sm">
                <Pagination.First
                  disabled={!prevPage}
                  onClick={() => handleUserPageChange(prevParams, 1)}
                />
                <Pagination.Prev
                  disabled={!prevPage}
                  onClick={() =>
                    handleUserPageChange(prevParams, userPageNumber - 1)
                  }
                />
                <Pagination.Item
                  style={{ minWidth: "100px", textAlign: "center" }}
                >
                  {isCountLoading
                    ? "Loading..."
                    : `Page ${userPageNumber} of ${numUserPages}`}
                </Pagination.Item>
                <Pagination.Next
                  disabled={!nextPage}
                  onClick={() =>
                    handleUserPageChange(nextParams, userPageNumber + 1)
                  }
                />
                <Pagination.Last
                  disabled={!nextPage}
                  onClick={() => handleUserPageChange(nextParams, numUserPages)}
                />
              </Pagination>
            </Stack>
          </Container>
        </div>
      </div>
    </Stack>
  );
}

export default Table;
export { ServerPaginatedTable };
