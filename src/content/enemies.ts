import type { EnemyBlueprint, EnemyId } from "../sim/types";
import { parseEnemyBlueprint } from "./schema";

const enemyInputs = [
  {
    id: "rear_attacker",
    name: "Rear Attacker",
    stats: { maxHealth: 86, power: 12, defence: 4, speed: 13, guardCap: 16 },
    rule: "rear_every_third",
  },
  {
    id: "rear_guard",
    name: "Rear Guard",
    stats: { maxHealth: 98, power: 14, defence: 8, speed: 9, guardCap: 28 },
    rule: "rear_target",
  },
  {
    id: "rear_helper",
    name: "Rear Helper",
    stats: { maxHealth: 74, power: 14, defence: 4, speed: 11, guardCap: 18 },
    rule: "rear_target",
  },
  {
    id: "line_breaker",
    name: "Line Breaker",
    stats: { maxHealth: 102, power: 15, defence: 6, speed: 12, guardCap: 22 },
    rule: "front_strain",
  },
  {
    id: "line_guard",
    name: "Line Guard",
    stats: { maxHealth: 100, power: 11, defence: 8, speed: 9, guardCap: 30 },
    rule: "nearest",
  },
  {
    id: "line_helper",
    name: "Line Helper",
    stats: { maxHealth: 76, power: 11, defence: 4, speed: 11, guardCap: 18 },
    rule: "nearest",
  },
] as const;

export const ENEMIES: Readonly<Record<EnemyId, EnemyBlueprint>> = Object.freeze(
  Object.fromEntries(enemyInputs.map((input) => [input.id, parseEnemyBlueprint(input)])) as Record<
    EnemyId,
    EnemyBlueprint
  >,
);
