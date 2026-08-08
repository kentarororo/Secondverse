import { parseCandidateContent } from "./schema";
import {
  IDENTITY_IDS,
  type AdvantageDefinition,
  type CandidateContent,
  type CandidateTag,
  type ChassisDefinition,
  type ComplicationDefinition,
  type GrowthCurveDefinition,
  type IdentityDefinition,
  type MechanicalRule,
  type SignatureDefinition,
  type TechniqueDefinition,
  type TechniqueLoadoutDefinition,
  type TemperamentDefinition,
  type VisualProfileDefinition,
} from "./types";

const zero = { vitality: 0, power: 0, guard: 0, speed: 0, focus: 0 } as const;

const chassis: readonly ChassisDefinition[] = [
  {
    id: "guard_frame",
    name: "Guard frame",
    rulesText: "This fighter starts durable and slow, with strong Guard and reliable front-line technique access.",
    baseStats: { vitality: 14, power: 8, guard: 14, speed: 7, focus: 8 },
    tags: ["front", "guard", "rescue"],
    techniqueRoles: ["defence", "setup", "payoff"],
  },
  {
    id: "fast_frame",
    name: "Fast frame",
    rulesText: "This fighter starts fast and forceful, but carries less Vitality and Guard than other frames.",
    baseStats: { vitality: 9, power: 14, guard: 7, speed: 14, focus: 9 },
    tags: ["rear", "strike", "enemy_trigger"],
    techniqueRoles: ["setup", "payoff", "defence"],
  },
  {
    id: "support_frame",
    name: "Support frame",
    rulesText: "This fighter starts with high Focus and balanced durability, favoring healing, cover, and careful resource use.",
    baseStats: { vitality: 11, power: 8, guard: 9, speed: 10, focus: 14 },
    tags: ["rear", "heal", "focus", "ally_trigger"],
    techniqueRoles: ["support", "setup", "defence"],
  },
];

const growthCurves: readonly GrowthCurveDefinition[] = [
  {
    id: "early_power", name: "Early power",
    rulesText: "This growth pattern raises Power quickly, then improves it slowly after the first breakpoint.",
    earlyDelta: { ...zero, power: 6, speed: 2 }, lateDelta: { ...zero, power: 2, vitality: 1 }, pattern: "early",
  },
  {
    id: "early_guard", name: "Early guard",
    rulesText: "This growth pattern raises Guard and Vitality early, followed by modest defensive gains.",
    earlyDelta: { ...zero, vitality: 4, guard: 5 }, lateDelta: { ...zero, vitality: 2, guard: 2 }, pattern: "early",
  },
  {
    id: "steady_all", name: "Steady growth",
    rulesText: "This growth pattern adds balanced gains without an early spike or late surge.",
    earlyDelta: { vitality: 2, power: 2, guard: 2, speed: 2, focus: 2 },
    lateDelta: { vitality: 2, power: 2, guard: 2, speed: 2, focus: 2 }, pattern: "steady",
  },
  {
    id: "volatile_speed", name: "Uneven speed",
    rulesText: "This growth pattern raises Speed sharply between quiet stretches, while other stats gain less.",
    earlyDelta: { ...zero, speed: 1, power: 2 }, lateDelta: { ...zero, speed: 7, focus: 2 }, pattern: "volatile",
  },
  {
    id: "late_focus", name: "Late focus",
    rulesText: "This growth pattern develops Focus slowly before a clear late-training surge.",
    earlyDelta: { ...zero, focus: 1, vitality: 1 }, lateDelta: { ...zero, focus: 7, guard: 2 }, pattern: "late",
  },
  {
    id: "specialist_vitality", name: "Vitality specialist",
    rulesText: "This growth pattern favors Vitality at every stage and deliberately limits offensive gains.",
    earlyDelta: { ...zero, vitality: 5, guard: 1 }, lateDelta: { ...zero, vitality: 6, focus: 1 }, pattern: "specialist",
  },
];

function signature(
  id: SignatureDefinition["id"], name: string, rulesText: string,
  rule: MechanicalRule, tags: readonly CandidateTag[],
): SignatureDefinition {
  return { id, name, rulesText, rule, tags };
}

const signatures: readonly SignatureDefinition[] = [
  signature("guarded_focus", "Guarded focus", "This fighter gains up to 1 Point after Guard absorbs an attack, once each round.",
    { trigger:{kind:"after_self_guarded"}, target:"self", effect:{kind:"gain_points",amount:1}, oncePerRound:true }, ["guard","focus"]),
  signature("brace_return", "Brace return", "This fighter restores up to 6 Guard after Guard absorbs an attack, once each round.",
    { trigger:{kind:"after_self_guarded"}, target:"self", effect:{kind:"gain_guard",amount:6}, oncePerRound:true }, ["guard","front"]),
  signature("rescue_power", "Rescue power", "This fighter adds 6 Power to the next attack after intercepting for an ally.",
    { trigger:{kind:"after_intercept"}, target:"self", effect:{kind:"bonus_power",amount:6,uses:1,timing:"next_attack"}, oncePerRound:true }, ["rescue","strike"]),
  signature("low_health_guard", "Low-HP guard", "This fighter gains up to 12 Guard at half HP or lower, once each round.",
    { trigger:{kind:"self_below_health",ratio:0.5}, target:"self", effect:{kind:"gain_guard",amount:12}, oncePerRound:true }, ["low_health","guard"]),
  signature("basic_momentum", "Basic momentum", "This fighter adds 4 Power to the next technique attack after a basic attack.",
    { trigger:{kind:"after_basic"}, target:"self", effect:{kind:"bonus_power",amount:4,uses:1,timing:"next_technique"}, oncePerRound:true }, ["strike","early"]),
  signature("weak_target_focus", "Weak-target focus", "This fighter gains up to 1 Point when an enemy crosses below half HP, once each round.",
    { trigger:{kind:"enemy_below_health",ratio:0.5}, target:"self", effect:{kind:"gain_points",amount:1}, oncePerRound:true }, ["enemy_trigger","focus"]),
  signature("ally_guard_momentum", "Shared momentum", "This fighter adds 5 Power to the next attack after an ally gains Guard.",
    { trigger:{kind:"after_ally_guarded"}, target:"self", effect:{kind:"bonus_power",amount:5,uses:1,timing:"next_attack"}, oncePerRound:true }, ["ally_trigger","strike"]),
  signature("low_health_power", "Lasting pressure", "This fighter adds 7 Power to the next attack at half HP or lower.",
    { trigger:{kind:"self_below_health",ratio:0.5}, target:"self", effect:{kind:"bonus_power",amount:7,uses:1,timing:"next_attack"}, oncePerRound:true }, ["low_health","strike"]),
  signature("healing_focus", "Healing focus", "This fighter gains up to 1 Point after restoring an ally's HP, once each round.",
    { trigger:{kind:"after_heal"}, target:"self", effect:{kind:"gain_points",amount:1}, oncePerRound:true }, ["heal","focus"]),
  signature("urgent_aid", "Urgent aid", "This fighter restores up to 10 HP when an ally crosses below 30% HP.",
    { trigger:{kind:"ally_below_health",ratio:0.3}, target:"triggering_ally", effect:{kind:"heal",amount:10}, oncePerRound:true }, ["heal","low_health"]),
  signature("shared_cover", "Shared cover", "This fighter grants up to 5 additional Guard after an ally gains Guard.",
    { trigger:{kind:"after_ally_guarded"}, target:"triggering_ally", effect:{kind:"gain_guard",amount:5}, oncePerRound:true }, ["guard","ally_trigger"]),
  signature("patient_reserve", "Patient reserve", "This fighter gains up to 8 Guard at 3 Points before choosing an action.",
    { trigger:{kind:"at_points",points:3}, target:"self", effect:{kind:"gain_guard",amount:8}, oncePerRound:true }, ["focus","late"]),
];

function advantage(
  id: AdvantageDefinition["id"], name: string, rulesText: string,
  rule: MechanicalRule, tags: readonly CandidateTag[],
): AdvantageDefinition { return { id, name, rulesText, rule, tags }; }

const advantages: readonly AdvantageDefinition[] = [
  advantage("firm_start","Firm start","This fighter gains up to 8 Guard at battle start before the first action begins.",{trigger:{kind:"battle_start"},target:"self",effect:{kind:"gain_guard",amount:8},oncePerRound:false},["guard","early"]),
  advantage("guarded_recovery","Guarded recovery","This fighter restores up to 4 HP after Guard absorbs an attack, once each round.",{trigger:{kind:"after_self_guarded"},target:"self",effect:{kind:"heal",amount:4},oncePerRound:true},["guard"]),
  advantage("rescue_training","Rescue training","This fighter gains up to 7 Guard after intercepting for an ally, once each round.",{trigger:{kind:"after_intercept"},target:"self",effect:{kind:"gain_guard",amount:7},oncePerRound:true},["rescue","guard"]),
  advantage("steady_nerves","Steady nerves","This fighter gains up to 1 Point at half HP or lower, once each round.",{trigger:{kind:"self_below_health",ratio:0.5},target:"self",effect:{kind:"gain_points",amount:1},oncePerRound:true},["low_health","focus"]),
  advantage("quick_start","Quick start","This fighter adds 4 Power to the first attack at battle start.",{trigger:{kind:"battle_start"},target:"self",effect:{kind:"bonus_power",amount:4,uses:1,timing:"next_attack"},oncePerRound:false},["strike","early"]),
  advantage("clean_finish","Clean finish","This fighter gains up to 1 Point when an enemy crosses below 30% HP.",{trigger:{kind:"enemy_below_health",ratio:0.3},target:"self",effect:{kind:"gain_points",amount:1},oncePerRound:true},["enemy_trigger","focus"]),
  advantage("measured_combo","Measured combo","This fighter gains up to 1 Point after a basic attack, once each round.",{trigger:{kind:"after_basic"},target:"self",effect:{kind:"gain_points",amount:1},oncePerRound:true},["strike","focus"]),
  advantage("opening_focus","Opening focus","This fighter gains up to 1 Point at battle start before initiative is resolved.",{trigger:{kind:"battle_start"},target:"self",effect:{kind:"gain_points",amount:1},oncePerRound:false},["focus","early"]),
  advantage("careful_aid","Careful aid","This fighter grants an ally up to 6 Guard after restoring their HP, once each round.",{trigger:{kind:"after_heal"},target:"triggering_ally",effect:{kind:"gain_guard",amount:6},oncePerRound:true},["heal","guard"]),
  advantage("shared_recovery","Shared recovery","This fighter restores up to 4 HP to an ally after that ally gains Guard.",{trigger:{kind:"after_ally_guarded"},target:"triggering_ally",effect:{kind:"heal",amount:4},oncePerRound:true},["ally_trigger","heal"]),
  advantage("calm_reserve","Calm reserve","This fighter restores up to 8 HP at 3 Points before acting.",{trigger:{kind:"at_points",points:3},target:"self",effect:{kind:"heal",amount:8},oncePerRound:true},["focus","late"]),
  advantage("protective_focus","Protective focus","This fighter gains up to 1 Point when an ally crosses below half HP.",{trigger:{kind:"ally_below_health",ratio:0.5},target:"self",effect:{kind:"gain_points",amount:1},oncePerRound:true},["ally_trigger","focus"]),
];

function complication(
  id: ComplicationDefinition["id"], name: string, rulesText: string,
  rule: MechanicalRule, tags: readonly CandidateTag[],
): ComplicationDefinition { return { id, name, rulesText, rule, tags }; }

const complications: readonly ComplicationDefinition[] = [
  complication("slow_recovery","Slow recovery","This fighter gains 1 Strain after Guard absorbs an attack, once each round.",{trigger:{kind:"after_self_guarded"},target:"self",effect:{kind:"add_strain",amount:1},oncePerRound:true},["guard"]),
  complication("guard_hungry","Guard hungry","This fighter loses up to 6 Guard at half HP or lower, once each round.",{trigger:{kind:"self_below_health",ratio:0.5},target:"self",effect:{kind:"lose_guard",amount:6},oncePerRound:true},["low_health","guard"]),
  complication("late_commitment","Late commitment","This fighter must target the front enemy with their first attack.",{trigger:{kind:"battle_start"},target:"self",effect:{kind:"force_target",target:"front_enemy",uses:1,timing:"next_attack"},oncePerRound:false},["front"]),
  complication("strained_rescue","Strained rescue","This fighter gains 1 Strain after intercepting for an ally, once each round.",{trigger:{kind:"after_intercept"},target:"self",effect:{kind:"add_strain",amount:1},oncePerRound:true},["rescue"]),
  complication("thin_guard","Thin guard","This fighter loses up to 5 Guard at battle start before the first action begins.",{trigger:{kind:"battle_start"},target:"self",effect:{kind:"lose_guard",amount:5},oncePerRound:false},["guard"]),
  complication("rushed_finish","Rushed finish","This fighter gains 1 Strain when an enemy crosses below half HP, once each round.",{trigger:{kind:"enemy_below_health",ratio:0.5},target:"self",effect:{kind:"add_strain",amount:1},oncePerRound:true},["enemy_trigger"]),
  complication("solo_focus","Solo focus","This fighter's next attack must target the front enemy after an ally gains Guard.",{trigger:{kind:"after_ally_guarded"},target:"self",effect:{kind:"force_target",target:"front_enemy",uses:1,timing:"next_attack"},oncePerRound:true},["ally_trigger"]),
  complication("fragile_momentum","Fragile momentum","This fighter loses up to 4 Guard after a basic attack, once each round.",{trigger:{kind:"after_basic"},target:"self",effect:{kind:"lose_guard",amount:4},oncePerRound:true},["strike","guard"]),
  complication("costly_aid","Costly aid","This fighter gains 1 Strain after restoring an ally's HP, once each round.",{trigger:{kind:"after_heal"},target:"self",effect:{kind:"add_strain",amount:1},oncePerRound:true},["heal"]),
  complication("hesitant_rescue","Hesitant rescue","This fighter loses up to 5 Guard when an ally crosses below half HP, once each round.",{trigger:{kind:"ally_below_health",ratio:0.5},target:"self",effect:{kind:"lose_guard",amount:5},oncePerRound:true},["ally_trigger","guard"]),
  complication("shared_strain","Shared strain","This fighter gains 1 Strain after an ally gains Guard, once each round.",{trigger:{kind:"after_ally_guarded"},target:"self",effect:{kind:"add_strain",amount:1},oncePerRound:true},["ally_trigger"]),
  complication("low_reserve","Low reserve","This fighter loses up to 6 Guard at 3 Points before choosing an action.",{trigger:{kind:"at_points",points:3},target:"self",effect:{kind:"lose_guard",amount:6},oncePerRound:true},["focus","late"]),
];

const temperaments: readonly TemperamentDefinition[] = [
  {id:"careful",name:"Careful",rulesText:"This temperament waits for safer HP thresholds and favors rescue actions over concentrated attacks.",policy:{riskThreshold:60,spendAtPoints:3,rescueBias:2,focusFireBias:0}},
  {id:"steady",name:"Steady",rulesText:"This temperament uses techniques at ordinary thresholds and balances rescue against focused attacks.",policy:{riskThreshold:50,spendAtPoints:2,rescueBias:1,focusFireBias:1}},
  {id:"bold",name:"Bold",rulesText:"This temperament accepts lower HP margins and favors concentrated attacks over rescue actions.",policy:{riskThreshold:30,spendAtPoints:2,rescueBias:0,focusFireBias:2}},
  {id:"protective",name:"Protective",rulesText:"This temperament prioritizes injured allies and delays aggressive spending when rescue remains possible.",policy:{riskThreshold:50,spendAtPoints:3,rescueBias:2,focusFireBias:0}},
  {id:"patient",name:"Patient",rulesText:"This temperament waits for 3 Points and moderate risk before committing a technique.",policy:{riskThreshold:60,spendAtPoints:3,rescueBias:1,focusFireBias:1}},
  {id:"decisive",name:"Decisive",rulesText:"This temperament spends techniques early and strongly favors the weakest available enemy target.",policy:{riskThreshold:40,spendAtPoints:2,rescueBias:0,focusFireBias:2}},
];

const potentialTells = [
  {id:"power_early_a",text:"Training results show unusually fast early Power gains, with less certainty afterward.",growthIds:["early_power"],signals:["power"],certainty:"direction_only"},
  {id:"power_early_b",text:"Short drills improve attack output quickly, suggesting their strongest gains arrive early.",growthIds:["early_power"],signals:["power"],certainty:"direction_only"},
  {id:"guard_early_a",text:"Early pressure tests produce clear Guard gains before other stats begin moving.",growthIds:["early_guard"],signals:["guard"],certainty:"direction_only"},
  {id:"guard_early_b",text:"Defensive training pays off immediately, though later improvement remains less certain.",growthIds:["early_guard"],signals:["guard"],certainty:"direction_only"},
  {id:"steady_a",text:"Repeated tests show small gains across every stat without one clear spike.",growthIds:["steady_all"],signals:["vitality","power","guard","speed","focus"],certainty:"direction_only"},
  {id:"steady_b",text:"No single drill dominates, but progress remains consistent across the full training plan.",growthIds:["steady_all"],signals:["vitality","power","guard","speed","focus"],certainty:"direction_only"},
  {id:"speed_volatile_a",text:"Speed results jump between quiet sessions, pointing toward an uneven later surge.",growthIds:["volatile_speed"],signals:["speed"],certainty:"direction_only"},
  {id:"speed_volatile_b",text:"Timing drills alternate between stalls and breakthroughs, with Speed showing the clearest upside.",growthIds:["volatile_speed"],signals:["speed"],certainty:"direction_only"},
  {id:"focus_late_a",text:"Focus changes little now, but difficult exercises reveal strong unused capacity.",growthIds:["late_focus"],signals:["focus"],certainty:"direction_only"},
  {id:"focus_late_b",text:"Current Focus is ordinary, while advanced tests suggest a substantial late increase.",growthIds:["late_focus"],signals:["focus"],certainty:"direction_only"},
  {id:"vitality_specialist_a",text:"Endurance improves in every test, while offensive growth remains clearly secondary.",growthIds:["specialist_vitality"],signals:["vitality"],certainty:"direction_only"},
  {id:"vitality_specialist_b",text:"Recovery drills consistently favor Vitality, suggesting a narrow but dependable specialty.",growthIds:["specialist_vitality"],signals:["vitality"],certainty:"direction_only"},
] as const;

function technique(
  id: TechniqueDefinition["id"], name: string, rulesText: string,
  role: TechniqueDefinition["role"], cost: 2|3, target: TechniqueDefinition["target"],
  effects: TechniqueDefinition["effects"], tags: readonly CandidateTag[],
): TechniqueDefinition { return {id,name,rulesText,role,cost,target,effects,tags}; }

const techniques: readonly TechniqueDefinition[] = [
  technique("brace_self","Brace self","This technique grants up to 18 Guard to the user and costs 2 Points.","defence",2,"self",[{kind:"gain_guard",amount:18}],["guard","front"]),
  technique("cover_ally","Cover ally","This technique grants up to 12 Guard to the most injured ally and costs 2 Points.","defence",2,"most_injured_ally",[{kind:"gain_guard",amount:12}],["guard","rescue"]),
  technique("steady_hit","Steady hit","This technique adds 8 Power against the front enemy and costs 2 Points.","payoff",2,"front_enemy",[{kind:"bonus_power",amount:8,uses:1,timing:"immediate_technique_attack"}],["strike","front"]),
  technique("guard_pulse","Guard pulse","This technique grants up to 12 Guard, restores up to 6 HP, and costs 3 Points.","support",3,"self",[{kind:"gain_guard",amount:12},{kind:"heal",amount:6}],["guard","heal"]),
  technique("intercept_drill","Intercept drill","This technique grants up to 10 Guard to the most injured ally and costs 2 Points.","setup",2,"most_injured_ally",[{kind:"gain_guard",amount:10}],["rescue","ally_trigger"]),
  technique("front_check","Front check","This technique adds 10 Power against the front enemy and costs 3 Points.","payoff",3,"front_enemy",[{kind:"bonus_power",amount:10,uses:1,timing:"immediate_technique_attack"}],["strike","front"]),
  technique("quick_cut","Quick cut","This technique adds 7 Power against the front enemy and costs 2 Points.","setup",2,"front_enemy",[{kind:"bonus_power",amount:7,uses:1,timing:"immediate_technique_attack"}],["strike","early"]),
  technique("weak_point","Weak point","This technique adds 9 Power against the weakest enemy and costs 2 Points.","payoff",2,"lowest_health_enemy",[{kind:"bonus_power",amount:9,uses:1,timing:"immediate_technique_attack"}],["strike","enemy_trigger"]),
  technique("building_rhythm","Building rhythm","This technique returns up to 1 Point afterward and costs 2 Points.","setup",2,"self",[{kind:"gain_points",amount:1}],["focus","strike"]),
  technique("back_step","Back step","This technique grants up to 8 Guard before the next enemy action and costs 2 Points.","defence",2,"self",[{kind:"gain_guard",amount:8}],["guard","rear"]),
  technique("focused_strike","Focused strike","This technique adds 12 Power against the weakest enemy and costs 3 Points.","payoff",3,"lowest_health_enemy",[{kind:"bonus_power",amount:12,uses:1,timing:"immediate_technique_attack"}],["strike","focus"]),
  technique("finish_line","Finish line","This technique adds 10 Power against the weakest enemy and costs 3 Points.","payoff",3,"lowest_health_enemy",[{kind:"force_target",target:"lowest_health_enemy",uses:1,timing:"immediate_technique"},{kind:"bonus_power",amount:10,uses:1,timing:"immediate_technique_attack"}],["enemy_trigger","late"]),
  technique("first_aid","First aid","This technique restores up to 24 HP to the most injured ally and costs 2 Points.","support",2,"most_injured_ally",[{kind:"heal",amount:24}],["heal","ally_trigger"]),
  technique("shared_aid","Shared aid","This technique restores up to 16 HP, grants up to 6 Guard, and costs 3 Points.","support",3,"most_injured_ally",[{kind:"heal",amount:16},{kind:"gain_guard",amount:6}],["heal","guard"]),
  technique("focus_call","Focus call","This technique returns up to 1 Point afterward and costs 2 Points.","setup",2,"self",[{kind:"gain_points",amount:1}],["focus","early"]),
  technique("safe_cover","Safe cover","This technique grants up to 14 Guard to the most injured ally and costs 2 Points.","defence",2,"most_injured_ally",[{kind:"gain_guard",amount:14}],["guard","rescue"]),
  technique("recovery_step","Recovery step","This technique restores up to 12 HP, grants up to 6 Guard, and costs 2 Points.","defence",2,"self",[{kind:"heal",amount:12},{kind:"gain_guard",amount:6}],["heal","guard"]),
  technique("reserve_plan","Reserve plan","This technique restores up to 12 HP, returns up to 1 Point, and costs 3 Points.","setup",3,"self",[{kind:"heal",amount:12},{kind:"gain_points",amount:1}],["focus","late"]),
];

const loadouts: readonly TechniqueLoadoutDefinition[] = [
  {id:"guard_pair_a",techniqueIds:["brace_self","steady_hit"],roles:["defence","payoff"]},
  {id:"guard_pair_b",techniqueIds:["cover_ally","front_check"],roles:["defence","payoff"]},
  {id:"guard_pair_c",techniqueIds:["intercept_drill","guard_pulse"],roles:["setup","support"]},
  {id:"guard_pair_d",techniqueIds:["brace_self","intercept_drill"],roles:["defence","setup"]},
  {id:"fast_pair_a",techniqueIds:["quick_cut","weak_point"],roles:["setup","payoff"]},
  {id:"fast_pair_b",techniqueIds:["building_rhythm","focused_strike"],roles:["setup","payoff"]},
  {id:"fast_pair_c",techniqueIds:["back_step","finish_line"],roles:["defence","payoff"]},
  {id:"fast_pair_d",techniqueIds:["quick_cut","back_step"],roles:["setup","defence"]},
  {id:"support_pair_a",techniqueIds:["first_aid","focus_call"],roles:["support","setup"]},
  {id:"support_pair_b",techniqueIds:["shared_aid","safe_cover"],roles:["support","defence"]},
  {id:"support_pair_c",techniqueIds:["recovery_step","reserve_plan"],roles:["defence","setup"]},
  {id:"support_pair_d",techniqueIds:["focus_call","safe_cover"],roles:["setup","defence"]},
];

const identityNames = [
  "Ari","Bela","Caro","Deni","Eli","Fara","Galen","Hana","Ivo","Jori","Kato","Lina",
  "Mara","Niko","Oren","Pia","Quin","Rhea","Sami","Tala","Uma","Vero","Wren","Yara",
] as const;
const identities: readonly IdentityDefinition[] = IDENTITY_IDS.map((id, index) => ({
  id,
  displayName: identityNames[index] ?? id,
}));

const visualProfiles: readonly VisualProfileDefinition[] = [
  {id:"guard_light",silhouette:"light",paletteId:"clay-blue",poseId:"guard-open"},
  {id:"guard_medium",silhouette:"medium",paletteId:"clay-green",poseId:"guard-square"},
  {id:"guard_heavy",silhouette:"heavy",paletteId:"clay-red",poseId:"guard-wide"},
  {id:"fast_light",silhouette:"light",paletteId:"ember-blue",poseId:"fast-low"},
  {id:"fast_medium",silhouette:"medium",paletteId:"ember-green",poseId:"fast-ready"},
  {id:"fast_heavy",silhouette:"heavy",paletteId:"ember-red",poseId:"fast-forward"},
  {id:"support_light",silhouette:"light",paletteId:"reed-blue",poseId:"support-open"},
  {id:"support_medium",silhouette:"medium",paletteId:"reed-green",poseId:"support-ready"},
  {id:"support_heavy",silhouette:"heavy",paletteId:"reed-red",poseId:"support-wide"},
];

export const CANDIDATE_CONTENT: CandidateContent = Object.freeze(parseCandidateContent({
  chassis, growthCurves, signatures, advantages, complications, temperaments,
  potentialTells, techniques, loadouts, identities, visualProfiles,
}));

function recordById<T extends {readonly id:string}>(values: readonly T[]): Readonly<Record<string,T>> {
  return Object.freeze(Object.fromEntries(values.map((value) => [value.id, value])));
}

export const CANDIDATE_BY_ID = Object.freeze({
  chassis: recordById(CANDIDATE_CONTENT.chassis),
  growthCurves: recordById(CANDIDATE_CONTENT.growthCurves),
  signatures: recordById(CANDIDATE_CONTENT.signatures),
  advantages: recordById(CANDIDATE_CONTENT.advantages),
  complications: recordById(CANDIDATE_CONTENT.complications),
  temperaments: recordById(CANDIDATE_CONTENT.temperaments),
  potentialTells: recordById(CANDIDATE_CONTENT.potentialTells),
  techniques: recordById(CANDIDATE_CONTENT.techniques),
  loadouts: recordById(CANDIDATE_CONTENT.loadouts),
  identities: recordById(CANDIDATE_CONTENT.identities),
  visualProfiles: recordById(CANDIDATE_CONTENT.visualProfiles),
});

export const CANDIDATE_REGISTRY = CANDIDATE_CONTENT;
