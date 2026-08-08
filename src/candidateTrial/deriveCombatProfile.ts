import type { CandidateDraft } from "../candidates/types";
import type { CandidateCombatProfile } from "./types";

export const CANDIDATE_PROFILE_FORMULA_FACTS = Object.freeze({
  version: 1,
  maxHealth: "vitality * 8",
  power: "power",
  defence: "floor(guard / 2)",
  speed: "speed",
  guardCap: "guard * 2",
  startingTechniquePoints: "1 when focus >= 14, otherwise 0",
  growthApplied: false,
} as const);

export function deriveCandidateCombatProfile(candidate: CandidateDraft): CandidateCombatProfile {
  return {
    version: 1,
    candidateId: candidate.candidateId,
    maxHealth: candidate.stats.vitality * 8,
    power: candidate.stats.power,
    defence: Math.floor(candidate.stats.guard / 2),
    speed: candidate.stats.speed,
    guardCap: candidate.stats.guard * 2,
    startingTechniquePoints: candidate.stats.focus >= 14 ? 1 : 0,
    formulaFacts: CANDIDATE_PROFILE_FORMULA_FACTS,
  };
}
