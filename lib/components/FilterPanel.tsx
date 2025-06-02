import { useState } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { MdClear, MdCreate, MdDelete } from "react-icons/md";
import { DataProps } from "../interfaces";
import { FilterConfig } from "../types";
import { generateKey } from "../utils/functions";
import Filter from "./Filter";
import RemoveAllModal from "./RemoveAllModal";

interface FilterPanelProps extends DataProps {
  filterList: FilterConfig[];
  setFilterList: (value: FilterConfig[]) => void;
  filterFieldOptions: string[];
  disableLookups?: boolean;
}

function formatField(field: string) {
  return field.split("__").join(" ");
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

// TODO: Issues arise if value contains commas
// TODO: Would be better to have field-type-dependent formatting
function formatValue(value: string) {
  let values = value.split(",");
  if (values.length > 10) {
    values = values
      .slice(0, 10)
      .concat([`... [${(values.length - 10).toString()} more]`]);
  }
  return values.join(", ");
}

function formatFilter(filter: FilterConfig) {
  if (!filter.field && !filter.lookup && !filter.value) {
    return "Click to Edit";
  }

  if (filter.lookup.endsWith("in") || filter.lookup.endsWith("range"))
    return `${formatField(filter.field)} ${formatLookup(
      filter.lookup
    )} [${formatValue(filter.value)}]`;
  else
    return `${formatField(filter.field)} ${formatLookup(
      filter.lookup
    )} ${formatValue(filter.value)}`;
}

function FilterPanel(props: FilterPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [editFilter, setEditFilter] = useState({} as FilterConfig);
  const [editIndex, setEditIndex] = useState(0);
  const [removeAllModalShow, setRemoveAllModalShow] = useState(false);

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

  const handleFilterRemoveAll = () => {
    setEditMode(false);
    props.setFilterList([]);
  };

  return (
    <Card className="h-100 overflow-y-auto">
      <RemoveAllModal
        show={removeAllModalShow}
        onHide={() => setRemoveAllModalShow(false)}
        item="Filters"
        handleRemove={handleFilterRemoveAll}
      />
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
            onClick={() => setRemoveAllModalShow(true)}
          >
            <MdDelete />
          </Button>
        </Stack>
      </Card.Header>
      <Card.Body className="h-100 p-2 overflow-y-auto">
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
      </Card.Body>
    </Card>
  );
}

export default FilterPanel;
