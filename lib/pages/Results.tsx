import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SortChangedEvent } from "@ag-grid-community/core";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { asString, generateCsv, mkConfig } from "export-to-csv";
import { useCountQuery, useResultsQuery } from "../api";
import { useCount, useFieldDescriptions, useResults } from "../api/hooks";
import FilterPanel from "../components/FilterPanel";
import ResultsPanel from "../components/ResultsPanel";
import SearchBar from "../components/SearchBar";
import SummarisePanel from "../components/SummarisePanel";
import ColumnsModal from "../components/ColumnsModal";
import { CopyToClipboardButton } from "../components/Buttons";
import Resizer from "../components/Resizer";
import {
  AnalysisIDCellRendererFactory,
  RecordIDCellRendererFactory,
  S3ReportCellRendererFactory,
} from "../components/CellRenderers";
import ErrorModal from "../components/ErrorModal";
import { ExportHandlerProps, ResultsProps } from "../interfaces";
import {
  ExportStatus,
  FilterConfig,
  ListResponse,
  RecordType,
  TableRow,
} from "../types";
import {
  formatData,
  formatFilters,
  getColDefs,
  getColumns,
  getIncludeExclude,
  getDefaultFileNamePrefix,
  sortData,
  getTableColumns,
} from "../utils/functions";
import { useDebouncedValue, usePersistedState } from "../utils/hooks";
import { s3BucketsMessage } from "../utils/messages";
import { formatResponseStatus } from "../utils/functions";

function Results(props: ResultsProps) {
  const [searchInput, setSearchInput] = usePersistedState(
    props,
    `${props.project.code}${props.title}SearchInput`,
    ""
  );
  const [filterList, setFilterList] = usePersistedState<FilterConfig[]>(
    props,
    `${props.project.code}${props.title}FilterConfigs`,
    []
  );
  const [summariseList, setSummariseList] = usePersistedState<string[]>(
    props,
    `${props.project.code}${props.title}SummariseConfigs`,
    []
  );
  const [includeList, setIncludeList] = usePersistedState<string[]>(
    props,
    `${props.project.code}${props.title}IncludeList`,
    props.fields.default_fields || []
  );
  const [order, setOrder] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 50; // Pagination page size

  const defaultWidth = 300; // Default sidebar width
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [columnsModalShow, setColumnsModalShow] = useState(false);

  const filterOptions = useMemo(
    () =>
      Array.from(props.fields.fields_map.entries())
        .filter(([, field]) => field.actions.includes("filter"))
        .map(([field]) => field),
    [props.fields.fields_map]
  );

  const columnOptions = useMemo(
    () =>
      Array.from(props.fields.fields_map.entries())
        .filter(([, field]) => field.actions.includes("list"))
        .map(([, field]) => field),
    [props.fields.fields_map]
  );

  const searchParameters = useMemo(() => {
    return new URLSearchParams(
      [searchInput]
        .map((search) => search.trim())
        .filter((search) => search)
        .map((search) => ["search", search])
        .concat(formatFilters(filterList))
        .concat(
          summariseList
            .filter((field) => field)
            .map((field) => ["summarise", field])
        )
    ).toString();
  }, [searchInput, filterList, summariseList]);
  const debouncedSearchParams = useDebouncedValue(searchParameters, 500);

  const isServerTable = useMemo(() => {
    return !debouncedSearchParams.includes("summarise=");
  }, [debouncedSearchParams]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams(debouncedSearchParams);
    if (isServerTable && order) params.set("order", order);
    return params.toString();
  }, [debouncedSearchParams, isServerTable, order]);

  const resultsQueryProps = useMemo(() => {
    const params = new URLSearchParams(queryParams);

    if (isServerTable) {
      params.set("page", page.toString());
      params.set("page_size", pageSize.toString());
      const { operator, fields } = getIncludeExclude(
        includeList,
        columnOptions
      );
      fields.forEach((field) => params.append(operator, field));
    }

    return {
      ...props,
      searchParameters: params.toString(),
    };
  }, [
    props,
    queryParams,
    isServerTable,
    page,
    pageSize,
    includeList,
    columnOptions,
  ]);

  const countQueryProps = useMemo(() => {
    return {
      ...props,
      searchParameters: debouncedSearchParams,
      enabled: isServerTable,
    };
  }, [props, debouncedSearchParams, isServerTable]);

  // This effect resets the page to 1 when the query criteria change.
  useEffect(() => setPage(1), [queryParams]);

  // This ref tracks the previous search params to detect when a new search happens.
  const prevQueryParamsRef = useRef<string>();
  const isNewQuery = queryParams !== prevQueryParamsRef.current;

  // After every render, update the ref for the next render cycle.
  useEffect(() => {
    prevQueryParamsRef.current = queryParams;
  });

  const {
    isFetching: isResultsFetching,
    error: resultsError,
    data: resultsResponse,
    refetch: resultsRefetch,
  } = useResultsQuery({
    ...resultsQueryProps,
    enabled: !isNewQuery || page === 1,
  });
  const results = useResults(resultsResponse);

  const {
    isFetching: isCountFetching,
    data: countResponse,
    refetch: countRefetch,
  } = useCountQuery(countQueryProps);
  const count = useCount(countResponse);

  // If search parameters have not changed and nothing is pending
  // Then trigger a refetch
  const handleSearch = () => {
    if (!isResultsFetching && !isCountFetching) {
      resultsRefetch();
      countRefetch();
    }
  };

  const handleSortChange = (event: SortChangedEvent) => {
    if (event.columns && event.columns.length > 0) {
      const field = event.columns[event.columns.length - 1].getId();
      const direction = event.columns[event.columns.length - 1].getSort() || "";

      if (direction === "asc") {
        setOrder(field);
      } else if (direction === "desc") {
        setOrder(`-${field}`);
      } else {
        setOrder("");
      }
    }
  };

  const handleExportData = async (exportProps: ExportHandlerProps) => {
    exportProps.setExportStatus(ExportStatus.RUNNING);

    const csvConfig = mkConfig({
      useKeysAsHeaders: true,
      fieldSeparator: exportProps.fileName.endsWith(".tsv") ? "\t" : ",",
    });
    const pages: TableRow[][] = [];
    let nRows = 0;
    let search: URLSearchParams | null = new URLSearchParams(searchParameters);

    // Add include/exclude columns
    const { operator, fields } = getIncludeExclude(includeList, columnOptions);
    fields.forEach((field) => search?.append(operator, field));

    // Fetch pages of data until the 'next' field is not present
    while (search instanceof URLSearchParams) {
      await props
        .httpPathHandler(`${props.searchPath}/?${search.toString()}`)
        .then((response) => {
          if (!response.ok) throw new Error(formatResponseStatus(response));
          return response.json();
        })
        .then((response: ListResponse<RecordType>) => {
          if (exportProps.statusToken.status === ExportStatus.CANCELLED)
            throw new Error(ExportStatus.CANCELLED);

          const page = formatData(response.data);
          pages.push(page);
          nRows += page.length;
          search = response.next
            ? new URLSearchParams(response.next.split("?", 2)[1])
            : null;

          exportProps.setExportProgress((nRows / count) * 100);
          exportProps.setExportProgressMessage(
            `Fetched ${nRows.toLocaleString()}/${count.toLocaleString()} items...`
          );
        });
    }

    // Concatenate all pages into a single array
    const data: TableRow[] = Array.prototype.concat.apply([], pages);

    // If there is no data, return the empty string
    if (data.length === 0) return "";
    else {
      // If an order is specified, sort the data
      if (order) {
        sortData(
          data,
          order.replace(/^-/, ""),
          order.startsWith("-") ? "desc" : "asc"
        );
      }

      // Convert the data to a CSV string
      const csvData = asString(generateCsv(csvConfig)(data));
      return csvData;
    }
  };

  const defaultFileNamePrefix = useMemo(
    () =>
      getDefaultFileNamePrefix(
        `${props.project.code}_${props.title.toLowerCase()}`,
        searchParameters
      ),
    [props.project, props.title, searchParameters]
  );

  const [errorModalShow, setErrorModalShow] = useState(false);
  const [s3ReportError, setS3ReportError] = useState<Error | null>(null);

  const handleErrorModalShow = useCallback((error: Error) => {
    setS3ReportError(error);
    setErrorModalShow(true);
  }, []);

  const errorModalProps = useMemo(
    () => ({
      ...props,
      handleErrorModalShow,
    }),
    [props, handleErrorModalShow]
  );

  const cellRenderers = useMemo(() => {
    return new Map([
      [props.recordPrimaryID, RecordIDCellRendererFactory(props)],
      [props.analysisPrimaryID, AnalysisIDCellRendererFactory(props)],
      ["ingest_report", S3ReportCellRendererFactory(errorModalProps)],
      ["report", S3ReportCellRendererFactory(errorModalProps)],
    ]);
  }, [props, errorModalProps]);

  const headerTooltips = useFieldDescriptions(props.fields.fields_map);

  const colDefs = useMemo(() => {
    return getColDefs({
      ...props,
      data: getTableColumns(includeList, columnOptions),
      cellRenderers,
      isServerTable: true,
      headerTooltips,
      order,
    });
  }, [props, includeList, columnOptions, cellRenderers, headerTooltips, order]);

  const handleActiveColumnsChange = (columns: string[]) => {
    setIncludeList(getColumns(columns, columnOptions));
  };

  const handleCopyCLICommand = () => {
    const command = [props.commandBase];

    // Format filters
    const filters = formatFilters(filterList).map(
      ([filter, value]) =>
        `--field ${filter.replace("__exact", "")}=${
          value.includes(" ") ? `"${value}"` : value
        }`
    );
    if (filters.length > 0) command.push(filters.join(" "));

    // Format summarise
    const summarise = summariseList.filter((field) => field);
    if (summarise.length > 0)
      command.push(`--summarise ${summarise.join(",")}`);

    // Format include/exclude columns
    const { operator, fields } = getIncludeExclude(includeList, columnOptions);
    if (fields.length > 0) command.push(`--${operator} ${fields.join(",")}`);

    // Assemble the command and write to clipboard
    navigator.clipboard.writeText(command.join(" ").trim());
  };

  return (
    <Container fluid className="g-0 h-100">
      <ColumnsModal
        {...props}
        show={columnsModalShow}
        onHide={() => setColumnsModalShow(false)}
        columns={columnOptions}
        activeColumns={includeList}
        setActiveColumns={handleActiveColumnsChange}
      />
      <ErrorModal
        title="S3 Reports"
        message={s3BucketsMessage}
        error={s3ReportError}
        show={errorModalShow}
        onHide={() => setErrorModalShow(false)}
      />
      <Stack gap={2} direction="horizontal" className="h-100">
        {!sidebarCollapsed && (
          <Resizer defaultWidth={defaultWidth} minWidth={220} maxWidth={600}>
            <Container fluid className="h-100 g-0">
              <Stack gap={2} className="h-100">
                <SearchBar
                  {...props}
                  placeholder={`Search ${props.title.toLowerCase()}...`}
                  searchInput={searchInput}
                  setSearchInput={setSearchInput}
                  handleSearch={handleSearch}
                />
                <Stack gap={2} className="h-100 overflow-y-hidden">
                  <FilterPanel
                    {...props}
                    filterList={filterList}
                    setFilterList={setFilterList}
                    filterFieldOptions={filterOptions}
                  />
                  <SummarisePanel
                    {...props}
                    summariseList={summariseList}
                    setSummariseList={setSummariseList}
                    filterFieldOptions={filterOptions}
                  />
                  <CopyToClipboardButton
                    size="sm"
                    variant="secondary"
                    title="Copy CLI Command"
                    onClick={handleCopyCLICommand}
                    showTitle
                  />
                </Stack>
              </Stack>
            </Container>
          </Resizer>
        )}
        <div className="h-100" style={{ minWidth: "50%", flex: 1 }}>
          <Container fluid className="h-100 g-0">
            <ResultsPanel
              {...props}
              defaultFileNamePrefix={defaultFileNamePrefix}
              pageSize={pageSize}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              setColumnsModalShow={setColumnsModalShow}
              colDefs={colDefs}
              isResultsFetching={isResultsFetching}
              resultsError={resultsError}
              resultsResponse={resultsResponse}
              data={results}
              isCountFetching={isCountFetching}
              count={count}
              page={page}
              order={order}
              handleExportData={handleExportData}
              handleSortChange={handleSortChange}
              handlePageChange={setPage}
              cellRenderers={cellRenderers}
              isServerTable={isServerTable}
              headerTooltips={headerTooltips}
            />
          </Container>
        </div>
      </Stack>
    </Container>
  );
}

export default Results;
