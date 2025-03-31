import React, { useState } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Creatable from "react-select/creatable";
import { OptionType } from "../types";
import { selectStyles } from "../utils/styles";

function Input({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <Form.Control
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
            value: (e as OptionType[]).map((option) => option.value).join(","),
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
  from,
  to,
  placeholder,
  onChange,
}: {
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
      <Form.Group className="mb-2" as={Col}>
        <Form.Label>From</Form.Label>
        <Form.Control
          value={from}
          placeholder={placeholder || "Enter value..."}
          onChange={handleFromChange}
        />
      </Form.Group>
      <Form.Group className="mb-2" as={Col}>
        <Form.Label>To</Form.Label>
        <Form.Control
          value={to}
          placeholder={placeholder || "Enter value..."}
          onChange={handleToChange}
        />
      </Form.Group>
    </Row>
  );
}

export { Input, MultiInput, RangeInput };
