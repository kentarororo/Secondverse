import type { TechniqueDefinition, TemperamentDefinition } from "../candidates/types";

export function techniquePolicyScore(
  technique: TechniqueDefinition,
  temperament: TemperamentDefinition,
  hasInjuredAlly: boolean,
): number {
  const policy = temperament.policy;
  if (technique.role === "payoff") return 20 + policy.focusFireBias * 4;
  if (technique.role === "support") return 20 + policy.rescueBias * 4 + (hasInjuredAlly ? 3 : 0);
  if (technique.role === "defence") return 20 + policy.rescueBias * 2;
  return 21 + policy.focusFireBias * 2;
}
