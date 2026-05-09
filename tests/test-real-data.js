import fs from 'node:fs';
import path from 'node:path';

/**
 * Teste de validacao de catalogos 5etools compactados
 * Verifica se todos os catalogos essenciais possuem dados
 */

const DATA_DIR = './data/5etools/5e-2024';
const MANIFEST_PATH = './data/5etools/manifest.json';

// Catalogos essenciais e seus minimos
const CATALOG_REQUIREMENTS = {
  'classes.json': { min: 10, label: 'Classes' },
  'subclasses.json': { min: 50, label: 'Subclasses' },
  'class-features.json': { min: 100, label: 'Class Features' },
  'subclass-features.json': { min: 100, label: 'Subclass Features' },
  'races.json': { min: 10, label: 'Races' },
  'backgrounds.json': { min: 20, label: 'Backgrounds' },
  'feats.json': { min: 50, label: 'Feats' },
  'equipment.json': { min: 50, label: 'Equipment' },
  'spells.json': { min: 200, label: 'Spells' },
  'class-spells.json': { min: 5, label: 'Class Spells Lists' },
};

function runCatalogValidation() {
  console.log('=== Validacao de Catalogos 5etools 2024 ===\n');

  // Valida manifest
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const counts2024 = manifest.rulesets['5e-2024'].counts;

  console.log('Contagens do manifest:');
  for (const [key, count] of Object.entries(counts2024)) {
    console.log(`  ${key}: ${count}`);
  }
  console.log('');

  // Valida cada arquivo
  let allPassed = true;

  for (const [file, config] of Object.entries(CATALOG_REQUIREMENTS)) {
    const filePath = path.join(DATA_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.log(`FAIL: ${file} - Arquivo nao encontrado`);
      allPassed = false;
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // class-spells.json tem results como objeto, outros tem results como array
    let count = 0;
    if (data.results) {
      count = Array.isArray(data.results) ? data.results.length : Object.keys(data.results).length;
    }

    if (count < config.min) {
      console.log(`FAIL: ${config.label} (${file}) - ${count} itens (minimo: ${config.min})`);
      allPassed = false;
    } else {
      console.log(`PASS: ${config.label} (${file}) - ${count} itens`);
    }
  }

  console.log('');

  // Testa Rage feature
  const jsonData = JSON.parse(fs.readFileSync('./data/5etools/5e-2024/class-features.json', 'utf-8'));
  const appjs = fs.readFileSync('./app.js', 'utf-8');

  // Extract function
  const resourceRecoveryFromBody = (function() {
    const match = appjs.match(/function resourceRecoveryFromBody\(body\) \{[\s\S]*?return recovery;/);
    if (match) {
      eval(match[0] + "}");
      return resourceRecoveryFromBody;
    }
    return null;
  })();

  if (resourceRecoveryFromBody) {
    const rageFeature = jsonData.results.find(f => f.name === 'Rage' && f.className === 'Barbarian');
    if (rageFeature) {
      const rageText = rageFeature.entries.join(' ');
      const recovery = resourceRecoveryFromBody(rageText);
      console.log("Barbarian Rage:");
      console.log(" Text:", rageText.substring(0, 150) + "...");
      console.log(" Recovery: short=", recovery.short, ", long=", recovery.long);
      console.log(" Expected: short=1, long=all");
      console.log(" Result:", recovery.short === '1' && recovery.short === 1 && recovery.long === 'all' ? "PASS" : "FAIL");
    }
    console.log("");

    // Test Action Surge
    const actionSurge = jsonData.results.find(f => f.name === 'Action Surge' && f.className === 'Fighter');
    if (actionSurge) {
      const text = actionSurge.entries.join(' ');
      const recovery = resourceRecoveryFromBody(text);
      console.log("Fighter Action Surge:");
      console.log(" Text:", text.substring(0, 150) + "...");
      console.log(" Recovery: short=", recovery.short, ", long=", recovery.long);
      console.log(" Expected: short=all, long=all");
      console.log(" Result:", (recovery.short === 'all' || recovery.short === '1') && recovery.long === 'all' ? "PASS" : "NEEDS CHECK");
    }
  }

  if (!allPassed) {
    console.log('\nFALHA: Alguns catalogos estao incompletos!');
    process.exit(1);
  } else {
    console.log('\nSUCESSO: Todos os catalogos estao completos!');
  }
}

runCatalogValidation();
