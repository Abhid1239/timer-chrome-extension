(function () {
    const ns = (window.TimerExt = window.TimerExt || {});

    /**
     * State module: manages runtime state, interval tick updates, UI syncing,
     * and communication with the background service worker.
     * 
     * Features:
     * - Timer mode with proper restart after completion
     * - Color gradient: Blue → Light Blue → Orange → Red as time runs out
     * - Buzz animation when timer reaches zero (stops on interaction)
     */
    function initState(ui) {
        let isRunning = false;
        let isCollapsed = false;
        let startTime = 0;
        let elapsedTime = 0;
        let timerInterval = null;
        let mode = 'stopwatch';
        let currentTimerTarget = 0;
        let timerCompleted = false;  // Track if timer finished (for restart)
        let isBuzzing = false;       // Track buzz animation state

        // Color constants for timer mode gradient
        const COLORS = {
            blue: '#1a90ff',      // >75% remaining (default)
            lightBlue: '#5cc8ff', // 50-75% remaining
            orange: '#ff9500',    // 25-50% remaining
            red: '#ff3b30'        // <25% remaining (critical)
        };

        // ─────────────────────────────────────────────────────────────────────
        // BUZZ ANIMATION FUNCTIONS
        // ─────────────────────────────────────────────────────────────────────

        /**
         * Start the buzz animation (timer completed alert)
         */
        function startBuzzing() {
            if (isBuzzing) return;
            isBuzzing = true;
            ui.container.classList.add('buzzing');
        }

        /**
         * Stop the buzz animation (on user interaction)
         */
        function stopBuzzing() {
            if (!isBuzzing) return;
            isBuzzing = false;
            ui.container.classList.remove('buzzing');
        }

        // ─────────────────────────────────────────────────────────────────────
        // COLOR UPDATE
        // ─────────────────────────────────────────────────────────────────────

        /**
         * Update time display color based on remaining time percentage.
         * Only applies in timer mode - stopwatch stays blue.
         */
        function updateTimeColor(remainingMs) {
            if (mode === 'stopwatch') {
                ui.elements.timeDisplay.style.color = COLORS.blue;
                return;
            }

            // Calculate percentage of time remaining
            const percentage = currentTimerTarget > 0 ? remainingMs / currentTimerTarget : 1;

            let color;
            if (percentage > 0.75) {
                color = COLORS.blue;      // Plenty of time
            } else if (percentage > 0.5) {
                color = COLORS.lightBlue; // Getting there
            } else if (percentage > 0.25) {
                color = COLORS.orange;    // Hurry up
            } else {
                color = COLORS.red;       // Critical!
            }

            ui.elements.timeDisplay.style.color = color;
        }

        // ─────────────────────────────────────────────────────────────────────
        // TIMER TICK & INTERVAL
        // ─────────────────────────────────────────────────────────────────────

        function tick() {
            if (!chrome.runtime?.id) {
                clearInterval(timerInterval);
                return;
            }

            if (mode === 'stopwatch') {
                // Stopwatch: count up
                const currentTotal = elapsedTime + (Date.now() - startTime);
                ui.elements.timeDisplay.textContent = ui.formatTime(currentTotal);
                updateTimeColor(currentTotal); // Always blue for stopwatch
            } else {
                // Timer: count down
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, currentTimerTarget - elapsed);
                ui.elements.timeDisplay.textContent = ui.formatTime(remaining);
                updateTimeColor(remaining); // Color based on remaining time

                // Timer completed - stop and start buzzing!
                if (remaining === 0 && isRunning) {
                    stopLocalTimer();
                    isRunning = false;
                    timerCompleted = true;  // Mark as completed for restart
                    startTime = 0;
                    chrome.runtime.sendMessage({ command: 'stop', data: { elapsedTime: 0, mode, currentTimerTarget } });

                    // Start buzz animation to alert user
                    startBuzzing();

                    // Update UI to show play button (ready for restart)
                    ui.setRunningIcons(false);
                }
            }
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

        // ─────────────────────────────────────────────────────────────────────
        // UI UPDATE
        // ─────────────────────────────────────────────────────────────────────

        function updateUI() {
            if (mode === 'stopwatch') {
                ui.elements.timeDisplay.textContent = ui.formatTime(elapsedTime);
                updateTimeColor(elapsedTime);
            } else {
                // Timer mode: show the target time when not running (ready to start)
                if (!isRunning && !timerCompleted) {
                    ui.elements.timeDisplay.textContent = ui.formatTime(currentTimerTarget);
                    updateTimeColor(currentTimerTarget); // Full time = blue
                } else if (timerCompleted) {
                    // Timer completed: show 00:00:00 (but play button is ready)
                    ui.elements.timeDisplay.textContent = ui.formatTime(0);
                    updateTimeColor(0);
                }
            }
            ui.setRunningIcons(isRunning);
            ui.container.classList.toggle('collapsed', isCollapsed);
            const iconWrapper = ui.controls.collapseButton.querySelector('.icon-wrapper');
            iconWrapper.innerHTML = isCollapsed ? ui.svgs.timer : ui.svgs.back;
        }

        // ─────────────────────────────────────────────────────────────────────
        // PUBLIC ACTIONS
        // ─────────────────────────────────────────────────────────────────────

        function toggleRun() {
            if (!chrome.runtime?.id) return;

            // Stop buzzing on any interaction
            stopBuzzing();

            // Handle timer restart after completion
            if (timerCompleted && mode === 'timer') {
                // Restart timer from original target
                timerCompleted = false;
                isRunning = true;
                startTime = Date.now();
                elapsedTime = 0;
                chrome.runtime.sendMessage({
                    command: 'start',
                    data: { startTime, elapsedTime: 0, mode, currentTimerTarget }
                });
                startLocalTimer();
                updateUI();
                return;
            }

            // Normal toggle logic
            isRunning = !isRunning;
            if (isRunning) {
                startTime = Date.now();
                chrome.runtime.sendMessage({ command: 'start', data: { startTime, elapsedTime, mode, currentTimerTarget } });
                startLocalTimer();
            } else {
                stopLocalTimer();
                if (mode === 'stopwatch') {
                    elapsedTime += (Date.now() - startTime);
                }
                startTime = 0;
                chrome.runtime.sendMessage({ command: 'stop', data: { elapsedTime, mode, currentTimerTarget } });
            }
            updateUI();
        }

        function reset() {
            if (!chrome.runtime?.id) return;

            // Stop buzzing on any interaction
            stopBuzzing();

            stopLocalTimer();
            isRunning = false;
            timerCompleted = false;  // Reset completion state
            elapsedTime = 0;
            startTime = 0;
            chrome.runtime.sendMessage({ command: 'reset', data: { mode, currentTimerTarget } });
            updateUI();
        }

        function setCollapsed(collapsed) {
            // Stop buzzing on any interaction
            stopBuzzing();

            isCollapsed = collapsed;
            ui.container.classList.toggle('collapsed', isCollapsed);
            const iconWrapper = ui.controls.collapseButton.querySelector('.icon-wrapper');
            iconWrapper.innerHTML = isCollapsed ? ui.svgs.timer : ui.svgs.back;
            chrome.storage.local.set({ isTimerCollapsed: isCollapsed });
        }

        // ─────────────────────────────────────────────────────────────────────
        // INITIALIZATION & LISTENERS
        // ─────────────────────────────────────────────────────────────────────

        // Initial runtime sync from background
        if (chrome.runtime?.id) {
            chrome.runtime.sendMessage({ command: 'getStatus' }, (response) => {
                if (chrome.runtime.lastError) {
                    // Extension context may be invalidated
                } else if (response) {
                    isRunning = response.isRunning || false;
                    elapsedTime = response.elapsedTime || 0;
                    startTime = response.startTime || 0;
                    mode = response.mode || 'stopwatch';
                    currentTimerTarget = response.currentTimerTarget || 0;
                    updateUI();
                    if (isRunning) startLocalTimer();
                }
            });
        }

        // Listen for settings changes (mode, timer target) from popup
        ns.settings.onSettingsChange((settings) => {
            const newMode = settings.mode || 'stopwatch';
            const newTarget = settings.currentTimerTarget || 0;

            // Only update if something changed
            if (newMode !== mode || newTarget !== currentTimerTarget) {
                // Stop buzzing when settings change
                stopBuzzing();

                mode = newMode;
                currentTimerTarget = newTarget;
                timerCompleted = false;  // Reset completion on new settings

                // Reset timer state when settings change (don't auto-start)
                if (!isRunning) {
                    elapsedTime = 0;
                    startTime = 0;
                    updateUI();
                }
            }
        });

        // Listen for background broadcast (cross-tab sync)
        chrome.runtime.onMessage.addListener((request) => {
            if (request.command === 'stateChanged') {
                isRunning = request.data.isRunning;
                elapsedTime = request.data.elapsedTime ?? elapsedTime;
                startTime = request.data.startTime ?? startTime;
                mode = request.data.mode ?? mode;
                currentTimerTarget = request.data.currentTimerTarget ?? currentTimerTarget;

                // If another tab stopped the timer, stop buzzing here too
                if (!isRunning) {
                    stopBuzzing();
                    timerCompleted = false;
                }

                if (isRunning) {
                    startLocalTimer();
                } else {
                    stopLocalTimer();
                    startTime = 0;
                }
                updateUI();
            }
        });

        // Wire UI controls
        ui.controls.playPauseButton.addEventListener('click', () => toggleRun());
        ui.controls.resetButton.addEventListener('click', () => reset());
        ui.controls.collapseButton.addEventListener('click', () => setCollapsed(!isCollapsed));

        return { toggleRun, reset, setCollapsed, stopBuzzing };
    }

    ns.state = { initState };
})();
