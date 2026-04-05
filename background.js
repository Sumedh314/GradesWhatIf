chrome.action.onClicked.addListener((tab) => {
    chrome.storage.local.get(['activated'], (result) => {
        let activated = result.activated || false;
        console.log(result);

        if (!activated) {
            chrome.storage.local.set({activated: true});
            chrome.tabs.sendMessage(tab.id, {action: 'start'});
        }
        else {
            chrome.storage.local.set({activated: false});
            chrome.tabs.sendMessage(tab.id, {action: 'end'});
        }
    });
});

chrome.tabs.onUpdated.addListener(() => chrome.storage.local.set({activated: false}));