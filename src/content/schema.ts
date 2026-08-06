import { z } from "zod";
import { EQUIPMENT_SELECTION_IDS } from "../equipment/types";
import { bruisedConditionSchema } from "../aftermath/schema";
import {
  ENCOUNTER_IDS,
  ENEMY_ACTION_IDS,
  ENEMY_IDS,
  HERO_ACTION_IDS,
  HERO_IDS,
  TEAM_POLICY_IDS,
  TECHNIQUE_POLICY_IDS,
  type EncounterBlueprint,
  type EnemyBlueprint,
  type HeroBlueprint,
  type StartBattleCommand,
} from "../sim/types";

const statsSchema = z.object({
  maxHealth: z.number().int().min(40).max(200),
  power: z.number().int().min(1).max(40),
  defence: z.number().int().min(0).max(30),
  speed: z.number().int().min(1).max(30),
  guardCap: z.number().int().min(0).max(80),
});

export const heroBlueprintSchema = z.object({
  id: z.enum(HERO_IDS),
  name: z.string().min(1).max(24),
  role: z.enum(["guard", "damage", "support"]),
  stats: statsSchema,
  technique: z.enum(HERO_ACTION_IDS).exclude(["basic"]),
  techniqueName: z.string().min(1).max(24),
  signatureName: z.string().min(1).max(24),
});

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
    techniquePolicies: z.object({
      ada: z.enum(TECHNIQUE_POLICY_IDS),
      bo: z.enum(TECHNIQUE_POLICY_IDS),
      cy: z.enum(TECHNIQUE_POLICY_IDS),
    }),
    frontEquipment: z.enum(EQUIPMENT_SELECTION_IDS),
    priorCondition: bruisedConditionSchema.nullable(),
  }),
});

export function parseHeroBlueprint(input: unknown): HeroBlueprint {
  return heroBlueprintSchema.parse(input) as HeroBlueprint;
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
