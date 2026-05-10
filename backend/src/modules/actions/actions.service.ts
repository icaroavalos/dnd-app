import { Inject, Injectable } from '@nestjs/common';
import type { CharacterRecord, DerivedAction } from '@shared/contracts';
import { CharactersService } from '../characters/characters.service.js';
import { RulesService } from '../rules/rules.service.js';
import { deriveBasicActions } from './domain/basic-actions.js';
import { deriveAttackActions } from './domain/attack-actions.js';
import { deriveClassSpellActions, deriveSpellActions, createSpellLookup } from './domain/spell-actions.js';
import { deriveResourceActions } from './domain/resource-actions.js';
import { isActionDisabled } from './domain/action-disabled.js';
import { resolveClassSpellNames } from './domain/action-utils.js';
import { slugify } from './domain/utils.js';

interface SpellCatalogEntry {
  name: string;
  level?: number;
  entries?: string[];
}

interface ItemCatalogEntry {
  name: string;
  dmg1?: string;
  dmgType?: string;
  range?: string;
  property?: string[];
  type?: string;
}

interface ClassSpellListEntry {
  className?: string;
  classSource?: string;
  spells?: Array<{ name: string; source: string }>;
}

@Injectable()
export class ActionsService {
  constructor(
    @Inject(RulesService)
    private readonly rulesService: RulesService,
    @Inject(CharactersService)
    private readonly charactersService: CharactersService
  ) {}

  async deriveActions(character: CharacterRecord): Promise<DerivedAction[]> {
    const [projection, spellsCatalog, classSpellsCatalog, itemsCatalog] = await Promise.all([
      this.charactersService.projectCharacter(character),
      this.rulesService.getCatalog('spells'),
      this.rulesService.getCatalog('class-spells'),
      this.rulesService.getCatalog('items')
    ]);

    const spellDetails = createSpellLookup(spellsCatalog.results as SpellCatalogEntry[]);
    const itemDetails = createItemLookup(itemsCatalog.results as ItemCatalogEntry[]);
    const classSpellNames = resolveClassSpellNames(character, classSpellsCatalog.results as ClassSpellListEntry[]);

    return [
      ...deriveAttackActions(character, projection, itemDetails),
      ...deriveClassSpellActions(character, projection, spellDetails, classSpellNames),
      ...deriveSpellActions(character, projection, spellDetails),
      ...deriveBasicActions(character, itemDetails),
      ...deriveResourceActions(character)
    ].map((action) => ({
      ...action,
      disabled: isActionDisabled(action, character, projection)
    }));
  }
}

function createItemLookup(entries: ItemCatalogEntry[]): Map<string, ItemCatalogEntry> {
  return new Map(entries.map((entry) => [slugify(entry.name), entry]));
}
