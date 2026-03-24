let exitTimer = null;
let onKeyCallback = null;
let onParentExitCallback = null;
let onExitProgressCallback = null;

const EXIT_HOLD_MS = 5000;

function handleKeyDown(e) {
  // Parent exit: Ctrl+Shift+Q held for 5 seconds
  if (e.ctrlKey && e.shiftKey && (e.key === 'Q' || e.key === 'q')) {
    e.preventDefault();
    e.stopPropagation();
    if (!exitTimer) {
      if (onExitProgressCallback) onExitProgressCallback(true);
      exitTimer = setTimeout(() => {
        exitTimer = null;
        if (onExitProgressCallback) onExitProgressCallback(false);
        if (onParentExitCallback) onParentExitCallback();
      }, EXIT_HOLD_MS);
    }
    return;
  }

  // Block all system shortcuts
  e.preventDefault();
  e.stopPropagation();

  // Forward to effect handler
  if (onKeyCallback) onKeyCallback(e);
}

function handleKeyUp() {
  if (exitTimer) {
    clearTimeout(exitTimer);
    exitTimer = null;
    if (onExitProgressCallback) onExitProgressCallback(false);
  }
}

function handleContextMenu(e) {
  e.preventDefault();
}

function handleBeforeUnload(e) {
  e.preventDefault();
  e.returnValue = '';
}

function handleDragStart(e) {
  e.preventDefault();
}

export function initKeyCapture(onKey, onParentExit, onExitProgress) {
  onKeyCallback = onKey;
  onParentExitCallback = onParentExit;
  onExitProgressCallback = onExitProgress;

  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('keyup', handleKeyUp, true);
  document.addEventListener('contextmenu', handleContextMenu, true);
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('dragstart', handleDragStart, true);
}

export function destroyKeyCapture() {
  document.removeEventListener('keydown', handleKeyDown, true);
  document.removeEventListener('keyup', handleKeyUp, true);
  document.removeEventListener('contextmenu', handleContextMenu, true);
  window.removeEventListener('beforeunload', handleBeforeUnload);
  document.removeEventListener('dragstart', handleDragStart, true);

  if (exitTimer) {
    clearTimeout(exitTimer);
    exitTimer = null;
  }

  onKeyCallback = null;
  onParentExitCallback = null;
  onExitProgressCallback = null;
}
