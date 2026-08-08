import type { ActionId, UnitSnapshot } from "../sim";
import { CombatVisual } from "./CombatVisual";
import {
  effectVisualIdsForDeltas,
  silhouetteClassNames,
  type ReactionKind,
  type StanceRibbon,
  type UnitDelta,
  type UnitStatusCue,
} from "./presentation";

interface UnitCardProps {
  readonly unit: UnitSnapshot;
  readonly acting?: boolean;
  readonly targeted?: boolean;
  readonly final?: boolean;
  readonly deltas?: readonly UnitDelta[];
  readonly reaction?: ReactionKind;
  readonly statusCues?: readonly UnitStatusCue[];
  readonly stanceRibbon?: StanceRibbon | null;
  readonly actionId?: ActionId;
  readonly feedbackKey?: string;
}

function percent(value: number, maximum: number): number {
  return maximum > 0 ? Math.max(0, Math.min(100, (value / maximum) * 100)) : 0;
}

export function UnitCard({
  unit,
  acting = false,
  targeted = false,
  final = false,
  deltas = [],
  reaction,
  statusCues = [],
  stanceRibbon,
  actionId,
  feedbackKey,
}: UnitCardProps) {
  const states = [
    unit.guard > 0 ? `Guard ${unit.guard}` : null,
    unit.techniquePoints > 0 && unit.side === "heroes"
      ? `Points ${unit.techniquePoints} of 3`
      : null,
    unit.strain > 0 ? `Strain ${unit.strain} of 3` : null,
  ].filter((state): state is string => state !== null);
  const statusLabels = statusCues.map((status) => status.label);
  const reactionLabel =
    reaction === "damage"
      ? "Hit"
      : reaction === "heal"
        ? "Healed"
        : reaction === "break"
          ? "Broken"
          : reaction === "defeat"
            ? "Defeated"
            : null;

  return (
    <article
      className={`unit-card side-${unit.side} slot-${unit.slot} ${silhouetteClassNames(unit.id)}${acting ? " is-acting" : ""}${targeted ? " is-targeted" : ""}${reaction ? ` reaction-${reaction}` : ""}${unit.defeated ? " is-defeated" : ""}${final ? " is-final" : ""}`}
      aria-label={`${unit.name}, ${unit.side === "heroes" ? "your team" : "enemy"}, ${unit.slot} slot. HP ${unit.health} of ${unit.maxHealth}. Speed ${unit.speed}.${statusLabels.length > 0 ? ` ${statusLabels.join(", ")}.` : ""}${states.length > 0 ? ` ${states.join(". ")}.` : ""}${stanceRibbon ? ` Stance used: ${stanceRibbon.name}. ${stanceRibbon.detail}${/[.!?]$/.test(stanceRibbon.detail) ? "" : "."}` : ""}${deltas.length > 0 ? ` Current change: ${deltas.map((delta) => delta.text).join(", ")}.` : ""}`}
      data-unit-id={unit.id}
    >
      <div className="unit-state-labels" aria-hidden="true">
        {acting ? <span className="state-flag acting-flag">Acting</span> : null}
        {targeted ? <span className="state-flag target-flag">Target</span> : null}
        {reactionLabel ? <span className={`state-flag reaction-flag reaction-flag-${reaction}`}>{reactionLabel}</span> : null}
      </div>
      <CombatVisual
        unitId={unit.id}
        {...(actionId ? { actionId } : {})}
        statusIds={statusCues.map((status) => status.visualId)}
        effectIds={effectVisualIdsForDeltas(deltas)}
      />
      {stanceRibbon ? (
        <div className="stance-ribbon" aria-label={`${stanceRibbon.name} stance used`}>
          <span>
            {stanceRibbon.trigger === "condition" ? "Condition met" : stanceRibbon.trigger === "forced" ? "Used at the Points cap" : "Ready"}
          </span>
          <strong>{stanceRibbon.name}</strong>
          <small>{stanceRibbon.detail}</small>
        </div>
      ) : null}
      {deltas.length > 0 ? (
        <div className="unit-deltas" aria-label={`${unit.name} current changes`}>
          {deltas.map((delta) => (
            <span
              className={`unit-delta delta-${delta.kind} ${delta.kind === "health" ? "delta-primary" : "delta-secondary"} ${delta.amount >= 0 ? "delta-gain" : "delta-loss"}`}
              key={`${feedbackKey ?? "feedback"}-${delta.kind}-${delta.text}-${delta.amount}`}
              aria-label={delta.text}
            >
              {delta.kind === "health" ? (
                <>
                  <small>HP</small>
                  <strong>{delta.amount >= 0 ? "+" : "−"}{Math.abs(delta.amount)}</strong>
                </>
              ) : delta.text}
            </span>
          ))}
        </div>
      ) : null}
      <div className="unit-copy">
        <div className="unit-title-row">
          <strong>{unit.name}</strong>
          <span className="slot-label">{unit.slot}</span>
        </div>
        <div className="meter-row health-row">
          <span>HP</span>
          <span>
            {unit.health}/{unit.maxHealth}
          </span>
        </div>
        <div
          className="meter health-meter"
          role="progressbar"
          aria-label={`${unit.name} health`}
          aria-valuemin={0}
          aria-valuemax={unit.maxHealth}
          aria-valuenow={unit.health}
        >
          <span style={{ width: `${percent(unit.health, unit.maxHealth)}%` }} />
        </div>
        <div className="unit-exacts" aria-hidden="true">
          <span>Speed {unit.speed}</span>
          <span>Guard {unit.guard}</span>
          {unit.side === "heroes" ? <span>Points {unit.techniquePoints}/3</span> : null}
          {unit.strain > 0 ? <span>Strain {unit.strain}/3</span> : null}
        </div>
        {statusLabels.length > 0 || states.length > 0 ? (
          <ul className="status-list" aria-label={`${unit.name} statuses`}>
            {statusCues.map((status) => (
              <li
                className={`status-cue status-${status.kind}`}
                data-status-visual-id={status.visualId}
                key={`${status.kind}-${status.label}`}
              >
                {status.label}
              </li>
            ))}
            {states.slice(0, 3).map((state) => (
              <li key={state}>{state}</li>
            ))}
          </ul>
        ) : (
          <span className="no-status">No status</span>
        )}
      </div>
    </article>
  );
}
