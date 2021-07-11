import React from "react";
import ReactDOM from "react-dom";
import App from "../app/app";
import axios from 'axios';
import "./index.css";

console.log('========================================')
console.log('axios:', axios)
console.log('========================================')


ReactDOM.render(<App />, document.querySelector("#root"));
