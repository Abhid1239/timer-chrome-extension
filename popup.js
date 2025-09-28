document.addEventListener('DOMContentLoaded', () => {
    const visibilityToggle = document.getElementById('visibility-toggle');
    const positionRadios = document.querySelectorAll('input[name="position"]');

    // Load saved settings and apply them to the popup's controls
    function loadSettings() {
        // Use default values if nothing is stored yet
        chrome.storage.local.get({
            isTimerVisible: true,
            timerPosition: 'top-right'
        }, (items) => {
            visibilityToggle.checked = items.isTimerVisible;
            document.querySelector(`input[value="${items.timerPosition}"]`).checked = true;
        });
    }

    // Save the current settings to storage
    function saveSettings() {
        const isVisible = visibilityToggle.checked;
        const position = document.querySelector('input[name="position"]:checked').value;

        chrome.storage.local.set({
            isTimerVisible: isVisible,
            timerPosition: position
        });
    }

    // Add event listeners to save settings when they change
    visibilityToggle.addEventListener('change', saveSettings);
    positionRadios.forEach(radio => radio.addEventListener('change', saveSettings));

    // Load settings when the popup opens
    loadSettings();
});