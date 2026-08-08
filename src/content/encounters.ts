import type { EncounterBlueprint, EncounterId } from "../sim/types";
import { parseEncounterBlueprint } from "./schema";

const encounterInputs = [
  {
    id: "pressure_rear",
    name: "Pressure the Rear",
    tell: "Rear Attacker marks the hero in the rear slot before every third action it takes.",
    enemyIds: ["rear_guard", "rear_helper", "rear_attacker"],
  },
  {
    id: "punish_front",
    name: "Punish the Front",
    tell: "Line Breaker gives 1 Strain to the hero in the front slot. At 3 Strain, that hero is Broken.",
    enemyIds: ["line_guard", "line_breaker", "line_helper"],
  },
] as const;

export const ENCOUNTERS: Readonly<Record<EncounterId, EncounterBlueprint>> = Object.freeze(
  Object.fromEntries(
    encounterInputs.map((input) => [input.id, parseEncounterBlueprint(input)]),
  ) as Record<EncounterId, EncounterBlueprint>,
);
