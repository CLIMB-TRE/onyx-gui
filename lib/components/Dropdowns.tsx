import React from "react";
import Select, { components, OptionProps } from "react-select";
import { useQuery } from "@tanstack/react-query";
import selectStyles from "../utils/selectStyles";
import { OptionType } from "../types";

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

interface GenericChoiceProps {
  project: string;
  field: string;
  httpPathHandler: (path: string) => Promise<Response>;
}

interface ChoiceProps extends DropdownProps, GenericChoiceProps {}

interface MultiChoiceProps extends MultiDropdownProps, GenericChoiceProps {}

const Option = (optionProps: OptionProps) => {
  return (
    <code>
      <components.Option {...optionProps} />
    </code>
  );
};

const getLabel = (option: string, titles?: Map<string, string>) =>
  option + (titles?.get(option) ? ` | ${titles?.get(option)}` : "");

function Dropdown(props: DropdownProps) {
  return (
    <Select
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

const useChoiceQuery = (props: GenericChoiceProps) => {
  // Fetch choices and their descriptions
  return useQuery({
    queryKey: ["choices", props.project, props.field],
    queryFn: async () => {
      return props
        .httpPathHandler(`projects/${props.project}/choices/${props.field}/`)
        .then((response) => response.json())
        .then((data) => {
          const choices = new Map(
            Object.entries(data.data).map(([choice, choiceInfo]) => [
              choice,
              (choiceInfo as { description: string }).description,
            ])
          );
          return choices;
        });
    },
    staleTime: 5 * 60 * 1000,
  });
};

function Choice(props: ChoiceProps) {
  const { data: choiceDescriptions } = useChoiceQuery(props);
  return <Dropdown {...props} titles={choiceDescriptions} />;
}

function MultiChoice(props: MultiChoiceProps) {
  const { data: choiceDescriptions } = useChoiceQuery(props);
  return <MultiDropdown {...props} titles={choiceDescriptions} />;
}

export { Dropdown, MultiDropdown, Choice, MultiChoice };
