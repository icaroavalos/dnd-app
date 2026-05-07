const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');
code = code.replace(
  /if \(currentBackground === "Acolyte" && !state\.character\.bgChoices\?\.spellcastingAbility\) \{/,
  `const showsMagicInitiate = ["Acolyte"].includes(currentBackground) || state.api.source?.backgroundDetails?.[currentBackground]?.feature?.name?.toLowerCase().includes("magic initiate");
    if (showsMagicInitiate && !state.character.bgChoices?.spellcastingAbility) {`
);
fs.writeFileSync('app.js', code);
