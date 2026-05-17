# Preferences

Ultima revisao: 2026-05-16.

## Ambiente de desenvolvimento

- Frontend: `npm run dev` → `http://localhost:3000`
- Backend: `npm run backend:dev` → `http://localhost:3100`
- Vite: disponivel como dev dependency, production build usa `vite build`
- CORS habilitado para: `localhost:3000`, `localhost:4173`, `localhost:5173`

## Estilo de codigo

- TypeScript e a fonte de verdade para regras e backend.
- Manter `strict` sem mascarar erros com casts amplos.
- Preferir funcoes puras em regra de D&D.
- Controllers devem ser finos; services concentram comportamento.
- DTOs ficam em `backend/src/modules/*/dto/`.
- Contratos compartilhaveis ficam em `backend/src/shared/contracts/`.
- Nao colocar view-models de frontend em `@shared/contracts`.
- Evitar refactors amplos quando uma correcao pequena resolve o slice.

## Regras de dados

- Usar apenas `data/5etools/5e-2024/` como fonte canonica de regras em runtime.
- Nao usar Open5e, dnd5eapi, datasets legados ou dados copiados manualmente.
- Se o dado compacto estiver incompleto, corrigir primeiro o compactador em `scripts/build-5etools-data.mjs`.
- Banco de dados e para estado de usuario/personagem, nao para regras do 5etools.

## Backend

- Backend em NestJS + Fastify.
- `npm run typecheck` e obrigatorio para considerar MVP pronto.
- `npm test` sozinho nao basta, porque `tsx` executa sem validar todo o TypeScript.
- Erros de API devem manter shape estavel: `statusCode`, `error.code`, `error.message`, `path`, `requestId`, `timestamp`.
- Persistencia deve ter uma unica rota canonica antes de integrar o frontend.

## Frontend

- **Não usar emojis**: O uso de emojis é estritamente proibido tanto no código quanto na interface do usuário. Utilize ícones de bibliotecas (como Lucide) ou texto claro em seu lugar.
- **Arquitetura de Estilos:** Uso obrigatório de **Tailwind CSS** (v3). Classes utilitárias diretamente no JSX. CSS Modules **não são mais utilizados**.
- **Helper `cn()`:** Usar o utilitário `cn()` de `src/lib/utils.ts` (clsx + tailwind-merge) para classes condicionais.
- **`index.css`:** Deve conter apenas variáveis CSS globais (`:root`), resets e componentes reutilizáveis via `@layer components` (ex: `.primary-button`, `.field`).
- O frontend deve consumir dados exclusivamente via API, sem fallbacks locais permanentes para dados canônicos.
- Erros de rede ou backend devem ser tratados visualmente para o usuário.

## D&D 2024

- Regras implementadas devem ser suportadas pelo dataset local ou por contrato explicito.
- Nao inferir mecanicas complexas se o dado local nao permite uma regra segura.
- Para MVP backend, priorizar criacao/projecao/acoes/recursos/inventario antes de condicoes complexas, magic items avancados ou multiclass profundo.
