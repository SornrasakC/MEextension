import React from "react";
import ReactDOM from "react-dom";
import App from "../app/app";
import { FrontStateProvider } from "../app/context/FrontStateContext";
import "./index.css";

ReactDOM.render(
  <FrontStateProvider>
    <App />
  </FrontStateProvider>,
  document.querySelector("#root")
);
