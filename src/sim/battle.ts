import { ENCOUNTERS, ENEMIES, HEROES } from "../content";
import { COMBAT_TUNING } from "../content/tuning";
import { EQUIPMENT } from "../equipment";
import { deriveUnitStats, type UnitStatModifiers } from "./derivedStats";
import { createRngStream, type DeterministicRng } from "./rng";
import {
  FORMATION_SLOTS,
  type ActionId,
  type ActionOptionFact,
  type ActionOptionReason,
  type BattleEndReason,
  type BattleEvent,
  type BattleHighlights,
  type BattleResult,
  type BattleWinner,
  type EnemyBlueprint,
  type FormationSlot,
  type HeroBlueprint,
  type HeroId,
  type IntentShownEvent,
  type Side,
  type StartBattleCommand,
  type UnitId,
  type UnitSnapshot,
} from "./types";

type EventPayload = BattleEvent extends infer Event
  ? Event extends BattleEvent
    ? Omit<Event, "eventId" | "sequence" | "round">
    : never
  : never;

interface InternalUnit {
  readonly id: UnitId;
  readonly name: string;
  readonly side: Side;
  readonly slot: FormationSlot;
  maxHealth: number;
  readonly power: number;
  readonly defence: number;
  readonly speed: number;
  readonly guardCap: number;
  health: number;
  guard: number;
  techniquePoints: number;
  strain: number;
  brokenUntilRound: number;
  actionsTaken: number;
}

interface BattleState {
  readonly command: StartBattleCommand;
  readonly units: Map<UnitId, InternalUnit>;
  readonly events: BattleEvent[];
  readonly initiativeRng: DeterministicRng;
  readonly damageRng: DeterministicRng;
  round: number;
  actionCount: number;
  decisiveEventId: string | null;
}

interface ChosenAction {
  readonly actionId: ActionId;
  readonly targets: readonly InternalUnit[];
  readonly reason: IntentShownEvent["reason"];
  readonly options: readonly ActionOptionFact[];
}

const slotRank: Readonly<Record<FormationSlot, number>> = {
  front: 0,
  middle: 1,
  rear: 2,
};

function emit(state: BattleState, payload: EventPayload): BattleEvent {
  const sequence = state.events.length;
  const event = {
    ...payload,
    eventId: `event-${String(sequence).padStart(4, "0")}`,
    sequence,
    round: state.round,
  } as BattleEvent;
  state.events.push(event);
  return event;
}

function requireUnit(state: BattleState, unitId: UnitId): InternalUnit {
  const unit = state.units.get(unitId);
  if (!unit) {
    throw new Error(`Missing combat unit ${unitId}`);
  }
  return unit;
}

function livingUnits(state: BattleState, side: Side): InternalUnit[] {
  return [...state.units.values()].filter((unit) => unit.side === side && unit.health > 0);
}

function opposingSide(side: Side): Side {
  return side === "heroes" ? "enemies" : "heroes";
}

function nearestLiving(state: BattleState, side: Side): InternalUnit {
  const candidates = livingUnits(state, side).sort(
    (left, right) => slotRank[left.slot] - slotRank[right.slot],
  );
  const target = candidates[0];
  if (!target) {
    throw new Error(`No living target on ${side} side`);
  }
  return target;
}

function rearMostLiving(state: BattleState, side: Side): InternalUnit {
  const candidates = livingUnits(state, side).sort(
    (left, right) => slotRank[right.slot] - slotRank[left.slot],
  );
  const target = candidates[0];
  if (!target) {
    throw new Error(`No living target on ${side} side`);
  }
  return target;
}

function lowestHealthAlly(state: BattleState): InternalUnit | null {
  const candidates = livingUnits(state, "heroes")
    .filter((unit) => unit.health < unit.maxHealth)
    .sort((left, right) => {
      const leftRatio = left.health / left.maxHealth;
      const rightRatio = right.health / right.maxHealth;
      return leftRatio - rightRatio || slotRank[left.slot] - slotRank[right.slot];
    });
  return candidates[0] ?? null;
}

function createHeroUnit(
  blueprint: HeroBlueprint,
  slot: FormationSlot,
  modifiers: UnitStatModifiers,
): InternalUnit {
  const stats = deriveUnitStats(blueprint.stats, modifiers);
  return {
    id: blueprint.id,
    name: blueprint.name,
    side: "heroes",
    slot,
    maxHealth: stats.maxHealth,
    power: stats.power,
    defence: stats.defence,
    speed: stats.speed,
    guardCap: stats.guardCap,
    health: stats.maxHealth,
    guard: 0,
    techniquePoints: 0,
    strain: 0,
    brokenUntilRound: 0,
    actionsTaken: 0,
  };
}

function createEnemyUnit(blueprint: EnemyBlueprint, slot: FormationSlot): InternalUnit {
  const stats = deriveUnitStats(blueprint.stats);
  return {
    id: blueprint.id,
    name: blueprint.name,
    side: "enemies",
    slot,
    maxHealth: stats.maxHealth,
    power: stats.power,
    defence: stats.defence,
    speed: stats.speed,
    guardCap: stats.guardCap,
    health: stats.maxHealth,
    guard: 0,
    techniquePoints: 0,
    strain: 0,
    brokenUntilRound: 0,
    actionsTaken: 0,
  };
}

function createState(command: StartBattleCommand): BattleState {
  const encounter = ENCOUNTERS[command.encounterId];
  const units = new Map<UnitId, InternalUnit>();
  const equipment =
    command.plan.frontEquipment === "none" ? null : EQUIPMENT[command.plan.frontEquipment];

  for (const slot of FORMATION_SLOTS) {
    const heroId = command.plan.formation[slot];
    const modifiers: UnitStatModifiers =
      slot === "front" && equipment ? { speed: equipment.effects.speed } : {};
    units.set(heroId, createHeroUnit(HEROES[heroId], slot, modifiers));
  }

  encounter.enemyIds.forEach((enemyId, index) => {
    const slot = FORMATION_SLOTS[index];
    if (!slot) {
      throw new Error(`Encounter ${encounter.id} has an invalid enemy slot`);
    }
    units.set(enemyId, createEnemyUnit(ENEMIES[enemyId], slot));
  });

  return {
    command,
    units,
    events: [],
    initiativeRng: createRngStream(command.seed, "initiative"),
    damageRng: createRngStream(command.seed, "damage"),
    round: 0,
    actionCount: 0,
    decisiveEventId: null,
  };
}

function applyGuard(
  state: BattleState,
  actorId: UnitId,
  target: InternalUnit,
  amount: number,
  reason: "hold_front" | "equipment" | "brace" | "quick_help",
  causedByEventId: string,
): BattleEvent {
  const previous = target.guard;
  target.guard = Math.min(target.guardCap, target.guard + amount);
  return emit(state, {
    kind: "guard_changed",
    causedByEventId,
    actorId,
    targetId: target.id,
    amount: target.guard - previous,
    guardAfter: target.guard,
    reason,
  });
}

function applyPriorCondition(
  state: BattleState,
  battleStartedEventId: string,
): BattleEvent | null {
  const condition = state.command.plan.priorCondition;
  if (state.command.encounterId !== "punish_front" || condition === null) {
    return null;
  }

  const target = requireUnit(state, condition.heroId);
  const maxHealthBefore = target.maxHealth;
  const healthBefore = target.health;
  const derived = deriveUnitStats(
    {
      maxHealth: target.maxHealth,
      power: target.power,
      defence: target.defence,
      speed: target.speed,
      guardCap: target.guardCap,
    },
    { maxHealth: -condition.healthPenalty },
  );
  target.maxHealth = derived.maxHealth;
  target.health = Math.max(0, healthBefore - condition.healthPenalty);

  return emit(state, {
    kind: "condition_applied",
    causedByEventId: battleStartedEventId,
    sourceEventId: condition.sourceEventId,
    condition: "bruised",
    targetId: condition.heroId,
    healthPenalty: condition.healthPenalty,
    maxHealthBefore,
    maxHealthAfter: target.maxHealth,
    healthBefore,
    healthAfter: target.health,
  });
}

function changeTechniquePoints(
  state: BattleState,
  hero: InternalUnit,
  amount: number,
  reason: "basic_gain" | "technique_cost",
  causedByEventId: string,
): void {
  const previous = hero.techniquePoints;
  hero.techniquePoints = Math.max(
    0,
    Math.min(COMBAT_TUNING.techniquePointCap, hero.techniquePoints + amount),
  );
  emit(state, {
    kind: "technique_changed",
    causedByEventId,
    heroId: hero.id as HeroId,
    amount: hero.techniquePoints - previous,
    pointsAfter: hero.techniquePoints,
    reason,
  });
}

interface DamageInput {
  readonly state: BattleState;
  readonly actor: InternalUnit;
  readonly target: InternalUnit;
  readonly actionId: ActionId;
  readonly actionPower: number;
  readonly causedByEventId: string;
  readonly useVariance: boolean;
  readonly inputPower?: number;
  readonly defencePenalty?: number;
}

function applyDamage(input: DamageInput): BattleEvent {
  const { state, actor, target, actionId, actionPower, causedByEventId, useVariance } = input;
  const variance = useVariance
    ? state.damageRng.nextIntInclusive(
        COMBAT_TUNING.damageVarianceMin,
        COMBAT_TUNING.damageVarianceMax,
      )
    : 0;
  const inputPower = input.inputPower ?? actor.power;
  const defence = Math.max(
    0,
    target.defence -
      (target.brokenUntilRound >= state.round ? COMBAT_TUNING.breakDefencePenalty : 0) -
      (input.defencePenalty ?? 0),
  );
  const total = Math.max(1, inputPower + actionPower + variance - defence);
  const guardAbsorbed = Math.min(target.guard, total);
  const healthLost = Math.min(target.health, total - guardAbsorbed);

  if (guardAbsorbed > 0) {
    target.guard -= guardAbsorbed;
    emit(state, {
      kind: "guard_changed",
      causedByEventId,
      actorId: actor.id,
      targetId: target.id,
      amount: -guardAbsorbed,
      guardAfter: target.guard,
      reason: "damage",
    });
  }

  target.health -= healthLost;
  const damageEvent = emit(state, {
    kind: "damage_applied",
    causedByEventId,
    actorId: actor.id,
    targetId: target.id,
    actionId,
    inputPower,
    actionPower,
    variance,
    defence,
    guardAbsorbed,
    healthLost,
    healthAfter: target.health,
  });

  if (target.health === 0) {
    const defeatedEvent = emit(state, {
      kind: "unit_defeated",
      causedByEventId: damageEvent.eventId,
      unitId: target.id,
      byUnitId: actor.id,
    });
    emitDecisive(state, "first_defeat", actor.id, target.id, defeatedEvent.eventId);
  }

  return damageEvent;
}

function emitDecisive(
  state: BattleState,
  reason: "rear_intercept" | "front_broken" | "first_defeat",
  actorId: UnitId,
  targetId: UnitId,
  causedByEventId: string,
): void {
  if (state.decisiveEventId) {
    return;
  }
  const event = emit(state, {
    kind: "decisive_moment",
    causedByEventId,
    reason,
    actorId,
    targetId,
  });
  state.decisiveEventId = event.eventId;
}

function heroActionOptions(state: BattleState, hero: InternalUnit): ActionOptionFact[] {
  const heroId = hero.id as HeroId;
  const policy = state.command.plan.techniquePolicies[heroId];
  const enoughPoints = hero.techniquePoints >= COMBAT_TUNING.techniqueCost;
  const atPointCap = hero.techniquePoints >= COMBAT_TUNING.techniquePointCap;
  const options: ActionOptionFact[] = [
    { actionId: "basic", legal: true, score: 10, reasons: ["always_available"] },
  ];

  let conditionMet = false;
  let legal = enoughPoints;
  const reasons: ActionOptionReason[] = [];

  if (!enoughPoints) {
    reasons.push("not_enough_points");
  } else if (heroId === "cy" && lowestHealthAlly(state) === null) {
    legal = false;
    reasons.push("no_injured_ally");
  } else if (policy === "use_early") {
    conditionMet = true;
    reasons.push("use_early");
  } else if (heroId === "ada") {
    conditionMet =
      hero.health / hero.maxHealth <= COMBAT_TUNING.waitForNeedHealthRatio || hero.strain >= 2;
    reasons.push(conditionMet ? "need_met" : "need_not_met");
  } else if (heroId === "bo") {
    conditionMet = livingUnits(state, "enemies").some(
      (enemy) => enemy.health / enemy.maxHealth < 0.5,
    );
    reasons.push(conditionMet ? "need_met" : "need_not_met");
  } else {
    const injured = lowestHealthAlly(state);
    legal = enoughPoints && injured !== null;
    if (!injured) {
      reasons.push("no_injured_ally");
    } else {
      conditionMet = injured.health / injured.maxHealth <= COMBAT_TUNING.waitForNeedHealthRatio;
      reasons.push(conditionMet ? "need_met" : "need_not_met");
    }
  }

  if (atPointCap) {
    conditionMet = true;
    reasons.push("point_cap");
  }

  const technique = HEROES[heroId].technique;
  options.push({
    actionId: technique,
    legal,
    score: legal && conditionMet ? 30 : 0,
    reasons,
  });
  return options;
}

function enemyActionOptions(enemy: InternalUnit): ActionOptionFact[] {
  const blueprint = ENEMIES[enemy.id as keyof typeof ENEMIES];
  if (blueprint.rule === "rear_every_third") {
    const isThird = (enemy.actionsTaken + 1) % COMBAT_TUNING.rearStrikeInterval === 0;
    return [
      {
        actionId: "basic",
        legal: !isThird,
        score: isThird ? 0 : 10,
        reasons: [isThird ? "rear_action_third" : "rear_action_not_third"],
      },
      {
        actionId: "rear_strike",
        legal: isThird,
        score: isThird ? 30 : 0,
        reasons: [isThird ? "rear_action_third" : "rear_action_not_third"],
      },
    ];
  }
  if (blueprint.rule === "front_strain") {
    return [{ actionId: "line_hit", legal: true, score: 20, reasons: ["front_rule"] }];
  }
  if (blueprint.rule === "rear_target") {
    return [{ actionId: "basic", legal: true, score: 15, reasons: ["rear_rule"] }];
  }
  return [{ actionId: "basic", legal: true, score: 10, reasons: ["always_available"] }];
}

function chooseAction(state: BattleState, actor: InternalUnit): ChosenAction {
  if (actor.side === "heroes") {
    const options = heroActionOptions(state, actor);
    const selected = [...options]
      .filter((option) => option.legal)
      .sort((left, right) => right.score - left.score)[0];
    if (!selected) {
      throw new Error(`No legal action for ${actor.id}`);
    }
    if (selected.actionId === "first_aid") {
      const target = lowestHealthAlly(state);
      if (!target) {
        throw new Error("First Aid selected without an injured ally");
      }
      return {
        actionId: selected.actionId,
        targets: [target],
        reason:
          state.command.plan.techniquePolicies.cy === "use_early"
            ? "technique_ready"
            : "technique_need",
        options,
      };
    }
    return {
      actionId: selected.actionId,
      targets:
        selected.actionId === "brace"
          ? [actor]
          : [nearestLiving(state, opposingSide(actor.side))],
      reason:
        selected.actionId === "basic"
          ? "nearest_target"
          : state.command.plan.techniquePolicies[actor.id as HeroId] === "use_early"
            ? "technique_ready"
            : "technique_need",
      options,
    };
  }

  const options = enemyActionOptions(actor);
  const selected = [...options]
    .filter((option) => option.legal)
    .sort((left, right) => right.score - left.score)[0];
  if (!selected) {
    throw new Error(`No legal action for ${actor.id}`);
  }
  if (selected.actionId === "rear_strike") {
    const rearHero = livingUnits(state, "heroes")
      .filter((unit) => unit.slot === "rear")
      .sort((left, right) => left.id.localeCompare(right.id))[0];
    return {
      actionId: selected.actionId,
      targets: [rearHero ?? nearestLiving(state, "heroes")],
      reason: "rear_third_action",
      options,
    };
  }
  if (selected.actionId === "line_hit") {
    return {
      actionId: selected.actionId,
      targets: [nearestLiving(state, "heroes")],
      reason: "front_pressure",
      options,
    };
  }
  const blueprint = ENEMIES[actor.id as keyof typeof ENEMIES];
  if (blueprint.rule === "rear_target") {
    return {
      actionId: "basic",
      targets: [rearMostLiving(state, "heroes")],
      reason: "rear_pressure",
      options,
    };
  }
  return {
    actionId: "basic",
    targets: [nearestLiving(state, "heroes")],
    reason: "nearest_target",
    options,
  };
}

function performBasic(
  state: BattleState,
  actor: InternalUnit,
  target: InternalUnit,
  actionEventId: string,
): void {
  const damageEvent = applyDamage({
    state,
    actor,
    target,
    actionId: "basic",
    actionPower: COMBAT_TUNING.basicActionPower,
    causedByEventId: actionEventId,
    useVariance: true,
  });
  if (actor.side === "heroes") {
    changeTechniquePoints(state, actor, 1, "basic_gain", damageEvent.eventId);
  }
}

function performBrace(state: BattleState, actor: InternalUnit, actionEventId: string): void {
  applyGuard(state, actor.id, actor, COMBAT_TUNING.braceGuard, "brace", actionEventId);
  changeTechniquePoints(
    state,
    actor,
    -COMBAT_TUNING.techniqueCost,
    "technique_cost",
    actionEventId,
  );
}

function performHeavyHit(
  state: BattleState,
  actor: InternalUnit,
  target: InternalUnit,
  actionEventId: string,
): void {
  let actionPower = COMBAT_TUNING.heavyHitPower;
  let causeId = actionEventId;
  if (target.health / target.maxHealth < 0.5) {
    actionPower += COMBAT_TUNING.followUpBonusPower;
    const signature = emit(state, {
      kind: "signature_triggered",
      causedByEventId: actionEventId,
      actorId: "bo",
      signatureName: HEROES.bo.signatureName,
      targetId: target.id,
      effect: "low_health_damage",
    });
    causeId = signature.eventId;
  }
  applyDamage({
    state,
    actor,
    target,
    actionId: "heavy_hit",
    actionPower,
    causedByEventId: causeId,
    useVariance: true,
  });
  changeTechniquePoints(
    state,
    actor,
    -COMBAT_TUNING.techniqueCost,
    "technique_cost",
    actionEventId,
  );
}

function performFirstAid(
  state: BattleState,
  actor: InternalUnit,
  target: InternalUnit,
  actionEventId: string,
): void {
  const wasBelowQuickHelp = target.health / target.maxHealth <= COMBAT_TUNING.quickHelpHealthRatio;
  const requestedAmount = COMBAT_TUNING.firstAidAmount;
  const healthGained = Math.min(requestedAmount, target.maxHealth - target.health);
  target.health += healthGained;
  const heal = emit(state, {
    kind: "healed",
    causedByEventId: actionEventId,
    actorId: "cy",
    targetId: target.id as HeroId,
    requestedAmount,
    healthGained,
    healthAfter: target.health,
  });
  if (wasBelowQuickHelp) {
    const signature = emit(state, {
      kind: "signature_triggered",
      causedByEventId: heal.eventId,
      actorId: "cy",
      signatureName: HEROES.cy.signatureName,
      targetId: target.id,
      effect: "low_health_guard",
    });
    applyGuard(
      state,
      actor.id,
      target,
      COMBAT_TUNING.quickHelpGuard,
      "quick_help",
      signature.eventId,
    );
  }
  changeTechniquePoints(
    state,
    actor,
    -COMBAT_TUNING.techniqueCost,
    "technique_cost",
    actionEventId,
  );
}

function resolveRearStrikeTarget(
  state: BattleState,
  actor: InternalUnit,
  intendedTarget: InternalUnit,
  intentEventId: string,
): { readonly target: InternalUnit; readonly causeId: string } {
  const marked = emit(state, {
    kind: "target_marked",
    causedByEventId: intentEventId,
    actorId: actor.id as keyof typeof ENEMIES,
    targetId: intendedTarget.id as HeroId,
    slot: "rear",
  });
  const ada = requireUnit(state, "ada");
  const canIntercept =
    state.command.plan.teamPolicy === "cover_rear" &&
    ada.health > 0 &&
    ada.slot === "middle" &&
    intendedTarget.id !== "ada";

  if (!canIntercept) {
    return { target: intendedTarget, causeId: marked.eventId };
  }

  const policy = emit(state, {
    kind: "policy_triggered",
    causedByEventId: marked.eventId,
    policyId: "cover_rear",
    actorId: "ada",
    targetId: intendedTarget.id as HeroId,
    effect: "intercept",
  });
  const signature = emit(state, {
    kind: "signature_triggered",
    causedByEventId: policy.eventId,
    actorId: "ada",
    signatureName: HEROES.ada.signatureName,
    targetId: intendedTarget.id,
    effect: "intercept",
  });
  applyGuard(
    state,
    "ada",
    ada,
    COMBAT_TUNING.coverRearGuard,
    "brace",
    signature.eventId,
  );
  const targetChanged = emit(state, {
    kind: "target_changed",
    causedByEventId: signature.eventId,
    actorId: actor.id,
    fromTargetId: intendedTarget.id,
    toTargetId: "ada",
    reason: "cover_rear",
  });
  emitDecisive(state, "rear_intercept", "ada", intendedTarget.id, targetChanged.eventId);
  return { target: ada, causeId: targetChanged.eventId };
}

function performLineHit(
  state: BattleState,
  actor: InternalUnit,
  target: InternalUnit,
  actionEventId: string,
): void {
  const damage = applyDamage({
    state,
    actor,
    target,
    actionId: "line_hit",
    actionPower: COMBAT_TUNING.lineHitPower,
    causedByEventId: actionEventId,
    useVariance: true,
  });
  if (target.health === 0) {
    return;
  }

  target.strain += 1;
  const strain = emit(state, {
    kind: "strain_changed",
    causedByEventId: damage.eventId,
    targetId: target.id as HeroId,
    strainAfter: target.strain,
    threshold: COMBAT_TUNING.breakThreshold,
  });

  if (target.strain < COMBAT_TUNING.breakThreshold) {
    return;
  }

  target.strain = 0;
  target.brokenUntilRound = state.round + 1;
  const guardRemoved = target.guard;
  const broken = emit(state, {
    kind: "front_broken",
    causedByEventId: strain.eventId,
    actorId: actor.id as keyof typeof ENEMIES,
    targetId: target.id as HeroId,
    guardRemoved,
    defencePenalty: COMBAT_TUNING.breakDefencePenalty,
  });
  if (guardRemoved > 0) {
    target.guard = 0;
    emit(state, {
      kind: "guard_changed",
      causedByEventId: broken.eventId,
      actorId: actor.id,
      targetId: target.id,
      amount: -guardRemoved,
      guardAfter: 0,
      reason: "break",
    });
  }
  emit(state, {
    kind: "strain_changed",
    causedByEventId: broken.eventId,
    targetId: target.id as HeroId,
    strainAfter: 0,
    threshold: COMBAT_TUNING.breakThreshold,
  });
  emitDecisive(state, "front_broken", actor.id, target.id, broken.eventId);
  applyDamage({
    state,
    actor,
    target,
    actionId: "line_hit",
    inputPower: 0,
    actionPower: COMBAT_TUNING.breakBonusPower,
    causedByEventId: broken.eventId,
    useVariance: false,
    defencePenalty: target.defence,
  });
}

function performAction(state: BattleState, actor: InternalUnit): void {
  const chosen = chooseAction(state, actor);
  emit(state, { kind: "action_options", actorId: actor.id, options: chosen.options });
  const intendedTarget = chosen.targets[0];
  if (!intendedTarget) {
    throw new Error(`Action ${chosen.actionId} has no target`);
  }
  const intent = emit(state, {
    kind: "intent_shown",
    actorId: actor.id,
    actionId: chosen.actionId,
    targetIds: chosen.targets.map((target) => target.id),
    reason: chosen.reason,
  });

  let finalTarget = intendedTarget;
  let actionCauseId = intent.eventId;
  if (chosen.actionId === "rear_strike") {
    const resolved = resolveRearStrikeTarget(state, actor, intendedTarget, intent.eventId);
    finalTarget = resolved.target;
    actionCauseId = resolved.causeId;
  }

  const action = emit(state, {
    kind: "action_started",
    causedByEventId: actionCauseId,
    actorId: actor.id,
    actionId: chosen.actionId,
    targetIds: [finalTarget.id],
  });
  actor.actionsTaken += 1;
  state.actionCount += 1;

  switch (chosen.actionId) {
    case "basic":
      performBasic(state, actor, finalTarget, action.eventId);
      break;
    case "brace":
      performBrace(state, actor, action.eventId);
      break;
    case "heavy_hit":
      performHeavyHit(state, actor, finalTarget, action.eventId);
      break;
    case "first_aid":
      performFirstAid(state, actor, finalTarget, action.eventId);
      break;
    case "rear_strike":
      applyDamage({
        state,
        actor,
        target: finalTarget,
        actionId: "rear_strike",
        actionPower: COMBAT_TUNING.rearStrikePower,
        causedByEventId: action.eventId,
        useVariance: true,
      });
      break;
    case "line_hit":
      performLineHit(state, actor, finalTarget, action.eventId);
      break;
  }
}

function initiativeOrder(state: BattleState): InternalUnit[] {
  return [...state.units.values()]
    .filter((unit) => unit.health > 0)
    .map((unit) => ({ unit, tie: state.initiativeRng.nextUint32() }))
    .sort((left, right) => right.unit.speed - left.unit.speed || left.tie - right.tie)
    .map(({ unit }) => unit);
}

function sideDefeated(state: BattleState, side: Side): boolean {
  return livingUnits(state, side).length === 0;
}

function winnerAtCap(state: BattleState): BattleWinner {
  const ratio = (side: Side): number => {
    const units = [...state.units.values()].filter((unit) => unit.side === side);
    return (
      units.reduce((total, unit) => total + unit.health, 0) /
      units.reduce((total, unit) => total + unit.maxHealth, 0)
    );
  };
  const heroRatio = ratio("heroes");
  const enemyRatio = ratio("enemies");
  if (heroRatio === enemyRatio) {
    return "draw";
  }
  return heroRatio > enemyRatio ? "heroes" : "enemies";
}

function currentWinner(state: BattleState, reason: BattleEndReason): BattleWinner {
  if (reason === "action_cap") {
    return winnerAtCap(state);
  }
  const heroesDefeated = sideDefeated(state, "heroes");
  const enemiesDefeated = sideDefeated(state, "enemies");
  if (heroesDefeated && enemiesDefeated) {
    return "draw";
  }
  return heroesDefeated ? "enemies" : "heroes";
}

function snapshots(state: BattleState): UnitSnapshot[] {
  return [...state.units.values()]
    .sort((left, right) => {
      if (left.side !== right.side) {
        return left.side === "heroes" ? -1 : 1;
      }
      return slotRank[left.slot] - slotRank[right.slot];
    })
    .map((unit) => ({
      id: unit.id,
      name: unit.name,
      side: unit.side,
      slot: unit.slot,
      health: unit.health,
      maxHealth: unit.maxHealth,
      speed: unit.speed,
      guard: unit.guard,
      techniquePoints: unit.techniquePoints,
      strain: unit.strain,
      broken: unit.brokenUntilRound >= state.round,
      defeated: unit.health === 0,
    }));
}

function highlights(state: BattleState, battleEndEventId: string): BattleHighlights {
  const started = state.events.find((event) => event.kind === "battle_started");
  if (!started) {
    throw new Error("Battle result is missing its start event");
  }
  const policy = state.events.find((event) => event.kind === "policy_triggered");
  const equipment = state.events.find((event) => event.kind === "equipment_applied");
  const firstDefeat = state.events.find((event) => event.kind === "unit_defeated");
  return {
    planEventId: equipment?.eventId ?? policy?.eventId ?? started.eventId,
    turningPointEventId: state.decisiveEventId ?? firstDefeat?.eventId ?? battleEndEventId,
    outcomeEventId: battleEndEventId,
  };
}

export function simulateBattle(command: StartBattleCommand): BattleResult {
  const state = createState(command);
  const started = emit(state, {
    kind: "battle_started",
    encounterId: command.encounterId,
    seed: command.seed,
    formation: command.plan.formation,
    teamPolicy: command.plan.teamPolicy,
  });

  applyPriorCondition(state, started.eventId);

  if (command.plan.frontEquipment !== "none") {
    const equipment = EQUIPMENT[command.plan.frontEquipment];
    const front = requireUnit(state, command.plan.formation.front);
    const equipmentEvent = emit(state, {
      kind: "equipment_applied",
      causedByEventId: started.eventId,
      equipmentId: equipment.id,
      targetId: front.id as HeroId,
      slot: "front",
      speedBefore: HEROES[front.id as HeroId].stats.speed,
      speedChange: equipment.effects.speed,
      speedAfter: front.speed,
      startingGuard: equipment.effects.startingGuard,
    });
    if (equipment.effects.startingGuard > 0) {
      applyGuard(
        state,
        front.id,
        front,
        equipment.effects.startingGuard,
        "equipment",
        equipmentEvent.eventId,
      );
    }
  }

  if (command.plan.teamPolicy === "hold_front") {
    const front = requireUnit(state, command.plan.formation.front);
    const policy = emit(state, {
      kind: "policy_triggered",
      causedByEventId: started.eventId,
      policyId: "hold_front",
      actorId: front.id as HeroId,
      targetId: front.id as HeroId,
      effect: "starting_guard",
    });
    applyGuard(
      state,
      front.id,
      front,
      COMBAT_TUNING.holdFrontStartingGuard,
      "hold_front",
      policy.eventId,
    );
  }

  let endReason: BattleEndReason = "action_cap";
  let lastCauseId = started.eventId;

  while (state.actionCount < COMBAT_TUNING.actionCap) {
    state.round += 1;
    const order = initiativeOrder(state);
    const roundEvent = emit(state, {
      kind: "round_started",
      order: order.map((unit) => unit.id),
    });
    lastCauseId = roundEvent.eventId;

    for (const actor of order) {
      if (actor.health === 0) {
        continue;
      }
      if (sideDefeated(state, opposingSide(actor.side))) {
        break;
      }
      performAction(state, actor);
      lastCauseId = state.events[state.events.length - 1]?.eventId ?? lastCauseId;

      if (sideDefeated(state, "heroes") || sideDefeated(state, "enemies")) {
        endReason = "team_defeated";
        break;
      }
      if (state.actionCount >= COMBAT_TUNING.actionCap) {
        break;
      }
    }

    if (endReason === "team_defeated") {
      break;
    }
  }

  const winner = currentWinner(state, endReason);
  const battleEnd = emit(state, {
    kind: "battle_ended",
    causedByEventId: lastCauseId,
    winner,
    reason: endReason,
    actionCount: state.actionCount,
  });

  return {
    version: 1,
    command,
    winner,
    endReason,
    rounds: state.round,
    actionCount: state.actionCount,
    events: state.events,
    finalUnits: snapshots(state),
    highlights: highlights(state, battleEnd.eventId),
  };
}
