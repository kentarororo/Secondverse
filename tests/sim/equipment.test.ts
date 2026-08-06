import { describe, expect, it } from "vitest";
import {
  EQUIPMENT,
  getEquipmentRewardOptions,
  parseEquipmentDefinition,
} from "../../src/equipment";
import { deriveUnitStats, simulateBattle, type BattleEvent } from "../../src/sim";
import { HEROES } from "../../src/content";
import { ADA_FRONT, command } from "./fixtures";

function firstEvent<Kind extends BattleEvent["kind"]>(
  events: readonly BattleEvent[],
  kind: Kind,
): Extract<BattleEvent, { kind: Kind }> {
  const event = events.find(
    (candidate): candidate is Extract<BattleEvent, { kind: Kind }> => candidate.kind === kind,
  );
  if (!event) {
    throw new Error(`Missing ${kind} event`);
  }
  return event;
}

describe("equipment rewards", () => {
  it("offers the two authored options only after Pressure the Rear", () => {
    expect(getEquipmentRewardOptions("pressure_rear")).toEqual([
      EQUIPMENT.heavy_pad,
      EQUIPMENT.quick_shoes,
    ]);
    expect(getEquipmentRewardOptions("punish_front")).toEqual([]);
  });

  it("validates plain visible item facts", () => {
    expect(EQUIPMENT.heavy_pad).toEqual(
      expect.objectContaining({ name: "Heavy Pad", effects: { speed: -3, startingGuard: 18 } }),
    );
    expect(EQUIPMENT.quick_shoes).toEqual(
      expect.objectContaining({ name: "Quick Shoes", effects: { speed: 4, startingGuard: 0 } }),
    );
    expect(() =>
      parseEquipmentDefinition({
        id: "quick_shoes",
        name: "Quick Shoes",
        description: "Hidden effect",
        effects: { speed: 99, startingGuard: 0 },
      }),
    ).toThrow();
  });

  it("uses the canonical derived-stat path for the speed effects", () => {
    expect(deriveUnitStats(HEROES.ada.stats, EQUIPMENT.heavy_pad.effects).speed).toBe(7);
    expect(deriveUnitStats(HEROES.ada.stats, EQUIPMENT.quick_shoes.effects).speed).toBe(14);
  });
});

describe("equipment battle leverage", () => {
  it("replays the same item choice as identical events and results", () => {
    const input = command({
      encounterId: "punish_front",
      formation: ADA_FRONT,
      teamPolicy: "cover_rear",
      frontEquipment: "heavy_pad",
    });
    expect(simulateBattle(input)).toEqual(simulateBattle(input));
  });

  it("changes only equipment to trade mitigation for earlier action order", () => {
    const heavy = simulateBattle(
      command({
        encounterId: "punish_front",
        formation: ADA_FRONT,
        teamPolicy: "cover_rear",
        frontEquipment: "heavy_pad",
      }),
    );
    const quick = simulateBattle(
      command({
        encounterId: "punish_front",
        formation: ADA_FRONT,
        teamPolicy: "cover_rear",
        frontEquipment: "quick_shoes",
      }),
    );

    const heavyEquipment = firstEvent(heavy.events, "equipment_applied");
    const quickEquipment = firstEvent(quick.events, "equipment_applied");
    expect(heavyEquipment).toEqual(
      expect.objectContaining({
        equipmentId: "heavy_pad",
        targetId: "ada",
        speedBefore: 10,
        speedChange: -3,
        speedAfter: 7,
        startingGuard: 18,
      }),
    );
    expect(quickEquipment).toEqual(
      expect.objectContaining({
        equipmentId: "quick_shoes",
        targetId: "ada",
        speedBefore: 10,
        speedChange: 4,
        speedAfter: 14,
        startingGuard: 0,
      }),
    );

    const heavyRound = firstEvent(heavy.events, "round_started");
    const quickRound = firstEvent(quick.events, "round_started");
    expect(heavyRound.order.indexOf("line_breaker")).toBeLessThan(
      heavyRound.order.indexOf("ada"),
    );
    expect(quickRound.order.indexOf("ada")).toBeLessThan(
      quickRound.order.indexOf("line_breaker"),
    );

    const heavyFirstLineHit = heavy.events.find(
      (event): event is Extract<BattleEvent, { kind: "damage_applied" }> =>
        event.kind === "damage_applied" && event.actionId === "line_hit",
    );
    const quickFirstLineHit = quick.events.find(
      (event): event is Extract<BattleEvent, { kind: "damage_applied" }> =>
        event.kind === "damage_applied" && event.actionId === "line_hit",
    );
    expect(heavyFirstLineHit?.guardAbsorbed).toBeGreaterThan(0);
    expect(quickFirstLineHit?.guardAbsorbed).toBe(0);
    expect(heavy.finalUnits).not.toEqual(quick.finalUnits);
  });

  it("links the starting guard to the equipment plan event", () => {
    const result = simulateBattle(
      command({
        encounterId: "punish_front",
        formation: ADA_FRONT,
        teamPolicy: "cover_rear",
        frontEquipment: "heavy_pad",
      }),
    );
    const equipment = firstEvent(result.events, "equipment_applied");
    const guard = result.events.find(
      (event): event is Extract<BattleEvent, { kind: "guard_changed" }> =>
        event.kind === "guard_changed" && event.reason === "equipment",
    );
    expect(equipment.causedByEventId).toBe(result.events[0]?.eventId);
    expect(guard?.causedByEventId).toBe(equipment.eventId);
    expect(result.highlights.planEventId).toBe(equipment.eventId);
  });
});
