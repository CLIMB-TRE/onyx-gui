import { useState, useMemo, useLayoutEffect, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { useQuery } from "@tanstack/react-query";
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

  // Fetch analyses, depending on project and search parameters
  const {
    isFetching: analysisListPending,
    error: analysisListError,
    data: analysisListResponse,
    refetch: refetchAnalysisList,
  } = useQuery({
    queryKey: ["analysis-list", props.project, searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/analysis/?${searchParameters}`
        )
        .then((response) => response.json());
    },
    enabled: !!props.project,
    cacheTime: 0.5 * 60 * 1000,
    placeholderData: { data: [] },
  });

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
    if (!analysisListPending) refetchAnalysisList();
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
              resultsListPending={analysisListPending}
              resultsListError={analysisListError as Error}
              resultsListResponse={analysisListResponse}
              searchParameters={searchParameters}
              serverPaginated={
                !!analysisListResponse.next || !!analysisListResponse.previous
              }
            />
          </Container>
        </div>
      </div>
    </Container>
  );
}

export default Analysis;
