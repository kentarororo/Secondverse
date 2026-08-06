import { useEffect } from "react";
import { ENCOUNTERS } from "../content";
import { useCombatLabRepository } from "../state/repositoryContext";
import { useStudioStore } from "../state/studioStore";
import { battleAudio } from "./audio";
import { Battlefield } from "./Battlefield";
import { ACTION_NAMES, UI_COPY } from "./copy";
import { EventInspector } from "./EventInspector";
import {
  contactCueForEvent,
  eventDurationMs,
  eventFact,
  eventUnitDeltas,
  intentAtEvent,
  unitName,
  unitsAtEvent,
} from "./presentation";

function liveAnnouncement(kind: string, fact: string): string {
  return kind === "intent_shown" || kind === "decisive_moment" || kind === "battle_ended"
    ? fact
    : "";
}

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

  const finalCursor = Math.max(0, (result?.events.length ?? 1) - 1);
  const cursor = Math.min(playbackCursor, finalCursor);
  const currentEvent = result?.events[cursor];

  useEffect(() => {
    if (!result || !currentEvent || !playing) return;
    const delay = Math.max(10, eventDurationMs(currentEvent, reducedMotion) / speed);
    const timer = window.setTimeout(() => {
      if (cursor >= result.events.length - 1) {
        showResult(repository ?? undefined);
      } else {
        setPlaybackCursor(cursor + 1);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [currentEvent, cursor, playing, reducedMotion, repository, result, setPlaybackCursor, showResult, speed]);

  useEffect(() => {
    if (currentEvent) battleAudio.cue(currentEvent, muted);
  }, [currentEvent, muted]);

  if (!result || !currentEvent) {
    return (
      <section className="screen recovery-screen">
        <h1>Battle unavailable</h1>
        <p>No validated battle result was supplied.</p>
      </section>
    );
  }

  const encounter = ENCOUNTERS[result.command.encounterId];
  const units = unitsAtEvent(result, cursor);
  const intent = intentAtEvent(result, cursor);
  const contact = contactCueForEvent(currentEvent);
  const deltas = eventUnitDeltas(result, cursor);
  const displayActorId = contact?.actorId ?? intent?.actorId;
  const displayTargetIds = contact?.targetIds ?? intent?.targetIds ?? [];
  const displayActionId = contact?.actionId ?? intent?.actionId;
  const fact = eventFact(currentEvent);
  const signature = currentEvent.kind === "signature_triggered";
  const decisive = currentEvent.kind === "decisive_moment";
  const eventClass = decisive ? "event-decisive" : signature ? "event-signature" : "event-normal";

  const skipToResult = () => {
    setPlaying(false);
    setPlaybackCursor(result.events.length - 1);
    showResult(repository ?? undefined);
  };

  return (
    <section
      className={`screen battle-screen ${eventClass}${reducedMotion ? " reduce-motion" : ""}`}
      aria-labelledby="battle-heading"
    >
      <header className="battle-header">
        <div className="battle-title">
          <span className="eyebrow">Battle - Round {currentEvent.round}</span>
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

      <div className="enemy-rule-banner battle-rule">
        <strong>{UI_COPY.enemyRule}</strong>
        <span>{encounter.tell}</span>
      </div>

      <div className="battle-stage">
        <Battlefield
          units={units}
          targetIds={displayTargetIds}
          deltas={deltas}
          reactionTargetIds={contact?.targetIds ?? []}
          {...(displayActorId ? { actorId: displayActorId } : {})}
          {...(contact ? { reaction: contact.reaction } : {})}
        />
        <div className="intent-card" aria-label="Current intent">
          {displayActorId && displayTargetIds.length > 0 && displayActionId ? (
            <>
              <span className="intent-label">{contact ? "Contact" : "Intent"}</span>
              <strong>
                {unitName(displayActorId)} to {displayTargetIds.map(unitName).join(", ")}
              </strong>
              <span>{ACTION_NAMES[displayActionId]}</span>
            </>
          ) : (
            <span>Waiting for the next intent.</span>
          )}
        </div>
        {signature ? (
          <div className="emphasis-callout signature-callout">
            <span>Signature</span>
            <strong>{fact}</strong>
          </div>
        ) : null}
        {decisive ? (
          <div className="emphasis-callout decisive-callout">
            <span>{UI_COPY.turningPoint}</span>
            <strong>{fact}</strong>
          </div>
        ) : null}
      </div>

      <footer className="battle-fact-strip">
        <div>
          <span className="eyebrow">Current fact</span>
          <p>{fact}</p>
        </div>
        <div className="fact-actions">
          <button className="button button-quiet" type="button" onClick={() => openInspector(currentEvent.eventId)}>
            {UI_COPY.exactEvents}
          </button>
          <span aria-label={`Event ${cursor + 1} of ${result.events.length}`}>
            {cursor + 1} / {result.events.length}
          </span>
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
        {liveAnnouncement(currentEvent.kind, fact)}
      </p>
      <EventInspector result={result} currentEventId={currentEvent.eventId} />
    </section>
  );
}
