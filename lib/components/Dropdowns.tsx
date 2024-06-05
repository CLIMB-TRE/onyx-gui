import Form from "react-bootstrap/Form";
import Select from "react-select";

function Dropdown({
  options,
  titles,
  value,
  onChange,
}: {
  options: string[];
  titles?: Map<string, string>;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <Form.Select value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option} value={option} title={titles?.get(option)}>
          {option}
        </option>
      ))}
    </Form.Select>
  );
}

function MultiDropdown({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <Select
      isMulti
      menuPortalTarget={document.body}
      styles={{
        control: (styles) => ({ ...styles, backgroundColor: "dark-grey" }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        menu: (base) => ({ ...base, backgroundColor: "black" }),
        option: (base, state) => ({
          ...base,
          color: "white",
          backgroundColor: state.isFocused ? "blue" : "black",
        }),
      }}
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
    />
  );
}

export { Dropdown, MultiDropdown };
