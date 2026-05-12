import { JSDOM } from 'jsdom';
import * as fs from 'fs';

const html = `
<label class="">
  <input type="checkbox" value="Guidance" data-bg-spell="Guidance" data-rule-id="bg-magic-initiate-cleric-0" />
  <span>Guidance</span>
</label>
`;

const dom = new JSDOM(html);
const input = dom.window.document.querySelector('input');

console.log('Dataset:', input.dataset);
console.log('Rule ID:', input.dataset.ruleId);
console.log('BG Spell:', input.dataset.bgSpell);

