const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

code = code.replace(
  /\} else if \(isGuidedBackground \&\& backgroundAbilityRequired \> 0 \&\& backgroundAbilityCount \< backgroundAbilityRequired\) \{/,
  `} else if (backgroundAbilityRequired > 0 && backgroundAbilityCount < backgroundAbilityRequired) {`
);

code = code.replace(
  /if \(isGuidedBackground \&\& \(\!state\.character\.bgChoices \|\| \!state\.character\.bgChoices\.abilityIncrement\)\) \{/,
  `if (!state.character.bgChoices || !state.character.bgChoices.abilityIncrement) {`
);

code = code.replace(
  /if \(isGuidedBackground \&\& \!state\.character\.bgChoices\?\.equipmentChoice\) \{/,
  `if (!state.character.bgChoices?.equipmentChoice) {`
);

fs.writeFileSync('app.js', code);
