import { useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { useResultsQuery } from "../api";
import FilterPanel from "../components/FilterPanel";
import ResultsPanel from "../components/ResultsPanel";
import SearchBar from "../components/SearchBar";
import SummarisePanel from "../components/SummarisePanel";
import { ResultsProps } from "../interfaces";
import { FilterConfig, Field } from "../types";
import { formatFilters } from "../utils/functions";
import { useDebouncedValue, usePersistedState } from "../utils/hooks";
import ColumnsModal from "../components/ColumnsModal";
import { CopyToClipboardButton } from "../components/Buttons";
import Resizer from "../components/Resizer";

function Results(props: ResultsProps) {
  const pageSize = 100; // Pagination page size
  const [searchInput, setSearchInput] = useState("");
  const [filterList, setFilterList] = usePersistedState<FilterConfig[]>(
    props,
    `${props.objectType}FilterConfigs`,
    []
  );
  const [summariseList, setSummariseList] = usePersistedState<Array<string>>(
    props,
    `${props.objectType}SummariseConfigs`,
    []
  );
  const [includeList, setIncludeList] = useState<Field[]>(
    Array.from(props.fields.entries())
      .filter(([, field]) => props.defaultFields.includes(field.code))
      .map(([, field]) => field)
  );

  const defaultWidth = 300;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);

  const [columnsModalShow, setColumnsModalShow] = useState(false);

  const filterOptions = useMemo(
    () =>
      Array.from(props.fields.entries())
        .filter(([, field]) => field.actions.includes("filter"))
        .map(([field]) => field),
    [props.fields]
  );

  const columnOptions = useMemo(
    () =>
      Array.from(props.fields.entries())
        .filter(([, field]) => field.actions.includes("list"))
        .map(([, field]) => field),
    [props.fields]
  );

  const searchParameters = useMemo(() => {
    // Set include/exclude columns based on includeList
    let columns;
    let columnOperator;
    if (includeList.length <= columnOptions.length - includeList.length) {
      columnOperator = "include";
      columns = includeList;
    } else {
      columnOperator = "exclude";
      columns = columnOptions.filter((field) => !includeList.includes(field));
    }

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
        .concat(columns.map((field) => [columnOperator, field.code]))
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
    // Format filters
    const filters = formatFilters(filterList)
      .map(
        ([filter, value]) =>
          `--field ${filter.replace("__exact", "")}=${
            value.includes(" ") ? `"${value}"` : value
          }`
      )
      .join(" ");

    // Format summarise
    let summarise = "";
    const summariseFields = summariseList.filter((field) => field);
    if (summariseFields.length > 0)
      summarise = `--summarise ${summariseFields.join(",")}`;

    // Assemble the command
    const command = [props.commandBase, filters, summarise].join(" ").trim();

    navigator.clipboard.writeText(command);
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
      <Stack direction="horizontal" className="h-100">
        {!sidebarCollapsed && (
          <>
            <div
              className="h-100"
              style={{
                position: "relative",
                width: sidebarWidth,
                minWidth: sidebarWidth,
                paddingRight: "10px",
              }}
            >
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
                      variant="dark"
                      title="Copy CLI Command"
                      onClick={handleCopyCLICommand}
                      showTitle
                    />
                  </Stack>
                </Stack>
              </Container>
              <Resizer
                defaultWidth={defaultWidth}
                minWidth={220}
                maxWidth={600}
                setWidth={setSidebarWidth}
              />
            </div>
            <div
              style={{
                paddingLeft: "10px",
              }}
            />
          </>
        )}
        <div className="h-100" style={{ flex: 1 }}>
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
