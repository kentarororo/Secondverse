import { draftCandidateRoster, type CandidateDraft, type DraftRosterCommand } from "../../src/candidates";
import type { StartCandidateTrialCommand } from "../../src/candidateTrial";

export const trialDraftCommand: DraftRosterCommand = {
  type:"draft_candidate_roster", version:1, poolVersion:1, seed:"candidate-trial-fixture", count:3,
};

export function trialCommand(candidateIndex:0|1|2=0,battleSeed="candidate-trial-battle"):StartCandidateTrialCommand {
  const draft=draftCandidateRoster(trialDraftCommand);
  if(draft.status!=="ok") throw new Error("Candidate trial fixture draft failed");
  return {
    type:"start_candidate_trial",version:1,scenarioId:"three_person_training_v1",battleSeed,
    draftCommand:trialDraftCommand,candidateId:draft.candidates[candidateIndex].candidateId,
  };
}

export function findGeneratedCandidate(
  predicate:(candidate:CandidateDraft)=>boolean,
  limit=800,
):{readonly draftCommand:DraftRosterCommand;readonly candidate:CandidateDraft}{
  for(let seed=0;seed<limit;seed+=1){
    const draftCommand:DraftRosterCommand={type:"draft_candidate_roster",version:1,poolVersion:1,seed:`candidate-trial-search-${seed}`,count:3};
    const draft=draftCandidateRoster(draftCommand);
    if(draft.status!=="ok") continue;
    const candidate=draft.candidates.find(predicate);
    if(candidate) return {draftCommand,candidate};
  }
  throw new Error("No generated candidate matched the trial fixture predicate");
}

export function commandForCandidate(
  fixture:{readonly draftCommand:DraftRosterCommand;readonly candidate:CandidateDraft},
  battleSeed="candidate-trial-mechanics",
):StartCandidateTrialCommand{
  return {type:"start_candidate_trial",version:1,scenarioId:"three_person_training_v1",battleSeed,draftCommand:fixture.draftCommand,candidateId:fixture.candidate.candidateId};
}
