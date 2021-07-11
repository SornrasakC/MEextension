if (!domtoimage) {
    domtoimage = globalThis.domtoimage;
}
if (!saveAs) {
    saveAs = globalThis.FS_saveAs;
}
if (!JSZip) {
    JSZip = globalThis.JSZip;
}

CHAPTER = document.getElementsByClassName("episode_title")[0].textContent.match(/\d+/)[0];

TITLE = `KoibitoMuriMuri Ch.${CHAPTER}`;

START_PAGE = 0;
END_PAGE = 60;
main();

function saveBase64AsFile(base64, fileName) {
    var link = document.createElement("a");

    link.setAttribute("href", base64);
    link.setAttribute("download", fileName);
    link.click();

    console.log("clicked:", fileName);
}

async function extract(id, end, data) {
    if (id >= end) {
        fin(data);
        return;
    }

    container = document.getElementById(`page_${id}`);
    if (!container) {
        console.log("missing:", id);
        extract(id + 1, end, data);
        return;
    }
    container.scrollIntoView();

    if (container.children[0].children.length < 3) {
        console.log("Waited", id);
        await new Promise((r) => setTimeout(r, 2000));
    }

    //     while(container.children[0].children.length < 3) {
    //         console.log("Waiting")
    //         container.scrollIntoView()
    //     }

    console.log("started:", id);

    node = container.children[0];
    domtoimage
        .toPng(node)
        .then(function (dataUrl) {
            data.data = [...data.data, { dataUrl, id }];
            extract(id + 1, end, data);
        })
        .catch(function (error) {
            console.error("oops, something went wrong!", error);
        });
}

function main() {
    console.log("STARTED");
    let data = { data: [] };

    extract(START_PAGE, END_PAGE, data);
}

function fin(data) {
    console.log("Finalized");
    let zip = new JSZip();
    let folder = zip.folder("collection");
    data.data.forEach(({ dataUrl, id }) => {
        dat = dataUrl.split("base64,")[1];
        folder.file(`${TITLE}-${id}.png`, dat, { base64: true });
    });

    folder.generateAsync({ type: "blob" }).then((content) => saveAs(content, "files"));
}
