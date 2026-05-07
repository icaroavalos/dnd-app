const fs = require('fs');
let code = fs.readFileSync('src/core/state/creation-flow.ts', 'utf8');

code = code.replace(
  /if \(\!state\.character\.background\) return \['background'\];\n    return state\.backgroundStepMissing;/,
  `if (!state.character.background) return ['background'];
    if (state.backgroundStepMissing && state.backgroundStepMissing.length > 0) return state.backgroundStepMissing;
    
    // For non-guided backgrounds, check standard choice rules
    const isGuidedBackground = ["Acolyte", "Soldier"].includes(state.character.background);
    if (!isGuidedBackground) {
      const missing: string[] = [];
      state.activeChoiceRules.forEach((rule) => {
        if ((rule.type === 'ability' || rule.type === 'skill' || rule.type === 'tool' || rule.type === 'equipment') && !rule.complete) {
          missing.push(rule.name);
        }
      });
      return missing;
    }
    
    return [];`
);

fs.writeFileSync('src/core/state/creation-flow.ts', code);
