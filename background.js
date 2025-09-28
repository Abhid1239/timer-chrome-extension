// Listens for commands and updates the persistent storage.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "start") {
    chrome.storage.local.set({
      startTime: request.data.startTime,
      elapsedTime: request.data.elapsedTime, // Persist current elapsed time
      isRunning: true
    });
  } else if (request.command === "stop") {
    chrome.storage.local.set({
      elapsedTime: request.data.elapsedTime,
      isRunning: false
    });
  } else if (request.command === "reset") {
    chrome.storage.local.set({
      elapsedTime: 0,
      isRunning: false,
      startTime: 0
    });
  } else if (request.command === "getStatus") {
    chrome.storage.local.get(["startTime", "elapsedTime", "isRunning"], (result) => {
      sendResponse(result);
    });
    return true; // Indicates an asynchronous response.
  }
});

// Initialize state on first install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    elapsedTime: 0,
    isRunning: false,
    startTime: 0
  });
});