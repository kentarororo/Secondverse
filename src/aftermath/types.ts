import type { HeroId } from "../sim/types";

export const BRUISED_HEALTH_PENALTY = 12 as const;

export interface BruisedCondition {
  readonly kind: "bruised";
  readonly heroId: HeroId;
  readonly healthPenalty: typeof BRUISED_HEALTH_PENALTY;
  readonly sourceEventId: string;
}

export interface NoInjuryAftermath {
  readonly kind: "no_injury";
  readonly sourceEventId: string;
}

export type AftermathFact = BruisedCondition | NoInjuryAftermath;
export type PriorCondition = BruisedCondition;
