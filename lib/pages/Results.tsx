import { useEffect, useMemo, useRef, useState } from "react";
import { SortChangedEvent } from "@ag-grid-community/core";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { useCountQuery, useResultsQuery } from "../api";
import FilterPanel from "../components/FilterPanel";
import ResultsPanel from "../components/ResultsPanel";
import SearchBar from "../components/SearchBar";
import SummarisePanel from "../components/SummarisePanel";
import { ExportHandlerProps, ResultsProps } from "../interfaces";
import {
  ExportStatus,
  FilterConfig,
  InputRow,
  ListResponse,
  RecordType,
  TableRow,
} from "../types";
import { formatFilters, getColumns } from "../utils/functions";
import { useDebouncedValue, usePersistedState } from "../utils/hooks";
import ColumnsModal from "../components/ColumnsModal";
import { CopyToClipboardButton } from "../components/Buttons";
import Resizer from "../components/Resizer";
import { useCount, useResults } from "../api/hooks";
import { asString, generateCsv, mkConfig } from "export-to-csv";
import { formatResponseStatus } from "../utils/functions";

/** Converts InputRow[] to TableRow[]. All non-string/number values are converted to strings. */
function formatData(data: InputRow[]): TableRow[] {
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
function sortData(data: TableRow[], field: string, direction: string): void {
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

  const defaultWidth = 300;
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
    const { columnOperator, columns } = getColumns(includeList, columnOptions);
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
        .concat(columns.map((field) => [columnOperator, field]))
    ).toString();
  }, [searchInput, filterList, summariseList, includeList, columnOptions]);

  const debouncedSearchParams = useDebouncedValue(searchParameters, 500);

  const paginatedQueryProps = useMemo(() => {
    const params = new URLSearchParams(debouncedSearchParams);
    params.set("page", page.toString());
    params.set("page_size", pageSize.toString());
    params.set("order", order);
    return {
      ...props,
      searchParameters: params.toString(),
    };
  }, [props, debouncedSearchParams, page, pageSize, order]);

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
    if (includeList.length > 0) {
      const { columnOperator, columns } = getColumns(
        includeList,
        columnOptions
      );
      if (columns.length > 0)
        command.push(`--${columnOperator} ${columns.join(",")}`);
    }

    // Assemble the command and write to clipboard
    navigator.clipboard.writeText(command.join(" ").trim());
  };

  // This effect resets the page to 1 when the search criteria change.
  useEffect(() => setPage(1), [debouncedSearchParams]);

  // This ref tracks the previous search params to detect when a new search happens.
  const prevSearchParamsRef = useRef<string>();
  const isNewSearch = debouncedSearchParams !== prevSearchParamsRef.current;

  // After every render, update the ref for the next render cycle.
  useEffect(() => {
    prevSearchParamsRef.current = debouncedSearchParams;
  });

  const {
    isFetching: isResultsFetching,
    error: resultsError,
    data: resultsResponse,
    refetch: resultsRefetch,
  } = useResultsQuery({
    ...paginatedQueryProps,
    enabled: !isNewSearch || page === 1,
  });
  const results = useResults(resultsResponse);

  const {
    isFetching: isCountFetching,
    data: countResponse,
    refetch: countRefetch,
  } = useCountQuery({
    ...props,
    searchParameters: debouncedSearchParams,
    enabled: !isNewSearch || page === 1,
  });
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

  const handlePageChange = (page: number) => {
    setPage(page);
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

    // Remove order and pagination parameters for export
    search.delete("order");
    search.delete("page");
    search.delete("page_size");

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
            throw new Error("export_cancelled");

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

  return (
    <Container fluid className="g-0 h-100">
      <ColumnsModal
        {...props}
        show={columnsModalShow}
        onHide={() => setColumnsModalShow(false)}
        columns={columnOptions}
        activeColumns={includeList}
        setActiveColumns={setIncludeList}
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
              searchParameters={debouncedSearchParams}
              pageSize={pageSize}
              data={resultsResponse}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              setColumnsModalShow={setColumnsModalShow}
              columns={columnOptions}
              isResultsFetching={isResultsFetching}
              resultsError={resultsError}
              results={results}
              isCountFetching={isCountFetching}
              count={count}
              page={page}
              order={order}
              handleExportData={handleExportData}
              handleSortChange={handleSortChange}
              handlePageChange={handlePageChange}
            />
          </Container>
        </div>
      </Stack>
    </Container>
  );
}

export default Results;
