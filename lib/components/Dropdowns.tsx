import React from "react";
import Select, { components, OptionProps } from "react-select";
import getStyles from "./styles";

type OptionType = { label: string; value: string };

function Dropdown({
  isClearable = false,
  options,
  titles,
  value,
  placeholder,
  onChange,
  darkMode,
}: {
  isClearable?: boolean;
  options: string[];
  titles?: Map<string, string>;
  value: string;
  placeholder?: string;
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
      isClearable={isClearable}
      components={{ Option }}
      menuPortalTarget={document.body}
      styles={getStyles(darkMode)}
      options={options.map((option) => ({
        value: option,
        label: option,
      }))}
      value={
        value
          ? {
              value: value,
              label: value,
            }
          : null
      }
      onChange={(e) =>
        !e
          ? onChange({
              target: {
                value: "",
              },
            } as React.ChangeEvent<HTMLSelectElement>)
          : onChange({
              target: {
                value: (e as OptionType).value,
              },
            } as React.ChangeEvent<HTMLSelectElement>)
      }
      placeholder={placeholder || "Select value..."}
    />
  );
}

function MultiDropdown({
  options,
  titles,
  value,
  placeholder,
  onChange,
  darkMode,
}: {
  options: string[];
  titles?: Map<string, string>;
  value: string[];
  placeholder?: string;
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
            value: (e as OptionType[]).map((option) => option.value).join(","),
          },
        } as React.ChangeEvent<HTMLSelectElement>)
      }
      placeholder={placeholder || "Select values..."}
    />
  );
}

export { Dropdown, MultiDropdown };
