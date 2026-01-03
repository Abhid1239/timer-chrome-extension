(function () {
    // Public namespace for modules loaded by content scripts
    const ns = (window.TimerExt = window.TimerExt || {});

    /**
     * UI module: builds the Shadow DOM host, loads styles, creates controls,
     * and exposes useful references and helpers. All SVGs/CSS are sourced from
     * `TimerExt.assets` so they can be centrally edited.
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

        // Helpers for time display and icon swap
        function formatTime(ms) {
            if (ms < 0) ms = 0;
            let totalSeconds = Math.floor(ms / 1000);
            let hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
            let minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
            let seconds = (totalSeconds % 60).toString().padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }

        // Format time for timer mode (shows countdown)
        function formatTimerTime(ms) {
            return formatTime(ms);
        }

        // Format time for stopwatch mode (shows elapsed)
        function formatStopwatchTime(ms) {
            return formatTime(ms);
        }

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


