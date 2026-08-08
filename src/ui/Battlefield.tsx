import type { ActionId, UnitId, UnitSnapshot } from "../sim";
import { UnitCard } from "./UnitCard";
import type {
  ReactionKind,
  StanceRibbon,
  UnitDelta,
  UnitStatusCue,
} from "./presentation";

interface BattlefieldProps {
  readonly units: readonly UnitSnapshot[];
  readonly actorId?: UnitId;
  readonly targetIds?: readonly UnitId[];
  readonly final?: boolean;
  readonly deltas?: readonly UnitDelta[];
  readonly reactionTargetIds?: readonly UnitId[];
  readonly reaction?: ReactionKind;
  readonly statusCues?: readonly UnitStatusCue[];
  readonly stanceRibbon?: StanceRibbon | null;
  readonly actionId?: ActionId;
  readonly feedbackKey?: string;
}

const slotRank = { front: 0, middle: 1, rear: 2 } as const;

export function Battlefield({
  units,
  actorId,
  targetIds = [],
  final = false,
  deltas = [],
  reactionTargetIds = [],
  reaction,
  statusCues = [],
  stanceRibbon,
  actionId,
  feedbackKey,
}: BattlefieldProps) {
  const ordered = (side: "heroes" | "enemies") =>
    units
      .filter((unit) => unit.side === side)
      .sort((left, right) => slotRank[left.slot] - slotRank[right.slot]);

  return (
    <div className={`battlefield${final ? " battlefield-final" : ""}`} aria-label="Battlefield">
      <section className="battle-line enemy-line" aria-label="Enemy formation">
        <h2 className="line-heading">Enemy team</h2>
        <div className="unit-line">
          {ordered("enemies").map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              acting={actorId === unit.id}
              targeted={targetIds.includes(unit.id)}
              final={final}
              deltas={deltas.filter((delta) => delta.unitId === unit.id)}
              statusCues={statusCues.filter((status) => status.unitId === unit.id)}
              {...(feedbackKey ? { feedbackKey } : {})}
              {...(stanceRibbon?.heroId === unit.id ? { stanceRibbon } : {})}
              {...(actionId && actorId === unit.id ? { actionId } : {})}
              {...(reaction && reactionTargetIds.includes(unit.id) ? { reaction } : {})}
            />
          ))}
        </div>
      </section>
      <div className="field-divider" aria-hidden="true">
        <span />
        <b>versus</b>
        <span />
      </div>
      <section className="battle-line hero-line" aria-label="Your formation">
        <h2 className="line-heading">Your team</h2>
        <div className="unit-line">
          {ordered("heroes").map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              acting={actorId === unit.id}
              targeted={targetIds.includes(unit.id)}
              final={final}
              deltas={deltas.filter((delta) => delta.unitId === unit.id)}
              statusCues={statusCues.filter((status) => status.unitId === unit.id)}
              {...(feedbackKey ? { feedbackKey } : {})}
              {...(stanceRibbon?.heroId === unit.id ? { stanceRibbon } : {})}
              {...(actionId && actorId === unit.id ? { actionId } : {})}
              {...(reaction && reactionTargetIds.includes(unit.id) ? { reaction } : {})}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
