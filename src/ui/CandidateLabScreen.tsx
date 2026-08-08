import { CANDIDATE_REGISTRY, type CandidateDraft } from "../candidates";
import { useStudioStore } from "../state/studioStore";

const STAT_LABELS = {
  vitality: "Vitality",
  power: "Power",
  guard: "Guard",
  speed: "Speed",
  focus: "Focus",
} as const;

type StatId = keyof typeof STAT_LABELS;
const STAT_IDS = Object.keys(STAT_LABELS) as StatId[];

function findById<T extends { readonly id: string }>(items: readonly T[], id: string): T {
  const found = items.find((item) => item.id === id);
  if (!found) throw new Error(`Missing candidate content ${id}`);
  return found;
}

function signed(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

function CandidateCard({
  candidate,
  averages,
  selected,
  onSelect,
}: {
  readonly candidate: CandidateDraft;
  readonly averages: Readonly<Record<StatId, number>>;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const chassis = findById(CANDIDATE_REGISTRY.chassis, candidate.chassisId);
  const signature = findById(CANDIDATE_REGISTRY.signatures, candidate.signatureId);
  const advantage = findById(CANDIDATE_REGISTRY.advantages, candidate.advantageId);
  const complication = findById(CANDIDATE_REGISTRY.complications, candidate.complicationId);
  const temperament = findById(CANDIDATE_REGISTRY.temperaments, candidate.temperamentId);
  const potential = findById(CANDIDATE_REGISTRY.potentialTells, candidate.potentialTellId);
  const loadout = findById(CANDIDATE_REGISTRY.loadouts, candidate.techniqueLoadoutId);
  const techniques = candidate.techniqueIds.map((id) =>
    findById(CANDIDATE_REGISTRY.techniques, id),
  );
  const visual = findById(CANDIDATE_REGISTRY.visualProfiles, candidate.visualProfileId);
  const fingerprint = `${chassis.name} · ${signature.name} · ${loadout.roles.join(" + ")} · ${temperament.name}`;

  return (
    <article
      className={`candidate-card${selected ? " is-selected" : ""}`}
      data-build-id={candidate.semanticFingerprint.hash}
    >
      <header className="candidate-card-header">
        <div
          className={`candidate-portrait silhouette-${visual.silhouette}`}
          data-visual-profile={visual.id}
          aria-hidden="true"
        >
          <span />
        </div>
        <div className="candidate-title-block">
          <span className="eyebrow">{chassis.name}</span>
          <h2>{candidate.identity.displayName}</h2>
          <button
            className={`button ${selected ? "button-secondary" : "button-primary"}`}
            type="button"
            aria-pressed={selected}
            onClick={onSelect}
          >
            {selected ? `${candidate.identity.displayName} selected` : `Select ${candidate.identity.displayName}`}
          </button>
        </div>
      </header>

      <p className="candidate-identity">{chassis.rulesText}</p>

      <section className="candidate-section" aria-label={`${candidate.identity.displayName} signature`}>
        <span className="candidate-section-label">Signature</span>
        <h3>{signature.name}</h3>
        <p>{signature.rulesText}</p>
      </section>

      <section className="candidate-section" aria-label={`${candidate.identity.displayName} techniques`}>
        <span className="candidate-section-label">Starting techniques</span>
        <ul className="candidate-techniques">
          {techniques.map((technique) => (
            <li key={technique.id}>
              <strong>{technique.name} · {technique.cost} Points</strong>
              <span>{technique.rulesText}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="candidate-section" aria-label={`${candidate.identity.displayName} starting stats`}>
        <span className="candidate-section-label">Starting stats</span>
        <p className="candidate-comparison-note">Compared with the average of this set.</p>
        <dl className="candidate-stats">
          {STAT_IDS.map((statId) => {
            const difference = candidate.stats[statId] - averages[statId];
            return (
              <div key={statId}>
                <dt>{STAT_LABELS[statId]}</dt>
                <dd>
                  <strong>{candidate.stats[statId]}</strong>
                  <span>{signed(difference)} vs set</span>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section className="candidate-tradeoffs" aria-label={`${candidate.identity.displayName} tradeoffs`}>
        <div className="candidate-advantage">
          <span className="candidate-section-label">Advantage · {advantage.name}</span>
          <p>{advantage.rulesText}</p>
        </div>
        <div className="candidate-risk">
          <span className="candidate-section-label">Risk · {complication.name}</span>
          <p>{complication.rulesText}</p>
        </div>
      </section>

      <details className="candidate-details">
        <summary>Candidate details</summary>
        <div
          className="candidate-details-content"
          role="region"
          aria-label={`${candidate.identity.displayName} candidate details`}
        >
          <section className="candidate-potential">
            <span className="candidate-section-label">Growth clue</span>
            <p>{potential.text}</p>
            <small>Exact later growth is still unknown.</small>
          </section>

          <div className="candidate-fingerprint">
            <span>Build fingerprint</span>
            <strong>{fingerprint}</strong>
            <small>Build ID {candidate.semanticFingerprint.hash}</small>
          </div>
        </div>
      </details>
    </article>
  );
}

function SelectedCandidateTray({
  candidate,
  onStart,
}: {
  readonly candidate: CandidateDraft;
  readonly onStart: () => void;
}) {
  const signature = findById(CANDIDATE_REGISTRY.signatures, candidate.signatureId);
  const firstTechnique = findById(CANDIDATE_REGISTRY.techniques, candidate.techniqueIds[0]);
  const secondTechnique = findById(CANDIDATE_REGISTRY.techniques, candidate.techniqueIds[1]);

  return (
    <section
      className="candidate-selection-status candidate-selection-tray"
      role="status"
      aria-label="Selected fighter"
    >
      <div>
        <span className="eyebrow">Selected for trial</span>
        <strong>{candidate.identity.displayName}</strong>
        <span>
          {signature.name} · {firstTechnique.name} and {secondTechnique.name}
        </span>
      </div>
      <div className="candidate-selection-tray-actions">
        <p>The trial will use this exact kit. Your current team remains unchanged.</p>
        <button className="button button-primary" type="button" onClick={onStart}>
          Start {candidate.identity.displayName}&apos;s trial
        </button>
      </div>
    </section>
  );
}

export function CandidateLabScreen() {
  const roster = useStudioStore((state) => state.candidateRoster);
  const candidateSetNumber = useStudioStore((state) => state.candidateSetNumber);
  const favoriteCandidateId = useStudioStore((state) => state.favoriteCandidateId);
  const chooseCandidate = useStudioStore((state) => state.chooseCandidate);
  const newCandidateSet = useStudioStore((state) => state.newCandidateSet);
  const startCandidateTrial = useStudioStore((state) => state.startCandidateTrial);

  if (!roster || roster.status === "generation_failed") {
    return (
      <section className="screen recovery-screen candidate-lab-screen">
        <span className="eyebrow">Candidate trial</span>
        <h1>These candidates could not be prepared.</h1>
        <p>Try another generated set. The current battle team is unchanged.</p>
        <button className="button button-primary" type="button" onClick={newCandidateSet}>
          Try another set
        </button>
      </section>
    );
  }

  const averages = Object.fromEntries(
    STAT_IDS.map((statId) => [
      statId,
      Math.round(
        roster.candidates.reduce((total, candidate) => total + candidate.stats[statId], 0) /
          roster.candidates.length,
      ),
    ]),
  ) as Record<StatId, number>;
  const favorite = roster.candidates.find(
    (candidate) => candidate.candidateId === favoriteCandidateId,
  );

  return (
    <section className="screen candidate-lab-screen" aria-labelledby="candidate-lab-heading">
      <header className="screen-header candidate-lab-header">
        <div>
          <span className="eyebrow">Candidate trial · Set {candidateSetNumber}</span>
          <h1 id="candidate-lab-heading">Choose a fighter to test</h1>
        </div>
        <button className="button button-secondary" type="button" onClick={newCandidateSet}>
          Show new candidates
        </button>
      </header>

      <div className="candidate-scope-note">
        <strong>Trial selection.</strong>
        <span>Your selected fighter will enter a real battle trial. Your current three-person team stays unchanged.</span>
      </div>

      {favorite ? (
        <SelectedCandidateTray candidate={favorite} onStart={startCandidateTrial} />
      ) : (
        <p className="candidate-selection-status">Compare each fighter&apos;s signature, techniques, starting stats, and risk before selecting one.</p>
      )}

      <div className="candidate-grid">
        {roster.candidates.map((candidate) => (
          <CandidateCard
            candidate={candidate}
            averages={averages}
            selected={candidate.candidateId === favoriteCandidateId}
            onSelect={() => chooseCandidate(candidate.candidateId)}
            key={candidate.candidateId}
          />
        ))}
      </div>
    </section>
  );
}
