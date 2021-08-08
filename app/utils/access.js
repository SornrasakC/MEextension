export default function withDOM(func) {
    return () => _withDOM(func, () => {});
}

export default function withDOMGen(setHook) {
    return func => _withDOM(func, setHook);
}

export async function _withDOM(func, setHook= ()=>{}) {
    // function func() {
    //     // You can play with your DOM here or check URL against your regex
    //     // Log to the main console
    //     console.log("Tab script:");
    //     console.log(document.body);
    //     return document.body.innerHTML;
    // }

    // We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/executeScript
    return chrome.tabs.executeScript({
        code: "(" + func + ")();", // argument here is a string but function.toString() returns function's code
    }, ([res]) => {
        // https://www.py4u.net/discuss/284401
        setHook(res);
    });
}

export async function getTargetDOM() {
    // https://developer.mozilla.org/en-US/docs/Web/Guide/Parsing_and_serializing_XML
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer

    const domString = await _withDOM(() => {
        const Serializer = new XMLSerializer();
        const str = Serializer.serializeToString(document.getElementsByClassName("episode_title")[0]);
        console.log('========================================');
        console.log('str:', str);
        console.log('========================================');
        
        return str;
    });
    
    const Parser = new DOMParser();
    console.log('========================================')
    console.log('domString:', domString)
    console.log('========================================')
    
    const targetDOM = Parser.parseFromString(domString, "application/xml");
    return targetDOM;
}
