import { Inject, Injectable } from '@nestjs/common';

import type {
  RulesCatalogKind,
  RulesCatalogResponse,
  RulesCatalogEntry
} from './contracts/rules-catalog-entry.js';
import { RulesRepository } from './rules.repository.js';
import type { LevelUpOptionsPayload, LevelUpChoice } from './contracts/level-up-options.js';

const SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History',
  'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
  'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'
];

@Injectable()
export class RulesService {
  constructor(
    @Inject(RulesRepository)
    private readonly rulesRepository: RulesRepository
  ) {}

  getCatalog(kind: RulesCatalogKind): Promise<RulesCatalogResponse> {
    return this.rulesRepository.readCatalog(kind);
  }

  async getLevelUpOptions(className: string, level: number): Promise<LevelUpOptionsPayload> {
    const [featuresCatalog, itemsCatalog, featsCatalog, classesCatalog, subclassesCatalog, spellsCatalog] = await Promise.all([
      this.rulesRepository.readCatalog('features'),
      this.rulesRepository.readCatalog('items'),
      this.rulesRepository.readCatalog('feats'),
      this.rulesRepository.readCatalog('classes'),
      this.rulesRepository.readCatalog('subclasses'),
      this.rulesRepository.readCatalog('spells')
    ]);

    const catalogs: Record<string, RulesCatalogResponse> = {
      features: featuresCatalog,
      items: itemsCatalog,
      feats: featsCatalog,
      classes: classesCatalog,
      subclasses: subclassesCatalog,
      spells: spellsCatalog
    };

    const levelFeatures = featuresCatalog.results.filter(f => 
      f.className?.toLowerCase() === className.toLowerCase() && 
      Number(f.level) === level
    );

    const choices: LevelUpChoice[] = [];

    for (const feat of levelFeatures) {
      const nameLower = feat.name.toLowerCase();
      const entriesStr = JSON.stringify(feat.entries || []);

      // Generic Tag Parsing ({@filter ...})
      const filterRegex = /\{@filter ([^|]+)\|([^|]+)\|([^}]+)\}/g;
      let match;
      while ((match = filterRegex.exec(entriesStr)) !== null) {
        const [_, label, kindRaw, query] = match;
        const kind = kindRaw.toLowerCase() as RulesCatalogKind;
        const catalog = catalogs[kind];
        
        if (catalog) {
          let filteredResults = catalog.results;
          if (query.includes('=')) {
            const [qKey, qVal] = query.split('=');
            filteredResults = filteredResults.filter((r: any) => String(r[qKey]) === qVal);
          }
          
          const options = Array.from(new Set(filteredResults.map(r => r.name))).sort();
          if (options.length > 0) {
            choices.push({
              id: `filter-${feat.id}-${label.toLowerCase().replace(/\s+/g, '-')}`,
              type: 'selection',
              name: label,
              count: 1,
              options,
              featureId: feat.id
            });
          }
        }
      }

      // Universal ASI / Feat Choice (Level 4, 8, 12, 16, 19)
      if (nameLower.includes('ability score improvement')) {
        choices.push({
          id: `asi-${feat.id}`,
          type: 'asi',
          name: 'Ability Score Improvement',
          count: 2,
          options: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
          featureId: feat.id,
          description: 'Increase one ability score by 2, or two scores by 1.'
        });

        const generalFeats = featsCatalog.results
          .filter(f => f.category === 'G' && f.name !== 'Ability Score Improvement')
          .map(f => f.name)
          .sort();

        choices.push({
          id: `feat-${feat.id}`,
          type: 'feat',
          name: 'General Feat',
          count: 1,
          options: generalFeats,
          featureId: feat.id,
          description: 'Choose a specialized feat instead of attribute increases.'
        });
      }

      // Universal Subclass Choice (Level 3)
      if (level === 3 && (
        nameLower.includes('subclass') || 
        nameLower.includes('path') || 
        nameLower.includes('circle') || 
        nameLower.includes('domain') || 
        nameLower.includes('oath') ||
        nameLower.includes('archetype') ||
        nameLower.includes('college')
      ) && !choices.some(c => c.type === 'subclass')) {
        const subclassOptions = Array.from(new Set(
          subclassesCatalog.results
            .filter(sc => 
              sc.className?.toLowerCase() === className.toLowerCase() && 
              (sc.source === 'XPHB' || !sc.source)
            )
            .map(sc => sc.name)
        )).sort();

        if (subclassOptions.length > 0) {
          choices.push({
            id: `subclass-${feat.id}`,
            type: 'subclass',
            name: `Choose your ${className} Subclass`,
            count: 1,
            options: subclassOptions,
            featureId: feat.id
          });
        }
      }

      // Expertise (Bard, Rogue, Ranger)
      if (nameLower === 'expertise') {
        let count = 1;
        if (className.toLowerCase() === 'rogue' && level === 1) count = 2;
        if (className.toLowerCase() === 'bard' && level === 2) count = 2;

        choices.push({
          id: `expertise-${feat.id}`,
          type: 'expertise',
          name: 'Expertise',
          count: count,
          options: [], // Frontend will populate with current proficiencies
          featureId: feat.id,
          description: 'Choose skills you are already proficient in to double your proficiency bonus.'
        });
      }

      // Weapon Mastery
      if (nameLower === 'weapon mastery') {
        const options = itemsCatalog.results
          .filter(i => {
            const type = (i as any).type?.split('|')[0] || '';
            return type === 'M' || (className.toLowerCase() !== 'barbarian' && type === 'R');
          })
          .map(i => i.name);

        choices.push({
          id: `weapon-${feat.id}`,
          type: 'selection',
          name: 'Weapon Mastery',
          count: className.toLowerCase() === 'fighter' ? 3 : 2,
          options: Array.from(new Set(options)).sort(),
          featureId: feat.id
        });
      }

      // Generic Skill Choices (Detect "gain proficiency with X skills" in description)
      const skillRegex = /gain proficiency with (one|two|three|four|five) skills? of your choice/i;
      const skillMatch = entriesStr.match(skillRegex);
      if (skillMatch) {
        const wordToNum: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
        const count = wordToNum[skillMatch[1].toLowerCase()] || 1;
        
        choices.push({
          id: `skill-${feat.id}`,
          type: 'generic',
          name: feat.name,
          count: count,
          options: SKILLS, // Global list of skills
          featureId: feat.id,
          description: `Escolha ${count} perícia(s) adicional(is).`
        });
      }

      // Generic Choices (Handle specific class features that grant skills)
      if (nameLower === 'primal knowledge' || nameLower === 'student of war') {
        const options = nameLower === 'student of war' 
          ? ['Insight', 'Intimidation', 'Performance', 'Persuasion']
          : ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'];

        choices.push({
          id: `skill-${feat.id}`,
          type: 'generic',
          name: feat.name + ': Additional Skill',
          count: 1,
          options: options.sort(),
          featureId: feat.id
        });
      }
    }

    return {
      level,
      features: levelFeatures,
      choices
    };
  }
}
