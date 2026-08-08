import { describe, expect, it } from "vitest";
import {
  MAX_CANDIDATE_ATTEMPTS,
  MIN_ROSTER_SEMANTIC_DISTANCE,
  draftCandidateRoster,
  parseDraftRosterResult,
  semanticDistance,
  validateCandidateCompatibility,
  type DraftRosterCommand,
} from "../../src/candidates";

const command: DraftRosterCommand = {
  type: "draft_candidate_roster",
  version: 1,
  poolVersion: 1,
  seed: "candidate-regression-17",
  count: 3,
};

describe("candidate generation", () => {
  it("replays the same seed as an identical serializable roster", () => {
    const first = draftCandidateRoster(command);
    const second = draftCandidateRoster(structuredClone(command));
    expect(second).toEqual(first);
    expect(JSON.parse(JSON.stringify(first))).toEqual(first);
    expect(parseDraftRosterResult(first)).toEqual(first);
  });

  it("returns three compatible whole candidates with meaningful semantic distance", () => {
    const result = draftCandidateRoster(command);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(new Set(result.candidates.map((candidate) => candidate.identity.identityId)).size).toBe(3);

    expect(result.candidates).toHaveLength(3);
    expect(new Set(result.candidates.map((candidate) => candidate.candidateId)).size).toBe(3);
    expect(new Set(result.candidates.map((candidate) => candidate.semanticFingerprint.key)).size).toBe(3);
    for (const candidate of result.candidates) {
      expect(candidate.status).toBe("lab_only_not_fieldable");
      expect(candidate.techniqueIds).toHaveLength(2);
      expect(validateCandidateCompatibility(candidate)).toEqual([]);
      expect(candidate.candidateId).toContain(candidate.semanticFingerprint.hash);
    }
    for (let left = 0; left < result.candidates.length; left += 1) {
      for (let right = left + 1; right < result.candidates.length; right += 1) {
        expect(semanticDistance(result.candidates[left]!, result.candidates[right]!))
          .toBeGreaterThanOrEqual(MIN_ROSTER_SEMANTIC_DISTANCE);
      }
    }
    expect(Math.max(...result.attemptsBySlot)).toBeLessThanOrEqual(MAX_CANDIDATE_ATTEMPTS);
  });

  it("keeps cosmetics outside the semantic fingerprint", () => {
    const result = draftCandidateRoster(command);
    if (result.status !== "ok") throw new Error("Expected candidate roster");
    const candidate = result.candidates[0];
    const cosmeticVariant = {
      ...candidate,
      identity: { identityId: "identity_24" as const, displayName: "Yara" },
      visualProfileId: candidate.visualProfileId === "guard_light" ? "guard_medium" as const : "guard_light" as const,
    };
    expect(semanticDistance(candidate, cosmeticVariant)).toBe(0);
    expect(cosmeticVariant.semanticFingerprint).toEqual(candidate.semanticFingerprint);
  });

  it("uses seed changes to produce a different mechanical roster", () => {
    const first = draftCandidateRoster(command);
    const second = draftCandidateRoster({ ...command, seed: "candidate-regression-18" });
    expect(second).not.toEqual(first);
    if (first.status === "ok" && second.status === "ok") {
      expect(second.candidates.map((value) => value.semanticFingerprint.key))
        .not.toEqual(first.candidates.map((value) => value.semanticFingerprint.key));
    }
  });
});
