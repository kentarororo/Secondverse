import { describe, expect, it } from "vitest";
import { simulateBattle, type StartBattleCommand } from "../../src/sim";
import {
  combatFeedbackAtEvent,
  combatFeedbackForMoment,
  contactCueForMoment,
  createInitialUnits,
  eventUnitDeltas,
  eventDurationMs,
  eventFact,
  momentSummary,
  planTrackerAtMoment,
  resultFacts,
  silhouetteClassNames,
  silhouetteVariant,
  unitsAtEvent,
} from "../../src/ui/presentation";
import { deriveBattleMoments } from "../../src/ui/moments";

const command: StartBattleCommand = {
  type: "start_battle",
  version: 1,
  seed: "ui-presentation-test",
  encounterId: "pressure_rear",
  plan: {
    formation: { front: "cy", middle: "ada", rear: "bo" },
    teamPolicy: "cover_rear",
    stances: {
      ada: "ada_brace_under_pressure",
      bo: "bo_hit_front",
      cy: "cy_aid_one",
    },
    frontEquipment: "none",
    priorCondition: null,
  },
};

describe("battle presentation facts", () => {
  it("reaches the authoritative final snapshots without changing simulation facts", () => {
    const result = simulateBattle(command);
    expect(createInitialUnits(result)).toHaveLength(6);
    expect(unitsAtEvent(result, result.events.length - 1)).toEqual(result.finalUnits);
    expect(result.command).toEqual(command);
  });

  it("links exactly three result facts to real events", () => {
    const result = simulateBattle(command);
    const facts = resultFacts(result);
    expect(facts.map((fact) => fact.label)).toEqual(["Plan", "Turning point", "Battle result"]);
    for (const fact of facts) {
      expect(result.events.some((event) => event.eventId === fact.eventId)).toBe(true);
      expect(fact.text.length).toBeGreaterThan(0);
    }
  });

  it("reserves longer presentation time for typed signature and decisive events", () => {
    const result = simulateBattle(command);
    const normal = result.events.find((event) => event.kind === "damage_applied");
    const signature = result.events.find((event) => event.kind === "signature_triggered");
    const decisive = result.events.find((event) => event.kind === "decisive_moment");
    expect(normal).toBeDefined();
    expect(signature).toBeDefined();
    expect(decisive).toBeDefined();
    if (!normal || !signature || !decisive) return;
    expect(eventDurationMs(signature, false)).toBeGreaterThan(eventDurationMs(normal, false));
    expect(eventDurationMs(decisive, false)).toBeGreaterThan(eventDurationMs(signature, false));
  });

  it("selects fallback silhouettes deterministically from stable IDs", () => {
    expect(silhouetteVariant("ada")).toBe(silhouetteVariant("ada"));
    expect([0, 1, 2]).toContain(silhouetteVariant("line_breaker"));
    expect(silhouetteClassNames("ada")).toContain("identity-ada");
    expect(silhouetteClassNames("ada")).toContain("role-guard");
    expect(silhouetteClassNames("bo")).toContain("identity-bo");
    expect(silhouetteClassNames("cy")).toContain("identity-cy");
    expect(new Set([silhouetteClassNames("ada"), silhouetteClassNames("bo"), silhouetteClassNames("cy")]).size).toBe(3);
    expect(silhouetteClassNames("rear_guard")).toContain("enemy-role-guard");
    expect(silhouetteClassNames("rear_helper")).toContain("enemy-role-helper");
    expect(silhouetteClassNames("line_breaker")).toContain("enemy-role-breaker");
  });

  it("maps typed health, guard, technique, and strain changes to exact signed unit deltas", () => {
    const rearResult = simulateBattle(command);
    const damageIndex = rearResult.events.findIndex(
      (event) => event.kind === "damage_applied" && event.healthLost > 0,
    );
    const healIndex = rearResult.events.findIndex(
      (event) => event.kind === "healed" && event.healthGained > 0,
    );
    const guardIndex = rearResult.events.findIndex(
      (event) => event.kind === "guard_changed" && event.amount !== 0,
    );
    const techniqueIndex = rearResult.events.findIndex(
      (event) => event.kind === "technique_changed" && event.amount !== 0,
    );

    for (const index of [damageIndex, healIndex, guardIndex, techniqueIndex]) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(eventUnitDeltas(rearResult, index)).toHaveLength(1);
    }
    const nextIntentAfterDamage = rearResult.events.findIndex(
      (event, index) => index > damageIndex && event.kind === "intent_shown",
    );
    expect(combatFeedbackAtEvent(rearResult, nextIntentAfterDamage).deltas).toContainEqual(
      eventUnitDeltas(rearResult, damageIndex)[0],
    );

    const frontResult = simulateBattle({
      ...command,
      encounterId: "punish_front",
      seed: "ui-strain-test",
      plan: { ...command.plan, frontEquipment: "heavy_pad" },
    });
    const strainIndex = frontResult.events.findIndex(
      (event) => event.kind === "strain_changed" && event.strainAfter > 0,
    );
    expect(strainIndex).toBeGreaterThanOrEqual(0);
    const strainDelta = eventUnitDeltas(frontResult, strainIndex)[0];
    expect(strainDelta?.kind).toBe("strain");
    expect(strainDelta?.amount).toBe(1);
  });

  it("renders the authoritative stance use at its actor with exact effect, cost, and reason", () => {
    const result = simulateBattle(command);
    const stanceIndex = result.events.findIndex(
      (event) => event.kind === "stance_used" && event.stanceId === "bo_hit_front",
    );
    const stanceEvent = result.events[stanceIndex];

    expect(stanceIndex).toBeGreaterThanOrEqual(0);
    expect(stanceEvent?.kind).toBe("stance_used");
    if (stanceEvent?.kind !== "stance_used") return;
    expect(eventFact(stanceEvent)).toBe(
      "Bo uses Hit front. Uses Heavy Hit against the front enemy and spends 2 Points.",
    );
    expect(combatFeedbackAtEvent(result, stanceIndex).stance).toEqual({
      heroId: "bo",
      stanceId: "bo_hit_front",
      name: "Hit front",
      detail: "Uses Heavy Hit against the front enemy and spends 2 Points",
      trigger: "ready",
    });
    expect(combatFeedbackAtEvent(result, stanceIndex + 1).stance?.stanceId).toBe(
      "bo_hit_front",
    );
  });

  it("turns a grouped Cover rear play into one intended-to-resolved causal summary", () => {
    const result = simulateBattle(command);
    const moment = deriveBattleMoments(result).find((candidate) =>
      candidate.keyFacts.some(
        (fact) => fact.kind === "policy" && fact.effect === "intercept",
      ),
    );
    expect(moment).toBeDefined();
    if (!moment) return;

    const summary = momentSummary(result, moment);
    expect(summary.cause).toContain("Cover rear");
    expect(summary.target).toBe("Bo was targeted, but the action affects Ada.");
    expect(summary.outcome).toMatch(/Ada HP −\d+ \(\d+→\d+\)/);
    expect(summary.text).toBe(`${summary.cause} ${summary.target} ${summary.outcome}`);
    expect(contactCueForMoment(moment)).toEqual(
      expect.objectContaining({
        actorId: "rear_attacker",
        targetIds: ["ada"],
        reaction: "damage",
      }),
    );
    expect(combatFeedbackForMoment(result, moment).deltas).toContainEqual(
      expect.objectContaining({ unitId: "ada", kind: "health", lost: expect.any(Number) }),
    );
  });

  it("keeps Ada, Bo, and Cy equal in the plan tracker and records exact stance activations", () => {
    const result = simulateBattle(command);
    const moments = deriveBattleMoments(result);
    const setupTracker = planTrackerAtMoment(result, moments[0]!);
    expect(setupTracker.map((item) => item.heroName)).toEqual(["Ada", "Bo", "Cy"]);
    expect(setupTracker.map((item) => item.status)).toEqual([
      "Not used yet",
      "Not used yet",
      "Not used yet",
    ]);

    for (const heroId of ["ada", "bo", "cy"] as const) {
      const activationMoment = moments.find((moment) => moment.stance?.heroId === heroId);
      if (!activationMoment) continue;
      const item = planTrackerAtMoment(result, activationMoment).find(
        (candidate) => candidate.heroId === heroId,
      );
      expect(item).toEqual(
        expect.objectContaining({
          stanceId: result.command.plan.stances[heroId],
          state: "activated",
          status: `Used in Round ${activationMoment.round}.`,
          detail: expect.stringMatching(/Points\.$/),
          outcome: expect.stringMatching(/\d+→\d+/),
        }),
      );
    }
  });

  it("keeps typed Marked and Bruised status facts at the affected unit", () => {
    const pressure = simulateBattle(command);
    const markedIndex = pressure.events.findIndex((event) => event.kind === "target_marked");
    const marked = pressure.events[markedIndex];
    expect(marked?.kind).toBe("target_marked");
    if (marked?.kind !== "target_marked") return;
    expect(combatFeedbackAtEvent(pressure, markedIndex).statuses).toContainEqual(
      expect.objectContaining({
        unitId: marked.targetId,
        kind: "marked",
        label: "Marked",
        visualId: "status.marked",
      }),
    );

    const punish = simulateBattle({
      ...command,
      encounterId: "punish_front",
      seed: "ui-persistent-bruised",
      plan: {
        ...command.plan,
        priorCondition: {
          kind: "bruised",
          heroId: "bo",
          healthPenalty: 12,
          sourceEventId: "event-0074",
        },
      },
    });
    const laterIntentIndex = punish.events.findIndex(
      (event, index) => index > 5 && event.kind === "intent_shown",
    );
    expect(combatFeedbackAtEvent(punish, laterIntentIndex).statuses).toContainEqual({
      unitId: "bo",
      kind: "bruised",
      label: "Bruised · −12 max HP",
      visualId: "status.bruised",
    });
  });

  it("links the second-encounter starting plan to formation and policy evidence", () => {
    const result = simulateBattle({
      ...command,
      encounterId: "punish_front",
      seed: "ui-equipment-plan-fact",
      plan: { ...command.plan, frontEquipment: "quick_shoes" },
    });
    const planFact = resultFacts(result)[0];
    const source = result.events.find((event) => event.eventId === planFact?.eventId);
    expect(source?.kind).toBe("battle_started");
    if (source?.kind === "battle_started") {
      expect(eventFact(source)).toBe("Cy starts in the front slot. Team policy: Cover rear.");
    }
    expect(planFact?.text).toContain("Front equipment: Quick Shoes.");
    const equipmentIndex = result.events.findIndex((event) => event.kind === "equipment_applied");
    expect(eventUnitDeltas(result, equipmentIndex)).toEqual([
      expect.objectContaining({ kind: "speed", amount: 4, text: "Speed +4" }),
    ]);
  });

  it("links a carried Bruised condition to the Punish plan fact and exact health deltas", () => {
    const result = simulateBattle({
      ...command,
      encounterId: "punish_front",
      seed: "ui-condition-plan-fact",
      plan: {
        ...command.plan,
        frontEquipment: "heavy_pad",
        priorCondition: {
          kind: "bruised",
          heroId: "bo",
          healthPenalty: 12,
          sourceEventId: "event-0073",
        },
      },
    });
    const planFact = resultFacts(result)[0];
    const conditionIndex = result.events.findIndex((event) => event.kind === "condition_applied");
    const source = result.events[conditionIndex];

    expect(source?.kind).toBe("condition_applied");
    expect(result.events.some((event) => event.eventId === planFact?.eventId)).toBe(true);
    expect(planFact?.text).toContain("Bo starts Bruised.");
    expect(eventUnitDeltas(result, conditionIndex)).toEqual([
      expect.objectContaining({ kind: "max-health", amount: -12, text: "Max HP −12" }),
      expect.objectContaining({ kind: "health", amount: -12, text: "HP −12" }),
    ]);
    expect(unitsAtEvent(result, conditionIndex).find((unit) => unit.id === "bo")).toEqual(
      expect.objectContaining({ health: 72, maxHealth: 72 }),
    );
  });
});
