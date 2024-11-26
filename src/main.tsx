import React from "react";
import ReactDOM from "react-dom";
import Onyx from "../lib/Onyx.tsx";
import { httpPathHandler, fileWriter, s3PathHandler } from "./handlers.tsx";

import "./font.css";

ReactDOM.render(
  <React.StrictMode>
    <Onyx
      httpPathHandler={httpPathHandler}
      s3PathHandler={s3PathHandler}
      fileWriter={fileWriter}
    />
  </React.StrictMode>,
  document.getElementById("root")
);
