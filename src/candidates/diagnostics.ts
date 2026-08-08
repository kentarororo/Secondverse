import { candidateCoreBuildKey, draftCandidateRoster } from "./generate";
import { semanticDistance } from "./fingerprint";
import type {
  AdvantageId,
  ChassisId,
  ComplicationId,
  GrowthCurveId,
  SignatureId,
  TechniqueId,
  TemperamentId,
} from "./types";

export interface CandidateDiagnosticReport {
  readonly seedCount: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly candidateCount: number;
  readonly rejectedAttempts: number;
  readonly averageAttemptsPerCandidate: number;
  readonly maxAttemptsUsed: number;
  readonly uniqueFingerprintCount: number;
  readonly uniqueCoreBuildCount: number;
  readonly minimumRosterDistance: number;
  readonly rostersWithTwoChassisRate: number;
  readonly chassisCounts: Readonly<Record<ChassisId, number>>;
  readonly observedGrowthIds: readonly GrowthCurveId[];
  readonly observedSignatureIds: readonly SignatureId[];
  readonly observedAdvantageIds: readonly AdvantageId[];
  readonly observedComplicationIds: readonly ComplicationId[];
  readonly observedTemperamentIds: readonly TemperamentId[];
  readonly observedTechniqueIds: readonly TechniqueId[];
  readonly maximumSignatureShare: number;
  readonly maximumFingerprintShare: number;
}

export const CANDIDATE_DIAGNOSTIC_THRESHOLDS = Object.freeze({
  minimumUniqueFingerprints: 220,
  minimumUniqueCoreBuilds: 30,
  minimumRosterDistance: 3,
  minimumTwoChassisRate: 0.75,
  minimumChassisShare: 0.2,
  maximumChassisShare: 0.45,
  minimumObservedSignatures: 10,
  minimumObservedAdvantages: 10,
  minimumObservedComplications: 10,
  minimumObservedTechniques: 16,
  maximumSignatureShare: 0.15,
  maximumFingerprintShare: 0.02,
  maximumAverageAttempts: 2,
  maximumAttempts: 24,
});

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function maximumShare(map: Map<string, number>, total: number): number {
  return total === 0 ? 0 : Math.max(0, ...map.values()) / total;
}

export function diagnoseCandidateDrafts(input: {
  readonly seedPrefix: string;
  readonly seedCount: number;
}): CandidateDiagnosticReport {
  const fingerprints = new Map<string, number>();
  const coreBuilds = new Set<string>();
  const signatures = new Map<string, number>();
  const growths = new Set<GrowthCurveId>();
  const advantages = new Set<AdvantageId>();
  const complications = new Set<ComplicationId>();
  const temperaments = new Set<TemperamentId>();
  const techniques = new Set<TechniqueId>();
  const chassisCounts: Record<ChassisId, number> = { guard_frame: 0, fast_frame: 0, support_frame: 0 };
  let successCount = 0;
  let failureCount = 0;
  let candidateCount = 0;
  let totalAttempts = 0;
  let maxAttemptsUsed = 0;
  let rejectedAttempts = 0;
  let rostersWithTwoChassis = 0;
  let minimumRosterDistance = 7;

  for (let index = 0; index < input.seedCount; index += 1) {
    const result = draftCandidateRoster({
      type: "draft_candidate_roster", version: 1, poolVersion: 1,
      seed: `${input.seedPrefix}-${String(index).padStart(3, "0")}`, count: 3,
    });
    if (result.status !== "ok") {
      failureCount += 1;
      continue;
    }
    successCount += 1;
    rejectedAttempts += result.rejectedAttempts;
    totalAttempts += result.attemptsBySlot.reduce((total, attempts) => total + attempts, 0);
    maxAttemptsUsed = Math.max(maxAttemptsUsed, ...result.attemptsBySlot);
    if (new Set(result.candidates.map((candidate) => candidate.chassisId)).size >= 2) rostersWithTwoChassis += 1;
    for (let left = 0; left < result.candidates.length; left += 1) {
      for (let right = left + 1; right < result.candidates.length; right += 1) {
        minimumRosterDistance = Math.min(minimumRosterDistance, semanticDistance(result.candidates[left]!, result.candidates[right]!));
      }
    }
    for (const candidate of result.candidates) {
      candidateCount += 1;
      chassisCounts[candidate.chassisId] += 1;
      increment(fingerprints, candidate.semanticFingerprint.key);
      coreBuilds.add(candidateCoreBuildKey(candidate));
      increment(signatures, candidate.signatureId);
      growths.add(candidate.growthCurveId);
      advantages.add(candidate.advantageId);
      complications.add(candidate.complicationId);
      temperaments.add(candidate.temperamentId);
      candidate.techniqueIds.forEach((id) => techniques.add(id));
    }
  }

  return {
    seedCount: input.seedCount,
    successCount,
    failureCount,
    candidateCount,
    rejectedAttempts,
    averageAttemptsPerCandidate: candidateCount === 0 ? 0 : totalAttempts / candidateCount,
    maxAttemptsUsed,
    uniqueFingerprintCount: fingerprints.size,
    uniqueCoreBuildCount: coreBuilds.size,
    minimumRosterDistance,
    rostersWithTwoChassisRate: successCount === 0 ? 0 : rostersWithTwoChassis / successCount,
    chassisCounts,
    observedGrowthIds: [...growths].sort(),
    observedSignatureIds: [...signatures.keys()].sort() as SignatureId[],
    observedAdvantageIds: [...advantages].sort(),
    observedComplicationIds: [...complications].sort(),
    observedTemperamentIds: [...temperaments].sort(),
    observedTechniqueIds: [...techniques].sort(),
    maximumSignatureShare: maximumShare(signatures, candidateCount),
    maximumFingerprintShare: maximumShare(fingerprints, candidateCount),
  };
}

export function candidateDiagnosticFailures(report: CandidateDiagnosticReport): readonly string[] {
  const threshold = CANDIDATE_DIAGNOSTIC_THRESHOLDS;
  const failures: string[] = [];
  if (report.failureCount !== 0 || report.successCount !== report.seedCount) failures.push("Every diagnostic seed must generate a roster");
  if (report.uniqueFingerprintCount < threshold.minimumUniqueFingerprints) failures.push("Mechanical fingerprint coverage is too low");
  if (report.uniqueCoreBuildCount < threshold.minimumUniqueCoreBuilds) failures.push("Core build coverage is too low");
  if (report.minimumRosterDistance < threshold.minimumRosterDistance) failures.push("A roster contains near-duplicate candidates");
  if (report.rostersWithTwoChassisRate < threshold.minimumTwoChassisRate) failures.push("Too few rosters contain two chassis");
  for (const [id, count] of Object.entries(report.chassisCounts)) {
    const share = report.candidateCount === 0 ? 0 : count / report.candidateCount;
    if (share < threshold.minimumChassisShare || share > threshold.maximumChassisShare) failures.push(`${id} chassis share is outside bounds`);
  }
  if (report.observedGrowthIds.length < 6) failures.push("Not every growth curve appeared");
  if (report.observedTemperamentIds.length < 6) failures.push("Not every temperament appeared");
  if (report.observedSignatureIds.length < threshold.minimumObservedSignatures) failures.push("Signature coverage is too low");
  if (report.observedAdvantageIds.length < threshold.minimumObservedAdvantages) failures.push("Advantage coverage is too low");
  if (report.observedComplicationIds.length < threshold.minimumObservedComplications) failures.push("Complication coverage is too low");
  if (report.observedTechniqueIds.length < threshold.minimumObservedTechniques) failures.push("Technique coverage is too low");
  if (report.maximumSignatureShare > threshold.maximumSignatureShare) failures.push("One signature appears too often");
  if (report.maximumFingerprintShare > threshold.maximumFingerprintShare) failures.push("One fingerprint appears too often");
  if (report.averageAttemptsPerCandidate >= threshold.maximumAverageAttempts) failures.push("Duplicate rejection requires too many attempts");
  if (report.maxAttemptsUsed > threshold.maximumAttempts) failures.push("Generation exceeded its attempt cap");
  return failures;
}
