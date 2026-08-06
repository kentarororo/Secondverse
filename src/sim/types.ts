import type { EquipmentId, EquipmentSelectionId } from "../equipment/types";
import type { PriorCondition } from "../aftermath/types";

export const FORMATION_SLOTS = ["front", "middle", "rear"] as const;
export type FormationSlot = (typeof FORMATION_SLOTS)[number];

export const HERO_IDS = ["ada", "bo", "cy"] as const;
export type HeroId = (typeof HERO_IDS)[number];

export const ENCOUNTER_IDS = ["pressure_rear", "punish_front"] as const;
export type EncounterId = (typeof ENCOUNTER_IDS)[number];

export const TEAM_POLICY_IDS = ["hold_front", "cover_rear"] as const;
export type TeamPolicyId = (typeof TEAM_POLICY_IDS)[number];

export const TECHNIQUE_POLICY_IDS = ["use_early", "wait_for_need"] as const;
export type TechniquePolicyId = (typeof TECHNIQUE_POLICY_IDS)[number];

export const HERO_ACTION_IDS = ["basic", "brace", "heavy_hit", "first_aid"] as const;
export type HeroActionId = (typeof HERO_ACTION_IDS)[number];

export const ENEMY_ACTION_IDS = ["basic", "rear_strike", "line_hit"] as const;
export type EnemyActionId = (typeof ENEMY_ACTION_IDS)[number];
export type ActionId = HeroActionId | EnemyActionId;

export const ENEMY_IDS = [
  "rear_attacker",
  "rear_guard",
  "rear_helper",
  "line_breaker",
  "line_guard",
  "line_helper",
] as const;
export type EnemyId = (typeof ENEMY_IDS)[number];
export type UnitId = HeroId | EnemyId;
export type Side = "heroes" | "enemies";

export interface UnitStats {
  readonly maxHealth: number;
  readonly power: number;
  readonly defence: number;
  readonly speed: number;
  readonly guardCap: number;
}

export interface HeroBlueprint {
  readonly id: HeroId;
  readonly name: string;
  readonly role: "guard" | "damage" | "support";
  readonly stats: UnitStats;
  readonly technique: Exclude<HeroActionId, "basic">;
  readonly techniqueName: string;
  readonly signatureName: string;
}

export type EnemyRule = "nearest" | "rear_target" | "rear_every_third" | "front_strain";

export interface EnemyBlueprint {
  readonly id: EnemyId;
  readonly name: string;
  readonly stats: UnitStats;
  readonly rule: EnemyRule;
}

export interface EncounterBlueprint {
  readonly id: EncounterId;
  readonly name: string;
  readonly tell: string;
  readonly enemyIds: readonly [EnemyId, EnemyId, EnemyId];
}

export interface BattleFormation {
  readonly front: HeroId;
  readonly middle: HeroId;
  readonly rear: HeroId;
}

export type HeroTechniquePolicies = Readonly<Record<HeroId, TechniquePolicyId>>;

export interface BattlePlan {
  readonly formation: BattleFormation;
  readonly teamPolicy: TeamPolicyId;
  readonly techniquePolicies: HeroTechniquePolicies;
  readonly frontEquipment: EquipmentSelectionId;
  readonly priorCondition: PriorCondition | null;
}

export interface StartBattleCommand {
  readonly type: "start_battle";
  readonly version: 1;
  readonly seed: string;
  readonly encounterId: EncounterId;
  readonly plan: BattlePlan;
}

export type BattleEndReason = "team_defeated" | "action_cap";
export type BattleWinner = Side | "draw";

interface EventBase {
  readonly eventId: string;
  readonly sequence: number;
  readonly round: number;
}

export interface BattleStartedEvent extends EventBase {
  readonly kind: "battle_started";
  readonly encounterId: EncounterId;
  readonly seed: string;
  readonly formation: BattleFormation;
  readonly teamPolicy: TeamPolicyId;
}

export interface RoundStartedEvent extends EventBase {
  readonly kind: "round_started";
  readonly order: readonly UnitId[];
}

export type ActionOptionReason =
  | "always_available"
  | "not_enough_points"
  | "use_early"
  | "need_not_met"
  | "need_met"
  | "point_cap"
  | "no_injured_ally"
  | "rear_action_not_third"
  | "rear_action_third"
  | "rear_rule"
  | "front_rule";

export interface ActionOptionFact {
  readonly actionId: ActionId;
  readonly legal: boolean;
  readonly score: number;
  readonly reasons: readonly ActionOptionReason[];
}

export interface ActionOptionsEvent extends EventBase {
  readonly kind: "action_options";
  readonly actorId: UnitId;
  readonly options: readonly ActionOptionFact[];
}

export interface IntentShownEvent extends EventBase {
  readonly kind: "intent_shown";
  readonly actorId: UnitId;
  readonly actionId: ActionId;
  readonly targetIds: readonly UnitId[];
  readonly reason:
    | "nearest_target"
    | "technique_ready"
    | "technique_need"
    | "rear_third_action"
    | "rear_pressure"
    | "front_pressure";
}

export interface ActionStartedEvent extends EventBase {
  readonly kind: "action_started";
  readonly causedByEventId: string;
  readonly actorId: UnitId;
  readonly actionId: ActionId;
  readonly targetIds: readonly UnitId[];
}

export interface PolicyTriggeredEvent extends EventBase {
  readonly kind: "policy_triggered";
  readonly causedByEventId: string;
  readonly policyId: TeamPolicyId;
  readonly actorId: HeroId;
  readonly targetId: HeroId;
  readonly effect: "starting_guard" | "intercept";
}

export interface EquipmentAppliedEvent extends EventBase {
  readonly kind: "equipment_applied";
  readonly causedByEventId: string;
  readonly equipmentId: EquipmentId;
  readonly targetId: HeroId;
  readonly slot: "front";
  readonly speedBefore: number;
  readonly speedChange: number;
  readonly speedAfter: number;
  readonly startingGuard: number;
}

export interface ConditionAppliedEvent extends EventBase {
  readonly kind: "condition_applied";
  readonly causedByEventId: string;
  readonly sourceEventId: string;
  readonly condition: "bruised";
  readonly targetId: HeroId;
  readonly healthPenalty: 12;
  readonly maxHealthBefore: number;
  readonly maxHealthAfter: number;
  readonly healthBefore: number;
  readonly healthAfter: number;
}

export interface SignatureTriggeredEvent extends EventBase {
  readonly kind: "signature_triggered";
  readonly causedByEventId: string;
  readonly actorId: HeroId;
  readonly signatureName: string;
  readonly targetId: UnitId;
  readonly effect: "intercept" | "low_health_damage" | "low_health_guard";
}

export interface TargetMarkedEvent extends EventBase {
  readonly kind: "target_marked";
  readonly causedByEventId: string;
  readonly actorId: EnemyId;
  readonly targetId: HeroId;
  readonly slot: "rear";
}

export interface TargetChangedEvent extends EventBase {
  readonly kind: "target_changed";
  readonly causedByEventId: string;
  readonly actorId: UnitId;
  readonly fromTargetId: UnitId;
  readonly toTargetId: UnitId;
  readonly reason: "cover_rear";
}

export interface DamageAppliedEvent extends EventBase {
  readonly kind: "damage_applied";
  readonly causedByEventId: string;
  readonly actorId: UnitId;
  readonly targetId: UnitId;
  readonly actionId: ActionId;
  readonly inputPower: number;
  readonly actionPower: number;
  readonly variance: number;
  readonly defence: number;
  readonly guardAbsorbed: number;
  readonly healthLost: number;
  readonly healthAfter: number;
}

export interface HealedEvent extends EventBase {
  readonly kind: "healed";
  readonly causedByEventId: string;
  readonly actorId: HeroId;
  readonly targetId: HeroId;
  readonly requestedAmount: number;
  readonly healthGained: number;
  readonly healthAfter: number;
}

export interface GuardChangedEvent extends EventBase {
  readonly kind: "guard_changed";
  readonly causedByEventId: string;
  readonly actorId: UnitId;
  readonly targetId: UnitId;
  readonly amount: number;
  readonly guardAfter: number;
  readonly reason:
    | "hold_front"
    | "equipment"
    | "brace"
    | "quick_help"
    | "damage"
    | "break";
}

export interface TechniqueChangedEvent extends EventBase {
  readonly kind: "technique_changed";
  readonly causedByEventId: string;
  readonly heroId: HeroId;
  readonly amount: number;
  readonly pointsAfter: number;
  readonly reason: "basic_gain" | "technique_cost";
}

export interface StrainChangedEvent extends EventBase {
  readonly kind: "strain_changed";
  readonly causedByEventId: string;
  readonly targetId: HeroId;
  readonly strainAfter: number;
  readonly threshold: number;
}

export interface FrontBrokenEvent extends EventBase {
  readonly kind: "front_broken";
  readonly causedByEventId: string;
  readonly actorId: EnemyId;
  readonly targetId: HeroId;
  readonly guardRemoved: number;
  readonly defencePenalty: number;
}

export interface UnitDefeatedEvent extends EventBase {
  readonly kind: "unit_defeated";
  readonly causedByEventId: string;
  readonly unitId: UnitId;
  readonly byUnitId: UnitId;
}

export type DecisiveReason = "rear_intercept" | "front_broken" | "first_defeat";

export interface DecisiveMomentEvent extends EventBase {
  readonly kind: "decisive_moment";
  readonly causedByEventId: string;
  readonly reason: DecisiveReason;
  readonly actorId: UnitId;
  readonly targetId: UnitId;
}

export interface BattleEndedEvent extends EventBase {
  readonly kind: "battle_ended";
  readonly causedByEventId: string;
  readonly winner: BattleWinner;
  readonly reason: BattleEndReason;
  readonly actionCount: number;
}

export type BattleEvent =
  | BattleStartedEvent
  | RoundStartedEvent
  | ActionOptionsEvent
  | IntentShownEvent
  | ActionStartedEvent
  | PolicyTriggeredEvent
  | EquipmentAppliedEvent
  | ConditionAppliedEvent
  | SignatureTriggeredEvent
  | TargetMarkedEvent
  | TargetChangedEvent
  | DamageAppliedEvent
  | HealedEvent
  | GuardChangedEvent
  | TechniqueChangedEvent
  | StrainChangedEvent
  | FrontBrokenEvent
  | UnitDefeatedEvent
  | DecisiveMomentEvent
  | BattleEndedEvent;

export interface UnitSnapshot {
  readonly id: UnitId;
  readonly name: string;
  readonly side: Side;
  readonly slot: FormationSlot;
  readonly health: number;
  readonly maxHealth: number;
  readonly speed: number;
  readonly guard: number;
  readonly techniquePoints: number;
  readonly strain: number;
  readonly broken: boolean;
  readonly defeated: boolean;
}

export interface BattleHighlights {
  readonly planEventId: string;
  readonly turningPointEventId: string;
  readonly outcomeEventId: string;
}

export interface BattleResult {
  readonly version: 1;
  readonly command: StartBattleCommand;
  readonly winner: BattleWinner;
  readonly endReason: BattleEndReason;
  readonly rounds: number;
  readonly actionCount: number;
  readonly events: readonly BattleEvent[];
  readonly finalUnits: readonly UnitSnapshot[];
  readonly highlights: BattleHighlights;
}
