const STORAGE_KEY = "dnd-sheet-builder";
export function loadState(defaultState) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved)
        return { ...defaultState };
    try {
        return { ...defaultState, ...JSON.parse(saved) };
    }
    catch {
        return { ...defaultState };
    }
}
export function saveState(state) {
    const savedState = { ...state };
    // Don't persist big API data or volatile derived state
    delete savedState.api;
    delete savedState.derived;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
}
export async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok)
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    return response.json();
}
//# sourceMappingURL=persistence.js.map