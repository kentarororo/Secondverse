import { describe, expect, it } from "vitest";
import { candidateCoreBuildKey, draftCandidateRoster, type CandidateDraft, type DraftRosterCommand } from "../../src/candidates";
import { simulateCandidateTrial, type StartCandidateTrialCommand } from "../../src/candidateTrial";

function commandFor(draftCommand:DraftRosterCommand,candidate:CandidateDraft):StartCandidateTrialCommand{
  return {type:"start_candidate_trial",version:1,scenarioId:"three_person_training_v1",battleSeed:`battle:${candidate.semanticFingerprint.hash}`,draftCommand,candidateId:candidate.candidateId};
}

describe("candidate trial generated coverage",()=>{
  it("executes and terminates all 36 generated chassis-signature-loadout builds",()=>{
    const samples=new Map<string,{draftCommand:DraftRosterCommand;candidate:CandidateDraft}>();
    for(let seed=0;seed<120&&samples.size<36;seed+=1){
      const draftCommand:DraftRosterCommand={type:"draft_candidate_roster",version:1,poolVersion:1,seed:`trial-matrix-${seed}`,count:3};
      const draft=draftCandidateRoster(draftCommand);
      if(draft.status!=="ok") continue;
      for(const candidate of draft.candidates){
        const key=candidateCoreBuildKey(candidate);
        if(!samples.has(key)) samples.set(key,{draftCommand,candidate});
      }
    }
    expect(samples.size).toBe(36);
    for(const [key,sample] of samples){
      const result=simulateCandidateTrial(commandFor(sample.draftCommand,sample.candidate));
      expect(result.actionCount,key).toBeLessThanOrEqual(72);
      expect(result.events.at(-1)?.kind,key).toBe("trial_ended");
      expect(result.ruleActivations,key).toHaveLength(3);
      expect(result.ruleActivations.every((summary)=>summary.activationCount>0||summary.notTriggeredReason!==null),key).toBe(true);
    }
  });

  it("runs every candidate from the 100-seed diagnostic sample without an unsupported profile",()=>{
    const seen={signatures:new Set<string>(),advantages:new Set<string>(),risks:new Set<string>(),techniques:new Set<string>()};
    let simulated=0;
    for(let seed=0;seed<100;seed+=1){
      const draftCommand:DraftRosterCommand={type:"draft_candidate_roster",version:1,poolVersion:1,seed:`candidate-diagnostic-${seed}`,count:3};
      const draft=draftCandidateRoster(draftCommand);
      expect(draft.status).toBe("ok");
      if(draft.status!=="ok") continue;
      for(const candidate of draft.candidates){
        const result=simulateCandidateTrial(commandFor(draftCommand,candidate));
        expect(result.events.at(-1)?.kind,candidate.candidateId).toBe("trial_ended");
        expect(result.actionCount,candidate.candidateId).toBeLessThanOrEqual(72);
        seen.signatures.add(candidate.signatureId);seen.advantages.add(candidate.advantageId);
        seen.risks.add(candidate.complicationId);candidate.techniqueIds.forEach((id)=>seen.techniques.add(id));
        simulated+=1;
      }
    }
    expect(simulated).toBe(300);
    expect(seen.signatures.size).toBe(12);expect(seen.advantages.size).toBe(12);
    expect(seen.risks.size).toBe(12);expect(seen.techniques.size).toBe(18);
  });
});
