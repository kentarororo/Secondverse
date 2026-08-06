import { HERO_IDS, type BattleResult, type HeroId } from "../sim/types";
import { BRUISED_HEALTH_PENALTY, type AftermathFact } from "./types";

function isHeroId(unitId: string): unitId is HeroId {
  return (HERO_IDS as readonly string[]).includes(unitId);
}

export function deriveAftermath(result: BattleResult): AftermathFact {
  const firstHeroDefeat = result.events.find(
    (event) => event.kind === "unit_defeated" && isHeroId(event.unitId),
  );

  if (firstHeroDefeat?.kind === "unit_defeated" && isHeroId(firstHeroDefeat.unitId)) {
    return {
      kind: "bruised",
      heroId: firstHeroDefeat.unitId,
      healthPenalty: BRUISED_HEALTH_PENALTY,
      sourceEventId: firstHeroDefeat.eventId,
    };
  }

  const battleEnd = [...result.events].reverse().find((event) => event.kind === "battle_ended");
  if (!battleEnd) {
    throw new Error("Cannot derive aftermath without a battle end event");
  }
  return { kind: "no_injury", sourceEventId: battleEnd.eventId };
}
