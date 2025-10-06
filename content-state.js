(function () {
    const ns = (window.TimerExt = window.TimerExt || {});

    /**
     * State module: manages runtime state, interval tick updates, UI syncing,
     * and communication with the background service worker.
     */
    function initState(ui) {
        let isRunning = false;
        let isCollapsed = false;
        let startTime = 0;
        let elapsedTime = 0;
        let timerInterval = null;

        function tick() {
            if (!chrome.runtime?.id) {
                clearInterval(timerInterval);
                return;
            }
            const currentTotal = elapsedTime + (Date.now() - startTime);
            ui.elements.timeDisplay.textContent = ui.formatTime(currentTotal);
        }

        function startLocalTimer() {
            if (timerInterval) clearInterval(timerInterval);
            tick();
            timerInterval = setInterval(tick, 1000);
        }

        function stopLocalTimer() {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        function updateUI() {
            ui.elements.timeDisplay.textContent = ui.formatTime(elapsedTime);
            ui.setRunningIcons(isRunning);
            ui.container.classList.toggle('collapsed', isCollapsed);
            const iconWrapper = ui.controls.collapseButton.querySelector('.icon-wrapper');
            iconWrapper.innerHTML = isCollapsed ? ui.svgs.timer : ui.svgs.back;
        }

        // Public actions
        function toggleRun() {
            if (!chrome.runtime?.id) return;
            // console.log('[TimerExt] toggleRun clicked', { prevIsRunning: isRunning, elapsedTime, startTime });
            isRunning = !isRunning;
            if (isRunning) {
                startTime = Date.now();
                // console.log('[TimerExt] sending start', { startTime, elapsedTime });
                chrome.runtime.sendMessage({ command: 'start', data: { startTime, elapsedTime } });
                startLocalTimer();
            } else {
                stopLocalTimer();
                elapsedTime += (Date.now() - startTime);
                startTime = 0;
                // console.log('[TimerExt] sending stop', { elapsedTime });
                chrome.runtime.sendMessage({ command: 'stop', data: { elapsedTime } });
            }
            updateUI();
            // console.log('[TimerExt] toggleRun after', { isRunning, elapsedTime, startTime });
        }

        function reset() {
            if (!chrome.runtime?.id) return;
            // console.log('[TimerExt] reset clicked');
            stopLocalTimer();
            isRunning = false;
            elapsedTime = 0;
            startTime = 0;
            chrome.runtime.sendMessage({ command: 'reset' });
            updateUI();
        }

        function setCollapsed(collapsed) {
            isCollapsed = collapsed;
            ui.container.classList.toggle('collapsed', isCollapsed);
            const iconWrapper = ui.controls.collapseButton.querySelector('.icon-wrapper');
            iconWrapper.innerHTML = isCollapsed ? ui.svgs.timer : ui.svgs.back;
            chrome.storage.local.set({ isTimerCollapsed: isCollapsed });
        }

        // Initial runtime sync
        if (chrome.runtime?.id) {
            chrome.runtime.sendMessage({ command: 'getStatus' }, (response) => {
                if (chrome.runtime.lastError) {
                    // console.log('[TimerExt] getStatus error', chrome.runtime.lastError.message);
                } else if (response) {
                    // console.log('[TimerExt] getStatus response', response);
                    isRunning = response.isRunning || false;
                    elapsedTime = response.elapsedTime || 0;
                    startTime = response.startTime || 0;
                    updateUI();
                    if (isRunning) startLocalTimer();
                }
            });
        }

        // Listen for background broadcast
        chrome.runtime.onMessage.addListener((request) => {
            if (request.command === 'stateChanged') {
                // console.log('[TimerExt] stateChanged received', request.data);
                isRunning = request.data.isRunning;
                elapsedTime = request.data.elapsedTime ?? elapsedTime;
                startTime = request.data.startTime ?? startTime;
                if (isRunning) startLocalTimer(); else { stopLocalTimer(); startTime = 0; }
                updateUI();
            }
        });

        // Wire UI controls
        ui.controls.playPauseButton.addEventListener('click', () => { /* console.log('[TimerExt] playPause click'); */ toggleRun(); });
        ui.controls.resetButton.addEventListener('click', () => { /* console.log('[TimerExt] reset click'); */ reset(); });
        ui.controls.collapseButton.addEventListener('click', () => { /* console.log('[TimerExt] collapse click'); */ setCollapsed(!isCollapsed); });

        return { toggleRun, reset, setCollapsed };
    }

    ns.state = { initState };
})();


