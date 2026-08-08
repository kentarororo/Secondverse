import { CANDIDATE_BY_ID, CANDIDATE_CONTENT } from "./content";
import { mechanicalRuleKey } from "./fingerprint";
import type {
  AdvantageId,
  CandidateDraft,
  ChassisId,
  ComplicationId,
  GrowthCurveId,
  PotentialTellId,
  SignatureId,
  TechniqueLoadoutId,
  TemperamentId,
  VisualProfileId,
} from "./types";

export interface CandidateCompatibility {
  readonly growthByChassis: Readonly<Record<ChassisId, readonly GrowthCurveId[]>>;
  readonly signaturesByChassis: Readonly<Record<ChassisId, readonly SignatureId[]>>;
  readonly advantagesBySignature: Readonly<Record<SignatureId, readonly AdvantageId[]>>;
  readonly complicationsByAdvantage: Readonly<Record<AdvantageId, readonly ComplicationId[]>>;
  readonly temperamentsBySignature: Readonly<Record<SignatureId, readonly TemperamentId[]>>;
  readonly loadoutsByChassisSignature: Readonly<Record<CompatibleChassisSignatureKey, readonly TechniqueLoadoutId[]>>;
  readonly tellsByGrowth: Readonly<Record<GrowthCurveId, readonly PotentialTellId[]>>;
  readonly visualsByChassis: Readonly<Record<ChassisId, readonly VisualProfileId[]>>;
  readonly forbiddenAdvantageComplicationPairs: readonly `${AdvantageId}:${ComplicationId}`[];
}

export type CompatibleChassisSignatureKey =
  | `guard_frame:${"guarded_focus"|"brace_return"|"rescue_power"|"low_health_guard"}`
  | `fast_frame:${"basic_momentum"|"weak_target_focus"|"ally_guard_momentum"|"low_health_power"}`
  | `support_frame:${"healing_focus"|"urgent_aid"|"shared_cover"|"patient_reserve"}`;

const guardAdvantages = ["firm_start","guarded_recovery","rescue_training","steady_nerves"] as const;
const fastAdvantages = ["quick_start","clean_finish","measured_combo","opening_focus"] as const;
const supportAdvantages = ["careful_aid","shared_recovery","calm_reserve","protective_focus"] as const;
const ordinaryTemperaments = ["careful","steady","bold","protective","patient","decisive"] as const;

const candidateCompatibility = {
  growthByChassis: {
    guard_frame:["early_guard","steady_all","specialist_vitality"],
    fast_frame:["early_power","steady_all","volatile_speed"],
    support_frame:["steady_all","late_focus","specialist_vitality"],
  },
  signaturesByChassis: {
    guard_frame:["guarded_focus","brace_return","rescue_power","low_health_guard"],
    fast_frame:["basic_momentum","weak_target_focus","ally_guard_momentum","low_health_power"],
    support_frame:["healing_focus","urgent_aid","shared_cover","patient_reserve"],
  },
  advantagesBySignature: {
    guarded_focus:guardAdvantages, brace_return:guardAdvantages,
    rescue_power:guardAdvantages, low_health_guard:guardAdvantages,
    basic_momentum:fastAdvantages, weak_target_focus:fastAdvantages,
    ally_guard_momentum:fastAdvantages, low_health_power:fastAdvantages,
    healing_focus:supportAdvantages, urgent_aid:supportAdvantages,
    shared_cover:supportAdvantages, patient_reserve:supportAdvantages,
  },
  complicationsByAdvantage: {
    firm_start:["slow_recovery","guard_hungry","late_commitment","strained_rescue"],
    guarded_recovery:["guard_hungry","late_commitment","strained_rescue","thin_guard"],
    rescue_training:["slow_recovery","guard_hungry","late_commitment","thin_guard"],
    steady_nerves:["slow_recovery","late_commitment","strained_rescue","thin_guard"],
    quick_start:["rushed_finish","solo_focus","fragile_momentum","late_commitment"],
    clean_finish:["thin_guard","solo_focus","fragile_momentum","slow_recovery"],
    measured_combo:["thin_guard","rushed_finish","solo_focus","late_commitment"],
    opening_focus:["rushed_finish","solo_focus","fragile_momentum","slow_recovery"],
    careful_aid:["costly_aid","hesitant_rescue","shared_strain","low_reserve"],
    shared_recovery:["costly_aid","hesitant_rescue","low_reserve","thin_guard"],
    calm_reserve:["costly_aid","hesitant_rescue","shared_strain","thin_guard"],
    protective_focus:["costly_aid","shared_strain","low_reserve","thin_guard"],
  },
  temperamentsBySignature: {
    guarded_focus:ordinaryTemperaments, brace_return:ordinaryTemperaments,
    rescue_power:ordinaryTemperaments, low_health_guard:ordinaryTemperaments,
    basic_momentum:ordinaryTemperaments, weak_target_focus:ordinaryTemperaments,
    ally_guard_momentum:ordinaryTemperaments, low_health_power:ordinaryTemperaments,
    healing_focus:ordinaryTemperaments, urgent_aid:ordinaryTemperaments,
    shared_cover:ordinaryTemperaments, patient_reserve:["careful","protective","patient"],
  },
  loadoutsByChassisSignature: {
    "guard_frame:guarded_focus":["guard_pair_a","guard_pair_c","guard_pair_d"],
    "guard_frame:brace_return":["guard_pair_a","guard_pair_b","guard_pair_c"],
    "guard_frame:rescue_power":["guard_pair_b","guard_pair_c","guard_pair_d"],
    "guard_frame:low_health_guard":["guard_pair_a","guard_pair_b","guard_pair_d"],
    "fast_frame:basic_momentum":["fast_pair_a","fast_pair_b","fast_pair_d"],
    "fast_frame:weak_target_focus":["fast_pair_a","fast_pair_c","fast_pair_d"],
    "fast_frame:ally_guard_momentum":["fast_pair_b","fast_pair_c","fast_pair_d"],
    "fast_frame:low_health_power":["fast_pair_a","fast_pair_b","fast_pair_c"],
    "support_frame:healing_focus":["support_pair_a","support_pair_c","support_pair_d"],
    "support_frame:urgent_aid":["support_pair_a","support_pair_b","support_pair_c"],
    "support_frame:shared_cover":["support_pair_a","support_pair_b","support_pair_d"],
    "support_frame:patient_reserve":["support_pair_b","support_pair_c","support_pair_d"],
  },
  tellsByGrowth: {
    early_power:["power_early_a","power_early_b"],
    early_guard:["guard_early_a","guard_early_b"],
    steady_all:["steady_a","steady_b"],
    volatile_speed:["speed_volatile_a","speed_volatile_b"],
    late_focus:["focus_late_a","focus_late_b"],
    specialist_vitality:["vitality_specialist_a","vitality_specialist_b"],
  },
  visualsByChassis: {
    guard_frame:["guard_light","guard_medium","guard_heavy"],
    fast_frame:["fast_light","fast_medium","fast_heavy"],
    support_frame:["support_light","support_medium","support_heavy"],
  },
  forbiddenAdvantageComplicationPairs: [
    "firm_start:thin_guard",
    "guarded_recovery:slow_recovery",
    "rescue_training:strained_rescue",
    "quick_start:late_commitment",
    "careful_aid:costly_aid",
    "calm_reserve:low_reserve",
  ],
} as const satisfies CandidateCompatibility;

export const CANDIDATE_COMPATIBILITY: CandidateCompatibility = candidateCompatibility;

function includes<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

function strongestLateStats(growthId: GrowthCurveId): readonly string[] {
  const growth = CANDIDATE_BY_ID.growthCurves[growthId];
  if (!growth) return [];
  const entries = Object.entries(growth.lateDelta);
  const maximum = Math.max(...entries.map(([, amount]) => amount));
  return entries.filter(([, amount]) => amount === maximum).map(([stat]) => stat);
}

function effectAxis(kind: string): string {
  if (kind === "gain_guard" || kind === "lose_guard") return "guard";
  return kind;
}

export function validateCandidateCompatibility(candidate: CandidateDraft): readonly string[] {
  const issues: string[] = [];
  const chassis = CANDIDATE_BY_ID.chassis[candidate.chassisId];
  const growth = CANDIDATE_BY_ID.growthCurves[candidate.growthCurveId];
  const signature = CANDIDATE_BY_ID.signatures[candidate.signatureId];
  const advantage = CANDIDATE_BY_ID.advantages[candidate.advantageId];
  const complication = CANDIDATE_BY_ID.complications[candidate.complicationId];
  const temperament = CANDIDATE_BY_ID.temperaments[candidate.temperamentId];
  const tell = CANDIDATE_BY_ID.potentialTells[candidate.potentialTellId];
  const loadout = CANDIDATE_BY_ID.loadouts[candidate.techniqueLoadoutId];
  const visual = CANDIDATE_BY_ID.visualProfiles[candidate.visualProfileId];
  const identity = CANDIDATE_BY_ID.identities[candidate.identity.identityId];
  const techniques = candidate.techniqueIds.map((id) => CANDIDATE_BY_ID.techniques[id]);

  if (!chassis || !growth || !signature || !advantage || !complication || !temperament || !tell || !loadout || !visual || !identity || techniques.some((value) => !value)) {
    return ["Candidate references missing content"];
  }
  if (!includes(CANDIDATE_COMPATIBILITY.growthByChassis[candidate.chassisId], candidate.growthCurveId)) issues.push("Growth is not compatible with chassis");
  if (!includes(CANDIDATE_COMPATIBILITY.signaturesByChassis[candidate.chassisId], candidate.signatureId)) issues.push("Signature is not compatible with chassis");
  if (!includes(CANDIDATE_COMPATIBILITY.advantagesBySignature[candidate.signatureId], candidate.advantageId)) issues.push("Advantage is not compatible with signature");
  if (!includes(CANDIDATE_COMPATIBILITY.complicationsByAdvantage[candidate.advantageId], candidate.complicationId)) issues.push("Complication is not compatible with advantage");
  if (!includes(CANDIDATE_COMPATIBILITY.temperamentsBySignature[candidate.signatureId], candidate.temperamentId)) issues.push("Temperament is not compatible with signature");
  const loadoutKey = `${candidate.chassisId}:${candidate.signatureId}`;
  const compatibleLoadouts = CANDIDATE_COMPATIBILITY.loadoutsByChassisSignature[loadoutKey as CompatibleChassisSignatureKey];
  if (!compatibleLoadouts || !includes(compatibleLoadouts, candidate.techniqueLoadoutId)) issues.push("Loadout is not compatible with chassis and signature");
  if (!includes(CANDIDATE_COMPATIBILITY.tellsByGrowth[candidate.growthCurveId], candidate.potentialTellId)) issues.push("Potential tell does not match growth");
  if (!includes(CANDIDATE_COMPATIBILITY.visualsByChassis[candidate.chassisId], candidate.visualProfileId)) issues.push("Visual profile does not match chassis");
  if (candidate.identity.displayName !== identity.displayName) issues.push("Generated identity does not match its stable ID");
  if (candidate.stats.vitality !== chassis.baseStats.vitality || candidate.stats.power !== chassis.baseStats.power || candidate.stats.guard !== chassis.baseStats.guard || candidate.stats.speed !== chassis.baseStats.speed || candidate.stats.focus !== chassis.baseStats.focus) issues.push("Candidate stats do not match chassis");
  if (candidate.techniqueIds[0] !== loadout.techniqueIds[0] || candidate.techniqueIds[1] !== loadout.techniqueIds[1]) issues.push("Technique pair does not match loadout");
  if (loadout.roles[0] === loadout.roles[1]) issues.push("Loadout roles must differ");
  if (techniques[0]?.role !== loadout.roles[0] || techniques[1]?.role !== loadout.roles[1]) issues.push("Loadout role facts do not match techniques");

  const availableTags = new Set([...chassis.tags, ...techniques.flatMap((value) => value?.tags ?? [])]);
  if (!signature.tags.some((tag) => availableTags.has(tag))) issues.push("Signature has no reachable chassis or technique tag");
  if (signature.rule.trigger.kind === "at_points" && temperament.policy.spendAtPoints < signature.rule.trigger.points) issues.push("Temperament spends before signature threshold");
  const strongest = strongestLateStats(candidate.growthCurveId);
  if (!tell.signals.every((stat) => strongest.includes(stat))) issues.push("Potential tell does not signal strongest late growth");
  if (!tell.growthIds.includes(candidate.growthCurveId)) issues.push("Potential tell omits actual growth ID");
  const pair = `${candidate.advantageId}:${candidate.complicationId}` as const;
  if ((CANDIDATE_COMPATIBILITY.forbiddenAdvantageComplicationPairs as readonly string[]).includes(pair)) issues.push("Advantage and complication pair is forbidden");
  if (
    advantage.rule.trigger.kind === complication.rule.trigger.kind &&
    advantage.rule.target === complication.rule.target &&
    effectAxis(advantage.rule.effect.kind) === effectAxis(complication.rule.effect.kind)
  ) issues.push("Advantage and complication cancel the same rule axis");
  return issues;
}

export function validateCandidateDomainContent(): readonly string[] {
  const issues: string[] = [];
  const ids = <T extends {readonly id:string}>(values: readonly T[]) => new Set(values.map((value) => value.id));
  const contentIds = {
    growth: ids(CANDIDATE_CONTENT.growthCurves), signatures: ids(CANDIDATE_CONTENT.signatures),
    advantages: ids(CANDIDATE_CONTENT.advantages), complications: ids(CANDIDATE_CONTENT.complications),
    temperaments: ids(CANDIDATE_CONTENT.temperaments), tells: ids(CANDIDATE_CONTENT.potentialTells),
    loadouts: ids(CANDIDATE_CONTENT.loadouts), visuals: ids(CANDIDATE_CONTENT.visualProfiles),
    techniques: ids(CANDIDATE_CONTENT.techniques),
  };
  for (const chassis of CANDIDATE_CONTENT.chassis) {
    if (CANDIDATE_COMPATIBILITY.growthByChassis[chassis.id].length < 2) issues.push(`${chassis.id} needs two growth curves`);
    if (CANDIDATE_COMPATIBILITY.signaturesByChassis[chassis.id].length < 4) issues.push(`${chassis.id} needs four signatures`);
    if (CANDIDATE_COMPATIBILITY.visualsByChassis[chassis.id].length < 3) issues.push(`${chassis.id} needs three visuals`);
    for (const id of CANDIDATE_COMPATIBILITY.growthByChassis[chassis.id]) if (!contentIds.growth.has(id)) issues.push(`Missing growth ${id}`);
    for (const id of CANDIDATE_COMPATIBILITY.signaturesByChassis[chassis.id]) if (!contentIds.signatures.has(id)) issues.push(`Missing signature ${id}`);
    for (const id of CANDIDATE_COMPATIBILITY.visualsByChassis[chassis.id]) if (!contentIds.visuals.has(id)) issues.push(`Missing visual ${id}`);
  }
  for (const signature of CANDIDATE_CONTENT.signatures) {
    if (CANDIDATE_COMPATIBILITY.advantagesBySignature[signature.id].length < 4) issues.push(`${signature.id} needs four advantages`);
    if (CANDIDATE_COMPATIBILITY.temperamentsBySignature[signature.id].length < 3) issues.push(`${signature.id} needs three temperaments`);
    for (const id of CANDIDATE_COMPATIBILITY.advantagesBySignature[signature.id]) if (!contentIds.advantages.has(id)) issues.push(`Missing advantage ${id}`);
    for (const id of CANDIDATE_COMPATIBILITY.temperamentsBySignature[signature.id]) if (!contentIds.temperaments.has(id)) issues.push(`Missing temperament ${id}`);
  }
  for (const advantage of CANDIDATE_CONTENT.advantages) {
    if (CANDIDATE_COMPATIBILITY.complicationsByAdvantage[advantage.id].length < 4) issues.push(`${advantage.id} needs four complications`);
    for (const id of CANDIDATE_COMPATIBILITY.complicationsByAdvantage[advantage.id]) if (!contentIds.complications.has(id)) issues.push(`Missing complication ${id}`);
  }
  for (const growth of CANDIDATE_CONTENT.growthCurves) {
    if (CANDIDATE_COMPATIBILITY.tellsByGrowth[growth.id].length < 2) issues.push(`${growth.id} needs two tells`);
    for (const id of CANDIDATE_COMPATIBILITY.tellsByGrowth[growth.id]) if (!contentIds.tells.has(id)) issues.push(`Missing tell ${id}`);
  }
  for (const [key, loadoutIds] of Object.entries(CANDIDATE_COMPATIBILITY.loadoutsByChassisSignature)) {
    if (loadoutIds.length < 2) issues.push(`${key} needs two loadouts`);
    for (const id of loadoutIds) if (!contentIds.loadouts.has(id)) issues.push(`Missing loadout ${id}`);
  }
  for (const loadout of CANDIDATE_CONTENT.loadouts) {
    for (const id of loadout.techniqueIds) if (!contentIds.techniques.has(id)) issues.push(`Missing technique ${id}`);
  }
  return issues;
}

const domainIssues = validateCandidateDomainContent();
if (domainIssues.length > 0) {
  throw new Error(`Invalid candidate domain content: ${domainIssues.join("; ")}`);
}

export function candidateCompatibilitySummary(candidate: CandidateDraft): string {
  return `${candidate.chassisId}|${mechanicalRuleKey(CANDIDATE_BY_ID.signatures[candidate.signatureId]!.rule)}|${candidate.techniqueLoadoutId}`;
}
