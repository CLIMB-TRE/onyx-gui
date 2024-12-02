import { useState, useMemo, useLayoutEffect, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import AnalysesPanel from "../components/AnalysesPanel";
import { FilterField } from "../types";
import { DataProps } from "../interfaces";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";

const useDebouncedValue = (inputValue: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(inputValue);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, delay]);
  return debouncedValue;
};

function Analysis(props: DataProps) {
  const [searchInput, setSearchInput] = useState("");
  const [filterList, setFilterList] = useState([] as FilterField[]);
  const [searchParameters, setSearchParameters] = useState("");
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setSearchInput("");
    setFilterList([]);
    setSearchParameters("");
  }, [props.project]);

  // Fetch data, depending on project and search parameters
  const {
    isFetching: resultPending,
    error: resultError,
    data: resultData = {},
    refetch: refetchResults,
  } = useQuery({
    queryKey: ["analysis", props.project, searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(
          `projects/${props.project}/analysis/?${searchParameters}`
        )
        .then((response) => response.json());
    },
    enabled: !!props.project,
    cacheTime: 0.5 * 60 * 1000,
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
    if (!resultPending) refetchResults();
  };

  return (
    <Container fluid className="g-2 h-100">
      <div className="parent h-100">
        {!sideBarCollapsed && (
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
        <Button
          size="sm"
          variant="dark"
          title={sideBarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          onClick={() => setSideBarCollapsed(!sideBarCollapsed)}
        >
          {sideBarCollapsed ? (
            <MdKeyboardDoubleArrowRight />
          ) : (
            <MdKeyboardDoubleArrowLeft />
          )}
        </Button>
        <div className="right-col h-100">
          <Container fluid className="g-2 h-100">
            <AnalysesPanel
              {...props}
              resultPending={resultPending}
              resultError={resultError instanceof Error ? resultError : null}
              resultData={resultData}
              searchParameters={searchParameters}
            />
          </Container>
        </div>
      </div>
    </Container>
  );
}

export default Analysis;
