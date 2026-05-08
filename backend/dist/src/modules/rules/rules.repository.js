var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { AppConfigService } from '../../config/app-config.js';
const SINGLE_FILES_BY_KIND = {
    backgrounds: 'backgrounds.json',
    classes: 'classes.json',
    spells: 'spells.json',
    'class-spells': 'class-spells.json',
    species: 'races.json',
    items: 'equipment.json',
    feats: 'feats.json'
};
let RulesRepository = class RulesRepository {
    appConfigService;
    cache = new Map();
    constructor(appConfigService) {
        this.appConfigService = appConfigService;
    }
    getDataDir() {
        return this.appConfigService.rulesDataDir;
    }
    async readCatalog(kind) {
        const cached = this.cache.get(kind);
        if (cached) {
            return cached;
        }
        const response = kind === 'features'
            ? await this.readCombinedFeatures()
            : kind === 'class-spells'
                ? await this.readClassSpellsCatalog()
                : await this.readSingleFileCatalog(kind);
        this.cache.set(kind, response);
        return response;
    }
    async readSingleFileCatalog(kind) {
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
    async readClassSpellsCatalog() {
        const parsed = (await this.readRawFile('class-spells.json'));
        return {
            ruleset: '5.5e-2024',
            results: Object.values(parsed.results ?? {})
        };
    }
    async readCombinedFeatures() {
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
    async readRawFile(fileName) {
        const filePath = path.join(this.getDataDir(), fileName);
        const rawContent = await readFile(filePath, 'utf8');
        return JSON.parse(rawContent);
    }
};
RulesRepository = __decorate([
    Injectable(),
    __param(0, Inject(AppConfigService)),
    __metadata("design:paramtypes", [AppConfigService])
], RulesRepository);
export { RulesRepository };
//# sourceMappingURL=rules.repository.js.map