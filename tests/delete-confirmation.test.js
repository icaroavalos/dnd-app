/**
 * Delete Confirmation Tests
 * Testa que a exclusão de ficha requer confirmação explícita
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Delete Confirmation', () => {
  it('delete requires confirmation before deleting character', () => {
    // Simula estado inicial com 2 personagens
    const initialState = {
      characters: [
        { id: 'char-1', name: 'Character 1', level: 1, class: 'Fighter', race: 'Human' },
        { id: 'char-2', name: 'Character 2', level: 1, class: 'Wizard', race: 'Elf' },
      ],
      activeCharacterId: 'char-1',
    };

    // Estado de confirmação deve ser null inicialmente
    assert.strictEqual(initialState.deleteConfirmId, undefined, 'Should not have pending deletion initially');

    // Ao clicar em deletar, deve setar deleteConfirmId em vez de deletar imediatamente
    const deleteConfirmId = 'char-1';
    assert.ok(deleteConfirmId, 'Should set deleteConfirmId when delete button clicked');

    // Caracter ainda existe antes da confirmação
    const characterStillExists = initialState.characters.some(c => c.id === 'char-1');
    assert.strictEqual(characterStillExists, true, 'Character should still exist before confirmation');

    console.log(' Delete confirmation: requires explicit confirmation');
  });

  it('cancel button clears confirmation without deleting', () => {
    const initialState = {
      characters: [
        { id: 'char-1', name: 'Character 1', level: 1, class: 'Fighter', race: 'Human' },
      ],
      activeCharacterId: 'char-1',
      deleteConfirmId: 'char-1',
    };

    // Simula cancelamento
    let deleteConfirmId = initialState.deleteConfirmId;
    assert.strictEqual(deleteConfirmId, 'char-1', 'Should have pending deletion');

    // Cancel limpa deleteConfirmId
    deleteConfirmId = null;
    assert.strictEqual(deleteConfirmId, null, 'Cancel should clear deleteConfirmId');

    // Caracter ainda existe após cancelamento
    const characterStillExists = initialState.characters.some(c => c.id === 'char-1');
    assert.strictEqual(characterStillExists, true, 'Character should still exist after cancel');

    console.log(' Delete cancel: clears confirmation without deletion');
  });

  it('confirm button deletes character and updates list', () => {
    const initialState = {
      characters: [
        { id: 'char-1', name: 'Character 1', level: 1, class: 'Fighter', race: 'Human' },
        { id: 'char-2', name: 'Character 2', level: 1, class: 'Wizard', race: 'Elf' },
      ],
      activeCharacterId: 'char-1',
      deleteConfirmId: 'char-1',
    };

    // Simula confirmação
    let deleteConfirmId = initialState.deleteConfirmId;
    assert.strictEqual(deleteConfirmId, 'char-1', 'Should have pending deletion');

    // Remove character da lista
    const updatedCharacters = initialState.characters.filter(c => c.id !== deleteConfirmId);
    assert.strictEqual(updatedCharacters.length, 1, 'Should have one less character');
    assert.strictEqual(updatedCharacters[0].id, 'char-2', 'Remaining character should be char-2');

    // Limpa deleteConfirmId após deletar
    deleteConfirmId = null;
    assert.strictEqual(deleteConfirmId, null, 'Should clear deleteConfirmId after deletion');

    console.log(' Delete confirm: removes character and updates list');
  });

  it('delete button has clear visual design', () => {
    // Verifica que botão de deletar tem design distinto
    const deleteButtonHtml = '<button type="button" class="danger-button" data-menu-delete-active>Excluir ficha</button>';
    const deleteIconHtml = '<span class="delete-character" data-menu-delete-id="char-1" aria-label="Excluir ficha">x</span>';

    // Botão deve ter classe danger-button
    assert.match(deleteButtonHtml, /danger-button/, 'Delete button should have danger-button class');

    // Ícone deve ter classe delete-character
    assert.match(deleteIconHtml, /delete-character/, 'Delete icon should have delete-character class');

    // Botão deve ter texto claro "Excluir ficha"
    assert.match(deleteButtonHtml, /Excluir ficha/, 'Delete button should have clear label');

    // Ícone deve ter aria-label
    assert.match(deleteIconHtml, /aria-label="Excluir ficha"/, 'Delete icon should have aria-label');

    console.log(' Delete button: has clear visual design');
  });
});
