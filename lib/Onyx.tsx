import React, { useState, useLayoutEffect, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Pagination from "react-bootstrap/Pagination";
import Tab from "react-bootstrap/Tab";
import { mkConfig, generateCsv, download, asString } from "export-to-csv";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import Plot from "react-plotly.js";
import Header from "./components/Header";
import { MultiDropdown } from "./components/Dropdowns";
import Filter from "./components/Filter";
import ResultsTable from "./components/ResultsTable";
import LoadingAlert from "./components/LoadingAlert";
import template from "./template";

import "./Onyx.css";
import "./bootstrap.css";

const VERSION = "0.10.3";

type ProjectField = {
  type: string;
  description: string;
  actions: string[];
  values?: string[];
  fields?: Record<string, ProjectField>;
};

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

interface OnyxProps {
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler?: (path: string) => void;
  fileWriter?: (path: string, content: string) => void;
  extVersion?: string;
}

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

interface StatsProps extends OnyxProps {
  project: string;
  darkMode: boolean;
}

interface GraphProps extends StatsProps {
  field: string;
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

function ScatterGraph(props: GraphProps) {
  const {
    data: { field_data = [], count_data = [] } = {
      field_data: [],
      count_data: [],
    },
  } = useQuery({
    queryKey: ["results", props.project, props.field],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/?summarise=${props.field}`)
        .then((response) => response.json())
        .then((data) => {
          const field_data = data.data.map(
            (record: Record<string, unknown>) => record[props.field]
          );
          const count_data = data.data.map(
            (record: Record<string, unknown>) => record.count
          );
          return { field_data, count_data };
        });
    },
    enabled: !!props.project,
  });

  return (
    <Plot
      data={[
        {
          x: field_data,
          y: count_data,
          type: "scatter",
          mode: "lines+markers",
          marker: { color: "#198754" },
        },
      ]}
      layout={{
        autosize: true,
        title: `Records by ${props.field}`,
        margin: {
          l: 50,
          r: 50,
          b: 50,
          t: 50,
          pad: 4,
        },
        // width: 1080,
        // height: 500,
        // @ts-expect-error Typing this would be madness
        template: props.darkMode ? template : undefined,
      }}
      useResizeHandler={true}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function PieGraph(props: GraphProps) {
  const {
    data: { field_data = [], count_data = [] } = {
      field_data: [],
      count_data: [],
    },
  } = useQuery({
    queryKey: ["results", props.project, props.field],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/?summarise=${props.field}`)
        .then((response) => response.json())
        .then((data) => {
          const field_data = data.data.map(
            (record: Record<string, unknown>) => record[props.field]
          );
          const count_data = data.data.map(
            (record: Record<string, unknown>) => record.count
          );
          return { field_data, count_data };
        });
    },
    enabled: !!props.project,
  });

  return (
    <Plot
      data={[
        {
          labels: field_data,
          values: count_data,
          type: "pie",
          marker: { color: "#198754" },
        },
      ]}
      layout={{
        autosize: true,
        title: `Records by ${props.field}`,
        margin: {
          l: 50,
          r: 50,
          b: 50,
          t: 50,
          pad: 4,
        },
        // width: 1080,
        // height: 500,
        // @ts-expect-error Typing this would be madness
        template: props.darkMode ? template : undefined,
      }}
      useResizeHandler={true}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function Stats(props: StatsProps) {
  return (
    <Container fluid className="g-2">
      <Card>
        <Card.Header>Graphs</Card.Header>
        <Card.Body className="graph-panel">
          <Row className="g-2">
            <Col xl={8}>
              <Stack gap={2}>
                <Card body>
                  <ScatterGraph {...props} field="collection_date" />
                </Card>
                <Card body>
                  <ScatterGraph {...props} field="received_date" />
                </Card>
              </Stack>
            </Col>
            <Col xl={4}>
              <Stack gap={2}>
                <Card body>
                  <PieGraph {...props} field="site" />
                </Card>
                <Card body>
                  <PieGraph {...props} field="platform" />
                </Card>
              </Stack>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

function flattenFields(fields: Record<string, ProjectField>) {
  const flatFields: Record<string, ProjectField> = {};

  // Loop over object and flatten nested fields
  const flatten = (obj: Record<string, ProjectField>, prefix = "") => {
    for (const [field, fieldInfo] of Object.entries(obj)) {
      flatFields[prefix + field] = fieldInfo;
      if (fieldInfo.type === "relation") {
        flatten(
          fieldInfo.fields as Record<string, ProjectField>,
          prefix + field + "__"
        );
      }
    }
  };

  flatten(fields);
  return flatFields;
}

function App(props: OnyxProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [project, setProject] = useState("");
  const [tabKey, setTabKey] = useState("data");

  // Fetch the project list
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/")
        .then((response) => response.json())
        .then((data) => {
          return [
            ...new Set(
              data.data.map(
                (project: Record<string, unknown>) => project.project
              )
            ),
          ] as string[];
        });
    },
  });

  // Set the first project as the default
  useEffect(() => {
    if (!project && projects) {
      setProject(projects[0]);
    }
  }, [project, projects]);

  // Fetch types and their lookups
  const { data: typeLookups = new Map<string, string[]>() } = useQuery({
    queryKey: ["types"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/types/")
        .then((response) => response.json())
        .then((data) => {
          return new Map(
            data.data.map((type: Record<string, unknown>) => [
              type.type,
              type.lookups,
            ])
          ) as Map<string, string[]>;
        });
    },
  });

  // Fetch lookup descriptions
  const { data: lookupDescriptions = new Map<string, string>() } = useQuery({
    queryKey: ["lookups"],
    queryFn: async () => {
      return props
        .httpPathHandler("projects/lookups/")
        .then((response) => response.json())
        .then((data) => {
          return new Map(
            data.data.map((lookup: Record<string, unknown>) => [
              lookup.lookup,
              lookup.description,
            ])
          ) as Map<string, string>;
        });
    },
  });

  // Fetch project information
  const {
    data: { projectName, projectFields, fieldDescriptions } = {
      projectName: "",
      projectFields: new Map<string, ProjectField>(),
      fieldDescriptions: new Map<string, string>(),
    },
  } = useQuery({
    queryKey: ["fields", project],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${project}/fields/`)
        .then((response) => response.json())
        .then((data) => {
          const fields = flattenFields(data.data.fields);
          const projectName = data.data.name;
          const projectFields = new Map(
            Object.keys(fields).map((field) => [
              field,
              {
                type: fields[field].type,
                description: fields[field].description,
                actions: fields[field].actions,
                values: fields[field].values,
              },
            ])
          );
          const fieldDescriptions = new Map(
            Array.from(projectFields.entries()).map(([field, options]) => [
              field,
              options.description,
            ])
          );
          return { projectName, projectFields, fieldDescriptions };
        });
    },
    enabled: !!project,
  });

  const toggleTheme = () => {
    const htmlElement = document.querySelector("html");
    htmlElement?.setAttribute("data-bs-theme", !darkMode ? "dark" : "light");
    setDarkMode(!darkMode);
  };

  return (
    <Stack gap={2} className="Onyx">
      <Header
        {...props}
        projectName={projectName}
        projectList={projects}
        handleProjectChange={setProject}
        handleThemeChange={toggleTheme}
        guiVersion={VERSION}
        tabKey={tabKey}
        setTabKey={setTabKey}
      />
      <Tab.Container activeKey={tabKey}>
        <Tab.Content>
          <Tab.Pane eventKey="data">
            <Data
              {...props}
              project={project}
              projectFields={projectFields}
              typeLookups={typeLookups}
              fieldDescriptions={fieldDescriptions}
              lookupDescriptions={lookupDescriptions}
              darkMode={darkMode}
            />
          </Tab.Pane>
          <Tab.Pane eventKey="stats">
            <Stats {...props} project={project} darkMode={darkMode} />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
      <div></div>
    </Stack>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

function Onyx(props: OnyxProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <App {...props} />
    </QueryClientProvider>
  );
}

export default Onyx;
