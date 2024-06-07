import Form from "react-bootstrap/Form";
import Creatable from "react-select/creatable";
import getStyles from "./styles";

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
    <Form.Control value={value} placeholder={placeholder} onChange={onChange} />
  );
}

function MultiInput({
  value,
  limit,
  onChange,
  darkMode,
}: {
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
      noOptionsMessage={() => "Enter a value"}
      placeholder=""
    />
  );
}

export { Input, MultiInput };
