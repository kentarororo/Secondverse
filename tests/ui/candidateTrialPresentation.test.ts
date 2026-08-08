import { describe, expect, it } from "vitest";
import { simulateCandidateTrial } from "../../src/candidateTrial";
import {
  candidateTrialMomentDeltas,
  candidateTrialMomentSummary,
  selectCandidateTrialMoments,
} from "../../src/ui/candidateTrialPresentation";
import { commandForCandidate, findGeneratedCandidate } from "../candidateTrial/fixtures";

function ruleMoment(
  result: ReturnType<typeof simulateCandidateTrial>,
  sourceId: string,
) {
  const moment = selectCandidateTrialMoments(result).find((candidate) => {
    const event = result.events[candidate.startEventIndex];
    return event?.kind === "candidate_rule_triggered" && event.source.sourceId === sourceId;
  });
  if (!moment) throw new Error(`Missing ${sourceId} rule moment`);
  return { result, moment };
}

describe("candidate trial causal summaries", () => {
  it("credits Measured combo only with the Points it caused", () => {
    const fixture = findGeneratedCandidate((candidate) => candidate.advantageId === "measured_combo");
    const trial = ruleMoment(
      simulateCandidateTrial(commandForCandidate(fixture, "measured-combo-presentation")),
      "measured_combo",
    );

    const deltas = candidateTrialMomentDeltas(trial.result, trial.moment);
    expect(deltas.length).toBeGreaterThan(0);
    expect(deltas.every((delta) => delta.unitId === fixture.candidate.candidateId)).toBe(true);
    expect([...new Set(deltas.map((delta) => delta.kind))]).toEqual(["Points"]);
    expect(candidateTrialMomentSummary(trial.result, trial.moment).outcome).toMatch(/^.+ Points \+1 /);
  });

  it("does not pull unrelated HP or Guard changes into Shared strain", () => {
    const fixture = findGeneratedCandidate((candidate) => candidate.complicationId === "shared_strain");
    const trial = ruleMoment(
      simulateCandidateTrial(commandForCandidate(fixture, "shared-strain-presentation")),
      "shared_strain",
    );

    const deltas = candidateTrialMomentDeltas(trial.result, trial.moment);
    expect(deltas.length).toBeGreaterThan(0);
    expect(deltas.every((delta) => delta.unitId === fixture.candidate.candidateId)).toBe(true);
    expect([...new Set(deltas.map((delta) => delta.kind))]).toEqual(["Strain"]);
    expect(candidateTrialMomentSummary(trial.result, trial.moment).outcome).not.toMatch(/ HP | Guard /);
  });
});
