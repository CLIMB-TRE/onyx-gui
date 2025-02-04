import { useState, useLayoutEffect } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Card from "react-bootstrap/Card";
import Filter from "./Filter";
import { FilterConfig } from "../types";
import { DataProps } from "../interfaces";
import { generateKey } from "../utils/functions";
import { MdCreate, MdClear, MdDelete } from "react-icons/md";

interface FilterPanelProps extends DataProps {
  filterList: FilterConfig[];
  setFilterList: (value: FilterConfig[]) => void;
  filterFieldOptions: string[];
}

function formatLookup(lookup: string) {
  switch (lookup) {
    case "exact":
      return "==";
    case "ne":
      return "!=";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    case "gt":
      return ">";
    case "gte":
      return ">=";
    default:
      return lookup.toUpperCase();
  }
}

function formatValue(value: string) {
  let valueSet = value.split(",").map((v) => `"${v}"`);
  if (valueSet.length > 10) {
    valueSet = valueSet
      .slice(0, 10)
      .concat([`... [${(valueSet.length - 10).toString()} more]`]);
  }
  return valueSet.join(", ");
}

function formatFilter(filter: FilterConfig) {
  if (!filter.field && !filter.lookup && !filter.value) {
    return "Empty Filter";
  }

  if (!filter.field || !filter.lookup) {
    return "Incomplete Filter";
  }

  if (filter.lookup.endsWith("in") || filter.lookup.endsWith("range"))
    return `${filter.field} ${formatLookup(filter.lookup)} [${formatValue(
      filter.value
    )}]`;
  else
    return `${filter.field} ${formatLookup(filter.lookup)} ${formatValue(
      filter.value
    )}`;
}

function FilterPanel(props: FilterPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [editFilter, setEditFilter] = useState({} as FilterConfig);
  const [editIndex, setEditIndex] = useState(0);

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setEditMode(false);
    setEditFilter({} as FilterConfig);
    setEditIndex(0);
  }, [props.project]);

  const handleEditMode = (filter: FilterConfig, index: number) => {
    setEditMode(true);
    setEditFilter(filter);
    setEditIndex(index);
  };

  const handleFilterAdd = (index: number) => {
    setEditMode(false);
    props.setFilterList([
      ...props.filterList.slice(0, index),
      {
        key: generateKey(),
        type: "",
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

  const handleFilterRemoveAll = () => props.setFilterList([]);

  return (
    <Card className="h-100">
      <Card.Header>
        <Stack direction="horizontal" gap={1}>
          <span className="me-auto">Filter</span>
          <Button
            size="sm"
            variant="dark"
            title="Add Filter"
            onClick={() => handleFilterAdd(props.filterList.length)}
          >
            <MdCreate />
          </Button>
          <Button
            size="sm"
            variant="dark"
            title="Remove All Filters"
            onClick={() => handleFilterRemoveAll()}
          >
            <MdDelete />
          </Button>
        </Stack>
      </Card.Header>
      <Container fluid className="overflow-y-scroll p-2 h-100">
        {editMode ? (
          <Filter
            {...props}
            key={editFilter.key}
            index={editIndex}
            fieldList={props.filterFieldOptions}
            setEditMode={setEditMode}
          />
        ) : (
          <Stack gap={2}>
            {props.filterList.map((filter, index) => (
              <Container key={filter.key} fluid className="g-0">
                <ButtonGroup size="sm">
                  <Button
                    variant="dark"
                    onClick={() => handleEditMode(filter, index)}
                  >
                    <span className="onyx-text-pink font-monospace">
                      {formatFilter(filter)}
                    </span>
                  </Button>
                  <Button
                    variant="dark"
                    title="Remove Filter"
                    onClick={() => handleFilterRemove(index)}
                  >
                    <MdClear />
                  </Button>
                </ButtonGroup>
              </Container>
            ))}
          </Stack>
        )}
      </Container>
    </Card>
  );
}

export default FilterPanel;
