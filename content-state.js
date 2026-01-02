(function () {
    const ns = (window.TimerExt = window.TimerExt || {});

    /**
     * State module: manages runtime state, interval tick updates, UI syncing,
     * and communication with the background service worker.
     * 
     * Features:
     * - Timer mode with proper restart after completion
     * - Color gradient: Blue → Light Blue → Orange → Red as time runs out
     * - Buzz animation when timer reaches zero (continues until user interaction)
     * - Mode switching properly stops and resets the timer
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
         * Start the buzz animation (timer completed alert).
         * Will continue indefinitely until stopBuzzing() is called.
         */
        function startBuzzing() {
            if (isBuzzing) return;
            isBuzzing = true;
            timerCompleted = true;
            ui.container.classList.add('buzzing');
        }

        /**
         * Stop the buzz animation (on user interaction).
         * Called when user clicks play, reset, collapse, or changes settings.
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

                // Timer completed - stop interval and start buzzing!
                // The buzz will continue until user interacts
                if (remaining <= 0 && isRunning) {
                    stopLocalTimer();
                    isRunning = false;
                    startTime = 0;

                    // Notify background of stop
                    chrome.runtime.sendMessage({ command: 'stop', data: { elapsedTime: 0, mode, currentTimerTarget } });

                    // Start buzz animation - will continue indefinitely
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
                // Timer mode
                if (timerCompleted) {
                    // Timer completed: show 00:00:00, buzzing, play button ready
                    ui.elements.timeDisplay.textContent = ui.formatTime(0);
                    updateTimeColor(0);
                } else if (!isRunning) {
                    // Timer not running: show target time (ready to start)
                    ui.elements.timeDisplay.textContent = ui.formatTime(currentTimerTarget);
                    updateTimeColor(currentTimerTarget); // Full time = blue
                }
                // If running, tick() handles the display
            }
            ui.setRunningIcons(isRunning);
            ui.container.classList.toggle('collapsed', isCollapsed);
            const iconWrapper = ui.controls.collapseButton.querySelector('.icon-wrapper');
            iconWrapper.innerHTML = isCollapsed ? ui.svgs.timer : ui.svgs.back;
        }

        // ─────────────────────────────────────────────────────────────────────
        // FULL RESET FUNCTION
        // ─────────────────────────────────────────────────────────────────────

        /**
         * Fully reset the timer state. Called when mode changes or user resets.
         * @param {boolean} notifyBackground - Whether to send reset message to background
         */
        function fullReset(notifyBackground = true) {
            stopBuzzing();
            stopLocalTimer();
            isRunning = false;
            timerCompleted = false;
            elapsedTime = 0;
            startTime = 0;

            if (notifyBackground && chrome.runtime?.id) {
                chrome.runtime.sendMessage({ command: 'reset', data: { mode, currentTimerTarget } });
            }

            updateUI();
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
            fullReset(true);
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
        // KEY BEHAVIOR: Any settings change STOPS and RESETS the timer
        ns.settings.onSettingsChange((settings) => {
            const newMode = settings.mode || 'stopwatch';
            const newTarget = settings.currentTimerTarget || 0;

            // Check if anything relevant changed
            const modeChanged = newMode !== mode;
            const targetChanged = newTarget !== currentTimerTarget;

            if (modeChanged || targetChanged) {
                // ALWAYS stop buzzing when settings change
                stopBuzzing();

                // ALWAYS stop the timer when settings change
                stopLocalTimer();
                isRunning = false;
                timerCompleted = false;
                startTime = 0;

                // Update mode and target
                mode = newMode;
                currentTimerTarget = newTarget;

                // Reset elapsed time based on mode
                if (mode === 'stopwatch') {
                    // Stopwatch: reset to 0:00:00
                    elapsedTime = 0;
                } else {
                    // Timer: will show currentTimerTarget in updateUI()
                    elapsedTime = 0;
                }

                // Notify background of the reset
                if (chrome.runtime?.id) {
                    chrome.runtime.sendMessage({ command: 'reset', data: { mode, currentTimerTarget } });
                }

                updateUI();
            }
        });

        // Listen for background broadcast (cross-tab sync)
        chrome.runtime.onMessage.addListener((request) => {
            if (request.command === 'stateChanged') {
                const wasRunning = isRunning;

                isRunning = request.data.isRunning;
                elapsedTime = request.data.elapsedTime ?? elapsedTime;
                startTime = request.data.startTime ?? startTime;
                mode = request.data.mode ?? mode;
                currentTimerTarget = request.data.currentTimerTarget ?? currentTimerTarget;

                // If timer stopped (from another tab or after completion)
                if (wasRunning && !isRunning) {
                    stopLocalTimer();
                    startTime = 0;
                    // Don't stop buzzing here - let it continue if timer completed
                }

                // If timer started
                if (!wasRunning && isRunning) {
                    stopBuzzing();
                    timerCompleted = false;
                    startLocalTimer();
                }

                // If still running, ensure local timer is running
                if (isRunning && !timerInterval) {
                    startLocalTimer();
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
