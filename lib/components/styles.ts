import { StylesConfig } from "react-select";

const getStyles: (darkMode: boolean) => StylesConfig = (darkMode) => ({
  control: (styles) => ({
    ...styles,
    borderColor: darkMode ? "#495057" : "#dee2e6",
    backgroundColor: darkMode ? "#212529" : "white",
  }),
  menuPortal: (styles) => ({ ...styles, zIndex: 9999 }),
  menu: (styles) => ({
    ...styles,
    backgroundColor: darkMode ? "black" : "white",
  }),
  option: (styles, state) => ({
    ...styles,
    color: darkMode ? "white" : "black",
    backgroundColor: state.isFocused
      ? darkMode
        ? "#495057"
        : "#dee2e6"
      : darkMode
      ? "black"
      : "white",
  }),
  singleValue: (styles) => ({ ...styles, color: darkMode ? "white" : "black" }),
  input: (styles) => ({ ...styles, color: darkMode ? "white" : "black" }),
  multiValue: (styles) => {
    return {
      ...styles,
      backgroundColor: darkMode ? "#495057" : "#dee2e6",
    };
  },
  multiValueLabel: (styles) => ({
    ...styles,
    color: darkMode ? "white" : "black",
  }),
  multiValueRemove: (styles) => ({
    ...styles,
    ":hover": {
      backgroundColor: "red",
      color: "white",
    },
  }),
});

export default getStyles;
