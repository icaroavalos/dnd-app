# Documentacao do Projeto

Este diretorio concentra a memoria viva do projeto e a documentacao historica.

## Ambiente de desenvolvimento (2026-05-11)

- Frontend: `npm run dev` → `http://localhost:3000`
- Backend: `npm run backend:dev` → `http://localhost:3100`
- Vite: disponivel via `npx vite` → `http://localhost:5173`
- CORS: habilitado para `localhost:3000`, `localhost:4173`, `localhost:5173`

## Arquivos de memoria

- `Architecture_memory.md`: decisoes de arquitetura, estado atual do backend e diferencas entre plano e codigo.
- `preferences.md`: preferencias tecnicas, estilo de codigo e regras de manutencao.
- `sessions.md`: log de sessoes com timestamp, verificacoes e proximas acoes.
- `learnings.md`: aprendizados recorrentes e problemas ja investigados.
- `ficha-guiada.md`: documentacao completa do criador de personagens passo-a-passo (steps, fluxos, regras).
- **Padrao de Event Delegation:** Todos os eventos do formulario de criacao usam event delegation no elemento `form` pai com tres handlers (change, input, click). `el.matches()` para elementos folha (inputs, selects), `el.closest()` para elementos compostos (botoes com span).
- **Padrao de Comparacao em Selects:** Valores de catalogo usam keys slugificadas; state usa valores formatados. Comparar sempre com `slugify()` em ambos os lados.

## Handoff de agentes

- `agents/README.md`: instrucoes para agentes operacionais.
- `agents/task-board.md`: quadro de tarefas delegaveis.
- `agents/roadmap.md`: roadmap por fases.
- `superpowers/plans/2026-05-08-backend-mvp-system-roadmap.md`: plano formal de implementacao do backend MVP e do sistema.

## Documentos historicos

- `archive/STACK_ARCHITECTURE.md`: snapshot antigo da stack. Parte dele esta desatualizada pelo backend NestJS.
- `archive/migration-review.md`: revisao historica da duplicacao frontend/backend.
- `archive/project/`: notas e sumarios de implementacoes anteriores.
- `superpowers/specs/` e `superpowers/plans/`: specs e planos de execucao usados por agentes.

## Fonte de verdade atual

Para decisao de arquitetura, leia primeiro:

1. `Architecture_memory.md`
2. `preferences.md`
3. `sessions.md`
4. `learnings.md`
5. `agents/README.md`
6. `agents/task-board.md`

Depois consulte os documentos historicos se precisar entender como uma decisao surgiu.
