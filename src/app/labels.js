export function compactRange(range = "") {
  return String(range).replace(/\bfeet\b/i, "ft.").replace(/\bfoot\b/i, "ft.");
}

export function rangeLabel(range = "") {
  return /feet|ft\.?/i.test(String(range)) ? "Reach" : "Range";
}

export function spellLevelLabel(level) {
  return level === 0 ? "Cantrips" : `Magias de nivel ${level}`;
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
