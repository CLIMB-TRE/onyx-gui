import React from "react";
import ReactDOM from "react-dom/client";
import Onyx from "../lib/Onyx.tsx";
import httpPathHandler from "./handlers.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Onyx httpPathHandler={httpPathHandler} />
  </React.StrictMode>
);
