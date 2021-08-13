import React, { useEffect, useState, useReducer } from "react";
import "tailwindcss/tailwind.css";
import withDom, { withDomGen, useTargetDom, runContentScript } from "./utils/chrome/access";
import { executeSpeedBinbReaderScript, executeNicoDougaScript, executeComicWalkerScript } from "./handlers/entries/entry";
import { unpackReducer, timeout } from "./utils/utils";

export default function App() {
	const [meta, setMeta] = useReducer(unpackReducer, {
		chapter: 0,
		title: "KoibitoMuriMuri",
		filenamePrefix: `KoibitoMuriMuri Ch.0`,
	});

	useEffect(() => {
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

	return (
		<>
			<div className="flex flex-col p-4 h-full">
				<h1 className="leading-3 font-bold">Manga Extractor</h1>

				<label htmlFor="reader" className="text-lg font-bold">
					Reader
				</label>

				<div id="reader-select" className="relative">
					<input
						name="reader"
						type="text"
						placeholder="ABC Reader"
						className="self-center p-1 my-2 w-4/5 rounded-md border-2 border-red-500 focus:ring-2 focus:ring-red-400 text-gray-500 outline-none"
					/>
					<div className="relative">
						<button className="cursor-pointer flex items-center outline-none focus:outline-none">
							Reader A
						</button>
					</div>
				</div>

				<label htmlFor="zip-name">Zip Name</label>
				<input name="zip-name" type="text" />
				<label htmlFor="page-name">Page Name</label>
				<input name="page-name" type="text" />

				<div className="flex justify-center">
					<button
						type="button"
						className="rounded-md px-4 py-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white"
					>
						Reset
					</button>
					<div className="p-2"></div>
					<button
						type="button"
						className="rounded-md px-4 py-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white"
					>
						Extract!
					</button>
				</div>
			</div>
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
