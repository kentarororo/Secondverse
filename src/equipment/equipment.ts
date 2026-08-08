import type { EquipmentDefinition, EquipmentId } from "./types";
import { parseEquipmentDefinition } from "./schema";

const equipmentInputs = [
  {
    id: "heavy_pad",
    name: "Heavy Pad",
    description: "The hero in the front slot starts with 18 Guard and −3 Speed.",
    effects: { speed: -3, startingGuard: 18 },
  },
  {
    id: "quick_shoes",
    name: "Quick Shoes",
    description: "The hero in the front slot starts with +4 Speed and no bonus Guard.",
    effects: { speed: 4, startingGuard: 0 },
  },
] as const;

export const EQUIPMENT: Readonly<Record<EquipmentId, EquipmentDefinition>> = Object.freeze(
  Object.fromEntries(
    equipmentInputs.map((input) => [input.id, parseEquipmentDefinition(input)]),
  ) as Record<EquipmentId, EquipmentDefinition>,
);
