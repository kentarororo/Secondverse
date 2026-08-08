import { describe, expect, it } from "vitest";
import { simulateBattle, type BattleResult, type HeroStanceId } from "../../src/sim";
import { deriveBattleCausalReport } from "../../src/ui/battleCausalReport";
import { command } from "../sim/fixtures";

function evidenceExists(result: BattleResult, eventIds: readonly string[]): boolean {
  const resultIds = new Set(result.events.map((event) => event.eventId));
  return eventIds.length > 0 && eventIds.every((eventId) => resultIds.has(eventId));
}

describe("battle causal report", () => {
  it("reports the selected Pressure and Punish plans from their recorded events", () => {
    const results = [
      simulateBattle(
        command({
          encounterId: "pressure_rear",
          seed: "causal-pressure",
          formation: { front: "cy", middle: "ada", rear: "bo" },
          teamPolicy: "cover_rear",
          stanceOverrides: {
            ada: "ada_brace_under_pressure",
            bo: "bo_finish_weak",
            cy: "cy_aid_two",
          },
        }),
      ),
      simulateBattle(
        command({
          encounterId: "punish_front",
          seed: "causal-punish",
          teamPolicy: "hold_front",
          stanceOverrides: {
            ada: "ada_brace_early",
            bo: "bo_hit_front",
            cy: "cy_aid_one",
          },
        }),
      ),
    ];

    for (const result of results) {
      const report = deriveBattleCausalReport(result);
      const selected = result.command.plan.stances;

      expect(report.policy.id).toBe(result.command.plan.teamPolicy);
      expect(report.policy.ruleText).not.toBe("");
      expect(report.stances.map((entry) => entry.id)).toEqual([
        selected.ada,
        selected.bo,
        selected.cy,
      ]);
      expect(report.stances.every((entry) => entry.ruleText.length > 0)).toBe(true);
      expect(evidenceExists(result, report.policy.evidenceEventIds)).toBe(true);
      expect(report.stances.every((entry) => evidenceExists(result, entry.evidenceEventIds))).toBe(
        true,
      );
      expect(report.turningPoint.eventId).toBe(result.highlights.turningPointEventId);
      expect(report.turningPoint.evidenceEventIds).toEqual([report.turningPoint.eventId]);
      expect(report.turningPoint.text).not.toBe("");

      for (const entry of report.stances) {
        const rawCount = result.events.filter(
          (event) => event.kind === "stance_used" && event.stanceId === entry.id,
        ).length;
        expect(entry.activationCount).toBe(rawCount);
        expect(entry.status).toBe(rawCount > 0 ? "activated" : "not_activated");
      }
    }
  });

  it("links activated policy and stance outcomes to their causal event chains", () => {
    const result = simulateBattle(
      command({
        encounterId: "pressure_rear",
        seed: "causal-pressure",
        formation: { front: "cy", middle: "ada", rear: "bo" },
        teamPolicy: "cover_rear",
        stanceOverrides: {
          ada: "ada_brace_under_pressure",
          bo: "bo_finish_weak",
          cy: "cy_aid_two",
        },
      }),
    );
    const report = deriveBattleCausalReport(result);
    const targetChange = result.events.find((event) => event.kind === "target_changed");
    const activatedStance = report.stances.find((entry) => entry.activationCount > 0);

    expect(report.policy).toMatchObject({
      id: "cover_rear",
      status: "activated",
      activationCount: expect.any(Number),
      nonUseReason: null,
    });
    expect(report.policy.activationCount).toBeGreaterThan(0);
    expect(report.policy.evidenceEventIds).toContain(targetChange?.eventId);
    expect(report.policy.observedOutcome).toContain("changed target");
    expect(activatedStance).toBeDefined();
    expect(activatedStance?.nonUseReason).toBeNull();
    expect(activatedStance?.observedOutcome).toMatch(/HP|Guard|Points/);
    expect(activatedStance?.evidenceEventIds).toContain(activatedStance?.eventId);
  });

  it("gives an unused selected stance only the narrow reason recorded by its last option check", () => {
    const candidates = [
      command({
        encounterId: "pressure_rear",
        seed: "unused-1",
        formation: { front: "ada", middle: "bo", rear: "cy" },
        teamPolicy: "hold_front",
        stanceOverrides: { cy: "cy_aid_two" },
      }),
      command({
        encounterId: "punish_front",
        seed: "unused-2",
        stanceOverrides: { cy: "cy_aid_two", bo: "bo_finish_weak" },
      }),
    ];
    const reports = candidates.map((candidate) =>
      deriveBattleCausalReport(simulateBattle(candidate)),
    );
    const unused = reports
      .flatMap((report) => [...report.stances])
      .find((entry) => entry.activationCount === 0);

    expect(unused).toBeDefined();
    expect(unused).toMatchObject({ status: "not_activated", activationCount: 0 });
    expect(unused?.nonUseReason).not.toBeNull();
    expect([
      "not_enough_points",
      "condition_not_met",
      "no_injured_ally",
      "no_action_window",
    ]).toContain(unused?.nonUseReason?.code);
    expect(unused?.eventId).toBe(unused?.nonUseReason?.eventId);
    expect(unused?.evidenceEventIds).toEqual([unused?.eventId]);
  });

  it("is deterministic and does not mutate the authoritative battle result", () => {
    const result = simulateBattle(command({ seed: "causal-repeat" }));
    const before = JSON.stringify(result);
    const first = deriveBattleCausalReport(result);
    const second = deriveBattleCausalReport(result);

    expect(first).toEqual(second);
    expect(JSON.stringify(result)).toBe(before);
  });

  it("reports each selected stance rather than any unselected alternative", () => {
    const result = simulateBattle(
      command({
        stanceOverrides: {
          ada: "ada_brace_under_pressure",
          bo: "bo_finish_weak",
          cy: "cy_aid_two",
        },
      }),
    );
    const reportIds = deriveBattleCausalReport(result).stances.map((entry) => entry.id);
    const unusedAlternatives: readonly HeroStanceId[] = [
      "ada_brace_early",
      "bo_hit_front",
      "cy_aid_one",
    ];

    expect(reportIds).toEqual([
      "ada_brace_under_pressure",
      "bo_finish_weak",
      "cy_aid_two",
    ]);
    expect(reportIds.some((id) => unusedAlternatives.includes(id))).toBe(false);
  });
});
