import type { CSSProperties } from "react";
import { CANDIDATE_BY_ID } from "../candidates";
import type {
  CandidateTrialResult,
  CandidateTrialUnitId,
  CandidateTrialUnitSnapshot,
} from "../candidateTrial";
import type { CandidateTrialDelta } from "./candidateTrialPresentation";

const SLOT_ORDER = { front: 0, middle: 1, rear: 2 } as const;

function UnitFigure({
  result,
  unit,
}: {
  readonly result: CandidateTrialResult;
  readonly unit: CandidateTrialUnitSnapshot;
}) {
  if (unit.id === result.candidate.candidateId) {
    const visual = CANDIDATE_BY_ID.visualProfiles[result.candidate.visualProfileId];
    return (
      <div
        className={`candidate-trial-figure candidate-portrait silhouette-${visual?.silhouette ?? "medium"}`}
        data-visual-profile={result.candidate.visualProfileId}
        aria-hidden="true"
      >
        <span />
      </div>
    );
  }
  const role = unit.id === "training_guard" || unit.id === "training_bulwark"
    ? "guard"
    : unit.id === "training_striker" || unit.id === "training_raider"
      ? "striker"
      : "harrier";
  return (
    <div className={`candidate-trial-figure training-figure role-${role}`} aria-hidden="true">
      <span className="silhouette-head" />
      <span className="silhouette-body" />
      <span className="silhouette-detail" />
    </div>
  );
}

function TrialUnit({
  result,
  unit,
  active,
  targeted,
  deltas,
}: {
  readonly result: CandidateTrialResult;
  readonly unit: CandidateTrialUnitSnapshot;
  readonly active: boolean;
  readonly targeted: boolean;
  readonly deltas: readonly CandidateTrialDelta[];
}) {
  const hpPercent = Math.max(0, Math.min(100, (unit.health / unit.maxHealth) * 100));
  const isCandidate = unit.id === result.candidate.candidateId;
  return (
    <article
      className={`candidate-trial-unit${isCandidate ? " is-candidate" : ""}${active ? " is-acting" : ""}${targeted ? " is-targeted" : ""}${unit.defeated ? " is-defeated" : ""}`}
      data-trial-unit={unit.id}
      aria-label={`${unit.name}, ${unit.slot}, ${unit.health} of ${unit.maxHealth} HP, ${unit.guard} Guard${isCandidate ? `, ${unit.techniquePoints} Points, ${unit.strain} Strain` : ""}${unit.broken ? ", Broken" : ""}${unit.defeated ? ", Defeated" : ""}`}
    >
      <div className="candidate-trial-unit-visual">
        <UnitFigure result={result} unit={unit} />
        <div className="candidate-trial-floats" aria-hidden="true">
          {deltas.slice(0, 3).map((delta, index) => (
            <span
              className={`trial-float${delta.amount < 0 ? " is-loss" : " is-gain"}`}
              style={{ "--float-index": index } as CSSProperties}
              key={`${delta.kind}-${index}`}
            >
              {delta.text}
            </span>
          ))}
        </div>
      </div>
      <div className="candidate-trial-unit-copy">
        <div className="trial-unit-heading">
          <strong>{unit.name}</strong>
          <span>{unit.slot}</span>
        </div>
        <div className="trial-hp-track" aria-hidden="true">
          <span style={{ width: `${hpPercent}%` }} />
        </div>
        <span className="trial-hp-copy">HP {unit.health}/{unit.maxHealth}</span>
        <div className="trial-resource-row">
          <span>Guard {unit.guard}</span>
          {isCandidate ? <span>Points {unit.techniquePoints}/3</span> : null}
          {isCandidate ? <span>Strain {unit.strain}/3</span> : null}
        </div>
        <div className="trial-status-row">
          {unit.broken ? <span className="trial-status is-risk">Broken</span> : null}
          {unit.defeated ? <span className="trial-status">Defeated</span> : null}
        </div>
      </div>
    </article>
  );
}

export function CandidateTrialStage({
  result,
  units,
  actorId = null,
  targetIds = [],
  deltas = [],
}: {
  readonly result: CandidateTrialResult;
  readonly units: readonly CandidateTrialUnitSnapshot[];
  readonly actorId?: CandidateTrialUnitId | null;
  readonly targetIds?: readonly CandidateTrialUnitId[];
  readonly deltas?: readonly CandidateTrialDelta[];
}) {
  const side = (sideId: CandidateTrialUnitSnapshot["side"]) =>
    units
      .filter((unit) => unit.side === sideId)
      .sort((left, right) => SLOT_ORDER[left.slot] - SLOT_ORDER[right.slot]);
  return (
    <section className="candidate-trial-stage" aria-label="Candidate trial battlefield">
      <div className="candidate-trial-team team-candidate" aria-label="Candidate team">
        <span className="eyebrow">Candidate team</span>
        <div className="candidate-trial-line">
          {side("candidate_team").map((unit) => (
            <TrialUnit
              result={result}
              unit={unit}
              active={unit.id === actorId}
              targeted={targetIds.includes(unit.id)}
              deltas={deltas.filter((delta) => delta.unitId === unit.id)}
              key={unit.id}
            />
          ))}
        </div>
      </div>
      <div className="candidate-trial-versus" aria-hidden="true">VS</div>
      <div className="candidate-trial-team team-enemy" aria-label="Training opponents">
        <span className="eyebrow">Training opponents</span>
        <div className="candidate-trial-line">
          {side("training_enemies").map((unit) => (
            <TrialUnit
              result={result}
              unit={unit}
              active={unit.id === actorId}
              targeted={targetIds.includes(unit.id)}
              deltas={deltas.filter((delta) => delta.unitId === unit.id)}
              key={unit.id}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
