import { z } from "zod";
import type { ActionId, UnitId } from "../../sim";

export const STATUS_VISUAL_IDS = [
  "status.marked",
  "status.broken",
  "status.defeated",
  "status.bruised",
] as const;
export type StatusVisualId = (typeof STATUS_VISUAL_IDS)[number];

export const EFFECT_VISUAL_IDS = [
  "effect.damage",
  "effect.heal",
  "effect.guard",
  "effect.technique",
  "effect.strain",
  "effect.speed",
] as const;
export type EffectVisualId = (typeof EFFECT_VISUAL_IDS)[number];

export const UNIT_VISUAL_IDS = [
  "unit.ada",
  "unit.bo",
  "unit.cy",
  "enemy.rear_attacker",
  "enemy.rear_guard",
  "enemy.rear_helper",
  "enemy.line_breaker",
  "enemy.line_guard",
  "enemy.line_helper",
] as const;
export type UnitVisualId = (typeof UNIT_VISUAL_IDS)[number];

export const ACTION_VISUAL_IDS = [
  "action.basic",
  "action.brace",
  "action.heavy_hit",
  "action.first_aid",
  "action.rear_strike",
  "action.line_hit",
] as const;
export type ActionVisualId = (typeof ACTION_VISUAL_IDS)[number];

export type CombatVisualId =
  | UnitVisualId
  | ActionVisualId
  | StatusVisualId
  | EffectVisualId;

export const FALLBACK_VISUAL_IDS = [
  "fallback.role.guard",
  "fallback.role.damage",
  "fallback.role.support",
  "fallback.enemy.attacker",
  "fallback.enemy.guard",
  "fallback.enemy.helper",
  "fallback.enemy.breaker",
  "fallback.action",
  "fallback.status.text",
  "fallback.effect.delta",
] as const;
export type FallbackVisualId = (typeof FALLBACK_VISUAL_IDS)[number];

const pointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const sourceSchema = z.object({
  path: z.string().min(1),
  format: z.enum(["png", "webp"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  frameWidth: z.number().int().positive(),
  frameHeight: z.number().int().positive(),
  rows: z.number().int().positive(),
  columns: z.number().int().positive(),
  margin: z.number().int().nonnegative(),
  spacing: z.number().int().nonnegative(),
});

const stateSchema = z.object({
  frames: z.array(z.number().int().nonnegative()).min(1),
  framesPerSecond: z.number().positive(),
  loop: z.boolean(),
  eventFrame: z.number().int().nonnegative().nullable(),
});

export const combatAssetDefinitionSchema = z.object({
  id: z.string().regex(/^(unit|enemy|action|status|effect|fallback)\.[a-z0-9_.]+$/),
  kind: z.enum(["unit", "action", "status", "effect"]),
  source: sourceSchema.nullable(),
  layout: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    scale: z.number().positive(),
    facing: z.enum(["left", "right", "none"]),
  }),
  anchors: z.object({
    feet: pointSchema,
    impact: pointSchema,
    label: pointSchema,
  }),
  states: z.record(z.string(), stateSchema),
  fallbackId: z.string().min(1),
  attribution: z.object({
    creator: z.string().min(1),
    license: z.string().min(1),
    source: z.string().min(1),
  }),
});

export type CombatAssetDefinition = z.infer<typeof combatAssetDefinitionSchema>;

const unitVisualByUnit: Readonly<Record<UnitId, UnitVisualId>> = {
  ada: "unit.ada",
  bo: "unit.bo",
  cy: "unit.cy",
  rear_attacker: "enemy.rear_attacker",
  rear_guard: "enemy.rear_guard",
  rear_helper: "enemy.rear_helper",
  line_breaker: "enemy.line_breaker",
  line_guard: "enemy.line_guard",
  line_helper: "enemy.line_helper",
};

const actionVisualByAction: Readonly<Record<ActionId, ActionVisualId>> = {
  basic: "action.basic",
  brace: "action.brace",
  heavy_hit: "action.heavy_hit",
  first_aid: "action.first_aid",
  rear_strike: "action.rear_strike",
  line_hit: "action.line_hit",
};

const cssFallbackByUnit: Readonly<Record<UnitId, string>> = {
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

const fallbackIdByUnit: Readonly<Record<UnitId, FallbackVisualId>> = {
  ada: "fallback.role.guard",
  bo: "fallback.role.damage",
  cy: "fallback.role.support",
  rear_attacker: "fallback.enemy.attacker",
  rear_guard: "fallback.enemy.guard",
  rear_helper: "fallback.enemy.helper",
  line_breaker: "fallback.enemy.breaker",
  line_guard: "fallback.enemy.guard",
  line_helper: "fallback.enemy.helper",
};

const placeholderStates = {
  idle: { frames: [0], framesPerSecond: 1, loop: true, eventFrame: null },
} as const;

function placeholderDefinition(
  id: string,
  kind: CombatAssetDefinition["kind"],
  fallbackId: string,
): CombatAssetDefinition {
  return combatAssetDefinitionSchema.parse({
    id,
    kind,
    source: null,
    layout: {
      width: kind === "unit" ? 96 : 48,
      height: kind === "unit" ? 128 : 48,
      scale: 1,
      facing: kind === "unit" ? "left" : "none",
    },
    anchors: {
      feet: { x: 0.5, y: 1 },
      impact: { x: 0.5, y: 0.45 },
      label: { x: 0.5, y: 0.18 },
    },
    states: placeholderStates,
    fallbackId,
    attribution: {
      creator: "Anotherverse placeholder",
      license: "Project-owned CSS fallback",
      source: "No raster asset assigned",
    },
  });
}

const definitions: CombatAssetDefinition[] = [
  ...UNIT_VISUAL_IDS.map((id) => {
    const unitId = (Object.entries(unitVisualByUnit) as [UnitId, UnitVisualId][]).find(
      ([, visualId]) => visualId === id,
    )?.[0];
    if (!unitId) throw new Error(`Missing unit for visual ${id}`);
    return placeholderDefinition(id, "unit", fallbackIdByUnit[unitId]);
  }),
  ...ACTION_VISUAL_IDS.map((id) => placeholderDefinition(id, "action", "fallback.action")),
  ...STATUS_VISUAL_IDS.map((id) => placeholderDefinition(id, "status", "fallback.status.text")),
  ...EFFECT_VISUAL_IDS.map((id) => placeholderDefinition(id, "effect", "fallback.effect.delta")),
];

export const COMBAT_ASSET_MANIFEST: Readonly<Record<CombatVisualId, CombatAssetDefinition>> =
  Object.freeze(
    Object.fromEntries(definitions.map((definition) => [definition.id, definition])) as Record<
      CombatVisualId,
      CombatAssetDefinition
    >,
  );

export const COMBAT_FALLBACK_MANIFEST: Readonly<
  Record<FallbackVisualId, CombatAssetDefinition>
> = Object.freeze(
  Object.fromEntries(
    FALLBACK_VISUAL_IDS.map((id) => {
      const kind = id.startsWith("fallback.action")
        ? "action"
        : id.startsWith("fallback.status")
          ? "status"
          : id.startsWith("fallback.effect")
            ? "effect"
            : "unit";
      return [id, placeholderDefinition(id, kind, "fallback.css")];
    }),
  ) as Record<FallbackVisualId, CombatAssetDefinition>,
);

export interface ResolvedUnitVisual {
  readonly visualId: UnitVisualId;
  readonly definition: CombatAssetDefinition;
  readonly kind: "asset" | "css";
  readonly cssClassName: string;
  readonly resolvedVisualId: string;
}

export function unitVisualId(unitId: UnitId): UnitVisualId {
  return unitVisualByUnit[unitId];
}

export function actionVisualId(actionId: ActionId): ActionVisualId {
  return actionVisualByAction[actionId];
}

export function resolveUnitVisual(
  unitId: UnitId,
  failedVisualIds: readonly string[] = [],
): ResolvedUnitVisual {
  const visualId = unitVisualId(unitId);
  const exact = COMBAT_ASSET_MANIFEST[visualId];
  const fallback = COMBAT_FALLBACK_MANIFEST[fallbackIdByUnit[unitId]];
  const definition =
    exact.source && !failedVisualIds.includes(exact.id)
      ? exact
      : fallback.source && !failedVisualIds.includes(fallback.id)
        ? fallback
        : exact;
  return {
    visualId,
    definition,
    kind: definition.source ? "asset" : "css",
    cssClassName: cssFallbackByUnit[unitId],
    resolvedVisualId: definition.source ? definition.id : "fallback.css",
  };
}
