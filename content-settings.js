(function () {
    const ns = (window.TimerExt = window.TimerExt || {});

    // Default settings used across modules
    const defaults = {
        isTimerVisible: true,
        timerPosition: 'top-right',
        timerPositionMode: 'preset',
        timerCustomPosition: { left: 8, top: 8 },
        isTimerCollapsed: false,
        // Timer/Stopwatch mode settings
        mode: 'stopwatch', // 'stopwatch' or 'timer'
        timerHours: 0,
        timerMinutes: 0,
        timerSeconds: 0,
        currentTimerTarget: 0 // total ms for countdown
    };

    function loadSettings(callback) {
        if (!chrome.runtime?.id) return;
        chrome.storage.local.get(defaults, (settings) => callback(settings));
    }

    function onSettingsChange(handler) {
        if (!chrome.runtime?.id) return;
        const settingKeys = new Set(Object.keys(defaults));
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace !== 'local') return;
            if (!chrome.runtime?.id) return; // Guard during callback too
            // Only react when our settings keys changed (ignore elapsedTime, isRunning, etc.)
            const relevant = Object.keys(changes).some((k) => settingKeys.has(k));
            if (!relevant) return;
            loadSettings((settings) => {
                handler(settings);
            });
        });
    }

    ns.settings = { defaults, loadSettings, onSettingsChange };
})();


