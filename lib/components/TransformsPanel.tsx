import { useState } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import NavDropdown from "react-bootstrap/NavDropdown";
import Stack from "react-bootstrap/Stack";
import { MdClear, MdCreate, MdDelete } from "react-icons/md";
import { DataProps } from "../interfaces";
import Transforms from "./Transforms";
import RemoveAllModal from "./RemoveAllModal";

interface TransformsPanelProps extends DataProps {
  transform: string;
  setTransform: (value: string) => void;
  transformList: string[];
  setTransformList: (value: string[]) => void;
  filterFieldOptions: string[];
  listFieldOptions: string[];
}

function TransformsPanel(props: TransformsPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [removeAllModalShow, setRemoveAllModalShow] = useState(false);

  const handleTransformsChange = (action: string) => {
    props.setTransform(action);
    props.setTransformList([]);
  };

  const handleTransformRemove = (index: number) => {
    const list = [...props.transformList];
    list.splice(index, 1);
    props.setTransformList(list);
  };

  const handleTransformRemoveAll = () => {
    setEditMode(false);
    props.setTransformList([]);
  };

  return (
    <Card className="h-100 overflow-y-auto">
      <RemoveAllModal
        show={removeAllModalShow}
        onHide={() => setRemoveAllModalShow(false)}
        item={`${props.transform}d Fields`}
        handleRemove={handleTransformRemoveAll}
      />
      <Card.Header>
        <Stack direction="horizontal" gap={1}>
          <NavDropdown className="me-auto" title={props.transform}>
            {["Summarise", "Include", "Exclude"].map((action) => (
              <NavDropdown.Item
                key={action}
                onClick={() => handleTransformsChange(action)}
              >
                {action}
              </NavDropdown.Item>
            ))}
          </NavDropdown>
          <Button
            size="sm"
            variant="dark"
            title="Edit Fields"
            onClick={() => setEditMode(true)}
          >
            <MdCreate />
          </Button>
          <Button
            size="sm"
            variant="dark"
            title="Remove All Fields"
            onClick={() => setRemoveAllModalShow(true)}
          >
            <MdDelete />
          </Button>
        </Stack>
      </Card.Header>
      <Card.Body className="h-100 p-2 overflow-y-auto">
        {editMode ? (
          <Transforms
            {...props}
            transform={props.transform}
            transformList={props.transformList}
            setTransformList={props.setTransformList}
            filterFieldOptions={props.filterFieldOptions}
            listFieldOptions={props.listFieldOptions}
            setEditMode={setEditMode}
          />
        ) : (
          <Stack gap={2}>
            {props.transformList.map((transform, index) => (
              <Container key={transform} fluid className="g-0">
                <ButtonGroup size="sm">
                  <Button variant="dark" onClick={() => setEditMode(true)}>
                    <span className="onyx-text-pink font-monospace">
                      {transform}
                    </span>
                  </Button>
                  <Button
                    variant="dark"
                    title="Remove Field"
                    onClick={() => handleTransformRemove(index)}
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

export default TransformsPanel;
