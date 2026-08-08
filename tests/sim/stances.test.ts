import { describe, expect, it } from "vitest";
import { ENCOUNTERS, ENEMIES, HEROES, STANCES, stancesForHero } from "../../src/content";
import {
  HERO_STANCE_IDS,
  simulateBattle,
  type BattleEvent,
  type HeroId,
  type HeroStanceId,
} from "../../src/sim";
import { command } from "./fixtures";

const SAFE_CY_FORMATION = { front: "bo", middle: "cy", rear: "ada" } as const;

function eventsOfKind<Kind extends BattleEvent["kind"]>(
  events: readonly BattleEvent[],
  kind: Kind,
): Extract<BattleEvent, { kind: Kind }>[] {
  return events.filter(
    (event): event is Extract<BattleEvent, { kind: Kind }> => event.kind === kind,
  );
}

const ownerByStance: Readonly<Record<HeroStanceId, HeroId>> = {
  ada_brace_early: "ada",
  ada_brace_under_pressure: "ada",
  bo_hit_front: "bo",
  bo_finish_weak: "bo",
  cy_aid_one: "cy",
  cy_aid_two: "cy",
};

describe("hero stances", () => {
  it("loads exactly two validated, forecasted stances for each hero", () => {
    expect(Object.keys(STANCES)).toEqual(HERO_STANCE_IDS);
    for (const heroId of ["ada", "bo", "cy"] as const) {
      const stances = stancesForHero(heroId);
      expect(stances.map((stance) => stance.id)).toEqual(HEROES[heroId].stanceIds);
      expect(stances).toHaveLength(2);
      expect(stances.every((stance) => stance.forecast.length > 0)).toBe(true);
    }
  });

  it.each(HERO_STANCE_IDS)("records intent, exact %s use, then action", (stanceId) => {
    const heroId = ownerByStance[stanceId];
    const encounterId = stanceId === "cy_aid_two" ? "pressure_rear" : "punish_front";
    const result = simulateBattle(
      command({
        encounterId,
        ...(stanceId === "cy_aid_two" ? { formation: SAFE_CY_FORMATION } : {}),
        stanceOverrides: { [heroId]: stanceId },
      }),
    );
    const stance = STANCES[stanceId];
    const used = eventsOfKind(result.events, "stance_used").find(
      (event) => event.stanceId === stanceId,
    );

    expect(used).toEqual(
      expect.objectContaining({
        heroId,
        actionId: stance.actionId,
        techniquePointsSpent: stance.techniqueCost,
        effect: stance.effect.kind,
      }),
    );
    const intent = result.events.find((event) => event.eventId === used?.causedByEventId);
    expect(intent).toEqual(
      expect.objectContaining({ kind: "intent_shown", actorId: heroId, actionId: stance.actionId }),
    );
    const action = eventsOfKind(result.events, "action_started").find(
      (event) => event.causedByEventId === used?.eventId,
    );
    expect(action).toEqual(
      expect.objectContaining({ actorId: heroId, actionId: stance.actionId, targetIds: used?.targetIds }),
    );
  });

  it("makes Ada's two Brace choices differ in timing and guard", () => {
    const early = simulateBattle(
      command({
        encounterId: "pressure_rear",
        teamPolicy: "cover_rear",
        stanceOverrides: { ada: "ada_brace_early" },
      }),
    );
    const pressure = simulateBattle(
      command({
        encounterId: "pressure_rear",
        teamPolicy: "cover_rear",
        stanceOverrides: { ada: "ada_brace_under_pressure" },
      }),
    );
    const firstBrace = (result: ReturnType<typeof simulateBattle>) => {
      const stance = eventsOfKind(result.events, "stance_used").find(
        (event) => event.heroId === "ada",
      );
      const action = eventsOfKind(result.events, "action_started").find(
        (event) => event.causedByEventId === stance?.eventId,
      );
      const guard = eventsOfKind(result.events, "guard_changed").find(
        (event) => event.causedByEventId === action?.eventId && event.reason === "brace",
      );
      return { stance, guard };
    };

    const earlyBrace = firstBrace(early);
    const pressureBrace = firstBrace(pressure);
    expect(earlyBrace.stance?.sequence).not.toBe(pressureBrace.stance?.sequence);
    expect(earlyBrace.guard?.amount).toBe(18);
    expect(pressureBrace.guard?.amount).toBe(26);
  });

  it("makes Bo choose the front or the weakest living enemy from typed battle facts", () => {
    const frontResult = simulateBattle(
      command({ encounterId: "punish_front", stanceOverrides: { bo: "bo_hit_front" } }),
    );
    const weakResult = simulateBattle(
      command({ encounterId: "punish_front", stanceOverrides: { bo: "bo_finish_weak" } }),
    );
    const frontUse = eventsOfKind(frontResult.events, "stance_used").find(
      (event) => event.stanceId === "bo_hit_front",
    );
    const weakUse = eventsOfKind(weakResult.events, "stance_used").find(
      (event) => event.stanceId === "bo_finish_weak",
    );
    const encounter = ENCOUNTERS.punish_front;
    const healthBefore = (result: ReturnType<typeof simulateBattle>, sequence: number) => {
      const health = new Map(
        encounter.enemyIds.map((enemyId) => [enemyId, ENEMIES[enemyId].stats.maxHealth]),
      );
      for (const event of eventsOfKind(result.events, "damage_applied")) {
        if (event.sequence < sequence && health.has(event.targetId as never)) {
          health.set(event.targetId as keyof typeof ENEMIES, event.healthAfter);
        }
      }
      return health;
    };
    const frontHealth = healthBefore(frontResult, frontUse?.sequence ?? 0);
    const expectedFront = encounter.enemyIds.find((enemyId) => (frontHealth.get(enemyId) ?? 0) > 0);
    expect(frontUse?.targetIds).toEqual([expectedFront]);

    const slotRank = new Map(encounter.enemyIds.map((enemyId, index) => [enemyId, index]));
    const healthAtUse = healthBefore(weakResult, weakUse?.sequence ?? 0);
    const expectedWeakest = encounter.enemyIds
      .filter((enemyId) => (healthAtUse.get(enemyId) ?? 0) > 0)
      .sort((left, right) => {
        const ratioDifference =
          (healthAtUse.get(left) ?? 0) / ENEMIES[left].stats.maxHealth -
          (healthAtUse.get(right) ?? 0) / ENEMIES[right].stats.maxHealth;
        return (
          ratioDifference ||
          (slotRank.get(left) ?? 0) - (slotRank.get(right) ?? 0) ||
          left.localeCompare(right)
        );
      })[0];
    expect(weakUse?.targetIds).toEqual([expectedWeakest]);
    expect(
      eventsOfKind(weakResult.events, "signature_triggered").some(
        (event) => event.actorId === "bo" && event.effect === "low_health_damage",
      ),
    ).toBe(true);
  });

  it("spends Aid two once and heals no more than two allies for 16 each", () => {
    const result = simulateBattle(
      command({
        encounterId: "pressure_rear",
        formation: SAFE_CY_FORMATION,
        stanceOverrides: { cy: "cy_aid_two" },
      }),
    );
    const used = eventsOfKind(result.events, "stance_used").find(
      (event) => event.stanceId === "cy_aid_two",
    );
    const action = eventsOfKind(result.events, "action_started").find(
      (event) => event.causedByEventId === used?.eventId,
    );
    const heals = eventsOfKind(result.events, "healed").filter(
      (event) => event.causedByEventId === action?.eventId,
    );
    const spends = eventsOfKind(result.events, "technique_changed").filter(
      (event) => event.causedByEventId === action?.eventId && event.reason === "technique_cost",
    );

    expect(used?.targetIds.length).toBeGreaterThanOrEqual(1);
    expect(used?.targetIds.length).toBeLessThanOrEqual(2);
    expect(heals.map((event) => event.requestedAmount)).toEqual(
      Array.from({ length: heals.length }, () => 16),
    );
    expect(heals.map((event) => event.targetId)).toEqual(used?.targetIds);
    expect(spends).toEqual([expect.objectContaining({ heroId: "cy", amount: -3 })]);
  });
});
