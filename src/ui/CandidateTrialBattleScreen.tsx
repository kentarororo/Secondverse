import { useEffect, useMemo } from "react";
import { CANDIDATE_BY_ID } from "../candidates";
import type { CandidateRuleSource } from "../candidateTrial";
import { useCombatLabRepository } from "../state/repositoryContext";
import { useStudioStore } from "../state/studioStore";
import { CandidateTrialStage } from "./CandidateTrialStage";
import {
  candidateRuleName,
  candidateTrialEventFact,
  candidateTrialMomentDeltas,
  candidateTrialMomentSummary,
  candidateTrialUnitsAtEvent,
  selectCandidateTrialMoments,
} from "./candidateTrialPresentation";

function sourceKey(source: CandidateRuleSource): string {
  return `${source.sourceKind}:${source.sourceId}`;
}

export function CandidateTrialBattleScreen() {
  const repository = useCombatLabRepository();
  const result = useStudioStore((state) => state.candidateTrialResult);
  const playbackCursor = useStudioStore((state) => state.playbackCursor);
  const playing = useStudioStore((state) => state.playing);
  const speed = useStudioStore((state) => state.speed);
  const reducedMotion = useStudioStore((state) => state.reducedMotion);
  const setPlaybackCursor = useStudioStore((state) => state.setPlaybackCursor);
  const setPlaying = useStudioStore((state) => state.setPlaying);
  const setSpeed = useStudioStore((state) => state.setSpeed);
  const setReducedMotion = useStudioStore((state) => state.setReducedMotion);
  const showCandidateTrialResult = useStudioStore((state) => state.showCandidateTrialResult);
  const returnToCandidateLab = useStudioStore((state) => state.returnToCandidateLab);
  const moments = useMemo(() => (result ? selectCandidateTrialMoments(result) : []), [result]);
  const finalCursor = Math.max(0, (result?.events.length ?? 1) - 1);
  const cursor = Math.min(playbackCursor, finalCursor);
  const momentIndex = Math.max(
    0,
    moments.findIndex((moment) => cursor <= moment.endEventIndex),
  );
  const moment = moments[momentIndex];

  useEffect(() => {
    if (!result || !moment || !playing) return;
    const baseDuration = moment.label === "Signature" || moment.label === "Advantage" || moment.label === "Risk"
      ? 1_350
      : moment.label === "Turning point"
        ? 1_500
        : 1_050;
    const delay = reducedMotion ? 260 : baseDuration / speed;
    const timer = window.setTimeout(() => {
      const next = moments[momentIndex + 1];
      if (!next) {
        setPlaybackCursor(result.events.length - 1);
        showCandidateTrialResult();
        return;
      }
      setPlaybackCursor(next.endEventIndex);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    moment,
    momentIndex,
    moments,
    playing,
    reducedMotion,
    result,
    setPlaybackCursor,
    showCandidateTrialResult,
    speed,
  ]);

  if (!result || !moment) {
    return (
      <section className="screen recovery-screen">
        <h1>Candidate trial could not be loaded</h1>
        <p>Return to the candidate list and select a fighter again.</p>
        <button className="button button-primary" type="button" onClick={returnToCandidateLab}>
          Return to candidates
        </button>
      </section>
    );
  }

  const focusEvent = result.events.find((event) => event.eventId === moment.focusEventId)!;
  const units = candidateTrialUnitsAtEvent(result, moment.endEventIndex);
  const deltas = candidateTrialMomentDeltas(result, moment);
  const summary = candidateTrialMomentSummary(result, moment);
  const triggeredThroughMoment = new Map<string, number>();
  for (const event of result.events.slice(0, moment.endEventIndex + 1)) {
    if (event.kind !== "candidate_rule_triggered") continue;
    const key = sourceKey(event.source);
    triggeredThroughMoment.set(key, (triggeredThroughMoment.get(key) ?? 0) + 1);
  }

  const skipToResult = () => {
    setPlaying(false);
    setPlaybackCursor(result.events.length - 1);
    showCandidateTrialResult();
  };

  return (
    <section className={`screen candidate-trial-battle-screen${reducedMotion ? " reduce-motion" : ""}`} aria-labelledby="candidate-trial-heading">
      <header className="battle-header candidate-trial-header">
        <div className="battle-title">
          <span className="eyebrow">
            {moment.round === 0 ? "Setup" : `Round ${moment.round} · Action ${moment.actionNumber}`}
          </span>
          <h1 id="candidate-trial-heading">{result.candidate.identity.displayName}&apos;s battle trial</h1>
        </div>
        <div className="battle-controls" role="group" aria-label="Trial playback controls">
          <button className="button button-control" type="button" onClick={() => setPlaying(!playing)}>
            {playing ? "Pause trial" : "Resume trial"}
          </button>
          <div className="speed-control" role="group" aria-label="Trial speed">
            {([1, 1.5, 2] as const).map((value) => (
              <button
                className={`button button-control${speed === value ? " is-active" : ""}`}
                type="button"
                aria-pressed={speed === value}
                onClick={() => setSpeed(value, repository ?? undefined)}
                key={value}
              >
                {value}x
              </button>
            ))}
          </div>
          <button className="button button-control" type="button" onClick={skipToResult}>
            Skip to trial result
          </button>
        </div>
      </header>

      <div className="candidate-trial-rule-banner">
        <strong>How timing works</strong>
        <span>A round ends after every living fighter has one action. An action is one fighter acting.</span>
      </div>

      <div className="candidate-trial-stage-wrap">
        <CandidateTrialStage
          result={result}
          units={units}
          actorId={moment.actorId}
          targetIds={moment.targetIds}
          deltas={deltas}
        />
        {focusEvent.kind === "technique_used" ? (
          <div className="candidate-trial-ribbon is-technique">
            <span>Technique · {focusEvent.cost} Points</span>
            <strong>{CANDIDATE_BY_ID.techniques[focusEvent.techniqueId]?.name}</strong>
          </div>
        ) : null}
        {focusEvent.kind === "candidate_rule_triggered" ? (
          <div className={`candidate-trial-ribbon is-${focusEvent.source.sourceKind}`}>
            <span>{focusEvent.source.sourceKind === "risk" ? "Risk" : focusEvent.source.sourceKind}</span>
            <strong>{candidateRuleName(focusEvent.source)}</strong>
          </div>
        ) : null}
      </div>

      <div className="candidate-trial-reading-grid">
        <section className="current-moment-card candidate-trial-moment" aria-label="Current trial moment">
          <div className="moment-heading-row">
            <div>
              <span className="eyebrow">{moment.label}</span>
              <strong>Key moment {momentIndex + 1} of {moments.length}</strong>
            </div>
          </div>
          <p className="moment-chain" aria-label={summary.text}>
            <strong>{summary.cause}</strong>
            <span aria-hidden="true">→</span>
            <span>{summary.target}</span>
            <span aria-hidden="true">→</span>
            <strong>{summary.outcome}</strong>
          </p>
        </section>

        <section className="candidate-kit-tracker" aria-labelledby="candidate-kit-tracker-heading">
          <span className="eyebrow">Selected kit</span>
          <h2 id="candidate-kit-tracker-heading">Rule tracker</h2>
          <ul>
            {result.ruleActivations.map((activation) => {
              const count = triggeredThroughMoment.get(sourceKey(activation)) ?? 0;
              return (
                <li className={count > 0 ? "has-triggered" : ""} key={sourceKey(activation)}>
                  <span>{activation.sourceKind === "signature" ? "Signature" : activation.sourceKind === "advantage" ? "Advantage" : "Risk"}</span>
                  <strong>{candidateRuleName(activation)}</strong>
                  <small>{count > 0 ? `Triggered ${count} ${count === 1 ? "time" : "times"}` : "Not triggered yet"}</small>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <details className="candidate-trial-details">
        <summary>Battle details</summary>
        <ol>
          {result.events.map((event) => (
            <li className={event.eventId === focusEvent.eventId ? "is-current" : ""} key={event.eventId}>
              <span>{event.round === 0 ? "Setup" : `Round ${event.round}`}</span>
              <p>{candidateTrialEventFact(result, event)}</p>
            </li>
          ))}
        </ol>
      </details>

      <label className="check-control candidate-trial-motion">
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(event) => setReducedMotion(event.currentTarget.checked, repository ?? undefined)}
        />
        Reduced motion
      </label>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{summary.text}</p>
    </section>
  );
}
