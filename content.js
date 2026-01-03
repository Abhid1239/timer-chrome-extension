/**
 * Bootstrap content script: initialize modular content components.
 * - UI: builds shadow DOM and controls
 * - Settings: load and listen to changes
 * - State: runtime timer logic and background sync
 * - Drag: pointer-based drag with persistence
 */
(function () {
  const ns = (window.TimerExt = window.TimerExt || {});

  // Respond to ping from background script to check if content script is loaded
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'ping') {
      sendResponse({ pong: true });
      return true;
    }
  });

  // Build UI and mount host when body is ready
  const ui = ns.ui.initUI();
  if (!document.body) {
    new MutationObserver((mut, obs) => {
      if (document.body) { document.body.appendChild(ui.host); obs.disconnect(); }
    }).observe(document.documentElement, { childList: true, subtree: true });
  } else {
    document.body.appendChild(ui.host);
  }

  // Apply settings to position/visibility and collapsed state
  function applySettings(settings) {
    ui.container.style.display = settings.isTimerVisible ? 'flex' : 'none';
    const mode = settings.timerPositionMode || 'preset';

    if (mode === 'custom' && settings.timerCustomPosition && typeof settings.timerCustomPosition.left === 'number' && typeof settings.timerCustomPosition.top === 'number') {
      // Custom positioning: use exact coordinates
      ui.container.style.position = 'fixed';
      ui.container.style.left = `${settings.timerCustomPosition.left}px`;
      ui.container.style.top = `${settings.timerCustomPosition.top}px`;
      ui.container.style.right = 'auto';
      ui.container.style.bottom = 'auto';
    } else {
      // Preset positioning: calculate positions based on window size
      const position = settings.timerPosition || 'top-right';
      ui.container.style.position = 'fixed';
      ui.container.style.right = 'auto';
      ui.container.style.bottom = 'auto';

      switch (position) {
        case 'top-left':
          ui.container.style.left = '8px';
          ui.container.style.top = '8px';
          break;
        case 'top-right':
          ui.container.style.left = 'auto';
          ui.container.style.right = '8px';
          ui.container.style.top = '8px';
          break;
        case 'bottom-left':
          ui.container.style.left = '8px';
          ui.container.style.top = 'auto';
          ui.container.style.bottom = '8px';
          break;
        case 'bottom-right':
          ui.container.style.left = 'auto';
          ui.container.style.right = '8px';
          ui.container.style.top = 'auto';
          ui.container.style.bottom = '8px';
          break;
        default:
          // Fallback to top-right
          ui.container.style.left = 'auto';
          ui.container.style.right = '8px';
          ui.container.style.top = '8px';
      }
    }

    ui.container.classList.toggle('collapsed', settings.isTimerCollapsed);
    const iconWrapper = ui.controls.collapseButton.querySelector('.icon-wrapper');
    iconWrapper.innerHTML = settings.isTimerCollapsed ? ui.svgs.timer : ui.svgs.back;
  }
  ns.settings.loadSettings(applySettings);
  ns.settings.onSettingsChange(applySettings);

  // Initialize runtime state and dragging
  ns.state.initState(ui);
  ns.drag.initDrag(ui);
})();