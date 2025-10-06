(function () {
    const ns = (window.TimerExt = window.TimerExt || {});

    /**
     * Drag module (mouse-based): enables dragging the timer container and
     * persists a custom position. Clears any conflicting bottom/right styles at
     * drag start to avoid layout constraints interfering with movement.
     */
    function initDrag(ui) {
        const { host, container } = ui;

        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

        function onMouseMove(e) {
            if (!isDragging) return;

            // Calculate new position with smooth clamping
            const left = clamp(e.clientX - dragOffsetX, 0, Math.max(0, window.innerWidth - container.offsetWidth));
            const top = clamp(e.clientY - dragOffsetY, 0, Math.max(0, window.innerHeight - container.offsetHeight));

            // Apply position immediately for smooth movement
            container.style.left = `${left}px`;
            container.style.top = `${top}px`;

            e.preventDefault();
        }

        function onMouseUp(e) {
            if (!isDragging) return;
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove, true);
            document.removeEventListener('mouseup', onMouseUp, true);
            document.documentElement.style.cursor = '';
            document.body && (document.body.style.userSelect = '');
            container.classList.remove('dragging');

            // Save the final position
            const rect = container.getBoundingClientRect();
            const left = Math.round(rect.left);
            const top = Math.round(rect.top);
            chrome.storage.local.set({
                timerPositionMode: 'custom',
                timerCustomPosition: { left, top }
            });

            e.preventDefault();
        }

        host.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            // Ignore drags that originate from control buttons (preserve clicks)
            if (e.target && e.target.closest && e.target.closest('.control-button')) {
                return;
            }

            const rect = container.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            isDragging = true;

            // Set up for smooth dragging
            container.style.position = 'fixed';
            container.style.right = 'auto';
            container.style.bottom = 'auto';
            container.style.left = `${rect.left}px`;
            container.style.top = `${rect.top}px`;
            container.classList.add('dragging');

            // Immediate cursor feedback
            document.documentElement.style.cursor = 'grabbing';
            document.body && (document.body.style.userSelect = 'none');

            // Track on document to ensure smooth drag outside timer bounds
            document.addEventListener('mousemove', onMouseMove, true);
            document.addEventListener('mouseup', onMouseUp, true);
        });
    }

    ns.drag = { initDrag };
})();


