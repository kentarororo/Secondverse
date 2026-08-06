import { z } from "zod";
import { HERO_IDS } from "../sim/types";
import {
  BRUISED_HEALTH_PENALTY,
  type AftermathFact,
  type BruisedCondition,
} from "./types";

export const bruisedConditionSchema = z
  .object({
    kind: z.literal("bruised"),
    heroId: z.enum(HERO_IDS),
    healthPenalty: z.literal(BRUISED_HEALTH_PENALTY),
    sourceEventId: z.string().min(1),
  })
  .strict();

export const aftermathFactSchema = z.discriminatedUnion("kind", [
  bruisedConditionSchema,
  z
    .object({
      kind: z.literal("no_injury"),
      sourceEventId: z.string().min(1),
    })
    .strict(),
]);

export function parseBruisedCondition(input: unknown): BruisedCondition {
  return bruisedConditionSchema.parse(input) as BruisedCondition;
}

export function parseAftermathFact(input: unknown): AftermathFact {
  return aftermathFactSchema.parse(input) as AftermathFact;
}
