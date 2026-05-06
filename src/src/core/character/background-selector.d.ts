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
declare class BackgroundRegistry {
    private static instance;
    private backgrounds;
    private customBackgrounds;
    private constructor();
    static getInstance(): BackgroundRegistry;
    /**
     * Registra um novo background no sistema
     */
    register(background: BackgroundData): void;
    /**
     * Remove um background registrado
     */
    unregister(backgroundName: string): void;
    /**
     * Retorna todos os backgrounds disponiveis (base + custom)
     */
    getAllBackgrounds(): BackgroundData[];
    /**
     * Retorna um background especifico pelo nome
     */
    getBackground(name: string): BackgroundData | undefined;
    /**
     * Verifica se um background esta registrado
     */
    hasBackground(name: string): boolean;
    /**
     * Limpa todos os backgrounds customizados
     */
    clearCustomBackgrounds(): void;
}
/**
 * Factory para criar options de background no formato do app.js
 */
export declare function createBackgroundOption(background: BackgroundData): BackgroundOption;
/**
 * Gera lista de opcoes de background para o seletor
 */
export declare function getBackgroundOptions(): BackgroundOption[];
/**
 * Componente de selecao de background
 * Gerencia UI e logica de selecao de backgrounds
 */
export declare class BackgroundSelector {
    private config;
    private container?;
    private selectedValue;
    constructor(config: BackgroundSelectorConfig);
    /**
     * Renderiza o seletor em um container
     */
    render(container: HTMLElement): void;
    /**
     * Atualiza o background selecionado
     */
    select(backgroundName: string): void;
    /**
     * Retorna o background atualmente selecionado
     */
    getSelected(): string;
    /**
     * Atualiza configuracao do seletor
     */
    updateConfig(config: Partial<BackgroundSelectorConfig>): void;
    private renderTemplate;
    private renderLockedTemplate;
    private renderBackgroundsList;
    private renderBackgroundCard;
    private bindEvents;
    private handleSearch;
    private renderIfMounted;
}
/**
 * Factory para criar um seletor de background
 */
export declare function createBackgroundSelector(config: BackgroundSelectorConfig): BackgroundSelector;
export { BackgroundRegistry };
export default BackgroundSelector;
//# sourceMappingURL=background-selector.d.ts.map