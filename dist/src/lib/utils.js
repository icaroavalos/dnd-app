/**
 * Shared utility functions
 */
export function titleCase(value) {
    return String(value)
        .split(/[-\s]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
export function ordinalSuffix(value) {
    if (!Number.isFinite(value))
        return "";
    const mod100 = value % 100;
    if (mod100 >= 11 && mod100 <= 13)
        return "th";
    const mod10 = value % 10;
    if (mod10 === 1)
        return "st";
    if (mod10 === 2)
        return "nd";
    if (mod10 === 3)
        return "rd";
    return "th";
}
export function slugifyName(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replaceAll("'", "")
        .replaceAll("/", " ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
export function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
export function setByPath(target, path, value) {
    const parts = path.split(".");
    let cursor = target;
    while (parts.length > 1) {
        const part = parts.shift();
        cursor[part] ??= {};
        cursor = cursor[part];
    }
    cursor[parts[0]] = value;
}
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
export function clean5etoolsText(value) {
    return String(value ?? "")
        .replace(/\{@(?:spell|item|condition|skill|sense|variantrule|filter|hazard|scaledamage|damage|feat|action|book)\s+([^|}]+)(?:\|[^}]*)?}/g, "$1")
        .replace(/\{@(?:dice|hit|d20|chance)\s+([^|}]+)(?:\|[^}]*)?}/g, "$1")
        .replace(/\{@i\s+([^}]+)}/g, "$1")
        .replace(/\{@b\s+([^}]+)}/g, "$1")
        .replace(/\{@[^}]+\}/g, "")
        .trim();
}
export function paragraphs(value) {
    return String(value || "")
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("");
}
//# sourceMappingURL=utils.js.map