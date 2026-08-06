import { describe, expect, it } from "vitest";
import { BRUISED_HEALTH_PENALTY, deriveAftermath } from "../../src/aftermath";
import { simulateBattle, type BattleEvent, type BattleFormation } from "../../src/sim";
import { command } from "./fixtures";

const DEFAULT_PRESSURE_FORMATION: BattleFormation = {
  front: "ada",
  middle: "cy",
  rear: "bo",
};

const COVER_PRESSURE_FORMATION: BattleFormation = {
  front: "bo",
  middle: "ada",
  rear: "cy",
};

function defaultPressureResult() {
  return simulateBattle(
    command({
      encounterId: "pressure_rear",
      formation: DEFAULT_PRESSURE_FORMATION,
      teamPolicy: "hold_front",
      techniqueOverrides: { ada: "wait_for_need", bo: "use_early", cy: "wait_for_need" },
      frontEquipment: "none",
      priorCondition: null,
    }),
  );
}

describe("battle-derived aftermath", () => {
  it("bruises the actual first defeated hero in the default Pressure plan", () => {
    const result = defaultPressureResult();
    const fact = deriveAftermath(result);
    const firstHeroDefeat = result.events.find(
      (event): event is Extract<BattleEvent, { kind: "unit_defeated" }> =>
        event.kind === "unit_defeated" && ["ada", "bo", "cy"].includes(event.unitId),
    );

    expect(firstHeroDefeat?.unitId).toBe("bo");
    expect(fact).toEqual({
      kind: "bruised",
      heroId: firstHeroDefeat?.unitId,
      healthPenalty: BRUISED_HEALTH_PENALTY,
      sourceEventId: firstHeroDefeat?.eventId,
    });
  });

  it("returns one no-injury fact linked to battle end for the stronger Cover plan", () => {
    const result = simulateBattle(
      command({
        encounterId: "pressure_rear",
        formation: COVER_PRESSURE_FORMATION,
        teamPolicy: "cover_rear",
        frontEquipment: "none",
        priorCondition: null,
      }),
    );
    const fact = deriveAftermath(result);
    const source = result.events.find((event) => event.eventId === fact.sourceEventId);

    expect(result.finalUnits.filter((unit) => unit.side === "heroes" && unit.defeated)).toHaveLength(
      0,
    );
    expect(fact).toEqual({ kind: "no_injury", sourceEventId: source?.eventId });
    expect(source?.kind).toBe("battle_ended");
  });

  it("applies Bruised to Punish setup with exact current and maximum health changes", () => {
    const pressure = defaultPressureResult();
    const condition = deriveAftermath(pressure);
    expect(condition.kind).toBe("bruised");
    if (condition.kind !== "bruised") {
      throw new Error("Fixture must produce Bruised");
    }

    const punish = simulateBattle(
      command({
        encounterId: "punish_front",
        formation: DEFAULT_PRESSURE_FORMATION,
        teamPolicy: "hold_front",
        frontEquipment: "heavy_pad",
        priorCondition: condition,
      }),
    );
    const applied = punish.events.find(
      (event): event is Extract<BattleEvent, { kind: "condition_applied" }> =>
        event.kind === "condition_applied",
    );
    const source = pressure.events.find((event) => event.eventId === condition.sourceEventId);
    const currentCause = punish.events.find((event) => event.eventId === applied?.causedByEventId);

    expect(source?.kind).toBe("unit_defeated");
    expect(applied).toEqual(
      expect.objectContaining({
        sourceEventId: condition.sourceEventId,
        targetId: condition.heroId,
        healthPenalty: 12,
        maxHealthBefore: 84,
        maxHealthAfter: 72,
        healthBefore: 84,
        healthAfter: 72,
      }),
    );
    expect(currentCause?.kind).toBe("battle_started");
  });

  it("changes only prior condition to produce visible Punish state", () => {
    const condition = deriveAftermath(defaultPressureResult());
    if (condition.kind !== "bruised") {
      throw new Error("Fixture must produce Bruised");
    }
    const input = {
      encounterId: "punish_front" as const,
      formation: DEFAULT_PRESSURE_FORMATION,
      teamPolicy: "hold_front" as const,
      frontEquipment: "heavy_pad" as const,
    };
    const healthy = simulateBattle(command({ ...input, priorCondition: null }));
    const bruised = simulateBattle(command({ ...input, priorCondition: condition }));
    const healthyBo = healthy.finalUnits.find((unit) => unit.id === condition.heroId);
    const bruisedBo = bruised.finalUnits.find((unit) => unit.id === condition.heroId);

    if (!healthyBo || !bruisedBo) {
      throw new Error("Condition target must exist in both results");
    }
    expect(bruised.events.some((event) => event.kind === "condition_applied")).toBe(true);
    expect(healthy.events.some((event) => event.kind === "condition_applied")).toBe(false);
    expect(healthyBo.maxHealth - bruisedBo.maxHealth).toBe(12);
    expect(bruised.finalUnits).not.toEqual(healthy.finalUnits);
  });

  it("does not apply a prior condition to Pressure", () => {
    const condition = deriveAftermath(defaultPressureResult());
    if (condition.kind !== "bruised") {
      throw new Error("Fixture must produce Bruised");
    }
    const healthy = simulateBattle(
      command({
        encounterId: "pressure_rear",
        formation: COVER_PRESSURE_FORMATION,
        teamPolicy: "cover_rear",
        priorCondition: null,
      }),
    );
    const ignored = simulateBattle(
      command({
        encounterId: "pressure_rear",
        formation: COVER_PRESSURE_FORMATION,
        teamPolicy: "cover_rear",
        priorCondition: condition,
      }),
    );

    expect(ignored.events.some((event) => event.kind === "condition_applied")).toBe(false);
    expect(ignored.events).toEqual(healthy.events);
    expect(ignored.finalUnits).toEqual(healthy.finalUnits);
  });

  it("replays the same prior condition identically", () => {
    const condition = deriveAftermath(defaultPressureResult());
    if (condition.kind !== "bruised") {
      throw new Error("Fixture must produce Bruised");
    }
    const input = command({
      encounterId: "punish_front",
      formation: DEFAULT_PRESSURE_FORMATION,
      teamPolicy: "hold_front",
      frontEquipment: "quick_shoes",
      priorCondition: condition,
    });

    expect(simulateBattle(input)).toEqual(simulateBattle(input));
  });
});
