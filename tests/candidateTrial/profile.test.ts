import { describe, expect, it } from "vitest";
import { draftCandidateRoster } from "../../src/candidates";
import { deriveCandidateCombatProfile } from "../../src/candidateTrial";
import { trialDraftCommand } from "./fixtures";

describe("candidate combat profile v1",()=>{
  it("surfaces the exact fixed formula and excludes growth",()=>{
    const draft=draftCandidateRoster(trialDraftCommand);
    if(draft.status!=="ok") throw new Error("Expected fixture draft");
    for(const candidate of draft.candidates){
      const profile=deriveCandidateCombatProfile(candidate);
      expect(profile).toMatchObject({
        maxHealth:candidate.stats.vitality*8,
        power:candidate.stats.power,
        defence:Math.floor(candidate.stats.guard/2),
        speed:candidate.stats.speed,
        guardCap:candidate.stats.guard*2,
        startingTechniquePoints:candidate.stats.focus>=14?1:0,
        formulaFacts:{version:1,growthApplied:false},
      });
    }
  });
});
