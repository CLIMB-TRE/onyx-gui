import React, { useState } from "react";
import Stack from "react-bootstrap/Stack";
import CloseButton from "react-bootstrap/CloseButton";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Dropdown, Choice, MultiChoice } from "./Dropdowns";
import { Input, MultiInput, RangeInput } from "./Inputs";
import { FilterConfig } from "../types";
import { DataProps } from "../interfaces";

interface FilterProps extends DataProps {
  index: number;
  filterList: FilterConfig[];
  setFilterList: (value: FilterConfig[]) => void;
  fieldList: string[];
  setEditMode: (value: boolean) => void;
}

function getValueList(v: string) {
  return v ? v.split(",") : [];
}

function Filter(props: FilterProps) {
  const [filter, setFilter] = useState(props.filterList[props.index]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updatedFilter = { ...filter };
    updatedFilter.type = props.projectFields.get(e.target.value)?.type || "";
    updatedFilter.field = e.target.value;
    updatedFilter.lookup = props.typeLookups.get(updatedFilter.type)?.[0] || "";

    if (updatedFilter.lookup === "isnull") updatedFilter.value = "true";
    else updatedFilter.value = "";

    setFilter(updatedFilter);
  };

  const handleLookupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updatedFilter = { ...filter };
    updatedFilter.lookup = e.target.value;

    if (updatedFilter.lookup === "isnull") updatedFilter.value = "true";
    else if (updatedFilter.lookup.endsWith("range"))
      updatedFilter.value = getValueList(updatedFilter.value)
        .slice(0, 2)
        .join(",");
    else if (!updatedFilter.lookup.endsWith("in"))
      updatedFilter.value = getValueList(updatedFilter.value)[0];

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
  let valueTitle = "Value";

  switch (true) {
    case filter.lookup === "isnull":
      f = (
        <Dropdown
          options={["true", "false"]}
          value={filter.value}
          onChange={handleValueChange}
        />
      );
      break;
    case filter.type === "choice" && filter.lookup.endsWith("in"):
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
      break;
    case filter.type === "choice":
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
      break;
    case filter.type === "array" && !filter.lookup.includes("length"):
      f = (
        <MultiInput
          value={getValueList(filter.value)}
          onChange={handleValueChange}
        />
      );
      break;
    case filter.lookup.endsWith("in"):
      f = (
        <MultiInput
          value={getValueList(filter.value)}
          onChange={handleValueChange}
        />
      );
      valueTitle = "Values";
      break;
    case filter.lookup.endsWith("range"):
      f = (
        <RangeInput
          from={getValueList(filter.value)[0]}
          to={getValueList(filter.value)[1]}
          onChange={handleValueChange}
        />
      );
      break;
    case filter.type === "bool":
      f = (
        <Dropdown
          isClearable
          options={["true", "false"]}
          value={filter.value}
          onChange={handleValueChange}
        />
      );
      break;
    default:
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
      <Form>
        <Form.Group className="mb-2">
          <Form.Label>Field</Form.Label>
          <Dropdown
            options={props.fieldList}
            titles={props.fieldDescriptions}
            value={filter.field}
            placeholder="Select field..."
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Lookup</Form.Label>
          <Dropdown
            options={props.typeLookups.get(filter.type) || []}
            titles={props.lookupDescriptions}
            value={filter.lookup}
            placeholder="Select lookup..."
            onChange={handleLookupChange}
          />
        </Form.Group>
        {filter.lookup.endsWith("range") ? (
          f
        ) : (
          <Form.Group className="mb-2">
            <Form.Label>{valueTitle}</Form.Label>
            {f}
          </Form.Group>
        )}
      </Form>
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
