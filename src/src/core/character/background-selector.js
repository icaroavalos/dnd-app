/**
 * Background Selector - Componente modular e expansivel para selecao de backgrounds
 *
 * Substitui o seletor de backgrounds nativo do 5etools por uma componente modular
 * que pode ser expandido com novos backgrounds alem dos padroes Acolyte e Soldier.
 */
/**
 * Registry de backgrounds disponiveis
 * Permite adicao dinamica de novos backgrounds sem modificar o codigo base
 */
class BackgroundRegistry {
    constructor() {
        this.backgrounds = new Map();
        this.customBackgrounds = new Map();
    }
    static getInstance() {
        if (!BackgroundRegistry.instance) {
            BackgroundRegistry.instance = new BackgroundRegistry();
        }
        return BackgroundRegistry.instance;
    }
    /**
     * Registra um novo background no sistema
     */
    register(background) {
        this.customBackgrounds.set(background.name.toLowerCase(), background);
    }
    /**
     * Remove um background registrado
     */
    unregister(backgroundName) {
        this.customBackgrounds.delete(backgroundName.toLowerCase());
    }
    /**
     * Retorna todos os backgrounds disponiveis (base + custom)
     */
    getAllBackgrounds() {
        const allBackgrounds = new Map();
        // Adiciona backgrounds customizados primeiro (sobrescrevem base se houver conflito)
        Array.from(this.customBackgrounds.values()).forEach(bg => {
            allBackgrounds.set(bg.name.toLowerCase(), bg);
        });
        return Array.from(allBackgrounds.values());
    }
    /**
     * Retorna um background especifico pelo nome
     */
    getBackground(name) {
        const lowerName = name.toLowerCase();
        return this.customBackgrounds.get(lowerName);
    }
    /**
     * Verifica se um background esta registrado
     */
    hasBackground(name) {
        return this.customBackgrounds.has(name.toLowerCase());
    }
    /**
     * Limpa todos os backgrounds customizados
     */
    clearCustomBackgrounds() {
        this.customBackgrounds.clear();
    }
}
/**
 * Factory para criar options de background no formato do app.js
 */
export function createBackgroundOption(background) {
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
export function getBackgroundOptions() {
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
    constructor(config) {
        this.selectedValue = '';
        this.config = config;
    }
    /**
     * Renderiza o seletor em um container
     */
    render(container) {
        this.container = container;
        container.innerHTML = this.renderTemplate();
        this.bindEvents();
    }
    /**
     * Atualiza o background selecionado
     */
    select(backgroundName) {
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
    getSelected() {
        return this.selectedValue;
    }
    /**
     * Atualiza configuracao do seletor
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.renderIfMounted();
    }
    renderTemplate() {
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
    renderLockedTemplate() {
        return `
      <div class="background-selector locked">
        <p class="background-locked-message">Background selecionado: ${this.selectedValue || 'Nenhum'}</p>
      </div>
    `;
    }
    renderBackgroundsList(backgrounds) {
        if (backgrounds.length === 0) {
            return '<p class="no-backgrounds">Nenhum background disponivel</p>';
        }
        return backgrounds.map(bg => this.renderBackgroundCard(bg)).join('');
    }
    renderBackgroundCard(option) {
        const selected = option.value === this.selectedValue ? 'selected' : '';
        return `
      <div class="background-card ${selected}" data-background="${option.value}">
        <h4>${option.label}</h4>
        ${option.description ? `<p class="background-description">${option.description}</p>` : ''}
        <span class="background-source">${option.source}</span>
      </div>
    `;
    }
    bindEvents() {
        if (!this.container)
            return;
        const searchInput = this.container.querySelector('[data-search-input]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
        }
        this.container.querySelectorAll('[data-background]').forEach(card => {
            card.addEventListener('click', () => {
                const backgroundName = card.dataset.background;
                if (backgroundName) {
                    this.select(backgroundName);
                }
            });
        });
    }
    handleSearch(event) {
        const input = event.target;
        const searchTerm = input.value.toLowerCase();
        const grid = this.container?.querySelector('[data-backgrounds-grid]');
        if (!grid)
            return;
        const cards = grid.querySelectorAll('.background-card');
        cards.forEach(card => {
            const name = card.querySelector('h4')?.textContent?.toLowerCase() || '';
            const matches = name.includes(searchTerm);
            card.style.display = matches ? '' : 'none';
        });
    }
    renderIfMounted() {
        if (this.container) {
            this.render(this.container);
        }
    }
}
/**
 * Factory para criar um seletor de background
 */
export function createBackgroundSelector(config) {
    return new BackgroundSelector(config);
}
export { BackgroundRegistry };
export default BackgroundSelector;
//# sourceMappingURL=background-selector.js.map