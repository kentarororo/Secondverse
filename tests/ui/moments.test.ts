import { describe, expect, it } from "vitest";
import {
  simulateBattle,
  type BattleResult,
  type EncounterId,
  type StartBattleCommand,
} from "../../src/sim";
import {
  deriveBattleMoments,
  selectPlaybackMoments,
  type BattleMoment,
} from "../../src/ui/moments";

function command(
  encounterId: EncounterId = "pressure_rear",
  overrides: Partial<StartBattleCommand["plan"]> = {},
): StartBattleCommand {
  return {
    type: "start_battle",
    version: 1,
    seed: `moment-${encounterId}`,
    encounterId,
    plan: {
      formation: { front: "ada", middle: "cy", rear: "bo" },
      teamPolicy: "hold_front",
      stances: {
        ada: "ada_brace_under_pressure",
        bo: "bo_hit_front",
        cy: "cy_aid_one",
      },
      frontEquipment: encounterId === "punish_front" ? "heavy_pad" : "none",
      priorCondition: null,
      ...overrides,
    },
  };
}

function actionMomentWith(
  result: BattleResult,
  eventKind: BattleResult["events"][number]["kind"],
): BattleMoment {
  const event = result.events.find((candidate) => candidate.kind === eventKind);
  const moment = deriveBattleMoments(result).find((candidate) =>
    event ? candidate.sourceEventIds.includes(event.eventId) : false,
  );
  expect(event).toBeDefined();
  expect(moment).toBeDefined();
  if (!moment) throw new Error(`Missing moment for ${eventKind}`);
  return moment;
}

describe("BattleMoment derivation", () => {
  it("is deterministic, byte-equal, and does not mutate the authoritative result", () => {
    const result = simulateBattle(command());
    const before = JSON.stringify(result);
    const first = JSON.stringify(deriveBattleMoments(result));
    const second = JSON.stringify(deriveBattleMoments(result));

    expect(first).toBe(second);
    expect(JSON.stringify(result)).toBe(before);
  });

  it("partitions every raw event exactly once in sequence with stable setup, action, and outcome boundaries", () => {
    const result = simulateBattle(command());
    const moments = deriveBattleMoments(result);
    const sourceIds = moments.flatMap((moment) => moment.sourceEventIds);

    expect(sourceIds).toEqual(result.events.map((event) => event.eventId));
    expect(new Set(sourceIds).size).toBe(result.events.length);
    expect(moments[0]).toMatchObject({
      id: "moment:event-0000",
      kind: "setup",
      anchorEventId: "event-0000",
      startEventIndex: 0,
    });
    expect(result.events[moments[0]!.endEventIndex]?.kind).toBe("round_started");
    expect(moments.at(-1)?.kind).toBe("outcome");
    expect(result.events[moments.at(-1)!.startEventIndex]?.kind).toBe("battle_ended");
    expect(moments.at(-1)?.endEventIndex).toBe(result.events.length - 1);

    const actions = moments.filter((moment) => moment.kind === "action");
    expect(actions).toHaveLength(result.actionCount);
    for (const moment of actions) {
      const events = result.events.slice(moment.startEventIndex, moment.endEventIndex + 1);
      expect(events.filter((event) => event.kind === "intent_shown")).toHaveLength(1);
      expect(events.find((event) => event.eventId === moment.anchorEventId)?.kind).toBe(
        "intent_shown",
      );
      expect(["action_options", "round_started"]).toContain(events[0]?.kind);
      expect(moment.id).toBe(`moment:${moment.anchorEventId}`);
    }
  });

  it("uses the required stable focus priority and keeps internal event IDs explicitly compressed", () => {
    const result = simulateBattle(
      command("pressure_rear", {
        formation: { front: "cy", middle: "ada", rear: "bo" },
        teamPolicy: "cover_rear",
      }),
    );
    const decisive = actionMomentWith(result, "decisive_moment");

    expect(decisive.keyFacts.map((fact) => fact.kind)).toEqual(
      expect.arrayContaining(["policy", "enemy_mark", "signature", "decisive"]),
    );
    expect(decisive.focusKind).toBe("decisive");
    expect(
      decisive.keyFacts.find((fact) => fact.eventId === decisive.focusEventId)?.kind,
    ).toBe("decisive");
    expect(decisive.compressedEventIds).toEqual(
      decisive.sourceEventIds.filter(
        (eventId) =>
          eventId !== decisive.anchorEventId &&
          !decisive.keyFacts.some((fact) => fact.eventId === eventId) &&
          !decisive.deltas.some((delta) => delta.sourceEventIds.includes(eventId)),
      ),
    );
  });

  it("keeps Cover rear's intended target and resolved target in one causal action moment", () => {
    const result = simulateBattle(
      command("pressure_rear", {
        formation: { front: "cy", middle: "ada", rear: "bo" },
        teamPolicy: "cover_rear",
      }),
    );
    const moment = actionMomentWith(result, "target_changed");
    const targetChange = result.events
      .slice(moment.startEventIndex, moment.endEventIndex + 1)
      .find((event) => event.kind === "target_changed");

    expect(targetChange?.kind).toBe("target_changed");
    if (targetChange?.kind !== "target_changed") return;
    expect(moment.intendedTargetIds).toEqual([targetChange.fromTargetId]);
    expect(moment.resolvedTargetIds).toEqual([targetChange.toTargetId]);
    expect(moment.keyFacts).toContainEqual(
      expect.objectContaining({ kind: "policy", policyId: "cover_rear", effect: "intercept" }),
    );
    expect(moment.deltas).toContainEqual(
      expect.objectContaining({ unitId: targetChange.toTargetId, stat: "health" }),
    );
    expect(moment.deltas.some((delta) => delta.unitId === targetChange.fromTargetId && delta.stat === "health")).toBe(false);
  });

  it("aggregates line-break double damage and the strain reset without double counting", () => {
    const result = simulateBattle(command("punish_front"));
    const moment = actionMomentWith(result, "front_broken");
    const events = result.events.slice(moment.startEventIndex, moment.endEventIndex + 1);
    const damageEvents = events.filter((event) => event.kind === "damage_applied");
    const breakEvent = events.find((event) => event.kind === "front_broken");

    expect(damageEvents).toHaveLength(2);
    expect(breakEvent?.kind).toBe("front_broken");
    if (breakEvent?.kind !== "front_broken") return;
    const health = moment.deltas.find(
      (delta) => delta.unitId === breakEvent.targetId && delta.stat === "health",
    );
    const strain = moment.deltas.find(
      (delta) => delta.unitId === breakEvent.targetId && delta.stat === "strain",
    );
    const totalHealthLost = damageEvents.reduce(
      (total, event) => total + (event.kind === "damage_applied" ? event.healthLost : 0),
      0,
    );

    expect(health).toMatchObject({
      lost: totalHealthLost,
      gained: 0,
      net: -totalHealthLost,
      sourceEventIds: damageEvents.map((event) => event.eventId),
    });
    expect(health?.before - health!.after).toBe(totalHealthLost);
    expect(strain).toMatchObject({ before: 2, after: 0, gained: 1, lost: 3, net: -2 });
    expect(moment.keyFacts).toContainEqual(expect.objectContaining({ kind: "break" }));
  });

  it("keeps Aid two's ordered heals and single point spend in one action moment", () => {
    const result = simulateBattle(
      command("pressure_rear", {
        stances: {
          ada: "ada_brace_under_pressure",
          bo: "bo_hit_front",
          cy: "cy_aid_two",
        },
      }),
    );
    const moment = deriveBattleMoments(result).find(
      (candidate) => candidate.stance?.stanceId === "cy_aid_two" &&
        candidate.deltas.filter((delta) => delta.stat === "health" && delta.gained > 0).length === 2,
    );

    expect(moment).toBeDefined();
    if (!moment) return;
    const events = result.events.slice(moment.startEventIndex, moment.endEventIndex + 1);
    const heals = events.filter((event) => event.kind === "healed");
    const spends = events.filter(
      (event) => event.kind === "technique_changed" && event.amount < 0,
    );
    const healDeltas = moment.deltas.filter(
      (delta) => delta.stat === "health" && delta.gained > 0,
    );

    expect(heals).toHaveLength(2);
    expect(moment.resolvedTargetIds).toEqual(
      heals.map((event) => (event.kind === "healed" ? event.targetId : "ada")),
    );
    expect(healDeltas.map((delta) => delta.unitId)).toEqual(
      heals.map((event) => (event.kind === "healed" ? event.targetId : "ada")),
    );
    expect(healDeltas.map((delta) => delta.gained)).toEqual(
      heals.map((event) => (event.kind === "healed" ? event.healthGained : 0)),
    );
    expect(spends).toHaveLength(1);
    expect(moment.deltas).toContainEqual(
      expect.objectContaining({
        unitId: "cy",
        stat: "technique",
        lost: 3,
        gained: 0,
        net: -3,
        sourceEventIds: [spends[0]?.eventId],
      }),
    );
  });

  it("keeps Bruised and equipment setup deltas exact and ordered", () => {
    const result = simulateBattle(
      command("punish_front", {
        frontEquipment: "quick_shoes",
        priorCondition: {
          kind: "bruised",
          heroId: "bo",
          healthPenalty: 12,
          sourceEventId: "event-0074",
        },
      }),
    );
    const setup = deriveBattleMoments(result)[0]!;
    const condition = result.events.find((event) => event.kind === "condition_applied");
    const equipment = result.events.find((event) => event.kind === "equipment_applied");

    expect(setup.kind).toBe("setup");
    expect(setup.keyFacts.map((fact) => fact.kind)).toEqual(
      expect.arrayContaining(["equipment", "condition"]),
    );
    expect(equipment?.kind).toBe("equipment_applied");
    expect(condition?.kind).toBe("condition_applied");
    if (equipment?.kind !== "equipment_applied" || condition?.kind !== "condition_applied") return;
    expect(setup.deltas).toContainEqual({
      unitId: equipment.targetId,
      stat: "speed",
      gained: equipment.speedChange,
      lost: 0,
      net: equipment.speedChange,
      before: equipment.speedBefore,
      after: equipment.speedAfter,
      sourceEventIds: [equipment.eventId],
    });
    expect(setup.deltas).toContainEqual({
      unitId: condition.targetId,
      stat: "max-health",
      gained: 0,
      lost: condition.healthPenalty,
      net: -condition.healthPenalty,
      before: condition.maxHealthBefore,
      after: condition.maxHealthAfter,
      sourceEventIds: [condition.eventId],
    });
    expect(setup.deltas).toContainEqual({
      unitId: condition.targetId,
      stat: "health",
      gained: 0,
      lost: condition.healthPenalty,
      net: -condition.healthPenalty,
      before: condition.healthBefore,
      after: condition.healthAfter,
      sourceEventIds: [condition.eventId],
    });
  });

  it("selects required key moments and compresses repeated routine stance, signature, and rule uses", () => {
    const result = simulateBattle(command());
    const all = selectPlaybackMoments(result, "all");
    const key = selectPlaybackMoments(result, "key");
    const keyIds = new Set(key.map((entry) => entry.moment.id));

    expect(key.length).toBeLessThan(all.length);
    expect(key[0]?.moment.kind).toBe("setup");
    expect(key.at(-1)?.moment.kind).toBe("outcome");
    expect(key.reduce((total, entry) => total + entry.routineActionsAdvanced, 0)).toBe(
      all.filter((entry) => entry.moment.kind === "action" && !keyIds.has(entry.moment.id)).length,
    );

    for (const stanceId of Object.values(result.command.plan.stances)) {
      const occurrences = all.filter((entry) => entry.moment.stance?.stanceId === stanceId);
      if (occurrences.length === 0) continue;
      expect(keyIds.has(occurrences[0]!.moment.id)).toBe(true);
      for (const repeated of occurrences.slice(1)) {
        const hasHigherPriorityFact = repeated.moment.keyFacts.some((fact) =>
          ["break", "defeat", "decisive", "policy"].includes(fact.kind),
        );
        if (!hasHigherPriorityFact) expect(keyIds.has(repeated.moment.id)).toBe(false);
      }
    }

    for (const factKind of ["signature", "enemy_rule", "enemy_mark"] as const) {
      const occurrences = all.filter((entry) =>
        entry.moment.keyFacts.some((fact) => fact.kind === factKind),
      );
      if (occurrences.length > 1) {
        expect(keyIds.has(occurrences[0]!.moment.id)).toBe(true);
      }
    }
  });
});
