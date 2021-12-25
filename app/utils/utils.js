import JSZip from "jszip";
import { saveAs } from "file-saver";

export const unpackReducer = (state, newState) => ({ ...state, ...newState });

export const timeout = (time) => new Promise((r) => setTimeout(r, time));

export const zeroPad = (pageId, length = 3) =>
  ("" + pageId).padStart(length, "0");

export const zipAndDownload = (
  dataUrls,
  { FILENAME_PREFIX, CHAPTER },
  callback
) => {
  console.log("Finalizing:", FILENAME_PREFIX);

  const zip = new JSZip();
  const folder = zip.folder(FILENAME_PREFIX);

  dataUrls.forEach(({ pageId, dataUrl }) => {
    const imageString = dataUrl.split("base64,")[1];
    folder.file(
      `${FILENAME_PREFIX}/Ch-${CHAPTER} Pg-${zeroPad(pageId)}.png`,
      imageString,
      { base64: true }
    );
  });

  if (callback) callback();

  folder
    .generateAsync({ type: "blob" })
    .then((content) => saveAs(content, FILENAME_PREFIX));
};

function saveBase64AsFile(base64, fileName) {
  const link = document.createElement("a");

  link.setAttribute("href", base64);
  link.setAttribute("download", fileName);
  link.click();

  console.log("clicked:", fileName);
}
