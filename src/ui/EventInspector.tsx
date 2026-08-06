import { useEffect, useRef } from "react";
import type { BattleResult } from "../sim";
import { useStudioStore } from "../state/studioStore";
import { UI_COPY } from "./copy";
import { eventFact } from "./presentation";

interface EventInspectorProps {
  readonly result: BattleResult;
  readonly currentEventId?: string;
}

export function EventInspector({ result, currentEventId }: EventInspectorProps) {
  const open = useStudioStore((state) => state.inspectorOpen);
  const focusedEventId = useStudioStore((state) => state.focusedEventId);
  const closeInspector = useStudioStore((state) => state.closeInspector);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeInspector();
      requestAnimationFrame(() => previousFocusRef.current?.focus());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeInspector, open]);

  useEffect(() => {
    if (!open || !focusedEventId) return;
    document.getElementById(`inspector-${focusedEventId}`)?.scrollIntoView({ block: "center" });
  }, [focusedEventId, open]);

  if (!open) return null;

  const close = () => {
    closeInspector();
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  return (
    <aside className="event-inspector" aria-labelledby="event-inspector-heading">
      <header className="inspector-header">
        <div>
          <span className="eyebrow">Replay facts</span>
          <h2 id="event-inspector-heading">{UI_COPY.exactEvents}</h2>
        </div>
        <button ref={closeButtonRef} className="button button-quiet" type="button" onClick={close}>
          {UI_COPY.closeExactEvents}
        </button>
      </header>
      <p className="inspector-note">These facts come from the saved battle result.</p>
      <ol className="event-list">
        {result.events.map((event) => {
          const current = event.eventId === currentEventId;
          const focused = event.eventId === focusedEventId;
          return (
            <li
              id={`inspector-${event.eventId}`}
              key={event.eventId}
              className={`${current ? "is-current " : ""}${focused ? "is-focused" : ""}`}
              aria-current={current ? "step" : undefined}
            >
              <div className="event-meta">
                <span>Event {event.sequence + 1}</span>
                <span>Round {event.round}</span>
                <code>{event.eventId}</code>
              </div>
              <p>{eventFact(event)}</p>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
