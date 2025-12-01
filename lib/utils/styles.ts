import { StylesConfig } from "react-select";
import { Template } from "plotly.js-basic-dist";
import { DarkModeColour } from "../types";

export const selectStyles: StylesConfig = {
  control: (styles) => ({
    ...styles,
    borderColor: "var(--onyx-dropdown-control-border-color)",
    backgroundColor: "var(--onyx-dropdown-control-background-color)",
  }),
  menuPortal: (styles) => ({
    ...styles,
    zIndex: 9999,
    fontSize: "var(--bs-body-font-size)",
    fontFamily: "var(--bs-body-font-family)",
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

export const graphStyles: Template = {
  layout: {
    font: {
      color: DarkModeColour.BS_BODY_COLOR,
    },
    paper_bgcolor: DarkModeColour.BS_BODY_BG,
    plot_bgcolor: DarkModeColour.BS_BODY_BG,
    xaxis: {
      gridcolor: DarkModeColour.BS_GRAY_900,
      zerolinecolor: DarkModeColour.BS_GRAY_600,
    },
    yaxis: {
      gridcolor: DarkModeColour.BS_GRAY_900,
      zerolinecolor: DarkModeColour.BS_GRAY_600,
    },
  },
};

// Plotly Dark24 Colour palette
export const dark24Palette = [
  "#2E91E5",
  "#E15F99",
  "#1CA71C",
  "#FB0D0D",
  "#DA16FF",
  "#222A2A",
  "#B68100",
  "#750D86",
  "#EB663B",
  "#511CFB",
  "#00A08B",
  "#FB00D1",
  "#FC0080",
  "#B2828D",
  "#6C7C32",
  "#778AAE",
  "#862A16",
  "#A777F1",
  "#620042",
  "#1616A7",
  "#DA60CA",
  "#6C4516",
  "#0D2A63",
  "#AF0038",
];
