import type { HeroStanceId, StanceDefinition } from "../sim/types";
import { parseStanceDefinition } from "./schema";
import { COMBAT_TUNING } from "./tuning";

const stanceInputs = [
  {
    id: "ada_brace_early",
    heroId: "ada",
    name: "Brace early",
    forecast: "At 2 Points, Ada spends 2 Points and gains 18 Guard.",
    actionId: "brace",
    techniqueCost: COMBAT_TUNING.techniqueCost,
    trigger: { kind: "at_points", points: COMBAT_TUNING.techniqueCost },
    effect: { kind: "guard_self", guard: COMBAT_TUNING.braceEarlyGuard },
  },
  {
    id: "ada_brace_under_pressure",
    heroId: "ada",
    name: "Brace under pressure",
    forecast: "At 2 Points, Ada waits for 2 Strain or 60% HP. At 3 Points, she spends 2 Points and gains 26 Guard.",
    actionId: "brace",
    techniqueCost: COMBAT_TUNING.techniqueCost,
    trigger: {
      kind: "pressure_or_cap",
      minimumPoints: COMBAT_TUNING.techniqueCost,
      healthRatio: COMBAT_TUNING.bracePressureHealthRatio,
      strain: COMBAT_TUNING.bracePressureStrain,
      forcedPoints: COMBAT_TUNING.techniquePointCap,
    },
    effect: { kind: "guard_self", guard: COMBAT_TUNING.braceUnderPressureGuard },
  },
  {
    id: "bo_hit_front",
    heroId: "bo",
    name: "Hit front",
    forecast: "At 2 Points, Bo spends 2 Points and uses Heavy Hit against the front enemy.",
    actionId: "heavy_hit",
    techniqueCost: COMBAT_TUNING.techniqueCost,
    trigger: { kind: "at_points", points: COMBAT_TUNING.techniqueCost },
    effect: { kind: "hit_front" },
  },
  {
    id: "bo_finish_weak",
    heroId: "bo",
    name: "Finish weak",
    forecast: "At 2 Points, Bo waits for an enemy below half HP. At 3 Points, he uses Heavy Hit against the weakest enemy.",
    actionId: "heavy_hit",
    techniqueCost: COMBAT_TUNING.techniqueCost,
    trigger: {
      kind: "weak_enemy_or_cap",
      minimumPoints: COMBAT_TUNING.techniqueCost,
      healthRatio: COMBAT_TUNING.finishWeakHealthRatio,
      forcedPoints: COMBAT_TUNING.techniquePointCap,
    },
    effect: { kind: "finish_weak" },
  },
  {
    id: "cy_aid_one",
    heroId: "cy",
    name: "Aid one",
    forecast: "At 2 Points, Cy spends 2 Points and restores 24 HP to the most injured ally.",
    actionId: "first_aid",
    techniqueCost: COMBAT_TUNING.techniqueCost,
    trigger: { kind: "injured_ally_at_points", points: COMBAT_TUNING.techniqueCost },
    effect: { kind: "heal_one", healing: COMBAT_TUNING.firstAidAmount, maxTargets: 1 },
  },
  {
    id: "cy_aid_two",
    heroId: "cy",
    name: "Aid two",
    forecast: "At 3 Points, Cy spends 3 Points and restores 16 HP to each of up to two injured allies.",
    actionId: "first_aid",
    techniqueCost: COMBAT_TUNING.sharedAidCost,
    trigger: { kind: "injured_ally_at_points", points: COMBAT_TUNING.sharedAidCost },
    effect: { kind: "heal_two", healing: COMBAT_TUNING.sharedAidAmount, maxTargets: 2 },
  },
] as const;

export const STANCES: Readonly<Record<HeroStanceId, StanceDefinition>> = Object.freeze(
  Object.fromEntries(
    stanceInputs.map((input) => [input.id, parseStanceDefinition(input)]),
  ) as Record<HeroStanceId, StanceDefinition>,
);

export function stancesForHero(heroId: StanceDefinition["heroId"]): readonly StanceDefinition[] {
  return Object.values(STANCES).filter((stance) => stance.heroId === heroId);
}
