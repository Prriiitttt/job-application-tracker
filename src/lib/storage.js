const VIEW_MODE_KEY = "appliedViewMode";
const VALID_VIEW_MODES = ["list", "kanban"];

export function getStoredViewMode(defaultMode = "list") {
  try {
    const v = window.localStorage.getItem(VIEW_MODE_KEY);
    return VALID_VIEW_MODES.includes(v) ? v : defaultMode;
  } catch {
    return defaultMode;
  }
}

export function setStoredViewMode(mode) {
  if (!VALID_VIEW_MODES.includes(mode)) return;
  try {
    window.localStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {
    /* ignore quota / availability errors */
  }
}
