document.addEventListener('DOMContentLoaded', () => {
    const visibilityToggle = document.getElementById('visibility-toggle');
    const positionRadios = document.querySelectorAll('input[name="position"]');
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const timerSettings = document.getElementById('timer-settings');
    const timerHours = document.getElementById('timer-hours');
    const timerMinutes = document.getElementById('timer-minutes');
    const timerSeconds = document.getElementById('timer-seconds');
    const setTimerBtn = document.getElementById('set-timer-btn');

    // Load saved settings and apply them to the popup's controls
    function loadSettings() {
        // Use default values if nothing is stored yet
        chrome.storage.local.get({
            isTimerVisible: true,
            timerPosition: 'top-right',
            timerPositionMode: 'preset',
            mode: 'stopwatch',
            timerHours: 0,
            timerMinutes: 0,
            timerSeconds: 0
        }, (items) => {
            visibilityToggle.checked = items.isTimerVisible;
            document.querySelector(`input[value="${items.timerPosition}"]`).checked = true;
            document.querySelector(`input[value="${items.mode}"]`).checked = true;

            // Show/hide timer settings based on mode
            timerSettings.style.display = items.mode === 'timer' ? 'block' : 'none';

            // Load timer values
            timerHours.value = items.timerHours || 0;
            timerMinutes.value = items.timerMinutes || 0;
            timerSeconds.value = items.timerSeconds || 0;
        });
    }

    // Save the current settings to storage
    function saveSettings() {
        const isVisible = visibilityToggle.checked;
        const position = document.querySelector('input[name="position"]:checked').value;
        const mode = document.querySelector('input[name="mode"]:checked').value;

        chrome.storage.local.set({
            isTimerVisible: isVisible,
            timerPosition: position,
            timerPositionMode: 'preset',
            mode: mode,
            timerHours: parseInt(timerHours.value) || 0,
            timerMinutes: parseInt(timerMinutes.value) || 0,
            timerSeconds: parseInt(timerSeconds.value) || 0
        });
    }

    // Handle mode change
    function handleModeChange() {
        const mode = document.querySelector('input[name="mode"]:checked').value;
        timerSettings.style.display = mode === 'timer' ? 'block' : 'none';
        saveSettings();
    }

    // Handle set timer button
    function handleSetTimer() {
        const hours = parseInt(timerHours.value) || 0;
        const minutes = parseInt(timerMinutes.value) || 0;
        const seconds = parseInt(timerSeconds.value) || 0;

        // Validate max 24 hours
        const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
        const maxMs = 24 * 3600 * 1000; // 24 hours

        if (totalMs > maxMs) {
            alert('Timer cannot exceed 24 hours');
            return;
        }

        if (totalMs === 0) {
            alert('Please set a timer value greater than 0');
            return;
        }

        // Save timer target
        chrome.storage.local.set({
            currentTimerTarget: totalMs,
            timerHours: hours,
            timerMinutes: minutes,
            timerSeconds: seconds
        });

        // Show success feedback
        setTimerBtn.textContent = 'Timer Set!';
        setTimeout(() => {
            setTimerBtn.textContent = 'Set Timer';
        }, 1000);
    }

    // Add event listeners
    visibilityToggle.addEventListener('change', saveSettings);
    positionRadios.forEach(radio => radio.addEventListener('change', saveSettings));
    modeRadios.forEach(radio => radio.addEventListener('change', handleModeChange));
    setTimerBtn.addEventListener('click', handleSetTimer);

    // Load settings when the popup opens
    loadSettings();
});