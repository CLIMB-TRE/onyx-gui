import { useState, useCallback } from "react";
import { AgGridReact, CustomCellRendererProps } from "@ag-grid-community/react"; // React Data Grid Component
import "@ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "@ag-grid-community/styles/ag-theme-quartz.min.css"; // Optional Theme applied to the Data Grid
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import {
  GridOptions,
  ColDef,
  SortChangedEvent,
  ModuleRegistry,
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

function Table({
  project,
  data,
  searchParameters,
  titles,
  titlePrefix = "",
  handleRecordDetailShow,
  httpPathHandler,
  s3PathHandler,
  height = 475,
  isServerData = false,
}: {
  data: ResultData;
  project?: string;
  searchParameters?: string;
  titles?: Map<string, string>;
  titlePrefix?: string;
  handleRecordDetailShow?: (climbID: string) => void;
  httpPathHandler?: (path: string) => Promise<Response>;
  s3PathHandler?: (path: string) => void;
  height?: number;
  isServerData?: boolean;
}) {
  const [rowData, setRowData] = useState<ResultType[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [nextPage, setNextPage] = useState("");
  const [prevPage, setPrevPage] = useState("");
  const [prevPageCount, setPrevPageCount] = useState(0);
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

  let defaultColDef: (key: string) => ColDef;

  if (isServerData) {
    defaultColDef = (key: string) => {
      return {
        headerName: key,
        field: key,
        headerTooltip: titles?.get(titlePrefix + key),
        cellRenderer: defaultCellRenderer,
        comparator: () => {
          return 0;
        },
      };
    };
  } else {
    defaultColDef = (key: string) => {
      return {
        headerName: key,
        field: key,
        headerTooltip: titles?.get(titlePrefix + key),
        cellRenderer: defaultCellRenderer,
      };
    };
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
        if (handleRecordDetailShow && key === "climb_id") {
          return {
            ...defaultColDef(key),
            pinned: "left",
            cellRenderer: (params: CustomCellRendererProps) => {
              return (
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => {
                    handleRecordDetailShow(params.value);
                  }}
                >
                  {params.value}
                </Button>
              );
            },
          };
        } else if (key === "Field" || key === "Value") {
          return {
            ...defaultColDef(key),
            // Set column to 50% grid space
            flex: 1,
          };
        } else {
          return { ...defaultColDef(key) };
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
    search.set("order", order);
    search.set("page", "1");

    if (httpPathHandler) {
      setLoading(true);
      httpPathHandler(`projects/${project}/?${search.toString()}`)
        .then((response) => response.json())
        .then((response) => {
          handleResultData(response);
          setPageNumber(1);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleNextPage = () => {
    if (httpPathHandler && !loading) {
      setPrevPageCount(rowData.length);
      setLoading(true);
      httpPathHandler(
        `projects/${project}/?${nextPage?.split("?", 2)[1] || ""}`
      )
        .then((response) => response.json())
        .then((response) => {
          handleResultData(response);
          setPageNumber(pageNumber + 1);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handlePreviousPage = () => {
    if (httpPathHandler && !loading) {
      setLoading(true);
      httpPathHandler(
        `projects/${project}/?${prevPage?.split("?", 2)[1] || ""}`
      )
        .then((response) => response.json())
        .then((response) => {
          handleResultData(response);
          setPageNumber(pageNumber - 1);
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
      defaultColDef: {
        sortable: false,
      },
    };
  } else {
    gridOptions = {
      enableCellTextSelection: true,
      defaultColDef: {
        filter: true,
      },
    };
  }

  const fromCount =
    (pageNumber - 1) * prevPageCount + (rowData.length >= 1 ? 1 : 0);
  const toCount = (pageNumber - 1) * prevPageCount + rowData.length;

  return (
    <Stack gap={2}>
      <div className="ag-theme-quartz" style={{ height: height }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          tooltipMouseTrack={true}
          tooltipHideDelay={5000}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          loading={loading}
        />
      </div>
      <div>
        <div style={{ float: "right" }}>
          <Container>
            <Stack direction="horizontal" gap={2}>
              <Pagination size="sm">
                <Pagination.Item>
                  {isCountLoading
                    ? "Loading..."
                    : `${fromCount} to ${toCount} of ${
                        isServerData ? countData.count : rowData.length
                      }`}
                </Pagination.Item>
              </Pagination>
              <Pagination size="sm">
                <Pagination.Prev
                  disabled={!prevPage}
                  onClick={handlePreviousPage}
                />
                <Pagination.Item
                  style={{ minWidth: "75px", textAlign: "center" }}
                >{`Page ${pageNumber}`}</Pagination.Item>
                <Pagination.Next
                  disabled={!nextPage}
                  onClick={handleNextPage}
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
