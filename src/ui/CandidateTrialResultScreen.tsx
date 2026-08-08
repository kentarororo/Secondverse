import { useEffect, useRef } from "react";
import { CANDIDATE_BY_ID } from "../candidates";
import { useStudioStore } from "../state/studioStore";
import { CandidateTrialStage } from "./CandidateTrialStage";
import {
  activationSummaryText,
  candidateRuleName,
  candidateRuleOutcomeText,
  candidateTrialEventFact,
} from "./candidateTrialPresentation";

export function CandidateTrialResultScreen() {
  const result = useStudioStore((state) => state.candidateTrialResult);
  const returnToCandidateLab = useStudioStore((state) => state.returnToCandidateLab);
  const newCandidateSet = useStudioStore((state) => state.newCandidateSet);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (!result) {
    return (
      <section className="screen recovery-screen">
        <h1>Candidate trial result could not be loaded</h1>
        <p>Return to the candidate list and select a fighter again.</p>
        <button className="button button-primary" type="button" onClick={returnToCandidateLab}>
          Return to candidates
        </button>
      </section>
    );
  }

  const resultLabel = result.winner === "candidate_team"
    ? "Win"
    : result.winner === "training_enemies"
      ? "Loss"
      : "Draw";
  const techniqueCounts = new Map<string, number>();
  for (const event of result.events) {
    if (event.kind !== "technique_used") continue;
    techniqueCounts.set(event.techniqueId, (techniqueCounts.get(event.techniqueId) ?? 0) + 1);
  }

  return (
    <section className="screen candidate-trial-result-screen" aria-labelledby="candidate-trial-result-heading">
      <header className="result-header candidate-trial-result-header">
        <div>
          <span className="eyebrow">Candidate battle trial</span>
          <h1 id="candidate-trial-result-heading" ref={headingRef} tabIndex={-1}>
            Trial result: {resultLabel}
          </h1>
          <p>{result.candidate.identity.displayName}&apos;s team finished after {result.actionCount} actions across {result.rounds} rounds.</p>
        </div>
      </header>

      <CandidateTrialStage result={result} units={result.finalUnits} />

      <section className="candidate-trial-kit-report" aria-labelledby="candidate-kit-report-heading">
        <div className="candidate-trial-report-heading">
          <span className="eyebrow">Exact combat proof</span>
          <h2 id="candidate-kit-report-heading">What {result.candidate.identity.displayName}&apos;s kit did</h2>
        </div>
        <div className="candidate-trial-rule-results">
          {result.ruleActivations.map((activation) => {
            const definition = activation.sourceKind === "signature"
              ? CANDIDATE_BY_ID.signatures[activation.sourceId]
              : activation.sourceKind === "advantage"
                ? CANDIDATE_BY_ID.advantages[activation.sourceId]
                : CANDIDATE_BY_ID.complications[activation.sourceId];
            return (
              <article
                className={`candidate-trial-rule-result is-${activation.sourceKind}${activation.activationCount > 0 ? " did-trigger" : " did-not-trigger"}`}
                key={`${activation.sourceKind}:${activation.sourceId}`}
              >
                <span className="candidate-section-label">
                  {activation.sourceKind === "signature" ? "Signature" : activation.sourceKind === "advantage" ? "Advantage" : "Risk"}
                </span>
                <h3>{candidateRuleName(activation)}</h3>
                <p>{definition?.rulesText}</p>
                <strong>{activationSummaryText(activation)}</strong>
                {candidateRuleOutcomeText(result, activation) ? (
                  <small className="candidate-rule-outcome">
                    Combat outcome: {candidateRuleOutcomeText(result, activation)}
                  </small>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="candidate-trial-technique-report">
          <h3>Techniques used</h3>
          <ul>
            {result.candidate.techniqueIds.map((techniqueId) => (
              <li key={techniqueId}>
                <strong>{CANDIDATE_BY_ID.techniques[techniqueId]?.name}</strong>
                <span>{techniqueCounts.get(techniqueId) ?? 0} {(techniqueCounts.get(techniqueId) ?? 0) === 1 ? "use" : "uses"}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <details className="candidate-trial-profile-details">
        <summary>How starting stats became battle values</summary>
        <dl>
          <div><dt>Max HP</dt><dd>{result.candidate.stats.vitality} Vitality × 8 = {result.profile.maxHealth}</dd></div>
          <div><dt>Power</dt><dd>{result.profile.power}</dd></div>
          <div><dt>Defence</dt><dd>floor({result.candidate.stats.guard} Guard ÷ 2) = {result.profile.defence}</dd></div>
          <div><dt>Guard cap</dt><dd>{result.candidate.stats.guard} Guard × 2 = {result.profile.guardCap}</dd></div>
          <div><dt>Speed</dt><dd>{result.profile.speed}</dd></div>
          <div><dt>Starting Points</dt><dd>{result.profile.startingTechniquePoints} from {result.candidate.stats.focus} Focus</dd></div>
        </dl>
        <p>Growth is not applied in this trial.</p>
      </details>

      <details className="candidate-trial-details">
        <summary>Battle details</summary>
        <ol>
          {result.events.map((event) => (
            <li key={event.eventId}>
              <span>{event.round === 0 ? "Setup" : `Round ${event.round}`}</span>
              <p>{candidateTrialEventFact(result, event)}</p>
            </li>
          ))}
        </ol>
      </details>

      <footer className="candidate-trial-result-actions">
        <button className="button button-primary" type="button" onClick={returnToCandidateLab}>
          Keep {result.candidate.identity.displayName} selected
        </button>
        <button className="button button-secondary" type="button" onClick={returnToCandidateLab}>
          Try another candidate
        </button>
        <button className="button button-quiet" type="button" onClick={newCandidateSet}>
          Show new candidates
        </button>
      </footer>
    </section>
  );
}
