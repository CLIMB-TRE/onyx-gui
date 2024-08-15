import { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.min.css"; // Optional Theme applied to the Data Grid
import { GridOptions, ColDef, SortChangedEvent } from "ag-grid-community";
import { useQuery } from "@tanstack/react-query";
import Button from "react-bootstrap/Button";
import { Pagination } from "react-bootstrap";
import Stack from "react-bootstrap/Stack";
import { ResultData, ResultType } from "../types";

function convertData(data: ResultType[]) {
  // Convert all non-number values to strings
  return data.map((item) =>
    Object.fromEntries(
      Object.entries(item).map(([key, value]) => [
        key,
        typeof value === "number" ? value : value?.toString().trim() || "",
      ])
    )
  );
}

const getPageCounts = (
  pageNumber: number,
  pageLength: number,
  prevPageCount: number
) => {
  return {
    fromCount: (pageNumber - 1) * prevPageCount + (pageLength >= 1 ? 1 : 0),
    toCount: (pageNumber - 1) * prevPageCount + pageLength,
  };
};

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
  const [tableData, setTableData] = useState<ResultData>(data || {});
  const [pageNumber, setPageNumber] = useState(1);
  const nextPage = tableData.next || "";
  const prevPage = tableData.previous || "";
  const [prevPageCount, setPrevPageCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { isFetching: isCountLoading, data: countData = {} } = useQuery({
    queryKey: ["count", project, searchParameters],
    queryFn: async () => {
      const search = new URLSearchParams(searchParameters);
      search.set("count", "true");

      if (httpPathHandler) {
        return httpPathHandler(
          `projects/${project}/?${search.toString()}`
        ).then((response) => response.json());
      }
    },
    enabled: !!project && isServerData,
    cacheTime: 0.5 * 60 * 1000,
  });

  let defaultColDef: (key: string) => ColDef;

  if (isServerData) {
    defaultColDef = (key: string) => {
      return {
        headerName: key,
        field: key,
        headerTooltip: titles?.get(titlePrefix + key),
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
      };
    };
  }

  const rowData = useMemo(() => {
    return convertData(tableData.data || []);
  }, [tableData.data]);

  const columnDefs = () => {
    if (rowData.length > 0) {
      return Object.keys(rowData[0]).map((key) => {
        if (handleRecordDetailShow && key === "climb_id") {
          return {
            ...defaultColDef(key),
            cellRenderer: (params: { value: string }) => {
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
        } else if (
          s3PathHandler &&
          key.startsWith("s3://") &&
          key.endsWith(".html")
        ) {
          return {
            ...defaultColDef(key),
            cellRenderer: (params: { value: string }) => {
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
            },
          };
        } else if (key === "Field" || key === "Value") {
          // Set column to 50% grid space
          return {
            ...defaultColDef(key),
            flex: 1,
          };
        } else {
          return { ...defaultColDef(key) };
        }
      });
    } else {
      return [];
    }
  };

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
          setTableData(response);
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
          setTableData(response);
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
          setTableData(response);
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
    };
  } else {
    gridOptions = {
      enableCellTextSelection: true,
      defaultColDef: {
        filter: true,
      },
    };
  }

  const { fromCount, toCount } = getPageCounts(
    pageNumber,
    rowData.length,
    prevPageCount
  );

  return (
    <Stack gap={2}>
      <div className="ag-theme-quartz" style={{ height: height }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs()}
          tooltipMouseTrack={true}
          tooltipHideDelay={5000}
          gridOptions={gridOptions}
          loading={loading}
        />
      </div>
      <Stack direction="horizontal" gap={2}>
        <Pagination size="sm">
          <Pagination.Item>
            {`${fromCount} to ${toCount} of ${
              isServerData
                ? isCountLoading
                  ? "Loading..."
                  : countData.data.count
                : rowData.length
            }`}
          </Pagination.Item>
        </Pagination>
        {isServerData && (
          <Pagination size="sm">
            <Pagination.Prev
              disabled={!prevPage}
              onClick={handlePreviousPage}
            />
            <Pagination.Item>{`Page ${pageNumber}`}</Pagination.Item>
            <Pagination.Next disabled={!nextPage} onClick={handleNextPage} />
          </Pagination>
        )}
      </Stack>
    </Stack>
  );
}

export default Table;
