# Magic Initiate Bug Fix - TypeScript

## Problema Original

Ao tentar subir de nível com personagem **Aasimar Acolyte** (ou qualquer background que ganha Magic Initiate), a mensagem de erro aparecia mesmo após escolher as magias:

```
Ainda falta: Magic Initiate (cleric): 2 cantrips, Magic Initiate (cleric): 1 level 1 spell
```

## Causas do Bug

### 1. Caminho Incorreto do SpellDetails
```javascript
// ERRADO: state.api.source?.spellDetails pode não existir
state.api.source?.spellDetails?.[s.toLowerCase()]?.level

// CORRETO: state.api.spellDetails é a fonte canonical
state.api.spellDetails?.[s.toLowerCase()]?.level
```

### 2. Validação Fora do Contexto Correto
O código de validação do Magic Initiate estava executando **depois** do early return:
```javascript
if (!state.levelUpMode && creationChoicesLocked()) return [];
```

Isso significa que a validação do Magic Initiate **ignorava** essa condição e sempre validava, mesmo quando a criação já estava completa.

### 3. Mensagem de Erro Confusa
```javascript
// Antigo (confuso):
missing.push(`${rule.name}: ${rule.cantrips} cantrips`);  // "cantrips" sem contexto

// Novo (claro):
missing.push(`${rule.name}: ${rule.cantrips} cantrip(s)`);
```

## Correções Aplicadas

### 1. spellDetails Path Fix
```javascript
// Antes
state.api.source?.spellDetails?.[s.toLowerCase()]?.level

// Depois
state.api.spellDetails?.[s.toLowerCase()]?.level
```

### 2. Null Coalescing Operator
```javascript
// Antes (|| retorna 2 se cantrips for 0, que é falsy!)
(rule.cantrips || 2)

// Depois (?? retorna cantrips mesmo se for 0)
(rule.cantrips ?? 2)
```

### 3. TypeScript Implementation
```typescript
// src/lib/background-spell-validation.ts
export function validateBackgroundSpellChoices(
  bgSpellChoices: Record<string, string[]> | undefined,
  spellDetails: Record<string, SpellDetail> | undefined,
  rules: BackgroundSpellRule[]
): string | null {
  for (const rule of rules) {
    const storageKey = `bg-${rule.id}`;
    const selected = bgSpellChoices?.[storageKey] || [];

    const selectedCantrips = selected.filter(
      (s) => s && spellDetails?.[s.toLowerCase()]?.level === 0
    );
    const selectedLevel1 = selected.filter(
      (s) => s && spellDetails?.[s.toLowerCase()]?.level === 1
    );

    if (selectedCantrips.length < rule.cantrips) {
      return `${rule.name}: ${rule.cantrips} cantrip(s)`;
    }
    if (selectedLevel1.length < rule.level1Spells) {
      return `${rule.name}: ${rule.level1Spells} level 1 spell(s)`;
    }
  }
  return null; // Tudo correto!
}
```

## Como Testar

1. Crie um personagem com background que ganha Magic Initiate
2. Escolha as 2 magias cantrip e 1 magia de nível 1
3. Tente subidr de nível
4. A mensagem de erro **não deve aparecer** se as magias foram escolhidas

## Tipos TypeScript Criados

```typescript
interface BackgroundSpellRule {
  id: string;
  name: string;
  type: 'bg_spell_choice';
  spellList: string;
  cantrips: number;
  level1Spells: number;
}

interface SpellDetail {
  name: string;
  level: number;
  school?: string;
  // ...
}
```

## Resultado

✅ Mensagem de erro clara: `cantrip(s)` e `spell(s)`  
✅ Validação usa `state.api.spellDetails` correto  
✅ `??` ao invés de `||` para null coalescing  
✅ Types TypeScript previnem erros futuros
