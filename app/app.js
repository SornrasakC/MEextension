import React, { useEffect, useState, useReducer, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import withDOM, { withDOMGen, getTargetDOM } from "./utils/access";
import { unpackReducer } from "./utils/utils";

import domtoimage from "dom-to-image";

export default function App() {
    const [meta, setMeta] = useReducer(unpackReducer, {
        chapter: 0,
        title: "KoibitoMuriMuri",
        filenamePrefix: `KoibitoMuriMuri Ch.0`,
    });

    useEffect(() => {
        setMeta({ filenamePrefix: `${meta.title} Ch.${meta.chapter}` });
    }, [meta.chapter, meta.title]);

    const [pageRanges, setPageRanges] = useReducer(unpackReducer, {
        startPage: 0,
        endPage: 60,
    });

    const [res, setRes] = useState(0);
    useEffect(() => {
        console.log('========================================')
        console.log('RES EFFECT')
        console.log('res:', res)
        console.log('========================================')
        
    }, [res])

    const entry = async () => {
        const dom2Res = _withDOM2(setRes, () => {
            return 44444444;
        })

        console.log('========================================')
        console.log('dom2Res:', dom2Res)
        console.log('========================================')
        

        const nodeText = await _withDOM(() => {
            return 123123123;
            return document.getElementsByClassName("episode_title")[0].innerText;
        });
        console.log('========================================')
        console.log('nodeText:', nodeText)
        console.log('========================================')
        
        // console.log('========================================')
        // console.log('node.textContent.match(/\d+/)[0]:', node.textContent.match(/\d+/)[0])
        // console.log('========================================')

        const targetDOM = await getTargetDOM();

        console.log('========================================')
        console.log('targetDOM:', targetDOM)
        console.log('========================================')

        console.log('========================================')
        console.log('targetDom.getElementsByClassName("episode_title")[0]:', targetDom.getElementsByClassName("episode_title")[0])
        console.log('========================================')
        
        
        // const chapter = document.getElementsByClassName("episode_title")[0].textContent.match(/\d+/)[0];

        // console.log("========================================");
        // console.log("chapter:", chapter);
        // console.log("========================================");
    };

    return (
        <>
            <div className="container">
                <h1>MEextention</h1>

                <button
                    className="m-3 p-3"
                    onClick={() => {
                        entry();
                    }}
                >
                    Test
                </button>

                <button
                    className="m-3 p-3"
                    onClick={() => {
                        console.log("========================================");

                        console.log("========================================");
                    }}
                >
                    Test2
                </button>
            </div>
        </>
    );
}
