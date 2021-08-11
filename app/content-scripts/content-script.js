import domtoimage from "dom-to-image";
import { messages } from "@extend-chrome/messages";

// messages.send({
//     greeting: "greeting from content-script.js",
//     data: "custom data before async",
// });

// messages.on((message, sender, sendResponse) => {
//     if(message.greeting !== 'greeting from app.js') return;

//     main();
// })


async function main() {
    console.log("========================================");
    console.log("domtoimage:", domtoimage);
    console.log("========================================");

    const id = 6;
    const container = document.getElementById(`page_${id}`);
    container.scrollIntoView();
    console.log("========================================");
    console.log("container:", container);
    console.log("========================================");

    const node = container.children[0];

    const dataUrl = await domtoimage.toPng(node);
    // const zip = new JSZip();
    // const folder = zip.folder("collection");

    const dat = dataUrl.split("base64,")[1];

    console.log("========================================");
    console.log("dataUrl:", dataUrl.substring(0, 50));
    console.log("========================================");

    console.log("========================================");
    console.log("dat:", dat.substring(0, 50));
    console.log("========================================");

    messages.send({
        greeting: "greeting from content-script.js",
        data: dataUrl.substring(0, 50),
    });
}

// main();


