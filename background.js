chrome.action.onClicked.addListener(async (tab) => {
    const activatedData = await chrome.storage.local.get('activated');
    const activated = activatedData.activated;

    const message = activated ? 'deactivate' : 'activate';
    const newStatus = activated ? false : true;

    chrome.tabs.sendMessage(tab.id, { action: message });
    chrome.storage.local.set({ activated: newStatus });
});
chrome.tabs.onUpdated.addListener(() => chrome.storage.local.set({ activated: false }));
chrome.runtime.onInstalled.addListener(() => {
    console.log('hi');
    chrome.tabs.reload();
    chrome.storage.local.set({ activated: false });
});
chrome.commands.onCommand.addListener(command => command == 'reload_extension' && chrome.runtime.reload());
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action == 'injectCSS') {
        chrome.scripting.insertCSS({
            target: { tabId: sender.tab.id, allFrames: true },
            files: ['content_script/content.css']
        });
    }
    sendResponse();
})