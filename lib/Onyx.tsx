import React, { memo, ChangeEventHandler, useState } from "react";
import {
  Alert,
  Container,
  Row,
  Col,
  Stack,
  Button,
  Form,
  Table,
  Nav,
  Navbar,
  NavDropdown,
  Card,
  Pagination,
} from "react-bootstrap";
import Select from "react-select";
import Creatable from "react-select/creatable";
import { mkConfig, generateCsv, download } from "export-to-csv";

import "./Onyx.css";
import "bootstrap/dist/css/bootstrap.min.css";

const VERSION = "0.6.0";

function NavbarComponent({
  domain,
  token,
  username,
  project,
  projectOptions,
  searchInput,
  handleDomainChange,
  handleTokenChange,
  handleAuthenticate,
  handleProjectChange,
  handleSearchInputChange,
  handleSearch,
  handleThemeChange,
}: {
  domain: string;
  token: string;
  username: string;
  project: string;
  projectOptions: string[];
  searchInput: string;
  handleDomainChange: React.ChangeEventHandler<HTMLInputElement>;
  handleTokenChange: React.ChangeEventHandler<HTMLInputElement>;
  handleAuthenticate: React.MouseEventHandler<HTMLButtonElement>;
  handleProjectChange: (p: string) => void;
  handleSearchInputChange: React.ChangeEventHandler<HTMLInputElement>;
  handleSearch: () => void;
  handleThemeChange: () => void;
}) {
  return (
    <Navbar bg="dark" variant="dark" collapseOnSelect expand="lg">
      <Container fluid>
        <Navbar.Brand>Onyx</Navbar.Brand>
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown title={project} id="collapsible-nav-dropdown">
              {projectOptions.map((p) => (
                <NavDropdown.Item
                  key={p}
                  onClick={() => handleProjectChange(p)}
                >
                  {p}
                </NavDropdown.Item>
              ))}
            </NavDropdown>
            <NavDropdown
              title={
                <Navbar.Text>
                  <Navbar.Text>Signed in as:</Navbar.Text>{" "}
                  <Navbar.Text className="text-light">{username}</Navbar.Text>
                </Navbar.Text>
              }
              id="nav-dropdown"
            >
              <Input
                type="text"
                value={domain}
                placeholder="Domain"
                onChange={handleDomainChange}
              />
              <Input
                type="text"
                value={token}
                placeholder="Token"
                onChange={handleTokenChange}
              />
              <NavDropdown.Divider />
              <NavDropdown.Item>
                <Button variant="outline-success" onClick={handleAuthenticate}>
                  Authenticate
                </Button>
              </NavDropdown.Item>
            </NavDropdown>
            <Navbar.Text>Version: {VERSION}</Navbar.Text>
          </Nav>
        </Navbar.Collapse>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Form.Check
          type="switch"
          id="theme-switch"
          onChange={handleThemeChange}
        />
        <Nav>
          <Input
            type="text"
            value={searchInput}
            placeholder="Search records..."
            onChange={handleSearchInputChange}
          />
          <Button variant="primary" onClick={() => handleSearch()}>
            Search
          </Button>
        </Nav>
      </Container>
    </Navbar>
  );
}

function Dropdown({
  options,
  titles,
  value,
  onChange,
}: {
  options: string[];
  titles?: Map<string, string>;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <Form.Select value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option} value={option} title={titles?.get(option)}>
          {option}
        </option>
      ))}
    </Form.Select>
  );
}

function MultiDropdown({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <Select
      isMulti
      menuPortalTarget={document.body}
      styles={{
        control: (styles) => ({ ...styles, backgroundColor: "dark-grey" }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        menu: (base) => ({ ...base, backgroundColor: "black" }),
        option: (base, state) => ({
          ...base,
          color: "white",
          backgroundColor: state.isFocused ? "blue" : "black",
        }),
      }}
      options={options.map((option) => ({
        value: option,
        label: option,
      }))}
      value={value.map((option) => ({
        value: option,
        label: option,
      }))}
      delimiter=","
      onChange={(e) =>
        onChange({
          target: {
            value: e.map((option) => option.value).join(","),
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }
    />
  );
}

function Input({
  type,
  value,
  placeholder,
  onChange,
}: {
  type: string;
  value: string;
  placeholder: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <Form.Control
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
    />
  );
}

function MultiInput({
  options,
  value,
  limit,
  onChange,
}: {
  options: string[];
  value: string[];
  limit?: number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <Creatable
      isMulti
      menuPortalTarget={document.body}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
      options={options.map((option) => ({
        value: option,
        label: option,
      }))}
      value={value.map((option) => ({
        value: option,
        label: option,
      }))}
      delimiter=","
      onChange={(e) =>
        onChange({
          target: {
            value: e.map((option) => option.value).join(","),
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }
      isOptionDisabled={() => !(limit === undefined || value.length < limit)}
    />
  );
}

interface Filter {
  field: string;
  lookup: string;
  value: string;
}

function FilterComponent({
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
  filter: Filter;
  fieldOptions: Map<string, FieldOptions>;
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
      <Button variant="primary" onClick={handleFilterAdd}>
        +
      </Button>
      <Button variant="danger" onClick={handleFilterRemove}>
        -
      </Button>
    </Stack>
  );
}

const TableComponent = memo(function TableComponent({
  data,
}: {
  data: Record<string, string | number | boolean | null>[];
}) {
  const headers = () => {
    if (data.length > 0) {
      return Object.keys(data[0]);
    } else {
      return [];
    }
  };
  const rows = data.map((item) => Object.values(item));

  return (
    <Table striped bordered hover responsive size="sm">
      <thead>
        <tr>
          {headers().map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, index) => (
              <td key={index}>{cell?.toString()}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
});

interface FieldOptions {
  type: string;
  description: string;
  actions: string[];
  choices: string[];
}

function refreshFieldOptions({
  domain,
  token,
  project,
  setFieldOptions,
}: {
  domain: string;
  token: string;
  project: string;
  setFieldOptions: React.Dispatch<
    React.SetStateAction<Map<string, FieldOptions>>
  >;
}) {
  fetch(domain + "/projects/" + project + "/fields", {
    headers: { Authorization: "Token " + token },
  })
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
      setFieldOptions(fieldMap);
    })
    .catch((err) => {
      console.log(err.message);
    });
}

interface OnyxProps {
  domain?: string;
  token?: string;
}

function Onyx(props: OnyxProps) {
  const [domain, setDomain] = useState(props.domain || "");
  const [token, setToken] = useState(props.token || "");
  const [username, setUsername] = useState("None");
  const [project, setProject] = useState("None");
  const [projectOptions, setProjectOptions] = useState(new Array<string>());
  const [fieldOptions, setFieldOptions] = useState(
    new Map<string, FieldOptions>()
  );
  const [lookupOptions, setLookupOptions] = useState(
    new Map<string, string[]>()
  );
  const [lookupDescriptions, setLookupDescriptions] = useState(
    new Map<string, string>()
  );
  const [filterList, setFilterList] = useState(new Array<Filter>());
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

  const toggleTheme = () => {
    const htmlElement = document.querySelector("html");
    htmlElement?.setAttribute("data-bs-theme", !darkMode ? "dark" : "light");
    setDarkMode(!darkMode);
  };

  const handleAuthenticate = () => {
    fetch(domain + "/accounts/profile", {
      headers: { Authorization: "Token " + token },
    })
      .then((response) => response.json())
      .then((data) => {
        setUsername(data["data"].username);
      })
      .catch((err) => {
        console.log(err.message);
      });

    fetch(domain + "/projects", {
      headers: { Authorization: "Token " + token },
    })
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
          const project = projects[0];
          setProject(project);
          refreshFieldOptions({ domain, token, project, setFieldOptions });
          handleSearch(domain + "/projects/" + project);
        }
      })
      .catch((err) => {
        console.log(err.message);
      });

    fetch(domain + "/projects/types", {
      headers: { Authorization: "Token " + token },
    })
      .then((response) => response.json())
      .then((typeData) => {
        fetch(domain + "/projects/lookups", {
          headers: { Authorization: "Token " + token },
        })
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
  };

  const handleProjectChange = (p: string) => {
    setProject(p);
    setFilterList([] as Filter[]);
    setIncludeList([] as string[]);
    setExcludeList([] as string[]);
    setSummariseList([] as string[]);
    setSearchInput("");
    setResultData([]);
    refreshFieldOptions({
      domain,
      token,
      project: p,
      setFieldOptions,
    });
    handleSearch(domain + "/projects/" + p);
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...filterList];
    list[index].field = e.target.value;
    list[index].lookup =
      lookupOptions.get(fieldOptions.get(e.target.value)?.type || "")?.[0] ||
      "";
    list[index].value = "";

    if (fieldOptions.get(e.target.value)?.type === "choice") {
      list[index].value = fieldOptions.get(e.target.value)?.choices[0] || "";
    } else if (
      fieldOptions.get(e.target.value)?.type === "bool" ||
      list[index].lookup === "isnull"
    ) {
      list[index].value = "true";
    }
    setFilterList(list);
  };

  const handleLookupChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...filterList];
    list[index].lookup = e.target.value;
    list[index].value = "";

    if (fieldOptions.get(e.target.value)?.type === "choice") {
      list[index].value = fieldOptions.get(e.target.value)?.choices[0] || "";
    } else if (
      fieldOptions.get(e.target.value)?.type === "bool" ||
      list[index].lookup === "isnull"
    ) {
      list[index].value = "true";
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
    setFilterList([] as Filter[]);
  };

  const handleSearch = (url?: string) => {
    if (project) {
      if (url === undefined) {
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
        url = domain + "/projects/" + project + "?" + params;
      }

      fetch(url, {
        headers: { Authorization: "Token " + token },
      })
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
              setNextPage(data["next"] || "");
              setPreviousPage(data["previous"] || "");
              setErrors(new Map<string, string | string[]>());
            });
          }
        })
        .catch((err) => {
          console.log(err.message);
        });
    }
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
      <Container fluid>
        <Stack gap={3}>
          <Row>
            <NavbarComponent
              domain={domain}
              token={token}
              username={username}
              project={project}
              projectOptions={projectOptions}
              searchInput={searchInput}
              handleDomainChange={(e) => setDomain(e.target.value)}
              handleTokenChange={(e) => setToken(e.target.value)}
              handleAuthenticate={handleAuthenticate}
              handleProjectChange={handleProjectChange}
              handleSearchInputChange={(e) => setSearchInput(e.target.value)}
              handleSearch={handleSearch}
              handleThemeChange={toggleTheme}
            />
          </Row>
          <Row>
            <Col lg={6}>
              <Card>
                <Card.Header>
                  <span>Filter</span>
                  <div className="float-end">
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
                  </div>
                </Card.Header>
                <Card.Body className="panel">
                  {filterList.map((filter, index) => (
                    <div key={index}>
                      <FilterComponent
                        filter={filter}
                        fieldOptions={fieldOptions}
                        lookupOptions={lookupOptions}
                        lookupDescriptions={lookupDescriptions}
                        handleFieldChange={(e) => handleFieldChange(e, index)}
                        handleLookupChange={(e) => handleLookupChange(e, index)}
                        handleValueChange={(e) => handleValueChange(e, index)}
                        handleFilterAdd={() => handleFilterAdd(index + 1)}
                        handleFilterRemove={() => handleFilterRemove(index)}
                      />
                    </div>
                  ))}
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
          <Card>
            <Card.Header>
              <span>Results</span>
              <div className="float-end">
                <Button
                  size="sm"
                  variant="outline-success"
                  onClick={handleExportToCSV}
                >
                  Export Page to CSV
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="table-panel">
              {errors.size > 0 ? (
                Array.from(errors.entries()).map(([key, value]) => (
                  <div key={key}>
                    <Alert variant="danger">
                      <span>
                        {key}: {value}
                      </span>
                    </Alert>
                  </div>
                ))
              ) : (
                <TableComponent data={resultData} />
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
        </Stack>
      </Container>
    </form>
  );
}

export default Onyx;
