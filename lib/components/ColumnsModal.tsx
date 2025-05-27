import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import Modal from "react-bootstrap/Modal";
import Card from "react-bootstrap/Card";
import { DataProps } from "../interfaces";

interface ColumnsModalProps extends DataProps {
  show: boolean;
  onHide: () => void;
  columnOptions: string[];
  columnList: string[];
  setColumnList: (value: string[]) => void;
}

interface FieldProps extends DataProps {
  field: string;
}

function Field(props: FieldProps) {
  return (
    <small>
      <Stack gap={1}>
        <b>{props.field}</b>
        <div className="text-muted">
          {props.projectFields.get(props.field)?.description}
        </div>
      </Stack>
    </small>
  );
}

// TODO: Mounted on enter ??

function ColumnsModal(props: ColumnsModalProps) {
  const [switchAll, setCheckedAll] = useState(false);
  const [checkedList, setCheckedList] = useState(
    props.columnOptions.map((field) => ({
      field,
      isChecked: props.columnList.includes(field),
    }))
  );

  // Update checkedList when columnOptions or columnList changes
  // TODO: Dont use an effect
  useEffect(() => {
    setCheckedList(
      props.columnOptions.map((field) => ({
        field,
        isChecked: props.columnList.includes(field),
      }))
    );
  }, [props.columnOptions, props.columnList]);

  const handleApply = () => {
    const updatedColumnList = checkedList
      .filter((item) => item.isChecked)
      .map((item) => item.field);
    props.setColumnList(updatedColumnList);
    props.onHide();
  };

  return (
    <Modal
      className="onyx-modal"
      centered
      show={props.show}
      onHide={props.onHide}
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit Columns</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack gap={2}>
          <Stack direction="horizontal" gap={2}>
            <Form.Check
              type="checkbox"
              id={`checkbox-select-all`}
              label={switchAll ? "Unselect All" : "Select All"}
              checked={switchAll}
              onChange={(e) => {
                setCheckedAll(e.target.checked);
                const updatedCheckedList = checkedList.map((item) => ({
                  ...item,
                  isChecked: e.target.checked,
                }));
                setCheckedList(updatedCheckedList);
              }}
            />
          </Stack>
          <Card
            body
            className="h-100 overflow-auto"
            style={{ maxHeight: "50vh" }}
          >
            <Form>
              <Stack gap={2}>
                {checkedList.map((checked) => (
                  <Form.Check
                    key={checked.field}
                    type="checkbox"
                    id={`checkbox-${checked.field}`}
                    label={<Field {...props} field={checked.field} />}
                    checked={checked.isChecked}
                    onChange={(e) => {
                      const updatedCheckedList = checkedList.map((item) =>
                        item.field === checked.field
                          ? { ...item, isChecked: e.target.checked }
                          : item
                      );
                      setCheckedList(updatedCheckedList);
                    }}
                  />
                ))}
              </Stack>
            </Form>
          </Card>
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={props.onHide}>
          Cancel
        </Button>
        <Button onClick={handleApply}>Apply</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ColumnsModal;
