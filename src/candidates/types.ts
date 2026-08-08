export const CANDIDATE_STAT_IDS = ["vitality", "power", "guard", "speed", "focus"] as const;
export type CandidateStatId = (typeof CANDIDATE_STAT_IDS)[number];

export const CHASSIS_IDS = ["guard_frame", "fast_frame", "support_frame"] as const;
export type ChassisId = (typeof CHASSIS_IDS)[number];

export const GROWTH_CURVE_IDS = [
  "early_power",
  "early_guard",
  "steady_all",
  "volatile_speed",
  "late_focus",
  "specialist_vitality",
] as const;
export type GrowthCurveId = (typeof GROWTH_CURVE_IDS)[number];
export type GrowthPattern = "early" | "steady" | "volatile" | "late" | "specialist";

export const SIGNATURE_IDS = [
  "guarded_focus",
  "brace_return",
  "rescue_power",
  "low_health_guard",
  "basic_momentum",
  "weak_target_focus",
  "ally_guard_momentum",
  "low_health_power",
  "healing_focus",
  "urgent_aid",
  "shared_cover",
  "patient_reserve",
] as const;
export type SignatureId = (typeof SIGNATURE_IDS)[number];

export const ADVANTAGE_IDS = [
  "firm_start",
  "guarded_recovery",
  "rescue_training",
  "steady_nerves",
  "quick_start",
  "clean_finish",
  "measured_combo",
  "opening_focus",
  "careful_aid",
  "shared_recovery",
  "calm_reserve",
  "protective_focus",
] as const;
export type AdvantageId = (typeof ADVANTAGE_IDS)[number];

export const COMPLICATION_IDS = [
  "slow_recovery",
  "guard_hungry",
  "late_commitment",
  "strained_rescue",
  "thin_guard",
  "rushed_finish",
  "solo_focus",
  "fragile_momentum",
  "costly_aid",
  "hesitant_rescue",
  "shared_strain",
  "low_reserve",
] as const;
export type ComplicationId = (typeof COMPLICATION_IDS)[number];

export const TEMPERAMENT_IDS = [
  "careful",
  "steady",
  "bold",
  "protective",
  "patient",
  "decisive",
] as const;
export type TemperamentId = (typeof TEMPERAMENT_IDS)[number];

export const POTENTIAL_TELL_IDS = [
  "power_early_a",
  "power_early_b",
  "guard_early_a",
  "guard_early_b",
  "steady_a",
  "steady_b",
  "speed_volatile_a",
  "speed_volatile_b",
  "focus_late_a",
  "focus_late_b",
  "vitality_specialist_a",
  "vitality_specialist_b",
] as const;
export type PotentialTellId = (typeof POTENTIAL_TELL_IDS)[number];

export const TECHNIQUE_IDS = [
  "brace_self",
  "cover_ally",
  "steady_hit",
  "guard_pulse",
  "intercept_drill",
  "front_check",
  "quick_cut",
  "weak_point",
  "building_rhythm",
  "back_step",
  "focused_strike",
  "finish_line",
  "first_aid",
  "shared_aid",
  "focus_call",
  "safe_cover",
  "recovery_step",
  "reserve_plan",
] as const;
export type TechniqueId = (typeof TECHNIQUE_IDS)[number];

export const TECHNIQUE_LOADOUT_IDS = [
  "guard_pair_a",
  "guard_pair_b",
  "guard_pair_c",
  "guard_pair_d",
  "fast_pair_a",
  "fast_pair_b",
  "fast_pair_c",
  "fast_pair_d",
  "support_pair_a",
  "support_pair_b",
  "support_pair_c",
  "support_pair_d",
] as const;
export type TechniqueLoadoutId = (typeof TECHNIQUE_LOADOUT_IDS)[number];

export const IDENTITY_IDS = [
  "identity_01", "identity_02", "identity_03", "identity_04", "identity_05", "identity_06",
  "identity_07", "identity_08", "identity_09", "identity_10", "identity_11", "identity_12",
  "identity_13", "identity_14", "identity_15", "identity_16", "identity_17", "identity_18",
  "identity_19", "identity_20", "identity_21", "identity_22", "identity_23", "identity_24",
] as const;
export type IdentityId = (typeof IDENTITY_IDS)[number];

export const VISUAL_PROFILE_IDS = [
  "guard_light", "guard_medium", "guard_heavy",
  "fast_light", "fast_medium", "fast_heavy",
  "support_light", "support_medium", "support_heavy",
] as const;
export type VisualProfileId = (typeof VISUAL_PROFILE_IDS)[number];

export const CANDIDATE_TAGS = [
  "front", "rear", "guard", "strike", "heal", "rescue", "focus", "low_health",
  "ally_trigger", "enemy_trigger", "early", "late",
] as const;
export type CandidateTag = (typeof CANDIDATE_TAGS)[number];

export const TECHNIQUE_ROLES = ["setup", "payoff", "defence", "support"] as const;
export type TechniqueRole = (typeof TECHNIQUE_ROLES)[number];

export interface CandidateStats {
  readonly vitality: number;
  readonly power: number;
  readonly guard: number;
  readonly speed: number;
  readonly focus: number;
}

export type RuleTrigger =
  | { readonly kind: "battle_start" }
  | { readonly kind: "after_basic" }
  | { readonly kind: "after_ally_guarded" }
  | { readonly kind: "after_self_guarded" }
  | { readonly kind: "after_heal" }
  | { readonly kind: "after_intercept" }
  | { readonly kind: "self_below_health"; readonly ratio: 0.3 | 0.5 | 0.6 }
  | { readonly kind: "ally_below_health"; readonly ratio: 0.3 | 0.5 }
  | { readonly kind: "enemy_below_health"; readonly ratio: 0.3 | 0.5 }
  | { readonly kind: "at_points"; readonly points: 2 | 3 };

export type RuleTarget =
  | "self"
  | "front_enemy"
  | "lowest_health_enemy"
  | "most_injured_ally"
  | "triggering_ally";

export type RuleEffect =
  | { readonly kind: "gain_guard"; readonly amount: number }
  | { readonly kind: "gain_points"; readonly amount: 1 }
  | {
      readonly kind: "bonus_power";
      readonly amount: number;
      readonly uses: 1;
      readonly timing: "immediate_technique_attack" | "next_attack" | "next_technique";
    }
  | { readonly kind: "heal"; readonly amount: number }
  | { readonly kind: "add_strain"; readonly amount: 1 }
  | { readonly kind: "lose_guard"; readonly amount: number }
  | {
      readonly kind: "force_target";
      readonly target: "front_enemy" | "lowest_health_enemy";
      readonly uses: 1;
      readonly timing: "immediate_technique" | "next_attack";
    };

export interface MechanicalRule {
  readonly trigger: RuleTrigger;
  readonly target: RuleTarget;
  readonly effect: RuleEffect;
  readonly oncePerRound: boolean;
}

export interface ChassisDefinition {
  readonly id: ChassisId;
  readonly name: string;
  readonly rulesText: string;
  readonly baseStats: CandidateStats;
  readonly tags: readonly CandidateTag[];
  readonly techniqueRoles: readonly TechniqueRole[];
}

export interface GrowthCurveDefinition {
  readonly id: GrowthCurveId;
  readonly name: string;
  readonly rulesText: string;
  readonly earlyDelta: CandidateStats;
  readonly lateDelta: CandidateStats;
  readonly pattern: GrowthPattern;
}

export interface SignatureDefinition {
  readonly id: SignatureId;
  readonly name: string;
  readonly rulesText: string;
  readonly rule: MechanicalRule;
  readonly tags: readonly CandidateTag[];
}

export interface AdvantageDefinition {
  readonly id: AdvantageId;
  readonly name: string;
  readonly rulesText: string;
  readonly rule: MechanicalRule;
  readonly tags: readonly CandidateTag[];
}

export interface ComplicationDefinition {
  readonly id: ComplicationId;
  readonly name: string;
  readonly rulesText: string;
  readonly rule: MechanicalRule;
  readonly tags: readonly CandidateTag[];
}

export interface TemperamentDefinition {
  readonly id: TemperamentId;
  readonly name: string;
  readonly rulesText: string;
  readonly policy: {
    readonly riskThreshold: 30 | 40 | 50 | 60;
    readonly spendAtPoints: 2 | 3;
    readonly rescueBias: 0 | 1 | 2;
    readonly focusFireBias: 0 | 1 | 2;
  };
}

export interface PotentialTellDefinition {
  readonly id: PotentialTellId;
  readonly text: string;
  readonly growthIds: readonly GrowthCurveId[];
  readonly signals: readonly [CandidateStatId, ...CandidateStatId[]];
  readonly certainty: "direction_only";
}

export interface TechniqueDefinition {
  readonly id: TechniqueId;
  readonly name: string;
  readonly rulesText: string;
  readonly role: TechniqueRole;
  readonly cost: 2 | 3;
  readonly target: RuleTarget;
  readonly effects: readonly [RuleEffect] | readonly [RuleEffect, RuleEffect];
  readonly tags: readonly CandidateTag[];
}

export interface TechniqueLoadoutDefinition {
  readonly id: TechniqueLoadoutId;
  readonly techniqueIds: readonly [TechniqueId, TechniqueId];
  readonly roles: readonly [TechniqueRole, TechniqueRole];
}

export interface IdentityDefinition {
  readonly id: IdentityId;
  readonly displayName: string;
}

export interface VisualProfileDefinition {
  readonly id: VisualProfileId;
  readonly silhouette: "light" | "medium" | "heavy";
  readonly paletteId: string;
  readonly poseId: string;
}

export interface CandidateContent {
  readonly chassis: readonly ChassisDefinition[];
  readonly growthCurves: readonly GrowthCurveDefinition[];
  readonly signatures: readonly SignatureDefinition[];
  readonly advantages: readonly AdvantageDefinition[];
  readonly complications: readonly ComplicationDefinition[];
  readonly temperaments: readonly TemperamentDefinition[];
  readonly potentialTells: readonly PotentialTellDefinition[];
  readonly techniques: readonly TechniqueDefinition[];
  readonly loadouts: readonly TechniqueLoadoutDefinition[];
  readonly identities: readonly IdentityDefinition[];
  readonly visualProfiles: readonly VisualProfileDefinition[];
}

export interface GeneratedIdentity {
  readonly identityId: IdentityId;
  readonly displayName: string;
}

export type SemanticDimensions = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export interface SemanticFingerprint {
  readonly version: 1;
  readonly key: string;
  readonly hash: string;
  readonly dimensions: SemanticDimensions;
}

export interface CandidateDraft {
  readonly version: 1;
  readonly status: "lab_only_not_fieldable";
  readonly candidateId: string;
  readonly identity: GeneratedIdentity;
  readonly visualProfileId: VisualProfileId;
  readonly chassisId: ChassisId;
  readonly stats: CandidateStats;
  readonly growthCurveId: GrowthCurveId;
  readonly signatureId: SignatureId;
  readonly advantageId: AdvantageId;
  readonly complicationId: ComplicationId;
  readonly temperamentId: TemperamentId;
  readonly potentialTellId: PotentialTellId;
  readonly techniqueIds: readonly [TechniqueId, TechniqueId];
  readonly techniqueLoadoutId: TechniqueLoadoutId;
  readonly semanticFingerprint: SemanticFingerprint;
}

export interface DraftRosterCommand {
  readonly type: "draft_candidate_roster";
  readonly version: 1;
  readonly poolVersion: 1;
  readonly seed: string;
  readonly count: 3;
}

export type DraftRosterResult =
  | {
      readonly status: "ok";
      readonly version: 1;
      readonly command: DraftRosterCommand;
      readonly rosterId: string;
      readonly candidates: readonly [CandidateDraft, CandidateDraft, CandidateDraft];
      readonly attemptsBySlot: readonly [number, number, number];
      readonly rejectedAttempts: number;
    }
  | {
      readonly status: "generation_failed";
      readonly version: 1;
      readonly command: DraftRosterCommand;
      readonly rosterId: string;
      readonly failedSlot: 0 | 1 | 2;
      readonly attempts: number;
      readonly reason: "attempt_limit";
    };
