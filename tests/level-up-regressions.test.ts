import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('level-up regression handling', () => {
  it('generates stable ids for 2024 subclass features used by level-up choices', async () => {
    const raw = await readFile(new URL('../data/5etools/5e-2024/subclass-features.json', import.meta.url), 'utf8');
    const catalog = JSON.parse(raw);
    const studentOfWar = catalog.results.find((feature: any) =>
      feature.name === 'Student of War'
      && feature.className === 'Fighter'
      && feature.subclassShortName === 'Battle Master'
      && Number(feature.level) === 3
    );

    assert.equal(studentOfWar?.id, 'student-of-war-fighter-battle-master-3-xphb');
    assert.equal(studentOfWar.id.includes('undefined'), false);
  });
});
