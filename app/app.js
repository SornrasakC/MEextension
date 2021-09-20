import React, { useEffect, useState, useReducer } from "react";
import withDom, {
  withDomGen,
  useTargetDom,
  runContentScript,
} from "./utils/chrome/access";
import {
  executeSpeedBnbReaderScript,
  executeNicoDougaScript,
} from "./handlers/entries/entry";
import { unpackReducer, timeout } from "./utils/utils";
import { storageSet } from "./utils/chrome/storage";

import bgImage from "../static/assets/bg.png";
import ReaderSelector from "./component/ReaderSelector";
import Label from "./component/Label";
import つむぎ from "./component/つむぎ.js";
import Input from "./component/Input";
import Title from "./component/Title";
import BackgroundFilter from "./component/BackgroundFilter";

import { READERS } from "./utils/constants";

async function kaishi(reader, zipName, pageName) {
  return storageSet({ reader, zipName, pageName });
}

const readerOptions = [
  { key: READERS.NICO_DOUGA, value: READERS.NICO_DOUGA },
  { key: READERS.COMIC_WALKER, value: READERS.COMIC_WALKER },
  { key: READERS.SPEED_BINB, value: READERS.SPEED_BINB },
];

export default function App() {
  const [processState, setProcessState] = useState("success");
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
          }}
        >
          <BackgroundFilter>
            <section className="flex flex-col p-4">
              <Title>Mugyu Extractor</Title>
              <div
                id="reader-select"
                className="relative grid grid-cols-2 grid-rows-2 gap-2"
              >
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

            <section className="relative mt-4 min-h-full">
              <div className="relative -left-14 w-11/12">
                <つむぎ
                  className="filter drop-shadow-ideal transform scale-90 -translate-y-8"
                  state={processState}
                />
              </div>
              <p className="absolute p-2 w-1/3 top-20 right-6 rounded-md border-2 border-つむき border-opacity-60">
                むきゅ。。。いらっしゃいませ！。
              </p>
              <div className="absolute top-1/3 right-8">
                <button
                  type="submit"
                  className="rounded-md px-4 py-8 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white"
                >
                  開
                  <br />始
                </button>
              </div>
            </section>
          </BackgroundFilter>
        </form>
      </div>
    </>
  );
}
