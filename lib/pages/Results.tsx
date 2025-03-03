import { useState, useMemo, useLayoutEffect, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import TransformsPanel from "../components/TransformsPanel";
import ResultsPanel from "../components/ResultsPanel";
import { FilterConfig } from "../types";
import { ResultsProps } from "../interfaces";
import { useDebouncedValue } from "../utils/hooks";
import { formatFilters } from "../utils/functions";
import { useResultsQuery } from "../api";

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

  const queryProps = useMemo(
    () => ({
      ...props,
      searchParameters,
    }),
    [props, searchParameters]
  );

  const { isFetching, error, data, refetch } = useResultsQuery(queryProps);

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setSearchInput("");
    setFilterList([]);
    setTransform("Summarise");
    setTransformList([]);
    setSearchParameters("");
  }, [props.project]);

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
    <Container fluid className="g-2 h-100">
      <div className="parent h-100">
        {!sidebarCollapsed && (
          <div className="left-col h-100">
            <Container fluid className="g-2 h-100">
              <Stack gap={2} className="h-100 pt-1">
                <SearchBar
                  {...props}
                  placeholder={`Search ${props.title.toLowerCase()}...`}
                  searchInput={searchInput}
                  setSearchInput={setSearchInput}
                  handleSearch={handleSearch}
                />
                <Stack gap={2} className="h-100 overflow-y-hidden">
                  <div className="h-50">
                    <FilterPanel
                      {...props}
                      filterList={filterList}
                      setFilterList={setFilterList}
                      filterFieldOptions={filterFieldOptions}
                    />
                  </div>
                  <div className="h-50">
                    <TransformsPanel
                      {...props}
                      transform={transform}
                      setTransform={setTransform}
                      transformList={transformList}
                      setTransformList={setTransformList}
                      filterFieldOptions={filterFieldOptions}
                      listFieldOptions={listFieldOptions}
                    />
                  </div>
                </Stack>
              </Stack>
            </Container>
          </div>
        )}
        <div className="right-col h-100">
          <Container fluid className="g-2 h-100">
            <ResultsPanel
              {...props}
              searchParameters={searchParameters}
              isFetching={isFetching}
              error={error as Error}
              data={data}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
            />
          </Container>
        </div>
      </div>
    </Container>
  );
}

export default Results;
