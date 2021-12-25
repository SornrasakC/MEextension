import React, { useEffect, useState } from "react";
import { storageSet } from "./storage";
// import { PROGRESS_STATUS } from "../constants";

export async function getCurrentTabId() {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabArray) => {
      resolve(tabArray[0].id);
    });
  });
}

export async function getConnName() {
  const tabId = await getCurrentTabId();
  return `ME-${tabId}`;
}

export async function setListener(callback) {
  const connName = await getConnName();
  await storageSet({ ["me-conn-name"]: connName });
  chrome.runtime.onConnect.addListener((port) => {
    console.assert(port.name === connName);
    port.onMessage.addListener(callback);
  });
  // const port = chrome.runtime.connect({ name: connName });
  // port.onMessage.addListener(callback);
}

export async function getConnName() {
    const tabId = await getCurrentTabId();
    return `ME-${tabId}`;
}

export async function setListener(callback) {
    const connName = await getConnName();
    await storageSet({ ["me-conn-name"]: connName });
    chrome.runtime.onConnect.addListener((port) => {
        console.assert(port.name === connName);
        port.onMessage.addListener(callback);
    });
    // const port = chrome.runtime.connect({ name: connName });
    // port.onMessage.addListener(callback);
}

export default function withDom(func) {
  return _withDom(func, () => {});
}

export function withDomGen(setHook) {
  return (func) => _withDom(func, setHook);
}

// https://stackoverflow.com/questions/19758028/chrome-extension-get-dom-content
export async function _withDom(func, setHook = () => {}) {
  // function func() {
  //     // You can play with your DOM here or check URL against your regex
  //     // Log to the main console
  //     console.log("Tab script:");
  //     console.log(document.body);
  //     return document.body.innerHTML;
  // }

  // We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/executeScript
  const tabId = await getCurrentTabId();

  void chrome.scripting.executeScript(
    {
      target: { tabId },
      function: func,
    },
    (res) => {
      // https://www.py4u.net/discuss/284401
      // ManifestV3 dont return array anymore, only active tab response
      setHook(res);
    }
  );

  return;
}

/**
 * =================================================
 *
 * const [targetDom, fetchTargetDom, isTargetDomReady] = useTargetDom();
 *
 * =================================================
 *
 * https://developer.mozilla.org/en-US/docs/Web/Guide/Parsing_and_serializing_XML
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer
 */
export function useTargetDom() {
  const [isTargetDomReady, setIsTargetDomReady] = useState(false);
  const [targetDom, setTargetDom] = useState({});
  const [targetDomString, setTargetDomString] = useState("");
  const Parser = new DOMParser();

  useEffect(() => {
    if (!targetDomString) return;

    const parsedTargetDom = Parser.parseFromString(
      targetDomString,
      "application/xml"
    );

    setTargetDom(parsedTargetDom);
    setIsTargetDomReady(true);
  }, [targetDomString]);

  const fetchTargetDom = () => {
    setIsTargetDomReady(false);

    withDomGen(setTargetDomString)(() => {
      const Serializer = new XMLSerializer();
      return Serializer.serializeToString(document);
    });
  };

  useEffect(() => {
    fetchTargetDom();
  }, []);

  return [targetDom, fetchTargetDom, isTargetDomReady];
}

// export async function getTargetDom() {

//     const domString = await _withDom(() => {
//         const Serializer = new XMLSerializer();
//         return Serializer.serializeToString(document.getElementsByClassName("episode_title")[0]);
//     });
//     console.log("========================================");
//     console.log("domString:", domString);
//     console.log("========================================");

//     const Parser = new DOMParser();
//     const targetDom = Parser.parseFromString(domString, "application/xml");
//     return targetDom;
// }

export async function runContentScript() {
  const tabId = await getCurrentTabId();
  chrome.scripting.executeScript({
    target: { tabId },
    files: ["content-script.js"],
  });
}
