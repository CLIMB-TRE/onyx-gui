import { useState } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { MdClear, MdCreate, MdDelete } from "react-icons/md";
import { DataProps } from "../interfaces";
import { FilterConfig } from "../types";
import {
  formatField,
  formatLookup,
  formatValue,
  generateKey,
} from "../utils/functions";
import Filter from "./Filter";
import RemoveAllModal from "./RemoveAllModal";

interface FilterPanelProps extends DataProps {
  filterList: FilterConfig[];
  setFilterList: (filters: FilterConfig[]) => void;
  filterFieldOptions: string[];
  disableLookups?: boolean;
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
    const updatedList = [...props.filterList];
    updatedList.splice(index, 1);
    props.setFilterList(updatedList);
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
            variant="secondary"
            title="Add Filter"
            onClick={() => handleFilterAdd(props.filterList.length)}
          >
            <MdCreate />
          </Button>
          <Button
            size="sm"
            variant="secondary"
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
            filter={editFilter}
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
                    variant="secondary"
                    onClick={() => handleEditMode(filter, index)}
                  >
                    <span className="onyx-text-pink font-monospace">
                      {formatFilter(filter)}
                    </span>
                  </Button>
                  <Button
                    variant="secondary"
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
