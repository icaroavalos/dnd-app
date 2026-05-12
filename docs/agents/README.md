# Agent Handoff

Este diretorio e o ponto de entrada para agentes operacionais de menor capacidade.

## Ordem obrigatoria de leitura

1. `docs/Architecture_memory.md`
2. `docs/preferences.md`
3. `docs/learnings.md`
4. `docs/sessions.md`
5. `docs/agents/task-board.md`
6. `docs/superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md`

## Para o usuario copiar prompts

Use `docs/agents/prompts-para-copiar.md`. Ele contem prompts sequenciais prontos para enviar a outros agentes, incluindo prompts de implementacao, revisao e QA final.

Para a demanda especifica de tornar o backend a fonte obrigatoria do frontend e remover fallback/hardcode de runtime, use `docs/agents/conexao-backend-frontend-prompts.txt`.

## Regra de trabalho

- Execute uma tarefa por vez.
- Nao comece feature nova se `backend/npm run typecheck` estiver vermelho.
- Nao use dados fora de `data/5etools/5e-2024/` para regra em runtime.
- Nao edite `5etools-v2.28.0/` salvo se a tarefa for explicitamente atualizar o compactador.
- Nao coloque regra de negocio nova em `app.js`.
- Nao misture frontend, backend e documentacao em uma mesma tarefa se isso puder ser separado.
- Atualize `docs/sessions.md` no fim de cada tarefa executada.

## Definition of Done

Uma tarefa so esta pronta quando:

- Os arquivos definidos no plano foram alterados.
- Os testes especificos da tarefa foram rodados.
- A verificacao geral da area passou ou a falha residual foi registrada.
- `docs/sessions.md` contem timestamp, comandos e resultado.
- Nenhum arquivo gerado localmente foi adicionado sem necessidade.

## Debug de problemas de renderizacao

Se o formulario de criacao de personagem estiver em branco:

1. Verificar se `renderForm()` em `src/app/app-shell.js` esta inserindo HTML no DOM:
   ```javascript
   function renderForm() {
     const state = getState();
     if (state.builderVisible === false) return;
     let html = '';
     if (state.step === 'lineage') html = renderLineageForm();
     // ... outros steps
     if (html) els.form.innerHTML = html; // <-- Esta linha e crucial
   }
   ```

2. Verificar se `state.api.source` esta populado (backend carregado)
3. Verificar se `state.step` corresponde a uma etapa valida
4. Usar console.log para depurar o valor de `html` antes de atribuir

Se eventos do formulario (select de classe, botoes) nao funcionarem:

1. Verificar se os handlers em `creation-event-handlers.js` usam event delegation no `form` pai
2. Nao use `querySelectorAll` + `addEventListener` em elementos filhos — o `innerHTML` do form os destroi
3. Os tres handlers devem estar ligados ao `form`: `change`, `input`, `click`
4. Use `el.matches()` para inputs/selects, `el.closest()` para botoes com filhos aninhados
5. Verificar se `bindCreationEvents()` e chamado no init com o elemento `form` correto

Para mais detalhes, ver `docs/learnings.md`.

## Comandos comuns

Backend:

```bash
cd backend
npm run typecheck
npm test
```

Frontend/core:

```bash
npm run build
npm run typecheck
node --check app.js
node --test tests/*.test.js
```

Dados 5etools compactados:

```bash
node scripts/build-5etools-data.mjs ./5etools-v2.28.0
```
