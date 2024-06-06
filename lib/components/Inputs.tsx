import Form from "react-bootstrap/Form";
import Creatable from "react-select/creatable";
import getStyles from "./styles";

function Input({
  type,
  value,
  placeholder,
  onChange,
}: {
  type: string;
  value: string;
  placeholder: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <Form.Control
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
    />
  );
}

function MultiInput({
  options,
  value,
  limit,
  onChange,
  darkMode,
}: {
  options: string[];
  value: string[];
  limit?: number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  darkMode: boolean;
}) {
  return (
    <Creatable
      isMulti
      menuPortalTarget={document.body}
      styles={getStyles(darkMode)}
      options={options.map((option) => ({
        value: option,
        label: option,
      }))}
      value={value.map((option) => ({
        value: option,
        label: option,
      }))}
      delimiter=","
      onChange={(e) =>
        onChange({
          target: {
            value: e.map((option) => option.value).join(","),
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }
      isOptionDisabled={() => !(limit === undefined || value.length < limit)}
    />
  );
}

export { Input, MultiInput };
