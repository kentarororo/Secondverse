import { useEffect, useMemo, useRef, useState } from "react";
import { ENCOUNTERS } from "../content";
import { useCombatLabRepository } from "../state/repositoryContext";
import { useStudioStore } from "../state/studioStore";
import { battleAudio } from "./audio";
import { Battlefield } from "./Battlefield";
import { UI_COPY } from "./copy";
import { EventInspector } from "./EventInspector";
import {
  momentDurationMs,
  selectPlaybackMoments,
  type MomentPlaybackMode,
} from "./moments";
import {
  combatFeedbackForMoment,
  contactCueForMoment,
  eventFact,
  momentSummary,
  planTrackerAtMoment,
  unitsAtEvent,
} from "./presentation";

export function BattleScreen() {
  const repository = useCombatLabRepository();
  const result = useStudioStore((state) => state.result);
  const playbackCursor = useStudioStore((state) => state.playbackCursor);
  const playing = useStudioStore((state) => state.playing);
  const speed = useStudioStore((state) => state.speed);
  const muted = useStudioStore((state) => state.muted);
  const reducedMotion = useStudioStore((state) => state.reducedMotion);
  const setPlaybackCursor = useStudioStore((state) => state.setPlaybackCursor);
  const setPlaying = useStudioStore((state) => state.setPlaying);
  const setSpeed = useStudioStore((state) => state.setSpeed);
  const setMuted = useStudioStore((state) => state.setMuted);
  const setReducedMotion = useStudioStore((state) => state.setReducedMotion);
  const openInspector = useStudioStore((state) => state.openInspector);
  const showResult = useStudioStore((state) => state.showResult);
  const replayToPrepare = useStudioStore((state) => state.replayToPrepare);
  const [playbackMode, setPlaybackMode] = useState<MomentPlaybackMode>("key");
  const lastCuedMomentId = useRef<string | null>(null);

  const playback = useMemo(
    () => (result ? selectPlaybackMoments(result, playbackMode) : []),
    [playbackMode, result],
  );
  const finalCursor = Math.max(0, (result?.events.length ?? 1) - 1);
  const cursor = Math.min(playbackCursor, finalCursor);
  const playbackIndex = Math.max(
    0,
    playback.findIndex((entry) => cursor <= entry.moment.endEventIndex),
  );
  const currentEntry = playback[playbackIndex];
  const currentMoment = currentEntry?.moment;
  const focusEvent = result?.events.find(
    (event) => event.eventId === currentMoment?.focusEventId,
  );

  useEffect(() => {
    if (!result || !currentMoment || !playing) return;
    const delay = Math.max(10, momentDurationMs(currentMoment, reducedMotion) / speed);
    const timer = window.setTimeout(() => {
      const next = playback[playbackIndex + 1];
      if (!next) {
        setPlaybackCursor(result.events.length - 1);
        showResult(repository ?? undefined);
        return;
      }
      setPlaybackCursor(next.moment.endEventIndex);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    currentMoment,
    playback,
    playbackIndex,
    playing,
    reducedMotion,
    repository,
    result,
    setPlaybackCursor,
    showResult,
    speed,
  ]);

  useEffect(() => {
    if (!currentMoment || !focusEvent || lastCuedMomentId.current === currentMoment.id) return;
    lastCuedMomentId.current = currentMoment.id;
    battleAudio.cue(focusEvent, muted);
  }, [currentMoment, focusEvent, muted]);

  if (!result || !currentMoment || !focusEvent || !currentEntry) {
    return (
      <section className="screen recovery-screen">
        <h1>Battle could not be loaded</h1>
        <p>Return to preparation and start the battle again.</p>
        <button className="button button-primary" type="button" onClick={replayToPrepare}>
          Return to preparation
        </button>
      </section>
    );
  }

  const encounter = ENCOUNTERS[result.command.encounterId];
  const units = unitsAtEvent(result, currentMoment.endEventIndex);
  const contact = contactCueForMoment(currentMoment);
  const feedback = combatFeedbackForMoment(result, currentMoment);
  const summary = momentSummary(result, currentMoment);
  const tracker = planTrackerAtMoment(result, currentMoment);
  const displayActorId = contact?.actorId ?? currentMoment.actorId ?? undefined;
  const displayTargetIds = contact?.targetIds ?? currentMoment.resolvedTargetIds;
  const displayActionId = contact?.actionId ?? currentMoment.actionId ?? undefined;
  const signature = currentMoment.focusKind === "signature";
  const decisive = currentMoment.focusKind === "decisive";
  const eventClass = decisive ? "event-decisive" : signature ? "event-signature" : "event-normal";

  const skipToResult = () => {
    setPlaying(false);
    setPlaybackCursor(result.events.length - 1);
    showResult(repository ?? undefined);
  };

  const changePlaybackMode = (mode: MomentPlaybackMode) => {
    if (mode === playbackMode) return;
    setPlaybackMode(mode);
    setPlaybackCursor(0);
    lastCuedMomentId.current = null;
  };

  return (
    <section
      className={`screen battle-screen ${eventClass}${reducedMotion ? " reduce-motion" : ""}`}
      aria-labelledby="battle-heading"
    >
      <header className="battle-header">
        <div className="battle-title">
          <span className="eyebrow">Battle · Round {currentMoment.round}</span>
          <h1 id="battle-heading">{encounter.name}</h1>
        </div>
        <div className="battle-controls" aria-label="Playback controls">
          <button className="button button-control" type="button" onClick={() => setPlaying(!playing)}>
            {playing ? UI_COPY.pauseBattle : UI_COPY.resumeBattle}
          </button>
          <div className="speed-control" role="group" aria-label="Playback speed">
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
            {UI_COPY.skipResult}
          </button>
          <button
            className="button button-control"
            type="button"
            onClick={() => setMuted(!muted, repository ?? undefined)}
          >
            {muted ? "Unmute sound" : "Mute sound"}
          </button>
        </div>
      </header>

      <div className="battle-context-row">
        <div className="enemy-rule-banner battle-rule">
          <strong>{UI_COPY.enemyRule}</strong>
          <span>{encounter.tell}</span>
        </div>
        <div className="playback-mode-control" role="group" aria-label="Battle playback">
          {(["key", "all"] as const).map((mode) => (
            <button
              className={`button button-control${playbackMode === mode ? " is-active" : ""}`}
              type="button"
              aria-pressed={playbackMode === mode}
              onClick={() => changePlaybackMode(mode)}
              key={mode}
            >
              {mode === "key" ? UI_COPY.keyMoments : UI_COPY.everyAction}
            </button>
          ))}
        </div>
      </div>

      <div className="battle-stage">
        <Battlefield
          units={units}
          targetIds={displayTargetIds}
          deltas={feedback.deltas}
          statusCues={feedback.statuses}
          feedbackKey={currentMoment.id}
          {...(feedback.stance ? { stanceRibbon: feedback.stance } : {})}
          reactionTargetIds={contact?.targetIds ?? []}
          {...(displayActorId ? { actorId: displayActorId } : {})}
          {...(displayActionId ? { actionId: displayActionId } : {})}
          {...(contact ? { reaction: contact.reaction } : {})}
        />
        {signature ? (
          <div className="emphasis-callout signature-callout">
            <span>Signature</span>
            <strong>{eventFact(focusEvent)}</strong>
          </div>
        ) : null}
        {decisive ? (
          <div className="emphasis-callout decisive-callout">
            <span>{UI_COPY.turningPoint}</span>
            <strong>{eventFact(focusEvent)}</strong>
          </div>
        ) : null}
      </div>

      <div className="battle-reading-panel">
        <section className="current-moment-card" aria-label="Current moment">
          <div className="moment-heading-row">
            <div>
              <span className="eyebrow">{summary.label}</span>
              <strong>
                {playbackMode === "key" ? "Key moment" : "Moment"} {playbackIndex + 1} of {playback.length}
              </strong>
            </div>
            {currentEntry.routineActionsAdvanced > 0 ? (
              <span className="routine-advance">
                {currentEntry.routineActionsAdvanced} routine {currentEntry.routineActionsAdvanced === 1 ? "action has" : "actions have"} passed.
              </span>
            ) : null}
          </div>
          <p className="moment-chain" aria-label={summary.text}>
            <strong>{summary.cause}</strong>
            <span aria-hidden="true">→</span>
            <span>{summary.target}</span>
            <span aria-hidden="true">→</span>
            <strong>{summary.outcome}</strong>
          </p>
        </section>

        <section className="plan-tracker" aria-labelledby="plan-tracker-heading">
          <div className="plan-tracker-heading">
            <span className="eyebrow">Chosen stances</span>
            <h2 id="plan-tracker-heading">Plan tracker</h2>
          </div>
          <ul>
            {tracker.map((item) => (
              <li className={`plan-track-item state-${item.state}`} key={item.heroId}>
                <span>{item.heroName}</span>
                <strong>{item.stanceName}</strong>
                <small>{item.status}</small>
                {item.detail ? <small>{item.detail}</small> : null}
                {item.outcome ? <small className="plan-track-outcome">{item.outcome}</small> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="battle-fact-strip">
        <span>
          Review every action and number from this moment.
        </span>
        <div className="fact-actions">
          <button className="button button-quiet" type="button" onClick={() => openInspector(focusEvent.eventId)}>
            {UI_COPY.exactEvents}
          </button>
        </div>
      </footer>

      <div className="battle-preferences">
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
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {summary.text}
      </p>
      <EventInspector result={result} currentEventId={focusEvent.eventId} />
    </section>
  );
}
