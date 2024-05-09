import React, { useState } from "react";
import "./App.css";

function ProjectDropdown({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <select value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function FieldDropdown({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <select value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function LookupDropdown({
  options,
  value,
  onChange,
}: {
  options: string[] | undefined;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  if (options === undefined) {
    options = [];
  }
  return (
    <select value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function ValueInput({
  value,
  onChange,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <input type="text" id="value" required value={value} onChange={onChange} />
  );
}

const TableComponent = ({
  data,
}: {
  data: Record<string, string | number | boolean | null>[];
}) => {
  const headers = () => {
    if (data.length > 0) {
      return Object.keys(data[0]);
    } else {
      return [];
    }
  };
  const rows = data.map((item) => Object.values(item));

  return (
    <table>
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
              <td key={index}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

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
  const [fieldOptions, setFieldOptions] = useState([] as string[]);
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
          fetch(domain + "/projects/" + project + "/fields", {
            headers: { Authorization: "Token " + token },
          })
            .then((response) => response.json())
            .then((data) => {
              const fields = data["data"]["fields"];
              setFieldOptions([""].concat(Object.keys(fields)));
            })
            .catch((err) => {
              console.log(err.message);
            });
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

    fetch(domain + "/projects/" + e.target.value + "/fields", {
      headers: { Authorization: "Token " + token },
    })
      .then((response) => response.json())
      .then((data) => {
        const fields = data["data"]["fields"];
        setFieldOptions([""].concat(Object.keys(fields)));
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...filterList];
    list[index].field = e.target.value;
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
        <ValueInput value={domain} onChange={(e) => handleDomainChange(e)} />
        <span> Token: </span>
        <ValueInput value={token} onChange={(e) => handleTokenChange(e)} />
        <button
          type="button"
          className="authenticate-btn"
          onClick={() => handleAuthenticate()}
        >
          <span>Authenticate</span>
        </button>
      </div>
      <div className="project">
        <span>Project: </span>
        <ProjectDropdown
          options={projectOptions}
          value={project}
          onChange={(e) => handleProjectChange(e)}
        />
      </div>
      {filterList.map((filter, index) => (
        <div key={index} className="filter">
          <FieldDropdown
            options={fieldOptions}
            value={filter.field}
            onChange={(e) => handleFieldChange(e, index)}
          />
          <LookupDropdown
            options={lookupOptions.get("text")}
            value={filter.lookup}
            onChange={(e) => handleLookupChange(e, index)}
          />
          <ValueInput
            value={filter.value}
            onChange={(e) => handleValueChange(e, index)}
          />
          <button
            type="button"
            className="add-filter-btn"
            onClick={() => handleFilterAdd(index + 1)}
          >
            <span>+</span>
          </button>
          <button
            type="button"
            className="remove-filter-btn"
            onClick={() => handleFilterRemove(index)}
          >
            <span>-</span>
          </button>
        </div>
      ))}
      <div className="search">
        <button
          type="button"
          className="add-filter-btn"
          onClick={() => handleFilterAdd(filterList.length)}
        >
          <span>Add Filter</span>
        </button>
        <button
          type="button"
          className="clear-filter-btn"
          onClick={handleFilterClear}
        >
          <span>Clear Filters</span>
        </button>
        <button type="button" className="search-btn" onClick={handleSearch}>
          <span>Search</span>
        </button>
      </div>
      <div className="result-status">
        <span>Status: {status}</span>
        <span> | Results: {resultCount}</span>
      </div>
      <div className="result-table">
        <TableComponent data={resultData} />
      </div>
    </form>
  );
}

export default App;
