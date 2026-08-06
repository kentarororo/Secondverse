import { useEffect, useRef } from "react";
import { AUTHORED_TRIO, ENCOUNTERS } from "../content";
import { EQUIPMENT } from "../equipment";
import {
  deriveUnitStats,
  simulateBattle,
  type FormationSlot,
  type StartBattleCommand,
} from "../sim";
import { useCombatLabRepository } from "../state/repositoryContext";
import { useStudioStore } from "../state/studioStore";
import { battleAudio } from "./audio";
import { TEAM_POLICY_COPY, TECHNIQUE_POLICY_COPY, UI_COPY } from "./copy";
import { silhouetteClassNames } from "./presentation";

const SLOTS: readonly FormationSlot[] = ["front", "middle", "rear"];
const SEEDS = {
  pressure_rear: "lab-pressure-v1",
  punish_front: "lab-front-v1",
} as const;

const HERO_RULES = {
  ada: "Brace adds guard. Step In can cover a marked rear hit from the middle slot.",
  bo: "Heavy Hit deals more damage. Follow Up adds damage below half health.",
  cy: "First Aid heals the most injured ally. Quick Help can add guard.",
} as const;

export function PrepareScreen() {
  const firstFormationRender = useRef(true);
  const repository = useCombatLabRepository();
  const encounterId = useStudioStore((state) => state.encounterId);
  const plan = useStudioStore((state) => state.plan);
  const selectedHeroId = useStudioStore((state) => state.selectedHeroId);
  const selectHero = useStudioStore((state) => state.selectHero);
  const moveHero = useStudioStore((state) => state.moveHero);
  const setTeamPolicy = useStudioStore((state) => state.setTeamPolicy);
  const setTechniquePolicy = useStudioStore((state) => state.setTechniquePolicy);
  const resetPlan = useStudioStore((state) => state.resetPlan);
  const beginBattle = useStudioStore((state) => state.beginBattle);
  const muted = useStudioStore((state) => state.muted);
  const reducedMotion = useStudioStore((state) => state.reducedMotion);
  const setMuted = useStudioStore((state) => state.setMuted);
  const setReducedMotion = useStudioStore((state) => state.setReducedMotion);
  const selectedEquipment = useStudioStore((state) => state.selectedEquipment);
  const aftermathCondition = useStudioStore((state) => state.aftermathCondition);
  const progress = useStudioStore((state) => state.progress);
  const encounter = ENCOUNTERS[encounterId];
  const selectedHero = AUTHORED_TRIO.find((hero) => hero.id === selectedHeroId);
  const equippedItem = selectedEquipment === "none" ? null : EQUIPMENT[selectedEquipment];
  const conditionHero = aftermathCondition
    ? AUTHORED_TRIO.find((hero) => hero.id === aftermathCondition.heroId) ?? null
    : null;
  const conditionMaxHealth =
    aftermathCondition && conditionHero
      ? deriveUnitStats(conditionHero.stats, {
          maxHealth: -aftermathCondition.healthPenalty,
        }).maxHealth
      : null;

  useEffect(() => {
    if (firstFormationRender.current) {
      firstFormationRender.current = false;
      return;
    }
    document.querySelector<HTMLButtonElement>(`[data-plan-hero="${selectedHeroId}"]`)?.focus({
      preventScroll: true,
    });
  }, [plan.formation, selectedHeroId]);

  if (!selectedHero) {
    throw new Error(`Missing selected hero ${selectedHeroId}`);
  }

  const startBattle = () => {
    battleAudio.unlock();
    const command: StartBattleCommand = {
      type: "start_battle",
      version: 1,
      seed: SEEDS[encounterId],
      encounterId,
      plan: {
        ...plan,
        frontEquipment: encounterId === "pressure_rear" ? "none" : selectedEquipment,
        priorCondition: encounterId === "pressure_rear" ? null : aftermathCondition,
      },
    };
    beginBattle(simulateBattle(command));
  };

  return (
    <section className="screen prepare-screen" aria-labelledby="prepare-heading">
      <header className="screen-header">
        <div>
          <span className="eyebrow">Encounter {encounterId === "pressure_rear" ? "1" : "2"} of 2</span>
          <h1 id="prepare-heading">{encounter.name}</h1>
        </div>
        <div className="preference-controls" aria-label="Display and sound settings">
          <label className="check-control">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) =>
                setReducedMotion(event.currentTarget.checked, repository ?? undefined)
              }
            />
            {UI_COPY.reducedMotion}
          </label>
          <button
            className="button button-quiet"
            type="button"
            onClick={() => setMuted(!muted, repository ?? undefined)}
          >
            {muted ? "Unmute sound" : "Mute sound"}
          </button>
        </div>
      </header>

      <div className="enemy-rule-banner">
        <strong>{UI_COPY.enemyRule}</strong>
        <span>{encounter.tell}</span>
      </div>

      {encounterId === "punish_front" && equippedItem ? (
        <section className="equipped-plan-banner" aria-label="Front equipment">
          <div>
            <span className="eyebrow">Front equipment</span>
            <strong>{equippedItem.name}</strong>
          </div>
          <p>
            {plan.formation.front === "ada" ? "Ada" : plan.formation.front === "bo" ? "Bo" : "Cy"} wears it in front. Starting guard +{equippedItem.effects.startingGuard}; Speed {equippedItem.effects.speed >= 0 ? "+" : ""}{equippedItem.effects.speed}.
          </p>
        </section>
      ) : null}

      {encounterId === "punish_front" && conditionHero && conditionMaxHealth !== null ? (
        <section className="prior-condition-banner" aria-label="Prior condition">
          <div>
            <span className="eyebrow">Prior condition</span>
            <strong>{conditionHero.name}: Bruised</strong>
          </div>
          <p>
            Next battle HP {conditionMaxHealth}/{conditionMaxHealth}. Maximum health −{aftermathCondition?.healthPenalty} from {conditionHero.stats.maxHealth}.
          </p>
        </section>
      ) : encounterId === "punish_front" && progress.pressureRearCompleted ? (
        <section className="prior-condition-banner no-injury-banner" aria-label="Prior condition">
          <div>
            <span className="eyebrow">Prior condition</span>
            <strong>No injury</strong>
          </div>
          <p>No hero was knocked out in Pressure the Rear. Starting health is unchanged.</p>
        </section>
      ) : null}

      <div className="prepare-grid">
        <section className="formation-panel" aria-labelledby="formation-heading">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Your team</span>
              <h2 id="formation-heading">{UI_COPY.formation}</h2>
            </div>
            <span className="section-help">Select a hero, then choose a slot.</span>
          </div>
          <div className="plan-formation">
            {SLOTS.map((slot) => {
              const hero = AUTHORED_TRIO.find((candidate) => candidate.id === plan.formation[slot]);
              if (!hero) throw new Error(`Missing hero in ${slot}`);
              const selected = hero.id === selectedHeroId;
              return (
                <button
                  className={`plan-hero-card${selected ? " is-selected" : ""}`}
                  data-plan-hero={hero.id}
                  key={slot}
                  type="button"
                  onClick={() => selectHero(hero.id)}
                  aria-pressed={selected}
                >
                  <span className="slot-number">{SLOTS.indexOf(slot) + 1}</span>
                  <span
                    className={`unit-silhouette plan-hero-silhouette ${silhouetteClassNames(hero.id)}`}
                    aria-hidden="true"
                  >
                    <span className="silhouette-head" />
                    <span className="silhouette-body" />
                    <span className="silhouette-detail" />
                  </span>
                  <span className="plan-hero-copy">
                    <span className="slot-label">{slot}</span>
                    <strong>{hero.name}</strong>
                    <span>{hero.role}</span>
                    <span>
                      HP {hero.stats.maxHealth} · Defence {hero.stats.defence}
                    </span>
                    {slot === "front" && encounterId === "punish_front" && equippedItem ? (
                      <span className="front-equipment-label">
                        {equippedItem.name}: Guard +{equippedItem.effects.startingGuard}, Speed {equippedItem.effects.speed >= 0 ? "+" : ""}{equippedItem.effects.speed}
                      </span>
                    ) : null}
                    {encounterId === "punish_front" && aftermathCondition?.heroId === hero.id && conditionMaxHealth !== null ? (
                      <span className="condition-label">
                        Bruised: HP {conditionMaxHealth}/{conditionMaxHealth}, Max HP −{aftermathCondition.healthPenalty}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="slot-actions" aria-label={`Move ${selectedHero.name}`}>
            {SLOTS.map((slot) => (
              <button
                className="button button-secondary"
                key={slot}
                type="button"
                disabled={plan.formation[slot] === selectedHeroId}
                onClick={() => moveHero(selectedHeroId, slot)}
              >
                Move to {slot}
              </button>
            ))}
          </div>
        </section>

        <aside className="plan-panel" aria-labelledby="plan-heading">
          <div>
            <span className="eyebrow">Selected hero</span>
            <h2 id="plan-heading">{selectedHero.name}</h2>
            <p className="mechanic-copy">{HERO_RULES[selectedHero.id]}</p>
          </div>

          <fieldset className="option-group">
            <legend>{UI_COPY.teamPolicy}</legend>
            {(Object.keys(TEAM_POLICY_COPY) as (keyof typeof TEAM_POLICY_COPY)[]).map((policyId) => (
              <label className="option-card" key={policyId}>
                <input
                  type="radio"
                  name="team-policy"
                  checked={plan.teamPolicy === policyId}
                  onChange={() => setTeamPolicy(policyId)}
                />
                <span>
                  <strong>{TEAM_POLICY_COPY[policyId].name}</strong>
                  <small>{TEAM_POLICY_COPY[policyId].effect}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="option-group">
            <legend>{selectedHero.name} {UI_COPY.techniquePolicy.toLocaleLowerCase()}</legend>
            {(Object.keys(TECHNIQUE_POLICY_COPY) as (keyof typeof TECHNIQUE_POLICY_COPY)[]).map(
              (policyId) => (
                <label className="option-card" key={policyId}>
                  <input
                    type="radio"
                    name={`${selectedHero.id}-technique-policy`}
                    checked={plan.techniquePolicies[selectedHero.id] === policyId}
                    onChange={() => setTechniquePolicy(selectedHero.id, policyId)}
                  />
                  <span>
                    <strong>{TECHNIQUE_POLICY_COPY[policyId].name}</strong>
                    <small>{TECHNIQUE_POLICY_COPY[policyId].effect}</small>
                  </span>
                </label>
              ),
            )}
          </fieldset>
        </aside>
      </div>

      <footer className="prepare-footer">
        <p className="plan-summary">
          <strong>Current plan:</strong> Front {plan.formation.front === "ada" ? "Ada" : plan.formation.front === "bo" ? "Bo" : "Cy"}; {TEAM_POLICY_COPY[plan.teamPolicy].name}{encounterId === "punish_front" && equippedItem ? `; ${equippedItem.name}` : ""}{encounterId === "punish_front" && conditionHero ? `; ${conditionHero.name} Bruised` : ""}.
        </p>
        <div className="footer-actions">
          <button className="button button-quiet" type="button" onClick={resetPlan}>
            {UI_COPY.resetPlan}
          </button>
          <button className="button button-primary" type="button" onClick={startBattle}>
            {UI_COPY.startBattle}
          </button>
        </div>
      </footer>
    </section>
  );
}
