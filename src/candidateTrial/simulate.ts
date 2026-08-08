import { CANDIDATE_BY_ID } from "../candidates/content";
import { draftCandidateRoster } from "../candidates/generate";
import type {
  CandidateDraft,
  MechanicalRule,
  RuleEffect,
  RuleTarget,
  TechniqueDefinition,
} from "../candidates/types";
import { createRngStream, type DeterministicRng } from "../sim/rng";
import { CANDIDATE_TRIAL_TUNING, TRAINING_ALLIES, TRAINING_ENEMIES } from "./content";
import { deriveCandidateCombatProfile } from "./deriveCombatProfile";
import { techniquePolicyScore } from "./policy";
import { candidateRules, inactiveRuleReason, type ExecutableCandidateRule } from "./rules";
import { parseStartCandidateTrialCommand } from "./schema";
import type {
  CandidateCombatProfile,
  CandidateRuleActivationSummary,
  CandidateTrialActionId,
  CandidateTrialEvent,
  CandidateTrialResult,
  CandidateTrialSide,
  CandidateTrialSlot,
  CandidateTrialUnitId,
  CandidateTrialUnitSnapshot,
  StartCandidateTrialCommand,
  TrainingAllyId,
  TrialActionOption,
  TrialEnemyId,
} from "./types";

type EventPayload = CandidateTrialEvent extends infer Event
  ? Event extends CandidateTrialEvent
    ? Omit<Event, "eventId" | "sequence" | "round">
    : never
  : never;

interface InternalUnit {
  readonly id: CandidateTrialUnitId;
  readonly name: string;
  readonly kind: "candidate" | "training_ally" | "enemy";
  readonly side: CandidateTrialSide;
  readonly slot: CandidateTrialSlot;
  readonly maxHealth: number;
  readonly power: number;
  readonly defence: number;
  readonly speed: number;
  readonly guardCap: number;
  health: number;
  guard: number;
  techniquePoints: number;
  strain: number;
  brokenUntilRound: number;
}

type TriggerSignal =
  | { readonly kind:"battle_start"; readonly causeId:string }
  | { readonly kind:"before_candidate_action"; readonly causeId:string }
  | { readonly kind:"after_basic"|"after_ally_guarded"|"after_self_guarded"|"after_heal"|"after_intercept"; readonly causeId:string; readonly triggeringAllyId?:TrainingAllyId }
  | { readonly kind:"health_cross"; readonly causeId:string; readonly targetId:CandidateTrialUnitId; readonly targetSide:CandidateTrialSide; readonly beforeRatio:number; readonly afterRatio:number };

interface TrialState {
  readonly command: StartCandidateTrialCommand;
  readonly candidate: CandidateDraft;
  readonly profile: CandidateCombatProfile;
  readonly candidateId: string;
  readonly units: Map<CandidateTrialUnitId, InternalUnit>;
  readonly events: CandidateTrialEvent[];
  readonly initiativeRng: DeterministicRng;
  readonly damageRng: DeterministicRng;
  readonly rules: readonly [ExecutableCandidateRule, ExecutableCandidateRule, ExecutableCandidateRule];
  readonly activationCounts: Map<string, number>;
  readonly onceLedger: Set<string>;
  readonly signals: TriggerSignal[];
  processingSignals: boolean;
  round: number;
  actionCount: number;
  candidateActionWindows: number;
  interceptedRound: number;
  pendingNextAttackPower: number;
  pendingNextTechniquePower: number;
  pendingTarget: "front_enemy" | "lowest_health_enemy" | null;
}

const slotRank: Readonly<Record<CandidateTrialSlot, number>> = { front:0, middle:1, rear:2 };

function emit(state: TrialState, payload: EventPayload): CandidateTrialEvent {
  const event = {
    ...payload,
    eventId:`trial-event-${String(state.events.length).padStart(4,"0")}`,
    sequence:state.events.length,
    round:state.round,
  } as CandidateTrialEvent;
  state.events.push(event);
  return event;
}

function sourceKey(source: ExecutableCandidateRule["source"]): string {
  return `${source.sourceKind}:${source.sourceId}`;
}

function requireUnit(state: TrialState, id: CandidateTrialUnitId): InternalUnit {
  const unit = state.units.get(id);
  if (!unit) throw new Error(`Missing candidate trial unit ${id}`);
  return unit;
}

function living(state: TrialState, side: CandidateTrialSide): InternalUnit[] {
  return [...state.units.values()].filter((unit) => unit.side === side && unit.health > 0);
}

function candidateUnit(state: TrialState): InternalUnit {
  return requireUnit(state, state.candidateId);
}

function candidateSlot(candidate: CandidateDraft): CandidateTrialSlot {
  if (candidate.chassisId === "guard_frame") return "front";
  if (candidate.chassisId === "support_frame") return "middle";
  return "rear";
}

function allySlots(slot: CandidateTrialSlot): readonly [CandidateTrialSlot, CandidateTrialSlot] {
  if (slot === "front") return ["middle","rear"];
  if (slot === "middle") return ["front","rear"];
  return ["front","middle"];
}

function createState(command: StartCandidateTrialCommand, candidate: CandidateDraft): TrialState {
  const profile = deriveCandidateCombatProfile(candidate);
  const units = new Map<CandidateTrialUnitId, InternalUnit>();
  const slot = candidateSlot(candidate);
  units.set(candidate.candidateId, {
    id:candidate.candidateId, name:candidate.identity.displayName, kind:"candidate", side:"candidate_team", slot,
    maxHealth:profile.maxHealth, power:profile.power, defence:profile.defence, speed:profile.speed,
    guardCap:profile.guardCap, health:profile.maxHealth, guard:0,
    techniquePoints:profile.startingTechniquePoints, strain:0, brokenUntilRound:0,
  });
  const openSlots = allySlots(slot);
  TRAINING_ALLIES.forEach((definition,index) => {
    const assignedSlot = openSlots[index]!;
    units.set(definition.id, {
      ...definition, slot:assignedSlot, kind:"training_ally", side:"candidate_team",
      health:definition.maxHealth, guard:0, techniquePoints:0, strain:0, brokenUntilRound:0,
    });
  });
  for (const definition of TRAINING_ENEMIES) {
    units.set(definition.id, {
      ...definition, kind:"enemy", side:"training_enemies", health:definition.maxHealth,
      guard:0, techniquePoints:0, strain:0, brokenUntilRound:0,
    });
  }
  const namespacedSeed = `candidate-trial:v1:${command.scenarioId}:${command.battleSeed}`;
  return {
    command,candidate,profile,candidateId:candidate.candidateId,units,events:[],
    initiativeRng:createRngStream(namespacedSeed,"initiative"),
    damageRng:createRngStream(namespacedSeed,"damage"),
    rules:candidateRules(candidate), activationCounts:new Map(), onceLedger:new Set(), signals:[],
    processingSignals:false, round:0, actionCount:0, candidateActionWindows:0,
    interceptedRound:-1, pendingNextAttackPower:0, pendingNextTechniquePower:0, pendingTarget:null,
  };
}

function snapshots(state: TrialState): CandidateTrialUnitSnapshot[] {
  return [...state.units.values()]
    .sort((left,right) => left.side.localeCompare(right.side) || slotRank[left.slot]-slotRank[right.slot] || left.id.localeCompare(right.id))
    .map((unit) => ({
      id:unit.id,name:unit.name,side:unit.side,slot:unit.slot,health:unit.health,maxHealth:unit.maxHealth,
      power:unit.power,defence:unit.defence,speed:unit.speed,guard:unit.guard,guardCap:unit.guardCap,
      techniquePoints:unit.techniquePoints,strain:unit.strain,
      broken:unit.brokenUntilRound > 0 && unit.brokenUntilRound >= state.round,defeated:unit.health===0,
    }));
}

function frontLiving(state: TrialState, side: CandidateTrialSide): InternalUnit {
  const target = living(state,side).sort((a,b)=>slotRank[a.slot]-slotRank[b.slot]||a.id.localeCompare(b.id))[0];
  if (!target) throw new Error(`No living ${side} unit`);
  return target;
}

function rearLiving(state: TrialState, side: CandidateTrialSide): InternalUnit {
  const target = living(state,side).sort((a,b)=>slotRank[b.slot]-slotRank[a.slot]||a.id.localeCompare(b.id))[0];
  if (!target) throw new Error(`No living ${side} unit`);
  return target;
}

function lowestHealth(state: TrialState, side: CandidateTrialSide, excludeCandidate=false): InternalUnit | null {
  return living(state,side)
    .filter((unit)=>!excludeCandidate || unit.id!==state.candidateId)
    .sort((a,b)=>a.health/a.maxHealth-b.health/b.maxHealth||slotRank[a.slot]-slotRank[b.slot]||a.id.localeCompare(b.id))[0] ?? null;
}

function queueSignals(state: TrialState, signals: readonly TriggerSignal[]): void {
  state.signals.push(...signals);
  if (state.processingSignals) return;
  state.processingSignals = true;
  try {
    while (state.signals.length > 0) {
      const signal = state.signals.shift()!;
      for (const source of state.rules) {
        if (!matchesRule(state,source.rule,signal)) continue;
        const ledgerKey = `${sourceKey(source.source)}:${state.round}`;
        if (source.rule.oncePerRound && state.onceLedger.has(ledgerKey)) continue;
        state.onceLedger.add(ledgerKey);
        activateRule(state,source,signal);
      }
    }
  } finally {
    state.processingSignals = false;
  }
}

function matchesRule(state: TrialState, rule: MechanicalRule, signal: TriggerSignal): boolean {
  const trigger = rule.trigger;
  if (trigger.kind === "battle_start") return signal.kind === "battle_start";
  if (trigger.kind === "at_points") return signal.kind === "before_candidate_action" && candidateUnit(state).techniquePoints >= trigger.points;
  if (trigger.kind === "self_below_health") return signal.kind === "before_candidate_action" && candidateUnit(state).health/candidateUnit(state).maxHealth <= trigger.ratio;
  if (trigger.kind === "ally_below_health") return signal.kind === "health_cross" && signal.targetSide === "candidate_team" && signal.targetId !== state.candidateId && signal.beforeRatio > trigger.ratio && signal.afterRatio <= trigger.ratio;
  if (trigger.kind === "enemy_below_health") return signal.kind === "health_cross" && signal.targetSide === "training_enemies" && signal.beforeRatio > trigger.ratio && signal.afterRatio <= trigger.ratio;
  return signal.kind === trigger.kind;
}

function ruleTarget(state: TrialState, target: RuleTarget, signal: TriggerSignal): InternalUnit {
  if (target === "self") return candidateUnit(state);
  if (target === "front_enemy") return frontLiving(state,"training_enemies");
  if (target === "lowest_health_enemy") return lowestHealth(state,"training_enemies") ?? frontLiving(state,"training_enemies");
  if (target === "most_injured_ally") return lowestHealth(state,"candidate_team",true) ?? candidateUnit(state);
  if (signal.kind === "health_cross" && signal.targetSide === "candidate_team" && signal.targetId !== state.candidateId) return requireUnit(state,signal.targetId);
  if ("triggeringAllyId" in signal && signal.triggeringAllyId) return requireUnit(state,signal.triggeringAllyId);
  return lowestHealth(state,"candidate_team",true) ?? candidateUnit(state);
}

function activateRule(state: TrialState, source: ExecutableCandidateRule, signal: TriggerSignal): void {
  const target = ruleTarget(state,source.rule.target,signal);
  const event = emit(state, {
    kind:"candidate_rule_triggered",causedByEventId:signal.causeId,candidateId:state.candidateId,
    source:source.source,trigger:source.rule.trigger,effect:source.rule.effect,targetId:target.id,
  });
  const key = sourceKey(source.source);
  state.activationCounts.set(key,(state.activationCounts.get(key)??0)+1);
  applyEffect(state,source.rule.effect,target,event.eventId,"candidate_rule");
}

function changeGuard(
  state: TrialState, actor: InternalUnit, target: InternalUnit, requested: number,
  reason:"technique"|"candidate_rule"|"training_policy"|"damage"|"break", causeId:string,
): CandidateTrialEvent {
  const before = target.guard;
  const after = Math.max(0,Math.min(target.guardCap,before+requested));
  const applied = after-before;
  target.guard=after;
  const event=emit(state,{kind:"guard_changed",causedByEventId:causeId,actorId:actor.id,targetId:target.id,before,requested,applied,after,cap:target.guardCap,reason});
  if (applied>0 && target.side==="candidate_team" && target.id!==state.candidateId) {
    queueSignals(state,[{kind:"after_ally_guarded",causeId:event.eventId,triggeringAllyId:target.id as TrainingAllyId}]);
  }
  return event;
}

function changeHealth(
  state: TrialState, actor: InternalUnit, target: InternalUnit, requested:number,
  reason:"technique_heal"|"candidate_rule_heal", causeId:string,
): CandidateTrialEvent {
  const before=target.health;
  const after=Math.max(0,Math.min(target.maxHealth,before+requested));
  const applied=after-before;
  target.health=after;
  const event=emit(state,{kind:"health_changed",causedByEventId:causeId,actorId:actor.id,targetId:target.id,before,requested,applied,after,cap:target.maxHealth,reason});
  if (actor.id===state.candidateId && target.side==="candidate_team" && target.id!==state.candidateId && applied>0) {
    queueSignals(state,[{kind:"after_heal",causeId:event.eventId,triggeringAllyId:target.id as TrainingAllyId}]);
  }
  return event;
}

function changePoints(state: TrialState, requested:number, reason:"basic_gain"|"technique_cost"|"candidate_rule"|"technique_effect", causeId:string): CandidateTrialEvent {
  const unit=candidateUnit(state); const before=unit.techniquePoints;
  const after=Math.max(0,Math.min(CANDIDATE_TRIAL_TUNING.techniquePointCap,before+requested));
  const applied=after-before; unit.techniquePoints=after;
  return emit(state,{kind:"points_changed",causedByEventId:causeId,candidateId:state.candidateId,before,requested,applied,after,cap:CANDIDATE_TRIAL_TUNING.techniquePointCap,reason});
}

function changePendingBonus(state: TrialState, timing:"next_attack"|"next_technique", requested:number, reason:"candidate_rule"|"consumed", causeId:string): CandidateTrialEvent {
  const before=timing==="next_attack"?state.pendingNextAttackPower:state.pendingNextTechniquePower;
  const after=Math.max(0,Math.min(99,before+requested)); const applied=after-before;
  if(timing==="next_attack") state.pendingNextAttackPower=after; else state.pendingNextTechniquePower=after;
  return emit(state,{kind:"pending_bonus_changed",causedByEventId:causeId,candidateId:state.candidateId,timing,before,requested,applied,after,cap:99,reason});
}

function changePendingTarget(state:TrialState, requested:"front_enemy"|"lowest_health_enemy"|null, reason:"candidate_rule"|"consumed", causeId:string):CandidateTrialEvent {
  const before=state.pendingTarget; const applied=before!==requested; state.pendingTarget=requested;
  return emit(state,{kind:"pending_target_changed",causedByEventId:causeId,candidateId:state.candidateId,before,requested,applied,after:state.pendingTarget,cap:1,reason});
}

function changeStrain(state:TrialState,requested:number,causeId:string):CandidateTrialEvent {
  const unit=candidateUnit(state); const before=unit.strain;
  const after=Math.max(0,Math.min(CANDIDATE_TRIAL_TUNING.strainCap,before+requested)); const applied=after-before;
  unit.strain=after;
  const event=emit(state,{kind:"strain_changed",causedByEventId:causeId,candidateId:state.candidateId,before,requested,applied,after,cap:CANDIDATE_TRIAL_TUNING.strainCap,reason:"candidate_risk"});
  if(before<CANDIDATE_TRIAL_TUNING.strainCap && after===CANDIDATE_TRIAL_TUNING.strainCap){
    unit.strain=0; unit.brokenUntilRound=state.round+1;
    const broken=emit(state,{kind:"break_applied",causedByEventId:event.eventId,candidateId:state.candidateId,defencePenalty:CANDIDATE_TRIAL_TUNING.breakDefencePenalty,untilRound:unit.brokenUntilRound});
    if(unit.guard>0) changeGuard(state,unit,unit,-unit.guard,"break",broken.eventId);
    emit(state,{kind:"strain_changed",causedByEventId:broken.eventId,candidateId:state.candidateId,before:after,requested:-after,applied:-after,after:0,cap:CANDIDATE_TRIAL_TUNING.strainCap,reason:"candidate_risk"});
  }
  return event;
}

function applyEffect(state:TrialState,effect:RuleEffect,target:InternalUnit,causeId:string,origin:"candidate_rule"|"technique"):void {
  const actor=candidateUnit(state);
  switch(effect.kind){
    case "gain_guard": changeGuard(state,actor,target,effect.amount,origin==="candidate_rule"?"candidate_rule":"technique",causeId); break;
    case "lose_guard": changeGuard(state,actor,target,-effect.amount,"candidate_rule",causeId); break;
    case "heal": changeHealth(state,actor,target,effect.amount,origin==="candidate_rule"?"candidate_rule_heal":"technique_heal",causeId); break;
    case "gain_points": changePoints(state,effect.amount,origin==="candidate_rule"?"candidate_rule":"technique_effect",causeId); break;
    case "add_strain": changeStrain(state,effect.amount,causeId); break;
    case "bonus_power":
      if(effect.timing==="next_attack"||effect.timing==="next_technique") changePendingBonus(state,effect.timing,effect.amount,"candidate_rule",causeId);
      break;
    case "force_target": if(effect.timing==="next_attack") changePendingTarget(state,effect.target,"candidate_rule",causeId); break;
  }
}

function applyDamage(state:TrialState,actor:InternalUnit,target:InternalUnit,actionId:CandidateTrialActionId,actionPower:number,causeId:string):CandidateTrialEvent {
  const variance=state.damageRng.nextIntInclusive(CANDIDATE_TRIAL_TUNING.damageVarianceMin,CANDIDATE_TRIAL_TUNING.damageVarianceMax);
  const defence=Math.max(0,target.defence-(target.brokenUntilRound>=state.round?CANDIDATE_TRIAL_TUNING.breakDefencePenalty:0));
  const requestedDamage=Math.max(1,actor.power+actionPower+variance-defence);
  const guardBefore=target.guard; const appliedGuardAbsorption=Math.min(guardBefore,requestedDamage);
  if(appliedGuardAbsorption>0) changeGuard(state,actor,target,-appliedGuardAbsorption,"damage",causeId);
  const healthBefore=target.health; const requestedHealthLoss=requestedDamage-appliedGuardAbsorption;
  const appliedHealthLoss=Math.min(healthBefore,requestedHealthLoss); target.health-=appliedHealthLoss;
  const event=emit(state,{kind:"damage_applied",causedByEventId:causeId,actorId:actor.id,targetId:target.id,actionId,inputPower:actor.power,actionPower,variance,defence,requestedDamage,guardBefore,requestedGuardAbsorption:requestedDamage,appliedGuardAbsorption,guardAfter:target.guard,guardCap:target.guardCap,healthBefore,requestedHealthLoss,appliedHealthLoss,healthAfter:target.health,healthCap:target.maxHealth});
  if(target.health===0) emit(state,{kind:"unit_defeated",causedByEventId:event.eventId,unitId:target.id,byUnitId:actor.id});
  const beforeRatio=healthBefore/target.maxHealth, afterRatio=target.health/target.maxHealth;
  const signals:TriggerSignal[]=[];
  if(target.id===state.candidateId&&appliedGuardAbsorption>0) signals.push({kind:"after_self_guarded",causeId:event.eventId});
  if(afterRatio<beforeRatio) signals.push({kind:"health_cross",causeId:event.eventId,targetId:target.id,targetSide:target.side,beforeRatio,afterRatio});
  queueSignals(state,signals);
  return event;
}

function techniqueHasAttack(technique:TechniqueDefinition):boolean {
  return technique.effects.some((effect)=>effect.kind==="bonus_power"&&effect.timing==="immediate_technique_attack");
}

function techniqueTarget(state:TrialState,technique:TechniqueDefinition):InternalUnit|null {
  if(technique.target==="self") return candidateUnit(state);
  if(technique.target==="front_enemy") return living(state,"training_enemies").length?frontLiving(state,"training_enemies"):null;
  if(technique.target==="lowest_health_enemy") return lowestHealth(state,"training_enemies");
  if(technique.target==="most_injured_ally") return lowestHealth(state,"candidate_team",true);
  return lowestHealth(state,"candidate_team",true);
}

function candidateOptions(state:TrialState):TrialActionOption[] {
  const unit=candidateUnit(state); const temperament=CANDIDATE_BY_ID.temperaments[state.candidate.temperamentId]!;
  const hasInjuredAlly=living(state,"candidate_team").some((ally)=>ally.id!==state.candidateId&&ally.health<ally.maxHealth);
  const options:TrialActionOption[]=[{actionId:"basic",legal:true,score:10,reasons:["always_available"]}];
  for(const id of state.candidate.techniqueIds){
    const technique=CANDIDATE_BY_ID.techniques[id]!; const target=techniqueTarget(state,technique);
    const enough=unit.techniquePoints>=technique.cost; const temperamentReady=unit.techniquePoints>=temperament.policy.spendAtPoints;
    const needsInjured=technique.effects.some((effect)=>effect.kind==="heal")&&technique.target==="most_injured_ally";
    const validTarget=target!==null && (!needsInjured || target.health<target.maxHealth);
    const legal=enough&&temperamentReady&&validTarget;
    const reasons:TrialActionOption["reasons"]=!enough?["not_enough_points"]:!temperamentReady?["temperament_waiting"]:!target?["no_living_target"]:!validTarget?["no_injured_ally"]:["technique_ready"];
    const pointPatternBonus =
      unit.techniquePoints === 2 && technique.role === "setup"
        ? 10
        : unit.techniquePoints === 3 && technique.role === "payoff"
          ? 10
          : 0;
    options.push({actionId:id,legal,score:legal?techniquePolicyScore(technique,temperament,hasInjuredAlly)+pointPatternBonus:0,reasons});
  }
  return options;
}

function forcedTarget(state:TrialState,actor:InternalUnit,defaultTarget:InternalUnit,causeId:string):{readonly target:InternalUnit;readonly causeId:string} {
  if(actor.id!==state.candidateId||state.pendingTarget===null) return {target:defaultTarget,causeId};
  const pendingTarget=state.pendingTarget;
  const forced=pendingTarget==="front_enemy"?frontLiving(state,"training_enemies"):(lowestHealth(state,"training_enemies")??defaultTarget);
  const consumed=changePendingTarget(state,null,"consumed",causeId);
  if(forced.id!==defaultTarget.id) {
    const changed=emit(state,{kind:"target_changed",causedByEventId:consumed.eventId,actorId:actor.id,fromTargetId:defaultTarget.id,toTargetId:forced.id,reason:pendingTarget==="front_enemy"?"forced_front":"forced_weakest"});
    return {target:forced,causeId:changed.eventId};
  }
  return {target:forced,causeId:consumed.eventId};
}

function performCandidateAction(state:TrialState):void {
  const actor=candidateUnit(state); state.candidateActionWindows+=1;
  const windowCause=state.events[state.events.length-1]?.eventId ?? state.events[0]!.eventId;
  queueSignals(state,[{kind:"before_candidate_action",causeId:windowCause}]);
  const options=candidateOptions(state);
  emit(state,{kind:"action_options",actorId:actor.id,options});
  const chosen=options.map((option,index)=>({option,index})).filter(({option})=>option.legal).sort((a,b)=>b.option.score-a.option.score||a.index-b.index)[0]!.option;
  if(chosen.actionId==="basic"){
    const temperament=CANDIDATE_BY_ID.temperaments[state.candidate.temperamentId]!;
    const initial=temperament.policy.focusFireBias===2
      ? (lowestHealth(state,"training_enemies")??frontLiving(state,"training_enemies"))
      : frontLiving(state,"training_enemies");
    const intent=emit(state,{kind:"intent_shown",actorId:actor.id,actionId:"basic",targetIds:[initial.id],reason:"basic_target"});
    const resolved=forcedTarget(state,actor,initial,intent.eventId);
    const target=resolved.target;
    const action=emit(state,{kind:"action_started",causedByEventId:resolved.causeId,actorId:actor.id,actionId:"basic",targetIds:[target.id]});
    const bonus=state.pendingNextAttackPower;
    if(bonus>0) changePendingBonus(state,"next_attack",-bonus,"consumed",action.eventId);
    const damage=applyDamage(state,actor,target,"basic",CANDIDATE_TRIAL_TUNING.basicActionPower+bonus,action.eventId);
    changePoints(state,1,"basic_gain",damage.eventId);
    queueSignals(state,[{kind:"after_basic",causeId:damage.eventId}]);
    return;
  }
  const technique=CANDIDATE_BY_ID.techniques[chosen.actionId as keyof typeof CANDIDATE_BY_ID.techniques]!;
  let target=techniqueTarget(state,technique);
  if(!target) throw new Error(`Technique ${technique.id} has no target`);
  const intent=emit(state,{kind:"intent_shown",actorId:actor.id,actionId:technique.id,targetIds:[target.id],reason:"technique_policy"});
  const resolved=techniqueHasAttack(technique)?forcedTarget(state,actor,target,intent.eventId):{target,causeId:intent.eventId};
  target=resolved.target;
  const action=emit(state,{kind:"action_started",causedByEventId:resolved.causeId,actorId:actor.id,actionId:technique.id,targetIds:[target.id]});
  const used=emit(state,{kind:"technique_used",causedByEventId:action.eventId,candidateId:state.candidateId,techniqueId:technique.id,targetIds:[target.id],cost:technique.cost});
  changePoints(state,-technique.cost,"technique_cost",used.eventId);
  const immediatePower=technique.effects.reduce((total,effect)=>total+(effect.kind==="bonus_power"&&effect.timing==="immediate_technique_attack"?effect.amount:0),0);
  if(immediatePower>0){
    const attackBonus=state.pendingNextAttackPower, techniqueBonus=state.pendingNextTechniquePower;
    if(attackBonus>0) changePendingBonus(state,"next_attack",-attackBonus,"consumed",used.eventId);
    if(techniqueBonus>0) changePendingBonus(state,"next_technique",-techniqueBonus,"consumed",used.eventId);
    applyDamage(state,actor,target,technique.id,immediatePower+attackBonus+techniqueBonus,used.eventId);
  }
  for(const effect of technique.effects){
    if(effect.kind==="bonus_power"&&effect.timing==="immediate_technique_attack") continue;
    if(effect.kind==="force_target"&&effect.timing==="immediate_technique") continue;
    applyEffect(state,effect,target,used.eventId,"technique");
  }
}

function maybeIntercept(state:TrialState,attacker:InternalUnit,target:InternalUnit,intentId:string):{readonly target:InternalUnit;readonly causeId:string} {
  if(target.kind!=="training_ally"||state.interceptedRound===state.round) return {target,causeId:intentId};
  const candidate=candidateUnit(state); const temperament=CANDIDATE_BY_ID.temperaments[state.candidate.temperamentId]!;
  if(candidate.health===0||target.health/target.maxHealth>temperament.policy.riskThreshold/100) return {target,causeId:intentId};
  state.interceptedRound=state.round;
  const intercept=emit(state,{kind:"intercepted",causedByEventId:intentId,candidateId:state.candidateId,protectedAllyId:target.id as TrainingAllyId,attackerId:attacker.id as TrialEnemyId,riskThreshold:temperament.policy.riskThreshold});
  const changed=emit(state,{kind:"target_changed",causedByEventId:intercept.eventId,actorId:attacker.id,fromTargetId:target.id,toTargetId:candidate.id,reason:"candidate_intercept"});
  queueSignals(state,[{kind:"after_intercept",causeId:changed.eventId,triggeringAllyId:target.id as TrainingAllyId}]);
  return {target:candidate,causeId:changed.eventId};
}

function performFixedAction(state:TrialState,actor:InternalUnit):void {
  const definition=[...TRAINING_ALLIES,...TRAINING_ENEMIES].find((value)=>value.id===actor.id);
  if(!definition) throw new Error(`Missing fixed policy for ${actor.id}`);
  if(definition.policy==="guard_partner"){
    const preferred=requireUnit(state,"training_striker");
    const trialCandidate=candidateUnit(state);
    const target=state.round>1&&trialCandidate.health/trialCandidate.maxHealth<=0.85
      ? trialCandidate
      : preferred.health>0?preferred:(lowestHealth(state,"candidate_team",true)??trialCandidate);
    const options:TrialActionOption[]=[{actionId:"guard_partner",legal:true,score:20,reasons:["fixed_training_policy"]}];
    emit(state,{kind:"action_options",actorId:actor.id,options});
    const intent=emit(state,{kind:"intent_shown",actorId:actor.id,actionId:"guard_partner",targetIds:[target.id],reason:"fixed_training_policy"});
    const action=emit(state,{kind:"action_started",causedByEventId:intent.eventId,actorId:actor.id,actionId:"guard_partner",targetIds:[target.id]});
    changeGuard(state,actor,target,CANDIDATE_TRIAL_TUNING.trainingGuardAmount,"training_policy",action.eventId);
    return;
  }
  const opposing:CandidateTrialSide=actor.side==="candidate_team"?"training_enemies":"candidate_team";
  let target=definition.policy==="strike_rear"?rearLiving(state,opposing):definition.policy==="strike_lowest"?(lowestHealth(state,opposing)??frontLiving(state,opposing)):frontLiving(state,opposing);
  const options:TrialActionOption[]=[{actionId:"basic",legal:true,score:10,reasons:["fixed_training_policy"]}];
  emit(state,{kind:"action_options",actorId:actor.id,options});
  const intent=emit(state,{kind:"intent_shown",actorId:actor.id,actionId:"basic",targetIds:[target.id],reason:"fixed_training_policy"});
  const resolved=actor.side==="training_enemies"?maybeIntercept(state,actor,target,intent.eventId):{target,causeId:intent.eventId};
  target=resolved.target;
  const action=emit(state,{kind:"action_started",causedByEventId:resolved.causeId,actorId:actor.id,actionId:"basic",targetIds:[target.id]});
  applyDamage(state,actor,target,"basic",CANDIDATE_TRIAL_TUNING.basicActionPower,action.eventId);
}

function initiativeOrder(state:TrialState):InternalUnit[]{
  return [...state.units.values()].filter((unit)=>unit.health>0).map((unit)=>({unit,tie:state.initiativeRng.nextUint32()})).sort((a,b)=>b.unit.speed-a.unit.speed||a.tie-b.tie).map(({unit})=>unit);
}

function winnerAtCap(state:TrialState):CandidateTrialSide|"draw"{
  const ratio=(side:CandidateTrialSide)=>{const units=[...state.units.values()].filter((unit)=>unit.side===side);return units.reduce((sum,unit)=>sum+unit.health,0)/units.reduce((sum,unit)=>sum+unit.maxHealth,0);};
  const heroes=ratio("candidate_team"),enemies=ratio("training_enemies"); return heroes===enemies?"draw":heroes>enemies?"candidate_team":"training_enemies";
}

function activationSummary(state:TrialState):CandidateTrialResult["ruleActivations"]{
  const summaries=state.rules.map((source)=>{const count=state.activationCounts.get(sourceKey(source.source))??0;return {...source.source,activationCount:count,notTriggeredReason:count===0?inactiveRuleReason(source.rule,state.candidateActionWindows):null} as CandidateRuleActivationSummary;});
  return [summaries[0]!,summaries[1]!,summaries[2]!];
}

export function simulateCandidateTrial(input:StartCandidateTrialCommand):CandidateTrialResult{
  const command=parseStartCandidateTrialCommand(input); const draft=draftCandidateRoster(command.draftCommand);
  if(draft.status!=="ok") throw new Error(`Candidate provenance draft failed at slot ${draft.failedSlot}`);
  const candidate=draft.candidates.find((value)=>value.candidateId===command.candidateId);
  if(!candidate) throw new Error(`Candidate ${command.candidateId} is not present in the referenced draft`);
  const state=createState(command,candidate); const initialUnits=snapshots(state);
  const started=emit(state,{kind:"trial_started",scenarioId:command.scenarioId,battleSeed:command.battleSeed,candidateId:candidate.candidateId,candidateFingerprintHash:candidate.semanticFingerprint.hash,profile:state.profile});
  queueSignals(state,[{kind:"battle_start",causeId:started.eventId}]);
  let endReason:"team_defeated"|"action_cap"="action_cap"; let lastCause=state.events.at(-1)?.eventId??started.eventId;
  while(state.actionCount<CANDIDATE_TRIAL_TUNING.actionCap){
    state.round+=1; const order=initiativeOrder(state);
    const round=emit(state,{kind:"round_started",order:order.map((unit)=>unit.id)}); lastCause=round.eventId;
    for(const actor of order){
      if(actor.health===0) continue;
      if(living(state,actor.side==="candidate_team"?"training_enemies":"candidate_team").length===0) break;
      if(actor.id===state.candidateId) performCandidateAction(state); else performFixedAction(state,actor);
      state.actionCount+=1; lastCause=state.events.at(-1)?.eventId??lastCause;
      if(living(state,"candidate_team").length===0||living(state,"training_enemies").length===0){endReason="team_defeated";break;}
      if(state.actionCount>=CANDIDATE_TRIAL_TUNING.actionCap) break;
    }
    if(endReason==="team_defeated") break;
  }
  const winner=endReason==="action_cap"?winnerAtCap(state):(living(state,"candidate_team").length===0?"training_enemies":"candidate_team");
  emit(state,{kind:"trial_ended",causedByEventId:lastCause,winner,reason:endReason,actionCount:state.actionCount});
  return {version:1,command,candidate,profile:state.profile,winner,endReason,rounds:state.round,actionCount:state.actionCount,initialUnits,events:state.events,finalUnits:snapshots(state),ruleActivations:activationSummary(state)};
}
