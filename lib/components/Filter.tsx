import React, { useState } from "react";
import Stack from "react-bootstrap/Stack";
import CloseButton from "react-bootstrap/CloseButton";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { Dropdown, Choice, MultiChoice } from "./Dropdowns";
import { Input, MultiInput } from "./Inputs";
import { FilterField } from "../types";
import { DataProps } from "../interfaces";

interface FilterProps extends DataProps {
  index: number;
  filterList: FilterField[];
  setFilterList: (value: FilterField[]) => void;
  fieldList: string[];
  setEditMode: (value: boolean) => void;
}

function Filter(props: FilterProps) {
  const [filter, setFilter] = useState(props.filterList[props.index]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updatedFilter = { ...filter };
    updatedFilter.field = e.target.value;
    updatedFilter.lookup =
      props.typeLookups.get(
        props.projectFields.get(e.target.value)?.type || ""
      )?.[0] || "";

    if (updatedFilter.lookup === "isnull") {
      updatedFilter.value = "true";
    } else {
      updatedFilter.value = "";
    }
    setFilter(updatedFilter);
  };

  const handleLookupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updatedFilter = { ...filter };
    updatedFilter.lookup = e.target.value;

    if (updatedFilter.lookup === "isnull") {
      updatedFilter.value = "true";
    } else {
      updatedFilter.value = "";
    }
    setFilter(updatedFilter);
  };

  const handleValueChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const updatedFilter = { ...filter };
    updatedFilter.value = e.target.value;
    setFilter(updatedFilter);
  };

  const handleApply = () => {
    props.setFilterList([
      ...props.filterList.slice(0, props.index),
      filter,
      ...props.filterList.slice(props.index + 1),
    ]);
    props.setEditMode(false);
  };

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
      />
    );
  } else if (props.projectFields.get(filter.field)?.type === "choice") {
    if (filter.lookup.endsWith("in")) {
      f = (
        <MultiChoice
          project={props.project}
          field={filter.field}
          httpPathHandler={props.httpPathHandler}
          options={props.projectFields.get(filter.field)?.values || []}
          value={getValueList(filter.value)}
          onChange={handleValueChange}
        />
      );
    } else {
      f = (
        <Choice
          project={props.project}
          field={filter.field}
          httpPathHandler={props.httpPathHandler}
          isClearable
          options={props.projectFields.get(filter.field)?.values || []}
          value={filter.value}
          onChange={handleValueChange}
        />
      );
    }
  } else if (filter.lookup.endsWith("in")) {
    f = (
      <MultiInput
        value={getValueList(filter.value)}
        onChange={handleValueChange}
      />
    );
  } else if (filter.lookup.endsWith("range")) {
    f = (
      <MultiInput
        value={getValueList(filter.value)}
        limit={2}
        onChange={handleValueChange}
      />
    );
  } else if (props.projectFields.get(filter.field)?.type === "bool") {
    f = (
      <Dropdown
        isClearable
        options={["true", "false"]}
        value={filter.value}
        onChange={handleValueChange}
      />
    );
  } else {
    f = <Input value={filter.value} onChange={handleValueChange} />;
  }
  return (
    <Stack gap={3} className="p-1">
      <Row>
        <Col>
          <h5>Edit Filter</h5>
        </Col>
        <Col>
          <CloseButton
            className="float-end"
            onClick={() => props.setEditMode(false)}
          />
        </Col>
      </Row>
      <Stack gap={1}>
        <Dropdown
          options={props.fieldList}
          titles={props.fieldDescriptions}
          value={filter.field}
          placeholder="Select field..."
          onChange={handleFieldChange}
        />
        <Dropdown
          options={
            props.typeLookups.get(
              props.projectFields.get(filter.field)?.type || ""
            ) || []
          }
          titles={props.lookupDescriptions}
          value={filter.lookup}
          placeholder="Select lookup..."
          onChange={handleLookupChange}
        />
        {f}
      </Stack>
      <Stack direction="horizontal" gap={1}>
        <div className="me-auto"></div>
        <Button
          size="sm"
          variant="dark"
          onClick={() => props.setEditMode(false)}
        >
          Cancel
        </Button>
        <Button size="sm" onClick={handleApply}>
          Apply
        </Button>
      </Stack>
    </Stack>
  );
}

export default Filter;
