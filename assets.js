(function () {
    // Centralized assets for SVGs and inline CSS used by the timer UI
    const ns = (window.TimerExt = window.TimerExt || {});

    const svgs = {
        back: `<svg class="icon icon-reverse" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M47 239c-9.4 9.4-9.4 24.6 0 33.9L207 433c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9L97.9 256 241 113c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0L47 239z"></path></svg>`,
        play: `<svg class="icon" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"></path></svg>`,
        pause: `<svg class="icon" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"></path></svg>`,
        reset: `<svg class="icon" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M496 200c0 13.3-10.7 24-24 24h0H360 328c-13.3 0-24-10.7-24-24s10.7-24 24-24h32 54.1l-52.1-52.1C333.8 95.8 295.7 80 256 80c-72.7 0-135.2 44.1-162 107.1c-5.2 12.2-19.3 17.9-31.5 12.7s-17.9-19.3-12.7-31.5C83.9 88.2 163.4 32 256 32c52.5 0 102.8 20.8 139.9 57.9L448 142.1V88l0-.4V56c0-13.3 10.7-24 24-24s24 10.7 24 24V200zM40 288H152c13.3 0 24 10.7 24 24s-10.7 24-24 24H97.9l52.1 52.1C178.2 416.2 216.3 432 256 432c72.6 0 135-43.9 161.9-106.8c5.2-12.2 19.3-17.8 31.5-12.6s17.8 19.3 12.6 31.5C427.8 424 348.5 480 256 480c-52.5 0-102.8-20.8-139.9-57.9L64 369.9V424c0 13.3-10.7 24-24 24s-24-10.7-24-24V312c0-13.3 10.7-24 24-24z"></path></svg>`,
        timer: `<svg class="icon" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" preserveAspectRatio="xMidYMid meet" style="width: 100%;height: 100%;content-visibility: visible;scale: 2;transform: translate(1px, 0px);"><g clip-path=""><path fill="rgb(26,144,255)" fill-opacity="1" d=" M4,0.75 C4,0.3440000116825104 4.311999797821045,0 4.75,0 C5.916999816894531,0 7.083000183105469,0 8.25,0 C8.656000137329102,0 9,0.3440000116825104 9,0.75 C9,1.187999963760376 8.656000137329102,1.5 8.25,1.5 C7.916999816894531,1.5 7.583000183105469,1.5 7.25,1.5 C7.25,2.0209999084472656 7.25,2.5390000343322754 7.25,3.059999942779541 C8.593999862670898,3.2160000801086426 9.810999870300293,3.7850000858306885 10.779999732971191,4.659999847412109 C11.093000411987305,4.3480000495910645 11.406999588012695,4.0320000648498535 11.720000267028809,3.7200000286102295 C12.00100040435791,3.438999891281128 12.468999862670898,3.438999891281128 12.75,3.7200000286102295 C13.062000274658203,4.0320000648498535 13.062000274658203,4.499000072479248 12.75,4.78000020980835 C12.427000045776367,5.103000164031982 12.102999687194824,5.427000045776367 11.779999732971191,5.75 C12.529999732971191,6.813000202178955 13,8.125 13,9.5 C13,13.093999862670898 10.062000274658203,16 6.5,16 C2.9059998989105225,16 0,13.093999862670898 0,9.5 C0,6.186999797821045 2.5,3.434999942779541 5.75,3.059999942779541 C5.75,2.5390000343322754 5.75,2.0209999084472656 5.75,1.5 C5.416999816894531,1.5 5.083000183105469,1.5 4.75,1.5 C4.311999797821045,1.5 4,1.187999963760376 4,0.75 C4,0.75 4,0.75 4,0.75 C4,0.75 4,0.75 4,0.75z M6.5,14.5 C8.281000137329102,14.5 9.904000282287598,13.562999725341797 10.8100004196167,12 C11.717000007629395,10.468999862670898 11.717000007629395,8.562999725341797 10.8100004196167,7 C9.904000282287598,5.468999862670898 8.281000137329102,4.5 6.5,4.5 C4.688000202178955,4.5 3.065999984741211,5.468999862670898 2.1600000858306885,7 C1.253999948501587,8.562999725341797 1.253999948501587,10.468999862670898 2.1600000858306885,12 C3.065999984741211,13.562999725341797 4.688000202178955,14.5 6.5,14.5 C6.5,14.5 6.5,14.5 6.5,14.5 C6.5,14.5 6.5,14.5 6.5,14.5z M7.25,6.75 C7.25,7.833000183105469 7.25,8.916999816894531 7.25,10 C7.25,10.437999725341797 6.906000137329102,10.75 6.5,10.75 C6.061999797821045,10.75 5.75,10.437999725341797 5.75,10 C5.75,8.916999816894531 5.75,7.833000183105469 5.75,6.75 C5.75,6.343999862670898 6.061999797821045,6 6.5,6 C6.906000137329102,6 7.25,6.343999862670898 7.25,6.75 C7.25,6.75 7.25,6.75 7.25,6.75 C7.25,6.75 7.25,6.75 7.25,6.75z"></path></g></svg>`
    };

    const css = `
@keyframes buzz {
    /* Active phase: 0-25% (0.5s out of 2s) - shake rapidly */
    0% { transform: translateX(0); }
    2.5% { transform: translateX(-3px); }
    5% { transform: translateX(3px); }
    7.5% { transform: translateX(-3px); }
    10% { transform: translateX(3px); }
    12.5% { transform: translateX(-3px); }
    15% { transform: translateX(3px); }
    17.5% { transform: translateX(-3px); }
    20% { transform: translateX(3px); }
    22.5% { transform: translateX(-3px); }
    25% { transform: translateX(0); }
    /* Idle phase: 25-100% (1.5s) - stay still for user to interact */
    25.1%, 100% { transform: translateX(0); }
}
#persistent-timer-container { position: fixed; z-index: 2147483647; display: flex; align-items: center; padding: 4px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #282828; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: width 0.3s ease-in-out, transform 0.1s ease; overflow: hidden; color: #a8a8a8; height: 32px; cursor: grab; box-sizing: border-box; }
#persistent-timer-container.dragging { transition: none; }
#persistent-timer-container.buzzing { animation: buzz 2s ease-in-out infinite; box-shadow: 0 0 20px rgba(255, 59, 48, 0.7), 0 0 40px rgba(255, 59, 48, 0.4); }
.play-timer-group, .control-button#reset-btn { transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out, width 0.3s ease-in-out; white-space: nowrap; }
#persistent-timer-container.collapsed .play-timer-group, #persistent-timer-container.collapsed .control-button#reset-btn { opacity: 0; transform: scale(0.8); width: 0; pointer-events: none; padding: 0; }
.play-timer-group { display: flex; align-items: center; gap: 2px; height: 100%; padding: 2px; }
.control-button { display: flex; align-items: center; justify-content: center; height: 100%; cursor: pointer; padding: 2px; border-radius: 4px; background-color: transparent; border: none; transition: background-color 0.15s ease, transform 0.1s ease; flex-shrink: 0; }
.control-button:hover { background-color: rgb(79 79 79); }
.control-button:active { transform: scale(0.85); background-color: rgba(96, 165, 250, 0.3); }
.control-button:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; border-radius: 6px; }
.icon-wrapper { position: relative; width: 14px; height: 14px; padding: 1px; }
.icon { position: absolute; top: 50%; left: 50%; height: 13px; transform: translate(-50%, -50%); color: #cacaca; }
.time-display { font-size: 14px; color: #1a90ff; user-select: none; min-width: 62px; text-align: center; transition: color 0.5s ease; }
.hidden { display: none; }
.icon-reverse { transform: translate(-50%, -50%) rotate(180deg); }
@media (prefers-reduced-motion: reduce) { #persistent-timer-container, .play-timer-group, .control-button#reset-btn, #persistent-timer-container.buzzing { transition: none; animation: none; } }
`;

    ns.assets = { svgs, css };
})();


