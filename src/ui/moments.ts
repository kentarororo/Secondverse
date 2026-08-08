import { STANCES } from "../content";
import type {
  ActionId,
  ActionOptionReason,
  BattleEvent,
  BattleResult,
  HeroId,
  HeroStanceId,
  StanceEffect,
  TeamPolicyId,
  UnitId,
} from "../sim";

export type BattleMomentKind = "setup" | "action" | "outcome";
export type MomentPlaybackMode = "key" | "all";
export type MomentStat =
  | "health"
  | "max-health"
  | "guard"
  | "technique"
  | "strain"
  | "speed";

export interface MomentDelta {
  readonly unitId: UnitId;
  readonly stat: MomentStat;
  readonly gained: number;
  readonly lost: number;
  readonly net: number;
  readonly before: number;
  readonly after: number;
  readonly sourceEventIds: readonly string[];
}

export type MomentStanceTrigger = "ready" | "condition" | "forced";

export interface MomentStance {
  readonly eventId: string;
  readonly heroId: HeroId;
  readonly stanceId: HeroStanceId;
  readonly trigger: MomentStanceTrigger;
  readonly effect: StanceEffect["kind"];
  readonly techniquePointsSpent: 2 | 3;
}

interface MomentFactBase {
  readonly eventId: string;
}

export type MomentKeyFact =
  | (MomentFactBase & {
      readonly kind: "condition";
      readonly targetId: HeroId;
      readonly condition: "bruised";
      readonly healthPenalty: 12;
    })
  | (MomentFactBase & {
      readonly kind: "equipment";
      readonly targetId: HeroId;
      readonly equipmentId: Extract<BattleEvent, { kind: "equipment_applied" }>["equipmentId"];
    })
  | (MomentFactBase & {
      readonly kind: "policy";
      readonly policyId: TeamPolicyId;
      readonly actorId: HeroId;
      readonly targetId: HeroId;
      readonly effect: "starting_guard" | "intercept";
    })
  | (MomentFactBase & {
      readonly kind: "stance";
      readonly stance: MomentStance;
    })
  | (MomentFactBase & {
      readonly kind: "enemy_rule";
      readonly actorId: UnitId;
      readonly actionId: "rear_strike" | "line_hit";
      readonly targetIds: readonly UnitId[];
    })
  | (MomentFactBase & {
      readonly kind: "enemy_mark";
      readonly actorId: UnitId;
      readonly targetId: HeroId;
    })
  | (MomentFactBase & {
      readonly kind: "signature";
      readonly actorId: HeroId;
      readonly signatureName: string;
      readonly targetId: UnitId;
    })
  | (MomentFactBase & {
      readonly kind: "break";
      readonly actorId: UnitId;
      readonly targetId: HeroId;
      readonly guardRemoved: number;
      readonly defencePenalty: number;
    })
  | (MomentFactBase & {
      readonly kind: "defeat";
      readonly unitId: UnitId;
      readonly byUnitId: UnitId;
    })
  | (MomentFactBase & {
      readonly kind: "decisive";
      readonly actorId: UnitId;
      readonly targetId: UnitId;
      readonly reason: Extract<BattleEvent, { kind: "decisive_moment" }>["reason"];
    });

export type MomentFocusKind = MomentKeyFact["kind"] | "anchor";

export interface BattleMoment {
  readonly id: `moment:${string}`;
  readonly kind: BattleMomentKind;
  readonly anchorEventId: string;
  readonly focusEventId: string;
  readonly focusKind: MomentFocusKind;
  readonly startEventIndex: number;
  readonly endEventIndex: number;
  readonly round: number;
  readonly actorId: UnitId | null;
  readonly actionId: ActionId | null;
  readonly intendedTargetIds: readonly UnitId[];
  readonly resolvedTargetIds: readonly UnitId[];
  readonly stance: MomentStance | null;
  readonly sourceEventIds: readonly string[];
  readonly compressedEventIds: readonly string[];
  readonly keyFacts: readonly MomentKeyFact[];
  readonly deltas: readonly MomentDelta[];
}

export interface PlaybackMoment {
  readonly moment: BattleMoment;
  readonly routineActionsAdvanced: number;
}

interface AtomicDelta {
  readonly eventId: string;
  readonly unitId: UnitId;
  readonly stat: MomentStat;
  readonly amount: number;
  readonly before: number;
  readonly after: number;
}

const FOCUS_PRIORITY: readonly MomentKeyFact["kind"][] = [
  "decisive",
  "defeat",
  "break",
  "signature",
  "policy",
  "enemy_mark",
  "enemy_rule",
  "stance",
  "condition",
  "equipment",
];

function orderedUnique<T>(values: readonly T[]): readonly T[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function stanceTrigger(
  events: readonly BattleEvent[],
  stanceIndex: number,
  stanceId: HeroStanceId,
): MomentStanceTrigger {
  for (let index = stanceIndex - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event) continue;
    if (event.kind === "action_options") {
      const option = event.options.find((candidate) => candidate.stanceId === stanceId);
      const reasons = option?.reasons ?? ([] as readonly ActionOptionReason[]);
      if (reasons.includes("stance_forced")) return "forced";
      if (reasons.includes("stance_triggered")) return "condition";
      return "ready";
    }
    if (event.kind === "action_started" || event.kind === "round_started") break;
  }
  return "ready";
}

function stanceFact(
  events: readonly BattleEvent[],
  event: Extract<BattleEvent, { kind: "stance_used" }>,
  eventIndex: number,
): MomentStance {
  return {
    eventId: event.eventId,
    heroId: event.heroId,
    stanceId: event.stanceId,
    trigger: stanceTrigger(events, eventIndex, event.stanceId),
    effect: event.effect,
    techniquePointsSpent: event.techniquePointsSpent,
  };
}

function atomicDeltas(events: readonly BattleEvent[]): ReadonlyMap<string, readonly AtomicDelta[]> {
  const byEventId = new Map<string, readonly AtomicDelta[]>();
  const strainByUnit = new Map<UnitId, number>();

  for (const event of events) {
    let deltas: readonly AtomicDelta[] = [];
    switch (event.kind) {
      case "condition_applied":
        deltas = [
          {
            eventId: event.eventId,
            unitId: event.targetId,
            stat: "max-health",
            amount: event.maxHealthAfter - event.maxHealthBefore,
            before: event.maxHealthBefore,
            after: event.maxHealthAfter,
          },
          {
            eventId: event.eventId,
            unitId: event.targetId,
            stat: "health",
            amount: event.healthAfter - event.healthBefore,
            before: event.healthBefore,
            after: event.healthAfter,
          },
        ];
        break;
      case "equipment_applied":
        if (event.speedChange !== 0) {
          deltas = [
            {
              eventId: event.eventId,
              unitId: event.targetId,
              stat: "speed",
              amount: event.speedChange,
              before: event.speedBefore,
              after: event.speedAfter,
            },
          ];
        }
        break;
      case "damage_applied":
        if (event.healthLost !== 0) {
          deltas = [
            {
              eventId: event.eventId,
              unitId: event.targetId,
              stat: "health",
              amount: -event.healthLost,
              before: event.healthAfter + event.healthLost,
              after: event.healthAfter,
            },
          ];
        }
        break;
      case "healed":
        if (event.healthGained !== 0) {
          deltas = [
            {
              eventId: event.eventId,
              unitId: event.targetId,
              stat: "health",
              amount: event.healthGained,
              before: event.healthAfter - event.healthGained,
              after: event.healthAfter,
            },
          ];
        }
        break;
      case "guard_changed":
        if (event.amount !== 0) {
          deltas = [
            {
              eventId: event.eventId,
              unitId: event.targetId,
              stat: "guard",
              amount: event.amount,
              before: event.guardAfter - event.amount,
              after: event.guardAfter,
            },
          ];
        }
        break;
      case "technique_changed":
        if (event.amount !== 0) {
          deltas = [
            {
              eventId: event.eventId,
              unitId: event.heroId,
              stat: "technique",
              amount: event.amount,
              before: event.pointsAfter - event.amount,
              after: event.pointsAfter,
            },
          ];
        }
        break;
      case "strain_changed": {
        const before = strainByUnit.get(event.targetId) ?? 0;
        const amount = event.strainAfter - before;
        strainByUnit.set(event.targetId, event.strainAfter);
        if (amount !== 0) {
          deltas = [
            {
              eventId: event.eventId,
              unitId: event.targetId,
              stat: "strain",
              amount,
              before,
              after: event.strainAfter,
            },
          ];
        }
        break;
      }
      default:
        break;
    }
    byEventId.set(event.eventId, deltas);
  }

  return byEventId;
}

function aggregateDeltas(
  sourceEvents: readonly BattleEvent[],
  deltaMap: ReadonlyMap<string, readonly AtomicDelta[]>,
): readonly MomentDelta[] {
  const aggregate = new Map<string, MomentDelta>();

  for (const event of sourceEvents) {
    for (const delta of deltaMap.get(event.eventId) ?? []) {
      const key = `${delta.unitId}:${delta.stat}`;
      const current = aggregate.get(key);
      if (!current) {
        aggregate.set(key, {
          unitId: delta.unitId,
          stat: delta.stat,
          gained: Math.max(0, delta.amount),
          lost: Math.max(0, -delta.amount),
          net: delta.amount,
          before: delta.before,
          after: delta.after,
          sourceEventIds: [delta.eventId],
        });
        continue;
      }
      aggregate.set(key, {
        ...current,
        gained: current.gained + Math.max(0, delta.amount),
        lost: current.lost + Math.max(0, -delta.amount),
        net: current.net + delta.amount,
        after: delta.after,
        sourceEventIds: [...current.sourceEventIds, delta.eventId],
      });
    }
  }

  return [...aggregate.values()];
}

function factsForEvents(
  allEvents: readonly BattleEvent[],
  sourceEvents: readonly BattleEvent[],
  startEventIndex: number,
): readonly MomentKeyFact[] {
  return sourceEvents.flatMap((event, offset): readonly MomentKeyFact[] => {
    const eventIndex = startEventIndex + offset;
    switch (event.kind) {
      case "condition_applied":
        return [{
          kind: "condition",
          eventId: event.eventId,
          targetId: event.targetId,
          condition: event.condition,
          healthPenalty: event.healthPenalty,
        }];
      case "equipment_applied":
        return [{
          kind: "equipment",
          eventId: event.eventId,
          targetId: event.targetId,
          equipmentId: event.equipmentId,
        }];
      case "policy_triggered":
        return [{
          kind: "policy",
          eventId: event.eventId,
          policyId: event.policyId,
          actorId: event.actorId,
          targetId: event.targetId,
          effect: event.effect,
        }];
      case "intent_shown":
        return event.actionId === "rear_strike" || event.actionId === "line_hit"
          ? [{
              kind: "enemy_rule",
              eventId: event.eventId,
              actorId: event.actorId,
              actionId: event.actionId,
              targetIds: [...event.targetIds],
            }]
          : [];
      case "stance_used": {
        const stance = stanceFact(allEvents, event, eventIndex);
        return [{ kind: "stance", eventId: event.eventId, stance }];
      }
      case "target_marked":
        return [{
          kind: "enemy_mark",
          eventId: event.eventId,
          actorId: event.actorId,
          targetId: event.targetId,
        }];
      case "signature_triggered":
        return [{
          kind: "signature",
          eventId: event.eventId,
          actorId: event.actorId,
          signatureName: event.signatureName,
          targetId: event.targetId,
        }];
      case "front_broken":
        return [{
          kind: "break",
          eventId: event.eventId,
          actorId: event.actorId,
          targetId: event.targetId,
          guardRemoved: event.guardRemoved,
          defencePenalty: event.defencePenalty,
        }];
      case "unit_defeated":
        return [{
          kind: "defeat",
          eventId: event.eventId,
          unitId: event.unitId,
          byUnitId: event.byUnitId,
        }];
      case "decisive_moment":
        return [{
          kind: "decisive",
          eventId: event.eventId,
          actorId: event.actorId,
          targetId: event.targetId,
          reason: event.reason,
        }];
      default:
        return [];
    }
  });
}

function resolvedTargets(sourceEvents: readonly BattleEvent[]): readonly UnitId[] {
  const action = sourceEvents.find((event) => event.kind === "action_started");
  if (action?.kind === "action_started") return [...action.targetIds];
  return orderedUnique(
    sourceEvents.flatMap((event): readonly UnitId[] => {
      switch (event.kind) {
        case "damage_applied":
        case "healed":
        case "guard_changed":
        case "strain_changed":
        case "front_broken":
          return [event.targetId];
        case "unit_defeated":
          return [event.unitId];
        default:
          return [];
      }
    }),
  );
}

function focusForMoment(
  anchorEventId: string,
  facts: readonly MomentKeyFact[],
): { readonly focusEventId: string; readonly focusKind: MomentFocusKind } {
  for (const kind of FOCUS_PRIORITY) {
    const fact = facts.find((candidate) => candidate.kind === kind);
    if (fact) return { focusEventId: fact.eventId, focusKind: kind };
  }
  return { focusEventId: anchorEventId, focusKind: "anchor" };
}

function buildMoment(
  result: BattleResult,
  kind: BattleMomentKind,
  startEventIndex: number,
  endEventIndex: number,
  anchorEventIndex: number,
  deltaMap: ReadonlyMap<string, readonly AtomicDelta[]>,
): BattleMoment {
  const sourceEvents = result.events.slice(startEventIndex, endEventIndex + 1);
  const anchor = result.events[anchorEventIndex];
  if (!anchor) throw new Error(`Missing battle moment anchor at ${anchorEventIndex}`);
  const intent = sourceEvents.find((event) => event.kind === "intent_shown");
  const facts = factsForEvents(result.events, sourceEvents, startEventIndex);
  const deltas = aggregateDeltas(sourceEvents, deltaMap);
  const stance = facts.find((fact) => fact.kind === "stance")?.stance ?? null;
  const retainedIds = new Set([
    anchor.eventId,
    ...facts.map((fact) => fact.eventId),
    ...deltas.flatMap((delta) => delta.sourceEventIds),
  ]);
  const focus = focusForMoment(anchor.eventId, facts);

  return {
    id: `moment:${anchor.eventId}`,
    kind,
    anchorEventId: anchor.eventId,
    ...focus,
    startEventIndex,
    endEventIndex,
    round: anchor.round,
    actorId: intent?.kind === "intent_shown" ? intent.actorId : null,
    actionId: intent?.kind === "intent_shown" ? intent.actionId : null,
    intendedTargetIds: intent?.kind === "intent_shown" ? [...intent.targetIds] : [],
    resolvedTargetIds: resolvedTargets(sourceEvents),
    stance,
    sourceEventIds: sourceEvents.map((event) => event.eventId),
    compressedEventIds: sourceEvents
      .filter((event) => !retainedIds.has(event.eventId))
      .map((event) => event.eventId),
    keyFacts: facts,
    deltas,
  };
}

function actionStartForIntent(
  events: readonly BattleEvent[],
  intentIndex: number,
  minimumIndex: number,
): number {
  let start = intentIndex;
  for (let index = intentIndex - 1; index >= minimumIndex; index -= 1) {
    const event = events[index];
    if (!event) continue;
    if (event.kind === "action_options") {
      start = index;
      if (events[index - 1]?.kind === "round_started" && index - 1 >= minimumIndex) {
        start = index - 1;
      }
      break;
    }
    if (event.kind === "round_started") {
      start = index;
      break;
    }
  }
  return start;
}

export function deriveBattleMoments(result: BattleResult): readonly BattleMoment[] {
  if (result.events.length === 0) return [];
  const deltaMap = atomicDeltas(result.events);
  const battleEndIndex = result.events.findIndex((event) => event.kind === "battle_ended");
  const outcomeStart = battleEndIndex >= 0 ? battleEndIndex : result.events.length;
  const firstRoundIndex = result.events.findIndex((event) => event.kind === "round_started");
  const intentIndices = result.events
    .map((event, index) => ({ event, index }))
    .filter(
      (entry): entry is { event: Extract<BattleEvent, { kind: "intent_shown" }>; index: number } =>
        entry.event.kind === "intent_shown" && entry.index < outcomeStart,
    )
    .map((entry) => entry.index);

  if (intentIndices.length === 0) {
    const setupEnd = Math.max(0, outcomeStart - 1);
    const moments = [buildMoment(result, "setup", 0, setupEnd, 0, deltaMap)];
    if (battleEndIndex >= 0) {
      moments.push(
        buildMoment(
          result,
          "outcome",
          battleEndIndex,
          result.events.length - 1,
          battleEndIndex,
          deltaMap,
        ),
      );
    }
    return moments;
  }

  const setupEnd = firstRoundIndex >= 0 ? firstRoundIndex : Math.max(0, intentIndices[0]! - 1);
  const starts = intentIndices.map((intentIndex, index) => {
    const minimum = index === 0 ? setupEnd + 1 : intentIndices[index - 1]! + 1;
    return actionStartForIntent(result.events, intentIndex, minimum);
  });
  starts[0] = setupEnd + 1;

  const moments: BattleMoment[] = [buildMoment(result, "setup", 0, setupEnd, 0, deltaMap)];
  for (let index = 0; index < intentIndices.length; index += 1) {
    const start = starts[index]!;
    const end = (starts[index + 1] ?? outcomeStart) - 1;
    moments.push(buildMoment(result, "action", start, end, intentIndices[index]!, deltaMap));
  }
  if (battleEndIndex >= 0) {
    moments.push(
      buildMoment(
        result,
        "outcome",
        battleEndIndex,
        result.events.length - 1,
        battleEndIndex,
        deltaMap,
      ),
    );
  }
  return moments;
}

function repeatKey(fact: MomentKeyFact): string | null {
  switch (fact.kind) {
    case "stance":
      return `stance:${fact.stance.stanceId}`;
    case "signature":
      return `signature:${fact.actorId}:${fact.signatureName}`;
    case "enemy_rule":
      return `rule:${fact.actionId}`;
    case "enemy_mark":
      return `mark:${fact.actorId}`;
    default:
      return null;
  }
}

function requiredKeyMoment(
  result: BattleResult,
  moment: BattleMoment,
  seenRepeatKeys: Set<string>,
): boolean {
  if (moment.kind === "setup" || moment.kind === "outcome") return true;
  if (
    moment.keyFacts.some((fact) =>
      fact.kind === "break" ||
      fact.kind === "defeat" ||
      fact.kind === "decisive" ||
      fact.kind === "policy" ||
      fact.kind === "condition" ||
      fact.kind === "equipment",
    )
  ) {
    for (const fact of moment.keyFacts) {
      const key = repeatKey(fact);
      if (key) seenRepeatKeys.add(key);
    }
    return true;
  }

  let include = false;
  for (const fact of moment.keyFacts) {
    if (fact.kind === "stance") {
      const selected = result.command.plan.stances[fact.stance.heroId];
      if (fact.stance.stanceId !== selected) continue;
    }
    const key = repeatKey(fact);
    if (!key || seenRepeatKeys.has(key)) continue;
    seenRepeatKeys.add(key);
    include = true;
  }
  return include;
}

export function selectPlaybackMoments(
  result: BattleResult,
  mode: MomentPlaybackMode = "key",
): readonly PlaybackMoment[] {
  const moments = deriveBattleMoments(result);
  if (mode === "all") {
    return moments.map((moment) => ({ moment, routineActionsAdvanced: 0 }));
  }

  const seenRepeatKeys = new Set<string>();
  let routineIndex = 0;
  const selectedIndices = moments
    .map((moment, index) => ({ moment, index }))
    .filter(({ moment }) => {
      if (requiredKeyMoment(result, moment, seenRepeatKeys)) return true;
      if (moment.kind !== "action" || moment.focusKind !== "anchor") return false;
      const includeRoutineContext = routineIndex % 2 === 0;
      routineIndex += 1;
      return includeRoutineContext;
    })
    .map(({ index }) => index);

  return selectedIndices.map((momentIndex, playbackIndex) => {
    const previousIndex = selectedIndices[playbackIndex - 1] ?? -1;
    const routineActionsAdvanced = moments
      .slice(previousIndex + 1, momentIndex)
      .filter((moment) => moment.kind === "action").length;
    return { moment: moments[momentIndex]!, routineActionsAdvanced };
  });
}

export function momentDurationMs(moment: BattleMoment, reducedMotion: boolean): number {
  if (reducedMotion) {
    if (moment.kind === "setup" || moment.kind === "outcome") return 1800;
    return moment.focusKind === "anchor" ? 1500 : 2000;
  }
  if (moment.kind === "setup" || moment.kind === "outcome") return 2000;
  if (moment.focusKind === "decisive") return 2800;
  if (moment.focusKind === "defeat" || moment.focusKind === "break") return 2500;
  if (moment.focusKind === "anchor") return 900;
  return 2200;
}

export function stanceEffectText(stance: MomentStance): string {
  const definition = STANCES[stance.stanceId];
  const cost = `${stance.techniquePointsSpent} points`;
  switch (definition.effect.kind) {
    case "guard_self":
      return `+${definition.effect.guard} guard · ${cost}`;
    case "hit_front":
      return `Heavy Hit on front · ${cost}`;
    case "finish_weak":
      return `Heavy Hit on weakest · ${cost}`;
    case "heal_one":
      return `Heal ${definition.effect.healing} on 1 ally · ${cost}`;
    case "heal_two":
      return `Heal ${definition.effect.healing} on up to 2 allies · ${cost}`;
  }
}
