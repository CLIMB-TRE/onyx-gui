import { StylesConfig } from "react-select";

// Bootstrap colours
const secondary = "var(--bs-secondary-color)";
const lightGrey = "var(--bs-gray-300)";
const midGrey = "var(--bs-gray-700)";
const darkGrey = "var(--bs-gray-900)";
const red = "var(--bs-red)";

const selectStyles: (darkMode: boolean) => StylesConfig = (darkMode) => ({
  control: (styles) => ({
    ...styles,
    borderColor: darkMode ? midGrey : lightGrey,
    backgroundColor: darkMode ? darkGrey : "white",
  }),
  menuPortal: (styles) => ({ ...styles, zIndex: 9999 }),
  menu: (styles) => ({
    ...styles,
    width: "100%",
    // width: "max-content",
    // minWidth: "100%",
    backgroundColor: darkMode ? "black" : "white",
  }),
  option: (styles, state) => ({
    ...styles,
    color: darkMode ? "white" : "black",
    backgroundColor: state.isFocused
      ? darkMode
        ? midGrey
        : lightGrey
      : darkMode
      ? "black"
      : "white",
  }),
  singleValue: (styles) => ({ ...styles, color: darkMode ? "white" : "black" }),
  input: (styles) => ({ ...styles, color: darkMode ? "white" : "black" }),
  multiValue: (styles) => {
    return {
      ...styles,
      backgroundColor: darkMode ? midGrey : lightGrey,
    };
  },
  multiValueLabel: (styles) => ({
    ...styles,
    color: darkMode ? "white" : "black",
  }),
  multiValueRemove: (styles) => ({
    ...styles,
    ":hover": {
      backgroundColor: red,
      color: "white",
    },
  }),
  placeholder: (styles) => ({
    ...styles,
    color: secondary,
  }),
});

export default selectStyles;
