let activated = false;

chrome.action.onClicked.addListener((tab) => {
    if (!activated) {
        chrome.tabs.sendMessage(tab.id, {action: 'start'});
        activated = true;
    }
    else {
        chrome.tabs.sendMessage(tab.id, {action: 'end'});
        activated = false;
    }
});