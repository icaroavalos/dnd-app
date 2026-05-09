# Inventory Module DTOs

Data Transfer Objects para a API de Inventory.

## DTOs

### SpendAmmoRequestDto

Requisição para gastar munição ao atacar com uma arma.

```json
{
  "character": { /* CharacterRecord */ },
  "weaponItemId": "item-inst-longbow",
  "amount": 1
}
```

**Campos:**
- `character` (CharacterRecord): Personagem a ser atualizado
- `weaponItemId` (string): ID da instância da arma (ex: `item-inst-longbow`)
- `amount` (number, opcional): Quantidade de munição a gastar (padrão: 1)

### RecoverAmmoRequestDto

Requisição para recuperar munição de uma arma.

```json
{
  "character": { /* CharacterRecord */ },
  "weaponItemId": "item-inst-longbow",
  "amount": 1
}
```

**Campos:**
- `character` (CharacterRecord): Personagem a ser atualizado
- `weaponItemId` (string): ID da instância da arma
- `amount` (number, opcional): Quantidade de munição a recuperar (padrão: 1)

## Exemplos de Uso

### Gastar Munição (Atirar Flecha)

```typescript
POST /inventory/spend-ammo
{
  "character": { ... },
  "weaponItemId": "item-inst-longbow",
  "amount": 1
}
```

### Recuperar Munição (Coletar Flecha)

```typescript
POST /inventory/recover-ammo
{
  "character": { ... },
  "weaponItemId": "item-inst-longbow",
  "amount": 1
}
```

## Regras de Negócio

1. **Gasto de Munição**: Remove a quantidade especificada do estoque do personagem
2. **Recuperação**: Adiciona munição ao inventário (pilha existente ou nova)
3. **Tipo de Munição**: Determinado automaticamente pelo tipo da arma (arco → flechas, besta → virotes)
