import { applyBackgroundStepSelection } from './dist/src/core/state/creation-form-controller.js';

const character = {
  background: "",
  bgChoices: null,
  classSkillChoices: []
};

const newChar = applyBackgroundStepSelection(character, "Criminal", () => ["Deception", "Stealth"]);
console.log("Criminal", newChar.bgChoices);
