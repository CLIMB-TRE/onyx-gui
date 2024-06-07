import Select, { components, OptionProps } from "react-select";
import getStyles from "./styles";

function Dropdown({
  options,
  titles,
  value,
  onChange,
  darkMode,
}: {
  options: string[];
  titles?: Map<string, string>;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  darkMode: boolean;
}) {
  const Option = (props: OptionProps) => {
    return (
      <div
        data-toggle="tooltip"
        data-placement="top"
        title={titles?.get(props.label)}
      >
        <components.Option {...props} />
      </div>
    );
  };

  return (
    <Select
      components={{ Option }}
      menuPortalTarget={document.body}
      styles={getStyles(darkMode)}
      options={options.map((option) => ({
        value: option,
        label: option,
      }))}
      value={{
        value: value,
        label: value,
      }}
      onChange={(e) =>
        onChange({
          target: {
            value: e.value,
          },
        } as React.ChangeEvent<HTMLSelectElement>)
      }
      placeholder=""
    />
  );
}

function MultiDropdown({
  options,
  titles,
  value,
  onChange,
  darkMode,
}: {
  options: string[];
  titles?: Map<string, string>;
  value: string[];
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  darkMode: boolean;
}) {
  const Option = (props: OptionProps) => {
    return (
      <div
        data-toggle="tooltip"
        data-placement="top"
        title={titles?.get(props.label)}
      >
        <components.Option {...props} />
      </div>
    );
  };

  return (
    <Select
      isMulti
      closeMenuOnSelect={false}
      components={{ Option }}
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
      placeholder=""
    />
  );
}

export { Dropdown, MultiDropdown };
