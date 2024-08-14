import React from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Filter from "./Filter";
import { FilterField } from "../types";
import { DataProps } from "../interfaces";
import generateKey from "../utils/generateKey";

interface FilterPanelProps extends DataProps {
  filterList: FilterField[];
  setFilterList: (value: FilterField[]) => void;
  filterFieldOptions: string[];
}

function FilterPanel(props: FilterPanelProps) {
  const handleFilterFieldChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...props.filterList];
    const field = props.projectFields.get(e.target.value);
    list[index].field = e.target.value;
    list[index].lookup = props.typeLookups.get(field?.type || "")?.[0] || "";

    if (list[index].lookup === "isnull") {
      list[index].value = "true";
    } else {
      list[index].value = "";
    }
    props.setFilterList(list);
  };

  const handleFilterLookupChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const list = [...props.filterList];
    list[index].lookup = e.target.value;

    if (list[index].lookup === "isnull") {
      list[index].value = "true";
    } else {
      list[index].value = "";
    }
    props.setFilterList(list);
  };

  const handleFilterValueChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index: number
  ) => {
    const list = [...props.filterList];
    list[index].value = e.target.value;
    props.setFilterList(list);
  };

  const handleFilterAdd = (index: number) => {
    props.setFilterList([
      ...props.filterList.slice(0, index),
      {
        key: generateKey(),
        field: "",
        lookup: "",
        value: "",
      },
      ...props.filterList.slice(index),
    ]);
  };

  const handleFilterRemove = (index: number) => {
    const list = [...props.filterList];
    list.splice(index, 1);
    props.setFilterList(list);
  };

  const handleFilterClear = () => {
    props.setFilterList([]);
  };

  return (
    <Card>
      <Card.Header>
        <span>Filter</span>
        <Stack direction="horizontal" gap={1} className="float-end">
          <Button
            size="sm"
            variant="dark"
            onClick={() => handleFilterAdd(props.filterList.length)}
          >
            Add Filter
          </Button>
          <Button size="sm" variant="dark" onClick={handleFilterClear}>
            Clear Filters
          </Button>
        </Stack>
      </Card.Header>
      <Container fluid className="onyx-parameters-panel-body p-2">
        <Stack gap={1}>
          {props.filterList.map((filter, index) => (
            <Filter
              {...props}
              key={filter.key}
              filter={filter}
              fieldList={props.filterFieldOptions}
              handleFieldChange={(e) => handleFilterFieldChange(e, index)}
              handleLookupChange={(e) => handleFilterLookupChange(e, index)}
              handleValueChange={(e) => handleFilterValueChange(e, index)}
              handleFilterAdd={() => handleFilterAdd(index + 1)}
              handleFilterRemove={() => handleFilterRemove(index)}
            />
          ))}
        </Stack>
      </Container>
    </Card>
  );
}

export default FilterPanel;
