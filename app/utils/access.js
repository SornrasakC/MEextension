export default function withDOM(func) {
    return () => _withDOM(func);
}

export function _withDOM(func) {
    // function func() {
    //     // You can play with your DOM here or check URL against your regex
    //     // Log to the main console
    //     console.log("Tab script:");
    //     console.log(document.body);
    //     return document.body.innerHTML;
    // }

    // We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
    chrome.tabs.executeScript(
        {
            code: "(" + func + ")();", // argument here is a string but function.toString() returns function's code
        },
        (results) => {
            console.log(`script executed`);

            // Here we have just the innerHTML and not DOM structure
            // Log to the extension console
            // console.log("Popup script:");
            // console.log(results[0]);
        }
    );
}
