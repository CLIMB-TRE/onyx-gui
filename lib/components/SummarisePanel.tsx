import { useState } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { MdClear, MdCreate, MdDelete } from "react-icons/md";
import { DataProps } from "../interfaces";
import Summarise from "./Summarise";
import RemoveAllModal from "./RemoveAllModal";

interface SummarisePanelProps extends DataProps {
  summariseList: string[];
  setSummariseList: (value: string[]) => void;
  filterFieldOptions: string[];
}

function SummarisePanel(props: SummarisePanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [removeAllModalShow, setRemoveAllModalShow] = useState(false);

  const handleSummariseRemove = (index: number) => {
    const list = [...props.summariseList];
    list.splice(index, 1);
    props.setSummariseList(list);
  };

  const handleSummariseRemoveAll = () => {
    setEditMode(false);
    props.setSummariseList([]);
  };

  return (
    <Card className="h-100 overflow-y-auto">
      <RemoveAllModal
        show={removeAllModalShow}
        onHide={() => setRemoveAllModalShow(false)}
        item={"Summarised Fields"}
        handleRemove={handleSummariseRemoveAll}
      />
      <Card.Header>
        <Stack direction="horizontal" gap={1}>
          <span className="me-auto">Summarise</span>
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
          <Summarise
            {...props}
            summariseList={props.summariseList}
            setSummariseList={props.setSummariseList}
            filterFieldOptions={props.filterFieldOptions}
            setEditMode={setEditMode}
          />
        ) : (
          <Stack gap={2}>
            {props.summariseList.map((field, index) => (
              <Container key={field} fluid className="g-0">
                <ButtonGroup size="sm">
                  <Button variant="dark" onClick={() => setEditMode(true)}>
                    <span className="onyx-text-pink font-monospace">
                      {field}
                    </span>
                  </Button>
                  <Button
                    variant="dark"
                    title="Remove Field"
                    onClick={() => handleSummariseRemove(index)}
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

export default SummarisePanel;
