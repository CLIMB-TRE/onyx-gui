import { StylesConfig } from "react-select";

const selectStyles: StylesConfig = {
  control: (styles) => ({
    ...styles,
    borderColor: "var(--onyx-dropdown-control-border-color)",
    backgroundColor: "var(--onyx-dropdown-control-background-color)",
  }),
  menuPortal: (styles) => ({ ...styles, zIndex: 9999 }),
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

const graphStyles = {
  layout: {
    font: {
      color: "#dee2e6", // bs-body-color
    },
    paper_bgcolor: "#121212", // bs-body-bg
    plot_bgcolor: "#121212", // bs-body-bg
    xaxis: {
      gridcolor: "#212529", // bs-gray-900
      zerolinecolor: "#6c757d", // bs-gray-600
    },
    yaxis: {
      gridcolor: "#212529", // bs-gray-900
      zerolinecolor: "#6c757d", // bs-gray-600
    },
  },
};

export { selectStyles, graphStyles };
