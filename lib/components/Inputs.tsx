import React from "react";
import Form from "react-bootstrap/Form";
import Creatable from "react-select/creatable";
import selectStyles from "../utils/selectStyles";
import { OptionType } from "../types";

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
  darkMode,
}: {
  value: string[];
  placeholder?: string;
  limit?: number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  darkMode: boolean;
}) {
  return (
    <Creatable
      isMulti
      menuPortalTarget={document.body}
      styles={selectStyles(darkMode)}
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

export { Input, MultiInput };
