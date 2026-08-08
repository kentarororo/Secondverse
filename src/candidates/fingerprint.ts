import type {
  AdvantageDefinition,
  CandidateDraft,
  ChassisDefinition,
  ComplicationDefinition,
  GrowthCurveDefinition,
  MechanicalRule,
  SemanticDimensions,
  SemanticFingerprint,
  SignatureDefinition,
  TechniqueDefinition,
  TemperamentDefinition,
} from "./types";

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function statsKey(stats: {readonly vitality:number;readonly power:number;readonly guard:number;readonly speed:number;readonly focus:number}): string {
  return `${stats.vitality},${stats.power},${stats.guard},${stats.speed},${stats.focus}`;
}

export function mechanicalRuleKey(rule: MechanicalRule): string {
  const triggerValue = "ratio" in rule.trigger
    ? rule.trigger.ratio
    : "points" in rule.trigger
      ? rule.trigger.points
      : "-";
  const effectValue = "amount" in rule.effect
    ? rule.effect.amount
    : "target" in rule.effect
      ? rule.effect.target
      : "-";
  return `${rule.trigger.kind}:${triggerValue}>${rule.target}>${rule.effect.kind}:${effectValue}:${rule.oncePerRound ? "once" : "open"}`;
}

export interface FingerprintInput {
  readonly chassis: ChassisDefinition;
  readonly growth: GrowthCurveDefinition;
  readonly signature: SignatureDefinition;
  readonly advantage: AdvantageDefinition;
  readonly complication: ComplicationDefinition;
  readonly temperament: TemperamentDefinition;
  readonly techniques: readonly [TechniqueDefinition, TechniqueDefinition];
}

export function createSemanticFingerprint(input: FingerprintInput): SemanticFingerprint {
  const techniqueKey = input.techniques
    .map((technique) => `${technique.role}:${technique.cost}:${technique.target}:${technique.effects.map((effect) => `${effect.kind}:${"amount" in effect ? effect.amount : "target" in effect ? effect.target : "-"}`).join("+")}`)
    .join("/");
  const dimensions: SemanticDimensions = [
    `${input.chassis.id}:${statsKey(input.chassis.baseStats)}`,
    `${input.growth.pattern}:${statsKey(input.growth.earlyDelta)}:${statsKey(input.growth.lateDelta)}`,
    mechanicalRuleKey(input.signature.rule),
    mechanicalRuleKey(input.advantage.rule),
    mechanicalRuleKey(input.complication.rule),
    `${input.temperament.policy.riskThreshold}:${input.temperament.policy.spendAtPoints}:${input.temperament.policy.rescueBias}:${input.temperament.policy.focusFireBias}`,
    techniqueKey,
  ];
  const key = `v1|${dimensions.join("|")}`;
  return { version: 1, key, hash: stableHash(key), dimensions };
}

export function semanticDistance(
  left: SemanticFingerprint | CandidateDraft,
  right: SemanticFingerprint | CandidateDraft,
): number {
  const leftFingerprint = "semanticFingerprint" in left ? left.semanticFingerprint : left;
  const rightFingerprint = "semanticFingerprint" in right ? right.semanticFingerprint : right;
  return leftFingerprint.dimensions.reduce(
    (distance, dimension, index) => distance + (dimension === rightFingerprint.dimensions[index] ? 0 : 1),
    0,
  );
}

export function stableCandidateHash(value: string): string {
  return stableHash(value);
}
