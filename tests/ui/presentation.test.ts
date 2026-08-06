import { describe, expect, it } from "vitest";
import { simulateBattle, type StartBattleCommand } from "../../src/sim";
import {
  createInitialUnits,
  eventUnitDeltas,
  eventDurationMs,
  resultFacts,
  silhouetteClassNames,
  silhouetteVariant,
  unitsAtEvent,
} from "../../src/ui/presentation";

const command: StartBattleCommand = {
  type: "start_battle",
  version: 1,
  seed: "ui-presentation-test",
  encounterId: "pressure_rear",
  plan: {
    formation: { front: "cy", middle: "ada", rear: "bo" },
    teamPolicy: "cover_rear",
    techniquePolicies: {
      ada: "wait_for_need",
      bo: "use_early",
      cy: "wait_for_need",
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
    expect(facts.map((fact) => fact.label)).toEqual(["Plan", "Turning point", "Consequence"]);
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

  it("uses the typed equipment event as the second encounter plan fact", () => {
    const result = simulateBattle({
      ...command,
      encounterId: "punish_front",
      seed: "ui-equipment-plan-fact",
      plan: { ...command.plan, frontEquipment: "quick_shoes" },
    });
    const planFact = resultFacts(result)[0];
    const source = result.events.find((event) => event.eventId === planFact?.eventId);
    expect(source?.kind).toBe("equipment_applied");
    expect(planFact?.text).toContain("Quick Shoes applies");
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
    expect(planFact?.eventId).toBe(source?.eventId);
    expect(planFact?.text).toBe(
      "Bo starts Bruised: health 84 to 72; maximum health 84 to 72.",
    );
    expect(eventUnitDeltas(result, conditionIndex)).toEqual([
      expect.objectContaining({ kind: "max-health", amount: -12, text: "Max HP −12" }),
      expect.objectContaining({ kind: "health", amount: -12, text: "HP −12" }),
    ]);
    expect(unitsAtEvent(result, conditionIndex).find((unit) => unit.id === "bo")).toEqual(
      expect.objectContaining({ health: 72, maxHealth: 72 }),
    );
  });
});
