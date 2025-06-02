import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { useResultsQuery } from "../api";
import FilterPanel from "../components/FilterPanel";
import ResultsPanel from "../components/ResultsPanel";
import SearchBar from "../components/SearchBar";
import SummarisePanel from "../components/SummarisePanel";
import { ResultsProps } from "../interfaces";
import { FilterConfig, ProjectField } from "../types";
import { formatFilters } from "../utils/functions";
import { useDebouncedValue } from "../utils/hooks";
import ColumnsModal from "../components/ColumnsModal";

function Results(props: ResultsProps) {
  const [searchParameters, setSearchParameters] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterList, setFilterList] = useState([] as FilterConfig[]);
  const [summariseList, setSummariseList] = useState(new Array<string>());
  const [columnList, setColumnList] = useState<ProjectField[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [columnsModalShow, setColumnsModalShow] = useState(false);

  const filterOptions = useMemo(
    () =>
      Array.from(props.projectFields.entries())
        .filter(([, projectField]) => projectField.actions.includes("filter"))
        .map(([field]) => field),
    [props.projectFields]
  );

  const columnOptions = useMemo(
    () =>
      Array.from(props.projectFields.entries())
        .filter(([, projectField]) => projectField.actions.includes("list"))
        .map(([, projectField]) => projectField),
    [props.projectFields]
  );

  // Pagination page size
  const pageSize = 100;

  const paginatedQueryProps = useMemo(
    () => ({
      ...props,
      searchParameters,
      pageSize,
    }),
    [props, searchParameters]
  );

  const { isFetching, error, data, refetch } =
    useResultsQuery(paginatedQueryProps);

  const searchParams = useMemo(() => {
    let columns;
    let columnOperator;
    if (columnList.length <= columnOptions.length - columnList.length) {
      columns = columnList;
      columnOperator = "include";
    } else {
      columns = columnOptions.filter((field) => !columnList.includes(field));
      columnOperator = "exclude";
    }

    return new URLSearchParams(
      formatFilters(filterList)
        .concat(
          summariseList
            .filter((field) => field)
            .map((field) => ["summarise", field])
        )
        .concat(columns.map((field) => [columnOperator, field.code]))
        .concat(
          [searchInput]
            .map((search) => search.trim())
            .filter((search) => search)
            .map((search) => ["search", search])
        )
    ).toString();
  }, [filterList, summariseList, columnList, searchInput, columnOptions]);

  const debouncedSearchParams = useDebouncedValue(searchParams, 500);

  useEffect(
    () => setSearchParameters(debouncedSearchParams),
    [debouncedSearchParams, setSearchParameters]
  );

  // If search parameters have not changed and nothing is pending
  // Then trigger a refetch
  const handleSearch = () => {
    if (!isFetching) refetch();
  };

  return (
    <Container fluid className="g-0 h-100">
      <ColumnsModal
        {...props}
        show={columnsModalShow}
        onHide={() => setColumnsModalShow(false)}
        columns={columnOptions}
        activeColumns={columnList}
        setActiveColumns={setColumnList}
      />
      <Stack gap={2} direction="horizontal" className="h-100 parent">
        {!sidebarCollapsed && (
          <div className="h-100 left-col">
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
                </Stack>
              </Stack>
            </Container>
          </div>
        )}
        <div className="h-100 right-col">
          <Container fluid className="h-100 g-0">
            <ResultsPanel
              {...props}
              searchParameters={searchParameters}
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
