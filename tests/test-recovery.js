/**
 * Testes para recuperação de recursos (Rage, Wild Shape, etc.)
 *
 * BUG HISTORY:
 * - Bug #1: Rage recoverava "all" ao invés de "1" no Short Rest
 * - Causa: Padrões regex muito genéricos + falta de normalização do texto 5etools
 * - Solução: TypeScript + testes + normalização explícita
 */

import { normalizeText, parseRecovery, applyShortRestRecovery, applyLongRestRecovery } from '../dist/src/lib/resource-recovery.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

console.log('=== Testing normalizeText ===');

test('remove markup {@variantrule} do 5etools', () => {
  const input = 'You finish a {@variantrule Short Rest|XPHB}.';
  assertEqual(normalizeText(input), 'You finish a Short Rest.', 'normalizeText');
});

test('remove markup {@action}', () => {
  const input = 'Use {@action Magic|XPHB} action.';
  assertEqual(normalizeText(input), 'Use Magic action.', 'normalizeText');
});

test('múltiplos markups', () => {
  const input = 'You finish a {@variantrule Short Rest|XPHB} and {@variantrule Long Rest|XPHB}.';
  assertEqual(normalizeText(input), 'You finish a Short Rest and Long Rest.', 'normalizeText');
});

console.log('\n=== Testing parseRecovery - Barbarian Rage ===');

test('detecta "one expended use" no Short Rest (BUG #1 FIX)', () => {
  const rageText = 'You can enter your Rage the number of times shown. You regain one expended use when you finish a {@variantrule Short Rest|XPHB}, and you regain all expended uses when you finish a {@variantrule Long Rest|XPHB}.';
  const recovery = parseRecovery(rageText);
  assertEqual(recovery.short, '1', 'short recovery');
  assertEqual(recovery.long, 'all', 'long recovery');
});

test('funciona sem markup 5etools', () => {
  const rageText = 'You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.';
  const recovery = parseRecovery(rageText);
  assertEqual(recovery.short, '1', 'short recovery');
  assertEqual(recovery.long, 'all', 'long recovery');
});

console.log('\n=== Testing parseRecovery - Wild Shape ===');

test('detecta "one expended use" no Short Rest', () => {
  const wildShapeText = 'You can use Wild Shape twice. You regain one expended use when you finish a {@variantrule Short Rest|XPHB}, and you regain all expended uses when you finish a {@variantrule Long Rest|XPHB}.';
  const recovery = parseRecovery(wildShapeText);
  assertEqual(recovery.short, '1', 'short recovery');
  assertEqual(recovery.long, 'all', 'long recovery');
});

console.log('\n=== Testing parseRecovery - Second Wind ===');

test('detecta "one expended use" sem "Long Rest"', () => {
  const secondWindText = 'You regain one expended use when you finish a {@variantrule Short Rest|XPHB}.';
  const recovery = parseRecovery(secondWindText);
  assertEqual(recovery.short, '1', 'short recovery');
  assertEqual(recovery.long, undefined, 'long recovery');
});

console.log('\n=== Testing parseRecovery - Action Surge ===');

test('detecta "cant use again until" com Short e Long Rest', () => {
  const actionSurgeText = "Once you use this feature, you can't do so again until you finish a {@variantrule Short Rest|XPHB} or {@variantrule Long Rest|XPHB}.";
  const recovery = parseRecovery(actionSurgeText);
  assertEqual(recovery.short, 'all', 'short recovery');
  assertEqual(recovery.long, 'all', 'long recovery');
});

console.log('\n=== Testing applyShortRestRecovery ===');

test('recupera 1 uso quando recovery = "1"', () => {
  assertEqual(applyShortRestRecovery(4, '1'), 3, 'recovery');
});

test('recupera tudo quando recovery = "all"', () => {
  assertEqual(applyShortRestRecovery(4, 'all'), 0, 'recovery');
});

test('recupera número específico quando recovery = number', () => {
  assertEqual(applyShortRestRecovery(5, 2), 3, 'recovery');
});

test('não vai abaixo de zero', () => {
  assertEqual(applyShortRestRecovery(1, '1'), 0, 'recovery');
  assertEqual(applyShortRestRecovery(0, '1'), 0, 'recovery');
});

console.log('\n=== Testing applyLongRestRecovery ===');

test('sempres reseta para zero', () => {
  assertEqual(applyLongRestRecovery('all'), 0, 'recovery');
  assertEqual(applyLongRestRecovery('1'), 0, 'recovery');
  assertEqual(applyLongRestRecovery(2), 0, 'recovery');
});

console.log('\n=== REGRESSION TEST - Bug #1 ===');

test('NUNCA deve detectar "all" para Rage no Short Rest', () => {
  const rageText = 'You regain one expended use when you finish a {@variantrule Short Rest|XPHB}, and you regain all expended uses when you finish a {@variantrule Long Rest|XPHB}.';
  const recovery = parseRecovery(rageText);

  if (recovery.short === 'all') {
    throw new Error('BUG #1 DETECTADO: Rage está recoverando "all" ao invés de "1"!');
  }

  assertEqual(recovery.short, '1', 'short recovery');
});

console.log('\n=====================');
console.log(`Tests: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
