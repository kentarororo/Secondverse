import type { EncounterBlueprint, EncounterId } from "../sim/types";
import { parseEncounterBlueprint } from "./schema";

const encounterInputs = [
  {
    id: "pressure_rear",
    name: "Pressure the Rear",
    tell: "This team presses the rear. Rear Attacker marks that slot before every third action.",
    enemyIds: ["rear_guard", "rear_helper", "rear_attacker"],
  },
  {
    id: "punish_front",
    name: "Punish the Front",
    tell: "Line Breaker adds strain to the front hero. Three strain causes a break.",
    enemyIds: ["line_guard", "line_breaker", "line_helper"],
  },
] as const;

export const ENCOUNTERS: Readonly<Record<EncounterId, EncounterBlueprint>> = Object.freeze(
  Object.fromEntries(
    encounterInputs.map((input) => [input.id, parseEncounterBlueprint(input)]),
  ) as Record<EncounterId, EncounterBlueprint>,
);
