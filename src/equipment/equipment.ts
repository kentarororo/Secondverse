import type { EquipmentDefinition, EquipmentId } from "./types";
import { parseEquipmentDefinition } from "./schema";

const equipmentInputs = [
  {
    id: "heavy_pad",
    name: "Heavy Pad",
    description: "Front hero starts with 18 guard and loses 3 speed.",
    effects: { speed: -3, startingGuard: 18 },
  },
  {
    id: "quick_shoes",
    name: "Quick Shoes",
    description: "Front hero gains 4 speed and no starting guard.",
    effects: { speed: 4, startingGuard: 0 },
  },
] as const;

export const EQUIPMENT: Readonly<Record<EquipmentId, EquipmentDefinition>> = Object.freeze(
  Object.fromEntries(
    equipmentInputs.map((input) => [input.id, parseEquipmentDefinition(input)]),
  ) as Record<EquipmentId, EquipmentDefinition>,
);
