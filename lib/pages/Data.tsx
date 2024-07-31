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
import Modal from "react-bootstrap/Modal";
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { useQuery } from "@tanstack/react-query";
import { MultiDropdown } from "../components/Dropdowns";
import Filter from "../components/Filter";
import ResultsTable from "../components/ResultsTable";
import { LoadingAlert, DelayedLoadingAlert } from "../components/LoadingAlert";
import ErrorMessages from "../components/ErrorMessages";
import { OnyxProps, ProjectField, ResultType, ErrorType } from "../types";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { NavDropdown } from "react-bootstrap";

type FilterField = {
  field: string;
  lookup: string;
  value: string;
};

interface SearchProps extends DataProps {
  handleSearch: (params: string) => void;
  handlePageNumber: (page: number) => void;
}

function Parameters(props: SearchProps) {
  const defaultFilterList = [
    { field: "", lookup: "", value: "" },
  ] as FilterField[];

  const [filterList, setFilterList] = useState(defaultFilterList);
  const [filterAction, setFilterAction] = useState("Summarise");
  const [filterActionList, setFilterActionList] = useState(new Array<string>());
  const [searchInput, setSearchInput] = useState("");
  const filterFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("filter"))
    .map(([field]) => field);
  const listFieldOptions = Array.from(props.projectFields.entries())
    .filter(([, projectField]) => projectField.actions.includes("list"))
    .map(([field]) => field);

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setFilterList(defaultFilterList);
    setFilterAction("Summarise");
    setFilterActionList([]);
    setSearchInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleFilterActionChange = (action: string) => {
    setFilterAction(action);
    setFilterActionList([]);
  };

  const handleFilterActionListChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFilterActionList(e.target.value ? e.target.value.split(",") : []);
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
          filterActionList
            .filter((field) => field)
            .map((field) => [filterAction.toLowerCase(), field])
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
        <Col md={8}>
          <Card>
            <Card.Header>
              <span>Filter</span>
              <Stack direction="horizontal" gap={1} className="float-end">
                <Button
                  size="sm"
                  variant="dark"
                  onClick={() => handleFilterAdd(filterList.length)}
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
                {filterList.map((filter, index) => (
                  <Filter
                    key={index}
                    project={props.project}
                    httpPathHandler={props.httpPathHandler}
                    filter={filter}
                    fieldList={filterFieldOptions}
                    projectFields={props.projectFields}
                    typeLookups={props.typeLookups}
                    fieldDescriptions={props.fieldDescriptions}
                    lookupDescriptions={props.lookupDescriptions}
                    handleFieldChange={(e) => handleFilterFieldChange(e, index)}
                    handleLookupChange={(e) =>
                      handleFilterLookupChange(e, index)
                    }
                    handleValueChange={(e) => handleFilterValueChange(e, index)}
                    handleFilterAdd={() => handleFilterAdd(index + 1)}
                    handleFilterRemove={() => handleFilterRemove(index)}
                  />
                ))}
              </Stack>
            </Container>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>
              <NavDropdown title={filterAction}>
                {["Summarise", "Include", "Exclude"].map((action) => (
                  <NavDropdown.Item
                    key={action}
                    onClick={() => handleFilterActionChange(action)}
                  >
                    {action}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
            </Card.Header>
            <Container fluid className="onyx-parameters-panel p-2">
              <MultiDropdown
                options={
                  filterAction === "Summarise"
                    ? filterFieldOptions
                    : listFieldOptions
                }
                titles={props.fieldDescriptions}
                value={filterActionList}
                placeholder={`${filterAction} fields...`}
                onChange={handleFilterActionListChange}
              />
            </Container>
          </Card>
        </Col>
      </Row>
    </>
  );
}

type ResultData = {
  next?: string;
  previous?: string;
  data?: ResultType[];
  messages?: ErrorType;
};

interface ResultsProps extends SearchProps {
  recordDetailHandler: (climbID: string) => void;
  resultPending: boolean;
  resultError: Error | null;
  resultData: ResultData;
  pageNumber: number;
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
            recordDetailHandler={props.recordDetailHandler}
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

interface RecordDetailProps extends DataProps {
  recordID: string;
  show: boolean;
  onHide: () => void;
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
    const jsonData = JSON.stringify(recordData);

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

interface DataProps extends OnyxProps {
  project: string;
  projectFields: Map<string, ProjectField>;
  typeLookups: Map<string, string[]>;
  fieldDescriptions: Map<string, string>;
  lookupDescriptions: Map<string, string>;
}

function Data(props: DataProps) {
  const [searchParameters, setSearchParameters] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [recordDetailShow, setRecordDetailShow] = React.useState(false);
  const [recordDetailID, setRecordDetailID] = React.useState("");

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
    cacheTime: 0.5 * 60 * 1000,
  });

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

  const handleRecordDetailShow = (climbID: string) => {
    setRecordDetailID(climbID);
    setRecordDetailShow(true);
  };

  return (
    <Container fluid className="g-2">
      <Stack gap={2}>
        <RecordDetail
          {...props}
          recordID={recordDetailID}
          show={recordDetailShow}
          onHide={() => setRecordDetailShow(false)}
        />
        <Parameters
          {...props}
          handleSearch={handleSearch}
          handlePageNumber={setPageNumber}
        />
        <Results
          {...props}
          handleSearch={setSearchParameters}
          handlePageNumber={setPageNumber}
          recordDetailHandler={handleRecordDetailShow}
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
