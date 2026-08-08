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
    <article className={`candidate-card${selected ? " is-selected" : ""}`}>
      <header className="candidate-card-header">
        <div
          className={`candidate-portrait silhouette-${visual.silhouette}`}
          data-visual-profile={visual.id}
          aria-hidden="true"
        >
          <span />
        </div>
        <div>
          <span className="eyebrow">{chassis.name}</span>
          <h2>{candidate.identity.displayName}</h2>
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

      <section className="candidate-section" aria-label={`${candidate.identity.displayName} draft scores`}>
        <span className="candidate-section-label">Draft scores</span>
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

      <section className="candidate-potential">
        <span className="candidate-section-label">Potential clue</span>
        <p>{potential.text}</p>
        <small>Unknown: exact late growth.</small>
      </section>

      <div className="candidate-fingerprint">
        <span>Build fingerprint</span>
        <strong>{fingerprint}</strong>
        <small>Build ID {candidate.semanticFingerprint.hash}</small>
      </div>

      <button
        className={`button ${selected ? "button-secondary" : "button-primary"}`}
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
      >
        {selected ? `${candidate.identity.displayName} is your favorite` : `Choose ${candidate.identity.displayName}`}
      </button>
    </article>
  );
}

export function CandidateLabScreen() {
  const roster = useStudioStore((state) => state.candidateRoster);
  const candidateSetNumber = useStudioStore((state) => state.candidateSetNumber);
  const favoriteCandidateId = useStudioStore((state) => state.favoriteCandidateId);
  const chooseCandidate = useStudioStore((state) => state.chooseCandidate);
  const newCandidateSet = useStudioStore((state) => state.newCandidateSet);

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
          <h1 id="candidate-lab-heading">Choose a future recruit</h1>
        </div>
        <button className="button button-secondary" type="button" onClick={newCandidateSet}>
          Show new candidates
        </button>
      </header>

      <div className="candidate-scope-note">
        <strong>Comparison only.</strong>
        <span>Your choice records a favorite. It does not change the current battle team yet.</span>
      </div>

      {favorite ? (
        <p className="candidate-selection-status" role="status">
          Favorite recorded: <strong>{favorite.identity.displayName}</strong>. You can change your choice or view a new set.
        </p>
      ) : (
        <p className="candidate-selection-status">Compare the trigger, techniques, scores, and risk before choosing.</p>
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
