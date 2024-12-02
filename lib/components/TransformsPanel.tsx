import { useState, useLayoutEffect } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Card from "react-bootstrap/Card";
import Transforms from "./Transforms";
import NavDropdown from "react-bootstrap/NavDropdown";
import { DataProps } from "../interfaces";
import { MdCreate, MdClear } from "react-icons/md";

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

  // Clear parameters when project changes
  useLayoutEffect(() => {
    setEditMode(false);
  }, [props.project]);

  const handleTransformsChange = (action: string) => {
    props.setTransform(action);
    props.setTransformList([]);
  };

  const handleTransformRemove = (index: number) => {
    const list = [...props.transformList];
    list.splice(index, 1);
    props.setTransformList(list);
  };

  return (
    <Card className="h-100">
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
        </Stack>
      </Card.Header>
      <Container fluid className="overflow-y-scroll p-2 h-100">
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
              // TODO: Use transform key
              <Container key={index} fluid className="g-0">
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
      </Container>
    </Card>
  );
}

export default TransformsPanel;
