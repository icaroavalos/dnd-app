import { getBackgroundGrantedSpells, createBackgroundSpellRules } from './src/lib/magic-initiate-validator.js';
import * as fs from 'fs';

const bgDetails = JSON.parse(fs.readFileSync('data/5etools/5e-2024/backgrounds.json'));
const bgDict = {};
bgDetails.results.forEach(b => bgDict[b.name.toLowerCase()] = b);

const grants = getBackgroundGrantedSpells('Acolyte', bgDict);
const rules = createBackgroundSpellRules(grants);
console.log(rules);
