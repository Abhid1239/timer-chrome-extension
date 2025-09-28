// Helper function to broadcast a message to all tabs
function broadcastStateChange(data) {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { command: "stateChanged", data })
        .catch(err => console.log("Could not contact tab to sync state."));
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.command) {
    case "start":
      chrome.storage.local.set({
        startTime: request.data.startTime,
        elapsedTime: request.data.elapsedTime,
        isRunning: true
      }, () => broadcastStateChange({ isRunning: true, startTime: request.data.startTime, elapsedTime: request.data.elapsedTime }));
      break;
    case "stop":
      chrome.storage.local.set({
        elapsedTime: request.data.elapsedTime,
        isRunning: false
      }, () => broadcastStateChange({ isRunning: false, elapsedTime: request.data.elapsedTime }));
      break;
    case "reset":
      chrome.storage.local.set({
        elapsedTime: 0,
        isRunning: false,
        startTime: 0
      }, () => broadcastStateChange({ isRunning: false, elapsedTime: 0 }));
      break;
    case "getStatus":
      chrome.storage.local.get(["startTime", "elapsedTime", "isRunning"], (result) => {
        sendResponse(result);
      });
      return true; // Return true because this is asynchronous
  }
});

// Initialize state on first install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    elapsedTime: 0,
    isRunning: false,
    startTime: 0,
    isTimerCollapsed: false // Add collapsed state to storage
  });
});