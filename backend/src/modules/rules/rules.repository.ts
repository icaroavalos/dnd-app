import { Inject, Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { AppConfigService } from '../../config/app-config.js';
import type {
  RulesCatalogEntry,
  RulesCatalogKind,
  RulesCatalogResponse
} from './contracts/rules-catalog-entry.js';

interface RawRulesFile {
  ruleset?: string;
  results?: RulesCatalogEntry[];
}

const SINGLE_FILES_BY_KIND: Partial<Record<RulesCatalogKind, string>> = {
  backgrounds: 'backgrounds.json',
  classes: 'classes.json',
  spells: 'spells.json',
  'class-spells': 'class-spells.json',
  species: 'races.json',
  items: 'equipment.json',
  feats: 'feats.json'
};

@Injectable()
export class RulesRepository {
  private readonly cache = new Map<RulesCatalogKind, RulesCatalogResponse>();

  constructor(
    @Inject(AppConfigService)
    private readonly appConfigService: AppConfigService
  ) {}

  getDataDir(): string {
    return this.appConfigService.rulesDataDir;
  }

  async readCatalog(kind: RulesCatalogKind): Promise<RulesCatalogResponse> {
    const cached = this.cache.get(kind);

    if (cached) {
      return cached;
    }

    const response =
      kind === 'features'
        ? await this.readCombinedFeatures()
        : kind === 'class-spells'
          ? await this.readClassSpellsCatalog()
        : await this.readSingleFileCatalog(kind);

    this.cache.set(kind, response);

    return response;
  }

  private async readSingleFileCatalog(
    kind: Exclude<RulesCatalogKind, 'features' | 'class-spells'>
  ): Promise<RulesCatalogResponse> {
    const fileName = SINGLE_FILES_BY_KIND[kind];

    if (!fileName) {
      throw new Error(`Unsupported rules catalog kind: ${kind}`);
    }

    const parsed = await this.readRawFile(fileName);

    return {
      ruleset: '5.5e-2024',
      results: parsed.results ?? []
    };
  }

  private async readClassSpellsCatalog(): Promise<RulesCatalogResponse> {
    const parsed = (await this.readRawFile('class-spells.json')) as RawRulesFile & {
      results?: Record<string, RulesCatalogEntry>;
    };

    return {
      ruleset: '5.5e-2024',
      results: Object.values(parsed.results ?? {})
    };
  }

  private async readCombinedFeatures(): Promise<RulesCatalogResponse> {
    const [classFeatures, subclassFeatures] = await Promise.all([
      this.readRawFile('class-features.json'),
      this.readRawFile('subclass-features.json')
    ]);

    return {
      ruleset: '5.5e-2024',
      results: [
        ...(classFeatures.results ?? []),
        ...(subclassFeatures.results ?? [])
      ]
    };
  }

  private async readRawFile(fileName: string): Promise<RawRulesFile> {
    const filePath = path.join(this.getDataDir(), fileName);
    const rawContent = await readFile(filePath, 'utf8');

    return JSON.parse(rawContent) as RawRulesFile;
  }
}
