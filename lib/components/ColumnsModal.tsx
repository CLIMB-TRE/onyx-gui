import { useEffect, useState, useMemo } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import Modal from "react-bootstrap/Modal";
import Card from "react-bootstrap/Card";
import { DataProps } from "../interfaces";
import { Field } from "../types";
import { Field as FieldDetails } from "./Details";
import { useDebouncedValue } from "../utils/hooks";
import { Input } from "./Inputs";
import OnyxModal from "./OnyxModal";

interface ColumnsModalProps extends DataProps {
  show: boolean;
  onHide: () => void;
  columns: Field[];
  defaultColumns: string[];
  activeColumns: string[];
  setActiveColumns: (value: string[]) => void;
}

function ColumnsModal(props: ColumnsModalProps) {
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [activeColumns, setActiveColumns] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState<string>("");

  const debouncedSearch = useDebouncedValue(search.toLowerCase(), 200);
  const filteredColumns = useMemo(
    () =>
      props.columns.filter(
        (column) =>
          column.code.toLowerCase().includes(debouncedSearch) ||
          column.description.toLowerCase().includes(debouncedSearch)
      ),
    [props.columns, debouncedSearch]
  );

  const activeColumnsMessage = useMemo(() => {
    return `${activeColumns.size} column${
      activeColumns.size !== 1 ? "s" : ""
    } selected. ${!activeColumns.size ? "All columns will be displayed." : ""}`;
  }, [activeColumns]);

  // Update active columns when props.activeColumns changes
  useEffect(() => {
    setActiveColumns(new Set(props.activeColumns));
  }, [props.activeColumns]);

  const handleSearchChange = (search: string) => {
    setSearch(search);
    setSelectAll(false); // Reset select all when search changes
  };

  // Handle checkbox changes for individual columns
  const handleSelectChange = (code: string, selected: boolean) => {
    const updatedColumns = new Set(activeColumns);
    if (selected) updatedColumns.add(code);
    else updatedColumns.delete(code);
    setActiveColumns(updatedColumns);
  };

  // Handle checkbox for selecting all columns
  const handleSelectAll = (selected: boolean) => {
    setSelectAll(selected);
    const updatedColumns = new Set(activeColumns);
    if (selected)
      filteredColumns.forEach((column) => updatedColumns.add(column.code));
    else
      filteredColumns.forEach((column) => updatedColumns.delete(column.code));
    setActiveColumns(updatedColumns);
  };

  // Apply the changes to active columns, then close the modal
  const handleApply = () => {
    props.setActiveColumns(Array.from(activeColumns));
    props.onHide();
  };

  return (
    <OnyxModal size="lg" show={props.show} onHide={props.onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Columns</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack gap={2}>
          <Stack direction="horizontal">
            <Form.Check
              className="me-auto"
              type="checkbox"
              id={`checkbox-select-all`}
              label={`${selectAll ? "Unselect All" : "Select All"} (${
                filteredColumns.length
              })`}
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <div style={{ width: "300px" }}>
              <Input
                {...props}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </Stack>
          <Card
            body
            className="h-100 overflow-auto"
            style={{ minHeight: "50vh", maxHeight: "50vh" }}
          >
            <Form>
              <Stack gap={2}>
                {filteredColumns.map((column) => (
                  <Form.Check
                    key={column.code}
                    type="checkbox"
                    id={`checkbox-${column.code}`}
                    label={<FieldDetails {...props} field={column.code} />}
                    checked={activeColumns.has(column.code)}
                    onChange={(e) =>
                      handleSelectChange(column.code, e.target.checked)
                    }
                  />
                ))}
              </Stack>
            </Form>
          </Card>
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="me-auto"
          variant="secondary"
          onClick={() => {
            setActiveColumns(new Set(props.defaultColumns));
            setSelectAll(false);
            setSearch("");
          }}
        >
          Reset to Defaults
        </Button>
        <span className="text-muted px-2">{activeColumnsMessage}</span>
        <Button variant="secondary" onClick={props.onHide}>
          Cancel
        </Button>
        <Button onClick={handleApply}>Apply</Button>
      </Modal.Footer>
    </OnyxModal>
  );
}

export default ColumnsModal;
