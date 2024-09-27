import { useState, useCallback, useMemo } from "react";
import { AgGridReact, CustomCellRendererProps } from "@ag-grid-community/react"; // React Data Grid Component
import "@ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "@ag-grid-community/styles/ag-theme-quartz.min.css"; // Optional Theme applied to the Data Grid
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import {
  GridOptions,
  ColDef,
  SortChangedEvent,
  ModuleRegistry,
  ITooltipParams,
} from "@ag-grid-community/core";
import { useQuery } from "@tanstack/react-query";
import Button from "react-bootstrap/Button";
import { Container, Pagination } from "react-bootstrap";
import Stack from "react-bootstrap/Stack";
import { ResultData, ResultType } from "../types";

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

function urlToParams(url: string) {
  return url.split("?", 2)[1];
}

function Table({
  project,
  data,
  searchParameters,
  headerNames,
  headerTooltips,
  headerTooltipPrefix = "",
  tooltipFields,
  flexOnly,
  isServerData = false,
  footer = "",
  cellRenderers,
  handleRecordModalShow,
  httpPathHandler,
  s3PathHandler,
}: {
  data: ResultData;
  project?: string;
  searchParameters?: string;
  headerNames?: Map<string, string>;
  headerTooltips?: Map<string, string>;
  headerTooltipPrefix?: string;
  tooltipFields?: string[];
  flexOnly?: string[];
  isServerData?: boolean;
  footer?: string;
  cellRenderers?: Map<string, (params: CustomCellRendererProps) => JSX.Element>;
  handleRecordModalShow?: (climbID: string) => void;
  httpPathHandler?: (path: string) => Promise<Response>;
  s3PathHandler?: (path: string) => void;
}) {
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [rowData, setRowData] = useState<ResultType[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [nextPage, setNextPage] = useState("");
  const [prevPage, setPrevPage] = useState("");
  const [loading, setLoading] = useState(false);

  const { isFetching: isCountLoading, data: countData = { count: 0 } } =
    useQuery({
      queryKey: ["count", project, searchParameters],
      queryFn: async () => {
        const search = new URLSearchParams(searchParameters);

        if (httpPathHandler) {
          return httpPathHandler(
            `projects/${project}/count/?${search.toString()}`
          )
            .then((response) => response.json())
            .then((data) => {
              return { count: data.data.count };
            });
        }
      },
      enabled: !!project && isServerData,
      cacheTime: 0.5 * 60 * 1000,
    });

  const defaultCellRenderer = (params: CustomCellRendererProps) => {
    if (
      s3PathHandler &&
      typeof params.value === "string" &&
      params.value.startsWith("s3://") &&
      params.value.endsWith(".html")
    ) {
      return (
        <Button
          size="sm"
          variant="link"
          onClick={() => {
            s3PathHandler(params.value);
          }}
        >
          {params.value}
        </Button>
      );
    } else {
      return params.value;
    }
  };

  const baseDefaultColDef = (key: string) => {
    return {
      field: key,
      headerName: headerNames?.get(key) || key,
      minWidth: 200,
      headerTooltip: headerTooltips?.get(headerTooltipPrefix + key),
      cellRenderer: defaultCellRenderer,
    };
  };

  let defaultColDef: (key: string) => ColDef;

  if (isServerData) {
    defaultColDef = (key: string) => {
      return {
        ...baseDefaultColDef(key),
        comparator: () => {
          return 0;
        },
      };
    };
  } else {
    defaultColDef = baseDefaultColDef;
  }

  const handleResultData = (data: ResultData) => {
    setRowData(formatResultData(data));
    setNextPage(data.next || "");
    setPrevPage(data.previous || "");
  };

  const onGridReady = useCallback(() => {
    let colDefs: ColDef[];

    if (data.data && data.data.length > 0) {
      colDefs = Object.keys(data.data[0]).map((key) => {
        if (handleRecordModalShow && key === "climb_id") {
          return {
            ...defaultColDef(key),
            pinned: "left",
            cellRenderer: (params: CustomCellRendererProps) => {
              return (
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => {
                    handleRecordModalShow(params.value);
                  }}
                >
                  {params.value}
                </Button>
              );
            },
          };
        } else {
          const colDef = {
            ...defaultColDef(key),
            cellRenderer: cellRenderers?.get(key) || defaultCellRenderer,
            autoHeight: cellRenderers?.get(key) ? true : false,
            wrapText: cellRenderers?.get(key) ? true : false,
            tooltipValueGetter: tooltipFields?.includes(key)
              ? (p: ITooltipParams) => p.value.toString()
              : undefined,
          };

          if (!flexOnly || flexOnly.includes(key)) {
            colDef.flex = 1;
          }
          return colDef;
        }
      });
    } else {
      colDefs = [];
    }
    handleResultData(data);
    setColumnDefs(colDefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSortColumn = (event: SortChangedEvent) => {
    let field = "";
    let direction = "";
    let order = "";

    if (event.columns && event.columns.length > 0) {
      field = event.columns[event.columns.length - 1].getId();
      direction = event.columns[event.columns.length - 1].getSort() || "";
    }

    if (direction === "asc") {
      order = `${field}`;
    } else if (direction === "desc") {
      order = `-${field}`;
    }

    const search = new URLSearchParams(searchParameters);

    if (order) {
      search.set("order", order);
    }

    handlePageChange(search.toString(), 1);
  };

  const handlePageChange = (params: string, page: number) => {
    if (httpPathHandler && !loading) {
      setLoading(true);
      const search = new URLSearchParams(params);
      search.set("page", page.toString());

      httpPathHandler(`projects/${project}/?${search.toString()}`)
        .then((response) => response.json())
        .then((response) => {
          handleResultData(response);
          setPageNumber(page);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  let gridOptions: GridOptions;
  if (isServerData) {
    gridOptions = {
      enableCellTextSelection: true,
      onSortChanged: handleSortColumn,
    };
  } else {
    gridOptions = {
      enableCellTextSelection: true,
      defaultColDef: {
        filter: true,
      },
    };
  }

  const serverDataMaxRows = 1000;
  const pageCount = Math.ceil(countData.count / serverDataMaxRows);
  const fromCount =
    (pageNumber - 1) * serverDataMaxRows + (rowData.length >= 1 ? 1 : 0);
  const toCount = (pageNumber - 1) * serverDataMaxRows + rowData.length;
  const countMessage = isCountLoading
    ? "Loading..."
    : `${fromCount} to ${toCount} of ${
        isServerData ? countData.count : rowData.length
      }`;
  const pageMessage = isCountLoading
    ? "Loading..."
    : `Page ${pageNumber} of ${isServerData ? pageCount : 1}`;

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
        />
      </div>
      <div>
        <i className="text-secondary">{footer}</i>
        <div style={{ float: "right" }}>
          <Container>
            <Stack direction="horizontal" gap={2}>
              <Pagination size="sm">
                <Pagination.Item>{countMessage}</Pagination.Item>
              </Pagination>
              <Pagination size="sm">
                <Pagination.First
                  disabled={!prevPage}
                  onClick={() => handlePageChange(urlToParams(prevPage), 1)}
                />
                <Pagination.Prev
                  disabled={!prevPage}
                  onClick={() =>
                    handlePageChange(urlToParams(prevPage), pageNumber - 1)
                  }
                />
                <Pagination.Item
                  style={{ minWidth: "100px", textAlign: "center" }}
                >
                  {pageMessage}
                </Pagination.Item>
                <Pagination.Next
                  disabled={!nextPage}
                  onClick={() =>
                    handlePageChange(urlToParams(nextPage), pageNumber + 1)
                  }
                />
                <Pagination.Last
                  disabled={!nextPage}
                  onClick={() =>
                    handlePageChange(urlToParams(nextPage), pageCount)
                  }
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
