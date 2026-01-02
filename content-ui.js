(function () {
    // Public namespace for modules loaded by content scripts
    const ns = (window.TimerExt = window.TimerExt || {});

    /**
     * Build and attach the timer UI inside an open Shadow DOM and expose its elements and helpers.
     *
     * @returns {{host: HTMLDivElement, shadow: ShadowRoot, container: HTMLDivElement, controls: {collapseButton: HTMLButtonElement, playPauseButton: HTMLButtonElement, resetButton: HTMLButtonElement}, elements: {timeDisplay: HTMLDivElement, playIcon: HTMLElement|null, pauseIcon: HTMLDivElement}, svgs: Object, formatTime: function(number):string, formatTimerTime: function(number):string, formatStopwatchTime: function(number):string, setRunningIcons: function(boolean):void}} An object containing:
     * - host: the host div attached to document for the shadow root.
     * - shadow: the open ShadowRoot where UI is rendered.
     * - container: the root container element inside the shadow root.
     * - controls: button elements for collapse, play/pause, and reset.
     * - elements: UI elements including the time display and icon wrappers.
     * - svgs: SVG asset map sourced from TimerExt.assets.
     * - formatTime(ms): formats milliseconds as "HH:MM:SS".
     * - formatTimerTime(ms): formats milliseconds for countdown timer display.
     * - formatStopwatchTime(ms): formats milliseconds for stopwatch (elapsed) display.
     * - setRunningIcons(isRunning): swap play/pause icon visibility based on running state.
     */
    function initUI() {
        // Host that contains the shadow root so we can position it on the page
        const host = document.createElement('div');
        host.id = 'timer-shadow-host';
        host.setAttribute('data-timer-host', 'true');
        host.style.all = 'initial';
        host.style.position = 'fixed';
        host.style.zIndex = '2147483647';

        const shadow = host.attachShadow({ mode: 'open' });

        // Container holds the actual timer UI inside the shadow root
        const container = document.createElement('div');
        container.id = 'persistent-timer-container';

        // SVGs for buttons from assets module
        const svgs = ns.assets?.svgs || {};

        function createButton(id, svg) {
            const button = document.createElement('button');
            button.className = 'control-button';
            if (id) button.id = id;
            const iconWrapper = document.createElement('div');
            iconWrapper.className = 'icon-wrapper';
            iconWrapper.innerHTML = svg;
            button.appendChild(iconWrapper);
            return button;
        }

        const collapseButton = createButton('collapse-btn', svgs.back);
        const playPauseButton = createButton('play-pause-btn', svgs.play);
        const resetButton = createButton('reset-btn', svgs.reset);

        const playIcon = playPauseButton.querySelector('.icon-wrapper');
        playIcon.id = 'play-icon-wrapper';
        const pauseIcon = document.createElement('div');
        pauseIcon.id = 'pause-icon-wrapper';
        pauseIcon.className = 'icon-wrapper hidden';
        pauseIcon.innerHTML = svgs.pause;
        playPauseButton.appendChild(pauseIcon);

        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'time-display';
        timeDisplay.textContent = '00:00:00';

        const playTimerGroup = document.createElement('div');
        playTimerGroup.className = 'play-timer-group';
        playTimerGroup.appendChild(playPauseButton);
        playTimerGroup.appendChild(timeDisplay);

        container.appendChild(collapseButton);
        container.appendChild(playTimerGroup);
        container.appendChild(resetButton);

        // Accessibility helpers for buttons
        [collapseButton, playPauseButton, resetButton].forEach((button) => {
            const label = button.id.replace('-btn', '').replace('-', ' ');
            button.setAttribute('aria-label', label);
            button.title = label;
            button.setAttribute('tabindex', '0');
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });

        // Style loading: pull inline CSS from assets module so it's easy to tweak
        let stylesAppended = false;
        if (chrome.runtime?.id) {
            try {
                // Intentionally disabled external stylesheet to avoid invalid URL during early loads.
                // Consumers can re-enable if desired.
            } catch (e) { }
        }
        if (!stylesAppended) {
            const inlineStyle = document.createElement('style');
            inlineStyle.textContent = ns.assets?.css || '';
            shadow.appendChild(inlineStyle);
        }

        shadow.appendChild(container);

        /**
         * Format a duration (milliseconds) as an HH:MM:SS time string.
         * @param {number} ms - Duration in milliseconds.
         * @returns {string} The formatted time as `HH:MM:SS` with each unit zero-padded to two digits; negative `ms` values are treated as zero.
         */
        function formatTime(ms) {
            if (ms < 0) ms = 0;
            let totalSeconds = Math.floor(ms / 1000);
            let hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
            let minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
            let seconds = (totalSeconds % 60).toString().padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }

        /**
         * Format a millisecond duration for timer (countdown) display.
         * @param {number} ms - Duration in milliseconds; values less than 0 are treated as 0.
         * @returns {string} The duration formatted as `HH:MM:SS`.
         */
        function formatTimerTime(ms) {
            return formatTime(ms);
        }

        /**
         * Format an elapsed time value (stopwatch) into an `HH:MM:SS` string.
         * @param {number} ms - Elapsed time in milliseconds.
         * @returns {string} A string in `HH:MM:SS` representing the elapsed time; negative inputs produce `00:00:00`.
         */
        function formatStopwatchTime(ms) {
            return formatTime(ms);
        }

        /**
         * Update the visible icon to reflect whether the timer is running.
         * @param {boolean} isRunning - `true` to show the pause icon and hide the play icon; `false` to show the play icon and hide the pause icon.
         */
        function setRunningIcons(isRunning) {
            if (isRunning) {
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
            } else {
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
            }
        }

        return {
            host,
            shadow,
            container,
            controls: { collapseButton, playPauseButton, resetButton },
            elements: { timeDisplay, playIcon, pauseIcon },
            svgs,
            formatTime,
            formatTimerTime,
            formatStopwatchTime,
            setRunningIcons
        };
    }

    ns.ui = { initUI };
})();

