import { z } from "zod";
import { draftRosterCommandSchema } from "../candidates/schema";
import { CANDIDATE_TRIAL_SCENARIO_IDS, type StartCandidateTrialCommand } from "./types";

export const startCandidateTrialCommandSchema = z.object({
  type: z.literal("start_candidate_trial"),
  version: z.literal(1),
  scenarioId: z.enum(CANDIDATE_TRIAL_SCENARIO_IDS),
  battleSeed: z.string().min(1).max(128),
  draftCommand: draftRosterCommandSchema,
  candidateId: z.string().min(1).max(128),
}).strict();

export function parseStartCandidateTrialCommand(input: unknown): StartCandidateTrialCommand {
  return startCandidateTrialCommandSchema.parse(input) as StartCandidateTrialCommand;
}
