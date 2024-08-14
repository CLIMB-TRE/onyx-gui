import React from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import NavDropdown from "react-bootstrap/NavDropdown";
import { MultiDropdown } from "./Dropdowns";
import { DataProps } from "../interfaces";

interface TransformsPanelProps extends DataProps {
  transform: string;
  setTransform: (value: string) => void;
  transformList: string[];
  setTransformList: (value: string[]) => void;
  filterFieldOptions: string[];
  listFieldOptions: string[];
}

function TransformsPanel(props: TransformsPanelProps) {
  const handleTransformChange = (action: string) => {
    props.setTransform(action);
    props.setTransformList([]);
  };

  const handleTransformListChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    props.setTransformList(e.target.value ? e.target.value.split(",") : []);
  };

  return (
    <Card>
      <Card.Header>
        <NavDropdown title={props.transform}>
          {["Summarise", "Include", "Exclude"].map((action) => (
            <NavDropdown.Item
              key={action}
              onClick={() => handleTransformChange(action)}
            >
              {action}
            </NavDropdown.Item>
          ))}
        </NavDropdown>
      </Card.Header>
      <Container fluid className="onyx-parameters-panel-body p-2">
        <MultiDropdown
          options={
            props.transform === "Summarise"
              ? props.filterFieldOptions
              : props.listFieldOptions
          }
          titles={props.fieldDescriptions}
          value={props.transformList}
          placeholder={`${props.transform} fields...`}
          onChange={handleTransformListChange}
        />
      </Container>
    </Card>
  );
}

export default TransformsPanel;
