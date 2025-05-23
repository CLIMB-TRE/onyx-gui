import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import CloseButton from "react-bootstrap/CloseButton";
import Stack from "react-bootstrap/Stack";
import { DataProps } from "../interfaces";
import { MultiDropdown } from "./Dropdowns";

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
    <Stack gap={2} className="p-1">
      <Stack direction="horizontal">
        <span className="me-auto">Edit Fields</span>
        <CloseButton
          className="float-end"
          onClick={() => props.setEditMode(false)}
        />
      </Stack>
      <hr className="m-0 mb-1" />
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
      <Stack className="mt-1" direction="horizontal" gap={1}>
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
