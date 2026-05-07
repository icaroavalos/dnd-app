const fs = require('fs');
let code = fs.readFileSync('src/core/state/creation-flow.ts', 'utf8');

code = code.replace(
  /if \(\!state\.character\.background\) return \['background'\];\n    if \(state\.backgroundStepMissing \&\& state\.backgroundStepMissing\.length \> 0\) return state\.backgroundStepMissing;\n    \n    \/\/ For non-guided backgrounds, check standard choice rules\n    const isGuidedBackground \= \["Acolyte", "Soldier"\]\.includes\(state\.character\.background\);\n    if \(\!isGuidedBackground\) \{\n      const missing\: string\[\] \= \[\];\n      state\.activeChoiceRules\.forEach\(\(rule\) \=\> \{\n        if \(\(rule\.type \=\=\= 'ability' \|\| rule\.type \=\=\= 'skill' \|\| rule\.type \=\=\= 'tool' \|\| rule\.type \=\=\= 'equipment'\) \&\& \!rule\.complete\) \{\n          missing\.push\(rule\.name\);\n        \}\n      \}\);\n      return missing;\n    \}\n    \n    return \[\];/,
  `if (!state.character.background) return ['background'];
    
    // For non-guided backgrounds we don't have bgChoices UI fully built yet, 
    // so we shouldn't block the UI to continue
    const isGuidedBackground = ["Acolyte", "Soldier"].includes(state.character.background);
    if (!isGuidedBackground) {
      // Temporarily allow 5etools backgrounds to continue even if incomplete
      // because we haven't built the UI for all of their complex rules yet
      return [];
    }

    if (state.backgroundStepMissing && state.backgroundStepMissing.length > 0) return state.backgroundStepMissing;
    return [];`
);

fs.writeFileSync('src/core/state/creation-flow.ts', code);
