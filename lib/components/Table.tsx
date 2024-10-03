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
import { useQuery } from "@tanstack/react-query";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Pagination from "react-bootstrap/Pagination";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import Stack from "react-bootstrap/Stack";
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { ResultData } from "../types";
import { DataProps } from "../interfaces";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface BaseTableProps extends DataProps {
  rowData: Record<string, string | number>[];
  columnDefs: ColDef[];
  gridOptions?: GridOptions;
  onGridReady: () => void;
  rowCountMessage: string;
  footer?: string;
  loading?: boolean;
  isFilterable: boolean;
  isPaginated: boolean;
  paginationParams: {
    pageCountMessage: string;
    pageNumber: number;
    numPages: number;
    prevPage: boolean;
    nextPage: boolean;
    prevParams: string;
    nextParams: string;
    handleUserPageChange: (params: string, userPage: number) => void;
  };
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

// function formatResultData(resultData: ResultData) {
//   // For CSV export, we allow string, number and boolean values
//   // All other types are converted to strings
//   return (
//     resultData.data?.map((row) =>
//       Object.fromEntries(
//         Object.entries(row).map(([key, value]) => [
//           key,
//           typeof value === "string" ||
//           typeof value === "number" ||
//           typeof value === "boolean"
//             ? value
//             : value === null
//             ? ""
//             : JSON.stringify(value),
//         ])
//       )
//     ) || []
//   );
// }

function BaseTable(props: BaseTableProps) {
  const gridRef = useRef<AgGridReact<Record<string, string | number>>>(null);
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const csvConfig = mkConfig({
    filename: props.project,
    useKeysAsHeaders: true,
  });

  const handleExportToCSV = () => {
    // const fileName = `${props.project}${
    //   props.pageNumber > 1 ? "_" + props.pageNumber.toString() : ""
    // }`;

    const csvData = asString(generateCsv(csvConfig)(props.rowData));

    if (props.fileWriter) {
      showNotification("Starting export: " + props.project + ".csv");
      props.fileWriter(props.project + ".csv", csvData);
    }
  };

  const showNotification = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const clearTableFilters = useCallback(() => {
    gridRef.current!.api.setFilterModel(null);
  }, []);

  return (
    <Stack gap={2} style={containerStyle}>
      <div className="ag-theme-quartz" style={gridStyle}>
        <Container
          fluid
          className="p-0 position-relative"
          style={containerStyle}
        >
          <ToastContainer
            className="p-3"
            position="bottom-end"
            style={{ zIndex: 1 }}
          >
            <Toast
              onClose={() => setToastVisible(false)}
              show={toastVisible}
              delay={3000}
              autohide
            >
              <Toast.Header>
                <strong className="me-auto">Notification</strong>
              </Toast.Header>
              <Toast.Body>{toastMessage}</Toast.Body>
            </Toast>
          </ToastContainer>
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
            suppressMultiSort={true}
            suppressColumnVirtualisation={true}
            rowBuffer={30}
            loading={props.loading}
          />
        </Container>
      </div>
      <div>
        <i className="text-secondary">{props.footer || ""}</i>
        <div style={{ float: "right" }}>
          <Container>
            <Stack direction="horizontal" gap={2}>
              <Pagination size="sm">
                <Pagination.Item>{props.rowCountMessage}</Pagination.Item>
              </Pagination>
              {props.isPaginated && (
                <Pagination size="sm">
                  <Pagination.First
                    disabled={!props.paginationParams.prevPage}
                    onClick={() =>
                      props.paginationParams.handleUserPageChange(
                        props.paginationParams.prevParams,
                        1
                      )
                    }
                  />
                  <Pagination.Prev
                    disabled={!props.paginationParams.prevPage}
                    onClick={() =>
                      props.paginationParams.handleUserPageChange(
                        props.paginationParams.prevParams,
                        props.paginationParams.pageNumber - 1
                      )
                    }
                  />
                  <Pagination.Item
                    style={{ minWidth: "150px", textAlign: "center" }}
                  >
                    {props.paginationParams.pageCountMessage}
                  </Pagination.Item>
                  <Pagination.Next
                    disabled={!props.paginationParams.nextPage}
                    onClick={() =>
                      props.paginationParams.handleUserPageChange(
                        props.paginationParams.nextParams,
                        props.paginationParams.pageNumber + 1
                      )
                    }
                  />
                  <Pagination.Last
                    disabled={!props.paginationParams.nextPage}
                    onClick={() =>
                      props.paginationParams.handleUserPageChange(
                        props.paginationParams.nextParams,
                        props.paginationParams.numPages
                      )
                    }
                  />
                </Pagination>
              )}
              {props.isFilterable && (
                <Pagination size="sm">
                  <Button size="sm" variant="dark" onClick={clearTableFilters}>
                    Clear Filters
                  </Button>
                </Pagination>
              )}
              <Pagination size="sm">
                <Button
                  size="sm"
                  disabled={!props.fileWriter}
                  variant="dark"
                  onClick={handleExportToCSV}
                >
                  Export to CSV
                </Button>
              </Pagination>
            </Stack>
          </Container>
        </div>
      </div>
    </Stack>
  );
}

function Table(props: TableProps) {
  const [rowData, setRowData] = useState<Record<string, string | number>[]>([]);
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

  return (
    <BaseTable
      {...props}
      rowData={rowData}
      columnDefs={columnDefs}
      onGridReady={onGridReady}
      rowCountMessage={`${rowData.length >= 1 ? 1 : 0} to ${
        rowData.length
      } of ${rowData.length}`}
      footer={props.footer}
      isFilterable
      isPaginated={false}
      paginationParams={{
        pageNumber: 1,
        numPages: 1,
        pageCountMessage: "",
        prevPage: false,
        nextPage: false,
        prevParams: "",
        nextParams: "",
        handleUserPageChange: () => {},
      }}
    />
  );
}

function ServerPaginatedTable(props: ServerPaginatedTableProps) {
  const [resultData, setResultData] = useState<
    Record<string, string | number>[]
  >([]);
  const [rowData, setRowData] = useState<Record<string, string | number>[]>([]);
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
  const prevPage = !!(prevParams || userPageNumber > 1);
  const nextPage = !!(nextParams || userPageNumber < numUserPages);

  const getRowData = (
    resultData: Record<string, string | number>[],
    resultsPage: number
  ) => {
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

  return (
    <BaseTable
      {...props}
      rowData={rowData}
      columnDefs={columnDefs}
      gridOptions={{
        onSortChanged: handleSortColumn,
      }}
      onGridReady={onGridReady}
      rowCountMessage={`${fromCount} to ${toCount} of ${countData.count}`}
      footer={props.footer}
      loading={loading}
      isFilterable={false}
      isPaginated
      paginationParams={{
        pageCountMessage: isCountLoading
          ? "Loading..."
          : `Page ${userPageNumber} of ${numUserPages}`,
        pageNumber: userPageNumber,
        numPages: numUserPages,
        prevPage,
        nextPage,
        prevParams,
        nextParams,
        handleUserPageChange,
      }}
    />
  );
}

export default Table;
export { ServerPaginatedTable };
