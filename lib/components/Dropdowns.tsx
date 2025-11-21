import Select, { components, OptionProps } from "react-select";
import { useChoicesQuery } from "../api";
import { useChoiceDescriptions } from "../api/hooks";
import { ProjectProps } from "../interfaces";
import { SelectOption } from "../types";
import { selectStyles } from "../utils/styles";

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

interface GenericChoiceProps extends ProjectProps {
  field: string;
}

interface ChoiceProps extends DropdownProps, GenericChoiceProps {}

interface MultiChoiceProps extends MultiDropdownProps, GenericChoiceProps {}

const Option = (props: OptionProps) => {
  const splitLabel = props.label.split("|", 2);

  return (
    <div className="onyx">
      <small>
        <components.Option {...props}>
          {splitLabel.length > 0 && <div>{splitLabel[0]}</div>}
          {splitLabel.length > 1 && (
            <div
              style={{
                color: "var(--onyx-dropdown-option-description-color)",
                fontSize: "0.75rem",
              }}
            >
              {splitLabel[1]}
            </div>
          )}
        </components.Option>
      </small>
    </div>
  );
};

const getLabel = (option: string, titles?: Map<string, string>) =>
  option + (titles?.get(option) ? ` | ${titles?.get(option)}` : "");

function Dropdown(props: DropdownProps) {
  return (
    <Select
      classNames={{ menuPortal: () => "onyx" }}
      menuPosition="fixed"
      isClearable={props.isClearable}
      minMenuHeight={250}
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
                value: (e as SelectOption).value,
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
      classNames={{ menuPortal: () => "onyx" }}
      isMulti
      menuPosition="fixed"
      minMenuHeight={250}
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
            value: (e as SelectOption[])
              .map((option) => option.value)
              .join(","),
          },
        } as React.ChangeEvent<HTMLSelectElement>)
      }
      placeholder={props.placeholder || "Select values..."}
    />
  );
}

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

export { Choice, Dropdown, MultiChoice, MultiDropdown };
