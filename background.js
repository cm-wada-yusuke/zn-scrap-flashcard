// Function to check if URL is a Zenn scrap page
function isZennScrapPage(url) {
  return /^https:\/\/zenn\.dev\/[^\/]+\/scraps\/[^\/]+$/.test(url);
}

// Update extension icon state based on URL
async function updateExtensionState(tabId, url) {
  if (isZennScrapPage(url)) {
    await chrome.action.enable(tabId);
  } else {
    await chrome.action.disable(tabId);
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    updateExtensionState(tabId, changeInfo.url);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  updateExtensionState(tab.id, tab.url);
});

// Initial setup when extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  // Get current active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    updateExtensionState(tabs[0].id, tabs[0].url);
  }
});
