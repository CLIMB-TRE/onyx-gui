import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { Dropdown, Choice, MultiChoice } from "./Dropdowns";
import { Input, MultiInput } from "./Inputs";
import { DataProps } from "../interfaces";

interface FilterProps extends DataProps {
  filter: { field: string; lookup: string; value: string };
  fieldList: string[];
  handleFieldChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleLookupChange: React.ChangeEventHandler<HTMLSelectElement>;
  handleValueChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  >;
  handleFilterAdd: () => void;
  handleFilterRemove: () => void;
}

function Filter(props: FilterProps) {
  let f: JSX.Element;
  const getValueList = (v: string) => {
    return v ? v.split(",") : [];
  };

  if (props.filter.lookup === "isnull") {
    f = (
      <Dropdown
        options={["true", "false"]}
        value={props.filter.value}
        onChange={props.handleValueChange}
      />
    );
  } else if (props.projectFields.get(props.filter.field)?.type === "choice") {
    if (props.filter.lookup.endsWith("in")) {
      f = (
        <MultiChoice
          project={props.project}
          field={props.filter.field}
          httpPathHandler={props.httpPathHandler}
          options={props.projectFields.get(props.filter.field)?.values || []}
          value={getValueList(props.filter.value)}
          onChange={props.handleValueChange}
        />
      );
    } else {
      f = (
        <Choice
          project={props.project}
          field={props.filter.field}
          httpPathHandler={props.httpPathHandler}
          isClearable
          options={props.projectFields.get(props.filter.field)?.values || []}
          value={props.filter.value}
          onChange={props.handleValueChange}
        />
      );
    }
  } else if (props.filter.lookup.endsWith("in")) {
    f = (
      <MultiInput
        value={getValueList(props.filter.value)}
        onChange={props.handleValueChange}
      />
    );
  } else if (props.filter.lookup.endsWith("range")) {
    f = (
      <MultiInput
        value={getValueList(props.filter.value)}
        limit={2}
        onChange={props.handleValueChange}
      />
    );
  } else if (props.projectFields.get(props.filter.field)?.type === "bool") {
    f = (
      <Dropdown
        isClearable
        options={["true", "false"]}
        value={props.filter.value}
        onChange={props.handleValueChange}
      />
    );
  } else {
    f = <Input value={props.filter.value} onChange={props.handleValueChange} />;
  }
  return (
    <Stack direction="horizontal" gap={1}>
      <Container fluid className="g-0">
        <Row className="g-1">
          <Col sm={6} lg={4}>
            <Dropdown
              options={props.fieldList}
              titles={props.fieldDescriptions}
              value={props.filter.field}
              placeholder="Select field..."
              onChange={props.handleFieldChange}
            />
          </Col>
          <Col sm={6} lg={4}>
            <Dropdown
              options={
                props.typeLookups.get(
                  props.projectFields.get(props.filter.field)?.type || ""
                ) || []
              }
              titles={props.lookupDescriptions}
              value={props.filter.lookup}
              placeholder="Select lookup..."
              onChange={props.handleLookupChange}
            />
          </Col>
          <Col sm={12} lg={4}>
            {f}
          </Col>
        </Row>
      </Container>
      <Button variant="dark" onClick={props.handleFilterAdd}>
        +
      </Button>
      <Button variant="dark" onClick={props.handleFilterRemove}>
        -
      </Button>
    </Stack>
  );
}

export default Filter;
