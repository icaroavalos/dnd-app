const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// The `currentBackground` is checked for ["Acolyte"] but the backgroundName could be anything from 5etools if we don't have it mapped in GUIDED_BACKGROUND_DEFINITIONS.
// In that case, we should check if it's a GUIDED background and if so apply the rules. If it's NOT a guided background, it will have its own rules.
// But we should skip the guided background checks if the background is not one of the guided ones.

code = code.replace(
  /if \(currentBackground\) \{/,
  `if (currentBackground) {
    const isGuidedBackground = ["Acolyte", "Soldier"].includes(currentBackground);
    if (!isGuidedBackground) {
      // If it's a 5etools background, the requirements are different
      // For now we don't block the UI if it's a 5etools background
      const missing = [];
      const bgRules = activeChoiceRulesForValidation().filter(r => r.type === "ability" || r.type === "skill" || r.type === "tool" || r.type === "equipment");
      bgRules.forEach(rule => {
        if (!rule.complete) missing.push(rule.name);
      });
      backgroundStepMissing.push(...missing);
    } else {`
);

code = code.replace(
  /backgroundSpellSelections\.forEach\(\(selection\) \=\> \{/g,
  `}
    backgroundSpellSelections.forEach((selection) => {`
);

fs.writeFileSync('app.js', code);
