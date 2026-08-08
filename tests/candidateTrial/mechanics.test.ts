import { describe, expect, it } from "vitest";
import { simulateCandidateTrial, type CandidateTrialEvent } from "../../src/candidateTrial";
import { commandForCandidate, findGeneratedCandidate, trialCommand } from "./fixtures";

function events<Kind extends CandidateTrialEvent["kind"]>(
  result:ReturnType<typeof simulateCandidateTrial>,kind:Kind,
):Extract<CandidateTrialEvent,{kind:Kind}>[]{
  return result.events.filter((event):event is Extract<CandidateTrialEvent,{kind:Kind}>=>event.kind===kind);
}

describe("candidate executable mechanics",()=>{
  it("keeps Basic momentum through Building rhythm and spends it on the next technique attack",()=>{
    const fixture=findGeneratedCandidate((candidate)=>
      candidate.signatureId==="basic_momentum"&&candidate.advantageId==="measured_combo"&&
      candidate.techniqueIds[0]==="building_rhythm"&&candidate.techniqueIds[1]==="focused_strike"&&
      ["steady","bold","decisive"].includes(candidate.temperamentId),
    );
    const result=simulateCandidateTrial(commandForCandidate(fixture,"favorite-ramp"));
    const building=events(result,"technique_used").find((event)=>event.techniqueId==="building_rhythm");
    const focused=events(result,"technique_used").find((event)=>event.techniqueId==="focused_strike"&&event.sequence>(building?.sequence??-1));
    expect(building).toBeDefined();
    expect(focused).toBeDefined();
    const pendingAfterBuilding=events(result,"pending_bonus_changed").filter((event)=>event.sequence<(focused?.sequence??0));
    expect(pendingAfterBuilding.some((event)=>event.timing==="next_technique"&&event.after>=4)).toBe(true);
    expect(pendingAfterBuilding.some((event)=>event.reason==="consumed"&&event.sequence>(building?.sequence??0))).toBe(false);
    const consumed=events(result,"pending_bonus_changed").find((event)=>event.reason==="consumed"&&event.timing==="next_technique"&&event.sequence>(focused?.sequence??0));
    const damage=events(result,"damage_applied").find((event)=>event.actionId==="focused_strike"&&event.sequence>(focused?.sequence??0));
    expect(consumed?.applied).toBeLessThanOrEqual(-4);
    expect(damage?.actionPower).toBeGreaterThanOrEqual(16);
  });

  it("turns Slow recovery guard absorption into once-per-round Strain and an exact Break",()=>{
    const fixture=findGeneratedCandidate((candidate)=>candidate.complicationId==="slow_recovery"&&candidate.chassisId==="guard_frame");
    const result=simulateCandidateTrial(commandForCandidate(fixture,"slow-recovery-break"));
    const risk=result.ruleActivations.find((summary)=>summary.sourceKind==="risk");
    const strain=events(result,"strain_changed").filter((event)=>event.requested===1);
    const breaks=events(result,"break_applied");
    expect(risk?.activationCount).toBeGreaterThanOrEqual(3);
    expect(new Set(strain.map((event)=>event.round)).size).toBe(strain.length);
    expect(breaks).toContainEqual(expect.objectContaining({defencePenalty:3}));
  });

  it("makes trial-only ally protection reach the candidate's after-intercept rule",()=>{
    const fixture=findGeneratedCandidate((candidate)=>candidate.signatureId==="rescue_power");
    let result=simulateCandidateTrial(commandForCandidate(fixture,"intercept-reachable"));
    if(events(result,"intercepted").length===0){
      for(let seed=0;seed<80&&events(result,"intercepted").length===0;seed+=1){
        result=simulateCandidateTrial(commandForCandidate(fixture,`intercept-reachable-${seed}`));
      }
    }
    const intercept=events(result,"intercepted")[0];
    const signature=events(result,"candidate_rule_triggered").find((event)=>event.source.sourceKind==="signature"&&event.source.sourceId==="rescue_power");
    expect(intercept).toBeDefined();
    expect(signature?.causedByEventId).toBe(
      events(result,"target_changed").find((event)=>event.reason==="candidate_intercept")?.eventId,
    );
    expect(result.ruleActivations[0]).toEqual(expect.objectContaining({sourceId:"rescue_power",activationCount:expect.any(Number),notTriggeredReason:null}));
  });

  it("records capped requested versus applied amounts and limits every rule to once per round",()=>{
    const results=[0,1,2].map((index)=>simulateCandidateTrial(trialCommand(index as 0|1|2,`caps-${index}`)));
    const capped=results.flatMap((result)=>events(result,"guard_changed")).find((event)=>event.requested>0&&event.applied<event.requested);
    expect(capped).toEqual(expect.objectContaining({after:capped?.cap}));
    for(const result of results){
      for(const summary of result.ruleActivations){
        expect(summary.activationCount).toBeLessThanOrEqual(result.rounds);
      }
    }
  });

  it("labels a consumed forced-front target from the captured pending fact",()=>{
    let found:Extract<CandidateTrialEvent,{kind:"target_changed"}>|undefined;
    for(let seed=0;seed<180&&!found;seed+=1){
      const fixture=findGeneratedCandidate((candidate)=>
        candidate.complicationId==="solo_focus"&&
        candidate.techniqueIds.some((id)=>["weak_point","focused_strike","finish_line"].includes(id)),
      500);
      const result=simulateCandidateTrial(commandForCandidate(fixture,`forced-front-${seed}`));
      found=events(result,"target_changed").find((event)=>event.reason==="forced_front");
    }
    expect(found?.reason).toBe("forced_front");
  });
});
