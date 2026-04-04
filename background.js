function start(tabId) {
    
}

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, {action: 'printThing'});
});