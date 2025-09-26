(function() {
  // Create the timer container
  const timerContainer = document.createElement('div');
  timerContainer.id = 'persistent-timer-container';

  // Create the display
  const timeDisplay = document.createElement('span');
  timeDisplay.id = 'persistent-timer-display';
  timeDisplay.textContent = '00:00:00';

  // Create buttons
  const startButton = document.createElement('button');
  startButton.textContent = 'Start';
  startButton.id = 'timer-start-btn';

  const stopButton = document.createElement('button');
  stopButton.textContent = 'Stop';
  stopButton.id = 'timer-stop-btn';

  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset';
  resetButton.id = 'timer-reset-btn';

  // Add elements to the container
  timerContainer.appendChild(timeDisplay);
  timerContainer.appendChild(startButton);
  timerContainer.appendChild(stopButton);
  timerContainer.appendChild(resetButton);

  // Add the container to the page
  document.body.appendChild(timerContainer);

  // --- Functionality ---

  function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    let minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    let seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  // Add event listeners to buttons
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

})();