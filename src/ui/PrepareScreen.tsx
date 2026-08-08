import { useEffect, useRef } from "react";
import { AUTHORED_TRIO, ENCOUNTERS, STANCES, stancesForHero } from "../content";
import { EQUIPMENT } from "../equipment";
import {
  deriveUnitStats,
  simulateBattle,
  type FormationSlot,
  type HeroStanceId,
  type StartBattleCommand,
} from "../sim";
import { useCombatLabRepository } from "../state/repositoryContext";
import { useStudioStore, type StanceSelection } from "../state/studioStore";
import { battleAudio } from "./audio";
import { CombatVisual } from "./CombatVisual";
import { TEAM_POLICY_COPY, UI_COPY } from "./copy";

const SLOTS: readonly FormationSlot[] = ["front", "middle", "rear"];
const SEEDS = {
  pressure_rear: "lab-pressure-v1",
  punish_front: "lab-front-v1",
} as const;

const HERO_RULES = {
  ada: "Brace gives Ada Guard. Step In lets her intercept a marked rear attack while she is alive in the middle slot.",
  bo: "Heavy Hit deals extra damage. Follow Up deals more damage to an enemy below half HP.",
  cy: "First Aid restores HP to the most injured ally. Quick Help can also give that ally Guard.",
} as const;

function heroName(heroId: "ada" | "bo" | "cy"): string {
  return heroId === "ada" ? "Ada" : heroId === "bo" ? "Bo" : "Cy";
}

function roleName(role: string): string {
  return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
}

function stanceSelection(stanceId: HeroStanceId): StanceSelection {
  switch (stanceId) {
    case "ada_brace_early":
    case "ada_brace_under_pressure":
      return { heroId: "ada", stanceId };
    case "bo_hit_front":
    case "bo_finish_weak":
      return { heroId: "bo", stanceId };
    case "cy_aid_one":
    case "cy_aid_two":
      return { heroId: "cy", stanceId };
  }
}

export function PrepareScreen() {
  const firstFormationRender = useRef(true);
  const repository = useCombatLabRepository();
  const encounterId = useStudioStore((state) => state.encounterId);
  const plan = useStudioStore((state) => state.plan);
  const selectedHeroId = useStudioStore((state) => state.selectedHeroId);
  const selectHero = useStudioStore((state) => state.selectHero);
  const moveHero = useStudioStore((state) => state.moveHero);
  const setTeamPolicy = useStudioStore((state) => state.setTeamPolicy);
  const setStance = useStudioStore((state) => state.setStance);
  const resetPlan = useStudioStore((state) => state.resetPlan);
  const beginBattle = useStudioStore((state) => state.beginBattle);
  const openCandidateLab = useStudioStore((state) => state.openCandidateLab);
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
  const bruisedStartLabel =
    encounterId === "punish_front" && aftermathCondition && conditionHero
      ? `Start with ${conditionHero.name} Bruised · −${aftermathCondition.healthPenalty} max HP`
      : UI_COPY.startBattle;

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
        <div className="preference-controls" aria-label="Preparation actions and settings">
          <button className="button button-secondary" type="button" onClick={openCandidateLab}>
            Candidates
          </button>
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
            {heroName(plan.formation.front)} starts in the front slot with Guard +{equippedItem.effects.startingGuard} and Speed {equippedItem.effects.speed >= 0 ? "+" : ""}{equippedItem.effects.speed} from {equippedItem.name}.
          </p>
        </section>
      ) : null}

      {encounterId === "punish_front" && aftermathCondition && conditionHero && conditionMaxHealth !== null ? (
        <section className="prior-condition-banner condition-start-panel" aria-label="Prior condition">
          <div>
            <span className="eyebrow">Starts this battle</span>
            <strong>{conditionHero.name}: Bruised</strong>
          </div>
          <p>
            {conditionHero.name} starts this battle at {conditionMaxHealth}/{conditionMaxHealth} HP. Bruised reduces Max HP from {conditionHero.stats.maxHealth} to {conditionMaxHealth}.
          </p>
        </section>
      ) : encounterId === "punish_front" && progress.pressureRearCompleted ? (
        <section className="prior-condition-banner no-injury-banner" aria-label="Prior condition">
          <div>
            <span className="eyebrow">Prior condition</span>
            <strong>No injury</strong>
          </div>
          <p>No hero was knocked out in Pressure the Rear. The team starts with full Max HP.</p>
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
              const selectedStance = STANCES[plan.stances[hero.id]];
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
                  <CombatVisual unitId={hero.id} className="plan-hero-silhouette" />
                  <span className="plan-hero-copy">
                    <span className="slot-label">{slot}</span>
                    <strong>{hero.name}</strong>
                    <span>{roleName(hero.role)}</span>
                    <span>
                      HP {hero.stats.maxHealth} · Defense {hero.stats.defence}
                    </span>
                    <span className="stance-label">Stance: {selectedStance.name}</span>
                    {slot === "front" && encounterId === "punish_front" && equippedItem ? (
                      <span className="front-equipment-label">
                        {equippedItem.name}: Guard +{equippedItem.effects.startingGuard}; Speed {equippedItem.effects.speed >= 0 ? "+" : ""}{equippedItem.effects.speed}
                      </span>
                    ) : null}
                    {encounterId === "punish_front" && aftermathCondition?.heroId === hero.id && conditionMaxHealth !== null ? (
                      <span className="condition-label">
                        Bruised: HP {conditionMaxHealth}/{conditionMaxHealth}; Max HP −{aftermathCondition.healthPenalty}
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

          <fieldset className="option-group stance-options">
            <legend>{selectedHero.name} {UI_COPY.stance.toLocaleLowerCase()}</legend>
            {stancesForHero(selectedHero.id).map((stance) => (
              <label className="option-card" key={stance.id}>
                <input
                  type="radio"
                  name={`${selectedHero.id}-stance`}
                  checked={plan.stances[selectedHero.id] === stance.id}
                  onChange={() => setStance(stanceSelection(stance.id))}
                />
                <span>
                  <strong>{stance.name}</strong>
                  <small>{stance.forecast}</small>
                </span>
              </label>
            ))}
          </fieldset>
        </aside>
      </div>

      <footer className="prepare-footer">
        <p className="plan-summary">
          <strong>Current plan:</strong> {heroName(plan.formation.front)} starts in the front slot. Team policy: {TEAM_POLICY_COPY[plan.teamPolicy].name}.{encounterId === "punish_front" && equippedItem ? ` Front equipment: ${equippedItem.name}.` : ""}{encounterId === "punish_front" && conditionHero ? ` ${conditionHero.name} starts Bruised.` : ""}
          <span className="stance-summary"> Stances: Ada — {STANCES[plan.stances.ada].name}; Bo — {STANCES[plan.stances.bo].name}; Cy — {STANCES[plan.stances.cy].name}.</span>
        </p>
        <div className="footer-actions">
          {encounterId === "punish_front" && aftermathCondition && conditionHero ? (
            <span className="condition-start-reminder">
              {conditionHero.name} starts Bruised · −{aftermathCondition.healthPenalty} max HP
            </span>
          ) : null}
          <button className="button button-quiet" type="button" onClick={resetPlan}>
            {UI_COPY.resetPlan}
          </button>
          <button className="button button-primary" type="button" onClick={startBattle}>
            {bruisedStartLabel}
          </button>
        </div>
      </footer>
    </section>
  );
}
