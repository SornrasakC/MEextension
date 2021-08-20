import React, { useEffect, useState, useReducer } from "react";
import "tailwindcss/tailwind.css";
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

import idealImage from "../static/assets/ideal.png";
import processingImage from "../static/assets/processing.png";
import successImage from "../static/assets/success.png";
import bgIamge from "../static/assets/bg.png";

export default function App() {
  const [meta, setMeta] = useReducer(unpackReducer, {
    chapter: 0,
    title: "KoibitoMuriMuri",
    filenamePrefix: `KoibitoMuriMuri Ch.0`,
  });

  useEffect(() => {
    // TODO: Uncomment this line in production mode
    // setMeta({ filenamePrefix: `${meta.title} Ch.${meta.chapter}` });
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

  const [processState, setProcessState] = useState("success");
  /// Testing
  //   const states = ["ideal", "processing", "success"];
  //   useEffect(() => {
  //     let i = 0;
  //     let interval = setInterval(() => {
  //       setProcessState(states[i]);
  //       i = (i + 1) % 3;
  //     }, 3000);
  //     return () => clearInterval(interval);
  //   }, []);

  const ディッブ = (props) => {
    return <div {...props}>{props.children}</div>;
  };
  const つむぎ = ({ className, state }) => {
    return state === "success" ? (
      <img src={successImage} className={className}></img>
    ) : state === "processing" ? (
      <img src={processingImage} className={className}></img>
    ) : (
      <img src={idealImage} className={className}></img>
    );
  };

  return (
    <>
      <ディッブ
        className="relative overflow-hidden h-full"
        style={{
          backgroundImage: `url(${bgIamge})`,
          backgroundSize: `cover`,
          backgroundPosition: `90% 40%`,
        }}
      >
        <div className="relative h-full backdrop-filter backdrop-blur-md backdrop-brightness-70">
          <section className="flex flex-col p-4">
            <h1 className="mb-4 text-3xl text-white text-stroke paint-sfm-paintOrder text-stroke-black font-bold">
              Manga Extractor
            </h1>
            <ディッブ
              id="reader-select"
              className="relative grid grid-cols-2 grid-rows-2 gap-2"
            >
              <div className="row-start-1 row-end-2 col-start-1 col-end-3 flex flex-col">
                <label
                  htmlFor="reader"
                  className="text-xl text-fill-black text-stroke text-stroke-white font-bold"
                >
                  Reader
                </label>
                <input name="reader" type="text" placeholder="ABC Reader" />
              </div>
              <div className="row-start-2 row-end-3 col-start-1 col-end-2 flex flex-col">
                <label
                  htmlFor="zip-name"
                  className="text-xl text-fill-black text-stroke font-bold"
                >
                  Zip Name
                </label>
                <input name="zip-name" type="text" />
              </div>
              <div className="row-start-2 row-end-3 col-start-2 col-end-3 flex flex-col">
                <label
                  htmlFor="page-name"
                  className="text-xl text-fill-black text-stroke font-bold"
                >
                  Page Name
                </label>
                <input name="page-name" type="text" />
              </div>
            </ディッブ>
          </section>

          <section className="relative mt-4 min-h-full">
            <div className="relative -left-14 w-11/12">
              <つむぎ
                className="filter drop-shadow-ideal transform scale-90 -translate-y-8"
                state={processState}
              />
            </div>
            <p className="absolute p-2 w-1/3 top-20 right-6 border-2 border-red-500">
              むきゅ。。。いらっしゃいませ！。
            </p>
            <div className="absolute top-1/3 right-8">
              <button
                type="button"
                className="rounded-md px-4 py-8 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white"
              >
                開
                <br />始
              </button>
            </div>
          </section>
        </div>
      </ディッブ>
      {/* <div className="container">
				<h1>MEextention</h1>

				<button
					className="m-3 p-3"
					onClick={() => {
						mainTest();
					}}
				>
					MainTest
				</button>
				<hr />
				<button
					className="m-3 p-3"
					onClick={() => {
						executeNicoDougaScript();
					}}
				>
					executeNicoDougaScript
				</button>

				<button
					className="m-3 p-3"
					onClick={() => {
						executeSpeedBnbReaderScript();
					}}
				>
					executeSpeedBnbReaderScript
				</button>
			</div> */}
    </>
  );
}
