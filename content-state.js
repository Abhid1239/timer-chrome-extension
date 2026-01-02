(function () {
    const ns = (window.TimerExt = window.TimerExt || {});

    /**
     * Initialize and manage timer/stopwatch runtime state, UI syncing, interval ticks, and background communication.
     *
     * Manages stopwatch and countdown modes (with automatic restart-after-completion flow for timers), time-based color gradients, buzz animation on timer completion, cross-tab synchronization, and UI control wiring.
     *
     * @param {object} ui - UI helper and element references used by the state module.
     * @param {HTMLElement} ui.container - Root container element (used for class toggles and buzzing).
     * @param {object} ui.elements - Element references.
     * @param {HTMLElement} ui.elements.timeDisplay - Element showing the formatted time string.
     * @param {function(number):string} ui.formatTime - Formats milliseconds to a display string.
     * @param {function(boolean):void} ui.setRunningIcons - Update play/pause UI state.
     * @param {object} ui.controls - Control elements.
     * @param {HTMLElement} ui.controls.playPauseButton - Play/pause button element.
     * @param {HTMLElement} ui.controls.resetButton - Reset button element.
     * @param {HTMLElement} ui.controls.collapseButton - Collapse toggle button element.
     * @param {object} ui.svgs - SVG markup used for collapse button icons (`timer` and `back`).
     *
     * @returns {object} An API for controlling state.
     * @returns {function():void} returns.toggleRun - Toggle between running and paused (handles restart after timer completion).
     * @returns {function():void} returns.reset - Reset timer/stopwatch state and notify background.
     * @returns {function(boolean):void} returns.setCollapsed - Set and persist the collapsed UI state.
     * @returns {function():void} returns.stopBuzzing - Stop the completion buzz animation if active.
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
         * Activate the buzz animation when the timer completes.
         *
         * Sets the internal buzzing flag and adds the 'buzzing' CSS class to the UI container.
         * No operation if the animation is already active.
         */
        function startBuzzing() {
            if (isBuzzing) return;
            isBuzzing = true;
            ui.container.classList.add('buzzing');
        }

        /**
         * Deactivates the completion buzz animation and removes the 'buzzing' CSS class from the UI container.
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
         * Set the UI time display color according to remaining time for the active timer.
         *
         * In timer mode selects a color from the configured gradient based on the fraction
         * of remainingMs relative to the current timer target. In stopwatch mode forces
         * the display color to the stopwatch color.
         *
         * @param {number} remainingMs - Remaining time in milliseconds (ignored for stopwatch mode).
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
        /**
         * Advance the timer by one tick: refresh the displayed time and color, and handle timer completion.
         *
         * If the Chrome extension runtime is unavailable the interval is cleared and the function exits.
         * In stopwatch mode the function updates the display with the accumulated elapsed time and applies the stopwatch color.
         * In timer mode the function updates the display with the remaining time, applies a color based on remaining time, and when remaining reaches zero it stops the local timer, marks the timer completed, resets start time, notifies the background with a stop command (including `elapsedTime: 0`, `mode`, and `currentTimerTarget`), starts the buzz animation, and updates the UI to show the play icon.
         */

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

        /**
         * Start or restart the local timer that invokes `tick` every second.
         *
         * Clears any existing interval, runs `tick` immediately, and schedules `tick`
         * to run once per second thereafter.
         */
        function startLocalTimer() {
            if (timerInterval) clearInterval(timerInterval);
            tick();
            timerInterval = setInterval(tick, 1000);
        }

        /**
         * Stop the local interval used for ticking updates and clear its handle.
         *
         * Safe to call when no timer is running; ensures the interval reference is cleared.
         */
        function stopLocalTimer() {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        // ─────────────────────────────────────────────────────────────────────
        // UI UPDATE
        /**
         * Update all visible UI elements to reflect the current timer/stopwatch state.
         *
         * Updates the time display and its color based on mode, running state, and completion status; updates run/pause icons; toggles the container's collapsed class; and sets the collapse button icon.
         */

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
        /**
         * Toggle the timer's running state and handle restart-after-completion for timer mode.
         *
         * Stops any active buzz animation, then either restarts a completed countdown (if in timer mode)
         * or toggles between start and stop. When starting, records the run start time, notifies the
         * background service, and starts the local interval. When stopping, stops the local interval,
         * accumulates elapsed time for stopwatch mode, resets the start time, and notifies the background.
         * Always updates the UI to reflect the new state.
         */

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

        /**
         * Reset the timer state to its initial idle condition and stop any active behaviors.
         *
         * Stops buzzing and any local ticking, clears running and completion flags, resets elapsed and start times, notifies the background script of the reset (including current mode and target), and updates the UI.
         */
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

        /**
         * Set the UI collapsed state and persist it.
         *
         * Stops any active buzz animation, updates the container's collapsed class and collapse button icon to match the new state, and saves the state to chrome.storage.local.
         * @param {boolean} collapsed - `true` to collapse the timer UI, `false` to expand it.
         */
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