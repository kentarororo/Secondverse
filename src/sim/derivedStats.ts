import type { UnitStats } from "./types";

export interface UnitStatModifiers {
  readonly maxHealth?: number;
  readonly power?: number;
  readonly defence?: number;
  readonly speed?: number;
  readonly guardCap?: number;
}

const minimumStats: UnitStats = {
  maxHealth: 1,
  power: 1,
  defence: 0,
  speed: 1,
  guardCap: 0,
};

export function deriveUnitStats(
  base: UnitStats,
  modifiers: UnitStatModifiers = {},
): UnitStats {
  return {
    maxHealth: Math.max(minimumStats.maxHealth, base.maxHealth + (modifiers.maxHealth ?? 0)),
    power: Math.max(minimumStats.power, base.power + (modifiers.power ?? 0)),
    defence: Math.max(minimumStats.defence, base.defence + (modifiers.defence ?? 0)),
    speed: Math.max(minimumStats.speed, base.speed + (modifiers.speed ?? 0)),
    guardCap: Math.max(minimumStats.guardCap, base.guardCap + (modifiers.guardCap ?? 0)),
  };
}
