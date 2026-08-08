import type { HeroBlueprint, HeroId } from "../sim/types";
import { parseHeroBlueprint } from "./schema";

const heroInputs = [
  {
    id: "ada",
    name: "Ada",
    role: "guard",
    stats: { maxHealth: 112, power: 13, defence: 9, speed: 10, guardCap: 40 },
    technique: "brace",
    techniqueName: "Brace",
    signatureName: "Step In",
    stanceIds: ["ada_brace_early", "ada_brace_under_pressure"],
  },
  {
    id: "bo",
    name: "Bo",
    role: "damage",
    stats: { maxHealth: 84, power: 19, defence: 4, speed: 14, guardCap: 20 },
    technique: "heavy_hit",
    techniqueName: "Heavy Hit",
    signatureName: "Follow Up",
    stanceIds: ["bo_hit_front", "bo_finish_weak"],
  },
  {
    id: "cy",
    name: "Cy",
    role: "support",
    stats: { maxHealth: 90, power: 10, defence: 5, speed: 12, guardCap: 24 },
    technique: "first_aid",
    techniqueName: "First Aid",
    signatureName: "Quick Help",
    stanceIds: ["cy_aid_one", "cy_aid_two"],
  },
] as const;

export const HEROES: Readonly<Record<HeroId, HeroBlueprint>> = Object.freeze(
  Object.fromEntries(heroInputs.map((input) => [input.id, parseHeroBlueprint(input)])) as Record<
    HeroId,
    HeroBlueprint
  >,
);

export const AUTHORED_TRIO = heroInputs.map(({ id }) => HEROES[id]);
