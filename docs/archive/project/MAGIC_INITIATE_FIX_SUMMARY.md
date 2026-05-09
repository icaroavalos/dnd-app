# Magic Initiate Fix Summary

## Problem
Message "Ainda falta: Magic Initiate (cleric): 2 cantrips, Magic Initiate (cleric): 1 level 1 spell(s)" appears even after selecting the required spells.

## Root Cause
The validation code at lines 1240-1249 in `app.js` uses `state.api.spellDetails?.[s.toLowerCase()]?.level`, but this can fail if:
1. `state.api.spellDetails` is empty or undefined
2. Spell names don't match exactly (case sensitivity)
3. The lookup key format differs from stored format

## TypeScript Solution Created
1. **src/types/character.ts** - Type definitions
2. **src/lib/background-spell-validation.ts** - Robust validation functions
3. **src/lib/magic-initiate-debug.ts** - Debug utilities

## Immediate Fix for app.js

Replace lines 1240-1249 with this code:

```javascript
// Check background spell choices (Magic Initiate) - ROBUST VERSION
const bgSpellRules = backgroundSpellChoiceRules();
bgSpellRules.forEach((rule) => {
  const storageKey = `bg-${rule.id}`;
  const selected = state.character.bgSpellChoices?.[storageKey] || [];

  // Robust spell level lookup with fallbacks
  const spellDetails = state.api.spellDetails || {};
  const getSpellLevel = (name) => {
    if (!name) return -1;
    // Direct lookup (case-insensitive)
    const lower = name.toLowerCase();
    const detail = spellDetails[lower];
    if (detail) return detail.level ?? -1;
    // Fallback: search all entries
    const found = Object.values(spellDetails).find(
      d => d?.name?.toLowerCase() === lower
    );
    return found?.level ?? -1;
  };

  const selectedCantrips = selected.filter(s => getSpellLevel(s) === 0);
  const selectedLevel1 = selected.filter(s => getSpellLevel(s) === 1);

  const needsCantrips = rule.cantrips ?? 2;
  const needsLevel1 = rule.level1Spells ?? 1;

  if (selectedCantrips.length < needsCantrips) {
    missing.push(`${rule.name}: ${needsCantrips} cantrip(s)`);
  }
  if (selectedLevel1.length < needsLevel1) {
    missing.push(`${rule.name}: ${needsLevel1} spell(s)`);
  }
});
```

## Testing Steps
1. Create Aasimar with Cleric background (Magic Initiate: Cleric)
2. Select 2 cantrips from cleric spell list
3. Select 1 level 1 spell from cleric spell list
4. Try to level up
5. Should NOT see error message anymore

## Why This Happens
The issue was that `state.api.spellDetails` might store spell names differently than expected (different case, different format, etc.). The new code:
- Handles both exact matches and case-insensitive lookups
- Uses fallback search through all entries
- Returns -1 for missing spells (clearly invalid)
- Shows clear error messages
