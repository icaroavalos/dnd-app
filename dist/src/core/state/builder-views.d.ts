import type { Character } from '../../types/state.js';
import type { AbilityName, BackgroundChoiceState } from '../../types/background.js';
type OptionTuple = [string, string];
interface BasicHelpers {
    navButtons: () => string;
    escapeHtml: (value: string | number | null | undefined) => string;
    titleCase: (value: string | number) => string;
}
interface SelectHelpers extends BasicHelpers {
    selectField: (path: string, label: string, value: string, options: OptionTuple[], locked?: boolean) => string;
}
export interface NameFieldArgs {
    character: Pick<Character, 'name'>;
    field: (path: string, label: string, value: string) => string;
}
export interface LineageFormArgs extends SelectHelpers {
    character: Pick<Character, 'class' | 'race' | 'subrace' | 'alignment'>;
    locked: boolean;
    subraceOptions: string[];
    classOptions: OptionTuple[];
    raceOptions: OptionTuple[];
    alignmentOptions: OptionTuple[];
}
export interface AbilitiesFormArgs extends BasicHelpers {
    locked: boolean;
    abilityMethod: string;
    abilityMethods: OptionTuple[];
    className: string;
    classSaves: string[];
    abilityDefinitions: [AbilityName, string][];
    selectField: (path: string, label: string, value: string, options: OptionTuple[], locked?: boolean) => string;
    checkbox: (listName: string, value: string, label: string, checked: boolean, disabled?: boolean, readonly?: boolean) => string;
    renderAbilityMethodControls: () => string;
    renderAbilityScoreCalculations: () => string;
}
export interface ChoicesFormArgs extends BasicHelpers {
    classSkill: {
        choose: number;
        options: string[];
    };
    backgroundSkills: string[];
    selectedClassSkills: string[];
    classChoicesHtml: string;
    equipmentChoicesHtml: string;
    attacksHtml: string;
    locked: boolean;
    checkbox: (listName: string, value: string, label: string, checked: boolean, disabled?: boolean, readonly?: boolean) => string;
}
export interface BackgroundAbilityOption {
    value: string;
    label: string;
    selected: boolean;
    disabled: boolean;
    bonus?: number;
}
export interface BackgroundEquipmentOption {
    value: string;
    label: string;
    hint: string;
    selected: boolean;
}
export interface BackgroundOption {
    value: string;
    label: string;
    selected: boolean;
}
export interface BackgroundViewModelLike {
    currentBackground: string | null;
    options: BackgroundOption[];
    maxAbilityChoices: number;
    selectedAbilityCount: number;
    abilityOptions: BackgroundAbilityOption[];
    skills: string[];
    tools: string[];
    equipmentOptions: BackgroundEquipmentOption[];
    showsMagicInitiate: boolean;
    spellcastingAbility: string | null;
}
export interface BackgroundFormArgs extends BasicHelpers {
    locked: boolean;
    bgChoices: Pick<BackgroundChoiceState, 'abilityIncrement'>;
    viewModel: BackgroundViewModelLike;
    renderBgSpellChoices: () => string;
}
export interface LevelingFormArgs extends BasicHelpers {
    isLevelUpMode: boolean;
    levelUpBannerHtml: string;
    classChoicesHtml: string;
    spellChoiceRule: {
        cantrips: number;
        spellsMax: number;
        hint: string;
    };
    spellCounts: {
        cantrips: number;
        leveled: number;
    };
    renderSpellChoiceGroups: () => string;
    navButtonsHtml: string;
}
export declare function renderNameField({ character, field }: NameFieldArgs): string;
export declare function renderLineageForm(args: LineageFormArgs): string;
export declare function renderAbilitiesForm(args: AbilitiesFormArgs): string;
export declare function renderChoicesForm(args: ChoicesFormArgs): string;
export declare function renderBackgroundForm(args: BackgroundFormArgs): string;
export declare function renderLevelingForm(args: LevelingFormArgs): string;
export {};
//# sourceMappingURL=builder-views.d.ts.map