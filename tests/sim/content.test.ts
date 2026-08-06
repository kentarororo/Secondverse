import { describe, expect, it } from "vitest";
import {
  AUTHORED_TRIO,
  ENCOUNTERS,
  ENEMIES,
  parseHeroBlueprint,
  parseStartBattleCommand,
} from "../../src/content";
import { command } from "./fixtures";

describe("runtime content validation", () => {
  it("loads the authored trio and encounter pair through their schemas", () => {
    expect(AUTHORED_TRIO).toHaveLength(3);
    expect(Object.keys(ENCOUNTERS)).toEqual(["pressure_rear", "punish_front"]);
    expect(Object.keys(ENEMIES)).toHaveLength(6);
  });

  it("rejects an invalid formation", () => {
    const invalid = {
      ...command(),
      plan: {
        ...command().plan,
        formation: { front: "ada", middle: "ada", rear: "cy" },
      },
    };
    expect(() => parseStartBattleCommand(invalid)).toThrow(/exactly one formation slot/);
  });

  it("requires a known explicit equipment decision", () => {
    const missingEquipment = structuredClone(command()) as unknown as Record<string, unknown>;
    const missingPlan = missingEquipment.plan as Record<string, unknown>;
    delete missingPlan.frontEquipment;
    expect(() => parseStartBattleCommand(missingEquipment)).toThrow();

    const invalidEquipment = structuredClone(command()) as unknown as Record<string, unknown>;
    const invalidPlan = invalidEquipment.plan as Record<string, unknown>;
    invalidPlan.frontEquipment = "mystery_item";
    expect(() => parseStartBattleCommand(invalidEquipment)).toThrow();
  });

  it("requires a nullable prior condition and validates its exact penalty", () => {
    const missingCondition = structuredClone(command()) as unknown as Record<string, unknown>;
    const missingPlan = missingCondition.plan as Record<string, unknown>;
    delete missingPlan.priorCondition;
    expect(() => parseStartBattleCommand(missingCondition)).toThrow();

    const invalidCondition = structuredClone(command()) as unknown as Record<string, unknown>;
    const invalidPlan = invalidCondition.plan as Record<string, unknown>;
    invalidPlan.priorCondition = {
      kind: "bruised",
      heroId: "bo",
      healthPenalty: 11,
      sourceEventId: "event-0010",
    };
    expect(() => parseStartBattleCommand(invalidCondition)).toThrow();
  });

  it("rejects content outside the tuning bounds", () => {
    expect(() =>
      parseHeroBlueprint({
        id: "ada",
        name: "Ada",
        role: "guard",
        stats: { maxHealth: -1, power: 13, defence: 9, speed: 10, guardCap: 40 },
        technique: "brace",
        techniqueName: "Brace",
        signatureName: "Step In",
      }),
    ).toThrow();
  });
});
