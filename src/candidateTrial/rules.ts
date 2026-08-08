import { CANDIDATE_BY_ID } from "../candidates/content";
import type { CandidateDraft, MechanicalRule } from "../candidates/types";
import type { CandidateRuleSource, RuleNotTriggeredReason } from "./types";

export interface ExecutableCandidateRule {
  readonly source: CandidateRuleSource;
  readonly rule: MechanicalRule;
}

export function candidateRules(candidate: CandidateDraft): readonly [
  ExecutableCandidateRule,
  ExecutableCandidateRule,
  ExecutableCandidateRule,
] {
  const signature = CANDIDATE_BY_ID.signatures[candidate.signatureId];
  const advantage = CANDIDATE_BY_ID.advantages[candidate.advantageId];
  const risk = CANDIDATE_BY_ID.complications[candidate.complicationId];
  if (!signature || !advantage || !risk) throw new Error("Candidate rule content is missing");
  return [
    { source:{sourceKind:"signature",sourceId:signature.id}, rule:signature.rule },
    { source:{sourceKind:"advantage",sourceId:advantage.id}, rule:advantage.rule },
    { source:{sourceKind:"risk",sourceId:risk.id}, rule:risk.rule },
  ];
}

export function inactiveRuleReason(
  rule: MechanicalRule,
  candidateActionWindows: number,
): RuleNotTriggeredReason {
  if (
    candidateActionWindows === 0 &&
    (rule.trigger.kind === "at_points" || rule.trigger.kind === "self_below_health")
  ) return "candidate_never_reached_action_window";
  if (
    rule.trigger.kind === "at_points" ||
    rule.trigger.kind === "self_below_health" ||
    rule.trigger.kind === "ally_below_health" ||
    rule.trigger.kind === "enemy_below_health"
  ) return "threshold_not_reached";
  return "source_event_not_seen";
}
