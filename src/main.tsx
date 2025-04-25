import React from "react";
import ReactDOM from "react-dom";
import Onyx from "../lib/Onyx.tsx";
import {
  fileWriter,
  httpPathHandler,
  s3PathHandler,
  extVersion,
} from "./handlers.tsx";

import "./font.css";

ReactDOM.render(
  <React.StrictMode>
    <Onyx
      httpPathHandler={httpPathHandler}
      s3PathHandler={s3PathHandler}
      fileWriter={fileWriter}
      extVersion={extVersion}
    />
  </React.StrictMode>,
  document.getElementById("root")
);
