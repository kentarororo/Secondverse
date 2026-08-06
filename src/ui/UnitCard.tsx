import type { UnitSnapshot } from "../sim";
import {
  silhouetteClassNames,
  type ReactionKind,
  type UnitDelta,
} from "./presentation";

interface UnitCardProps {
  readonly unit: UnitSnapshot;
  readonly acting?: boolean;
  readonly targeted?: boolean;
  readonly final?: boolean;
  readonly deltas?: readonly UnitDelta[];
  readonly reaction?: ReactionKind;
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
}: UnitCardProps) {
  const states = [
    unit.guard > 0 ? `Guard ${unit.guard}` : null,
    unit.techniquePoints > 0 && unit.side === "heroes"
      ? `Technique ${unit.techniquePoints} of 3`
      : null,
    unit.strain > 0 ? `Strain ${unit.strain} of 3` : null,
    unit.broken ? "Broken" : null,
    unit.defeated ? "Defeated" : null,
  ].filter((state): state is string => state !== null);
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
      aria-label={`${unit.name}, ${unit.side === "heroes" ? "your team" : "enemy"}, ${unit.slot}, ${unit.health} of ${unit.maxHealth} health, speed ${unit.speed}${states.length > 0 ? `, ${states.join(", ")}` : ""}${deltas.length > 0 ? `, current change ${deltas.map((delta) => delta.text).join(", ")}` : ""}`}
      data-unit-id={unit.id}
    >
      <div className="unit-state-labels" aria-hidden="true">
        {acting ? <span className="state-flag acting-flag">Acting</span> : null}
        {targeted ? <span className="state-flag target-flag">Target</span> : null}
        {reactionLabel ? <span className={`state-flag reaction-flag reaction-flag-${reaction}`}>{reactionLabel}</span> : null}
      </div>
      <div className="unit-silhouette" aria-hidden="true">
        <span className="silhouette-head" />
        <span className="silhouette-body" />
        <span className="silhouette-detail" />
      </div>
      {deltas.length > 0 ? (
        <div className="unit-deltas" aria-label={`${unit.name} current changes`}>
          {deltas.map((delta) => (
            <span
              className={`unit-delta delta-${delta.kind} ${delta.amount >= 0 ? "delta-gain" : "delta-loss"}`}
              key={`${delta.kind}-${delta.text}-${delta.amount}`}
            >
              {delta.text}
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
        {states.length > 0 ? (
          <ul className="status-list" aria-label={`${unit.name} statuses`}>
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
