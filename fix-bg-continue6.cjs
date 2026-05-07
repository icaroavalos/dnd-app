const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

code = code.replace(
  /const activeRules \= activeChoiceRulesForValidation\(\)\.map\(\(rule\) \=\> \(\{/g,
  `const activeRules = activeChoiceRulesForValidation()
    .filter((rule) => {
      // Allow background choices like skill/tool/equipment in activeRules for step validation
      if (rule.type === 'ability' || rule.type === 'skill' || rule.type === 'tool' || rule.type === 'equipment') {
        return true; // Included so getMissingChoicesForStep can see it
      }
      return true; // Keep others as well
    })
    .map((rule) => ({`
);

code = code.replace(
  /complete\: rule\.type \=\=\= \"asi\"/g,
  `complete: rule.type === "ability" || rule.type === "skill" || rule.type === "tool" || rule.type === "equipment"
      ? Boolean(state.character.bgChoices?.skillChoices?.length || state.character.bgChoices?.toolChoices?.length || state.character.bgChoices?.abilityScores?.length || state.character.bgChoices?.equipmentChoice || state.character.equipmentChoices?.[rule.id])
      : rule.type === "asi"`
);

fs.writeFileSync('app.js', code);
