import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { useResultsQuery } from "../api";
import FilterPanel from "../components/FilterPanel";
import ResultsPanel from "../components/ResultsPanel";
import SearchBar from "../components/SearchBar";
import TransformsPanel from "../components/TransformsPanel";
import { ResultsProps } from "../interfaces";
import { FilterConfig } from "../types";
import { formatFilters } from "../utils/functions";
import { useDebouncedValue } from "../utils/hooks";

function Results(props: ResultsProps) {
  const [searchParameters, setSearchParameters] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterList, setFilterList] = useState([] as FilterConfig[]);
  const [transform, setTransform] = useState("Summarise");
  const [transformList, setTransformList] = useState(new Array<string>());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const filterFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("filter"))
    .map(([field]) => field);
  const listFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("list"))
    .map(([field]) => field);

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

  const searchParams = useMemo(
    () =>
      new URLSearchParams(
        formatFilters(filterList)
          .concat(
            transformList
              .filter((field) => field)
              .map((field) => [transform.toLowerCase(), field])
          )
          .concat(
            [searchInput]
              .map((search) => search.trim())
              .filter((search) => search)
              .map((search) => ["search", search])
          )
      ).toString(),
    [filterList, transform, transformList, searchInput]
  );

  const debouncedSearchParams = useDebouncedValue(searchParams, 1000);

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
                    filterFieldOptions={filterFieldOptions}
                  />
                  <TransformsPanel
                    {...props}
                    transform={transform}
                    setTransform={setTransform}
                    transformList={transformList}
                    setTransformList={setTransformList}
                    filterFieldOptions={filterFieldOptions}
                    listFieldOptions={listFieldOptions}
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
              error={error as Error}
              data={data}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
            />
          </Container>
        </div>
      </Stack>
    </Container>
  );
}

export default Results;
