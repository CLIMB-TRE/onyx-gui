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
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import Header from "./components/Header";
import { MultiDropdown } from "./components/Dropdowns";
import Filter from "./components/Filter";
import ResultsTable from "./components/ResultsTable";
import LoadingAlert from "./components/LoadingAlert";

import "./Onyx.css";
import "./bootstrap.css";

const VERSION = "0.9.1";

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

interface DataProps {
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler?: (path: string) => void;
  fileWriter?: (path: string, content: string) => void;
  project: string;
  projectFields: Map<string, ProjectField>;
  typeLookups: Map<string, string[]>;
  fieldDescriptions: Map<string, string>;
  lookupDescriptions: Map<string, string>;
  darkMode: boolean;
}

interface ParametersProps extends DataProps {
  setParameters: (params: string) => void;
}

interface ResultsProps extends DataProps {
  setParameters: (params: string) => void;
  resultPending: boolean;
  resultError: Error | null;
  resultData: ResultData | null;
}

function Parameters(props: ParametersProps) {
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

    if (field?.type === "bool" || list[index].lookup === "isnull") {
      list[index].value = "true";
    } else if (field?.type === "choice") {
      list[index].value = field?.values?.[0] || "";
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
    const field = props.projectFields.get(list[index].field);
    list[index].lookup = e.target.value;

    if (field?.type === "bool" || list[index].lookup === "isnull") {
      list[index].value = "true";
    } else if (field?.type === "choice") {
      list[index].value = field?.values?.[0] || "";
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
    props.setParameters(params.toString());
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
            <Card.Body className="panel">
              <Stack gap={1}>
                {filterList.map((filter, index) => (
                  <div key={index}>
                    <Filter
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
            </Card.Body>
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
              <Card.Body className="panel">
                <MultiDropdown
                  options={options}
                  titles={props.fieldDescriptions}
                  value={value}
                  placeholder="Select fields..."
                  onChange={onChange}
                  darkMode={props.darkMode}
                />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}

const getParams = (path: string) => {
  return path.split("?", 2)[1];
};

function Results(props: ResultsProps) {
  const csvConfig = mkConfig({
    filename: props.project,
    useKeysAsHeaders: true,
  });

  const handleExportToCSV = () => {
    const csv = generateCsv(csvConfig)(props.resultData?.data || []);

    if (props.fileWriter) {
      props.fileWriter(props.project + ".csv", asString(csv));
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
      <Card.Body className="table-panel">
        {props.resultPending ? (
          <LoadingAlert />
        ) : props.resultError ? (
          <Alert variant="danger">Error: {props.resultError.message}</Alert>
        ) : props.resultData?.messages ? (
          Object.entries(props.resultData?.messages).map(([key, value]) =>
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
            data={props.resultData?.data || []}
            s3PathHandler={props.s3PathHandler}
          />
        )}
      </Card.Body>
      <Card.Footer>
        <Pagination size="sm">
          <Pagination.Prev
            disabled={!props.resultData?.previous}
            onClick={() => {
              props.setParameters(getParams(props.resultData?.previous || ""));
            }}
          />
          <Pagination.Item>
            Showing {props.resultData?.data ? props.resultData.data.length : 0}{" "}
            results
          </Pagination.Item>
          <Pagination.Next
            disabled={!props.resultData?.next}
            onClick={() => {
              props.setParameters(getParams(props.resultData?.next || ""));
            }}
          />
        </Pagination>
      </Card.Footer>
    </Card>
  );
}

function Data(props: DataProps) {
  const [searchParameters, setSearchParameters] = useState("");

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setSearchParameters("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.project]);

  // Fetch data, depending on project and search parameters
  const {
    isFetching: resultPending,
    error: resultError,
    data: resultData,
  } = useQuery({
    queryKey: ["results", props.project, searchParameters],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/?${searchParameters}`)
        .then((response) => response.json());
    },
  });

  return (
    <Container fluid className="g-2">
      <Stack gap={2}>
        <Parameters {...props} setParameters={setSearchParameters} />
        <Results
          {...props}
          setParameters={setSearchParameters}
          resultPending={resultPending}
          resultError={resultError}
          resultData={resultData}
        />
      </Stack>
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

interface OnyxProps {
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler?: (path: string) => void;
  fileWriter?: (path: string, content: string) => void;
  extVersion?: string;
}

function App(props: OnyxProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [project, setProject] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectList, setProjectList] = useState(new Array<string>());
  const [projectFields, setProjectFields] = useState(
    new Map<string, ProjectField>()
  );
  const [typeLookups, setTypeLookups] = useState(new Map<string, string[]>());
  const fieldDescriptions = new Map(
    Array.from(projectFields.entries()).map(([field, options]) => [
      field,
      options.description,
    ])
  );
  const [lookupDescriptions, setLookupDescriptions] = useState(
    new Map<string, string>()
  );

  // Fetch project list and type lookups
  useLayoutEffect(() => {
    // Fetch project list
    props
      .httpPathHandler("projects")
      .then((response) => response.json())
      .then((data) => {
        const projects = [
          ...new Set(
            data["data"].map(
              (project: Record<string, unknown>) => project.project
            )
          ),
        ] as string[];
        setProjectList(projects);
        if (projects.length > 0) {
          handleProjectChange(projects[0]);
        }
      })
      .catch((err) => {
        console.log(err.message);
      });

    // Fetch type lookups and lookup descriptions
    props
      .httpPathHandler("projects/types")
      .then((response) => response.json())
      .then((typeData) => {
        props
          .httpPathHandler("projects/lookups")
          .then((response) => response.json())
          .then((lookupData) => {
            const lookups = new Map(
              typeData["data"].map((type: Record<string, unknown>) => [
                type.type,
                type.lookups,
              ])
            ) as Map<string, string[]>;
            const descriptions = new Map(
              lookupData["data"].map((lookup: Record<string, unknown>) => [
                lookup.lookup,
                lookup.description,
              ])
            ) as Map<string, string>;
            setTypeLookups(lookups);
            setLookupDescriptions(descriptions);
          })
          .catch((err) => {
            console.log(err.message);
          });
      })
      .catch((err) => {
        console.log(err.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProjectChange = (p: string) => {
    // Set project
    setProject(p);

    // Set project fields
    props
      .httpPathHandler("projects/" + p + "/fields")
      .then((response) => response.json())
      .then((data) => {
        const fields = flattenFields(data["data"]["fields"]);
        const fieldMap = new Map(
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
        setProjectName(data["data"]["name"]);
        setProjectFields(fieldMap);
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

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
        projectList={projectList}
        handleProjectChange={handleProjectChange}
        handleThemeChange={toggleTheme}
        guiVersion={VERSION}
      />
      {project && (
        <Data
          {...props}
          project={project}
          projectFields={projectFields}
          typeLookups={typeLookups}
          fieldDescriptions={fieldDescriptions}
          lookupDescriptions={lookupDescriptions}
          darkMode={darkMode}
        />
      )}
      <div></div>
    </Stack>
  );
}

const queryClient = new QueryClient();

function Onyx(props: OnyxProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <App {...props} />
    </QueryClientProvider>
  );
}

export default Onyx;
