import { describe, expect, it } from "vitest";
import { simulateCandidateTrial, type CandidateTrialEvent } from "../../src/candidateTrial";
import { trialCommand } from "./fixtures";

describe("candidate training trial",()=>{
  it("replays one generated candidate as an identical serializable bounded battle",()=>{
    const command=trialCommand();
    const first=simulateCandidateTrial(command);
    const second=simulateCandidateTrial(structuredClone(command));
    expect(second).toEqual(first);
    expect(JSON.parse(JSON.stringify(first))).toEqual(first);
    expect(first.actionCount).toBeLessThanOrEqual(72);
    expect(first.events.at(-1)?.kind).toBe("trial_ended");
    expect(first.initialUnits).toHaveLength(6);
    expect(first.initialUnits.every((unit) => !unit.broken)).toBe(true);
    expect(first.ruleActivations).toHaveLength(3);
  });

  it("keeps every causal link backward",()=>{
    const result=simulateCandidateTrial(trialCommand());
    const sequences=new Map(result.events.map((event)=>[event.eventId,event.sequence]));
    for(const event of result.events){
      if("causedByEventId" in event){
        expect(sequences.get(event.causedByEventId),event.eventId).toBeLessThan(event.sequence);
      }
    }
    const actions=result.events.filter((event):event is Extract<CandidateTrialEvent,{kind:"action_started"}>=>event.kind==="action_started");
    expect(actions).toHaveLength(result.actionCount);
  });

  it("rejects a candidate outside the referenced deterministic draft",()=>{
    expect(()=>simulateCandidateTrial({...trialCommand(),candidateId:"candidate-not-in-draft"})).toThrow(/not present/i);
  });
});
