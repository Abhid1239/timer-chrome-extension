(() => {
    const timerContainer = document.createElement("div");
    timerContainer.id = 'timer-container';

    const timerDisplay = document.createElement("span");
    timerDisplay.id = 'timer-display';
    timerDisplay.textContent = "00:00:00";

    const startButton = document.createElement("button");
    startButton.id = 'timer-start-btn';
    startButton.textContent = "Start";

        const stopButton = document.createElement("button");
    stopButton.id = 'timer-stop-btn';
    stopButton.textContent = "Stop";

        const resetButton = document.createElement("button");
    resetButton.id = 'timer-reset-btn';
    resetButton.textContent = "Reset";

    timerContainer.appendChild(timerDisplay);
    timerContainer.appendChild(startButton);
    timerContainer.appendChild(stopButton);
    timerContainer.appendChild(resetButton);

    document.body.appendChild(timerContainer);

      function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    let minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    let seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

   startButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      command: 'start'
    });
  });

  stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      command: 'stop'
    });
  });

  resetButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      command: 'reset'
    });
  });


  // Listen for time updates from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'update') {
      timeDisplay.textContent = formatTime(request.data.elapsedTime);
      startButton.disabled = request.data.isRunning;
      stopButton.disabled = !request.data.isRunning;
    }
  });

  // Get initial status when the page loads
  chrome.runtime.sendMessage({
    command: "getStatus"
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
    } else if (response) {
      timeDisplay.textContent = formatTime(response.elapsedTime);
      startButton.disabled = response.isRunning;
      stopButton.disabled = !response.isRunning;
    }
  });


})()