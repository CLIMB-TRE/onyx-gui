import { useState, useMemo, useLayoutEffect, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { useAnalysesQuery } from "../api";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import ResultsPanel from "../components/ResultsPanel";
import { SidebarButton } from "../components/Buttons";
import { FilterConfig } from "../types";
import { DataProps } from "../interfaces";
import { useDebouncedValue } from "../utils/hooks";

function Analysis(props: DataProps) {
  const [searchInput, setSearchInput] = useState("");
  const [filterList, setFilterList] = useState([] as FilterConfig[]);
  const [searchParameters, setSearchParameters] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setSearchInput("");
    setFilterList([]);
    setSearchParameters("");
  }, [props.project]);

  const queryProps = useMemo(
    () => ({
      ...props,
      searchParameters,
    }),
    [props, searchParameters]
  );

  const {
    isFetching: analysesPending,
    error: analysesError,
    data: analysesResponse,
    refetch: refetchAnalyses,
  } = useAnalysesQuery(queryProps);

  const searchParams = useMemo(
    () =>
      new URLSearchParams(
        filterList
          .filter((filter) => filter.field)
          .map((filter) => {
            if (filter.lookup) {
              return [filter.field + "__" + filter.lookup, filter.value];
            } else {
              return [filter.field, filter.value];
            }
          })
          .concat(
            [searchInput]
              .filter((search) => search)
              .map((search) => ["search", search])
          )
      ).toString(),
    [filterList, searchInput]
  );

  const debouncedSearchParams = useDebouncedValue(searchParams, 1000);

  useEffect(
    () => setSearchParameters(debouncedSearchParams),
    [debouncedSearchParams]
  );

  // If search parameters have not changed and nothing is pending
  // Then trigger a refetch
  const handleSearch = () => {
    if (!analysesPending) refetchAnalyses();
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
                  placeholder="Search analyses..."
                  searchInput={searchInput}
                  setSearchInput={setSearchInput}
                  handleSearch={handleSearch}
                />
                <FilterPanel
                  {...props}
                  filterList={filterList}
                  setFilterList={setFilterList}
                  filterFieldOptions={[]}
                />
              </Stack>
            </Container>
          </div>
        )}
        <SidebarButton
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
        <div className="right-col h-100">
          <Container fluid className="g-2 h-100">
            <ResultsPanel
              {...props}
              title="Analyses"
              resultsListPending={analysesPending}
              resultsListError={analysesError as Error}
              resultsListResponse={analysesResponse}
              searchParameters={searchParameters}
              serverPaginated={
                !!analysesResponse?.next || !!analysesResponse?.previous
              }
            />
          </Container>
        </div>
      </div>
    </Container>
  );
}

export default Analysis;
