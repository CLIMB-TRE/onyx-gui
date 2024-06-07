import React, { ChangeEventHandler, useState, useEffect } from "react";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Pagination from "react-bootstrap/Pagination";
import { mkConfig, generateCsv, download } from "export-to-csv";
import Header from "./components/Header";
import { Dropdown, MultiDropdown } from "./components/Dropdowns";
import { Input, MultiInput } from "./components/Inputs";
import ResultsTable from "./components/ResultsTable";

import "./Onyx.css";
import "./bootstrap.css";

interface Profile {
  username: string;
  site: string;
}

interface ProjectField {
  type: string;
  description: string;
  actions: string[];
  values?: string[];
  fields?: Record<string, ProjectField>;
}

interface FilterField {
  field: string;
  lookup: string;
  value: string;
}

function Filter({
  filter,
  projectFields,
  typeLookups,
  fieldDescriptions,
  lookupDescriptions,
  handleFieldChange,
  handleLookupChange,
  handleValueChange,
  handleFilterAdd,
  handleFilterRemove,
  darkMode,
}: {
  filter: FilterField;
  projectFields: Map<string, ProjectField>;
  typeLookups: Map<string, string[]>;
  fieldDescriptions: Map<string, string>;
  lookupDescriptions: Map<string, string>;
  handleFieldChange: ChangeEventHandler<HTMLSelectElement>;
  handleLookupChange: ChangeEventHandler<HTMLSelectElement>;
  handleValueChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  handleFilterAdd: () => void;
  handleFilterRemove: () => void;
  darkMode: boolean;
}) {
  let f: JSX.Element;
  const getValueList = (v: string) => {
    return v ? v.split(",") : [];
  };

  if (filter.lookup === "isnull") {
    f = (
      <Dropdown
        options={["true", "false"]}
        value={filter.value}
        onChange={handleValueChange}
        darkMode={darkMode}
      />
    );
  } else if (projectFields.get(filter.field)?.type === "choice") {
    if (filter.lookup.endsWith("in")) {
      f = (
        <MultiDropdown
          options={projectFields.get(filter.field)?.values || []}
          value={getValueList(filter.value)}
          onChange={handleValueChange}
          darkMode={darkMode}
        />
      );
    } else {
      f = (
        <Dropdown
          options={projectFields.get(filter.field)?.values || []}
          value={filter.value}
          onChange={handleValueChange}
          darkMode={darkMode}
        />
      );
    }
  } else if (filter.lookup.endsWith("in")) {
    f = (
      <MultiInput
        value={getValueList(filter.value)}
        onChange={handleValueChange}
        darkMode={darkMode}
      />
    );
  } else if (filter.lookup.endsWith("range")) {
    f = (
      <MultiInput
        value={getValueList(filter.value)}
        limit={2}
        onChange={handleValueChange}
        darkMode={darkMode}
      />
    );
  } else if (projectFields.get(filter.field)?.type === "bool") {
    f = (
      <Dropdown
        options={["true", "false"]}
        value={filter.value}
        onChange={handleValueChange}
        darkMode={darkMode}
      />
    );
  } else {
    f = <Input value={filter.value} onChange={handleValueChange} />;
  }
  return (
    <Stack direction="horizontal">
      <Container fluid>
        <Row>
          <Col>
            <Dropdown
              options={Array.from(projectFields.keys())}
              titles={fieldDescriptions}
              value={filter.field}
              onChange={handleFieldChange}
              darkMode={darkMode}
            />
          </Col>
          <Col>
            <Dropdown
              options={
                typeLookups.get(projectFields.get(filter.field)?.type || "") ||
                []
              }
              titles={lookupDescriptions}
              value={filter.lookup}
              onChange={handleLookupChange}
              darkMode={darkMode}
            />
          </Col>
          <Col>{f}</Col>
        </Row>
      </Container>
      <Stack direction="horizontal" gap={1}>
        <Button variant="primary" onClick={handleFilterAdd}>
          +
        </Button>
        <Button variant="danger" onClick={handleFilterRemove}>
          -
        </Button>
      </Stack>
    </Stack>
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

function Onyx({
  httpPathHandler,
  s3PathHandler,
}: {
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler?: (path: string) => void;
}) {
  const [profile, setProfile] = useState({} as Profile);
  const [project, setProject] = useState("");
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
  const [filterList, setFilterList] = useState(new Array<FilterField>());
  const [includeList, setIncludeList] = useState(new Array<string>());
  const [excludeList, setExcludeList] = useState(new Array<string>());
  const [summariseList, setSummariseList] = useState(new Array<string>());
  const [searchInput, setSearchInput] = useState("");
  const [resultData, setResultData] = useState([]);
  const resultCount = resultData.length;
  const [nextPage, setNextPage] = useState("");
  const [previousPage, setPreviousPage] = useState("");
  const [errors, setErrors] = useState(new Map<string, string | string[]>());
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Fetch user profile
    httpPathHandler("accounts/profile")
      .then((response) => response.json())
      .then((data) => {
        setProfile({
          username: data["data"].username,
          site: data["data"].site,
        });
      })
      .catch((err) => {
        console.log(err.message);
      });

    // Fetch project list
    httpPathHandler("projects")
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
    httpPathHandler("projects/types")
      .then((response) => response.json())
      .then((typeData) => {
        httpPathHandler("projects/lookups")
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

  const toggleTheme = () => {
    const htmlElement = document.querySelector("html");
    htmlElement?.setAttribute("data-bs-theme", !darkMode ? "dark" : "light");
    setDarkMode(!darkMode);
  };

  const handleProjectChange = (p: string) => {
    setProject(p);
    setFilterList([]);
    setIncludeList([]);
    setExcludeList([]);
    setSummariseList([]);
    setSearchInput("");
    setResultData([]);

    // Fetch project fields
    httpPathHandler("projects/" + p + "/fields")
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
        setProjectFields(fieldMap);
      })
      .catch((err) => {
        console.log(err.message);
      });

    handleSearch("projects/" + p);
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...filterList];
    const field = projectFields.get(e.target.value);

    list[index].field = e.target.value;
    list[index].lookup = typeLookups.get(field?.type || "")?.[0] || "";

    if (field?.type === "bool" || list[index].lookup === "isnull") {
      list[index].value = "true";
    } else if (field?.type === "choice") {
      list[index].value = field?.values?.[0] || "";
    } else {
      list[index].value = "";
    }

    setFilterList(list);
  };

  const handleLookupChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...filterList];
    const field = projectFields.get(list[index].field);

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

  const handleValueChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index: number
  ) => {
    const list = [...filterList];
    list[index].value = e.target.value;

    setFilterList(list);
  };

  const handleIncludeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeList(e.target.value ? e.target.value.split(",") : []);
  };

  const handleExcludeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExcludeList(e.target.value ? e.target.value.split(",") : []);
  };

  const handleSummariseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSummariseList(e.target.value ? e.target.value.split(",") : []);
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

  const handleSearch = (search?: string) => {
    if (search === undefined) {
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
      search = "projects/" + project + "?" + params;
    }

    // Fetch search results
    httpPathHandler(search)
      .then((response) => {
        if (!response.ok) {
          response.json().then((data) => {
            setResultData([]);
            setNextPage("");
            setPreviousPage("");
            setErrors(new Map(Object.entries(data["messages"])));
          });
        } else {
          response.json().then((data) => {
            setResultData(data["data"]);
            setErrors(new Map<string, string | string[]>());

            const getPath = (path: string) => {
              return path.split("//")[1].split("/").slice(1).join("/");
            };

            let next;
            if (data["next"]) {
              next = getPath(data["next"]);
            } else {
              next = "";
            }
            setNextPage(next);

            let previous;
            if (data["previous"]) {
              previous = getPath(data["previous"]);
            } else {
              previous = "";
            }
            setPreviousPage(previous);
          });
        }
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  const csvConfig = mkConfig({
    filename: project,
    useKeysAsHeaders: true,
  });

  const handleExportToCSV = () => {
    const csv = generateCsv(csvConfig)(resultData);
    download(csvConfig)(csv);
  };

  return (
    <form className="Onyx" autoComplete="off">
      <Stack gap={3}>
        <Header
          profile={profile}
          project={project}
          projectList={projectList}
          searchInput={searchInput}
          handleProjectChange={handleProjectChange}
          handleSearchInputChange={(e) => setSearchInput(e.target.value)}
          handleSearch={handleSearch}
          handleThemeChange={toggleTheme}
        />
        <Container fluid>
          <Row>
            <Col lg={6}>
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
                    <Button
                      size="sm"
                      variant="dark"
                      onClick={handleFilterClear}
                    >
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
                          projectFields={projectFields}
                          typeLookups={typeLookups}
                          fieldDescriptions={fieldDescriptions}
                          lookupDescriptions={lookupDescriptions}
                          handleFieldChange={(e) => handleFieldChange(e, index)}
                          handleLookupChange={(e) =>
                            handleLookupChange(e, index)
                          }
                          handleValueChange={(e) => handleValueChange(e, index)}
                          handleFilterAdd={() => handleFilterAdd(index + 1)}
                          handleFilterRemove={() => handleFilterRemove(index)}
                          darkMode={darkMode}
                        />
                      </div>
                    ))}
                  </Stack>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={2}>
              <Card>
                <Card.Header>Summarise</Card.Header>
                <Card.Body className="panel">
                  <MultiDropdown
                    options={Array.from(projectFields.keys())}
                    titles={fieldDescriptions}
                    value={summariseList}
                    onChange={handleSummariseChange}
                    darkMode={darkMode}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Header>Include</Card.Header>
                <Card.Body className="panel">
                  <MultiDropdown
                    options={Array.from(projectFields.keys())}
                    titles={fieldDescriptions}
                    value={includeList}
                    onChange={handleIncludeChange}
                    darkMode={darkMode}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Header>Exclude</Card.Header>
                <Card.Body className="panel">
                  <MultiDropdown
                    options={Array.from(projectFields.keys())}
                    value={excludeList}
                    onChange={handleExcludeChange}
                    darkMode={darkMode}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <Container fluid>
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
              {errors.size > 0 ? (
                Array.from(errors.entries()).map(([key, value]) =>
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
                <ResultsTable data={resultData} s3PathHandler={s3PathHandler} />
              )}
            </Card.Body>
            <Card.Footer>
              <Pagination size="sm">
                <Pagination.Prev
                  disabled={!previousPage.length}
                  onClick={() => handleSearch(previousPage)}
                />
                <Pagination.Item>Showing {resultCount} results</Pagination.Item>
                <Pagination.Next
                  disabled={!nextPage.length}
                  onClick={() => handleSearch(nextPage)}
                />
              </Pagination>
            </Card.Footer>
          </Card>
        </Container>
      </Stack>
    </form>
  );
}

export default Onyx;
