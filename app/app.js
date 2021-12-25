import React, { useEffect, useState, useReducer } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import withDom, { withDomGen, useTargetDom, runContentScript } from "./utils/chrome/access";
import {
    executeSpeedBinbReaderScript,
    executeNicoDougaScript,
    executeComicWalkerScript,
} from "./handlers/entries/entry";
import { unpackReducer, timeout } from "./utils/utils";
import { setListener } from "./utils/chrome/access";

// import { messages } from "@extend-chrome/messages";

export default function App() {
    // const [targetDom, fetchTargetDom, isTargetDomReady] = useTargetDom();

    // messages.on((message, sender, sendResponse) => {
    //     if (message.greeting != "greeting from content-script.js") return;

    //     console.log("========================================");
    //     console.log(sender.id, "said hello");
    //     console.log("message:", message);
    //     console.log("========================================");

    //     // sendResponse({ farewell: "goodbye" });
    // });

    setListener((inp) => {
        console.log("========================================");
        console.log("inp:", inp);
        console.log("========================================");
    });

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

    const mainTest = async () => {
        console.log("mainTested");
        // runContentScript();
        // messages.send({
        //     greeting: "greeting from app.js",
        //     data: "",
        // });
    };

    return (
        <>
            <div className="container">
                <h1>MEextention</h1>

                <button
                    className="m-3 p-3"
                    onClick={() => {
                        mainTest();
                    }}
                >
                    MainTest
                </button>

                {/* <button
                    className="m-3 p-3"
                    onClick={() => {
                        fetchTargetDom();
                    }}
                >
                    FetchTargetDom
                </button> */}
                <hr />
                <button
                    className="m-3 p-3"
                    onClick={async () => {
                        await executeNicoDougaScript();
                    }}
                >
                    executeNicoDougaScript
                </button>

                <button
                    className="m-3 p-3"
                    onClick={() => {
                        executeSpeedBinbReaderScript();
                    }}
                >
                    executeSpeedBinbReaderScript
                </button>

                <button
                    className="m-3 p-3"
                    onClick={() => {
                        executeComicWalkerScript();
                    }}
                >
                    executeComicWalkerScript
                </button>
            </div>
        </>
    );
}
