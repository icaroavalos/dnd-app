/**
 * Backgrounds default - Acolyte e Soldier
 *
 * Este arquivo registra os backgrounds iniciais no sistema.
 * Para adicionar novos backgrounds, importe BackgroundRegistry e registre no init.
 */
import { BackgroundRegistry } from './background-selector';
/**
 * Lista de backgrounds padroes disponiveis
 */
export const DEFAULT_BACKGROUNDS = [
    {
        name: 'Acolyte',
        source: 'XPHB',
        description: 'Voce serviu como lider espiritual em um templo ou santuario, conduzindo rituais e oferecendo orientacao espiritual.',
        skillProficiencies: ['Insight', 'Religion'],
        languages: ['Dois idiomas'],
        equipment: [
            'Um simbolo sagrado',
            'Um livro de oracoes ou rodas de oracao',
            'Um traje comum',
        ],
        feature: {
            name: 'Fervor Religioso',
            entries: [
                'Voce pode identificar locais sagrados e items religiosos. Outros fieis reconhecem sua dedicacao e podem oferecer ajuda menor.',
            ],
        },
    },
    {
        name: 'Soldier',
        source: 'XPHB',
        description: 'Voce serviu como soldado em um exercito ou milicia, aprendendo disciplina, resistencia e combate.',
        skillProficiencies: ['Athletics', 'Intimidation'],
        toolProficiencies: ['Um tipo de jogo', 'Veiculos terrestres'],
        equipment: [
            'Uma insígnia de posto',
            'Um trofeu de guerra',
            'Um traje comum',
        ],
        feature: {
            name: 'Posto Militar',
            entries: [
                'Você tem um posto militar que pode ser reconhecido por outros soldados. Pode solicitar suprimentos básicos de aliados militares.',
            ],
        },
    },
];
/**
 * Inicializa o registro de backgrounds com os defaults
 */
export function initializeDefaultBackgrounds() {
    const registry = BackgroundRegistry.getInstance();
    DEFAULT_BACKGROUNDS.forEach(background => {
        registry.register(background);
    });
}
/**
 * Retorna os backgrounds iniciais para uso imediato
 */
export function getInitialBackgrounds() {
    return DEFAULT_BACKGROUNDS;
}
export default DEFAULT_BACKGROUNDS;
//# sourceMappingURL=backgrounds.js.map