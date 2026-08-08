import type { CandidateTrialSlot, TrainingAllyId, TrialEnemyId } from "./types";

export interface TrialActorDefinition {
  readonly id: TrainingAllyId | TrialEnemyId;
  readonly name: string;
  readonly maxHealth: number;
  readonly power: number;
  readonly defence: number;
  readonly speed: number;
  readonly guardCap: number;
  readonly slot: CandidateTrialSlot;
  readonly policy: "guard_partner" | "strike_front" | "strike_lowest" | "strike_rear";
}

export const CANDIDATE_TRIAL_TUNING = Object.freeze({
  actionCap: 72,
  techniquePointCap: 3,
  basicActionPower: 4,
  damageVarianceMin: -1,
  damageVarianceMax: 2,
  trainingGuardAmount: 8,
  strainCap: 3,
  breakDefencePenalty: 3,
} as const);

export const TRAINING_ALLIES: readonly TrialActorDefinition[] = Object.freeze([
  { id:"training_guard", name:"Training Guard", maxHealth:96, power:8, defence:6, speed:9, guardCap:28, slot:"front", policy:"guard_partner" },
  { id:"training_striker", name:"Training Striker", maxHealth:88, power:16, defence:4, speed:11, guardCap:18, slot:"rear", policy:"strike_rear" },
]);

export const TRAINING_ENEMIES: readonly TrialActorDefinition[] = Object.freeze([
  { id:"training_bulwark", name:"Training Bulwark", maxHealth:76, power:8, defence:6, speed:8, guardCap:20, slot:"front", policy:"strike_front" },
  { id:"training_raider", name:"Training Raider", maxHealth:64, power:9, defence:3, speed:12, guardCap:12, slot:"middle", policy:"strike_lowest" },
  { id:"training_harrier", name:"Training Harrier", maxHealth:58, power:8, defence:2, speed:13, guardCap:10, slot:"rear", policy:"strike_rear" },
]);
