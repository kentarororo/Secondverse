import { describe, expect, it } from "vitest";
import { simulateBattle, type EncounterId, type StartBattleCommand } from "../../src/sim";
import {
  deriveBattleMoments,
  momentDurationMs,
  selectPlaybackMoments,
} from "../../src/ui/moments";

const seeds: Readonly<Record<EncounterId, string>> = {
  pressure_rear: "lab-pressure-v1",
  punish_front: "lab-front-v1",
};

describe("normal-speed presentation timing", () => {
  for (const encounterId of ["pressure_rear", "punish_front"] as const) {
    it(`keeps ${encounterId} key playback inside the 35 to 75 second target`, () => {
      const command: StartBattleCommand = {
        type: "start_battle",
        version: 1,
        seed: seeds[encounterId],
        encounterId,
        plan: {
          formation: { front: "ada", middle: "cy", rear: "bo" },
          teamPolicy: "hold_front",
          stances: {
            ada: "ada_brace_under_pressure",
            bo: "bo_hit_front",
            cy: "cy_aid_one",
          },
          frontEquipment: encounterId === "pressure_rear" ? "none" : "heavy_pad",
          priorCondition: null,
        },
      };
      const result = simulateBattle(command);
      const playback = selectPlaybackMoments(result, "key");
      const seconds =
        playback.reduce(
          (total, entry) => total + momentDurationMs(entry.moment, false),
          0,
        ) / 1000;

      expect(seconds).toBeGreaterThanOrEqual(35);
      expect(seconds).toBeLessThanOrEqual(75);
      expect(playback.length).toBeLessThan(deriveBattleMoments(result).length);
    });
  }

  it("holds key facts for reading and keeps routine grouped actions brief", () => {
    const result = simulateBattle({
      type: "start_battle",
      version: 1,
      seed: seeds.pressure_rear,
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
    });
    const actions = deriveBattleMoments(result).filter((moment) => moment.kind === "action");
    const routine = actions.find((moment) => moment.focusKind === "anchor");
    const stance = actions.find((moment) => moment.focusKind === "stance");
    const decisive = actions.find((moment) => moment.focusKind === "decisive");

    expect(routine).toBeDefined();
    expect(stance).toBeDefined();
    expect(decisive).toBeDefined();
    if (!routine || !stance || !decisive) return;
    expect(momentDurationMs(routine, false)).toBeGreaterThanOrEqual(800);
    expect(momentDurationMs(routine, false)).toBeLessThanOrEqual(1000);
    expect(momentDurationMs(stance, false)).toBeGreaterThanOrEqual(2000);
    expect(momentDurationMs(stance, false)).toBeLessThanOrEqual(2800);
    expect(momentDurationMs(decisive, false)).toBeGreaterThanOrEqual(2000);
    expect(momentDurationMs(decisive, false)).toBeLessThanOrEqual(2800);
    expect(momentDurationMs(routine, true)).toBeGreaterThanOrEqual(1500);
    expect(momentDurationMs(stance, true)).toBeGreaterThanOrEqual(1500);
    expect(momentDurationMs(decisive, true)).toBeGreaterThanOrEqual(1500);
  });
});
