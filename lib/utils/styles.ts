import { StylesConfig } from "react-select";
import { Template } from "plotly.js-basic-dist";
import { DarkModeColours } from "../types";

const selectStyles: StylesConfig = {
  control: (styles) => ({
    ...styles,
    borderColor: "var(--onyx-dropdown-control-border-color)",
    backgroundColor: "var(--onyx-dropdown-control-background-color)",
  }),
  menuPortal: (styles) => ({
    ...styles,
    zIndex: 9999,
    fontSize: "var(--bs-body-font-size)",
    fontFamily: "var(--onyx-body-font-family)",
  }),
  menu: (styles) => ({
    ...styles,
    width: "100%",
    backgroundColor: "var(--onyx-dropdown-menu-background-color)",
  }),
  option: (styles, state) => ({
    ...styles,
    color: "var(--onyx-dropdown-label-color)",
    backgroundColor: state.isFocused
      ? "var(--onyx-dropdown-option-hover-background-color)"
      : "var(--onyx-dropdown-option-background-color)",
  }),
  singleValue: (styles) => ({
    ...styles,
    color: "var(--onyx-dropdown-label-color)",
  }),
  input: (styles) => ({ ...styles, color: "var(--onyx-dropdown-label-color)" }),
  multiValue: (styles) => {
    return {
      ...styles,
      backgroundColor: "var(--onyx-dropdown-multivalue-label-background-color)",
    };
  },
  multiValueLabel: (styles) => ({
    ...styles,
    color: "var(--onyx-dropdown-label-color)",
  }),
  multiValueRemove: (styles) => ({
    ...styles,
    ":hover": {
      backgroundColor: "var(--bs-red)",
      color: "var(--bs-white)",
    },
  }),
  placeholder: (styles) => ({
    ...styles,
    color: "var(--bs-secondary-color)",
  }),
};

const graphStyles: Template = {
  layout: {
    font: {
      color: DarkModeColours.BS_BODY_COLOR,
    },
    paper_bgcolor: DarkModeColours.BS_BODY_BG,
    plot_bgcolor: DarkModeColours.BS_BODY_BG,
    xaxis: {
      gridcolor: DarkModeColours.BS_GRAY_900,
      zerolinecolor: DarkModeColours.BS_GRAY_600,
    },
    yaxis: {
      gridcolor: DarkModeColours.BS_GRAY_900,
      zerolinecolor: DarkModeColours.BS_GRAY_600,
    },
  },
};

export { graphStyles, selectStyles };
