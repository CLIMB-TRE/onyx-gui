import React, { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import CloseButton from "react-bootstrap/CloseButton";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import { DataProps } from "../interfaces";
import { FieldTypes, FilterConfig } from "../types";
import { Choice, Dropdown, MultiChoice } from "./Dropdowns";
import { Input, MultiInput, RangeInput } from "./Inputs";
import { useFieldDescriptions } from "../api/hooks";

interface FilterProps extends DataProps {
  filter: FilterConfig;
  index: number;
  filterList: FilterConfig[];
  setFilterList: (filters: FilterConfig[]) => void;
  fieldList: string[];
  setEditMode: (value: boolean) => void;
  disableLookups?: boolean;
}

function getValueList(v: string) {
  return v ? v.split(",") : [];
}

function Filter(props: FilterProps) {
  const [filter, setFilter] = useState(props.filter);

  const inputType = useMemo(() => {
    if (
      [
        "length",
        "length__in",
        "length__range",
        "iso_year",
        "iso_year__in",
        "iso_year__range",
        "week",
        "week__in",
        "week__range",
      ].includes(filter.lookup)
    )
      return "number";

    if (filter.type === "date") return "date";
    else if (filter.type === "integer" || filter.type === "decimal")
      return "number";
    else return "text";
  }, [filter]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter((prevState) => {
      const updatedFilter = { ...prevState };

      updatedFilter.type =
        props.fields.get(e.target.value)?.type || FieldTypes.NONE;
      updatedFilter.field = e.target.value;
      updatedFilter.lookup =
        props.typeLookups.get(updatedFilter.type)?.[0] || "";

      if (updatedFilter.lookup === "isnull") updatedFilter.value = "true";
      else updatedFilter.value = "";

      return updatedFilter;
    });
  };

  const handleLookupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter((prevState) => {
      const updatedFilter = { ...prevState };

      updatedFilter.lookup = e.target.value;

      if (updatedFilter.lookup === "isnull") updatedFilter.value = "true";
      else if (updatedFilter.lookup.endsWith("range"))
        updatedFilter.value = getValueList(updatedFilter.value)
          .slice(0, 2)
          .join(",");
      else if (!updatedFilter.lookup.endsWith("in"))
        updatedFilter.value = getValueList(updatedFilter.value)[0] || "";

      return updatedFilter;
    });
  };

  const handleValueChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilter((prevState) => ({
      ...prevState,
      value: e.target.value,
    }));
  };

  const handleApply = () => {
    const updatedFilter = { ...filter };

    // Trim whitespace from value
    // Handle both single and multi-value inputs
    if (
      updatedFilter.lookup.endsWith("in") ||
      updatedFilter.lookup.endsWith("range") ||
      (updatedFilter.type === "array" &&
        !updatedFilter.lookup.includes("length"))
    ) {
      updatedFilter.value = getValueList(updatedFilter.value)
        .map((v) => v.trim())
        .join(",");
    } else {
      updatedFilter.value = updatedFilter.value.trim();
    }

    props.setFilterList([
      ...props.filterList.slice(0, props.index),
      updatedFilter,
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
          {...props}
          field={filter.field}
          options={props.fields.get(filter.field)?.values || []}
          value={getValueList(filter.value)}
          onChange={handleValueChange}
        />
      );
      valueTitle = "Values";
      break;
    case filter.type === "choice":
      f = (
        <Choice
          {...props}
          isClearable
          field={filter.field}
          options={props.fields.get(filter.field)?.values || []}
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
          type={inputType}
          from={getValueList(filter.value)[0] || ""}
          to={getValueList(filter.value)[1] || ""}
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
      f = (
        <Input
          type={inputType}
          value={filter.value}
          onChange={handleValueChange}
        />
      );
  }

  const fieldDescriptions = useFieldDescriptions(props.fields);

  return (
    <Stack gap={2} className="p-1">
      <Stack direction="horizontal">
        <span className="me-auto">Edit Filter</span>
        <CloseButton
          className="float-end"
          onClick={() => props.setEditMode(false)}
        />
      </Stack>
      <hr className="m-0" />
      <Form>
        <Form.Group className="mb-1">
          <Form.Label>Field</Form.Label>
          <Dropdown
            options={props.fieldList}
            titles={fieldDescriptions}
            value={filter.field}
            placeholder="Select field..."
            onChange={handleFieldChange}
          />
        </Form.Group>
        {!props.disableLookups && (
          <Form.Group className="mb-1">
            <Form.Label>Lookup</Form.Label>
            <Dropdown
              options={props.typeLookups.get(filter.type) || []}
              titles={props.lookupDescriptions}
              value={filter.lookup}
              placeholder="Select lookup..."
              onChange={handleLookupChange}
            />
          </Form.Group>
        )}
        {filter.lookup.endsWith("range") ? (
          f
        ) : (
          <Form.Group className="mb-1">
            <Form.Label>{valueTitle}</Form.Label>
            {f}
          </Form.Group>
        )}
      </Form>
      <Stack direction="horizontal" gap={1}>
        <div className="me-auto"></div>
        <Button
          size="sm"
          variant="secondary"
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
