import React, { useState } from "react";
import "./App.css";

function ProjectDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  const options = [
    { value: "", label: "" },
    { value: "project_1", label: "Project 1" },
    { value: "project_2", label: "Project 2" },
  ];

  return (
    <select value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function FieldDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  const options = [
    { value: "", label: "" },
    { value: "climb_id", label: "climb_id" },
    { value: "biosample_id", label: "biosample_id" },
    { value: "run_id", label: "run_id" },
  ];

  return (
    <select value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function LookupDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  const options = [
    { value: "", label: "" },
    { value: "exact", label: "exact" },
    { value: "ne", label: "ne" },
    { value: "contains", label: "contains" },
  ];

  return (
    <select value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
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

function App() {
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");
  const [project, setProject] = useState("");
  const [filterList, setFilterList] = useState([
    { field: "", lookup: "", value: "" },
  ]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProject(e.target.value);
    const list = [{ field: "", lookup: "", value: "" }];
    setFilterList(list);
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

  const handleFilterAdd = () => {
    setFilterList([...filterList, { field: "", lookup: "", value: "" }]);
  };

  const handleFilterRemove = (index: number) => {
    const list = [...filterList];
    list.splice(index, 1);
    setFilterList(list);
  };

  const handleFilterClear = () => {
    const list = [{ field: "", lookup: "", value: "" }];
    setFilterList(list);
  };

  return (
    <form className="App" autoComplete="off">
      <div className="form-field">
        <label>Onyx: API for pathogen metadata</label>
        <div>
          <span>Domain: </span>
          <ValueInput
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>
        <div>
          <span>Token: </span>
          <ValueInput
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <div>
          <span>Project: </span>
          <ProjectDropdown
            value={project}
            onChange={(e) => handleProjectChange(e)}
          />
        </div>
        {filterList.map((singleFilter, index) => (
          <div key={index} className="onyx-filter">
            <div>
              <FieldDropdown
                value={singleFilter.field}
                onChange={(e) => handleFieldChange(e, index)}
              />
              <LookupDropdown
                value={singleFilter.lookup}
                onChange={(e) => handleLookupChange(e, index)}
              />
              <ValueInput
                value={singleFilter.value}
                onChange={(e) => handleValueChange(e, index)}
              />
              {filterList.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => handleFilterRemove(index)}
                >
                  <span>Remove</span>
                </button>
              )}
            </div>
            <div>
              {filterList.length - 1 === index && (
                <div>
                  <button
                    type="button"
                    className="add-btn"
                    onClick={handleFilterAdd}
                  >
                    <span>Add Filter</span>
                  </button>
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={handleFilterClear}
                  >
                    <span>Clear Filters</span>
                  </button>
                  <button type="button" className="search-btn">
                    <span>Search</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}

export default App;
