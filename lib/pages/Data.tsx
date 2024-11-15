import React, {
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
  useEffect,
} from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import TransformsPanel from "../components/TransformsPanel";
import ResultsPanel from "../components/ResultsPanel";
import RecordModal from "../components/RecordModal";
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

function Data(props: DataProps) {
  const [searchInput, setSearchInput] = useState("");
  const [filterList, setFilterList] = useState([] as FilterField[]);
  const [transform, setTransform] = useState("Summarise");
  const [transformList, setTransformList] = useState(new Array<string>());
  const [searchParameters, setSearchParameters] = useState("");
  const [recordModalShow, setRecordModalShow] = React.useState(false);
  const [recordModalID, setRecordModalID] = React.useState("");
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);
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
    setRecordModalShow(false);
    setRecordModalID("");
  }, [props.project]);

  // Fetch data, depending on project and search parameters
  const {
    isFetching: resultPending,
    error: resultError,
    data: resultData = {},
    refetch: refetchResults,
  } = useQuery({
    queryKey: ["results", props.project, searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/?${searchParameters}`)
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
    if (!resultPending) refetchResults();
  };

  // https://react.dev/reference/react/useCallback#skipping-re-rendering-of-components
  // Usage of useCallback here prevents excessive re-rendering of the ResultsPanel
  // This noticeably improves responsiveness for large datasets
  const handleRecordModalShow = useCallback((climbID: string) => {
    setRecordModalID(climbID);
    setRecordModalShow(true);
  }, []);

  const handleRecordModalHide = () => {
    setRecordModalID("");
    setRecordModalShow(false);
  };

  return (
    <Container fluid className="g-2 h-100">
      <RecordModal
        {...props}
        recordID={recordModalID}
        show={recordModalShow}
        onHide={handleRecordModalHide}
      />
      <div className="parent h-100">
        {!sideBarCollapsed && (
          <div className="left-col h-100">
            <Container fluid className="g-2 h-100">
              <Stack gap={2} className="h-100 pt-1">
                <SearchBar
                  {...props}
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
            <ResultsPanel
              {...props}
              resultPending={resultPending}
              resultError={resultError instanceof Error ? resultError : null}
              resultData={resultData}
              searchParameters={searchParameters}
              handleRecordModalShow={handleRecordModalShow}
            />
          </Container>
        </div>
      </div>
    </Container>
  );
}

export default Data;
