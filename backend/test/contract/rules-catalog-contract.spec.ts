import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../../src/main.js';

/**
 * Testes de contrato para os catálogos de regras do backend.
 *
 * Objetivo: garantir que o backend exponha catálogos completos
 * para criação de personagens sem depender de fallback no frontend.
 */

// ============================================================================
// /rules/species - Species/Lineages
// ============================================================================

test('Rules catalog: GET /rules/species returns complete species list including MPMM', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/species',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));

    // Must have species from both PHB and MPMM
    const speciesNames = payload.results.map((s: any) => s.name);

    // PHB species
    assert.ok(speciesNames.includes('Dragonborn'), 'Should include Dragonborn from PHB');
    assert.ok(speciesNames.includes('Dwarf'), 'Should include Dwarf from PHB');
    assert.ok(speciesNames.includes('Elf'), 'Should include Elf from PHB');
    assert.ok(speciesNames.includes('Human'), 'Should include Human from PHB');

    // MPMM species (must be present per current policy)
    assert.ok(speciesNames.includes('Aarakocra'), 'Should include Aarakocra from MPMM');
    assert.ok(speciesNames.includes('Aasimar'), 'Should include Aasimar from MPMM');
    assert.ok(speciesNames.includes('Bugbear'), 'Should include Bugbear from MPMM');
    assert.ok(speciesNames.includes('Goblin'), 'Should include Goblin from MPMM');
    assert.ok(speciesNames.includes('Hobgoblin'), 'Should include Hobgoblin from MPMM');
    assert.ok(speciesNames.includes('Kobold'), 'Should include Kobold from MPMM');
    assert.ok(speciesNames.includes('Orc'), 'Should include Orc from MPMM');

    // Minimum count (should have at least 40+ species)
    assert.ok(payload.results.length >= 40, `Should have at least 40 species, got ${payload.results.length}`);
  } finally {
    await app.close();
  }
});

test('Rules catalog: GET /rules/species returns species with required fields', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/species',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.ok(payload.results.length > 0);

    // Check first species has required fields
    const firstSpecies = payload.results[0];
    assert.ok(firstSpecies.name, 'Species should have name');
    assert.ok(firstSpecies.source, 'Species should have source');
    assert.ok(Array.isArray(firstSpecies.entries), 'Species should have entries array');
    assert.ok(firstSpecies.size, 'Species should have size');
    assert.ok(firstSpecies.speed, 'Species should have speed');
  } finally {
    await app.close();
  }
});

// ============================================================================
// /rules/classes - Classes
// ============================================================================

test('Rules catalog: GET /rules/classes returns complete class list', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/classes',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));

    // Must have all 13 PHB classes
    const classNames = payload.results.map((c: any) => c.name);

    assert.ok(classNames.includes('Artificer'), 'Should include Artificer');
    assert.ok(classNames.includes('Barbarian'), 'Should include Barbarian');
    assert.ok(classNames.includes('Bard'), 'Should include Bard');
    assert.ok(classNames.includes('Cleric'), 'Should include Cleric');
    assert.ok(classNames.includes('Druid'), 'Should include Druid');
    assert.ok(classNames.includes('Fighter'), 'Should include Fighter');
    assert.ok(classNames.includes('Monk'), 'Should include Monk');
    assert.ok(classNames.includes('Paladin'), 'Should include Paladin');
    assert.ok(classNames.includes('Ranger'), 'Should include Ranger');
    assert.ok(classNames.includes('Rogue'), 'Should include Rogue');
    assert.ok(classNames.includes('Sorcerer'), 'Should include Sorcerer');
    assert.ok(classNames.includes('Warlock'), 'Should include Warlock');
    assert.ok(classNames.includes('Wizard'), 'Should include Wizard');

    // Minimum count (13 classes)
    assert.ok(payload.results.length >= 13, `Should have at least 13 classes, got ${payload.results.length}`);
  } finally {
    await app.close();
  }
});

test('Rules catalog: GET /rules/classes returns classes with required fields', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/classes',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.ok(payload.results.length > 0);

    // Check first class has required fields
    const firstClass = payload.results[0];
    assert.ok(firstClass.name, 'Class should have name');
    assert.ok(firstClass.source, 'Class should have source');
    assert.ok(firstClass.hitDie, 'Class should have hitDie');
    assert.ok(Array.isArray(firstClass.proficiency), 'Class should have proficiency array');
  } finally {
    await app.close();
  }
});

// ============================================================================
// /rules/backgrounds - Backgrounds
// ============================================================================

test('Rules catalog: GET /rules/backgrounds returns complete backgrounds list', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/backgrounds',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));

    // Must have backgrounds from 2024 rules
    const backgroundNames = payload.results.map((b: any) => b.name);

    // EFA background
    assert.ok(backgroundNames.includes('Aberrant Heir'), 'Should include Aberrant Heir from EFA');
    // PHB backgrounds
    assert.ok(backgroundNames.includes('Acolyte'), 'Should include Acolyte');
    assert.ok(backgroundNames.includes('Criminal'), 'Should include Criminal');
    assert.ok(backgroundNames.includes('Sage'), 'Should include Sage');
    assert.ok(backgroundNames.includes('Soldier'), 'Should include Soldier');
    // Another 2024 background
    assert.ok(backgroundNames.includes('Noble'), 'Should include Noble');

    // Minimum count (should have 50+ backgrounds from 2024 rules)
    assert.ok(payload.results.length >= 50, `Should have at least 50 backgrounds, got ${payload.results.length}`);
  } finally {
    await app.close();
  }
});

test('Rules catalog: GET /rules/backgrounds returns backgrounds with required fields', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/backgrounds',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.ok(payload.results.length > 0);

    // Check first background has required fields
    const firstBackground = payload.results[0];
    assert.ok(firstBackground.name, 'Background should have name');
    assert.ok(firstBackground.source, 'Background should have source');
    assert.ok(Array.isArray(firstBackground.entries) || firstBackground.startingEquipment || firstBackground.feats, 'Background should have entries or equipment or feats');
  } finally {
    await app.close();
  }
});

// ============================================================================
// /rules/spells - Spells
// ============================================================================

test('Rules catalog: GET /rules/spells returns complete spells list', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/spells',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));

    // Must have spells from 2024 rules
    const spellNames = payload.results.map((s: any) => s.name);

    assert.ok(spellNames.includes('Acid Splash'), 'Should include Acid Splash');
    assert.ok(spellNames.includes('Cure Wounds'), 'Should include Cure Wounds');
    assert.ok(spellNames.includes('Fireball'), 'Should include Fireball');
    assert.ok(spellNames.includes('Guidance'), 'Should include Guidance');
    assert.ok(spellNames.includes('Magic Missile'), 'Should include Magic Missile');

    // Minimum count (should have 350+ spells from 2024 rules)
    assert.ok(payload.results.length >= 350, `Should have at least 350 spells, got ${payload.results.length}`);
  } finally {
    await app.close();
  }
});

// ============================================================================
// /rules/features - Class and Subclass Features
// ============================================================================

test('Rules catalog: GET /rules/features returns combined class and subclass features', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/features',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));

    // Must have features from both class-features and subclass-features
    const featureNames = payload.results.map((f: any) => f.name);

    assert.ok(featureNames.some((n: string) => n.includes('Spellcasting')), 'Should include Spellcasting feature');
    assert.ok(featureNames.some((n: string) => n.includes('Rage')), 'Should include Rage feature');
    assert.ok(featureNames.some((n: string) => n.includes('Sneak Attack')), 'Should include Sneak Attack feature');

    // Minimum count (should have 300+ features combined)
    assert.ok(payload.results.length >= 300, `Should have at least 300 features, got ${payload.results.length}`);
  } finally {
    await app.close();
  }
});

// ============================================================================
// /rules/items - Equipment
// ============================================================================

test('Rules catalog: GET /rules/items returns complete equipment list', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/items',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));

    // Must have equipment from 2024 rules
    const itemNames = payload.results.map((i: any) => i.name);

    assert.ok(itemNames.includes("Alchemist's Supplies"), 'Should include Alchemist\'s Supplies');
    assert.ok(itemNames.includes('Longbow'), 'Should include Longbow');
    assert.ok(itemNames.includes('Longsword'), 'Should include Longsword');
    assert.ok(itemNames.includes('Shield'), 'Should include Shield');

    // Minimum count (should have 100+ items)
    assert.ok(payload.results.length >= 100, `Should have at least 100 items, got ${payload.results.length}`);
  } finally {
    await app.close();
  }
});

// ============================================================================
// /rules/feats - Feats
// ============================================================================

test('Rules catalog: GET /rules/feats returns complete feats list', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/feats',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));

    // Must have feats from 2024 rules
    const featNames = payload.results.map((f: any) => f.name);

    assert.ok(featNames.includes('Ability Score Improvement'), 'Should include Ability Score Improvement');
    assert.ok(featNames.includes('Magic Initiate'), 'Should include Magic Initiate');

    // Minimum count (should have 70+ feats)
    assert.ok(payload.results.length >= 70, `Should have at least 70 feats, got ${payload.results.length}`);
  } finally {
    await app.close();
  }
});

// ============================================================================
// /rules/class-spells - Class Spell Lists
// ============================================================================

test('Rules catalog: GET /rules/class-spells returns class spell lists', async () => {
  const app = await createApp();

  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: 'GET',
      url: '/rules/class-spells',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json();
    assert.equal(payload.ruleset, '5.5e-2024');
    assert.ok(Array.isArray(payload.results));

    // Must have spell lists for caster classes only
    // Results are objects with className and classSource
    const classNames = payload.results.map((r: any) => r.className);

    assert.ok(classNames.includes('Bard'), 'Should include Bard spell list');
    assert.ok(classNames.includes('Cleric'), 'Should include Cleric spell list');
    assert.ok(classNames.includes('Wizard'), 'Should include Wizard spell list');
    assert.ok(classNames.includes('Paladin'), 'Should include Paladin spell list');
    assert.ok(classNames.includes('Ranger'), 'Should include Ranger spell list');

    // Each result should have className, classSource and spells
    for (const result of payload.results) {
      assert.ok(result.className, 'Each class spell list should have className');
      assert.ok(result.classSource, 'Each class spell list should have classSource');
      assert.ok(Array.isArray(result.spells), 'Each class spell list should have spells array');
    }
  } finally {
    await app.close();
  }
});
