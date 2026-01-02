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

            // Safely set radio buttons with null checks
            const positionInput = document.querySelector(`input[value="${items.timerPosition}"]`);
            if (positionInput) positionInput.checked = true;

            const modeInput = document.querySelector(`input[value="${items.mode}"]`);
            if (modeInput) modeInput.checked = true;

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
        const positionEl = document.querySelector('input[name="position"]:checked');
        const modeEl = document.querySelector('input[name="mode"]:checked');

        // Guard against null (shouldn't happen, but defensive)
        if (!positionEl || !modeEl) return;

        const position = positionEl.value;
        const mode = modeEl.value;

        chrome.storage.local.set({
            isTimerVisible: isVisible,
            timerPosition: position,
            timerPositionMode: 'preset',
            mode: mode,
            timerHours: Math.max(0, parseInt(timerHours.value, 10) || 0),
            timerMinutes: Math.max(0, Math.min(59, parseInt(timerMinutes.value, 10) || 0)),
            timerSeconds: Math.max(0, Math.min(59, parseInt(timerSeconds.value, 10) || 0))
        });
    }

    // Handle mode change
    function handleModeChange() {
        const modeEl = document.querySelector('input[name="mode"]:checked');
        if (!modeEl) return;
        const mode = modeEl.value;
        timerSettings.style.display = mode === 'timer' ? 'block' : 'none';
        saveSettings();
    }

    // Handle set timer button
    function handleSetTimer() {
        // Parse with radix 10 and clamp to valid ranges
        const hours = Math.max(0, Math.min(23, parseInt(timerHours.value, 10) || 0));
        const minutes = Math.max(0, Math.min(59, parseInt(timerMinutes.value, 10) || 0));
        const seconds = Math.max(0, Math.min(59, parseInt(timerSeconds.value, 10) || 0));

        // Update inputs to show clamped values
        timerHours.value = hours;
        timerMinutes.value = minutes;
        timerSeconds.value = seconds;

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