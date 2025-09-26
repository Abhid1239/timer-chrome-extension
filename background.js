let timerInterval, startTime=0, elapsedTime =0, isRunning =false;



// Function to update all content scripts with the current time
function broadcastTime() {
  chrome.tabs.query({}, (tabs) => {
    const timeData = {
      elapsedTime,
      isRunning
    };
    for (let tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        command: "update",
        data: timeData
      }).catch(err => console.log("Could not contact tab, it might be closed or restricted."));
    }
  });
}

// Main timer update function
function updateTimer() {
  const now = Date.now();
  elapsedTime = now - startTime;
  broadcastTime();
  chrome.storage.local.set({
    elapsedTime,
    isRunning,
    startTime
  });
}

// Listen for commands from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "start") {
    if (!isRunning) {
      startTime = Date.now() - elapsedTime;
      timerInterval = setInterval(updateTimer, 1000);
      isRunning = true;
      chrome.storage.local.set({
        startTime,
        isRunning
      });
    }
  } else if (request.command === "stop") {
    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
      chrome.storage.local.set({
        elapsedTime,
        isRunning
      });
    }
  } else if (request.command === "reset") {
    clearInterval(timerInterval);
    isRunning = false;
    elapsedTime = 0;
    chrome.storage.local.set({
      elapsedTime: 0,
      isRunning: false,
      startTime: 0
    });
    broadcastTime();
  } else if (request.command === "getStatus") {
    sendResponse({
      elapsedTime,
      isRunning
    });
  }
  return true; // Indicates we will send a response asynchronously
});

// Load saved state when the extension starts up
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["elapsedTime", "isRunning", "startTime"], (result) => {
    elapsedTime = result.elapsedTime || 0;
    isRunning = result.isRunning || false;
    if (isRunning) {
      // Recalculate start time to continue counting correctly
      startTime = Date.now() - elapsedTime;
      timerInterval = setInterval(updateTimer, 1000);
    }
  });
});

// Initialize state on first install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    elapsedTime: 0,
    isRunning: false,
    startTime: 0
  });
});