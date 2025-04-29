function lintCommand(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {
      command: "splint"
    });
  }
  
  function reportError(error) {
    console.error(`Could not run lint: ${error}`);
  }
  
  function listenForClicks() {
    document.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON" || !e.target.closest("#popup-content")) {
        return;
      }
  
      browser.tabs.query({ active: true, currentWindow: true })
        .then(lintCommand)
        .catch(reportError);
    });
  }
  
  function reportExecuteScriptError(error) {
    const popupContent = document.querySelector("#popup-content");
    const errorContent = document.querySelector("#error-content");
  
    if (popupContent) {
      popupContent.classList.add("hidden");
    }
    if (errorContent) {
      errorContent.classList.remove("hidden");
    }
  
    console.error(`Failed to execute content script: ${error.message}`);
  }

browser.tabs.executeScript({ file: "/content_scripts/splint.js" })
  .then(listenForClicks)
  .catch(reportExecuteScriptError);
