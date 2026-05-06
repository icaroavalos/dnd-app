/**
 * Testes para recuperação de recursos
 *
 * Historias de bugs:
 * - Bug #1: Rage recoverava "all" ao invés de "1" no Short Rest
 * - Causa: Padrões regex muito genéricos + falta de normalização do texto 5etools
 * - Solução: TypeScript + testes + normalização explícita
 */
import { describe, it, expect } from 'bun:test';
import { normalizeText, parseRecovery, applyShortRestRecovery, applyLongRestRecovery, } from '../src/lib/resource-recovery';
describe('normalizeText', () => {
    it('remove markup {@variantrule} do 5etools', () => {
        const input = 'You finish a {@variantrule Short Rest|XPHB}.';
        expect(normalizeText(input)).toBe('You finish a Short Rest.');
    });
    it('remove markup {@action}', () => {
        const input = 'Use {@action Magic|XPHB} action.';
        expect(normalizeText(input)).toBe('Use Magic action.');
    });
    it('múltiplos markups', () => {
        const input = 'You finish a {@variantrule Short Rest|XPHB} and {@variantrule Long Rest|XPHB}.';
        expect(normalizeText(input)).toBe('You finish a Short Rest and Long Rest.');
    });
});
describe('parseRecovery - Barbarian Rage', () => {
    it('detecta "one expended use" no Singular Rest (BUG #1)', () => {
        const rageText = 'You can enter your Rage the number of times shown. You regain one expended use when you finish a {@variantrule Short Rest|XPHB}, and you regain all expended uses when you finish a {@variantrule Long Rest|XPHB}.';
        const recovery = parseRecovery(rageText);
        expect(recovery.short).toBe('1');
        expect(recovery.long).toBe('all');
    });
    it('funciona sem markup 5etools', () => {
        const rageText = 'You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.';
        const recovery = parseRecovery(rageText);
        expect(recovery.short).toBe('1');
        expect(recovery.long).toBe('all');
    });
});
describe('parseRecovery - Wild Shape', () => {
    it('detecta "one expended use" no Singular Rest', () => {
        const wildShapeText = 'You can use Wild Shape twice. You regain one expended use when you finish a {@variantrule Short Rest|XPHB}, and you regain all expended uses when you finish a {@variantrule Long Rest|XPHB}.';
        const recovery = parseRecovery(wildShapeText);
        expect(recovery.short).toBe('1');
        expect(recovery.long).toBe('all');
    });
});
describe('parseRecovery - Second Wind', () => {
    it('detecta "one expended use" sem "Long Rest"', () => {
        const secondWindText = 'You regain one expended use when you finish a {@variantrule Short Rest|XPHB}.';
        const recovery = parseRecovery(secondWindText);
        expect(recovery.short).toBe('1');
        expect(recovery.long).toBeUndefined();
    });
});
describe('parseRecovery - Action Surge', () => {
    it('detecta "cant use again until" com Short e Long Rest', () => {
        const actionSurgeText = "Once you use this feature, you can't do so again until you finish a {@variantrule Short Rest|XPHB} or {@variantrule Long Rest|XPHB}.";
        const recovery = parseRecovery(actionSurgeText);
        expect(recovery.short).toBe('all');
        expect(recovery.long).toBe('all');
    });
});
describe('parseRecovery - Channel Divinity', () => {
    it('detecta "regain all expended uses when you finish a Short Rest"', () => {
        const channelDivinityText = 'You can use this feature twice. You regain all expended uses when you finish a {@variantrule Short Rest|XPHB}.';
        const recovery = parseRecovery(channelDivinityText);
        expect(recovery.short).toBe('all');
    });
});
describe('applyShortRestRecovery', () => {
    it('recupera 1 uso quando recovery = "1"', () => {
        expect(applyShortRestRecovery(4, '1')).toBe(3); // 4 - 1 = 3
    });
    it('recupera tudo quando recovery = "all"', () => {
        expect(applyShortRestRecovery(4, 'all')).toBe(0);
    });
    it('recupera número específico quando recovery = number', () => {
        expect(applyShortRestRecovery(5, 2)).toBe(3); // 5 - 2 = 3
    });
    it('não vai abaixo de zero', () => {
        expect(applyShortRestRecovery(1, '1')).toBe(0);
        expect(applyShortRestRecovery(0, '1')).toBe(0);
    });
});
describe('applyLongRestRecovery', () => {
    it('sempres reseta para zero', () => {
        expect(applyLongRestRecovery('all')).toBe(0);
        expect(applyLongRestRecovery('1')).toBe(0);
        expect(applyLongRestRecovery(2)).toBe(0);
    });
});
describe('Regression tests - Bug #1', () => {
    it('NUNCA deve detectar "all" para Rage no Short Rest', () => {
        const rageText = 'You regain one expended use when you finish a {@variantrule Short Rest|XPHB}, and you regain all expended uses when you finish a {@variantrule Long Rest|XPHB}.';
        const recovery = parseRecovery(rageText);
        // Este teste FALHARIA com o código bugado
        if (recovery.short === 'all') {
            throw new Error('BUG #1 DETECTADO: Rage está recoverando "all" ao invés de "1"!');
        }
        expect(recovery.short).toBe('1');
    });
});
//# sourceMappingURL=resource-recovery.test.js.map