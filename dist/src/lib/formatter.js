/**
 * 5etools formatting utilities
 */
import { titleCase, clean5etoolsText } from './utils.js';
export function format5etoolsTime(time) {
    const first = Array.isArray(time) ? time[0] : time;
    if (!first)
        return "-";
    return `${first.number ?? 1} ${first.unit ?? ""}`.trim();
}
export function format5etoolsRange(range) {
    const distance = range?.distance;
    if (!distance)
        return "-";
    if (distance.type === "self")
        return "Self";
    if (distance.type === "touch")
        return "Touch";
    if (distance.type === "sight")
        return "Sight";
    if (distance.type === "unlimited")
        return "Unlimited";
    if (Number.isFinite(distance.amount))
        return `${distance.amount} ${distance.type}`;
    return titleCase(distance.type ?? range.type ?? "-");
}
export function format5etoolsComponents(components) {
    if (!components)
        return "-";
    const parts = [];
    if (components.v)
        parts.push("V");
    if (components.s)
        parts.push("S");
    if (components.m)
        parts.push("M");
    return parts.join(", ");
}
export function format5etoolsDuration(duration) {
    const first = Array.isArray(duration) ? duration[0] : duration;
    if (!first)
        return "-";
    if (first.type === "instant")
        return "Instantaneous";
    if (first.type === "permanent")
        return "Permanent";
    if (first.type === "special")
        return "Special";
    if (first.type === "timed") {
        const amount = first.duration?.amount ?? 1;
        const type = first.duration?.type ?? "";
        return `${first.concentration ? "Concentration, up to " : ""}${amount} ${type}`.trim();
    }
    return titleCase(first.type);
}
export function entriesToText(entries) {
    return (entries ?? [])
        .map(entryToText)
        .filter(Boolean)
        .join("\n\n");
}
export function entryToText(entry) {
    if (typeof entry === "string")
        return clean5etoolsText(entry);
    if (Array.isArray(entry))
        return entry.map(entryToText).filter(Boolean).join("\n");
    if (!entry || typeof entry !== "object")
        return "";
    if (entry.type === "entries") {
        const title = entry.name ? `${clean5etoolsText(entry.name)}\n` : "";
        return `${title}${entriesToText(entry.entries)}`.trim();
    }
    if (entry.type === "list")
        return (entry.items ?? []).map((item) => `- ${entryToText(item)}`).join("\n");
    if (entry.type === "item")
        return clean5etoolsText(entry.name ?? entry.entry ?? "");
    if (entry.type === "table") {
        const rows = (entry.rows ?? []).map((row) => Array.isArray(row) ? row.map(entryToText).join(" | ") : entryToText(row));
        return [entry.caption, ...rows].filter(Boolean).map(clean5etoolsText).join("\n");
    }
    return clean5etoolsText(entry.name ?? "");
}
export function spellSchoolName(school) {
    const schools = {
        A: "Abjuration",
        C: "Conjuration",
        D: "Divination",
        E: "Enchantment",
        I: "Illusion",
        N: "Necromancy",
        T: "Transmutation",
        V: "Evocation",
    };
    return schools[school] ?? school ?? "";
}
// Label formatting functions (consolidated from src/app/labels.js)
export function compactRange(range = "") {
    return String(range).replace(/\bfeet\b/i, "ft.").replace(/\bfoot\b/i, "ft.");
}
export function rangeLabel(range = "") {
    return /feet|ft\.?/i.test(String(range)) ? "Range" : "Reach";
}
// Portuguese labels (for app UI)
export function spellLevelLabel(level) {
    return level === 0 ? "Cantrips" : `Magias de nivel ${level}`;
}
// English labels (for spells-view.ts compatibility)
export function spellLevelLabelEn(level) {
    return level === 0 ? "Cantrips" : `${ordinalLabel(level)} Level`;
}
export function ordinalLabel(level) {
    const labels = { 1: "1st", 2: "2nd", 3: "3rd" };
    return labels[level] ?? `${level}th`;
}
export function damageTypeLabel(type) {
    const labels = { B: "Bludgeoning", P: "Piercing", S: "Slashing" };
    return labels[type] ?? type ?? "";
}
export function propertyLabel(prop) {
    const key = String(prop).split("|")[0];
    const labels = { V: "Versatile", L: "Light", T: "Thrown", F: "Finesse", H: "Heavy", R: "Reach", "2H": "Two-Handed" };
    return labels[key] ?? key;
}
export function formatCurrency(value) {
    if (value >= 100)
        return `${Math.floor(value / 100)} GP`;
    return `${value} CP`;
}
//# sourceMappingURL=formatter.js.map