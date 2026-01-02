document.addEventListener('DOMContentLoaded', () => {
    const visibilityToggle = document.getElementById('visibility-toggle');
    const positionRadios = document.querySelectorAll('input[name="position"]');
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const timerSettings = document.getElementById('timer-settings');
    const timerHours = document.getElementById('timer-hours');
    const timerMinutes = document.getElementById('timer-minutes');
    const timerSeconds = document.getElementById('timer-seconds');
    const setTimerBtn = document.getElementById('set-timer-btn');

    /**
     * Load persisted popup settings from chrome.storage.local and apply them to the UI controls.
     *
     * Uses sensible defaults when no stored values exist (visibility: `true`, position: `'top-right'`,
     * position mode: `'preset'`, mode: `'stopwatch'`, and timer hours/minutes/seconds: `0`) and:
     * - sets the visibility toggle and selected radios for position and mode,
     * - shows or hides the timer settings section based on the loaded mode,
     * - populates the timer hour/minute/second inputs.
     */
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

    /**
     * Persist the popup's current timer-related settings to chrome.storage.local.
     *
     * Stores the following keys:
     * - `isTimerVisible` (boolean): whether the timer is visible
     * - `timerPosition` (string): selected preset position
     * - `timerPositionMode` (string): set to `'preset'`
     * - `mode` (string): selected mode (e.g., `'stopwatch'` or `'timer'`)
     * - `timerHours` (number), `timerMinutes` (number), `timerSeconds` (number): numeric timer fields
     */
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

    /**
     * Show or hide the timer settings UI based on the selected mode and persist the change.
     *
     * Reads the currently selected mode radio; displays the timer settings container when the mode equals `"timer"`, hides it otherwise, and then calls saveSettings to persist the updated mode.
     */
    function handleModeChange() {
        const mode = document.querySelector('input[name="mode"]:checked').value;
        timerSettings.style.display = mode === 'timer' ? 'block' : 'none';
        saveSettings();
    }

    /**
     * Validate timer input values, persist the timer target and input values, and give brief UI feedback.
     *
     * Validates that the total duration is greater than 0 and does not exceed 24 hours; shows an alert for invalid values.
     * On success, stores `currentTimerTarget` (milliseconds) and `timerHours`, `timerMinutes`, `timerSeconds` in chrome.storage.local,
     * and temporarily changes the Set Timer button text to "Timer Set!".
     */
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