import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { CharacterRecord } from '@shared/contracts';

/**
 * Serviço de persistência de personagens em arquivo JSON.
 *
 * Armazena personagens em: backend/data/characters.json
 */
@Injectable()
export class CharacterPersistenceService {
  private readonly dataPath: string;

  constructor() {
    this.dataPath = join(process.cwd(), 'data', 'characters.json');
    this.ensureDataFileExists();
  }

  /**
   * Lista todos os personagens (apenas resumo).
   */
  list(): Array<{ id: string; name: string; level: number; primaryClass: string }> {
    const data = this.loadData();
    return Object.values(data).map((char) => ({
      id: char.id,
      name: char.name,
      level: this.calculateTotalLevel(char),
      primaryClass: char.classes[0]?.classId || 'unknown',
    }));
  }

  /**
   * Busca um personagem por ID.
   */
  findById(id: string): CharacterRecord {
    const data = this.loadData();
    const character = data[id];

    if (!character) {
      throw new NotFoundException({
        code: 'CHARACTER_NOT_FOUND',
        message: `Character "${id}" not found.`,
      });
    }

    return character;
  }

  /**
   * Cria um novo personagem.
   */
  create(character: CharacterRecord): CharacterRecord {
    const data = this.loadData();

    if (data[character.id]) {
      throw new ConflictException({
        code: 'CHARACTER_ALREADY_EXISTS',
        message: `Character "${character.id}" already exists.`,
      });
    }

    data[character.id] = character;
    this.saveData(data);

    return character;
  }

  /**
   * Atualiza um personagem existente.
   */
  update(id: string, character: CharacterRecord): CharacterRecord {
    const data = this.loadData();

    if (!data[id]) {
      throw new NotFoundException({
        code: 'CHARACTER_NOT_FOUND',
        message: `Character "${id}" not found.`,
      });
    }

    data[id] = character;
    this.saveData(data);

    return character;
  }

  /**
   * Remove um personagem por ID.
   */
  delete(id: string): void {
    const data = this.loadData();

    if (!data[id]) {
      throw new NotFoundException({
        code: 'CHARACTER_NOT_FOUND',
        message: `Character "${id}" not found.`,
      });
    }

    delete data[id];
    this.saveData(data);
  }

  /**
   * Verifica se existe um personagem por ID.
   */
  exists(id: string): boolean {
    const data = this.loadData();
    return !!data[id];
  }

  private ensureDataFileExists(): void {
    const dataDir = join(process.cwd(), 'data');

    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    if (!existsSync(this.dataPath)) {
      this.saveData({});
    }
  }

  private loadData(): Record<string, CharacterRecord> {
    try {
      const content = readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private saveData(data: Record<string, CharacterRecord>): void {
    writeFileSync(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private calculateTotalLevel(character: CharacterRecord): number {
    return character.classes.reduce((sum, cls) => sum + (cls.level || 0), 0);
  }
}
