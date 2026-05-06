/**
 * Background Selector - Componente modular e expansivel para selecao de backgrounds
 *
 * Substitui o seletor de backgrounds nativo do 5etools por uma componente modular
 * que pode ser expandido com novos backgrounds alem dos padroes Acolyte e Soldier.
 */

import type { BackgroundData, BackgroundOption, BackgroundSelectorConfig } from '../../types/background';

/**
 * Registry de backgrounds disponiveis
 * Permite adicao dinamica de novos backgrounds sem modificar o codigo base
 */
class BackgroundRegistry {
  private static instance: BackgroundRegistry;
  private backgrounds: Map<string, BackgroundData> = new Map();
  private customBackgrounds: Map<string, BackgroundData> = new Map();

  private constructor() {}

  static getInstance(): BackgroundRegistry {
    if (!BackgroundRegistry.instance) {
      BackgroundRegistry.instance = new BackgroundRegistry();
    }
    return BackgroundRegistry.instance;
  }

  /**
   * Registra um novo background no sistema
   */
  register(background: BackgroundData): void {
    this.customBackgrounds.set(background.name.toLowerCase(), background);
  }

  /**
   * Remove um background registrado
   */
  unregister(backgroundName: string): void {
    this.customBackgrounds.delete(backgroundName.toLowerCase());
  }

  /**
   * Retorna todos os backgrounds disponiveis (base + custom)
   */
  getAllBackgrounds(): BackgroundData[] {
    const allBackgrounds = new Map<string, BackgroundData>();

    // Adiciona backgrounds customizados primeiro (sobrescrevem base se houver conflito)
    Array.from(this.customBackgrounds.values()).forEach(bg => {
      allBackgrounds.set(bg.name.toLowerCase(), bg);
    });

    return Array.from(allBackgrounds.values());
  }

  /**
   * Retorna um background especifico pelo nome
   */
  getBackground(name: string): BackgroundData | undefined {
    const lowerName = name.toLowerCase();
    return this.customBackgrounds.get(lowerName);
  }

  /**
   * Verifica se um background esta registrado
   */
  hasBackground(name: string): boolean {
    return this.customBackgrounds.has(name.toLowerCase());
  }

  /**
   * Limpa todos os backgrounds customizados
   */
  clearCustomBackgrounds(): void {
    this.customBackgrounds.clear();
  }
}

/**
 * Factory para criar options de background no formato do app.js
 */
export function createBackgroundOption(background: BackgroundData): BackgroundOption {
  return {
    value: background.name.toLowerCase(),
    label: background.name,
    description: background.description,
    source: background.source || 'XPHB',
  };
}

/**
 * Gera lista de opcoes de background para o seletor
 */
export function getBackgroundOptions(): BackgroundOption[] {
  const registry = BackgroundRegistry.getInstance();
  const backgrounds = registry.getAllBackgrounds();

  return backgrounds
    .map(createBackgroundOption)
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Componente de selecao de background
 * Gerencia UI e logica de selecao de backgrounds
 */
export class BackgroundSelector {
  private config: BackgroundSelectorConfig;
  private container?: HTMLElement;
  private selectedValue: string = '';

  constructor(config: BackgroundSelectorConfig) {
    this.config = config;
  }

  /**
   * Renderiza o seletor em um container
   */
  render(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = this.renderTemplate();
    this.bindEvents();
  }

  /**
   * Atualiza o background selecionado
   */
  select(backgroundName: string): void {
    const registry = BackgroundRegistry.getInstance();
    const background = registry.getBackground(backgroundName);

    if (!background) {
      console.warn(`Background "${backgroundName}" not found`);
      return;
    }

    this.selectedValue = backgroundName;

    if (this.config.onSelect) {
      this.config.onSelect(backgroundName);
    }
  }

  /**
   * Retorna o background atualmente selecionado
   */
  getSelected(): string {
    return this.selectedValue;
  }

  /**
   * Atualiza configuracao do seletor
   */
  updateConfig(config: Partial<BackgroundSelectorConfig>): void {
    this.config = { ...this.config, ...config };
    this.renderIfMounted();
  }

  private renderTemplate(): string {
    const { availableBackgrounds, locked } = this.config;

    if (locked) {
      return this.renderLockedTemplate();
    }

    return `
      <div class="background-selector">
        <div class="background-search">
          <input
            type="text"
            class="background-search-input"
            placeholder="Buscar background..."
            data-search-input
          />
        </div>
        <div class="background-grid" data-backgrounds-grid>
          ${this.renderBackgroundsList(availableBackgrounds)}
        </div>
      </div>
    `;
  }

  private renderLockedTemplate(): string {
    return `
      <div class="background-selector locked">
        <p class="background-locked-message">Background selecionado: ${this.selectedValue || 'Nenhum'}</p>
      </div>
    `;
  }

  private renderBackgroundsList(backgrounds: BackgroundOption[]): string {
    if (backgrounds.length === 0) {
      return '<p class="no-backgrounds">Nenhum background disponivel</p>';
    }

    return backgrounds.map(bg => this.renderBackgroundCard(bg)).join('');
  }

  private renderBackgroundCard(option: BackgroundOption): string {
    const selected = option.value === this.selectedValue ? 'selected' : '';
    return `
      <div class="background-card ${selected}" data-background="${option.value}">
        <h4>${option.label}</h4>
        ${option.description ? `<p class="background-description">${option.description}</p>` : ''}
        <span class="background-source">${option.source}</span>
      </div>
    `;
  }

  private bindEvents(): void {
    if (!this.container) return;

    const searchInput = this.container.querySelector('[data-search-input]') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e));
    }

    this.container.querySelectorAll('[data-background]').forEach(card => {
      card.addEventListener('click', () => {
        const backgroundName = (card as HTMLElement).dataset.background;
        if (backgroundName) {
          this.select(backgroundName);
        }
      });
    });
  }

  private handleSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value.toLowerCase();
    const grid = this.container?.querySelector('[data-backgrounds-grid]');

    if (!grid) return;

    const cards = grid.querySelectorAll<HTMLDivElement>('.background-card');
    cards.forEach(card => {
      const name = card.querySelector('h4')?.textContent?.toLowerCase() || '';
      const matches = name.includes(searchTerm);
      card.style.display = matches ? '' : 'none';
    });
  }

  private renderIfMounted(): void {
    if (this.container) {
      this.render(this.container);
    }
  }
}

/**
 * Factory para criar um seletor de background
 */
export function createBackgroundSelector(config: BackgroundSelectorConfig): BackgroundSelector {
  return new BackgroundSelector(config);
}

export { BackgroundRegistry };
export default BackgroundSelector;
