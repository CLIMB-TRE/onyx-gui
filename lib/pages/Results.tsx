import { useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { useResultsQuery } from "../api";
import FilterPanel from "../components/FilterPanel";
import ResultsPanel from "../components/ResultsPanel";
import SearchBar from "../components/SearchBar";
import SummarisePanel from "../components/SummarisePanel";
import { ResultsProps } from "../interfaces";
import { FilterConfig } from "../types";
import { formatFilters, getColumns } from "../utils/functions";
import { useDebouncedValue, usePersistedState } from "../utils/hooks";
import ColumnsModal from "../components/ColumnsModal";
import { CopyToClipboardButton } from "../components/Buttons";
import Resizer from "../components/Resizer";

function Results(props: ResultsProps) {
  const pageSize = 100; // Pagination page size
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
      [["page_size", pageSize.toString()]]
        .concat(
          [searchInput]
            .map((search) => search.trim())
            .filter((search) => search)
            .map((search) => ["search", search])
        )
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

  const paginatedQueryProps = useMemo(
    () => ({
      ...props,
      searchParameters: debouncedSearchParams,
    }),
    [props, debouncedSearchParams]
  );

  const { isFetching, error, data, refetch } =
    useResultsQuery(paginatedQueryProps);

  // If search parameters have not changed and nothing is pending
  // Then trigger a refetch
  const handleSearch = () => {
    if (!isFetching) refetch();
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
        <div className="h-100" style={{ flex: 1, minWidth: 220 }}>
          <Container fluid className="h-100 g-0">
            <ResultsPanel
              {...props}
              searchParameters={debouncedSearchParams}
              pageSize={pageSize}
              isFetching={isFetching}
              error={error}
              data={data}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              setColumnsModalShow={setColumnsModalShow}
            />
          </Container>
        </div>
      </Stack>
    </Container>
  );
}

export default Results;
