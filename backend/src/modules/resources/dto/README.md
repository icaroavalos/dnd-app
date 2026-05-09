# Resources Module DTOs

Data Transfer Objects para a API de Resources.

## DTOs

### UseResourceRequestDto

Requisição para usar um recurso limitado (ex: Second Wind, Action Surge).

```json
{
  "character": { /* CharacterRecord */ },
  "resourceId": "second_wind",
  "amount": 1
}
```

**Campos:**
- `character` (CharacterRecord): Personagem a ser atualizado
- `resourceId` (string): ID do recurso (ex: `second_wind`, `action_surge`)
- `amount` (number, opcional): Quantidade a gastar (padrão: 1)

### RecoverResourcesRequestDto

Requisição para recuperar recursos após descanso.

```json
{
  "character": { /* CharacterRecord */ },
  "recovery": "short_rest"
}
```

**Campos:**
- `character` (CharacterRecord): Personagem a ser atualizado
- `recovery` (RecoveryType): Tipo de descanso (`short_rest` | `long_rest`)

## Exemplos de Uso

### Usar Second Wind

```typescript
POST /resources/use
{
  "character": { ... },
  "resourceId": "second_wind",
  "amount": 1
}
```

### Recuperar após Short Rest

```typescript
POST /resources/recover
{
  "character": { ... },
  "recovery": "short_rest"
}
```

### Recuperar após Long Rest

```typescript
POST /resources/recover
{
  "character": { ... },
  "recovery": "long_rest"
}
```
