import type {
  CandidateDraft,
  ComplicationId,
  DraftRosterCommand,
  RuleEffect,
  RuleTrigger,
  SignatureId,
  AdvantageId,
  TechniqueId,
} from "../candidates/types";

export const CANDIDATE_TRIAL_SCENARIO_IDS = ["three_person_training_v1"] as const;
export type CandidateTrialScenarioId = (typeof CANDIDATE_TRIAL_SCENARIO_IDS)[number];

export const TRAINING_ALLY_IDS = ["training_guard", "training_striker"] as const;
export type TrainingAllyId = (typeof TRAINING_ALLY_IDS)[number];
export const TRIAL_ENEMY_IDS = ["training_bulwark", "training_raider", "training_harrier"] as const;
export type TrialEnemyId = (typeof TRIAL_ENEMY_IDS)[number];
export type CandidateTrialUnitId = CandidateDraft["candidateId"] | TrainingAllyId | TrialEnemyId;
export type CandidateTrialSide = "candidate_team" | "training_enemies";
export type CandidateTrialSlot = "front" | "middle" | "rear";
export type CandidateTrialActionId = "basic" | "guard_partner" | TechniqueId;

export interface StartCandidateTrialCommand {
  readonly type: "start_candidate_trial";
  readonly version: 1;
  readonly scenarioId: CandidateTrialScenarioId;
  readonly battleSeed: string;
  readonly draftCommand: DraftRosterCommand;
  readonly candidateId: string;
}

export interface CandidateCombatProfileFormulaFacts {
  readonly version: 1;
  readonly maxHealth: "vitality * 8";
  readonly power: "power";
  readonly defence: "floor(guard / 2)";
  readonly speed: "speed";
  readonly guardCap: "guard * 2";
  readonly startingTechniquePoints: "1 when focus >= 14, otherwise 0";
  readonly growthApplied: false;
}

export interface CandidateCombatProfile {
  readonly version: 1;
  readonly candidateId: string;
  readonly maxHealth: number;
  readonly power: number;
  readonly defence: number;
  readonly speed: number;
  readonly guardCap: number;
  readonly startingTechniquePoints: 0 | 1;
  readonly formulaFacts: CandidateCombatProfileFormulaFacts;
}

interface TrialEventBase {
  readonly eventId: string;
  readonly sequence: number;
  readonly round: number;
}

export interface TrialStartedEvent extends TrialEventBase {
  readonly kind: "trial_started";
  readonly scenarioId: CandidateTrialScenarioId;
  readonly battleSeed: string;
  readonly candidateId: string;
  readonly candidateFingerprintHash: string;
  readonly profile: CandidateCombatProfile;
}

export interface TrialRoundStartedEvent extends TrialEventBase {
  readonly kind: "round_started";
  readonly order: readonly CandidateTrialUnitId[];
}

export type TrialActionReason =
  | "always_available"
  | "not_enough_points"
  | "temperament_waiting"
  | "technique_ready"
  | "no_living_target"
  | "no_injured_ally"
  | "fixed_training_policy";

export interface TrialActionOption {
  readonly actionId: CandidateTrialActionId;
  readonly legal: boolean;
  readonly score: number;
  readonly reasons: readonly TrialActionReason[];
}

export interface TrialActionOptionsEvent extends TrialEventBase {
  readonly kind: "action_options";
  readonly actorId: CandidateTrialUnitId;
  readonly options: readonly TrialActionOption[];
}

export interface TrialIntentShownEvent extends TrialEventBase {
  readonly kind: "intent_shown";
  readonly actorId: CandidateTrialUnitId;
  readonly actionId: CandidateTrialActionId;
  readonly targetIds: readonly CandidateTrialUnitId[];
  readonly reason: "basic_target" | "technique_policy" | "fixed_training_policy";
}

export interface TrialActionStartedEvent extends TrialEventBase {
  readonly kind: "action_started";
  readonly causedByEventId: string;
  readonly actorId: CandidateTrialUnitId;
  readonly actionId: CandidateTrialActionId;
  readonly targetIds: readonly CandidateTrialUnitId[];
}

export interface TrialTechniqueUsedEvent extends TrialEventBase {
  readonly kind: "technique_used";
  readonly causedByEventId: string;
  readonly candidateId: string;
  readonly techniqueId: TechniqueId;
  readonly targetIds: readonly CandidateTrialUnitId[];
  readonly cost: 2 | 3;
}

export type CandidateRuleSource =
  | { readonly sourceKind: "signature"; readonly sourceId: SignatureId }
  | { readonly sourceKind: "advantage"; readonly sourceId: AdvantageId }
  | { readonly sourceKind: "risk"; readonly sourceId: ComplicationId };

export interface CandidateRuleTriggeredEvent extends TrialEventBase {
  readonly kind: "candidate_rule_triggered";
  readonly causedByEventId: string;
  readonly candidateId: string;
  readonly source: CandidateRuleSource;
  readonly trigger: RuleTrigger;
  readonly effect: RuleEffect;
  readonly targetId: CandidateTrialUnitId;
}

export interface TrialInterceptedEvent extends TrialEventBase {
  readonly kind: "intercepted";
  readonly causedByEventId: string;
  readonly candidateId: string;
  readonly protectedAllyId: TrainingAllyId;
  readonly attackerId: TrialEnemyId;
  readonly riskThreshold: 30 | 40 | 50 | 60;
}

interface NumericMutation {
  readonly before: number;
  readonly requested: number;
  readonly applied: number;
  readonly after: number;
  readonly cap: number;
}

export interface TrialGuardChangedEvent extends TrialEventBase, NumericMutation {
  readonly kind: "guard_changed";
  readonly causedByEventId: string;
  readonly actorId: CandidateTrialUnitId;
  readonly targetId: CandidateTrialUnitId;
  readonly reason: "technique" | "candidate_rule" | "training_policy" | "damage" | "break";
}

export interface TrialHealthChangedEvent extends TrialEventBase, NumericMutation {
  readonly kind: "health_changed";
  readonly causedByEventId: string;
  readonly actorId: CandidateTrialUnitId;
  readonly targetId: CandidateTrialUnitId;
  readonly reason: "technique_heal" | "candidate_rule_heal";
}

export interface TrialPointsChangedEvent extends TrialEventBase, NumericMutation {
  readonly kind: "points_changed";
  readonly causedByEventId: string;
  readonly candidateId: string;
  readonly reason: "basic_gain" | "technique_cost" | "candidate_rule" | "technique_effect";
}

export interface TrialStrainChangedEvent extends TrialEventBase, NumericMutation {
  readonly kind: "strain_changed";
  readonly causedByEventId: string;
  readonly candidateId: string;
  readonly reason: "candidate_risk";
}

export interface TrialPendingBonusChangedEvent extends TrialEventBase, NumericMutation {
  readonly kind: "pending_bonus_changed";
  readonly causedByEventId: string;
  readonly candidateId: string;
  readonly timing: "next_attack" | "next_technique";
  readonly reason: "candidate_rule" | "consumed";
}

export interface TrialPendingTargetChangedEvent extends TrialEventBase {
  readonly kind: "pending_target_changed";
  readonly causedByEventId: string;
  readonly candidateId: string;
  readonly before: "front_enemy" | "lowest_health_enemy" | null;
  readonly requested: "front_enemy" | "lowest_health_enemy" | null;
  readonly applied: boolean;
  readonly after: "front_enemy" | "lowest_health_enemy" | null;
  readonly cap: 1;
  readonly reason: "candidate_rule" | "consumed";
}

export interface TrialDamageAppliedEvent extends TrialEventBase {
  readonly kind: "damage_applied";
  readonly causedByEventId: string;
  readonly actorId: CandidateTrialUnitId;
  readonly targetId: CandidateTrialUnitId;
  readonly actionId: CandidateTrialActionId;
  readonly inputPower: number;
  readonly actionPower: number;
  readonly variance: number;
  readonly defence: number;
  readonly requestedDamage: number;
  readonly guardBefore: number;
  readonly requestedGuardAbsorption: number;
  readonly appliedGuardAbsorption: number;
  readonly guardAfter: number;
  readonly guardCap: number;
  readonly healthBefore: number;
  readonly requestedHealthLoss: number;
  readonly appliedHealthLoss: number;
  readonly healthAfter: number;
  readonly healthCap: number;
}

export interface TrialTargetChangedEvent extends TrialEventBase {
  readonly kind: "target_changed";
  readonly causedByEventId: string;
  readonly actorId: CandidateTrialUnitId;
  readonly fromTargetId: CandidateTrialUnitId;
  readonly toTargetId: CandidateTrialUnitId;
  readonly reason: "candidate_intercept" | "forced_front" | "forced_weakest";
}

export interface TrialBreakAppliedEvent extends TrialEventBase {
  readonly kind: "break_applied";
  readonly causedByEventId: string;
  readonly candidateId: string;
  readonly defencePenalty: number;
  readonly untilRound: number;
}

export interface TrialUnitDefeatedEvent extends TrialEventBase {
  readonly kind: "unit_defeated";
  readonly causedByEventId: string;
  readonly unitId: CandidateTrialUnitId;
  readonly byUnitId: CandidateTrialUnitId;
}

export interface TrialEndedEvent extends TrialEventBase {
  readonly kind: "trial_ended";
  readonly causedByEventId: string;
  readonly winner: CandidateTrialSide | "draw";
  readonly reason: "team_defeated" | "action_cap";
  readonly actionCount: number;
}

export type CandidateTrialEvent =
  | TrialStartedEvent
  | TrialRoundStartedEvent
  | TrialActionOptionsEvent
  | TrialIntentShownEvent
  | TrialActionStartedEvent
  | TrialTechniqueUsedEvent
  | CandidateRuleTriggeredEvent
  | TrialInterceptedEvent
  | TrialGuardChangedEvent
  | TrialHealthChangedEvent
  | TrialPointsChangedEvent
  | TrialStrainChangedEvent
  | TrialPendingBonusChangedEvent
  | TrialPendingTargetChangedEvent
  | TrialDamageAppliedEvent
  | TrialTargetChangedEvent
  | TrialBreakAppliedEvent
  | TrialUnitDefeatedEvent
  | TrialEndedEvent;

export type RuleNotTriggeredReason =
  | "source_event_not_seen"
  | "threshold_not_reached"
  | "candidate_never_reached_action_window";

export type CandidateRuleActivationSummary = CandidateRuleSource & {
  readonly activationCount: number;
  readonly notTriggeredReason: RuleNotTriggeredReason | null;
};

export interface CandidateTrialUnitSnapshot {
  readonly id: CandidateTrialUnitId;
  readonly name: string;
  readonly side: CandidateTrialSide;
  readonly slot: CandidateTrialSlot;
  readonly health: number;
  readonly maxHealth: number;
  readonly power: number;
  readonly defence: number;
  readonly speed: number;
  readonly guard: number;
  readonly guardCap: number;
  readonly techniquePoints: number;
  readonly strain: number;
  readonly broken: boolean;
  readonly defeated: boolean;
}

export interface CandidateTrialResult {
  readonly version: 1;
  readonly command: StartCandidateTrialCommand;
  readonly candidate: CandidateDraft;
  readonly profile: CandidateCombatProfile;
  readonly winner: CandidateTrialSide | "draw";
  readonly endReason: "team_defeated" | "action_cap";
  readonly rounds: number;
  readonly actionCount: number;
  readonly initialUnits: readonly CandidateTrialUnitSnapshot[];
  readonly events: readonly CandidateTrialEvent[];
  readonly finalUnits: readonly CandidateTrialUnitSnapshot[];
  readonly ruleActivations: readonly [
    CandidateRuleActivationSummary,
    CandidateRuleActivationSummary,
    CandidateRuleActivationSummary,
  ];
}
