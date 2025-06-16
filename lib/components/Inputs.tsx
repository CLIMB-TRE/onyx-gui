import React, { useState } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Creatable from "react-select/creatable";
import { SelectOption } from "../types";
import { selectStyles } from "../utils/styles";

function Input({
  type,
  value,
  placeholder,
  onChange,
}: {
  type?: string;
  value: string;
  placeholder?: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <Form.Control
      type={type}
      value={value}
      placeholder={placeholder || "Enter value..."}
      onChange={onChange}
    />
  );
}

function MultiInput({
  value,
  placeholder,
  limit,
  onChange,
}: {
  value: string[];
  placeholder?: string;
  limit?: number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <Creatable
      isMulti
      menuPosition="fixed"
      menuPortalTarget={document.body}
      styles={selectStyles}
      value={value.map((option) => ({
        value: option,
        label: option,
      }))}
      delimiter=","
      onChange={(e) =>
        onChange({
          target: {
            value: (e as SelectOption[])
              .map((option) => option.value)
              .join(","),
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }
      isOptionDisabled={() => !(limit === undefined || value.length < limit)}
      noOptionsMessage={() => "Create a new value..."}
      placeholder={placeholder || "Enter values..."}
    />
  );
}

function RangeInput({
  type,
  from,
  to,
  placeholder,
  onChange,
}: {
  type?: string;
  from: string;
  to: string;
  placeholder?: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const [fromValue, setFromValue] = useState(from);
  const [toValue, setToValue] = useState(to);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromValue(e.target.value);
    onChange({
      target: {
        value: [e.target.value, toValue].join(","),
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToValue(e.target.value);
    onChange({
      target: {
        value: [fromValue, e.target.value].join(","),
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <Row className="g-2">
      <Col className="mb-2">
        <Form.Group>
          <Form.Label>From</Form.Label>
          <Form.Control
            type={type}
            value={from}
            placeholder={placeholder || "Enter value..."}
            onChange={handleFromChange}
          />
        </Form.Group>
      </Col>
      <Col className="mb-2">
        <Form.Group>
          <Form.Label>To</Form.Label>
          <Form.Control
            type={type}
            value={to}
            placeholder={placeholder || "Enter value..."}
            onChange={handleToChange}
          />
        </Form.Group>
      </Col>
    </Row>
  );
}

export { Input, MultiInput, RangeInput };
