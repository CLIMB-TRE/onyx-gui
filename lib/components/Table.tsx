import { useState, useMemo } from "react";
import { ResultType } from "../types";
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.min.css"; // Optional Theme applied to the Data Grid
import Button from "react-bootstrap/Button";

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

function Table({
  data,
  titles,
  handleRecordDetailShow,
  s3PathHandler,
  height = 465,
}: {
  data: ResultType[];
  titles?: Map<string, string>;
  handleRecordDetailShow?: (climbID: string) => void;
  s3PathHandler?: (path: string) => void;
  height?: number;
}) {
  const rowData = useMemo(() => {
    return convertData(data);
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
        gridOptions={{
          enableBrowserTooltips: true,
          defaultColDef: {
            sortable: true,
            filter: true,
          },
        }}
      />
    </div>
  );
}

function ServerTable({
  data,
  titles,
  handleRecordDetailShow,
  s3PathHandler,
  height = 465,
}: {
  data: ResultType[];
  titles?: Map<string, string>;
  handleRecordDetailShow?: (climbID: string) => void;
  s3PathHandler?: (path: string) => void;
  height?: number;
}) {
  const [rowData, setRowData] = useState<ResultType[]>(convertData(data));
  const [loading, setLoading] = useState(false);

  const defaultColumnProperties = (key: string) => {
    return {
      headerName: key,
      field: key,
      headerTooltip: titles?.get(key),
      comparator: () => {
        return null;
      },
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
        } else {
          return { ...defaultColumnProperties(key) };
        }
      });
    } else {
      return [];
    }
  };

  const handleColumnSort = (event: {
    columns: { colId: string; sort: string }[];
  }) => {
    const field = event.columns[event.columns.length - 1].colId;
    const direction = event.columns[event.columns.length - 1].sort;

    if (direction === "asc") {
      console.log(`order=${field}`);
    } else if (direction === "desc") {
      console.log(`order=-${field}`);
    } else {
      console.log("");
    }

    // set timeout for 2 seconds to simulate server response
    setLoading(true);
    setTimeout(() => {
      setRowData(convertData([...rowData].reverse()));
      setLoading(false);
    }, 500);
  };

  return (
    <div className="ag-theme-quartz" style={{ height: height }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs()}
        gridOptions={{
          enableBrowserTooltips: true,
        }}
        loading={loading}
        onSortChanged={handleColumnSort}
      />
    </div>
  );
}

export default Table;
export { ServerTable };
