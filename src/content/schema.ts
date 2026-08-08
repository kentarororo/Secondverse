import { z } from "zod";
import { EQUIPMENT_SELECTION_IDS } from "../equipment/types";
import { bruisedConditionSchema } from "../aftermath/schema";
import {
  ADA_STANCE_IDS,
  BO_STANCE_IDS,
  CY_STANCE_IDS,
  ENCOUNTER_IDS,
  ENEMY_ACTION_IDS,
  ENEMY_IDS,
  HERO_ACTION_IDS,
  HERO_IDS,
  HERO_STANCE_IDS,
  TEAM_POLICY_IDS,
  type EncounterBlueprint,
  type EnemyBlueprint,
  type HeroBlueprint,
  type StanceDefinition,
  type StartBattleCommand,
} from "../sim/types";

function stanceBelongsToHero(heroId: (typeof HERO_IDS)[number], stanceId: string): boolean {
  if (heroId === "ada") return (ADA_STANCE_IDS as readonly string[]).includes(stanceId);
  if (heroId === "bo") return (BO_STANCE_IDS as readonly string[]).includes(stanceId);
  return (CY_STANCE_IDS as readonly string[]).includes(stanceId);
}

const statsSchema = z.object({
  maxHealth: z.number().int().min(40).max(200),
  power: z.number().int().min(1).max(40),
  defence: z.number().int().min(0).max(30),
  speed: z.number().int().min(1).max(30),
  guardCap: z.number().int().min(0).max(80),
});

export const heroBlueprintSchema = z
  .object({
    id: z.enum(HERO_IDS),
    name: z.string().min(1).max(24),
    role: z.enum(["guard", "damage", "support"]),
    stats: statsSchema,
    technique: z.enum(HERO_ACTION_IDS).exclude(["basic"]),
    techniqueName: z.string().min(1).max(24),
    signatureName: z.string().min(1).max(24),
    stanceIds: z.tuple([z.enum(HERO_STANCE_IDS), z.enum(HERO_STANCE_IDS)]),
  })
  .superRefine(({ id, stanceIds }, context) => {
    if (stanceIds[0] === stanceIds[1]) {
      context.addIssue({ code: "custom", message: "Hero stance options must be distinct" });
    }
    for (const stanceId of stanceIds) {
      if (!stanceBelongsToHero(id, stanceId)) {
        context.addIssue({ code: "custom", message: `${stanceId} does not belong to ${id}` });
      }
    }
  });

const stanceTriggerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("at_points"), points: z.union([z.literal(2), z.literal(3)]) }),
  z.object({
    kind: z.literal("pressure_or_cap"),
    minimumPoints: z.literal(2),
    healthRatio: z.literal(0.6),
    strain: z.literal(2),
    forcedPoints: z.literal(3),
  }),
  z.object({
    kind: z.literal("weak_enemy_or_cap"),
    minimumPoints: z.literal(2),
    healthRatio: z.literal(0.5),
    forcedPoints: z.literal(3),
  }),
  z.object({
    kind: z.literal("injured_ally_at_points"),
    points: z.union([z.literal(2), z.literal(3)]),
  }),
]);

const stanceEffectSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("guard_self"), guard: z.union([z.literal(18), z.literal(26)]) }),
  z.object({ kind: z.literal("hit_front") }),
  z.object({ kind: z.literal("finish_weak") }),
  z.object({ kind: z.literal("heal_one"), healing: z.literal(24), maxTargets: z.literal(1) }),
  z.object({ kind: z.literal("heal_two"), healing: z.literal(16), maxTargets: z.literal(2) }),
]);

export const stanceDefinitionSchema = z
  .object({
    id: z.enum(HERO_STANCE_IDS),
    heroId: z.enum(HERO_IDS),
    name: z.string().min(1).max(28),
    forecast: z.string().min(1).max(140),
    actionId: z.enum(HERO_ACTION_IDS).exclude(["basic"]),
    techniqueCost: z.union([z.literal(2), z.literal(3)]),
    trigger: stanceTriggerSchema,
    effect: stanceEffectSchema,
  })
  .refine(({ heroId, id }) => stanceBelongsToHero(heroId, id), "Stance owner does not match ID");

export const enemyBlueprintSchema = z.object({
  id: z.enum(ENEMY_IDS),
  name: z.string().min(1).max(28),
  stats: statsSchema,
  rule: z.enum(["nearest", "rear_target", "rear_every_third", "front_strain"]),
});

export const encounterBlueprintSchema = z.object({
  id: z.enum(ENCOUNTER_IDS),
  name: z.string().min(1).max(32),
  tell: z.string().min(1).max(140),
  enemyIds: z.tuple([z.enum(ENEMY_IDS), z.enum(ENEMY_IDS), z.enum(ENEMY_IDS)]),
});

const formationSchema = z
  .object({
    front: z.enum(HERO_IDS),
    middle: z.enum(HERO_IDS),
    rear: z.enum(HERO_IDS),
  })
  .refine(
    ({ front, middle, rear }) => new Set([front, middle, rear]).size === HERO_IDS.length,
    "Each hero must occupy exactly one formation slot",
  );

export const startBattleCommandSchema = z.object({
  type: z.literal("start_battle"),
  version: z.literal(1),
  seed: z.string().min(1).max(128),
  encounterId: z.enum(ENCOUNTER_IDS),
  plan: z.object({
    formation: formationSchema,
    teamPolicy: z.enum(TEAM_POLICY_IDS),
    stances: z.object({
      ada: z.enum(ADA_STANCE_IDS),
      bo: z.enum(BO_STANCE_IDS),
      cy: z.enum(CY_STANCE_IDS),
    }),
    frontEquipment: z.enum(EQUIPMENT_SELECTION_IDS),
    priorCondition: bruisedConditionSchema.nullable(),
  }),
});

export function parseHeroBlueprint(input: unknown): HeroBlueprint {
  return heroBlueprintSchema.parse(input) as HeroBlueprint;
}

export function parseStanceDefinition(input: unknown): StanceDefinition {
  return stanceDefinitionSchema.parse(input) as StanceDefinition;
}

export function parseEnemyBlueprint(input: unknown): EnemyBlueprint {
  return enemyBlueprintSchema.parse(input) as EnemyBlueprint;
}

export function parseEncounterBlueprint(input: unknown): EncounterBlueprint {
  return encounterBlueprintSchema.parse(input) as EncounterBlueprint;
}

export function parseStartBattleCommand(input: unknown): StartBattleCommand {
  return startBattleCommandSchema.parse(input) as StartBattleCommand;
}

export const ACTION_IDS = [...HERO_ACTION_IDS, ...ENEMY_ACTION_IDS] as const;
