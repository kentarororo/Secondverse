export const EQUIPMENT_IDS = ["heavy_pad", "quick_shoes"] as const;
export type EquipmentId = (typeof EQUIPMENT_IDS)[number];

export const EQUIPMENT_SELECTION_IDS = ["none", ...EQUIPMENT_IDS] as const;
export type EquipmentSelectionId = (typeof EQUIPMENT_SELECTION_IDS)[number];

export interface EquipmentEffects {
  readonly speed: number;
  readonly startingGuard: number;
}

export interface EquipmentDefinition {
  readonly id: EquipmentId;
  readonly name: string;
  readonly description: string;
  readonly effects: EquipmentEffects;
}

export interface EquipmentReward {
  readonly afterEncounterId: "pressure_rear";
  readonly optionIds: readonly [EquipmentId, EquipmentId];
}
