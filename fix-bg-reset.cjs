const fs = require('fs');
let code = fs.readFileSync('src/core/state/creation-form-controller.ts', 'utf8');
code = code.replace(
  /function nextBackgroundChoices\(backgroundName\: string, currentChoices\?\: BackgroundChoiceState \| null\)\: BackgroundChoiceState \{/,
  `function nextBackgroundChoices(backgroundName: string, currentChoices?: BackgroundChoiceState | null): BackgroundChoiceState {
  if (currentChoices?.background === backgroundName) return currentChoices;`
);
fs.writeFileSync('src/core/state/creation-form-controller.ts', code);
