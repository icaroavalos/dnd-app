import fs from 'fs';
let content = fs.readFileSync('app.js', 'utf8');

// Remove description from applyRest
content = content.replace(
  /const description = isLong ? "Restaura HP ao máximo e recupera todos os slots de magia." : "Recupera recursos de descanso curto, como Pact Magic."; state\.restModalContent = \{ label: isLong \? "Long Rest" : "Short Rest", description \};/,
  'state.restModalContent = { label: isLong ? "Long Rest" : "Short Rest", description: "" };'
);

// Add restModalHitDice to state
content = content.replace(
  /restModalContent: null,/
  'restModalContent: null,\nrestModalHitDice: {},'
);

fs.writeFileSync('app.js', content);
console.log('Patch done');
