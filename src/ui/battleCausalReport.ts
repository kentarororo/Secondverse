import { STANCES } from "../content";
import type {
  BattleEvent,
  BattleResult,
  HeroId,
  HeroStanceId,
  TeamPolicyId,
  UnitId,
} from "../sim";
import { deriveBattleMoments, type BattleMoment } from "./moments";
import { TEAM_POLICY_COPY } from "./copy";
import { eventFact, unitName } from "./presentation";

export type BattleNonUseReasonCode =
  | "not_enough_points"
  | "condition_not_met"
  | "no_injured_ally"
  | "no_action_window";

export interface BattleNonUseReason {
  readonly code: BattleNonUseReasonCode;
  readonly text: string;
  readonly eventId: string;
}

export interface BattleCausalReportEntry {
  readonly kind: "team_policy" | "stance";
  readonly id: TeamPolicyId | HeroStanceId;
  readonly heroId: HeroId | null;
  readonly name: string;
  readonly ruleText: string;
  readonly activationCount: number;
  readonly status: "activated" | "not_activated";
  readonly observedOutcome: string;
  readonly eventId: string;
  readonly evidenceEventIds: readonly string[];
  readonly nonUseReason: BattleNonUseReason | null;
}

export interface BattleTurningPointReport {
  readonly eventId: string;
  readonly round: number;
  readonly kind: BattleEvent["kind"];
  readonly text: string;
  readonly evidenceEventIds: readonly string[];
}

export interface BattleCausalReport {
  readonly policy: BattleCausalReportEntry;
  readonly stances: readonly [
    BattleCausalReportEntry,
    BattleCausalReportEntry,
    BattleCausalReportEntry,
  ];
  readonly turningPoint: BattleTurningPointReport;
}

interface ObservedChange {
  readonly unitId: UnitId;
  readonly stat: "HP" | "Guard" | "Points";
  gained: number;
  lost: number;
}

function orderedUnique(values: readonly string[]): readonly string[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function momentContaining(
  moments: readonly BattleMoment[],
  eventId: string,
): BattleMoment | undefined {
  return moments.find((moment) => moment.sourceEventIds.includes(eventId));
}

function causalEvidenceForRoots(
  result: BattleResult,
  moments: readonly BattleMoment[],
  rootEventIds: readonly string[],
): readonly string[] {
  const evidence: string[] = [];

  for (const rootEventId of rootEventIds) {
    const moment = momentContaining(moments, rootEventId);
    if (!moment) {
      evidence.push(rootEventId);
      continue;
    }

    const linked = new Set([rootEventId]);
    for (const event of result.events.slice(moment.startEventIndex, moment.endEventIndex + 1)) {
      if (
        event.eventId === rootEventId ||
        ("causedByEventId" in event && linked.has(event.causedByEventId))
      ) {
        linked.add(event.eventId);
      }
    }
    evidence.push(...linked);
  }

  return orderedUnique(evidence);
}

function observedOutcome(result: BattleResult, evidenceEventIds: readonly string[]): string {
  const evidence = new Set(evidenceEventIds);
  const changes = new Map<string, ObservedChange>();
  const redirects: string[] = [];
  const defeats: string[] = [];

  function record(unitId: UnitId, stat: ObservedChange["stat"], amount: number): void {
    if (amount === 0) return;
    const key = `${unitId}:${stat}`;
    const current = changes.get(key) ?? { unitId, stat, gained: 0, lost: 0 };
    if (amount > 0) current.gained += amount;
    else current.lost += -amount;
    changes.set(key, current);
  }

  for (const event of result.events) {
    if (!evidence.has(event.eventId)) continue;
    switch (event.kind) {
      case "target_changed":
        redirects.push(
          `${unitName(event.actorId)} changed target from ${unitName(event.fromTargetId)} to ${unitName(event.toTargetId)}.`,
        );
        break;
      case "damage_applied":
        record(event.targetId, "HP", -event.healthLost);
        break;
      case "healed":
        record(event.targetId, "HP", event.healthGained);
        break;
      case "guard_changed":
        record(event.targetId, "Guard", event.amount);
        break;
      case "technique_changed":
        record(event.heroId, "Points", event.amount);
        break;
      case "unit_defeated":
        defeats.push(`${unitName(event.unitId)} was defeated.`);
        break;
      default:
        break;
    }
  }

  const byUnit = new Map<UnitId, ObservedChange[]>();
  for (const change of changes.values()) {
    const unitChanges = byUnit.get(change.unitId) ?? [];
    unitChanges.push(change);
    byUnit.set(change.unitId, unitChanges);
  }
  const changeText = [...byUnit.entries()].map(([unitId, unitChanges]) => {
    const facts = unitChanges.map((change) => {
      if (change.gained > 0 && change.lost > 0) {
        return `${change.stat} +${change.gained} and -${change.lost}`;
      }
      return change.gained > 0
        ? `${change.stat} +${change.gained}`
        : `${change.stat} -${change.lost}`;
    });
    return `${unitName(unitId)}: ${facts.join("; ")}.`;
  });

  const facts = [...redirects, ...changeText, ...defeats];
  return facts.length > 0
    ? facts.join(" ")
    : "Activated; no HP, Guard, or Points changed in its linked events.";
}

function lastEvent(result: BattleResult): BattleEvent {
  const event = result.events.at(-1);
  if (!event) throw new Error("Cannot derive a battle report without battle events");
  return event;
}

function nonUseReasonForStance(
  result: BattleResult,
  heroId: HeroId,
  stanceId: HeroStanceId,
): BattleNonUseReason | null {
  const checks = result.events.filter(
    (event): event is Extract<BattleEvent, { kind: "action_options" }> =>
      event.kind === "action_options" && event.actorId === heroId,
  );
  const latest = checks.at(-1);
  if (!latest) {
    const event = lastEvent(result);
    return {
      code: "no_action_window",
      text: `${unitName(heroId)} had no recorded action check before the battle ended.`,
      eventId: event.eventId,
    };
  }

  const option = latest.options.find((candidate) => candidate.stanceId === stanceId);
  const reasons = option?.reasons ?? [];
  if (reasons.includes("no_injured_ally")) {
    return {
      code: "no_injured_ally",
      text: "The last recorded check found no injured ally.",
      eventId: latest.eventId,
    };
  }
  if (reasons.includes("stance_waiting")) {
    return {
      code: "condition_not_met",
      text: "The last recorded check says the stance condition was not met.",
      eventId: latest.eventId,
    };
  }
  if (reasons.includes("not_enough_points")) {
    return {
      code: "not_enough_points",
      text: "The last recorded check found too few Points.",
      eventId: latest.eventId,
    };
  }
  return null;
}

function policyReport(
  result: BattleResult,
  moments: readonly BattleMoment[],
): BattleCausalReportEntry {
  const policyId = result.command.plan.teamPolicy;
  const activations = result.events.filter(
    (event): event is Extract<BattleEvent, { kind: "policy_triggered" }> =>
      event.kind === "policy_triggered" && event.policyId === policyId,
  );
  const evidenceEventIds = causalEvidenceForRoots(
    result,
    moments,
    activations.map((event) => event.eventId),
  );
  const fallback = result.events.find((event) => event.kind === "battle_started") ?? lastEvent(result);

  return {
    kind: "team_policy",
    id: policyId,
    heroId: null,
    name: TEAM_POLICY_COPY[policyId].name,
    ruleText: TEAM_POLICY_COPY[policyId].effect,
    activationCount: activations.length,
    status: activations.length > 0 ? "activated" : "not_activated",
    observedOutcome:
      activations.length > 0
        ? observedOutcome(result, evidenceEventIds)
        : "No policy activation was recorded.",
    eventId: activations[0]?.eventId ?? fallback.eventId,
    evidenceEventIds: activations.length > 0 ? evidenceEventIds : [fallback.eventId],
    nonUseReason: null,
  };
}

function stanceReport(
  result: BattleResult,
  moments: readonly BattleMoment[],
  heroId: HeroId,
  stanceId: HeroStanceId,
): BattleCausalReportEntry {
  const stance = STANCES[stanceId];
  const activations = result.events.filter(
    (event): event is Extract<BattleEvent, { kind: "stance_used" }> =>
      event.kind === "stance_used" && event.stanceId === stanceId,
  );
  const nonUseReason = activations.length === 0
    ? nonUseReasonForStance(result, heroId, stanceId)
    : null;
  const fallback = nonUseReason
    ? result.events.find((event) => event.eventId === nonUseReason.eventId) ?? lastEvent(result)
    : lastEvent(result);
  const evidenceEventIds = causalEvidenceForRoots(
    result,
    moments,
    activations.map((event) => event.eventId),
  );

  return {
    kind: "stance",
    id: stanceId,
    heroId,
    name: stance.name,
    ruleText: stance.forecast,
    activationCount: activations.length,
    status: activations.length > 0 ? "activated" : "not_activated",
    observedOutcome:
      activations.length > 0
        ? observedOutcome(result, evidenceEventIds)
        : nonUseReason?.text ?? "No activation was recorded; the events give no typed reason.",
    eventId: activations[0]?.eventId ?? fallback.eventId,
    evidenceEventIds: activations.length > 0 ? evidenceEventIds : [fallback.eventId],
    nonUseReason,
  };
}

function turningPointReport(result: BattleResult): BattleTurningPointReport {
  const event = result.events.find(
    (candidate) => candidate.eventId === result.highlights.turningPointEventId,
  );
  if (!event) {
    throw new Error(`Missing turning-point event ${result.highlights.turningPointEventId}`);
  }
  return {
    eventId: event.eventId,
    round: event.round,
    kind: event.kind,
    text: eventFact(event),
    evidenceEventIds: [event.eventId],
  };
}

export function deriveBattleCausalReport(result: BattleResult): BattleCausalReport {
  const moments = deriveBattleMoments(result);
  const { stances } = result.command.plan;
  return {
    policy: policyReport(result, moments),
    stances: [
      stanceReport(result, moments, "ada", stances.ada),
      stanceReport(result, moments, "bo", stances.bo),
      stanceReport(result, moments, "cy", stances.cy),
    ],
    turningPoint: turningPointReport(result),
  };
}
