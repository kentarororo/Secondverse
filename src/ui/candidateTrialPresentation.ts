import { CANDIDATE_BY_ID } from "../candidates";
import type {
  CandidateRuleActivationSummary,
  CandidateRuleSource,
  CandidateTrialActionId,
  CandidateTrialEvent,
  CandidateTrialResult,
  CandidateTrialUnitId,
  CandidateTrialUnitSnapshot,
  RuleNotTriggeredReason,
} from "../candidateTrial";

export interface CandidateTrialMoment {
  readonly id: string;
  readonly focusEventId: string;
  readonly startEventIndex: number;
  readonly endEventIndex: number;
  readonly round: number;
  readonly actionNumber: number;
  readonly actorId: CandidateTrialUnitId | null;
  readonly targetIds: readonly CandidateTrialUnitId[];
  readonly label: "Setup" | "Action" | "Signature" | "Advantage" | "Risk" | "Turning point" | "Outcome";
}

export interface CandidateTrialSummary {
  readonly cause: string;
  readonly target: string;
  readonly outcome: string;
  readonly text: string;
}

export interface CandidateTrialDelta {
  readonly unitId: CandidateTrialUnitId;
  readonly kind: "HP" | "Guard" | "Points" | "Strain" | "Stored Power";
  readonly amount: number;
  readonly before: number;
  readonly after: number;
  readonly text: string;
}

interface MutableTrialUnit {
  id: CandidateTrialUnitId;
  name: string;
  side: CandidateTrialUnitSnapshot["side"];
  slot: CandidateTrialUnitSnapshot["slot"];
  health: number;
  maxHealth: number;
  power: number;
  defence: number;
  speed: number;
  guardCap: number;
  guard: number;
  techniquePoints: number;
  strain: number;
  broken: boolean;
  defeated: boolean;
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

export function trialUnitName(result: CandidateTrialResult, unitId: CandidateTrialUnitId): string {
  return result.initialUnits.find((unit) => unit.id === unitId)?.name ?? String(unitId);
}

export function trialActionName(actionId: CandidateTrialActionId): string {
  if (actionId === "basic") return "Basic attack";
  if (actionId === "guard_partner") return "Guard partner";
  return CANDIDATE_BY_ID.techniques[actionId]?.name ?? actionId;
}

function sourceDefinition(source: CandidateRuleSource) {
  if (source.sourceKind === "signature") return CANDIDATE_BY_ID.signatures[source.sourceId];
  if (source.sourceKind === "advantage") return CANDIDATE_BY_ID.advantages[source.sourceId];
  return CANDIDATE_BY_ID.complications[source.sourceId];
}

export function candidateRuleName(source: CandidateRuleSource): string {
  return sourceDefinition(source)?.name ?? source.sourceId;
}

function eventActor(event: CandidateTrialEvent): CandidateTrialUnitId | null {
  if (event.kind === "action_started" || event.kind === "intent_shown") return event.actorId;
  if (event.kind === "technique_used" || event.kind === "candidate_rule_triggered") {
    return event.candidateId;
  }
  if (event.kind === "intercepted" || event.kind === "break_applied") return event.candidateId;
  if (event.kind === "unit_defeated") return event.byUnitId;
  return null;
}

function eventTargets(event: CandidateTrialEvent): readonly CandidateTrialUnitId[] {
  if (event.kind === "action_started" || event.kind === "intent_shown" || event.kind === "technique_used") {
    return event.targetIds;
  }
  if (event.kind === "candidate_rule_triggered") return [event.targetId];
  if (event.kind === "intercepted") return [event.protectedAllyId, event.candidateId];
  if (event.kind === "break_applied") return [event.candidateId];
  if (event.kind === "unit_defeated") return [event.unitId];
  return [];
}

function momentLabel(event: CandidateTrialEvent): CandidateTrialMoment["label"] {
  if (event.kind === "trial_started") return "Setup";
  if (event.kind === "trial_ended") return "Outcome";
  if (event.kind === "candidate_rule_triggered") {
    if (event.source.sourceKind === "signature") return "Signature";
    if (event.source.sourceKind === "advantage") return "Advantage";
    return "Risk";
  }
  if (event.kind === "intercepted" || event.kind === "break_applied" || event.kind === "unit_defeated") {
    return "Turning point";
  }
  return "Action";
}

function keyEvent(event: CandidateTrialEvent, candidateId: string): boolean {
  if (
    event.kind === "trial_started" ||
    event.kind === "trial_ended" ||
    event.kind === "candidate_rule_triggered" ||
    event.kind === "intercepted" ||
    event.kind === "unit_defeated" ||
    event.kind === "technique_used"
  ) {
    return true;
  }
  return event.kind === "action_started" && event.actorId === candidateId && event.actionId === "basic";
}

function causalEventIds(
  result: CandidateTrialResult,
  focusIndex: number,
): ReadonlySet<string> {
  const focus = result.events[focusIndex]!;
  const acceptedCauses = new Set([focus.eventId]);
  for (let index = focusIndex + 1; index < result.events.length; index += 1) {
    const event = result.events[index]!;
    if (!("causedByEventId" in event) || !acceptedCauses.has(event.causedByEventId)) continue;
    if (keyEvent(event, result.candidate.candidateId)) continue;
    acceptedCauses.add(event.eventId);
  }
  return acceptedCauses;
}

function causalEndIndex(result: CandidateTrialResult, focusIndex: number): number {
  const causalIds = causalEventIds(result, focusIndex);
  let endIndex = focusIndex;
  for (let index = focusIndex + 1; index < result.events.length; index += 1) {
    if (causalIds.has(result.events[index]!.eventId)) endIndex = index;
  }
  return endIndex;
}

export function selectCandidateTrialMoments(result: CandidateTrialResult): readonly CandidateTrialMoment[] {
  const keyIndexes = result.events.flatMap((event, index) =>
    keyEvent(event, result.candidate.candidateId) ? [index] : [],
  );
  return keyIndexes.map((focusIndex, position) => {
    const event = result.events[focusIndex]!;
    const nextIndex = keyIndexes[position + 1] ?? result.events.length;
    const causalEnd = causalEndIndex(result, focusIndex);
    const actionNumber = result.events
      .slice(0, focusIndex + 1)
      .filter((candidate) => candidate.kind === "action_started").length;
    return {
      id: `candidate-trial-moment-${event.eventId}`,
      focusEventId: event.eventId,
      startEventIndex: focusIndex,
      endEventIndex: Math.max(focusIndex, Math.min(causalEnd, nextIndex - 1)),
      round: event.round,
      actionNumber,
      actorId: eventActor(event),
      targetIds: eventTargets(event),
      label: momentLabel(event),
    };
  });
}

export function candidateTrialUnitsAtEvent(
  result: CandidateTrialResult,
  cursor: number,
): readonly CandidateTrialUnitSnapshot[] {
  const units: MutableTrialUnit[] = result.initialUnits.map((unit) => ({ ...unit }));
  let brokenUntilRound = 0;
  for (const event of result.events.slice(0, Math.max(0, cursor + 1))) {
    const candidate = units.find((unit) => unit.id === result.candidate.candidateId);
    if (event.kind === "round_started" && candidate && event.round > brokenUntilRound) {
      candidate.broken = false;
    } else if (event.kind === "guard_changed") {
      const target = units.find((unit) => unit.id === event.targetId);
      if (target) target.guard = event.after;
    } else if (event.kind === "health_changed") {
      const target = units.find((unit) => unit.id === event.targetId);
      if (target) target.health = event.after;
    } else if (event.kind === "points_changed" && candidate) {
      candidate.techniquePoints = event.after;
    } else if (event.kind === "strain_changed" && candidate) {
      candidate.strain = event.after;
    } else if (event.kind === "damage_applied") {
      const target = units.find((unit) => unit.id === event.targetId);
      if (target) {
        target.guard = event.guardAfter;
        target.health = event.healthAfter;
      }
    } else if (event.kind === "break_applied" && candidate) {
      brokenUntilRound = event.untilRound;
      candidate.broken = true;
    } else if (event.kind === "unit_defeated") {
      const target = units.find((unit) => unit.id === event.unitId);
      if (target) target.defeated = true;
    }
  }
  return units;
}

export function candidateTrialMomentDeltas(
  result: CandidateTrialResult,
  moment: CandidateTrialMoment,
): readonly CandidateTrialDelta[] {
  const causalIds = causalEventIds(result, moment.startEventIndex);
  return result.events
    .slice(moment.startEventIndex, moment.endEventIndex + 1)
    .filter((event) => causalIds.has(event.eventId))
    .flatMap((event): readonly CandidateTrialDelta[] => {
      if (event.kind === "damage_applied" && event.appliedHealthLoss > 0) {
        return [{
          unitId: event.targetId,
          kind: "HP",
          amount: -event.appliedHealthLoss,
          before: event.healthBefore,
          after: event.healthAfter,
          text: `HP -${event.appliedHealthLoss}`,
        }];
      }
      if (event.kind === "health_changed" && event.applied !== 0) {
        return [{
          unitId: event.targetId,
          kind: "HP",
          amount: event.applied,
          before: event.before,
          after: event.after,
          text: `HP ${signed(event.applied)}`,
        }];
      }
      if (event.kind === "guard_changed" && event.applied !== 0) {
        return [{
          unitId: event.targetId,
          kind: "Guard",
          amount: event.applied,
          before: event.before,
          after: event.after,
          text: `Guard ${signed(event.applied)}`,
        }];
      }
      if (event.kind === "points_changed" && event.applied !== 0) {
        return [{
          unitId: event.candidateId,
          kind: "Points",
          amount: event.applied,
          before: event.before,
          after: event.after,
          text: `Points ${signed(event.applied)}`,
        }];
      }
      if (event.kind === "strain_changed" && event.applied !== 0) {
        return [{
          unitId: event.candidateId,
          kind: "Strain",
          amount: event.applied,
          before: event.before,
          after: event.after,
          text: `Strain ${signed(event.applied)}`,
        }];
      }
      if (event.kind === "pending_bonus_changed" && event.applied !== 0) {
        return [{
          unitId: event.candidateId,
          kind: "Stored Power",
          amount: event.applied,
          before: event.before,
          after: event.after,
          text: `Stored Power ${signed(event.applied)}`,
        }];
      }
      return [];
    });
}

function deltaSentence(delta: CandidateTrialDelta, result: CandidateTrialResult): string {
  return `${trialUnitName(result, delta.unitId)} ${delta.kind} ${signed(delta.amount)} (${delta.before} to ${delta.after}).`;
}

export function candidateTrialMomentSummary(
  result: CandidateTrialResult,
  moment: CandidateTrialMoment,
): CandidateTrialSummary {
  const event = result.events.find((candidate) => candidate.eventId === moment.focusEventId)!;
  const deltas = candidateTrialMomentDeltas(result, moment);
  const outcome = deltas.map((delta) => deltaSentence(delta, result)).join(" ") || "No HP or combat value changed.";
  if (event.kind === "trial_started") {
    const summary = {
      cause: `${result.candidate.identity.displayName} enters the training battle.`,
      target: "Two fixed partners complete the three-person team.",
      outcome: `Max HP ${result.profile.maxHealth}; Power ${result.profile.power}; Defence ${result.profile.defence}; Speed ${result.profile.speed}.`,
    };
    return { ...summary, text: `${summary.cause} ${summary.target} ${summary.outcome}` };
  }
  if (event.kind === "trial_ended") {
    const resultText = event.winner === "candidate_team" ? "The candidate team wins." : event.winner === "training_enemies" ? "The candidate team loses." : "The trial is a draw.";
    const summary = {
      cause: "The trial ends.",
      target: `All ${event.actionCount} actions are resolved.`,
      outcome: resultText,
    };
    return { ...summary, text: `${summary.cause} ${summary.target} ${summary.outcome}` };
  }
  if (event.kind === "candidate_rule_triggered") {
    const ruleName = candidateRuleName(event.source);
    const broken = result.events
      .slice(moment.startEventIndex, moment.endEventIndex + 1)
      .find((candidate) => candidate.kind === "break_applied");
    const ruleOutcome = broken?.kind === "break_applied"
      ? `${outcome} ${result.candidate.identity.displayName} becomes Broken with Defence -${broken.defencePenalty} through Round ${broken.untilRound}.`
      : outcome;
    const summary = {
      cause: `${result.candidate.identity.displayName}'s ${ruleName} triggers.`,
      target: `${trialUnitName(result, event.targetId)} is affected.`,
      outcome: ruleOutcome,
    };
    return { ...summary, text: `${summary.cause} ${summary.target} ${summary.outcome}` };
  }
  if (event.kind === "technique_used") {
    const targets = event.targetIds.map((id) => trialUnitName(result, id)).join(", ");
    const summary = {
      cause: `${result.candidate.identity.displayName} uses ${trialActionName(event.techniqueId)} for ${event.cost} Points.`,
      target: `${targets} ${event.targetIds.length === 1 ? "is" : "are"} affected.`,
      outcome,
    };
    return { ...summary, text: `${summary.cause} ${summary.target} ${summary.outcome}` };
  }
  if (event.kind === "action_started") {
    const targets = event.targetIds.map((id) => trialUnitName(result, id)).join(", ");
    const summary = {
      cause: `${trialUnitName(result, event.actorId)} uses ${trialActionName(event.actionId)}.`,
      target: `${targets} ${event.targetIds.length === 1 ? "is" : "are"} targeted.`,
      outcome,
    };
    return { ...summary, text: `${summary.cause} ${summary.target} ${summary.outcome}` };
  }
  if (event.kind === "intercepted") {
    const summary = {
      cause: `${result.candidate.identity.displayName} follows the trial's cover policy.`,
      target: `${trialUnitName(result, event.protectedAllyId)} is protected from ${trialUnitName(result, event.attackerId)}.`,
      outcome: `${result.candidate.identity.displayName} takes the attack instead.`,
    };
    return { ...summary, text: `${summary.cause} ${summary.target} ${summary.outcome}` };
  }
  if (event.kind === "break_applied") {
    const summary = {
      cause: `${result.candidate.identity.displayName} reaches 3 Strain.`,
      target: `${result.candidate.identity.displayName} becomes Broken.`,
      outcome: `Defence -${event.defencePenalty} through Round ${event.untilRound}.`,
    };
    return { ...summary, text: `${summary.cause} ${summary.target} ${summary.outcome}` };
  }
  if (event.kind === "unit_defeated") {
    const summary = {
      cause: `${trialUnitName(result, event.byUnitId)} lands the final hit.`,
      target: `${trialUnitName(result, event.unitId)} is defeated.`,
      outcome,
    };
    return { ...summary, text: `${summary.cause} ${summary.target} ${summary.outcome}` };
  }
  return { cause: "The trial advances.", target: "The formation holds.", outcome, text: `The trial advances. The formation holds. ${outcome}` };
}

export function notTriggeredText(reason: RuleNotTriggeredReason): string {
  if (reason === "threshold_not_reached") return "Its health, enemy health, or Points threshold was not reached.";
  if (reason === "candidate_never_reached_action_window") return "The fighter did not reach an action where this rule could be checked.";
  return "The required action or combat event did not happen.";
}

export function activationSummaryText(summary: CandidateRuleActivationSummary): string {
  if (summary.activationCount > 0) {
    return `Triggered ${summary.activationCount} ${summary.activationCount === 1 ? "time" : "times"}.`;
  }
  return summary.notTriggeredReason ? notTriggeredText(summary.notTriggeredReason) : "Did not trigger.";
}

export function candidateRuleOutcomeText(
  result: CandidateTrialResult,
  summary: CandidateRuleActivationSummary,
): string | null {
  if (summary.activationCount === 0) return null;
  const triggerIds = new Set(
    result.events.flatMap((event) =>
      event.kind === "candidate_rule_triggered" &&
      event.source.sourceKind === summary.sourceKind &&
      event.source.sourceId === summary.sourceId
        ? [event.eventId]
        : [],
    ),
  );
  const directEffects = result.events.filter(
    (event) => "causedByEventId" in event && triggerIds.has(event.causedByEventId),
  );
  const totals = { HP: 0, Guard: 0, Points: 0, Strain: 0, storedPower: 0, forcedTargets: 0 };
  let requestedChange = false;
  const strainEventIds = new Set<string>();
  for (const event of directEffects) {
    if (event.kind === "health_changed") {
      totals.HP += event.applied;
      requestedChange ||= event.requested !== 0;
    } else if (event.kind === "guard_changed") {
      totals.Guard += event.applied;
      requestedChange ||= event.requested !== 0;
    } else if (event.kind === "points_changed") {
      totals.Points += event.applied;
      requestedChange ||= event.requested !== 0;
    } else if (event.kind === "strain_changed") {
      totals.Strain += event.applied;
      requestedChange ||= event.requested !== 0;
      strainEventIds.add(event.eventId);
    } else if (event.kind === "pending_bonus_changed") {
      totals.storedPower += event.applied;
      requestedChange ||= event.requested !== 0;
    } else if (event.kind === "pending_target_changed" && event.applied) {
      totals.forcedTargets += 1;
      requestedChange = true;
    }
  }
  const breaks = result.events.filter(
    (event) => event.kind === "break_applied" && strainEventIds.has(event.causedByEventId),
  ).length;
  const facts: string[] = [];
  if (totals.HP !== 0) facts.push(`HP ${signed(totals.HP)} total`);
  if (totals.Guard !== 0) facts.push(`Guard ${signed(totals.Guard)} total`);
  if (totals.Points !== 0) facts.push(`Points ${signed(totals.Points)} total`);
  if (totals.Strain !== 0) facts.push(`Strain ${signed(totals.Strain)} total`);
  if (totals.storedPower !== 0) facts.push(`stored Power ${signed(totals.storedPower)} total`);
  if (totals.forcedTargets > 0) {
    facts.push(`forced ${totals.forcedTargets} ${totals.forcedTargets === 1 ? "target" : "targets"}`);
  }
  if (breaks > 0) facts.push(`caused Broken ${breaks} ${breaks === 1 ? "time" : "times"}`);
  if (facts.length > 0) return `${facts.join("; ")}.`;
  return requestedChange ? "The rule triggered, but its value was already at a cap or floor." : null;
}

export function candidateTrialEventFact(result: CandidateTrialResult, event: CandidateTrialEvent): string {
  if (event.kind === "trial_started") return `${result.candidate.identity.displayName} starts the trial with ${event.profile.maxHealth} Max HP, ${event.profile.power} Power, ${event.profile.defence} Defence, and ${event.profile.startingTechniquePoints} Points.`;
  if (event.kind === "round_started") return `Round ${event.round} starts.`;
  if (event.kind === "action_options") return `${trialUnitName(result, event.actorId)} checks ${event.options.length} action options.`;
  if (event.kind === "intent_shown") return `${trialUnitName(result, event.actorId)} prepares ${trialActionName(event.actionId)} for ${event.targetIds.map((id) => trialUnitName(result, id)).join(", ")}.`;
  if (event.kind === "action_started") return `${trialUnitName(result, event.actorId)} uses ${trialActionName(event.actionId)}.`;
  if (event.kind === "technique_used") return `${result.candidate.identity.displayName} uses ${trialActionName(event.techniqueId)} for ${event.cost} Points.`;
  if (event.kind === "candidate_rule_triggered") return `${candidateRuleName(event.source)} triggers on ${trialUnitName(result, event.targetId)}.`;
  if (event.kind === "intercepted") return `${result.candidate.identity.displayName} intercepts an attack aimed at ${trialUnitName(result, event.protectedAllyId)}.`;
  if (event.kind === "guard_changed") return `${trialUnitName(result, event.targetId)} Guard ${signed(event.applied)} (${event.before} to ${event.after}).`;
  if (event.kind === "health_changed") return `${trialUnitName(result, event.targetId)} HP ${signed(event.applied)} (${event.before} to ${event.after}).`;
  if (event.kind === "points_changed") return `${result.candidate.identity.displayName} Points ${signed(event.applied)} (${event.before} to ${event.after}).`;
  if (event.kind === "strain_changed") return `${result.candidate.identity.displayName} Strain ${signed(event.applied)} (${event.before} to ${event.after}).`;
  if (event.kind === "pending_bonus_changed") return `${result.candidate.identity.displayName} stored Power ${signed(event.applied)} (${event.before} to ${event.after}).`;
  if (event.kind === "pending_target_changed") return event.after ? `${result.candidate.identity.displayName}'s next attack must target the ${event.after === "front_enemy" ? "front" : "weakest"} enemy.` : `${result.candidate.identity.displayName}'s forced target is cleared.`;
  if (event.kind === "damage_applied") return `${trialUnitName(result, event.targetId)} loses ${event.appliedHealthLoss} HP${event.appliedGuardAbsorption > 0 ? ` after ${event.appliedGuardAbsorption} Guard absorbs damage` : ""}.`;
  if (event.kind === "target_changed") return `${trialUnitName(result, event.actorId)} changes target from ${trialUnitName(result, event.fromTargetId)} to ${trialUnitName(result, event.toTargetId)}.`;
  if (event.kind === "break_applied") return `${result.candidate.identity.displayName} is Broken with Defence -${event.defencePenalty} through Round ${event.untilRound}.`;
  if (event.kind === "unit_defeated") return `${trialUnitName(result, event.byUnitId)} defeats ${trialUnitName(result, event.unitId)}.`;
  const outcome = event.winner === "candidate_team" ? "The candidate team wins" : event.winner === "training_enemies" ? "The candidate team loses" : "The trial is a draw";
  return `${outcome} after ${event.actionCount} actions.`;
}
