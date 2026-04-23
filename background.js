chrome.action.onClicked.addListener(async (tab) => chrome.tabs.sendMessage(tab.id, {action: 'toggle'}));
chrome.tabs.onUpdated.addListener(() => chrome.storage.local.set({activated: false}));
chrome.runtime.onInstalled.addListener(() => chrome.tabs.reload());
chrome.commands.onCommand.addListener(command => command == 'reload_extension' && chrome.runtime.reload());
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action == 'injectCSS') {
        chrome.scripting.insertCSS({
            target: { tabId: sender.tab.id, allFrames: true },
            files: ["content_script/content.css"]
        });
    }
})