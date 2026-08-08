import { useEffect, useRef } from "react";
import { ENCOUNTERS, HEROES } from "../content";
import { getEquipmentRewardOptions } from "../equipment";
import { useCombatLabRepository } from "../state/repositoryContext";
import { useStudioStore } from "../state/studioStore";
import { Battlefield } from "./Battlefield";
import { EventInspector } from "./EventInspector";
import { resultFacts, unitName } from "./presentation";
import { UI_COPY } from "./copy";

function outcomeCopy(winner: "heroes" | "enemies" | "draw"): string {
  if (winner === "heroes") return "Win";
  if (winner === "enemies") return "Loss";
  return "Draw";
}

function signedChange(value: number): string {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value)}`;
}

export function ResultScreen() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const repository = useCombatLabRepository();
  const result = useStudioStore((state) => state.result);
  const openInspector = useStudioStore((state) => state.openInspector);
  const replayToPrepare = useStudioStore((state) => state.replayToPrepare);
  const nextEncounter = useStudioStore((state) => state.nextEncounter);
  const rewardSelection = useStudioStore((state) => state.rewardSelection);
  const selectedEquipment = useStudioStore((state) => state.selectedEquipment);
  const progress = useStudioStore((state) => state.progress);
  const selectEquipmentReward = useStudioStore((state) => state.selectEquipmentReward);
  const confirmEquipmentReward = useStudioStore((state) => state.confirmEquipmentReward);
  const aftermathFact = useStudioStore((state) => state.aftermathFact);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  if (!result) {
    return (
      <section className="screen recovery-screen">
        <h1>Result could not be loaded</h1>
        <p>Return to preparation and start the battle again.</p>
        <button className="button button-primary" type="button" onClick={replayToPrepare}>
          Return to preparation
        </button>
      </section>
    );
  }

  const encounter = ENCOUNTERS[result.command.encounterId];
  const facts = resultFacts(result);
  const resultLabel = outcomeCopy(result.winner);
  const isPressureResult = result.command.encounterId === "pressure_rear";
  const rewards = getEquipmentRewardOptions(result.command.encounterId);
  const equipmentConfirmed =
    progress.pressureRearCompleted && selectedEquipment !== "none";

  return (
    <section className="screen result-screen" aria-labelledby="result-heading">
      <header className="screen-header result-header">
        <div>
          <span className="eyebrow">{encounter.name}</span>
          <h1 id="result-heading" ref={headingRef} tabIndex={-1}>
            {UI_COPY.result}: {resultLabel}
          </h1>
        </div>
        <div className={`outcome-badge outcome-${result.winner}`}>{resultLabel}</div>
      </header>

      <div className="result-grid">
        <Battlefield units={result.finalUnits} final />
        <section className="result-facts" aria-labelledby="battle-summary-heading">
          <span className="eyebrow">Why it happened</span>
          <h2 id="battle-summary-heading">Battle summary</h2>
          <div className="fact-list">
            {facts.map((fact) => (
              <article className="result-fact" key={fact.label}>
                <h3>{fact.label}</h3>
                <p>{fact.text}</p>
                <button className="text-button" type="button" onClick={() => openInspector(fact.eventId)}>
                  Show battle detail
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="result-summary" aria-label="Battle totals">
        <span>
          {result.rounds} rounds · {result.actionCount} actions
        </span>
        <button className="button button-quiet" type="button" onClick={() => openInspector()}>
          {UI_COPY.exactEvents}
        </button>
      </section>

      {isPressureResult && aftermathFact ? (
        <section className="aftermath-region" aria-labelledby="aftermath-heading">
          <div>
            <span className="eyebrow">Battle consequence</span>
            <h2 id="aftermath-heading">Aftermath</h2>
          </div>
          {aftermathFact.kind === "bruised" ? (
            <p>
              <strong>{unitName(aftermathFact.heroId)} is Bruised.</strong> This hero was knocked out and starts the next battle with Max HP reduced from {HEROES[aftermathFact.heroId].stats.maxHealth} to {HEROES[aftermathFact.heroId].stats.maxHealth - aftermathFact.healthPenalty}.
            </p>
          ) : (
            <p>
              <strong>No injury.</strong> No hero was knocked out.
            </p>
          )}
          <button
            className="text-button"
            type="button"
            onClick={() => openInspector(aftermathFact.sourceEventId)}
          >
            Show knockout detail
          </button>
        </section>
      ) : null}

      {isPressureResult ? (
        <section className="equipment-reward" aria-labelledby="equipment-reward-heading">
          <div className="reward-heading-row">
            <div>
              <span className="eyebrow">Equipment reward</span>
              <h2 id="equipment-reward-heading">Choose equipment for the front slot</h2>
            </div>
            <p>The item belongs to the front slot and applies to the hero who starts there.</p>
          </div>
          <fieldset className="reward-options" disabled={equipmentConfirmed}>
            <legend className="sr-only">Front equipment options</legend>
            {rewards.map((equipment) => (
              <label className="reward-card" key={equipment.id}>
                <input
                  type="radio"
                  name="equipment-reward"
                  value={equipment.id}
                  checked={
                    equipmentConfirmed
                      ? selectedEquipment === equipment.id
                      : rewardSelection === equipment.id
                  }
                  onChange={() => selectEquipmentReward(equipment.id)}
                />
                <span className="reward-card-copy">
                  <strong>{equipment.name}</strong>
                  <span>{equipment.description}</span>
                  <span className="equipment-exacts">
                    At battle start: Guard +{equipment.effects.startingGuard}; Speed {signedChange(equipment.effects.speed)}.
                  </span>
                  {(equipmentConfirmed ? selectedEquipment : rewardSelection) === equipment.id ? (
                    <span className="selected-label">Selected</span>
                  ) : null}
                </span>
              </label>
            ))}
          </fieldset>
          <div className="reward-confirm-row">
            <button
              className="button button-secondary"
              type="button"
              disabled={!rewardSelection || equipmentConfirmed || !repository}
              onClick={() => {
                if (repository) confirmEquipmentReward(repository);
              }}
            >
              {equipmentConfirmed ? "Equipment confirmed" : "Confirm equipment"}
            </button>
            {equipmentConfirmed ? (
              <p className="confirmation-copy" role="status">
                {selectedEquipment === "heavy_pad"
                  ? "Heavy Pad is assigned to the front slot."
                  : "Quick Shoes are assigned to the front slot."}
              </p>
            ) : (
              <p id="next-encounter-reason" className="next-reason">
                Choose and confirm equipment before the next encounter.
              </p>
            )}
          </div>
        </section>
      ) : null}

      <footer className="result-actions">
        <button className="button button-secondary" type="button" onClick={replayToPrepare}>
          {UI_COPY.replay}
        </button>
        <button
          className="button button-primary"
          type="button"
          disabled={isPressureResult && !equipmentConfirmed}
          aria-describedby={isPressureResult && !equipmentConfirmed ? "next-encounter-reason" : undefined}
          onClick={nextEncounter}
        >
          {result.command.encounterId === "pressure_rear" ? UI_COPY.nextEncounter : UI_COPY.firstEncounter}
        </button>
      </footer>

      <p className="sr-only" aria-live="polite">
        Result: {resultLabel}.
      </p>
      <EventInspector result={result} />
    </section>
  );
}
