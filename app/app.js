import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import withDOM from "./utils/access";

// import { DomToImage } from 'dom-to-image';
import axios from "axios";

export default function App() {
    return (
        <>
            <h1>MEextention</h1>

            <button
                className="m-3 p-3"
                onClick={withDOM(() => {
                    const CHAPTER = document.getElementsByClassName("episode_title")[0].textContent.match(/\d+/)[0];
                    console.log("======4==================================");
                    console.log("CHAPTER:", CHAPTER);
                    // console.log(`domtoimage`, DomToImage)
                    // console.log(`test`, test)
                    console.log(`React`, React);
                    console.log(`React.Component`, React.Component);
                    // console.log(`axios`, axios);
                    console.log("========================================");
                })}
            >
                Test
            </button>
        </>
    );
}
