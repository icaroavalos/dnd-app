import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = path.join(ROOT, "data");
const DND_2014 = "https://www.dnd5eapi.co/api/2014";
const OPEN5E = "https://api.open5e.com/v2";

const dndEndpoints = [
  "ability-scores",
  "alignments",
  "backgrounds",
  "classes",
  "equipment",
  "equipment-categories",
  "feats",
  "features",
  "languages",
  "proficiencies",
  "races",
  "skills",
  "spells",
  "subclasses",
  "subraces",
  "traits",
  "weapon-properties",
];

const open5eEndpoints = [
  "abilities",
  "alignments",
  "armor",
  "backgrounds",
  "classes",
  "conditions",
  "damagetypes",
  "feats",
  "items",
  "itemcategories",
  "languages",
  "rules",
  "skills",
  "species",
  "spells",
  "spellschools",
  "weapons",
  "weaponproperties",
];

const sources = {
  "5e-2014": [
    {
      provider: "dnd5eapi",
      label: "D&D 5e API SRD 2014",
      baseUrl: DND_2014,
      type: "dnd5eapi-2014",
    },
    {
      provider: "open5e",
      label: "Open5e SRD 2014",
      documentKey: "srd-2014",
      baseUrl: OPEN5E,
      type: "open5e-v2",
    },
  ],
  "5e-2024": [
    {
      provider: "open5e",
      label: "Open5e SRD 2024 / 5.5e",
      documentKey: "srd-2024",
      baseUrl: OPEN5E,
      type: "open5e-v2",
    },
    {
      provider: "open5e",
      label: "Open5e Originals 2024 / 5.5e",
      documentKey: "open5e-2024",
      baseUrl: OPEN5E,
      type: "open5e-v2",
    },
  ],
};

const manifest = {
  generatedAt: new Date().toISOString(),
  note: "Character-builder data only. Monsters are intentionally excluded.",
  rulesets: {
    "5e-2014": {
      label: "5e / 2014 rules",
      sources: sources["5e-2014"].map(({ label, provider, documentKey, baseUrl }) => ({ label, provider, documentKey, baseUrl })),
    },
    "5e-2024": {
      label: "5.5e / 2024 rules",
      sources: sources["5e-2024"].map(({ label, provider, documentKey, baseUrl }) => ({ label, provider, documentKey, baseUrl })),
    },
  },
};

await mkdir(OUT, { recursive: true });

for (const [ruleset, ruleSources] of Object.entries(sources)) {
  const dir = path.join(OUT, ruleset);
  await mkdir(dir, { recursive: true });

  for (const source of ruleSources) {
    const sourceDir = path.join(dir, source.provider === "open5e" ? source.documentKey : source.provider);
    await mkdir(sourceDir, { recursive: true });

    if (source.type === "dnd5eapi-2014") {
      await downloadDnd5eApi(sourceDir);
    } else {
      await downloadOpen5eSource(sourceDir, source.documentKey);
    }
  }
}

await writeJson(path.join(OUT, "manifest.json"), manifest);
console.log(`Downloaded data into ${OUT}`);

async function downloadDnd5eApi(dir) {
  const index = {};

  for (const endpoint of dndEndpoints) {
    console.log(`dnd5eapi 2014: ${endpoint}`);
    const list = await fetchJson(`${DND_2014}/${endpoint}`);
    const details = [];

    for (const item of list.results ?? []) {
      if (!item.url) continue;
      details.push(await fetchJson(`https://www.dnd5eapi.co${item.url}`));
    }

    index[endpoint] = { count: details.length };
    await writeJson(path.join(dir, `${endpoint}.json`), { source: DND_2014, endpoint, list, results: details });
  }

  await downloadDndClassCompanions(dir);
  await writeJson(path.join(dir, "index.json"), index);
}

async function downloadDndClassCompanions(dir) {
  const classes = await fetchJson(`${DND_2014}/classes`);
  const levelsByClass = {};
  const spellsByClass = {};

  for (const klass of classes.results ?? []) {
    console.log(`dnd5eapi 2014: class companions ${klass.index}`);
    levelsByClass[klass.index] = await fetchJson(`${DND_2014}/classes/${klass.index}/levels`);
    try {
      spellsByClass[klass.index] = await fetchJson(`${DND_2014}/classes/${klass.index}/spells`);
    } catch {
      spellsByClass[klass.index] = { count: 0, results: [] };
    }
  }

  await writeJson(path.join(dir, "class-levels.json"), levelsByClass);
  await writeJson(path.join(dir, "class-spells.json"), spellsByClass);
}

async function downloadOpen5eSource(dir, documentKey) {
  const index = {};

  for (const endpoint of open5eEndpoints) {
    console.log(`open5e ${documentKey}: ${endpoint}`);
    const results = await fetchOpen5ePages(`${OPEN5E}/${endpoint}/?document__key=${encodeURIComponent(documentKey)}&limit=100`);
    index[endpoint] = { count: results.length };
    await writeJson(path.join(dir, `${endpoint}.json`), { source: OPEN5E, documentKey, endpoint, results });
  }

  await writeJson(path.join(dir, "index.json"), index);
}

async function fetchOpen5ePages(firstUrl) {
  const results = [];
  let next = firstUrl;

  while (next) {
    const page = await fetchJson(next);
    results.push(...(page.results ?? []));
    next = page.next;
  }

  return results;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function writeJson(file, data) {
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}
