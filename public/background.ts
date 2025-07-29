// Background Service Worker for Tabula, to handle lifecycle events
if (process.env.NODE_ENV === "development") {
    console.log("Tabula background service worker initialized in development mode");
} 

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log("Tabula extension installed", details.reason);

    if (details.reason === "install") {
        chrome.storage.local.set({
            'tabula_settings': {
                theme: 'system',
                sidebarCollapsed: false,
                maxWorkspaces: 10,
                maxTabsPerWorkspace: 50,
                maxTotalTabs: 500
            }
        })
    }
})

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    if (!message || !message.type) {
        sendResponse({ error: 'Invalid message format' });
        return;
    }

    switch (message.type) {
        case 'GET_TABS':
            chrome.tabs.query({}, (tabs) => {
                if (chrome.runtime.lastError) {
                    sendResponse({ error: chrome.runtime.lastError.message });
                } else {
                    sendResponse({ tabs });
                }
            });
            return true;

        case 'CREATE_TAB':
            chrome.tabs.create(
                { url: message.url || 'chrome://newtab' },
                (tab) => {
                    if (chrome.runtime.lastError) {
                        console.error('Failed to create tab:', chrome.runtime.lastError);
                    }
                }
            );
            break;

        default:
            sendResponse({ error: 'Unknown message type' });
    }
});
