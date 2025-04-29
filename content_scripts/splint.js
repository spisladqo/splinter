listMode = "dot"

browser.runtime.onMessage.addListener((message) => {
    if (message.command === "splint") {
        lintOverleafEditor(listMode);
    }
})
