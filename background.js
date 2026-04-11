chrome.action.onClicked.addListener(async (tab) => chrome.tabs.sendMessage(tab.id, {action: 'toggle'}));

chrome.tabs.onUpdated.addListener(() => chrome.storage.local.set({activated: false}));