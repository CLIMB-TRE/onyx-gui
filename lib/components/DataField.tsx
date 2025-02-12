import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { RecordType } from "../types";

interface DataFieldProps {
  record: RecordType;
  field: string;
  name: string;
}

function DataField(props: DataFieldProps) {
  return (
    <Row>
      <Col md={6}>
        <h6>{props.name}:</h6>
      </Col>
      <Col md={6}>
        <span className="onyx-text-pink">
          {props.record[props.field]?.toString() || ""}
        </span>
      </Col>
    </Row>
  );
}

export default DataField;
