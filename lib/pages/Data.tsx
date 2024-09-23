import React, { useState, useLayoutEffect, useCallback } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import TransformsPanel from "../components/TransformsPanel";
import ResultsPanel from "../components/ResultsPanel";
import RecordModal from "../components/RecordModal";
import { FilterField } from "../types";
import { DataProps } from "../interfaces";
import generateKey from "../utils/generateKey";

function Data(props: DataProps) {
  const defaultFilterList = () =>
    [{ key: generateKey(), field: "", lookup: "", value: "" }] as FilterField[];
  const [searchInput, setSearchInput] = useState("");
  const [filterList, setFilterList] = useState(defaultFilterList());
  const [transform, setTransform] = useState("Summarise");
  const [transformList, setTransformList] = useState(new Array<string>());
  const [searchParameters, setSearchParameters] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [recordModalShow, setRecordModalShow] = React.useState(false);
  const [recordModalID, setRecordModalID] = React.useState("");
  const filterFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("filter"))
    .map(([field]) => field);
  const listFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("list"))
    .map(([field]) => field);

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setSearchInput("");
    setFilterList(defaultFilterList());
    setTransform("Summarise");
    setTransformList([]);
    setSearchParameters("");
    setPageNumber(1);
    setRecordModalShow(false);
    setRecordModalID("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSearch = () => {
    const search = new URLSearchParams(
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
    ).toString();

    if (searchParameters === search) {
      if (!resultPending) {
        // If search parameters have not changed and nothing is pending
        // Then trigger a refetch
        refetchResults();
      }
    } else {
      // Otherwise, set the new search parameters
      // This will trigger a new fetch
      setSearchParameters(search);
    }
    setPageNumber(1);
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
    <Container fluid className="g-2">
      <Stack gap={2}>
        <RecordModal
          {...props}
          recordID={recordModalID}
          show={recordModalShow}
          onHide={handleRecordModalHide}
        />
        <SearchBar
          {...props}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleSearch={handleSearch}
        />
        <Row className="g-2">
          <Col md={8}>
            <FilterPanel
              {...props}
              filterList={filterList}
              setFilterList={setFilterList}
              filterFieldOptions={filterFieldOptions}
            />
          </Col>
          <Col md={4}>
            <TransformsPanel
              {...props}
              transform={transform}
              setTransform={setTransform}
              transformList={transformList}
              setTransformList={setTransformList}
              filterFieldOptions={filterFieldOptions}
              listFieldOptions={listFieldOptions}
            />
          </Col>
        </Row>
        <ResultsPanel
          {...props}
          resultPending={resultPending}
          resultError={resultError instanceof Error ? resultError : null}
          resultData={resultData}
          searchParameters={searchParameters}
          setSearchParameters={setSearchParameters}
          pageNumber={pageNumber}
          setPageNumber={setPageNumber}
          handleRecordModalShow={handleRecordModalShow}
        />
      </Stack>
    </Container>
  );
}

export default Data;
