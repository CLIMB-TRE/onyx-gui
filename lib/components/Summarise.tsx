import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import CloseButton from "react-bootstrap/CloseButton";
import Stack from "react-bootstrap/Stack";
import { DataProps } from "../interfaces";
import { MultiDropdown } from "./Dropdowns";
import { useFieldDescriptions } from "../api/hooks";

interface SummariseProps extends DataProps {
  summariseList: string[];
  setSummariseList: (value: string[]) => void;
  filterFieldOptions: string[];
  setEditMode: (value: boolean) => void;
}

function Summarise(props: SummariseProps) {
  const [summariseList, setSummariseList] = useState(props.summariseList);

  const handleSummariseListChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSummariseList(e.target.value ? e.target.value.split(",") : []);
  };

  const handleApply = () => {
    props.setSummariseList(summariseList);
    props.setEditMode(false);
  };

  const fieldDescriptions = useFieldDescriptions(props.fields);

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
        options={props.filterFieldOptions}
        titles={fieldDescriptions}
        value={summariseList}
        placeholder={"Summarise fields..."}
        onChange={handleSummariseListChange}
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

export default Summarise;
