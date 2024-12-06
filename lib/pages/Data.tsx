import { useState, useMemo, useLayoutEffect, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import TransformsPanel from "../components/TransformsPanel";
import ResultsPanel from "../components/ResultsPanel";
import { SidebarButton } from "../components/Buttons";
import { FilterConfig } from "../types";
import { DataProps } from "../interfaces";
import { useDebouncedValue } from "../utils/hooks";

function Data(props: DataProps) {
  const [searchInput, setSearchInput] = useState("");
  const [filterList, setFilterList] = useState([] as FilterConfig[]);
  const [transform, setTransform] = useState("Summarise");
  const [transformList, setTransformList] = useState(new Array<string>());
  const [searchParameters, setSearchParameters] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const filterFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("filter"))
    .map(([field]) => field);
  const listFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("list"))
    .map(([field]) => field);

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setSearchInput("");
    setFilterList([]);
    setTransform("Summarise");
    setTransformList([]);
    setSearchParameters("");
  }, [props.project]);

  // Fetch data, depending on project and search parameters
  const {
    isFetching: recordListPending,
    error: recordListError,
    data: recordListResponse,
    refetch: refetchRecordList,
  } = useQuery({
    queryKey: ["record-list", props.project, searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/?${searchParameters}`)
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
    [debouncedSearchParams]
  );

  // If search parameters have not changed and nothing is pending
  // Then trigger a refetch
  const handleSearch = () => {
    if (!recordListPending) refetchRecordList();
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
                  placeholder="Search records..."
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
        <SidebarButton
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
        <div className="right-col h-100">
          <Container fluid className="g-2 h-100">
            <ResultsPanel
              {...props}
              title="Data"
              resultsListPending={recordListPending}
              resultsListError={recordListError as Error}
              resultsListResponse={recordListResponse}
              searchParameters={searchParameters}
              serverPaginated={
                !!recordListResponse.next ||
                !!recordListResponse.previous ||
                !searchParameters.includes("summarise=")
              }
            />
          </Container>
        </div>
      </div>
    </Container>
  );
}

export default Data;
