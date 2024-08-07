import React, { useState, useLayoutEffect, useCallback } from "react";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Pagination from "react-bootstrap/Pagination";
import Modal from "react-bootstrap/Modal";
import NavDropdown from "react-bootstrap/NavDropdown";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { useQuery } from "@tanstack/react-query";
import { MultiDropdown } from "../components/Dropdowns";
import Filter from "../components/Filter";
import ResultsTable from "../components/ResultsTable";
import { LoadingAlert, DelayedLoadingAlert } from "../components/LoadingAlert";
import ErrorMessages from "../components/ErrorMessages";
import { ResultType, ErrorType } from "../types";
import { DataProps } from "../interfaces";
import generateKey from "../utils/generateKey";

interface SearchBarProps extends DataProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  handleSearchParameters: () => void;
}

interface FilterPanelProps extends DataProps {
  filterList: FilterField[];
  setFilterList: (value: FilterField[]) => void;
  filterFieldOptions: string[];
}

interface TransformsPanelProps extends DataProps {
  transform: string;
  setTransform: (value: string) => void;
  transformList: string[];
  setTransformList: (value: string[]) => void;
  filterFieldOptions: string[];
  listFieldOptions: string[];
}

interface ResultsPanelProps extends DataProps {
  resultPending: boolean;
  resultError: Error | null;
  resultData: ResultData;
  setSearchParameters: (params: string) => void;
  pageNumber: number;
  setPageNumber: (page: number) => void;
  handleRecordDetailShow: (climbID: string) => void;
}

interface RecordDetailProps extends DataProps {
  recordID: string;
  show: boolean;
  onHide: () => void;
}

type FilterField = {
  key: string;
  field: string;
  lookup: string;
  value: string;
};

type ResultData = {
  next?: string;
  previous?: string;
  data?: ResultType[];
  messages?: ErrorType;
};

function SearchBar(props: SearchBarProps) {
  return (
    <Stack direction="horizontal" gap={2}>
      <Form.Control
        value={props.searchInput}
        placeholder="Search records..."
        onChange={(e) => props.setSearchInput(e.target.value)}
        onKeyUp={(event) => {
          if (event.key === "Enter") {
            props.handleSearchParameters();
          }
        }}
      />
      <Button
        variant="primary"
        disabled={!props.project}
        onClick={props.handleSearchParameters}
      >
        Search
      </Button>
    </Stack>
  );
}

function FilterPanel(props: FilterPanelProps) {
  const handleFilterFieldChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...props.filterList];
    const field = props.projectFields.get(e.target.value);
    list[index].field = e.target.value;
    list[index].lookup = props.typeLookups.get(field?.type || "")?.[0] || "";

    if (list[index].lookup === "isnull") {
      list[index].value = "true";
    } else {
      list[index].value = "";
    }
    props.setFilterList(list);
  };

  const handleFilterLookupChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...props.filterList];
    list[index].lookup = e.target.value;

    if (list[index].lookup === "isnull") {
      list[index].value = "true";
    } else {
      list[index].value = "";
    }
    props.setFilterList(list);
  };

  const handleFilterValueChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index: number
  ) => {
    const list = [...props.filterList];
    list[index].value = e.target.value;
    props.setFilterList(list);
  };

  const handleFilterAdd = (index: number) => {
    props.setFilterList([
      ...props.filterList.slice(0, index),
      {
        key: generateKey(),
        field: "",
        lookup: "",
        value: "",
      },
      ...props.filterList.slice(index),
    ]);
  };

  const handleFilterRemove = (index: number) => {
    const list = [...props.filterList];
    list.splice(index, 1);
    props.setFilterList(list);
  };

  const handleFilterClear = () => {
    props.setFilterList([]);
  };

  return (
    <Card>
      <Card.Header>
        <span>Filter</span>
        <Stack direction="horizontal" gap={1} className="float-end">
          <Button
            size="sm"
            variant="dark"
            onClick={() => handleFilterAdd(props.filterList.length)}
          >
            Add Filter
          </Button>
          <Button size="sm" variant="dark" onClick={handleFilterClear}>
            Clear Filters
          </Button>
        </Stack>
      </Card.Header>
      <Container fluid className="onyx-parameters-panel p-2">
        <Stack gap={1}>
          {props.filterList.map((filter, index) => (
            <Filter
              {...props}
              key={filter.key}
              filter={filter}
              fieldList={props.filterFieldOptions}
              handleFieldChange={(e) => handleFilterFieldChange(e, index)}
              handleLookupChange={(e) => handleFilterLookupChange(e, index)}
              handleValueChange={(e) => handleFilterValueChange(e, index)}
              handleFilterAdd={() => handleFilterAdd(index + 1)}
              handleFilterRemove={() => handleFilterRemove(index)}
            />
          ))}
        </Stack>
      </Container>
    </Card>
  );
}

function TransformsPanel(props: TransformsPanelProps) {
  const handleTransformChange = (action: string) => {
    props.setTransform(action);
    props.setTransformList([]);
  };

  const handleTransformListChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    props.setTransformList(e.target.value ? e.target.value.split(",") : []);
  };

  return (
    <Card>
      <Card.Header>
        <NavDropdown title={props.transform}>
          {["Summarise", "Include", "Exclude"].map((action) => (
            <NavDropdown.Item
              key={action}
              onClick={() => handleTransformChange(action)}
            >
              {action}
            </NavDropdown.Item>
          ))}
        </NavDropdown>
      </Card.Header>
      <Container fluid className="onyx-parameters-panel p-2">
        <MultiDropdown
          options={
            props.transform === "Summarise"
              ? props.filterFieldOptions
              : props.listFieldOptions
          }
          titles={props.fieldDescriptions}
          value={props.transformList}
          placeholder={`${props.transform} fields...`}
          onChange={handleTransformListChange}
        />
      </Container>
    </Card>
  );
}

function ResultsPanel(props: ResultsPanelProps) {
  const fileName = `${props.project}${
    props.pageNumber > 1 ? "_" + props.pageNumber.toString() : ""
  }`;

  const csvConfig = mkConfig({
    filename: fileName,
    useKeysAsHeaders: true,
  });

  const handleExportToCSV = () => {
    const csvData = asString(
      generateCsv(csvConfig)(props.resultData.data || [])
    );

    if (props.fileWriter) {
      props.fileWriter(fileName + ".csv", csvData);
    }
  };

  return (
    <Card>
      <Card.Header>
        <span>Results</span>
        <Button
          className="float-end"
          size="sm"
          disabled={!props.fileWriter}
          variant="success"
          onClick={handleExportToCSV}
        >
          Export Page to CSV
        </Button>
      </Card.Header>
      <Container fluid className="onyx-results-panel p-2">
        {props.resultPending ? (
          <LoadingAlert />
        ) : props.resultError ? (
          <Alert variant="danger">Error: {props.resultError.message}</Alert>
        ) : props.resultData.messages ? (
          <ErrorMessages messages={props.resultData.messages} />
        ) : (
          <ResultsTable
            data={props.resultData.data || []}
            titles={props.fieldDescriptions}
            handleRecordDetailShow={props.handleRecordDetailShow}
            s3PathHandler={props.s3PathHandler}
            isSortable={!props.resultData?.next && !props.resultData?.previous}
          />
        )}
      </Container>
      <Card.Footer>
        <Pagination size="sm">
          <Pagination.Prev
            disabled={!props.resultData.previous}
            onClick={() => {
              props.setSearchParameters(
                props.resultData.previous?.split("?", 2)[1] || ""
              );
              props.setPageNumber(props.pageNumber - 1);
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
              props.setSearchParameters(
                props.resultData?.next?.split("?", 2)[1] || ""
              );
              props.setPageNumber(props.pageNumber + 1);
            }}
          />
        </Pagination>
      </Card.Footer>
    </Card>
  );
}

function RecordDetail(props: RecordDetailProps) {
  // Fetch record, depending on project and record ID
  const {
    isFetching: recordPending,
    error: recordError,
    data: recordData = {},
  } = useQuery({
    queryKey: ["results", props.project, props.recordID],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/${props.recordID}/`)
        .then((response) => response.json());
    },
    enabled: !!(props.project && props.recordID),
    staleTime: 1 * 60 * 1000,
  });

  const handleExportToJSON = () => {
    const jsonData = JSON.stringify(recordData.data || {});

    if (props.fileWriter) {
      props.fileWriter(props.recordID + ".json", jsonData);
    }
  };

  return (
    <Modal
      className="onyx-record-detail"
      show={props.show}
      onHide={props.onHide}
      dialogClassName="modal-xl"
      aria-labelledby="contained-modal-title-vcenter"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          <Container fluid>
            CLIMB ID: <span className="onyx-text-pink">{props.recordID}</span>
          </Container>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {recordPending ? (
          <DelayedLoadingAlert />
        ) : recordError ? (
          <Alert variant="danger">
            Error: {(recordError as Error).message}
          </Alert>
        ) : recordData.messages ? (
          <ErrorMessages messages={recordData.messages} />
        ) : (
          recordData.data && (
            <Container fluid>
              <Stack gap={2} direction="vertical">
                <h5>
                  Published Date:{" "}
                  <span className="onyx-text-pink">
                    {recordData.data["published_date"]}
                  </span>
                  <Button
                    className="float-end"
                    size="sm"
                    disabled={!props.fileWriter}
                    variant="success"
                    onClick={handleExportToJSON}
                  >
                    Export Record to JSON
                  </Button>
                </h5>

                <h5>
                  Site:{" "}
                  <span className="onyx-text-pink">
                    {recordData.data["site"]}
                  </span>
                </h5>
              </Stack>
              <hr />
              <Tabs
                defaultActiveKey="recordDetails"
                id="uncontrolled-tab-example"
                className="mb-3"
              >
                <Tab eventKey="recordDetails" title="Details">
                  <ResultsTable
                    data={
                      Object.entries(recordData.data)
                        .filter(([, value]) => {
                          return !(value instanceof Array);
                        })
                        .map(([key, value]) => ({
                          Field: key,
                          Value: value,
                        })) as ResultType[]
                    }
                    s3PathHandler={props.s3PathHandler}
                  />
                </Tab>
                {Object.entries(recordData.data)
                  .filter(([, value]) => value instanceof Array)
                  .sort()
                  .map(([key, value], index) => (
                    <Tab key={key} eventKey={index} title={key}>
                      <ResultsTable
                        data={value as ResultType[]}
                        s3PathHandler={props.s3PathHandler}
                      />
                    </Tab>
                  ))}
              </Tabs>
            </Container>
          )
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={props.onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function Data(props: DataProps) {
  const defaultFilterList = () =>
    [{ key: generateKey(), field: "", lookup: "", value: "" }] as FilterField[];
  const [searchInput, setSearchInput] = useState("");
  const [filterList, setFilterList] = useState(defaultFilterList());
  const [transform, setTransform] = useState("Summarise");
  const [transformList, setTransformList] = useState(new Array<string>());
  const [searchParameters, setSearchParameters] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [recordDetailShow, setRecordDetailShow] = React.useState(false);
  const [recordDetailID, setRecordDetailID] = React.useState("");
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
    setRecordDetailShow(false);
    setRecordDetailID("");
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

  const handleSearchParameters = () => {
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
          transformList
            .filter((field) => field)
            .map((field) => [transform.toLowerCase(), field])
        )
        .concat(
          [searchInput]
            .filter((search) => search)
            .map((search) => ["search", search])
        )
    );
    handleSearch(params.toString());
    setPageNumber(1);
  };

  const handleSearch = (search: string) => {
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
  };

  // https://react.dev/reference/react/useCallback#skipping-re-rendering-of-components
  // Usage of useCallback here prevents excessive re-rendering of the ResultsPanel
  // This noticeably improves responsiveness for large datasets
  const handleRecordDetailShow = useCallback((climbID: string) => {
    setRecordDetailID(climbID);
    setRecordDetailShow(true);
  }, []);

  return (
    <Container fluid className="g-2">
      <Stack gap={2}>
        <RecordDetail
          {...props}
          recordID={recordDetailID}
          show={recordDetailShow}
          onHide={() => setRecordDetailShow(false)}
        />
        <SearchBar
          {...props}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleSearchParameters={handleSearchParameters}
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
          setSearchParameters={setSearchParameters}
          pageNumber={pageNumber}
          setPageNumber={setPageNumber}
          handleRecordDetailShow={handleRecordDetailShow}
        />
      </Stack>
    </Container>
  );
}

export default Data;
