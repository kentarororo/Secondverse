import { ENCOUNTERS, ENEMIES, HEROES, STANCES } from "../content";
import { EQUIPMENT } from "../equipment";
import type {
  ActionId,
  ActionOptionReason,
  BattleEvent,
  BattleResult,
  FormationSlot,
  HeroId,
  HeroStanceId,
  UnitId,
  UnitSnapshot,
} from "../sim";
import { HERO_IDS } from "../sim";
import { resolveUnitVisual, type EffectVisualId, type StatusVisualId } from "./assets";
import { ACTION_NAMES, TEAM_POLICY_COPY } from "./copy";
import {
  deriveBattleMoments,
  type BattleMoment,
  type MomentDelta,
} from "./moments";

const SLOT_ORDER: readonly FormationSlot[] = ["front", "middle", "rear"];

export type UnitDeltaKind =
  | "health"
  | "max-health"
  | "guard"
  | "technique"
  | "strain"
  | "speed";
export type ReactionKind = "damage" | "heal" | "break" | "defeat";

export interface UnitDelta {
  readonly unitId: UnitId;
  readonly kind: UnitDeltaKind;
  readonly amount: number;
  readonly text: string;
  readonly gained?: number;
  readonly lost?: number;
  readonly before?: number;
  readonly after?: number;
  readonly sourceEventIds?: readonly string[];
}

export type UnitStatusKind = "marked" | "broken" | "defeated" | "bruised";

export interface UnitStatusCue {
  readonly unitId: UnitId;
  readonly kind: UnitStatusKind;
  readonly label: string;
  readonly visualId: StatusVisualId;
}

export interface StanceRibbon {
  readonly heroId: UnitId;
  readonly stanceId: HeroStanceId;
  readonly name: string;
  readonly detail: string;
  readonly trigger: "ready" | "condition" | "forced";
}

export interface CombatFeedback {
  readonly deltas: readonly UnitDelta[];
  readonly statuses: readonly UnitStatusCue[];
  readonly stance: StanceRibbon | null;
}

export interface ContactCue {
  readonly actorId: UnitId;
  readonly targetIds: readonly UnitId[];
  readonly reaction: ReactionKind;
  readonly actionId?: ActionId;
}

export interface MomentSummary {
  readonly label: "Setup" | "Action" | "Outcome";
  readonly cause: string;
  readonly target: string;
  readonly outcome: string;
  readonly text: string;
}

export interface PlanTrackerItem {
  readonly heroId: HeroId;
  readonly heroName: string;
  readonly stanceId: HeroStanceId;
  readonly stanceName: string;
  readonly state: "not-used" | "ready" | "activated";
  readonly status: string;
  readonly detail: string | null;
  readonly outcome: string | null;
}

export function unitName(unitId: UnitId): string {
  return unitId in HEROES
    ? HEROES[unitId as keyof typeof HEROES].name
    : ENEMIES[unitId as keyof typeof ENEMIES].name;
}

export function createInitialUnits(result: BattleResult): readonly UnitSnapshot[] {
  const heroes = SLOT_ORDER.map((slot) => {
    const id = result.command.plan.formation[slot];
    const hero = HEROES[id];
    return {
      id,
      name: hero.name,
      side: "heroes" as const,
      slot,
      health: hero.stats.maxHealth,
      maxHealth: hero.stats.maxHealth,
      speed: hero.stats.speed,
      guard: 0,
      techniquePoints: 0,
      strain: 0,
      broken: false,
      defeated: false,
    };
  });
  const encounter = ENCOUNTERS[result.command.encounterId];
  const enemies = encounter.enemyIds.map((id, index) => {
    const enemy = ENEMIES[id];
    const slot = SLOT_ORDER[index];
    if (!slot) {
      throw new Error(`Missing slot for ${id}`);
    }
    return {
      id,
      name: enemy.name,
      side: "enemies" as const,
      slot,
      health: enemy.stats.maxHealth,
      maxHealth: enemy.stats.maxHealth,
      speed: enemy.stats.speed,
      guard: 0,
      techniquePoints: 0,
      strain: 0,
      broken: false,
      defeated: false,
    };
  });
  return [...heroes, ...enemies];
}

export function unitsAtEvent(result: BattleResult, cursor: number): readonly UnitSnapshot[] {
  if (cursor >= result.events.length - 1) {
    return result.finalUnits;
  }
  const units = createInitialUnits(result).map((unit) => ({ ...unit }));
  const brokenUntilRound = new Map<UnitId, number>();

  for (const event of result.events.slice(0, Math.max(0, cursor + 1))) {
    if (event.kind === "round_started") {
      for (const unit of units) {
        const until = brokenUntilRound.get(unit.id);
        if (until !== undefined && until < event.round) {
          unit.broken = false;
        }
      }
      continue;
    }
    if (event.kind === "equipment_applied") {
      const target = units.find((candidate) => candidate.id === event.targetId);
      if (target) target.speed = event.speedAfter;
      continue;
    }
    if (event.kind === "condition_applied") {
      const target = units.find((candidate) => candidate.id === event.targetId);
      if (target) {
        target.maxHealth = event.maxHealthAfter;
        target.health = event.healthAfter;
      }
      continue;
    }
    const targetId =
      event.kind === "damage_applied" ||
      event.kind === "healed" ||
      event.kind === "guard_changed" ||
      event.kind === "strain_changed" ||
      event.kind === "front_broken"
        ? event.targetId
        : event.kind === "technique_changed"
          ? event.heroId
          : event.kind === "unit_defeated"
            ? event.unitId
            : null;
    if (!targetId) {
      continue;
    }
    const unit = units.find((candidate) => candidate.id === targetId);
    if (!unit) {
      continue;
    }
    switch (event.kind) {
      case "damage_applied":
        unit.health = event.healthAfter;
        break;
      case "healed":
        unit.health = event.healthAfter;
        break;
      case "guard_changed":
        unit.guard = event.guardAfter;
        break;
      case "technique_changed":
        unit.techniquePoints = event.pointsAfter;
        break;
      case "strain_changed":
        unit.strain = event.strainAfter;
        break;
      case "front_broken":
        unit.broken = true;
        brokenUntilRound.set(unit.id, event.round + 1);
        break;
      case "unit_defeated":
        unit.health = 0;
        unit.defeated = true;
        break;
    }
  }
  return units;
}

function signed(amount: number): string {
  return `${amount >= 0 ? "+" : "−"}${Math.abs(amount)}`;
}

export function eventUnitDeltas(result: BattleResult, cursor: number): readonly UnitDelta[] {
  const event = result.events[cursor];
  if (!event) return [];
  switch (event.kind) {
    case "condition_applied":
      return [
        {
          unitId: event.targetId,
          kind: "max-health",
          amount: event.maxHealthAfter - event.maxHealthBefore,
          text: `Max HP ${signed(event.maxHealthAfter - event.maxHealthBefore)}`,
        },
        {
          unitId: event.targetId,
          kind: "health",
          amount: event.healthAfter - event.healthBefore,
          text: `HP ${signed(event.healthAfter - event.healthBefore)}`,
        },
      ];
    case "equipment_applied":
      return event.speedChange !== 0
        ? [{ unitId: event.targetId, kind: "speed", amount: event.speedChange, text: `Speed ${signed(event.speedChange)}` }]
        : [];
    case "damage_applied":
      return event.healthLost > 0
        ? [{ unitId: event.targetId, kind: "health", amount: -event.healthLost, text: `HP ${signed(-event.healthLost)}` }]
        : [];
    case "healed":
      return event.healthGained > 0
        ? [{ unitId: event.targetId, kind: "health", amount: event.healthGained, text: `HP ${signed(event.healthGained)}` }]
        : [];
    case "guard_changed":
      return event.amount !== 0
        ? [{ unitId: event.targetId, kind: "guard", amount: event.amount, text: `Guard ${signed(event.amount)}` }]
        : [];
    case "technique_changed":
      return event.amount !== 0
        ? [{ unitId: event.heroId, kind: "technique", amount: event.amount, text: `Points ${signed(event.amount)}` }]
        : [];
    case "strain_changed": {
      const previous = unitsAtEvent(result, cursor - 1).find((unit) => unit.id === event.targetId);
      const amount = event.strainAfter - (previous?.strain ?? 0);
      return amount !== 0
        ? [{ unitId: event.targetId, kind: "strain", amount, text: `Strain ${signed(amount)}` }]
        : [];
    }
    default:
      return [];
  }
}

function stanceTriggerReason(
  result: BattleResult,
  stanceIndex: number,
  stanceId: HeroStanceId,
): StanceRibbon["trigger"] {
  for (let index = stanceIndex - 1; index >= 0; index -= 1) {
    const event = result.events[index];
    if (!event) continue;
    if (event.kind === "action_options") {
      const option = event.options.find((candidate) => candidate.stanceId === stanceId);
      if (!option) return "ready";
      const reasons = option.reasons as readonly ActionOptionReason[];
      if (reasons.includes("stance_forced")) return "forced";
      if (reasons.includes("stance_triggered")) return "condition";
      return "ready";
    }
    if (event.kind === "action_started" || event.kind === "round_started") break;
  }
  return "ready";
}

function stanceEffectDetail(
  event: Extract<BattleEvent, { kind: "stance_used" }>,
): string {
  const stance = STANCES[event.stanceId];
  const cost = `${event.techniquePointsSpent} Points`;
  switch (stance.effect.kind) {
    case "guard_self":
      return `Gains ${stance.effect.guard} Guard and spends ${cost}`;
    case "hit_front":
      return `Uses Heavy Hit against the front enemy and spends ${cost}`;
    case "finish_weak":
      return `Uses Heavy Hit against the weakest enemy and spends ${cost}`;
    case "heal_one":
      return `Restores ${stance.effect.healing} HP to one ally and spends ${cost}`;
    case "heal_two":
      return `Restores ${stance.effect.healing} HP to each of up to two allies and spends ${cost}`;
  }
}

function momentStanceEffectText(stance: NonNullable<BattleMoment["stance"]>): string {
  const definition = STANCES[stance.stanceId];
  const cost = `${stance.techniquePointsSpent} Points`;
  switch (definition.effect.kind) {
    case "guard_self":
      return `Gains ${definition.effect.guard} Guard and spends ${cost}.`;
    case "hit_front":
      return `Uses Heavy Hit against the front enemy and spends ${cost}.`;
    case "finish_weak":
      return `Uses Heavy Hit against the weakest enemy and spends ${cost}.`;
    case "heal_one":
      return `Restores ${definition.effect.healing} HP to one ally and spends ${cost}.`;
    case "heal_two":
      return `Restores ${definition.effect.healing} HP to each of up to two allies and spends ${cost}.`;
  }
}

function activeActionStart(result: BattleResult, cursor: number): number {
  for (let index = Math.min(cursor, result.events.length - 1); index >= 0; index -= 1) {
    const event = result.events[index];
    if (!event) continue;
    if (event.kind !== "stance_used" && event.kind !== "action_started") continue;
    const directCause = result.events.find(
      (candidate) => candidate.eventId === event.causedByEventId,
    );
    const intentId =
      directCause?.kind === "stance_used" ? directCause.causedByEventId : event.causedByEventId;
    const intentIndex = result.events.findIndex(
      (candidate) => candidate.eventId === intentId && candidate.kind === "intent_shown",
    );
    return intentIndex >= 0 ? intentIndex : index;
  }
  return cursor;
}

function currentIntentStart(result: BattleResult, cursor: number): number {
  for (let index = Math.min(cursor, result.events.length - 1); index >= 0; index -= 1) {
    if (result.events[index]?.kind === "intent_shown") return index;
    if (result.events[index]?.kind === "battle_started") break;
  }
  return cursor;
}

function statusCue(
  unitId: UnitId,
  kind: UnitStatusKind,
  label: string,
): UnitStatusCue {
  return { unitId, kind, label, visualId: `status.${kind}` };
}

export function combatFeedbackAtEvent(result: BattleResult, cursor: number): CombatFeedback {
  const boundedCursor = Math.min(Math.max(cursor, 0), result.events.length - 1);
  const deltaStart = activeActionStart(result, boundedCursor);
  const cueStart = currentIntentStart(result, boundedCursor);
  const windowEvents = result.events.slice(cueStart, boundedCursor + 1);
  const deltas = result.events
    .slice(deltaStart, boundedCursor + 1)
    .flatMap((_, offset) => eventUnitDeltas(result, deltaStart + offset));
  const units = unitsAtEvent(result, boundedCursor);
  const statuses: UnitStatusCue[] = [];

  if (result.command.plan.priorCondition?.kind === "bruised") {
    const condition = result.command.plan.priorCondition;
    statuses.push(
      statusCue(
        condition.heroId,
        "bruised",
        `Bruised · −${condition.healthPenalty} max HP`,
      ),
    );
  }
  for (const unit of units) {
    if (unit.broken) statuses.push(statusCue(unit.id, "broken", "Broken"));
    if (unit.defeated) statuses.push(statusCue(unit.id, "defeated", "Defeated"));
  }
  for (const event of windowEvents) {
    if (event.kind === "target_marked") {
      statuses.push(statusCue(event.targetId, "marked", "Marked"));
    }
  }

  const uniqueStatuses = statuses.filter(
    (candidate, index) =>
      statuses.findIndex(
        (other) => other.unitId === candidate.unitId && other.kind === candidate.kind,
      ) === index,
  );
  let stance: StanceRibbon | null = null;
  for (let index = boundedCursor; index >= cueStart; index -= 1) {
    const event = result.events[index];
    if (event?.kind !== "stance_used") continue;
    const definition = STANCES[event.stanceId];
    stance = {
      heroId: event.heroId,
      stanceId: event.stanceId,
      name: definition.name,
      detail: stanceEffectDetail(event),
      trigger: stanceTriggerReason(result, index, event.stanceId),
    };
    break;
  }

  return { deltas, statuses: uniqueStatuses, stance };
}

const MOMENT_STAT_LABELS: Readonly<Record<MomentDelta["stat"], string>> = {
  health: "HP",
  "max-health": "Max HP",
  guard: "Guard",
  technique: "Points",
  strain: "Strain",
  speed: "Speed",
};

function momentDeltaText(delta: MomentDelta, includeUnit = false): string {
  const label = MOMENT_STAT_LABELS[delta.stat];
  const prefix = includeUnit ? `${unitName(delta.unitId)} ` : "";
  const change =
    delta.gained > 0 && delta.lost > 0
      ? `+${delta.gained}/−${delta.lost}, net ${signed(delta.net)}`
      : signed(delta.net);
  return `${prefix}${label} ${change} (${delta.before}→${delta.after})`;
}

function unitDeltaFromMoment(delta: MomentDelta): UnitDelta {
  return {
    unitId: delta.unitId,
    kind: delta.stat,
    amount: delta.net,
    text: momentDeltaText(delta),
    gained: delta.gained,
    lost: delta.lost,
    before: delta.before,
    after: delta.after,
    sourceEventIds: delta.sourceEventIds,
  };
}

export function combatFeedbackForMoment(
  result: BattleResult,
  moment: BattleMoment,
): CombatFeedback {
  const eventFeedback = combatFeedbackAtEvent(result, moment.endEventIndex);
  const stance: StanceRibbon | null = moment.stance
    ? {
        heroId: moment.stance.heroId,
        stanceId: moment.stance.stanceId,
        name: STANCES[moment.stance.stanceId].name,
        detail: momentStanceEffectText(moment.stance),
        trigger: moment.stance.trigger,
      }
    : null;
  return {
    deltas: moment.deltas.map(unitDeltaFromMoment),
    statuses: eventFeedback.statuses,
    stance,
  };
}

export function contactCueForMoment(moment: BattleMoment): ContactCue | null {
  if (!moment.actorId) return null;
  const defeat = moment.keyFacts.find((fact) => fact.kind === "defeat");
  if (defeat?.kind === "defeat") {
    return {
      actorId: defeat.byUnitId,
      targetIds: [defeat.unitId],
      reaction: "defeat",
      ...(moment.actionId ? { actionId: moment.actionId } : {}),
    };
  }
  const broken = moment.keyFacts.find((fact) => fact.kind === "break");
  if (broken?.kind === "break") {
    return {
      actorId: broken.actorId,
      targetIds: [broken.targetId],
      reaction: "break",
      ...(moment.actionId ? { actionId: moment.actionId } : {}),
    };
  }
  const healthLosses = moment.deltas.filter(
    (delta) => delta.stat === "health" && delta.lost > 0,
  );
  if (healthLosses.length > 0) {
    return {
      actorId: moment.actorId,
      targetIds: healthLosses.map((delta) => delta.unitId),
      reaction: "damage",
      ...(moment.actionId ? { actionId: moment.actionId } : {}),
    };
  }
  const healing = moment.deltas.filter(
    (delta) => delta.stat === "health" && delta.gained > 0,
  );
  if (healing.length > 0) {
    return {
      actorId: moment.actorId,
      targetIds: healing.map((delta) => delta.unitId),
      reaction: "heal",
      ...(moment.actionId ? { actionId: moment.actionId } : {}),
    };
  }
  return null;
}

function targetSummary(moment: BattleMoment): string {
  const intended = moment.intendedTargetIds.map(unitName).join(", ");
  const resolved = moment.resolvedTargetIds.map(unitName).join(", ");
  if (!intended && !resolved) return "The action affects the battlefield.";
  if (intended === resolved || !resolved) return `The action affects ${intended || resolved}.`;
  return `${intended} was targeted, but the action affects ${resolved}.`;
}

function consequenceFacts(moment: BattleMoment): readonly string[] {
  return moment.keyFacts.flatMap((fact): readonly string[] => {
    switch (fact.kind) {
      case "condition":
        return [`${unitName(fact.targetId)} is Bruised.`];
      case "enemy_mark":
        return [`${unitName(fact.targetId)} is Marked.`];
      case "break":
        return [`${unitName(fact.targetId)} is Broken.`];
      case "defeat":
        return [`${unitName(fact.unitId)} is Defeated.`];
      case "decisive":
        return ["This is the turning point."];
      default:
        return [];
    }
  });
}

function battleOutcome(result: BattleResult): string {
  const ended = result.events.find((event) => event.kind === "battle_ended");
  if (ended?.kind !== "battle_ended") return "Battle ended";
  const winner =
    ended.winner === "heroes"
      ? "Your team wins"
      : ended.winner === "enemies"
        ? "Your team loses"
        : "Draw";
  return `${winner} after ${ended.actionCount} actions.`;
}

function momentDeltaSentence(delta: MomentDelta): string {
  return `${momentDeltaText(delta, true)}.`;
}

export function momentSummary(result: BattleResult, moment: BattleMoment): MomentSummary {
  if (moment.kind === "setup") {
    const outcome = [
      ...moment.deltas.map(momentDeltaSentence),
      ...consequenceFacts(moment),
    ].join(" ") || "Both teams take their positions.";
    const summary = {
      label: "Setup" as const,
      cause: "The battle begins.",
      target: "Your team takes its starting positions.",
      outcome,
    };
    return { ...summary, text: `${summary.cause} ${summary.target} ${summary.outcome}` };
  }
  if (moment.kind === "outcome") {
    const summary = {
      label: "Outcome" as const,
      cause: "The battle ends.",
      target: "All actions are resolved.",
      outcome: battleOutcome(result),
    };
    return { ...summary, text: `${summary.cause} ${summary.target} ${summary.outcome}` };
  }

  const actor = moment.actorId ? unitName(moment.actorId) : "Unknown actor";
  const action = moment.stance
    ? `${STANCES[moment.stance.stanceId].name} because ${moment.stance.trigger === "condition" ? "its condition is met" : moment.stance.trigger === "forced" ? "Points reached the cap" : "it is ready"}`
    : moment.actionId
      ? ACTION_NAMES[moment.actionId]
      : "Action";
  const policy = moment.keyFacts.find(
    (fact) => fact.kind === "policy" && fact.effect === "intercept",
  );
  const outcome = [
    ...moment.deltas.map(momentDeltaSentence),
    ...consequenceFacts(moment),
  ].join(" ") || "No HP or state changes.";
  const summary = {
    label: "Action" as const,
    cause: `${actor} uses ${action}${policy?.kind === "policy" ? `, and ${TEAM_POLICY_COPY[policy.policyId].name} changes the target` : ""}.`,
    target: targetSummary(moment),
    outcome,
  };
  return { ...summary, text: `${summary.cause} ${summary.target} ${summary.outcome}` };
}

function relevantStanceOutcome(moment: BattleMoment): string | null {
  const stance = moment.stance;
  if (!stance) return null;
  const deltas = moment.deltas.filter((delta) => {
    switch (stance.effect) {
      case "guard_self":
        return delta.unitId === stance.heroId && delta.stat === "guard";
      case "hit_front":
      case "finish_weak":
        return delta.stat === "health" && delta.lost > 0;
      case "heal_one":
      case "heal_two":
        return delta.stat === "health" && delta.gained > 0;
      default:
        return false;
    }
  });
  return deltas.length === 0
    ? null
    : deltas.map(momentDeltaSentence).join(" ");
}

export function planTrackerAtMoment(
  result: BattleResult,
  moment: BattleMoment,
): readonly PlanTrackerItem[] {
  const events = result.events.slice(0, moment.endEventIndex + 1);
  const moments = deriveBattleMoments(result);
  return HERO_IDS.map((heroId) => {
    const stanceId = result.command.plan.stances[heroId];
    const definition = STANCES[stanceId];
    const activation = [...events]
      .reverse()
      .find(
        (event): event is Extract<BattleEvent, { kind: "stance_used" }> =>
          event.kind === "stance_used" && event.heroId === heroId && event.stanceId === stanceId,
      );
    if (activation) {
      const activationMoment = moments.find((candidate) =>
        candidate.sourceEventIds.includes(activation.eventId),
      );
      return {
        heroId,
        heroName: unitName(heroId),
        stanceId,
        stanceName: definition.name,
        state: "activated" as const,
        status: `Used in Round ${activation.round}.`,
        detail: activationMoment?.stance ? momentStanceEffectText(activationMoment.stance) : null,
        outcome: activationMoment ? relevantStanceOutcome(activationMoment) : null,
      };
    }

    const latestOptions = [...events]
      .reverse()
      .find(
        (event): event is Extract<BattleEvent, { kind: "action_options" }> =>
          event.kind === "action_options" && event.actorId === heroId,
      );
    const selectedOption = latestOptions?.options.find((option) => option.stanceId === stanceId);
    const ready = Boolean(
      selectedOption?.legal &&
      selectedOption.reasons.some((reason) =>
        reason === "stance_ready" || reason === "stance_triggered" || reason === "stance_forced",
      ),
    );
    return {
      heroId,
      heroName: unitName(heroId),
      stanceId,
      stanceName: definition.name,
      state: ready ? "ready" as const : "not-used" as const,
      status: ready ? "Ready" : "Not used yet",
      detail: null,
      outcome: null,
    };
  });
}

export function effectVisualIdsForDeltas(
  deltas: readonly UnitDelta[],
): readonly EffectVisualId[] {
  const ids = deltas.map((delta): EffectVisualId => {
    switch (delta.kind) {
      case "health":
      case "max-health":
        return delta.amount >= 0 ? "effect.heal" : "effect.damage";
      case "guard":
        return "effect.guard";
      case "technique":
        return "effect.technique";
      case "strain":
        return "effect.strain";
      case "speed":
        return "effect.speed";
    }
  });
  return ids.filter((id, index) => ids.indexOf(id) === index);
}

export function contactCueForEvent(event: BattleEvent): ContactCue | null {
  switch (event.kind) {
    case "damage_applied":
      return {
        actorId: event.actorId,
        targetIds: [event.targetId],
        reaction: "damage",
        actionId: event.actionId,
      };
    case "healed":
      return {
        actorId: event.actorId,
        targetIds: [event.targetId],
        reaction: "heal",
        actionId: "first_aid",
      };
    case "front_broken":
      return {
        actorId: event.actorId,
        targetIds: [event.targetId],
        reaction: "break",
        actionId: "line_hit",
      };
    case "unit_defeated":
      return {
        actorId: event.byUnitId,
        targetIds: [event.unitId],
        reaction: "defeat",
      };
    default:
      return null;
  }
}

export function eventDurationMs(event: BattleEvent, reducedMotion: boolean): number {
  if (event.kind === "action_options") return 10;
  if (event.kind === "round_started") return reducedMotion ? 30 : 60;
  if (event.kind === "intent_shown") return 520;
  if (event.kind === "stance_used") return reducedMotion ? 260 : 360;
  if (event.kind === "action_started") return reducedMotion ? 120 : 240;
  if (event.kind === "signature_triggered") return reducedMotion ? 500 : 640;
  if (event.kind === "decisive_moment") return reducedMotion ? 700 : 760;
  if (event.kind === "front_broken" || event.kind === "unit_defeated") {
    return reducedMotion ? 500 : 540;
  }
  if (event.kind === "battle_started" || event.kind === "battle_ended") return 250;
  return reducedMotion ? 110 : 185;
}

export function intentAtEvent(
  result: BattleResult,
  cursor: number,
): Extract<BattleEvent, { kind: "intent_shown" }> | null {
  for (let index = Math.min(cursor, result.events.length - 1); index >= 0; index -= 1) {
    const event = result.events[index];
    if (!event) continue;
    if (event.kind === "intent_shown") return event;
    if (event.kind === "round_started" || event.kind === "battle_ended") return null;
  }
  return null;
}

export function eventFact(event: BattleEvent): string {
  switch (event.kind) {
    case "battle_started":
      return `${unitName(event.formation.front)} starts in the front slot. Team policy: ${TEAM_POLICY_COPY[event.teamPolicy].name}.`;
    case "round_started":
      return `Round ${event.round} started.`;
    case "action_options":
      return `${unitName(event.actorId)} checks which actions are ready.`;
    case "intent_shown":
      return `${unitName(event.actorId)} prepares ${ACTION_NAMES[event.actionId]} against ${event.targetIds.map(unitName).join(", ")}.`;
    case "stance_used":
      return `${unitName(event.heroId)} uses ${STANCES[event.stanceId].name}. ${stanceEffectDetail(event)}.`;
    case "action_started":
      return `${unitName(event.actorId)} uses ${ACTION_NAMES[event.actionId]}.`;
    case "policy_triggered":
      return event.effect === "intercept"
        ? `${TEAM_POLICY_COPY[event.policyId].name}: ${unitName(event.actorId)} covers ${unitName(event.targetId)}.`
        : `${TEAM_POLICY_COPY[event.policyId].name} gives ${unitName(event.targetId)} starting Guard.`;
    case "equipment_applied":
      return `${unitName(event.targetId)} starts in the front slot with ${EQUIPMENT[event.equipmentId].name}. Guard +${event.startingGuard}; Speed ${event.speedBefore} to ${event.speedAfter} (${event.speedChange >= 0 ? "+" : ""}${event.speedChange}).`;
    case "condition_applied":
      return `${unitName(event.targetId)} starts Bruised. HP ${event.healthBefore} to ${event.healthAfter}; Max HP ${event.maxHealthBefore} to ${event.maxHealthAfter}.`;
    case "signature_triggered":
      return `${unitName(event.actorId)}: ${event.signatureName}.`;
    case "target_marked":
      return `${unitName(event.actorId)} marks ${unitName(event.targetId)} in the rear.`;
    case "target_changed":
      return `${unitName(event.actorId)} changes target from ${unitName(event.fromTargetId)} to ${unitName(event.toTargetId)}.`;
    case "damage_applied":
      return `${unitName(event.targetId)} loses ${event.healthLost} HP${event.guardAbsorbed > 0 ? ` after ${event.guardAbsorbed} Guard absorbs damage` : ""}.`;
    case "healed":
      return `${unitName(event.targetId)} restores ${event.healthGained} HP.`;
    case "guard_changed":
      return `${unitName(event.targetId)} ${event.amount >= 0 ? "gains" : "loses"} ${Math.abs(event.amount)} Guard and has ${event.guardAfter} Guard.`;
    case "technique_changed":
      return `${unitName(event.heroId)} ${event.amount >= 0 ? "gains" : "spends"} ${Math.abs(event.amount)} Points and has ${event.pointsAfter} Points.`;
    case "strain_changed":
      return `${unitName(event.targetId)} has ${event.strainAfter} of ${event.threshold} Strain.`;
    case "front_broken":
      return `${unitName(event.targetId)} is Broken and loses ${event.guardRemoved} Guard.`;
    case "unit_defeated":
      return `${unitName(event.byUnitId)} defeats ${unitName(event.unitId)}.`;
    case "decisive_moment":
      if (event.reason === "rear_intercept") {
        return `Turning point: ${unitName(event.actorId)} intercepts the marked rear hit.`;
      }
      if (event.reason === "front_broken") {
        return `Turning point: ${unitName(event.targetId)} is broken in front.`;
      }
      return `Turning point: ${unitName(event.actorId)} causes the first defeat.`;
    case "battle_ended": {
      const winner = event.winner === "heroes" ? "Your team wins" : event.winner === "enemies" ? "Your team loses" : "The battle is a draw";
      return `${winner} after ${event.actionCount} actions.`;
    }
  }
}

export function resultFacts(result: BattleResult): readonly {
  readonly label: "Plan" | "Turning point" | "Battle result";
  readonly eventId: string;
  readonly text: string;
}[] {
  const front = unitName(result.command.plan.formation.front);
  const policy = TEAM_POLICY_COPY[result.command.plan.teamPolicy].name;
  const equipment = result.command.plan.frontEquipment === "none"
    ? ""
    : ` Front equipment: ${EQUIPMENT[result.command.plan.frontEquipment].name}.`;
  const condition = result.command.plan.priorCondition
    ? ` ${unitName(result.command.plan.priorCondition.heroId)} starts Bruised.`
    : "";
  const definitions = [
    ["Plan", result.highlights.planEventId, `${front} starts in the front slot. Team policy: ${policy}.${equipment}${condition}`],
    ["Turning point", result.highlights.turningPointEventId, null],
    ["Battle result", result.highlights.outcomeEventId, null],
  ] as const;
  return definitions.map(([label, eventId, text]) => {
    const event = result.events.find((candidate) => candidate.eventId === eventId);
    if (!event) {
      throw new Error(`Missing result event ${eventId}`);
    }
    return { label, eventId, text: text ?? eventFact(event) };
  });
}

export function silhouetteVariant(unitId: UnitId): 0 | 1 | 2 {
  let hash = 0;
  for (const character of unitId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return (hash % 3) as 0 | 1 | 2;
}

export function silhouetteClassNames(unitId: UnitId): string {
  return `${resolveUnitVisual(unitId).cssClassName} variant-${silhouetteVariant(unitId)}`;
}
