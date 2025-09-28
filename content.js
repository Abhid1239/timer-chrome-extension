(function () {
  // Store SVG data as strings for easier creation
  const svgs = {
    back: `<svg class="icon" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M47 239c-9.4 9.4-9.4 24.6 0 33.9L207 433c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9L97.9 256 241 113c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0L47 239z"></path></svg>`,
    play: `<svg class="icon" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"></path></svg>`,
    pause: `<svg class="icon" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"></path></svg>`,
    reset: `<svg class="icon" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M496 200c0 13.3-10.7 24-24 24h0H360 328c-13.3 0-24-10.7-24-24s10.7-24 24-24h32 54.1l-52.1-52.1C333.8 95.8 295.7 80 256 80c-72.7 0-135.2 44.1-162 107.1c-5.2 12.2-19.3 17.9-31.5 12.7s-17.9-19.3-12.7-31.5C83.9 88.2 163.4 32 256 32c52.5 0 102.8 20.8 139.9 57.9L448 142.1V88l0-.4V56c0-13.3 10.7-24 24-24s24 10.7 24 24V200zM40 288H152c13.3 0 24 10.7 24 24s-10.7 24-24 24H97.9l52.1 52.1C178.2 416.2 216.3 432 256 432c72.6 0 135-43.9 161.9-106.8c5.2-12.2 19.3-17.8 31.5-12.6s17.8 19.3 12.6 31.5C427.8 424 348.5 480 256 480c-52.5 0-102.8-20.8-139.9-57.9L64 369.9V424c0 13.3-10.7 24-24 24s-24-10.7-24-24V312c0-13.3 10.7-24 24-24z"></path></svg>`
  };

  // --- Create UI Elements ---
  const container = document.createElement('div');
  container.id = 'persistent-timer-container';

  // Helper function to create a button with an icon
  function createButton(svgContent) {
    const button = document.createElement('button');
    button.className = 'control-button';
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icon-wrapper';
    iconWrapper.innerHTML = svgContent;
    button.appendChild(iconWrapper);
    return button;
  }

  // Create all buttons
  const backButton = createButton(svgs.back);
  const playPauseButton = createButton(svgs.play);
  const resetButton = createButton(svgs.reset);

  // Specific setup for the Play/Pause button
  const pauseIconWrapper = document.createElement('div');
  pauseIconWrapper.className = 'icon-wrapper hidden';
  pauseIconWrapper.innerHTML = svgs.pause;
  playPauseButton.appendChild(pauseIconWrapper);

  // Create the timer display and the group that holds it
  const timeDisplay = document.createElement('div');
  timeDisplay.className = 'time-display';
  timeDisplay.textContent = '00:00:00';

  const playTimerGroup = document.createElement('div');
  playTimerGroup.className = 'play-timer-group';
  playTimerGroup.appendChild(playPauseButton);
  playTimerGroup.appendChild(timeDisplay);

  // Add all elements to the main container
  container.appendChild(backButton);
  container.appendChild(playTimerGroup);
  container.appendChild(resetButton);

  // Add the container to the page
  document.body.appendChild(container);

  // --- Functionality ---

  let isRunning = false;
  const playIcon = playPauseButton.querySelector('.icon-wrapper:not(.hidden)');
  const pauseIcon = playPauseButton.querySelector('.icon-wrapper.hidden');

  function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    let minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    let seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  function updateUI(runningState) {
    isRunning = runningState;
    if (isRunning) {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    } else {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }
  }

  // --- Event Listeners ---
  playPauseButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: isRunning ? 'stop' : 'start' });
  });

  resetButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'reset' });
  });

  // Listen for time updates from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'update') {
      timeDisplay.textContent = formatTime(request.data.elapsedTime);
      updateUI(request.data.isRunning);
    }
  });

  // Get initial status when the page loads
  chrome.runtime.sendMessage({ command: "getStatus" }, (response) => {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
    } else if (response) {
      timeDisplay.textContent = formatTime(response.elapsedTime);
      updateUI(response.isRunning);
    }
  });
})();