# Backend Modules

Módulos da API do backend.

## Estrutura

Cada módulo segue o padrão:

```
module-name/
  dto/           # Data Transfer Objects (DTOs)
    index.ts     # Export barrel
    *.dto.ts     # DTOs específicos
    README.md    # Documentação do módulo
  *.controller.ts
  *.service.ts
```

## Módulos

### Actions (`/actions`)

- **Endpoint:** `POST /actions/derive`
- **Descrição:** Deriva ações disponíveis para um personagem
- **DTO:** `DeriveActionsRequestDto`

### Characters (`/characters`)

- **Endpoint:** `POST /characters/project`
- **Descrição:** Projeta personagem (calcula stats derivados)
- **DTO:** Usa `CharacterRecord` diretamente

### Inventory (`/inventory`)

- **Endpoints:**
  - `POST /inventory/spend-ammo` - Gasta munição
  - `POST /inventory/recover-ammo` - Recupera munição
- **DTOs:** `SpendAmmoRequestDto`, `RecoverAmmoRequestDto`

### Resources (`/resources`)

- **Endpoints:**
  - `POST /resources/use` - Usa recurso limitado
  - `POST /resources/recover` - Recupera recursos (rest)
- **DTOs:** `UseResourceRequestDto`, `RecoverResourcesRequestDto`

### Rules (`/rules`)

- **Endpoints:** `GET /rules/*`
- **Descrição:** Catálogo de regras (backgrounds, classes, spells, etc.)
- **DTO:** Sem DTOs específicos (respostas diretas do catálogo)

## Diretrizes

1. **DTOs em `dto/`:** Todo request/response complexo tem seu DTO na pasta `dto/`
2. **Documentação:** Cada módulo documenta seus DTOs em `dto/README.md`
3. **Contratos:** Tipos compartilhados em `@shared/contracts`
4. **Validação:** Usar class-validator (futuro) para validação de DTOs

## Histórico

- **v1.0** (2026-05): Criação dos primeiros DTOs explícitos
- **v1.1** (2026-05): Documentação de todos os módulos
