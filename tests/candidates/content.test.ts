import { describe, expect, it } from "vitest";
import {
  CANDIDATE_CONTENT,
  CANDIDATE_REGISTRY,
  draftRosterCommandSchema,
  validateCandidateDomainContent,
} from "../../src/candidates";

function words(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

describe("candidate content", () => {
  it("meets the first laboratory pool minimums with valid compatibility references", () => {
    expect(CANDIDATE_CONTENT.chassis).toHaveLength(3);
    expect(CANDIDATE_CONTENT.growthCurves).toHaveLength(6);
    expect(CANDIDATE_CONTENT.signatures).toHaveLength(12);
    expect(CANDIDATE_CONTENT.advantages).toHaveLength(12);
    expect(CANDIDATE_CONTENT.complications).toHaveLength(12);
    expect(CANDIDATE_CONTENT.temperaments).toHaveLength(6);
    expect(CANDIDATE_CONTENT.potentialTells).toHaveLength(12);
    expect(CANDIDATE_CONTENT.techniques).toHaveLength(18);
    expect(CANDIDATE_CONTENT.loadouts).toHaveLength(12);
    expect(CANDIDATE_CONTENT.identities).toHaveLength(24);
    expect(CANDIDATE_CONTENT.visualProfiles).toHaveLength(9);
    expect(validateCandidateDomainContent()).toEqual([]);
  });

  it("publishes stable definition arrays for the UI", () => {
    expect(CANDIDATE_REGISTRY.chassis).toBe(CANDIDATE_CONTENT.chassis);
    expect(CANDIDATE_REGISTRY.techniques).toBe(CANDIDATE_CONTENT.techniques);
    expect(CANDIDATE_REGISTRY.visualProfiles).toBe(CANDIDATE_CONTENT.visualProfiles);
  });

  it("keeps every player sentence whole and between eight and thirty words", () => {
    const ruleText = [
      ...CANDIDATE_CONTENT.chassis.map((value) => value.rulesText),
      ...CANDIDATE_CONTENT.growthCurves.map((value) => value.rulesText),
      ...CANDIDATE_CONTENT.signatures.map((value) => value.rulesText),
      ...CANDIDATE_CONTENT.advantages.map((value) => value.rulesText),
      ...CANDIDATE_CONTENT.complications.map((value) => value.rulesText),
      ...CANDIDATE_CONTENT.temperaments.map((value) => value.rulesText),
      ...CANDIDATE_CONTENT.techniques.map((value) => value.rulesText),
      ...CANDIDATE_CONTENT.potentialTells.map((value) => value.text),
    ];
    for (const text of ruleText) {
      expect(words(text), text).toBeGreaterThanOrEqual(8);
      expect(words(text), text).toBeLessThanOrEqual(30);
      expect(text, text).toMatch(/[.!?]$/u);
      expect(text, text).not.toMatch(/^(Starts|Spend|After|At |When |Uses|Waits|Accepts|Prioritizes)/u);
    }
  });

  it("requires the fixed three-candidate versioned command", () => {
    expect(() => draftRosterCommandSchema.parse({
      type: "draft_candidate_roster", version: 1, poolVersion: 1, seed: "valid", count: 2,
    })).toThrow();
  });

  it("uses canonical combat terms and executable timing in player rules",()=>{
    const mechanicalText=[
      ...CANDIDATE_CONTENT.signatures.map((value)=>value.rulesText),
      ...CANDIDATE_CONTENT.advantages.map((value)=>value.rulesText),
      ...CANDIDATE_CONTENT.complications.map((value)=>value.rulesText),
      ...CANDIDATE_CONTENT.temperaments.map((value)=>value.rulesText),
      ...CANDIDATE_CONTENT.techniques.map((value)=>value.rulesText),
    ];
    for(const text of mechanicalText){
      expect(text).not.toMatch(/technique points?|\bhealth\b|\bcycle\b|\bturn\b/iu);
    }
    expect(CANDIDATE_CONTENT.techniques.every((value)=>value.rulesText.startsWith("This technique"))).toBe(true);
    const scopedEffects=[...CANDIDATE_CONTENT.signatures,...CANDIDATE_CONTENT.advantages,...CANDIDATE_CONTENT.complications]
      .map((value)=>value.rule.effect)
      .concat(CANDIDATE_CONTENT.techniques.flatMap((value)=>value.effects));
    for(const effect of scopedEffects){
      if(effect.kind==="bonus_power"||effect.kind==="force_target") expect(effect.timing).toBeTruthy();
    }
  });
});
