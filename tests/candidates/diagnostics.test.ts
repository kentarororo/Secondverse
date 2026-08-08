import { describe, expect, it } from "vitest";
import {
  CANDIDATE_DIAGNOSTIC_THRESHOLDS,
  candidateDiagnosticFailures,
  diagnoseCandidateDrafts,
} from "../../src/candidates";

describe("candidate 100-seed diagnostics", () => {
  it("produces broad mechanical coverage without cosmetic credit", () => {
    const report = diagnoseCandidateDrafts({
      seedPrefix: "candidate-diagnostic",
      seedCount: 100,
    });

    expect(report.seedCount).toBe(100);
    expect(report.successCount).toBe(100);
    expect(report.candidateCount).toBe(300);
    expect(report.minimumRosterDistance).toBeGreaterThanOrEqual(3);
    expect(report.uniqueFingerprintCount)
      .toBeGreaterThanOrEqual(CANDIDATE_DIAGNOSTIC_THRESHOLDS.minimumUniqueFingerprints);
    expect(candidateDiagnosticFailures(report), JSON.stringify(report)).toEqual([]);
  });
});
