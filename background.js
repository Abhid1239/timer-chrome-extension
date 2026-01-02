// Helper function to broadcast a message to all tabs
function broadcastStateChange(data) {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { command: "stateChanged", data })
        .then(() => { })
        .catch(() => { });
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.command) {
    case "start":
      chrome.storage.local.set({
        startTime: request.data.startTime,
        elapsedTime: request.data.elapsedTime,
        timerRemaining: request.data.timerRemaining,
        isRunning: true,
        mode: request.data.mode,
        currentTimerTarget: request.data.currentTimerTarget
      }, () => broadcastStateChange({
        isRunning: true,
        startTime: request.data.startTime,
        elapsedTime: request.data.elapsedTime,
        timerRemaining: request.data.timerRemaining,
        mode: request.data.mode,
        currentTimerTarget: request.data.currentTimerTarget
      }));
      break;
    case "stop":
      chrome.storage.local.set({
        elapsedTime: request.data.elapsedTime,
        timerRemaining: request.data.timerRemaining,
        isRunning: false,
        mode: request.data.mode,
        currentTimerTarget: request.data.currentTimerTarget
      }, () => broadcastStateChange({
        isRunning: false,
        elapsedTime: request.data.elapsedTime,
        timerRemaining: request.data.timerRemaining,
        mode: request.data.mode,
        currentTimerTarget: request.data.currentTimerTarget
      }));
      break;
    case "reset":
      chrome.storage.local.set({
        elapsedTime: 0,
        timerRemaining: request.data.timerRemaining || request.data.currentTimerTarget,
        isRunning: false,
        startTime: 0,
        mode: request.data.mode,
        currentTimerTarget: request.data.currentTimerTarget
      }, () => broadcastStateChange({
        isRunning: false,
        elapsedTime: 0,
        timerRemaining: request.data.timerRemaining || request.data.currentTimerTarget,
        mode: request.data.mode,
        currentTimerTarget: request.data.currentTimerTarget
      }));
      break;
    case "getStatus":
      chrome.storage.local.get([
        "startTime", "elapsedTime", "timerRemaining", "isRunning",
        "mode", "currentTimerTarget"
      ], (result) => {
        sendResponse(result);
      });
      return true;
  }
});

// Initialize state on first install or update
chrome.runtime.onInstalled.addListener((details) => {
  const defaults = {
    elapsedTime: 0,
    timerRemaining: 0,
    isRunning: false,
    startTime: 0,
    isTimerCollapsed: false,
    isTimerVisible: true,
    timerPosition: 'top-right',
    timerPositionMode: 'preset',
    timerCustomPosition: { left: 8, top: 8 },
    mode: 'stopwatch',
    currentTimerTarget: 0,
    timerHours: 0,
    timerMinutes: 0,
    timerSeconds: 0
  };

  if (details.reason === 'install') {
    chrome.storage.local.set(defaults);
  } else if (details.reason === 'update') {
    chrome.storage.local.get(Object.keys(defaults), (existing) => {
      const toSet = {};
      for (const key of Object.keys(defaults)) {
        if (existing[key] === undefined) {
          toSet[key] = defaults[key];
        }
      }
      if (Object.keys(toSet).length > 0) {
        chrome.storage.local.set(toSet);
      }
    });
  }
});