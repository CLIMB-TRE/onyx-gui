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

interface FilterInfo {
  field: string;
  lookup: string;
  value: string;
}

interface FieldInfo {
  type: string;
  description: string;
  actions: string[];
  choices: string[];
}

function Filter({
  filter,
  fieldOptions,
  lookupOptions,
  lookupDescriptions,
  handleFieldChange,
  handleLookupChange,
  handleValueChange,
  handleFilterAdd,
  handleFilterRemove,
}: {
  filter: FilterInfo;
  fieldOptions: Map<string, FieldInfo>;
  lookupOptions: Map<string, string[]>;
  lookupDescriptions: Map<string, string>;
  handleFieldChange: ChangeEventHandler<HTMLSelectElement>;
  handleLookupChange: ChangeEventHandler<HTMLSelectElement>;
  handleValueChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  handleFilterAdd: () => void;
  handleFilterRemove: () => void;
}) {
  let f: JSX.Element;
  if (filter.lookup === "isnull") {
    f = (
      <Dropdown
        options={["true", "false"]}
        value={filter.value}
        onChange={handleValueChange}
      />
    );
  } else if (fieldOptions.get(filter.field)?.type === "choice") {
    if (filter.lookup.endsWith("in")) {
      let value: string[] = [];
      if (filter.value) {
        value = filter.value.split(",");
      }
      f = (
        <MultiDropdown
          options={fieldOptions.get(filter.field)?.choices || []}
          value={value}
          onChange={handleValueChange}
        />
      );
    } else {
      f = (
        <Dropdown
          options={fieldOptions.get(filter.field)?.choices || []}
          value={filter.value}
          onChange={handleValueChange}
        />
      );
    }
  } else if (filter.lookup.endsWith("in")) {
    let value: string[] = [];
    if (filter.value) {
      value = filter.value.split(",");
    }
    f = (
      <MultiInput
        options={fieldOptions.get(filter.field)?.choices || []}
        value={value}
        onChange={handleValueChange}
      />
    );
  } else if (filter.lookup.endsWith("range")) {
    let value: string[] = [];
    if (filter.value) {
      value = filter.value.split(",");
    }
    f = (
      <MultiInput
        options={fieldOptions.get(filter.field)?.choices || []}
        value={value}
        limit={2}
        onChange={handleValueChange}
      />
    );
  } else if (fieldOptions.get(filter.field)?.type === "bool") {
    f = (
      <Dropdown
        options={["true", "false"]}
        value={filter.value}
        onChange={handleValueChange}
      />
    );
  } else {
    f = (
      <Input
        type="text"
        value={filter.value}
        placeholder="Value"
        onChange={handleValueChange}
      />
    );
  }
  return (
    <Stack direction="horizontal">
      <Container fluid>
        <Row>
          <Col>
            <Dropdown
              options={[""].concat(Array.from(fieldOptions.keys()))}
              titles={
                new Map(
                  Array.from(fieldOptions.entries()).map(([field, options]) => [
                    field,
                    options.description,
                  ])
                )
              }
              value={filter.field}
              onChange={handleFieldChange}
            />
          </Col>
          <Col>
            <Dropdown
              options={
                lookupOptions.get(fieldOptions.get(filter.field)?.type || "") ||
                []
              }
              titles={lookupDescriptions}
              value={filter.lookup}
              onChange={handleLookupChange}
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

function Onyx({
  httpPathHandler,
  s3PathHandler,
}: {
  httpPathHandler: (path: string) => Promise<Response>;
  s3PathHandler?: (path: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [project, setProject] = useState("");
  const [projectOptions, setProjectOptions] = useState(new Array<string>());
  const [fieldOptions, setFieldInfo] = useState(new Map<string, FieldInfo>());
  const [lookupOptions, setLookupOptions] = useState(
    new Map<string, string[]>()
  );
  const [lookupDescriptions, setLookupDescriptions] = useState(
    new Map<string, string>()
  );
  const [filterList, setFilterList] = useState(new Array<FilterInfo>());
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
    httpPathHandler("accounts/profile")
      .then((response) => response.json())
      .then((data) => {
        setUsername(data["data"].username);
      })
      .catch((err) => {
        console.log(err.message);
      });

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
        setProjectOptions(projects);
        if (projects.length > 0) {
          handleProjectChange(projects[0]);
        }
      })
      .catch((err) => {
        console.log(err.message);
      });

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
            setLookupOptions(lookups);
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

    httpPathHandler("projects/" + p + "/fields")
      .then((response) => response.json())
      .then((data) => {
        const fields = data["data"]["fields"];
        const fieldMap = new Map(
          Object.keys(fields).map((field) => [
            field,
            {
              type: fields[field].type,
              description: fields[field].description,
              actions: fields[field].actions,
              choices: fields[field].values,
            },
          ])
        );
        setFieldInfo(fieldMap);
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
    const field = fieldOptions.get(e.target.value);

    list[index].field = e.target.value;
    list[index].lookup = lookupOptions.get(field?.type || "")?.[0] || "";

    if (field?.type === "bool" || list[index].lookup === "isnull") {
      list[index].value = "true";
    } else if (field?.type === "choice") {
      list[index].value = field?.choices[0] || "";
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
    const field = fieldOptions.get(list[index].field);

    list[index].lookup = e.target.value;

    if (field?.type === "bool" || list[index].lookup === "isnull") {
      list[index].value = "true";
    } else if (field?.type === "choice") {
      list[index].value = field?.choices[0] || "";
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
    if (e.target.value === "") {
      setIncludeList([]);
    } else {
      setIncludeList(e.target.value.split(","));
    }
  };

  const handleExcludeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      setExcludeList([]);
    } else {
      setExcludeList(e.target.value.split(","));
    }
  };

  const handleSummariseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      setSummariseList([]);
    } else {
      setSummariseList(e.target.value.split(","));
    }
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

            let next;
            if (data["next"]) {
              next = data["next"].split("//")[1].split("/").slice(1).join("/");
            } else {
              next = "";
            }
            setNextPage(next);

            let previous;
            if (data["previous"]) {
              previous = data["previous"]
                .split("//")[1]
                .split("/")
                .slice(1)
                .join("/");
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
          username={username}
          project={project}
          projectOptions={projectOptions}
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
                          fieldOptions={fieldOptions}
                          lookupOptions={lookupOptions}
                          lookupDescriptions={lookupDescriptions}
                          handleFieldChange={(e) => handleFieldChange(e, index)}
                          handleLookupChange={(e) =>
                            handleLookupChange(e, index)
                          }
                          handleValueChange={(e) => handleValueChange(e, index)}
                          handleFilterAdd={() => handleFilterAdd(index + 1)}
                          handleFilterRemove={() => handleFilterRemove(index)}
                        />
                      </div>
                    ))}
                  </Stack>
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Header>Summarise</Card.Header>
                <Card.Body className="panel">
                  <MultiDropdown
                    options={Array.from(fieldOptions.keys())}
                    value={summariseList}
                    onChange={handleSummariseChange}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Header>Include</Card.Header>
                <Card.Body className="panel">
                  <MultiDropdown
                    options={Array.from(fieldOptions.keys())}
                    value={includeList}
                    onChange={handleIncludeChange}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Header>Exclude</Card.Header>
                <Card.Body className="panel">
                  <MultiDropdown
                    options={Array.from(fieldOptions.keys())}
                    value={excludeList}
                    onChange={handleExcludeChange}
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
                variant="outline-success"
                onClick={handleExportToCSV}
              >
                Export Page to CSV
              </Button>
            </Card.Header>
            <Card.Body className="table-panel">
              {errors.size > 0 ? (
                Array.from(errors.entries()).map(([key, value]) => (
                  <Alert key={key} variant="danger">
                    <span>
                      {key}: {value}
                    </span>
                  </Alert>
                ))
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
