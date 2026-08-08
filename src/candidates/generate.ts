import { createRngStream, type DeterministicRng } from "../sim/rng";
import { CANDIDATE_COMPATIBILITY, validateCandidateCompatibility, type CompatibleChassisSignatureKey } from "./compatibility";
import { CANDIDATE_BY_ID, CANDIDATE_CONTENT } from "./content";
import { createSemanticFingerprint, semanticDistance, stableCandidateHash } from "./fingerprint";
import {
  parseCandidateDraft,
  parseDraftRosterCommand,
  parseDraftRosterResult,
} from "./schema";
import type {
  CandidateDraft,
  ChassisId,
  DraftRosterCommand,
  DraftRosterResult,
  SignatureId,
} from "./types";

export const MAX_CANDIDATE_ATTEMPTS = 24;
export const MIN_ROSTER_SEMANTIC_DISTANCE = 3;

function choose<T extends string>(rng: DeterministicRng, values: readonly T[]): T {
  const sorted = [...values].sort((left, right) => left.localeCompare(right));
  const selected = sorted[rng.nextIntInclusive(0, sorted.length - 1)];
  if (!selected) throw new Error("Cannot choose from an empty candidate content list");
  return selected;
}

function requireDefinition<T>(value: T | undefined, id: string): T {
  if (!value) throw new Error(`Missing candidate definition ${id}`);
  return value;
}

function buildCandidate(
  command: DraftRosterCommand,
  rosterId: string,
  slot: 0 | 1 | 2,
  attempt: number,
  usedIdentityIds: ReadonlySet<string>,
): CandidateDraft {
  const attemptSeed = `${command.seed}:candidate:${slot}:attempt:${attempt}`;
  const structureRng = createRngStream(attemptSeed, "candidate_structure");
  const identityRng = createRngStream(attemptSeed, "candidate_identity");
  const visualRng = createRngStream(attemptSeed, "candidate_visual");

  const chassisId = choose(structureRng, CANDIDATE_CONTENT.chassis.map((value) => value.id));
  const growthCurveId = choose(structureRng, CANDIDATE_COMPATIBILITY.growthByChassis[chassisId]);
  const signatureId = choose(structureRng, CANDIDATE_COMPATIBILITY.signaturesByChassis[chassisId]);
  const advantageId = choose(structureRng, CANDIDATE_COMPATIBILITY.advantagesBySignature[signatureId]);
  const complicationId = choose(structureRng, CANDIDATE_COMPATIBILITY.complicationsByAdvantage[advantageId]);
  const temperamentId = choose(structureRng, CANDIDATE_COMPATIBILITY.temperamentsBySignature[signatureId]);
  const compatibilityKey = `${chassisId}:${signatureId}` as CompatibleChassisSignatureKey;
  const loadoutIds = CANDIDATE_COMPATIBILITY.loadoutsByChassisSignature[compatibilityKey];
  if (!loadoutIds) throw new Error(`Missing loadouts for ${compatibilityKey}`);
  const techniqueLoadoutId = choose(structureRng, loadoutIds);
  const potentialTellId = choose(structureRng, CANDIDATE_COMPATIBILITY.tellsByGrowth[growthCurveId]);
  const availableIdentityIds = CANDIDATE_CONTENT.identities
    .map((value) => value.id)
    .filter((identityId) => !usedIdentityIds.has(identityId));
  const identityId = choose(identityRng, availableIdentityIds);
  const visualProfileId = choose(visualRng, CANDIDATE_COMPATIBILITY.visualsByChassis[chassisId]);

  const chassis = requireDefinition(CANDIDATE_BY_ID.chassis[chassisId], chassisId);
  const growth = requireDefinition(CANDIDATE_BY_ID.growthCurves[growthCurveId], growthCurveId);
  const signature = requireDefinition(CANDIDATE_BY_ID.signatures[signatureId], signatureId);
  const advantage = requireDefinition(CANDIDATE_BY_ID.advantages[advantageId], advantageId);
  const complication = requireDefinition(CANDIDATE_BY_ID.complications[complicationId], complicationId);
  const temperament = requireDefinition(CANDIDATE_BY_ID.temperaments[temperamentId], temperamentId);
  const loadout = requireDefinition(CANDIDATE_BY_ID.loadouts[techniqueLoadoutId], techniqueLoadoutId);
  const firstTechnique = requireDefinition(CANDIDATE_BY_ID.techniques[loadout.techniqueIds[0]], loadout.techniqueIds[0]);
  const secondTechnique = requireDefinition(CANDIDATE_BY_ID.techniques[loadout.techniqueIds[1]], loadout.techniqueIds[1]);
  const identity = requireDefinition(CANDIDATE_BY_ID.identities[identityId], identityId);
  const semanticFingerprint = createSemanticFingerprint({
    chassis, growth, signature, advantage, complication, temperament,
    techniques: [firstTechnique, secondTechnique],
  });

  return parseCandidateDraft({
    version: 1,
    status: "lab_only_not_fieldable",
    candidateId: `candidate-${stableCandidateHash(rosterId)}-${slot}-${semanticFingerprint.hash}`,
    identity: { identityId, displayName: identity.displayName },
    visualProfileId,
    chassisId,
    stats: chassis.baseStats,
    growthCurveId,
    signatureId,
    advantageId,
    complicationId,
    temperamentId,
    potentialTellId,
    techniqueIds: loadout.techniqueIds,
    techniqueLoadoutId,
    semanticFingerprint,
  });
}

function isRosterDistinct(candidate: CandidateDraft, accepted: readonly CandidateDraft[]): boolean {
  return accepted.every(
    (other) =>
      other.semanticFingerprint.key !== candidate.semanticFingerprint.key &&
      semanticDistance(other, candidate) >= MIN_ROSTER_SEMANTIC_DISTANCE,
  );
}

export function draftCandidateRoster(input: DraftRosterCommand): DraftRosterResult {
  const command = parseDraftRosterCommand(input);
  const rosterId = `roster-${stableCandidateHash(`v1|pool1|${command.seed}`)}`;
  const accepted: CandidateDraft[] = [];
  const attemptsBySlot: number[] = [];
  let rejectedAttempts = 0;

  for (const slot of [0, 1, 2] as const) {
    let acceptedCandidate: CandidateDraft | null = null;
    for (let attempt = 1; attempt <= MAX_CANDIDATE_ATTEMPTS; attempt += 1) {
      const candidate = buildCandidate(
        command,
        rosterId,
        slot,
        attempt,
        new Set(accepted.map((acceptedCandidate) => acceptedCandidate.identity.identityId)),
      );
      const issues = validateCandidateCompatibility(candidate);
      if (issues.length === 0 && isRosterDistinct(candidate, accepted)) {
        acceptedCandidate = candidate;
        attemptsBySlot.push(attempt);
        break;
      }
      rejectedAttempts += 1;
    }
    if (!acceptedCandidate) {
      return parseDraftRosterResult({
        status: "generation_failed",
        version: 1,
        command,
        rosterId,
        failedSlot: slot,
        attempts: MAX_CANDIDATE_ATTEMPTS,
        reason: "attempt_limit",
      });
    }
    accepted.push(acceptedCandidate);
  }

  const candidates = accepted as [CandidateDraft, CandidateDraft, CandidateDraft];
  const attempts = attemptsBySlot as [number, number, number];
  return parseDraftRosterResult({
    status: "ok",
    version: 1,
    command,
    rosterId,
    candidates,
    attemptsBySlot: attempts,
    rejectedAttempts,
  });
}

export function candidateCoreBuildKey(candidate: CandidateDraft): string {
  return `${candidate.chassisId}|${candidate.signatureId}|${candidate.techniqueLoadoutId}`;
}

export function compatibleLoadouts(chassisId: ChassisId, signatureId: SignatureId): readonly string[] {
  const key = `${chassisId}:${signatureId}` as CompatibleChassisSignatureKey;
  return CANDIDATE_COMPATIBILITY.loadoutsByChassisSignature[key] ?? [];
}
