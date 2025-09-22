// public/js/pages/assessment-lockdown.js

let lockdownActive = false;
let originalHandlers = {};

function startLockdown() {
    lockdownActive = true;

    // Save original handlers
    originalHandlers.keydown = document.onkeydown;
    originalHandlers.contextmenu = document.oncontextmenu;

    // Prevent right-click
    document.oncontextmenu = (e) => e.preventDefault();

    // Prevent copy, paste, select all, save, print, etc.
    document.onkeydown = (e) => {
        if (
            (e.ctrlKey && ['c', 'v', 'x', 'a', 's', 'p'].includes(e.key.toLowerCase())) ||
            e.key === "PrintScreen"
        ) {
            e.preventDefault();
            return false;
        }
    };

    // Listen for fullscreen changes
    document.addEventListener("fullscreenchange", enforceFullscreen);
}

function enforceFullscreen() {
    if (lockdownActive && !document.fullscreenElement) {
        alert("🚨 You exited fullscreen! The test is locked.");
        // You can auto-submit here if needed:
        // document.getElementById("submit-assessment-btn")?.click();
    }
}

function stopLockdown() {
    lockdownActive = false;

    // Remove fullscreen listener
    document.removeEventListener("fullscreenchange", enforceFullscreen);

    // Restore original handlers
    document.onkeydown = originalHandlers.keydown || null;
    document.oncontextmenu = originalHandlers.contextmenu || null;

    // Exit fullscreen cleanly
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}

// Expose globally so assessment.js can use them
window.startLockdown = startLockdown;
window.stopLockdown = stopLockdown;
