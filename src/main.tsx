import React from "react";
import ReactDOM from "react-dom";
import Onyx from "../lib/Onyx.tsx";
import {
  enabled,
  fileWriter,
  httpPathHandler,
  s3PathHandler,
  extTheme,
  extVersion,
  getItem,
  setItem,
  setTitle,
} from "./handlers.tsx";

import "./main.css";

ReactDOM.render(
  <React.StrictMode>
    <Onyx
      enabled={enabled}
      httpPathHandler={httpPathHandler}
      s3PathHandler={s3PathHandler}
      fileWriter={fileWriter}
      extTheme={extTheme}
      extVersion={extVersion}
      getItem={getItem}
      setItem={setItem}
      setTitle={setTitle}
    />
  </React.StrictMode>,
  document.getElementById("root")
);
