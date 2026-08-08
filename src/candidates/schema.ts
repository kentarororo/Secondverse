import { z } from "zod";
import {
  ADVANTAGE_IDS,
  CANDIDATE_STAT_IDS,
  CANDIDATE_TAGS,
  CHASSIS_IDS,
  COMPLICATION_IDS,
  GROWTH_CURVE_IDS,
  IDENTITY_IDS,
  POTENTIAL_TELL_IDS,
  SIGNATURE_IDS,
  TECHNIQUE_IDS,
  TECHNIQUE_LOADOUT_IDS,
  TECHNIQUE_ROLES,
  TEMPERAMENT_IDS,
  VISUAL_PROFILE_IDS,
  type CandidateContent,
  type CandidateDraft,
  type DraftRosterCommand,
  type DraftRosterResult,
} from "./types";

function wordCount(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

const playerSentenceSchema = z
  .string()
  .refine((value) => wordCount(value) >= 8 && wordCount(value) <= 30, {
    message: "Player-facing text must contain 8 to 30 words",
  });

export const candidateStatsSchema = z
  .object({
    vitality: z.number().int().min(0).max(30),
    power: z.number().int().min(0).max(30),
    guard: z.number().int().min(0).max(30),
    speed: z.number().int().min(0).max(30),
    focus: z.number().int().min(0).max(30),
  })
  .strict();

const ruleTriggerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("battle_start") }).strict(),
  z.object({ kind: z.literal("after_basic") }).strict(),
  z.object({ kind: z.literal("after_ally_guarded") }).strict(),
  z.object({ kind: z.literal("after_self_guarded") }).strict(),
  z.object({ kind: z.literal("after_heal") }).strict(),
  z.object({ kind: z.literal("after_intercept") }).strict(),
  z.object({ kind: z.literal("self_below_health"), ratio: z.union([z.literal(0.3), z.literal(0.5), z.literal(0.6)]) }).strict(),
  z.object({ kind: z.literal("ally_below_health"), ratio: z.union([z.literal(0.3), z.literal(0.5)]) }).strict(),
  z.object({ kind: z.literal("enemy_below_health"), ratio: z.union([z.literal(0.3), z.literal(0.5)]) }).strict(),
  z.object({ kind: z.literal("at_points"), points: z.union([z.literal(2), z.literal(3)]) }).strict(),
]);

const ruleTargetSchema = z.enum([
  "self",
  "front_enemy",
  "lowest_health_enemy",
  "most_injured_ally",
  "triggering_ally",
]);

const ruleEffectSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("gain_guard"), amount: z.number().int().min(1).max(30) }).strict(),
  z.object({ kind: z.literal("gain_points"), amount: z.literal(1) }).strict(),
  z.object({
    kind: z.literal("bonus_power"), amount: z.number().int().min(1).max(20), uses: z.literal(1),
    timing: z.enum(["immediate_technique_attack", "next_attack", "next_technique"]),
  }).strict(),
  z.object({ kind: z.literal("heal"), amount: z.number().int().min(1).max(30) }).strict(),
  z.object({ kind: z.literal("add_strain"), amount: z.literal(1) }).strict(),
  z.object({ kind: z.literal("lose_guard"), amount: z.number().int().min(1).max(30) }).strict(),
  z.object({
    kind: z.literal("force_target"), target: z.enum(["front_enemy", "lowest_health_enemy"]),
    uses: z.literal(1), timing: z.enum(["immediate_technique", "next_attack"]),
  }).strict(),
]);

const mechanicalRuleSchema = z
  .object({
    trigger: ruleTriggerSchema,
    target: ruleTargetSchema,
    effect: ruleEffectSchema,
    oncePerRound: z.boolean(),
  })
  .strict();

const chassisSchema = z.object({
  id: z.enum(CHASSIS_IDS), name: z.string().min(1).max(24), rulesText: playerSentenceSchema,
  baseStats: candidateStatsSchema, tags: z.array(z.enum(CANDIDATE_TAGS)).min(2),
  techniqueRoles: z.array(z.enum(TECHNIQUE_ROLES)).min(2),
}).strict();

const growthCurveSchema = z.object({
  id: z.enum(GROWTH_CURVE_IDS), name: z.string().min(1).max(24), rulesText: playerSentenceSchema,
  earlyDelta: candidateStatsSchema, lateDelta: candidateStatsSchema,
  pattern: z.enum(["early", "steady", "volatile", "late", "specialist"]),
}).strict();

const signatureSchema = z.object({
  id: z.enum(SIGNATURE_IDS), name: z.string().min(1).max(28), rulesText: playerSentenceSchema,
  rule: mechanicalRuleSchema, tags: z.array(z.enum(CANDIDATE_TAGS)).min(1),
}).strict();

const advantageSchema = z.object({
  id: z.enum(ADVANTAGE_IDS), name: z.string().min(1).max(28), rulesText: playerSentenceSchema,
  rule: mechanicalRuleSchema, tags: z.array(z.enum(CANDIDATE_TAGS)).min(1),
}).strict();

const complicationSchema = z.object({
  id: z.enum(COMPLICATION_IDS), name: z.string().min(1).max(28), rulesText: playerSentenceSchema,
  rule: mechanicalRuleSchema, tags: z.array(z.enum(CANDIDATE_TAGS)).min(1),
}).strict();

const temperamentSchema = z.object({
  id: z.enum(TEMPERAMENT_IDS), name: z.string().min(1).max(24), rulesText: playerSentenceSchema,
  policy: z.object({
    riskThreshold: z.union([z.literal(30), z.literal(40), z.literal(50), z.literal(60)]),
    spendAtPoints: z.union([z.literal(2), z.literal(3)]),
    rescueBias: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    focusFireBias: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  }).strict(),
}).strict();

const potentialTellSchema = z.object({
  id: z.enum(POTENTIAL_TELL_IDS), text: playerSentenceSchema,
  growthIds: z.array(z.enum(GROWTH_CURVE_IDS)).min(1),
  signals: z.tuple([z.enum(CANDIDATE_STAT_IDS)]).rest(z.enum(CANDIDATE_STAT_IDS)),
  certainty: z.literal("direction_only"),
}).strict();

const techniqueSchema = z.object({
  id: z.enum(TECHNIQUE_IDS), name: z.string().min(1).max(28), rulesText: playerSentenceSchema,
  role: z.enum(TECHNIQUE_ROLES), cost: z.union([z.literal(2), z.literal(3)]),
  target: ruleTargetSchema, effects: z.union([z.tuple([ruleEffectSchema]), z.tuple([ruleEffectSchema, ruleEffectSchema])]),
  tags: z.array(z.enum(CANDIDATE_TAGS)).min(1),
}).strict();

const loadoutSchema = z.object({
  id: z.enum(TECHNIQUE_LOADOUT_IDS), techniqueIds: z.tuple([z.enum(TECHNIQUE_IDS), z.enum(TECHNIQUE_IDS)]),
  roles: z.tuple([z.enum(TECHNIQUE_ROLES), z.enum(TECHNIQUE_ROLES)]),
}).strict().superRefine((value, context) => {
  if (value.techniqueIds[0] === value.techniqueIds[1]) context.addIssue({code:"custom", message:"Loadout techniques must differ"});
  if (value.roles[0] === value.roles[1]) context.addIssue({code:"custom", message:"Loadout roles must differ"});
});

const identitySchema = z.object({id:z.enum(IDENTITY_IDS), displayName:z.string().min(1).max(24)}).strict();
const visualProfileSchema = z.object({
  id:z.enum(VISUAL_PROFILE_IDS), silhouette:z.enum(["light","medium","heavy"]),
  paletteId:z.string().min(1).max(32), poseId:z.string().min(1).max(32),
}).strict();

export const candidateContentSchema = z.object({
  chassis:z.array(chassisSchema).min(3), growthCurves:z.array(growthCurveSchema).min(6),
  signatures:z.array(signatureSchema).min(12), advantages:z.array(advantageSchema).min(12),
  complications:z.array(complicationSchema).min(12), temperaments:z.array(temperamentSchema).min(6),
  potentialTells:z.array(potentialTellSchema).min(12), techniques:z.array(techniqueSchema).min(18),
  loadouts:z.array(loadoutSchema).min(12), identities:z.array(identitySchema).min(24),
  visualProfiles:z.array(visualProfileSchema).min(9),
}).strict();

const semanticFingerprintSchema = z.object({
  version:z.literal(1), key:z.string().min(1), hash:z.string().regex(/^[0-9a-f]{8}$/u),
  dimensions:z.tuple([z.string(),z.string(),z.string(),z.string(),z.string(),z.string(),z.string()]),
}).strict();

export const candidateDraftSchema = z.object({
  version:z.literal(1), status:z.literal("lab_only_not_fieldable"), candidateId:z.string().min(1),
  identity:z.object({identityId:z.enum(IDENTITY_IDS),displayName:z.string().min(1).max(24)}).strict(),
  visualProfileId:z.enum(VISUAL_PROFILE_IDS), chassisId:z.enum(CHASSIS_IDS), stats:candidateStatsSchema,
  growthCurveId:z.enum(GROWTH_CURVE_IDS), signatureId:z.enum(SIGNATURE_IDS),
  advantageId:z.enum(ADVANTAGE_IDS), complicationId:z.enum(COMPLICATION_IDS),
  temperamentId:z.enum(TEMPERAMENT_IDS), potentialTellId:z.enum(POTENTIAL_TELL_IDS),
  techniqueIds:z.tuple([z.enum(TECHNIQUE_IDS),z.enum(TECHNIQUE_IDS)]),
  techniqueLoadoutId:z.enum(TECHNIQUE_LOADOUT_IDS), semanticFingerprint:semanticFingerprintSchema,
}).strict();

export const draftRosterCommandSchema = z.object({
  type:z.literal("draft_candidate_roster"), version:z.literal(1), poolVersion:z.literal(1),
  seed:z.string().min(1).max(128), count:z.literal(3),
}).strict();

export const draftRosterResultSchema = z.discriminatedUnion("status", [
  z.object({
    status:z.literal("ok"), version:z.literal(1), command:draftRosterCommandSchema,
    rosterId:z.string().min(1), candidates:z.tuple([candidateDraftSchema,candidateDraftSchema,candidateDraftSchema]),
    attemptsBySlot:z.tuple([z.number().int().min(1),z.number().int().min(1),z.number().int().min(1)]),
    rejectedAttempts:z.number().int().min(0),
  }).strict(),
  z.object({
    status:z.literal("generation_failed"), version:z.literal(1), command:draftRosterCommandSchema,
    rosterId:z.string().min(1), failedSlot:z.union([z.literal(0),z.literal(1),z.literal(2)]),
    attempts:z.number().int().min(1), reason:z.literal("attempt_limit"),
  }).strict(),
]);

export function parseCandidateContent(input: unknown): CandidateContent {
  return candidateContentSchema.parse(input) as CandidateContent;
}
export function parseCandidateDraft(input: unknown): CandidateDraft {
  return candidateDraftSchema.parse(input) as CandidateDraft;
}
export function parseDraftRosterCommand(input: unknown): DraftRosterCommand {
  return draftRosterCommandSchema.parse(input) as DraftRosterCommand;
}
export function parseDraftRosterResult(input: unknown): DraftRosterResult {
  return draftRosterResultSchema.parse(input) as DraftRosterResult;
}
