import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  getSpellManagementPolicy, 
  isGrantedSpell, 
  isSpellRemovable, 
  doesSpellCountAgainstPreparation,
  getPreparedSpellLimit
} from '../frontend/src/lib/spell-management-rules';

describe('Spell Management Rules', () => {
  describe('getSpellManagementPolicy', () => {
    it('returns "prepare-full-list" for Cleric, Druid, and Paladin', () => {
      assert.strictEqual(getSpellManagementPolicy({ class: 'Cleric' } as any).mode, 'prepare-full-list');
      assert.strictEqual(getSpellManagementPolicy({ class: 'Druid' } as any).mode, 'prepare-full-list');
      assert.strictEqual(getSpellManagementPolicy({ class: 'Paladin' } as any).mode, 'prepare-full-list');
    });

    it('returns "prepare-spellbook" for Wizard', () => {
      assert.strictEqual(getSpellManagementPolicy({ class: 'Wizard' } as any).mode, 'prepare-spellbook');
    });

    it('returns "replace-one" for Bard, Warlock, Sorcerer, and Ranger', () => {
      assert.strictEqual(getSpellManagementPolicy({ class: 'Bard' } as any).mode, 'replace-one');
      assert.strictEqual(getSpellManagementPolicy({ class: 'Warlock' } as any).mode, 'replace-one');
      assert.strictEqual(getSpellManagementPolicy({ class: 'Sorcerer' } as any).mode, 'replace-one');
      assert.strictEqual(getSpellManagementPolicy({ class: 'Ranger' } as any).mode, 'replace-one');
    });

    it('returns "replace-one" for Fighter (Eldritch Knight) and Rogue (Arcane Trickster)', () => {
      // These are identified by subclass in classFeatureChoices or features
      const ek = { 
        class: 'Fighter', 
        classFeatureChoices: { 'subclass-fighter': ['Eldritch Knight'] } 
      };
      const at = { 
        class: 'Rogue', 
        classFeatureChoices: { 'subclass-rogue': ['Arcane Trickster'] } 
      };
      assert.strictEqual(getSpellManagementPolicy(ek as any).mode, 'replace-one');
      assert.strictEqual(getSpellManagementPolicy(at as any).mode, 'replace-one');
    });
  });

  describe('isGrantedSpell', () => {
    it('identifies spells from background, species, feat, and subclass features as granted', () => {
      assert.strictEqual(isGrantedSpell({ originKind: 'background' }), true);
      assert.strictEqual(isGrantedSpell({ originKind: 'bg-feat' }), true);
      assert.strictEqual(isGrantedSpell({ originKind: 'species' }), true);
      assert.strictEqual(isGrantedSpell({ originKind: 'feat' }), true);
      assert.strictEqual(isGrantedSpell({ originKind: 'feature' }), true);
      assert.strictEqual(isGrantedSpell({ originKind: 'feat-auto' }), true);
    });

    it('identifies class spells as NOT granted', () => {
      assert.strictEqual(isGrantedSpell({ originKind: 'class' }), false);
      assert.strictEqual(isGrantedSpell({ originKind: undefined }), false);
    });
  });

  describe('isSpellRemovable', () => {
    const policy = { mode: 'replace-one' } as any;

    it('returns false for granted spells', () => {
      const spell = { originKind: 'feature' };
      assert.strictEqual(isSpellRemovable(spell, policy), false);
    });

    it('returns true for normal class spells in "replace-one" mode', () => {
      const spell = { originKind: 'class' };
      assert.strictEqual(isSpellRemovable(spell, policy), true);
    });

    it('returns false for Wizard spells (they stay in the book)', () => {
      const wizardPolicy = { mode: 'prepare-spellbook' } as any;
      const spell = { originKind: 'class' };
      assert.strictEqual(isSpellRemovable(spell, wizardPolicy), false);
    });
  });

  describe('doesSpellCountAgainstPreparation', () => {
    it('returns false for granted spells', () => {
      assert.strictEqual(doesSpellCountAgainstPreparation({ originKind: 'feature' }), false);
      assert.strictEqual(doesSpellCountAgainstPreparation({ originKind: 'background' }), false);
    });

    it('returns true for class spells', () => {
      assert.strictEqual(doesSpellCountAgainstPreparation({ originKind: 'class', level: 1 }), true);
    });

    it('returns false for cantrips', () => {
      assert.strictEqual(doesSpellCountAgainstPreparation({ originKind: 'class', level: 0 }), false);
    });
  });

  describe('getPreparedSpellLimit', () => {
    it('returns the limit from classEntry if provided', () => {
      const char = { level: 5, class: 'Cleric' } as any;
      const classEntry = { 
        preparedSpellsProgression: [2, 3, 4, 5, 6]
      };
      assert.strictEqual(getPreparedSpellLimit(char, classEntry), 6);
    });

    it('returns Wizard-specific limit if no classEntry', () => {
      const char = { level: 1, class: 'Wizard' } as any;
      assert.strictEqual(getPreparedSpellLimit(char, null), 4);
    });
  });
});
