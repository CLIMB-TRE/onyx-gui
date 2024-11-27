import React, { useState } from "react";
import Stack from "react-bootstrap/Stack";
import CloseButton from "react-bootstrap/CloseButton";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { MultiDropdown } from "./Dropdowns";
import { DataProps } from "../interfaces";

interface TransformsProps extends DataProps {
  transform: string;
  transformList: string[];
  setTransformList: (value: string[]) => void;
  filterFieldOptions: string[];
  listFieldOptions: string[];
  setEditMode: (value: boolean) => void;
}

function Transforms(props: TransformsProps) {
  const [transformList, setTransformList] = useState(props.transformList);

  const handleTransformListChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setTransformList(e.target.value ? e.target.value.split(",") : []);
  };

  const handleApply = () => {
    props.setTransformList(transformList);
    props.setEditMode(false);
  };

  return (
    <Stack gap={3} className="p-1">
      <Row>
        <Col>
          <h5>Edit Fields</h5>
        </Col>
        <Col>
          <CloseButton
            className="float-end"
            onClick={() => props.setEditMode(false)}
          />
        </Col>
      </Row>
      <MultiDropdown
        options={
          props.transform === "Summarise"
            ? props.filterFieldOptions
            : props.listFieldOptions
        }
        titles={props.fieldDescriptions}
        value={transformList}
        placeholder={`${props.transform} fields...`}
        onChange={handleTransformListChange}
      />
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

export default Transforms;
