import { z } from "zod";
import { EQUIPMENT_SELECTION_IDS } from "../equipment";
import { bruisedConditionSchema } from "../aftermath";
import { LocalStorageSaveRepository } from "./localStorageRepository";
import type { SaveRepository, StorageLike } from "./repository";

export const COMBAT_LAB_SAVE_VERSION = 1 as const;
export const COMBAT_LAB_SAVE_KEY = "anotherverse.combat-lab.v1";

export const combatLabSaveSchema = z
  .object({
    version: z.literal(COMBAT_LAB_SAVE_VERSION),
    selectedEquipment: z.enum(EQUIPMENT_SELECTION_IDS),
    aftermathCondition: bruisedConditionSchema.nullable().default(null),
    progress: z
      .object({
        pressureRearCompleted: z.boolean(),
        punishFrontCompleted: z.boolean(),
      })
      .strict(),
    preferences: z
      .object({
        reducedMotion: z.boolean(),
        audioEnabled: z.boolean(),
        battleSpeed: z.union([z.literal(1), z.literal(1.5), z.literal(2)]),
      })
      .strict(),
  })
  .strict();

export type CombatLabSave = z.infer<typeof combatLabSaveSchema>;

export function createDefaultCombatLabSave(): CombatLabSave {
  return {
    version: COMBAT_LAB_SAVE_VERSION,
    selectedEquipment: "none",
    aftermathCondition: null,
    progress: {
      pressureRearCompleted: false,
      punishFrontCompleted: false,
    },
    preferences: {
      reducedMotion: false,
      audioEnabled: true,
      battleSpeed: 1,
    },
  };
}

export function createCombatLabSaveRepository(
  storage: StorageLike,
): SaveRepository<CombatLabSave> {
  return new LocalStorageSaveRepository(storage, COMBAT_LAB_SAVE_KEY, {
    version: COMBAT_LAB_SAVE_VERSION,
    schema: combatLabSaveSchema,
  });
}
