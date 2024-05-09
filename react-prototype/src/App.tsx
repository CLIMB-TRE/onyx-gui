import React, { useState } from "react";

import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";

import "./App.css";

function DropdownComponent({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <div className="custom-select-container">
      <Form.Select value={value} onChange={onChange} size="sm">
        {options.map((option) => (
          <option key={option} value={option}>
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
  onClick,
}: {
  text: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <div className="custom-button-container">
      <Button type="button" onClick={onClick} size="sm" variant="dark">
        <span>{text}</span>
      </Button>
    </div>
  );
}

function SearchButtonComponent({
  text,
  onClick,
}: {
  text: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <div className="custom-button-container">
      <Button type="button" onClick={onClick} size="sm">
        <span>{text}</span>
      </Button>
    </div>
  );
}

function FilterComponent({
  filter,
  index,
  fieldOptions,
  lookupOptions,
  handleFieldChange,
  handleLookupChange,
  handleValueChange,
  handleFilterAdd,
  handleFilterRemove,
}: {
  filter: Filter;
  index: number;
  fieldOptions: Map<string, string>;
  lookupOptions: Map<string, string[]>;
  handleFieldChange: (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => void;
  handleLookupChange: (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => void;
  handleValueChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => void;
  handleFilterAdd: (index: number) => void;
  handleFilterRemove: (index: number) => void;
}) {
  return (
    <div key={index}>
      <DropdownComponent
        options={[""].concat(Array.from(fieldOptions.keys()))}
        value={filter.field}
        onChange={(e) => handleFieldChange(e, index)}
      />
      <DropdownComponent
        options={lookupOptions.get(fieldOptions.get(filter.field) || "") || []}
        value={filter.lookup}
        onChange={(e) => handleLookupChange(e, index)}
      />
      <InputComponent
        value={filter.value}
        onChange={(e) => handleValueChange(e, index)}
      />
      <ButtonComponent text="+" onClick={() => handleFilterAdd(index + 1)} />
      <ButtonComponent text="-" onClick={() => handleFilterRemove(index)} />
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

function refreshFieldOptions({
  domain,
  token,
  project,
  setFieldOptions,
}: {
  domain: string;
  token: string;
  project: string;
  setFieldOptions: React.Dispatch<React.SetStateAction<Map<string, string>>>;
}) {
  fetch(domain + "/projects/" + project + "/fields", {
    headers: { Authorization: "Token " + token },
  })
    .then((response) => response.json())
    .then((data) => {
      const fields = data["data"]["fields"];
      const fieldMap = new Map(
        Object.keys(fields).map((field) => [field, fields[field].type])
      );
      setFieldOptions(fieldMap);
    })
    .catch((err) => {
      console.log(err.message);
    });
}

interface Filter {
  field: string;
  lookup: string;
  value: string;
}

function App() {
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");
  const [project, setProject] = useState("");
  const [projectOptions, setProjectOptions] = useState([] as string[]);
  const [fieldOptions, setFieldOptions] = useState({} as Map<string, string>);
  const [lookupOptions, setLookupOptions] = useState(
    {} as Map<string, string[]>
  );
  const [filterList, setFilterList] = useState([] as Filter[]);
  const [resultCount, setResultCount] = useState(0);
  const [resultData, setResultData] = useState([{}]);
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
      })
      .catch((err) => {
        console.log(err.message);
      });

    fetch(domain + "/projects/types", {
      headers: { Authorization: "Token " + token },
    })
      .then((response) => response.json())
      .then((data) => {
        const lookups = new Map(
          data["data"].map((type: Record<string, unknown>) => [
            type.type,
            type.lookups,
          ])
        ) as Map<string, string[]>;
        setLookupOptions(lookups);
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

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProject(e.target.value);
    setFilterList([] as Filter[]);
    setResultCount(0);
    setResultData([{}]);
    setStatus("None");
    refreshFieldOptions({
      domain,
      token,
      project: e.target.value,
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
      lookupOptions.get(fieldOptions.get(e.target.value) || "")?.[0] || "";
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
        setResultCount(data["data"].length);
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
      <label>Onyx: API for pathogen metadata</label>
      <div>
        <span>Domain: </span>
        <InputComponent value={domain} onChange={handleDomainChange} />
        <span> Token: </span>
        <InputComponent value={token} onChange={handleTokenChange} />
        <ButtonComponent text="Authenticate" onClick={handleAuthenticate} />
      </div>
      <div>
        <span>Project: </span>
        <DropdownComponent
          options={projectOptions}
          value={project}
          onChange={handleProjectChange}
        />
      </div>
      <div>
        <ButtonComponent
          text="Add Filter"
          onClick={() => handleFilterAdd(filterList.length)}
        />
        <ButtonComponent text="Clear Filters" onClick={handleFilterClear} />
      </div>
      {filterList.map((filter, index) => (
        <FilterComponent
          filter={filter}
          index={index}
          fieldOptions={fieldOptions}
          lookupOptions={lookupOptions}
          handleFieldChange={handleFieldChange}
          handleLookupChange={handleLookupChange}
          handleValueChange={handleValueChange}
          handleFilterAdd={handleFilterAdd}
          handleFilterRemove={handleFilterRemove}
        />
      ))}
      <div>
        <SearchButtonComponent text="Search" onClick={handleSearch} />
        <StatusComponent status={status} />
        <Badge bg="secondary" pill>
          Results: {resultCount}
        </Badge>
      </div>
      <TableComponent data={resultData} />
    </form>
  );
}

export default App;
