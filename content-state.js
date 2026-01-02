(function () {
    const ns = (window.TimerExt = window.TimerExt || {});

    /**
     * State module: manages runtime state, interval tick updates, UI syncing,
     * and communication with the background service worker.
     * 
     * Features:
     * - Timer mode with proper pause/resume (tracks remaining time)
     * - Color gradient: Blue → Light Blue → Orange → Red as time runs out
     * - Buzz animation when timer reaches zero (continues until user interaction)
     * - Mode switching properly stops and resets the timer
     */
    function initState(ui) {
        let isRunning = false;
        let isCollapsed = false;
        let startTime = 0;
        let elapsedTime = 0;           // Stopwatch: accumulated time
        let timerRemaining = 0;        // Timer: remaining time when paused
        let timerInterval = null;
        let mode = 'stopwatch';
        let currentTimerTarget = 0;
        let timerCompleted = false;
        let isBuzzing = false;

        // Color constants for timer mode gradient
        const COLORS = {
            blue: '#1a90ff',
            lightBlue: '#5cc8ff',
            orange: '#ff9500',
            red: '#ff3b30'
        };

        // ─────────────────────────────────────────────────────────────────────
        // BUZZ ANIMATION
        // ─────────────────────────────────────────────────────────────────────

        function startBuzzing() {
            if (isBuzzing) return;
            isBuzzing = true;
            timerCompleted = true;
            ui.container.classList.add('buzzing');
        }

        function stopBuzzing() {
            if (!isBuzzing) return;
            isBuzzing = false;
            ui.container.classList.remove('buzzing');
        }

        // ─────────────────────────────────────────────────────────────────────
        // COLOR UPDATE
        // ─────────────────────────────────────────────────────────────────────

        function updateTimeColor(remainingMs) {
            if (mode === 'stopwatch') {
                ui.elements.timeDisplay.style.color = COLORS.blue;
                return;
            }

            const percentage = currentTimerTarget > 0 ? remainingMs / currentTimerTarget : 1;
            let color;
            if (percentage > 0.75) color = COLORS.blue;
            else if (percentage > 0.5) color = COLORS.lightBlue;
            else if (percentage > 0.25) color = COLORS.orange;
            else color = COLORS.red;

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
                // Stopwatch: count up from elapsedTime
                const currentTotal = elapsedTime + (Date.now() - startTime);
                ui.elements.timeDisplay.textContent = ui.formatTime(currentTotal);
                updateTimeColor(currentTotal);
            } else {
                // Timer: count down from timerRemaining
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, timerRemaining - elapsed);
                ui.elements.timeDisplay.textContent = ui.formatTime(remaining);
                updateTimeColor(remaining);

                // Timer completed
                if (remaining <= 0 && isRunning) {
                    stopLocalTimer();
                    isRunning = false;
                    timerRemaining = 0;
                    startTime = 0;

                    chrome.runtime.sendMessage({
                        command: 'stop',
                        data: { elapsedTime: 0, timerRemaining: 0, mode, currentTimerTarget }
                    });

                    startBuzzing();
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
                    ui.elements.timeDisplay.textContent = ui.formatTime(0);
                    updateTimeColor(0);
                } else if (!isRunning) {
                    // Show timerRemaining (paused state) or full target
                    const displayTime = timerRemaining > 0 ? timerRemaining : currentTimerTarget;
                    ui.elements.timeDisplay.textContent = ui.formatTime(displayTime);
                    updateTimeColor(displayTime);
                }
            }
            ui.setRunningIcons(isRunning);
            ui.container.classList.toggle('collapsed', isCollapsed);
            const iconWrapper = ui.controls.collapseButton.querySelector('.icon-wrapper');
            iconWrapper.innerHTML = isCollapsed ? ui.svgs.timer : ui.svgs.back;
        }

        // ─────────────────────────────────────────────────────────────────────
        // FULL RESET
        // ─────────────────────────────────────────────────────────────────────

        function fullReset(notifyBackground = true) {
            stopBuzzing();
            stopLocalTimer();
            isRunning = false;
            timerCompleted = false;
            elapsedTime = 0;
            timerRemaining = currentTimerTarget; // Reset to full target
            startTime = 0;

            if (notifyBackground && chrome.runtime?.id) {
                chrome.runtime.sendMessage({
                    command: 'reset',
                    data: { mode, currentTimerTarget, timerRemaining: currentTimerTarget }
                });
            }

            updateUI();
        }

        // ─────────────────────────────────────────────────────────────────────
        // PUBLIC ACTIONS
        // ─────────────────────────────────────────────────────────────────────

        function toggleRun() {
            if (!chrome.runtime?.id) return;

            stopBuzzing();

            // Timer completed - restart from full target
            if (timerCompleted && mode === 'timer') {
                timerCompleted = false;
                isRunning = true;
                timerRemaining = currentTimerTarget;
                startTime = Date.now();
                chrome.runtime.sendMessage({
                    command: 'start',
                    data: { startTime, elapsedTime: 0, timerRemaining, mode, currentTimerTarget }
                });
                startLocalTimer();
                updateUI();
                return;
            }

            // Normal toggle
            isRunning = !isRunning;

            if (isRunning) {
                // Starting
                startTime = Date.now();

                if (mode === 'timer') {
                    // Timer: if timerRemaining is 0, use full target
                    if (timerRemaining <= 0) {
                        timerRemaining = currentTimerTarget;
                    }
                }

                chrome.runtime.sendMessage({
                    command: 'start',
                    data: { startTime, elapsedTime, timerRemaining, mode, currentTimerTarget }
                });
                startLocalTimer();
            } else {
                // Pausing
                stopLocalTimer();

                if (mode === 'stopwatch') {
                    // Stopwatch: accumulate elapsed time
                    elapsedTime += (Date.now() - startTime);
                } else {
                    // Timer: save remaining time
                    const elapsed = Date.now() - startTime;
                    timerRemaining = Math.max(0, timerRemaining - elapsed);
                }

                startTime = 0;
                chrome.runtime.sendMessage({
                    command: 'stop',
                    data: { elapsedTime, timerRemaining, mode, currentTimerTarget }
                });
            }
            updateUI();
        }

        function reset() {
            if (!chrome.runtime?.id) return;
            fullReset(true);
        }

        function setCollapsed(collapsed) {
            // NOTE: Collapse should NOT stop buzzing or affect timer state
            // It's just a UI minimize, not a user interaction with the timer
            isCollapsed = collapsed;
            ui.container.classList.toggle('collapsed', isCollapsed);
            const iconWrapper = ui.controls.collapseButton.querySelector('.icon-wrapper');
            iconWrapper.innerHTML = isCollapsed ? ui.svgs.timer : ui.svgs.back;
            if (chrome.runtime?.id) {
                chrome.storage.local.set({ isTimerCollapsed: isCollapsed });
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // INITIALIZATION & LISTENERS
        // ─────────────────────────────────────────────────────────────────────

        // Initial sync from background
        if (chrome.runtime?.id) {
            chrome.runtime.sendMessage({ command: 'getStatus' }, (response) => {
                if (chrome.runtime.lastError) return;
                if (response) {
                    isRunning = response.isRunning || false;
                    elapsedTime = response.elapsedTime || 0;
                    timerRemaining = response.timerRemaining || 0;
                    startTime = response.startTime || 0;
                    mode = response.mode || 'stopwatch';
                    currentTimerTarget = response.currentTimerTarget || 0;

                    // Handle timer mode on page reload while running
                    if (mode === 'timer' && isRunning && startTime > 0) {
                        // Recalculate remaining based on time elapsed since start
                        const elapsedSinceStart = Date.now() - startTime;
                        timerRemaining = Math.max(0, timerRemaining - elapsedSinceStart);
                        // Reset startTime to now for tick() calculations
                        startTime = Date.now();
                    }

                    // If timer mode and not running, ensure we show target
                    if (mode === 'timer' && timerRemaining <= 0 && !isRunning) {
                        timerRemaining = currentTimerTarget;
                    }

                    updateUI();
                    if (isRunning) startLocalTimer();
                }
            });
        }

        // Settings changes - stop and reset
        ns.settings.onSettingsChange((settings) => {
            const newMode = settings.mode || 'stopwatch';
            const newTarget = settings.currentTimerTarget || 0;

            if (newMode !== mode || newTarget !== currentTimerTarget) {
                stopBuzzing();
                stopLocalTimer();
                isRunning = false;
                timerCompleted = false;
                startTime = 0;

                mode = newMode;
                currentTimerTarget = newTarget;
                elapsedTime = 0;
                timerRemaining = newTarget; // Reset to new target

                if (chrome.runtime?.id) {
                    chrome.runtime.sendMessage({
                        command: 'reset',
                        data: { mode, currentTimerTarget, timerRemaining }
                    });
                }

                updateUI();
            }
        });

        // Cross-tab sync
        chrome.runtime.onMessage.addListener((request) => {
            if (request.command === 'stateChanged') {
                const wasRunning = isRunning;

                isRunning = request.data.isRunning;
                elapsedTime = request.data.elapsedTime ?? elapsedTime;
                timerRemaining = request.data.timerRemaining ?? timerRemaining;
                startTime = request.data.startTime ?? startTime;
                mode = request.data.mode ?? mode;
                currentTimerTarget = request.data.currentTimerTarget ?? currentTimerTarget;

                if (wasRunning && !isRunning) {
                    stopLocalTimer();
                    startTime = 0;
                }

                if (!wasRunning && isRunning) {
                    stopBuzzing();
                    timerCompleted = false;
                    startLocalTimer();
                }

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
