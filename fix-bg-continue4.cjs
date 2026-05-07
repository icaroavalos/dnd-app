const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

code = code.replace(
  /if \(\!state\.character\.bgChoices \|\| \!state\.character\.bgChoices\.abilityIncrement\) \{/,
  `const isGuidedBackground = ["Acolyte", "Soldier"].includes(currentBackground);
    if (isGuidedBackground && (!state.character.bgChoices || !state.character.bgChoices.abilityIncrement)) {`
);

code = code.replace(
  /\} else if \(backgroundAbilityRequired \> 0 \&\& backgroundAbilityCount \< backgroundAbilityRequired\) \{/,
  `} else if (isGuidedBackground && backgroundAbilityRequired > 0 && backgroundAbilityCount < backgroundAbilityRequired) {`
);

code = code.replace(
  /if \(\!state\.character\.bgChoices\?\.equipmentChoice\) \{/,
  `if (isGuidedBackground && !state.character.bgChoices?.equipmentChoice) {`
);

fs.writeFileSync('app.js', code);
