import type { EncounterId } from "../sim/types";
import { EQUIPMENT } from "./equipment";
import { parseEquipmentReward } from "./schema";
import type { EquipmentDefinition, EquipmentReward } from "./types";

export const PRESSURE_REAR_REWARD: EquipmentReward = parseEquipmentReward({
  afterEncounterId: "pressure_rear",
  optionIds: ["heavy_pad", "quick_shoes"],
});

export function getEquipmentRewardOptions(
  completedEncounterId: EncounterId,
): readonly EquipmentDefinition[] {
  if (completedEncounterId !== PRESSURE_REAR_REWARD.afterEncounterId) {
    return [];
  }
  return PRESSURE_REAR_REWARD.optionIds.map((equipmentId) => EQUIPMENT[equipmentId]);
}
