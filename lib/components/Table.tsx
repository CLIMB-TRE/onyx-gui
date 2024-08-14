import { useMemo } from "react";
import { ResultType } from "../types";
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.min.css"; // Optional Theme applied to the Data Grid
import Button from "react-bootstrap/Button";

function Table({
  data,
  titles,
  handleRecordDetailShow,
  s3PathHandler,
  isSortable = true,
  isFilterable = true,
  height = 450,
}: {
  data: ResultType[];
  titles?: Map<string, string>;
  handleRecordDetailShow?: (climbID: string) => void;
  s3PathHandler?: (path: string) => void;
  isSortable?: boolean;
  isFilterable?: boolean;
  height?: number;
}) {
  const gridOptions = {
    enableBrowserTooltips: true,
    defaultColDef: {
      sortable: isSortable,
      filter: isFilterable,
    },
  };

  const rowData = useMemo(() => {
    // Convert all non-number values to strings
    return data.map((item) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => [
          key,
          typeof value === "number" ? value : value?.toString().trim() || "",
        ])
      )
    );
  }, [data]);

  const defaultColumnProperties = (key: string) => {
    return {
      headerName: key,
      field: key,
      headerTooltip: titles?.get(key),
    };
  };

  const columnDefs = () => {
    if (data.length > 0) {
      return Object.keys(data[0]).map((key) => {
        if (handleRecordDetailShow && key === "climb_id") {
          return {
            ...defaultColumnProperties(key),
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
            ...defaultColumnProperties(key),
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
            ...defaultColumnProperties(key),
            flex: 1,
          };
        } else {
          return defaultColumnProperties(key);
        }
      });
    } else {
      return [];
    }
  };

  return (
    <div className="ag-theme-quartz" style={{ height: height }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs()}
        gridOptions={gridOptions}
      />
    </div>
  );
}

function sortGrid(
  event: {
    api: {
      applyColumnState: (columnState: {
        state: { colId: string; sort: string }[];
      }) => void;
      ensureColumnVisible: (sortKey: string) => void;
    };
  },
  sort: { sortKey: string; direction: string }
) {
  const columnState = {
    // https://www.ag-grid.com/javascript-grid-column-state/#column-state-interface
    state: [
      {
        colId: sort.sortKey,
        sort: sort.direction,
      },
    ],
  };
  event.api.applyColumnState(columnState);
  event.api.ensureColumnVisible(sort.sortKey);
}

function ServerTable({
  data,
  titles,
  handleRecordDetailShow,
  s3PathHandler,
  isSortable = true,
  isFilterable = true,
  height = 450,
  handleColumnSort,
  defaultSort,
}: {
  data: ResultType[];
  titles?: Map<string, string>;
  handleRecordDetailShow?: (climbID: string) => void;
  s3PathHandler?: (path: string) => void;
  isSortable?: boolean;
  isFilterable?: boolean;
  height?: number;
  handleColumnSort?: (event: {
    columns: { colId: string; sort: string }[];
  }) => void;
  defaultSort?: { sortKey: string; direction: string };
}) {
  const gridOptions = {
    enableBrowserTooltips: true,
    defaultColDef: {
      sortable: isSortable,
      filter: isFilterable,
    },
    onGridReady: (event: { columns: { colId: string; sort: string }[] }) => {
      sortGrid(event, defaultSort);
    },
  };

  const rowData = useMemo(() => {
    // Convert all non-number values to strings
    return data.map((item) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => [
          key,
          typeof value === "number" ? value : value?.toString().trim() || "",
        ])
      )
    );
  }, [data]);

  const columnDefs = () => {
    if (data.length > 0) {
      return Object.keys(data[0]).map((key) => {
        if (key === "climb_id" && handleRecordDetailShow) {
          return {
            headerName: key,
            field: key,
            headerTooltip: titles?.get(key),
            comparator: null,
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
          key.startsWith("s3://") &&
          key.endsWith(".html") &&
          s3PathHandler
        ) {
          return {
            headerName: key,
            field: key,
            headerTooltip: titles?.get(key),
            comparator: null,
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
            headerName: key,
            field: key,
            headerTooltip: titles?.get(key),
            flex: 1,
          };
        } else {
          return {
            headerName: key,
            field: key,
            headerTooltip: titles?.get(key),
            comparator: null,
          };
        }
      });
    } else {
      return [];
    }
  };

  return (
    <div className="ag-theme-quartz" style={{ height: height }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs()}
        gridOptions={gridOptions}
        onSortChanged={(event) => {
          handleColumnSort && handleColumnSort(event);
        }}
      />
    </div>
  );
}

export default Table;
export { ServerTable };
