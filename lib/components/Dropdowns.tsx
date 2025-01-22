import React, { useMemo } from "react";
import Select, { components, OptionProps } from "react-select";
import { useChoicesQuery } from "../api";
import selectStyles from "../utils/selectStyles";
import { PageProps } from "../interfaces";
import { ErrorResponse, OptionType, ChoicesResponse } from "../types";

interface GenericDropdownProps {
  options: string[];
  titles?: Map<string, string>;
  placeholder?: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}

interface DropdownProps extends GenericDropdownProps {
  value: string;
  isClearable?: boolean;
  isDisabled?: boolean;
}

interface MultiDropdownProps extends GenericDropdownProps {
  value: string[];
}

interface GenericChoiceProps extends PageProps {
  field: string;
}

interface ChoiceProps extends DropdownProps, GenericChoiceProps {}

interface MultiChoiceProps extends MultiDropdownProps, GenericChoiceProps {}

const Option = (optionProps: OptionProps) => {
  const splitLabel = optionProps.label.split("|", 2);

  return (
    <small>
      <components.Option {...optionProps}>
        {splitLabel.length > 0 && <div>{splitLabel[0]}</div>}
        {splitLabel.length > 1 && (
          <div
            style={{ color: "var(--onyx-dropdown-option-description-color)" }}
          >
            {splitLabel[1]}
          </div>
        )}
      </components.Option>
    </small>
  );
};

const getLabel = (option: string, titles?: Map<string, string>) =>
  option + (titles?.get(option) ? ` | ${titles?.get(option)}` : "");

function Dropdown(props: DropdownProps) {
  return (
    <Select
      menuPosition="fixed"
      isClearable={props.isClearable}
      isDisabled={props.isDisabled}
      components={{ Option }}
      menuPortalTarget={document.body}
      styles={selectStyles}
      options={props.options.map((option) => ({
        value: option,
        label: getLabel(option, props.titles),
      }))}
      value={
        props.value
          ? {
              value: props.value,
              label: props.value,
            }
          : null
      }
      onChange={(e) =>
        !e
          ? props.onChange({
              target: {
                value: "",
              },
            } as React.ChangeEvent<HTMLSelectElement>)
          : props.onChange({
              target: {
                value: (e as OptionType).value,
              },
            } as React.ChangeEvent<HTMLSelectElement>)
      }
      placeholder={props.placeholder || "Select value..."}
    />
  );
}

function MultiDropdown(props: MultiDropdownProps) {
  return (
    <Select
      isMulti
      menuPosition="fixed"
      closeMenuOnSelect={false}
      components={{ Option }}
      menuPortalTarget={document.body}
      styles={selectStyles}
      options={props.options.map((option) => ({
        value: option,
        label: getLabel(option, props.titles),
      }))}
      value={props.value.map((option) => ({
        value: option,
        label: option,
      }))}
      delimiter=","
      onChange={(e) =>
        props.onChange({
          target: {
            value: (e as OptionType[]).map((option) => option.value).join(","),
          },
        } as React.ChangeEvent<HTMLSelectElement>)
      }
      placeholder={props.placeholder || "Select values..."}
    />
  );
}

const useChoiceDescriptions = (data: ChoicesResponse | ErrorResponse) => {
  // Get a map of choices to their descriptions
  return useMemo(() => {
    if (data?.status !== "success") return new Map<string, string>();
    return new Map(
      Object.entries(data.data).map(([choice, description]) => [
        choice,
        description.description,
      ])
    );
  }, [data]);
};

function Choice(props: ChoiceProps) {
  const { data } = useChoicesQuery(props);
  const choiceDescriptions = useChoiceDescriptions(data);
  return <Dropdown {...props} titles={choiceDescriptions} />;
}

function MultiChoice(props: MultiChoiceProps) {
  const { data } = useChoicesQuery(props);
  const choiceDescriptions = useChoiceDescriptions(data);
  return <MultiDropdown {...props} titles={choiceDescriptions} />;
}

export { Dropdown, MultiDropdown, Choice, MultiChoice };
