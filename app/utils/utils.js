export const unpackReducer = (state, newState) => ({ ...state, ...newState });

export const timeout = (time) => new Promise((r) => setTimeout(r, time));

export const zeroPad = (pageId, length = 3) => ("" + pageId).padStart(length, "0");

function saveBase64AsFile(base64, fileName) {
    const link = document.createElement("a");

    link.setAttribute("href", base64);
    link.setAttribute("download", fileName);
    link.click();

    console.log("clicked:", fileName);
}
