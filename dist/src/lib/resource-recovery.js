/**
 * Recuperação de recursos (Rage, Wild Shape, Second Wind, etc.)
 *
 * BUG HISTORY: O bug original detectava "all" para Rage ao invés de "1"
 * porque os padrões regex eram muito genéricos e o texto não era normalizado.
 *
 * Com TypeScript, o bug seria pego em tempo de compilação ao misturar
 * "1" (string) com 1 (number).
 */
/**
 * Normaliza texto do 5etools removendo markup {@variantrule ...}
 */
export function normalizeText(rawText) {
    return rawText
        .replace(/\{@\w+\s+([^|}]+)(?:\|[^}]*)?\}/g, '$1')
        .replace(/\{@\w+\s+([^}]+)\}/g, '$1');
}
/**
 * Detecta padrão de recuperação no texto da feature
 * Retorna tipado para evitar bugs como "1" vs 1
 */
export function parseRecovery(body) {
    const rawText = String(body ?? '');
    const text = normalizeText(rawText);
    const recovery = {};
    // Pattern 1: "regain all expended uses when you finish a short rest"
    if (/regain all expended uses when you finish a short rest/i.test(text)) {
        recovery.short = 'all';
    }
    // Pattern 2: "regain all your expended uses when you finish a short rest"
    else if (/regain all your expended uses when you finish a short rest/i.test(text)) {
        recovery.short = 'all';
    }
    // Pattern 3: "regain all of (its|their|your) expended uses when you finish a short rest"
    else if (/regain all of (?:its|their|your) expended uses when you finish a short rest/i.test(text)) {
        recovery.short = 'all';
    }
    // Pattern 4: "regain one expended uses" (plural - errado, mas existe no código)
    else if (/regain one(?: of (?:its|their|your))? expended uses when you finish a short rest/i.test(text)) {
        recovery.short = 1;
    }
    // Pattern 5: "regain all expended uses.*finish a short rest" (genérico)
    else if (/regain all(?: your)? expended uses.*finish a (?:short rest(?: or long rest)?|short or long rest)/i.test(text)) {
        recovery.short = 'all';
    }
    // Pattern 6: "finish a short rest" + "regain all expended uses" (separados no texto)
    else if (/regain all expended uses when you finish a short rest/i.test(text)) {
        recovery.short = 'all';
    }
    // Pattern 7: **CORRETO para Rage** - "regain one expended use" (singular + when)
    else if (/regain one expended use when you finish a short rest/i.test(text)) {
        recovery.short = '1';
    }
    // Pattern 8: Fallback para textos que mencionam short rest + regain one
    else if (/regain one expended use/i.test(text) && /all expended uses.*when you finish a long rest/i.test(text)) {
        recovery.short = '1';
    }
    // Pattern 9: "can't use" + short/long rest
    else if (/short or long rest/i.test(text) && /can't use/i.test(text)) {
        recovery.short = 'all';
        recovery.long = 'all';
    }
    // Pattern 10: Action Surge - "can't use this feature again until you finish a Short Rest or Long Rest"
    else if (/can't use this feature again until you finish a (?:Short Rest|Long Rest)/i.test(text)) {
        recovery.short = 'all';
        recovery.long = 'all';
    }
    // Pattern 11: Genérico "finish a Short Rest or Long Rest"
    else if (/finish a .{0,100}Short Rest.{0,100}Long Rest/i.test(text) || /finish a .{0,100}Long Rest.{0,100}Short Rest/i.test(text)) {
        recovery.short = 'all';
        recovery.long = 'all';
    }
    // Pattern 12: "can't do so again until you finish"
    else if (/can't do so again until you finish/i.test(text)) {
        if (/short/i.test(text))
            recovery.short = 'all';
        if (/long/i.test(text))
            recovery.long = 'all';
    }
    // Pattern 13: "before a Short Rest or Long Rest"
    else if (/before a .{0,50}Short Rest/i.test(text) || /before a .{0,50}Long Rest/i.test(text)) {
        if (/short/i.test(text))
            recovery.short = 'all';
        if (/long/i.test(text))
            recovery.long = 'all';
    }
    // Long Rest patterns (independentes, rodam depois)
    if (/regain all expended uses when you finish a long rest/i.test(text)) {
        recovery.long = 'all';
    }
    else if (/regain all your expended uses when you finish a long rest/i.test(text)) {
        recovery.long = 'all';
    }
    else if (/regain all of (?:its|their|your) expended uses when you finish a long rest/i.test(text)) {
        recovery.long = 'all';
    }
    else if (/finish a long rest/i.test(text) && /regain all expended uses/i.test(text)) {
        recovery.long = 'all';
    }
    else if (/once you use this trait/i.test(text) && /finish a long rest/i.test(text)) {
        recovery.long = 'all';
    }
    else if (/can't use this trait again until you finish a long rest/i.test(text)) {
        recovery.long = 'all';
    }
    else if (/can't use (?:it|this trait|this feature|this ability) again until you finish a long rest/i.test(text)) {
        recovery.long = 'all';
    }
    return recovery;
}
/**
 * Aplica recuperação de Short Rest em um recurso
 *
 * @param currentUsed - Quantos usos estão gastos atualmente
 * @param recovery - Valor de recuperação ('all', '1', ou number)
 * @returns Novo valor de used após recuperação
 */
export function applyShortRestRecovery(currentUsed, recovery) {
    if (!recovery)
        return currentUsed;
    if (recovery === 'all') {
        return 0;
    }
    if (recovery === '1') {
        return Math.max(0, currentUsed - 1);
    }
    // Number recovery
    return Math.max(0, currentUsed - Number(recovery));
}
/**
 * Aplica recuperação de Long Rest em um recurso
 * Sempre reseta para 0 (todos os usos recuperados)
 */
export function applyLongRestRecovery(_recovery) {
    return 0;
}
//# sourceMappingURL=resource-recovery.js.map