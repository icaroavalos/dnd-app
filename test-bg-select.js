import { applyBackgroundStepSelection } from './dist/src/core/state/creation-form-controller.js';

const character = {
  background: "",
  bgChoices: null,
  classSkillChoices: []
};

const newChar = applyBackgroundStepSelection(character, "Acolyte", () => ["Insight", "Religion"]);
console.log("Acolyte", newChar.bgChoices);
const newChar2 = applyBackgroundStepSelection(newChar, "Acolyte", () => ["Insight", "Religion"]);
console.log("Acolyte again", newChar2.bgChoices);
