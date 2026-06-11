chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url.includes("youtube.com")) return;

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});