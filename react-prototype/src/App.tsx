import React, { ChangeEventHandler, useState } from "react";
import {
  Container,
  Row,
  Stack,
  Button,
  Form,
  Table,
  Badge,
  Nav,
  Navbar,
  NavDropdown,
} from "react-bootstrap";
import "./App.css";

function NavbarComponent({
  project,
  projectOptions,
  handleDomainChange,
  handleTokenChange,
  handleAuthenticate,
  handleProjectChange,
}: {
  project: string;
  projectOptions: string[];
  handleDomainChange: React.ChangeEventHandler<HTMLInputElement>;
  handleTokenChange: React.ChangeEventHandler<HTMLInputElement>;
  handleAuthenticate: React.MouseEventHandler<HTMLButtonElement>;
  handleProjectChange: (p: string) => void;
}) {
  return (
    <Navbar bg="dark" variant="dark">
      <Container fluid>
        <Navbar.Brand>Onyx</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto my-2 my-lg-0">
            <NavDropdown title={project} id="collasible-nav-dropdown">
              {projectOptions.map((p) => (
                <NavDropdown.Item
                  key={p}
                  onClick={() => handleProjectChange(p)}
                >
                  {p}
                </NavDropdown.Item>
              ))}
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
        <Form className="d-flex">
          <Form.Control
            type="text"
            placeholder="Domain"
            className="me-2"
            size="sm"
            onChange={handleDomainChange}
          />
          <Form.Control
            type="text"
            placeholder="Token"
            className="me-2"
            size="sm"
            onChange={handleTokenChange}
          />
          <Button
            variant="outline-success"
            size="sm"
            onClick={handleAuthenticate}
          >
            Authenticate
          </Button>
        </Form>
      </Container>
    </Navbar>
  );
}

function DropdownComponent({
  options,
  titles,
  value,
  onChange,
}: {
  options: string[];
  titles: Map<string, string> | null;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <div className="custom-select-container">
      <Form.Select value={value} onChange={onChange} size="sm">
        {options.map((option) => (
          <option key={option} value={option} title={titles?.get(option)}>
            {option}
          </option>
        ))}
      </Form.Select>
    </div>
  );
}

function InputComponent({
  value,
  onChange,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="custom-input-container">
      <Form.Control
        type="text"
        id="value"
        required
        value={value}
        onChange={onChange}
        size="sm"
      />
    </div>
  );
}

function ButtonComponent({
  text,
  variant,
  onClick,
}: {
  text: string;
  variant: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <div className="custom-button-container">
      <Button type="button" onClick={onClick} size="sm" variant={variant}>
        <span>{text}</span>
      </Button>
    </div>
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
  handleValueChange: ChangeEventHandler<HTMLInputElement>;
  handleFilterAdd: () => void;
  handleFilterRemove: () => void;
}) {
  return (
    <div>
      <DropdownComponent
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
      <DropdownComponent
        options={
          lookupOptions.get(fieldOptions.get(filter.field)?.type || "") || []
        }
        titles={lookupDescriptions}
        value={filter.lookup}
        onChange={handleLookupChange}
      />
      <InputComponent value={filter.value} onChange={handleValueChange} />
      <ButtonComponent text="+" variant="primary" onClick={handleFilterAdd} />
      <ButtonComponent text="-" variant="danger" onClick={handleFilterRemove} />
    </div>
  );
}

function TableComponent({
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
}

function StatusComponent({ status }: { status: string }) {
  return (
    <Badge
      bg={
        status === "Success"
          ? "success"
          : status === "Error"
          ? "danger"
          : "secondary"
      }
      pill
    >
      Status: {status}
    </Badge>
  );
}

interface FieldOptions {
  type: string;
  description: string;
  actions: string[];
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
          },
        ])
      );
      setFieldOptions(fieldMap);
    })
    .catch((err) => {
      console.log(err.message);
    });
}

function App() {
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [project, setProject] = useState("");
  const [projectOptions, setProjectOptions] = useState([] as string[]);
  const [fieldOptions, setFieldOptions] = useState(
    {} as Map<string, FieldOptions>
  );
  const [lookupOptions, setLookupOptions] = useState(
    {} as Map<string, string[]>
  );
  const [lookupDescriptions, setLookupDescriptions] = useState(
    {} as Map<string, string>
  );
  const [filterList, setFilterList] = useState([] as Filter[]);
  const [resultData, setResultData] = useState([]);
  const resultCount = resultData.length;
  const [status, setStatus] = useState("None");

  const handleAuthenticate = () => {
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
        }
        setAuthenticated(true);
      })
      .catch((err) => {
        setAuthenticated(false);
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

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDomain(e.target.value);
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  };

  const handleProjectChange = (p: string) => {
    setProject(p);
    setFilterList([] as Filter[]);
    setResultData([]);
    setStatus("None");
    refreshFieldOptions({
      domain,
      token,
      project: p,
      setFieldOptions,
    });
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
    setFilterList(list);
  };

  const handleLookupChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...filterList];
    list[index].lookup = e.target.value;
    setFilterList(list);
  };

  const handleValueChange = (
    e: React.ChangeEvent<HTMLInputElement>,
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
    setFilterList([] as Filter[]);
  };

  const handleSearch = () => {
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
    );
    fetch(domain + "/projects/" + project + "?" + params, {
      headers: { Authorization: "Token " + token },
    })
      .then((response) => response.json())
      .then((data) => {
        setResultData(data["data"]);
        setStatus("Success");
      })
      .catch((err) => {
        setStatus("Error");
        console.log(err.message);
      });
  };

  return (
    <form className="App" autoComplete="off">
      <Container fluid>
        <Stack gap={3}>
          <Row>
            <NavbarComponent
              project={project}
              projectOptions={projectOptions}
              handleDomainChange={handleDomainChange}
              handleTokenChange={handleTokenChange}
              handleAuthenticate={handleAuthenticate}
              handleProjectChange={handleProjectChange}
            />
          </Row>
          <Row>
            {authenticated && (
              <div>
                <div>
                  <ButtonComponent
                    text="Search"
                    variant="primary"
                    onClick={handleSearch}
                  />
                  <StatusComponent status={status} />
                  <Badge bg="secondary" pill>
                    Results: {resultCount}
                  </Badge>
                </div>
                <div>
                  <ButtonComponent
                    text="Add Filter"
                    variant="dark"
                    onClick={() => handleFilterAdd(filterList.length)}
                  />
                  <ButtonComponent
                    text="Clear Filters"
                    variant="dark"
                    onClick={handleFilterClear}
                  />
                </div>
                <div className="filter-list">
                  {filterList.map((filter, index) => (
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
                  ))}
                </div>
              </div>
            )}
          </Row>
          <Row>
            <TableComponent data={resultData} />
          </Row>
        </Stack>
      </Container>
    </form>
  );
}

export default App;
