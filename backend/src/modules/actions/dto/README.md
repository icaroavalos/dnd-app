# Actions Module DTOs

Data Transfer Objects para a API de Actions.

## DTOs

### DeriveActionsRequestDto

Requisição para derivar as ações disponíveis para um personagem.

```json
{
  "character": { /* CharacterRecord */ }
}
```

**Campos:**
- `character` (CharacterRecord): Personagem para o qual calcular ações

### DeriveActionsResponseDto (implicito)

Resposta contendo a lista de ações derivadas. Na prática, o endpoint retorna `DerivedAction[]` diretamente.

```json
[
  {
    "id": "attack:item-inst-longsword",
    "kind": "attack",
    "icon": "ATK",
    "name": "Longsword",
    "subtitle": "Weapon / Attack",
    "range": "5 feet",
    "rangeLabel": "Melee",
    "hit": "+5",
    "damage": ["1d8+4"],
    "notes": "Slashing • Versatile",
    "detail": "Damage: 1d8+4 • ...",
    "disabled": false,
    "source": {
      "itemId": "item-inst-longbow",
      "baseItemId": "longbow",
      "twoHandedBlocked": false,
      "loadingBlocked": false
    }
  },
  ...
]
```

## Exemplos de Uso

### Derivar Ações de um Personagem

```typescript
POST /actions/derive
{
  "character": {
    "id": "char-001",
    "ruleset": "ld-2024",
    "name": "Fighter",
    "abilities": {
      "str": 16,
      "dex": 14,
      ...
    },
    "inventory": [...],
    ...
  }
}
```

**Resposta:** `DerivedAction[]`

## Notas

- O DTO `DeriveActionsRequestDto` é atualmente simples (apenas `character`), mas permite extensão futura
- A resposta é uma lista de `DerivedAction` com estado `disabled` calculado
- `DerivedAction` inclui metadados como `source` para debugging (twoHandedBlocked, loadingBlocked, etc.)
