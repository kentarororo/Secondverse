import { describe, expect, it } from "vitest";
import { simulateBattle, type EncounterId, type StartBattleCommand } from "../../src/sim";
import { eventDurationMs } from "../../src/ui/presentation";

const seeds: Readonly<Record<EncounterId, string>> = {
  pressure_rear: "lab-pressure-v1",
  punish_front: "lab-front-v1",
};

describe("normal-speed presentation timing", () => {
  for (const encounterId of ["pressure_rear", "punish_front"] as const) {
    it(`keeps ${encounterId} inside the 55 to 70 second target`, () => {
      const command: StartBattleCommand = {
        type: "start_battle",
        version: 1,
        seed: seeds[encounterId],
        encounterId,
        plan: {
          formation: { front: "ada", middle: "cy", rear: "bo" },
          teamPolicy: "hold_front",
          techniquePolicies: {
            ada: "wait_for_need",
            bo: "use_early",
            cy: "wait_for_need",
          },
          frontEquipment: encounterId === "pressure_rear" ? "none" : "heavy_pad",
          priorCondition: null,
        },
      };
      const result = simulateBattle(command);
      const seconds =
        result.events.reduce((total, event) => total + eventDurationMs(event, false), 0) / 1000;

      expect(seconds).toBeGreaterThanOrEqual(55);
      expect(seconds).toBeLessThanOrEqual(70);
    });
  }
});
