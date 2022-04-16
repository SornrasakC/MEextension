import React, { useEffect, useState, useReducer } from "react";
import {
    executeSpeedBinbReaderScript,
    executeNicoDougaScript,
    executeComicWalkerScript,
    executeComicPixivScript,
    executeKindleScript
} from "./handlers/entries/entry";
import { unpackReducer, timeout } from "./utils/utils";
import { storageSet } from "./utils/chrome/storage";
import { setListener } from "./utils/chrome/access";

import bgImage from "../static/assets/bg.png";
import ReaderSelector from "./component/ReaderSelector";
import Label from "./component/Label";
import Tsumugi from "./component/Tsumugi.js";
import Input from "./component/Input";
import Title from "./component/Title";

import { READERS, PROGRESS_STATUS } from "./utils/constants";
import { useFrontState } from "./context/FrontStateContext";
import Dialog from "./component/Dialog";

async function kaishi(reader, zipName, pageName) {
    return storageSet({ reader, zipName, pageName });
}

const readerOptions = [
    { key: READERS.NICO_DOUGA, value: READERS.NICO_DOUGA },
    { key: READERS.COMIC_WALKER, value: READERS.COMIC_WALKER },
    { key: READERS.SPEED_BINB, value: READERS.SPEED_BINB },
    { key: READERS.COMIC_PIXIV, value: READERS.COMIC_PIXIV },
    { key: READERS.KINDLE, value: READERS.KINDLE },
];

export default function App() {
    const [_, action] = useFrontState();
    const [reader, setReader] = useState(readerOptions[0].key);

    const [meta, setMeta] = useReducer(unpackReducer, {
        chapter: 0,
        title: "KoibitoMuriMuri",
        filenamePrefix: `KoibitoMuriMuri Ch.0`,
    });

    const [pageRanges, setPageRanges] = useReducer(unpackReducer, {
        startPage: 0,
        endPage: 60,
    });

    useEffect(() => {
        setListener((msg) => {
            const { status } = msg;
            if (status === PROGRESS_STATUS.READING || status === PROGRESS_STATUS.FINALIZING) {
                action.toProcessing();
            } else if (status === PROGRESS_STATUS.FINISHED) {
                action.toFinish();
            } else {
                action.toIdle();
            }
        });
    }, []);

    useEffect(() => {
        // TODO: Uncomment this line in production mode
        // setMeta({ filenamePrefix: `${meta.title} Ch.${meta.chapter}` });
    }, [meta.chapter, meta.title]);

    return (
        <>
            <div
                className="relative overflow-hidden h-full"
                style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: `cover`,
                    backgroundPosition: `90% 40%`,
                }}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        // handle submit form
                        if (reader === READERS.NICO_DOUGA) {
                            executeNicoDougaScript();
                        } else if (reader === READERS.SPEED_BINB) {
                            executeSpeedBinbReaderScript();
                        } else if (reader === READERS.COMIC_WALKER) {
                            executeComicWalkerScript();
                        } else if (reader === READERS.COMIC_PIXIV) {
                            executeComicPixivScript();
                        } else if (reader === READERS.KINDLE) {
                            executeKindleScript();
                        } else return;
                    }}
                >
                    <div
                        style={{
                            height: "650px",
                        }}
                        className={`relative backdrop-filter backdrop-blur-md backdrop-brightness-80 flex flex-col p-4`}
                    >
                        <section>
                            <Title>Mugyu Extractor</Title>
                            <div id="reader-select" className="relative grid grid-cols-2 grid-rows-2 gap-2">
                                <div className="row-start-1 row-end-2 col-start-1 col-end-3 flex flex-col">
                                    <Label htmlFor="reader">リーダー</Label>
                                    <ReaderSelector
                                        onChange={(e) => setReader(e.target.value)}
                                        value={reader}
                                        options={readerOptions}
                                    />
                                </div>
                                <div className="row-start-2 row-end-3 col-start-1 col-end-2 flex flex-col">
                                    <Label htmlFor="zip-name">シップ　名</Label>
                                    <Input
                                        name="zip-name"
                                        type="text"
                                        placeholder="{Title}-{Chapter}"
                                        className="px-1 rounded-sm focus:outline-none"
                                    />
                                </div>
                                <div className="row-start-2 row-end-3 col-start-2 col-end-3 flex flex-col">
                                    <Label htmlFor="page-name">ページ　名</Label>
                                    <Input
                                        name="page-name"
                                        type="text"
                                        placeholder="{Chapter}-{PageNum}"
                                        className="px-1 rounded-sm focus:outline-none"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="min-h-full">
                            <div className="absolute right-20 -left-20 top-1/3">
                                <Tsumugi />
                            </div>
                            <div className="absolute right-5 top-1/3 m-3">
                                <Dialog />
                            </div>
                            <div className="absolute left-3/4 top-2/3">
                                <button
                                    type="submit"
                                    className="border-2 border-pink-300 rounded-md px-4 py-8 bg-gradient-to-br from-blue-400  to-green-300 text-white shadow-md transform -translate-x-1 -translate-y-1"
                                >
                                    開
                                    <br />始
                                </button>
                            </div>
                        </section>
                    </div>
                </form>
            </div>
        </>
    );
}

// <div className="relative -left-14 w-11/12">
//   <Tsumugi />
// </div>
// <div className="absolute z-20 top-0 right-0 left-0 w-full">
//   <Dialog />
// </div>
// <div className="absolute top-2/4 right-8">
//   <button
//     type="submit"
//     className="rounded-md px-4 py-8 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white"
//   >
//     開
//     <br />始
//   </button>
// </div>
