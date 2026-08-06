import { ENCOUNTERS, ENEMIES, HEROES } from "../content";
import { EQUIPMENT } from "../equipment";
import type {
  ActionId,
  BattleEvent,
  BattleResult,
  FormationSlot,
  UnitId,
  UnitSnapshot,
} from "../sim";
import { ACTION_NAMES, TEAM_POLICY_COPY } from "./copy";

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
}

export interface ContactCue {
  readonly actorId: UnitId;
  readonly targetIds: readonly UnitId[];
  readonly reaction: ReactionKind;
  readonly actionId?: ActionId;
}

const UNIT_VISUAL_CLASSES: Readonly<Record<UnitId, string>> = {
  ada: "identity-ada role-guard",
  bo: "identity-bo role-damage",
  cy: "identity-cy role-support",
  rear_attacker: "identity-rear-attacker role-damage enemy-role-attacker",
  rear_guard: "identity-rear-guard role-guard enemy-role-guard",
  rear_helper: "identity-rear-helper role-support enemy-role-helper",
  line_breaker: "identity-line-breaker role-damage enemy-role-breaker",
  line_guard: "identity-line-guard role-guard enemy-role-guard",
  line_helper: "identity-line-helper role-support enemy-role-helper",
};

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
      return `Started with ${unitName(event.formation.front)} in front and ${TEAM_POLICY_COPY[event.teamPolicy].name}.`;
    case "round_started":
      return `Round ${event.round} started.`;
    case "action_options":
      return `${unitName(event.actorId)} checked available actions.`;
    case "intent_shown":
      return `${unitName(event.actorId)} plans ${ACTION_NAMES[event.actionId]} on ${event.targetIds.map(unitName).join(", ")}.`;
    case "action_started":
      return `${unitName(event.actorId)} uses ${ACTION_NAMES[event.actionId]}.`;
    case "policy_triggered":
      return event.effect === "intercept"
        ? `${TEAM_POLICY_COPY[event.policyId].name}: ${unitName(event.actorId)} covers ${unitName(event.targetId)}.`
        : `${TEAM_POLICY_COPY[event.policyId].name}: ${unitName(event.targetId)} gains starting guard.`;
    case "equipment_applied":
      return `${EQUIPMENT[event.equipmentId].name} applies to ${unitName(event.targetId)} in front: starting guard +${event.startingGuard}; speed ${event.speedChange >= 0 ? "+" : ""}${event.speedChange}, from ${event.speedBefore} to ${event.speedAfter}.`;
    case "condition_applied":
      return `${unitName(event.targetId)} starts Bruised: health ${event.healthBefore} to ${event.healthAfter}; maximum health ${event.maxHealthBefore} to ${event.maxHealthAfter}.`;
    case "signature_triggered":
      return `${unitName(event.actorId)}: ${event.signatureName}.`;
    case "target_marked":
      return `${unitName(event.actorId)} marks ${unitName(event.targetId)} in the rear.`;
    case "target_changed":
      return `${unitName(event.actorId)} changes target from ${unitName(event.fromTargetId)} to ${unitName(event.toTargetId)}.`;
    case "damage_applied":
      return `${unitName(event.targetId)} loses ${event.healthLost} health${event.guardAbsorbed > 0 ? ` after ${event.guardAbsorbed} guard absorbs damage` : ""}.`;
    case "healed":
      return `${unitName(event.targetId)} recovers ${event.healthGained} health.`;
    case "guard_changed":
      return `${unitName(event.targetId)} guard ${event.amount >= 0 ? "gains" : "loses"} ${Math.abs(event.amount)}; ${event.guardAfter} remains.`;
    case "technique_changed":
      return `${unitName(event.heroId)} technique points ${event.amount >= 0 ? "gain" : "spend"} ${Math.abs(event.amount)}; ${event.pointsAfter} ready.`;
    case "strain_changed":
      return `${unitName(event.targetId)} strain is ${event.strainAfter} of ${event.threshold}.`;
    case "front_broken":
      return `${unitName(event.targetId)} is broken and loses ${event.guardRemoved} guard.`;
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
  readonly label: "Plan" | "Turning point" | "Consequence";
  readonly eventId: string;
  readonly text: string;
}[] {
  const condition = result.events.find((event) => event.kind === "condition_applied");
  const definitions = [
    ["Plan", condition?.eventId ?? result.highlights.planEventId],
    ["Turning point", result.highlights.turningPointEventId],
    ["Consequence", result.highlights.outcomeEventId],
  ] as const;
  return definitions.map(([label, eventId]) => {
    const event = result.events.find((candidate) => candidate.eventId === eventId);
    if (!event) {
      throw new Error(`Missing result event ${eventId}`);
    }
    return { label, eventId, text: eventFact(event) };
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
  return `${UNIT_VISUAL_CLASSES[unitId]} variant-${silhouetteVariant(unitId)}`;
}
