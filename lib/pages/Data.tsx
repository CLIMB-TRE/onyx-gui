import React, { useState, useLayoutEffect } from "react";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Pagination from "react-bootstrap/Pagination";
import { mkConfig, generateCsv, download, asString } from "export-to-csv";
import { useQuery } from "@tanstack/react-query";
import { MultiDropdown } from "../components/Dropdowns";
import Filter from "../components/Filter";
import ResultsTable from "../components/ResultsTable";
import LoadingAlert from "../components/LoadingAlert";
import { OnyxProps, ProjectField } from "../types";

type FilterField = {
  field: string;
  lookup: string;
  value: string;
};

type ResultData = {
  next?: string;
  previous?: string;
  data?: Record<string, string | number | boolean | null>[];
  messages?: Record<string, string | string[]>;
};

interface DataProps extends OnyxProps {
  project: string;
  projectFields: Map<string, ProjectField>;
  typeLookups: Map<string, string[]>;
  fieldDescriptions: Map<string, string>;
  lookupDescriptions: Map<string, string>;
  darkMode: boolean;
}

interface SearchProps extends DataProps {
  handleSearch: (params: string) => void;
  handlePageNumber: (page: number) => void;
}

interface ResultsProps extends SearchProps {
  resultPending: boolean;
  resultError: Error | null;
  resultData: ResultData;
  pageNumber: number;
}

function Parameters(props: SearchProps) {
  const [filterList, setFilterList] = useState(new Array<FilterField>());
  const [summariseList, setSummariseList] = useState(new Array<string>());
  const [includeList, setIncludeList] = useState(new Array<string>());
  const [excludeList, setExcludeList] = useState(new Array<string>());
  const [searchInput, setSearchInput] = useState("");
  const filterFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, field]) => field.actions.includes("filter"))
    .map(([field]) => field);
  const listFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, field]) => field.actions.includes("list"))
    .map(([field]) => field);

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setFilterList([]);
    setSummariseList([]);
    setIncludeList([]);
    setExcludeList([]);
    setSearchInput("");
  }, [props.project]);

  const handleFilterFieldChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...filterList];
    const field = props.projectFields.get(e.target.value);
    list[index].field = e.target.value;
    list[index].lookup = props.typeLookups.get(field?.type || "")?.[0] || "";

    if (list[index].lookup === "isnull") {
      list[index].value = "true";
    } else {
      list[index].value = "";
    }
    setFilterList(list);
  };

  const handleFilterLookupChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...filterList];
    list[index].lookup = e.target.value;

    if (list[index].lookup === "isnull") {
      list[index].value = "true";
    } else {
      list[index].value = "";
    }
    setFilterList(list);
  };

  const handleFilterValueChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index: number
  ) => {
    const list = [...filterList];
    list[index].value = e.target.value;
    setFilterList(list);
  };

  const handleFilterAdd = (index: number) => {
    setFilterList([
      ...filterList.slice(0, index),
      { field: "", lookup: "", value: "" },
      ...filterList.slice(index),
    ]);
  };

  const handleFilterRemove = (index: number) => {
    const list = [...filterList];
    list.splice(index, 1);
    setFilterList(list);
  };

  const handleFilterClear = () => {
    setFilterList([]);
  };

  const handleSummariseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSummariseList(e.target.value ? e.target.value.split(",") : []);
    setIncludeList([]);
    setExcludeList([]);
  };

  const handleIncludeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSummariseList([]);
    setIncludeList(e.target.value ? e.target.value.split(",") : []);
  };

  const handleExcludeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSummariseList([]);
    setExcludeList(e.target.value ? e.target.value.split(",") : []);
  };

  const handleParameters = () => {
    const params = new URLSearchParams(
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
          includeList
            .filter((include) => include)
            .map((field) => ["include", field])
        )
        .concat(
          excludeList
            .filter((exclude) => exclude)
            .map((field) => ["exclude", field])
        )
        .concat(
          summariseList
            .filter((summarise) => summarise)
            .map((field) => ["summarise", field])
        )
        .concat(
          [searchInput]
            .filter((search) => search)
            .map((search) => ["search", search])
        )
    );
    props.handleSearch(params.toString());
    props.handlePageNumber(1);
  };

  return (
    <>
      <Stack direction="horizontal" gap={2}>
        <Form.Control
          value={searchInput}
          placeholder="Search records..."
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyUp={(event) => {
            if (event.key === "Enter") {
              handleParameters();
            }
          }}
        />
        <Button
          variant="primary"
          disabled={!props.project}
          onClick={handleParameters}
        >
          Search
        </Button>
      </Stack>
      <Row className="g-2">
        <Col xl={6}>
          <Card>
            <Card.Header>
              <span>Filter</span>
              <Stack direction="horizontal" gap={1} className="float-end">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleFilterAdd(filterList.length)}
                >
                  Add Filter
                </Button>
                <Button size="sm" variant="danger" onClick={handleFilterClear}>
                  Clear Filters
                </Button>
              </Stack>
            </Card.Header>
            <Container fluid className="panel p-2">
              <Stack gap={1}>
                {filterList.map((filter, index) => (
                  <div key={index}>
                    <Filter
                      project={props.project}
                      httpPathHandler={props.httpPathHandler}
                      filter={filter}
                      fieldList={filterFieldOptions}
                      projectFields={props.projectFields}
                      typeLookups={props.typeLookups}
                      fieldDescriptions={props.fieldDescriptions}
                      lookupDescriptions={props.lookupDescriptions}
                      handleFieldChange={(e) =>
                        handleFilterFieldChange(e, index)
                      }
                      handleLookupChange={(e) =>
                        handleFilterLookupChange(e, index)
                      }
                      handleValueChange={(e) =>
                        handleFilterValueChange(e, index)
                      }
                      handleFilterAdd={() => handleFilterAdd(index + 1)}
                      handleFilterRemove={() => handleFilterRemove(index)}
                      darkMode={props.darkMode}
                    />
                  </div>
                ))}
              </Stack>
            </Container>
          </Card>
        </Col>
        {[
          {
            title: "Summarise",
            options: filterFieldOptions,
            value: summariseList,
            onChange: handleSummariseChange,
          },
          {
            title: "Include",
            options: listFieldOptions,
            value: includeList,
            onChange: handleIncludeChange,
          },
          {
            title: "Exclude",
            options: listFieldOptions,
            value: excludeList,
            onChange: handleExcludeChange,
          },
        ].map(({ title, options, value, onChange }) => (
          <Col key={title} md={4} xl={2}>
            <Card>
              <Card.Header>{title}</Card.Header>
              <Container fluid className="panel p-2">
                <MultiDropdown
                  options={options}
                  titles={props.fieldDescriptions}
                  value={value}
                  placeholder="Select fields..."
                  onChange={onChange}
                  darkMode={props.darkMode}
                />
              </Container>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}

function Results(props: ResultsProps) {
  const fileName = `${props.project}${
    props.pageNumber > 1 ? "_" + props.pageNumber.toString() : ""
  }`;

  const csvConfig = mkConfig({
    filename: fileName,
    useKeysAsHeaders: true,
  });

  const handleExportToCSV = () => {
    const csv = generateCsv(csvConfig)(props.resultData.data || []);

    if (props.fileWriter) {
      props.fileWriter(fileName + ".csv", asString(csv));
    } else {
      download(csvConfig)(csv);
    }
  };

  return (
    <Card>
      <Card.Header>
        <span>Results</span>
        <Button
          className="float-end"
          size="sm"
          variant="success"
          onClick={handleExportToCSV}
        >
          Export Page to CSV
        </Button>
      </Card.Header>
      <Container fluid className="table-panel p-2">
        {props.resultPending ? (
          <LoadingAlert />
        ) : props.resultError ? (
          <Alert variant="danger">Error: {props.resultError.message}</Alert>
        ) : props.resultData.messages ? (
          Object.entries(props.resultData.messages).map(([key, value]) =>
            Array.isArray(value) ? (
              value.map((v: string) => (
                <Alert key={key} variant="danger">
                  {key}: {v}
                </Alert>
              ))
            ) : (
              <Alert key={key} variant="danger">
                {key}: {value}
              </Alert>
            )
          )
        ) : (
          <ResultsTable
            data={props.resultData.data || []}
            titles={props.fieldDescriptions}
            s3PathHandler={props.s3PathHandler}
          />
        )}
      </Container>
      <Card.Footer>
        <Pagination size="sm">
          <Pagination.Prev
            disabled={!props.resultData.previous}
            onClick={() => {
              props.handleSearch(
                props.resultData.previous?.split("?", 2)[1] || ""
              );
              props.handlePageNumber(props.pageNumber - 1);
            }}
          />
          <Pagination.Item>
            {props.resultPending
              ? "Loading..."
              : `Showing ${props.resultData.data?.length || 0} results (Page ${
                  props.pageNumber
                })`}
          </Pagination.Item>
          <Pagination.Next
            disabled={!props.resultData.next}
            onClick={() => {
              props.handleSearch(
                props.resultData?.next?.split("?", 2)[1] || ""
              );
              props.handlePageNumber(props.pageNumber + 1);
            }}
          />
        </Pagination>
      </Card.Footer>
    </Card>
  );
}

function Data(props: DataProps) {
  const [searchParameters, setSearchParameters] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setSearchParameters("");
    setPageNumber(1);
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
  });

  const handleSearch = (search: string) => {
    // If search parameters have not changed, a refetch can be triggered
    // But only if the previous fetch has completed
    if (searchParameters === search && !resultPending) {
      refetchResults();
    }
    // Otherwise, set the new search parameters
    // This will trigger a new fetch
    setSearchParameters(search);
  };

  return (
    <Container fluid className="g-2">
      <Stack gap={2}>
        <Parameters
          {...props}
          handleSearch={handleSearch}
          handlePageNumber={setPageNumber}
        />
        <Results
          {...props}
          handleSearch={setSearchParameters}
          handlePageNumber={setPageNumber}
          resultPending={resultPending}
          resultError={resultError instanceof Error ? resultError : null}
          resultData={resultData}
          pageNumber={pageNumber}
        />
      </Stack>
    </Container>
  );
}

export default Data;
