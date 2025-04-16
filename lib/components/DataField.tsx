import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

interface DataFieldProps {
  name: string;
  value: string | JSX.Element;
}

function DataField(props: DataFieldProps) {
  return (
    <Row className="my-1">
      <Col>
        <span>{props.name}:</span>
      </Col>
      <Col>
        <span className="onyx-text-pink">{props.value}</span>
      </Col>
    </Row>
  );
}

export default DataField;
