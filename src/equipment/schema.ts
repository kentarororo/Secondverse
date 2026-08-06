import { z } from "zod";
import { EQUIPMENT_IDS, type EquipmentDefinition, type EquipmentReward } from "./types";

export const equipmentDefinitionSchema = z.object({
  id: z.enum(EQUIPMENT_IDS),
  name: z.string().min(1).max(24),
  description: z.string().min(1).max(100),
  effects: z.object({
    speed: z.number().int().min(-8).max(8),
    startingGuard: z.number().int().min(0).max(40),
  }),
});

export const equipmentRewardSchema = z
  .object({
    afterEncounterId: z.literal("pressure_rear"),
    optionIds: z.tuple([z.enum(EQUIPMENT_IDS), z.enum(EQUIPMENT_IDS)]),
  })
  .refine(({ optionIds }) => optionIds[0] !== optionIds[1], "Reward options must be distinct");

export function parseEquipmentDefinition(input: unknown): EquipmentDefinition {
  return equipmentDefinitionSchema.parse(input) as EquipmentDefinition;
}

export function parseEquipmentReward(input: unknown): EquipmentReward {
  return equipmentRewardSchema.parse(input) as EquipmentReward;
}
