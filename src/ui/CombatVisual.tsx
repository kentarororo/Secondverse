import { useState } from "react";
import type { ActionId, UnitId } from "../sim";
import {
  actionVisualId,
  resolveUnitVisual,
  type EffectVisualId,
  type StatusVisualId,
} from "./assets";
import { silhouetteVariant } from "./presentation";

interface CombatVisualProps {
  readonly unitId: UnitId;
  readonly actionId?: ActionId;
  readonly statusIds?: readonly StatusVisualId[];
  readonly effectIds?: readonly EffectVisualId[];
  readonly className?: string;
}

export function CombatVisual({
  unitId,
  actionId,
  statusIds = [],
  effectIds = [],
  className = "",
}: CombatVisualProps) {
  const [failedVisualIds, setFailedVisualIds] = useState<readonly string[]>([]);
  const resolved = resolveUnitVisual(unitId, failedVisualIds);
  const classes = `unit-silhouette ${resolved.cssClassName} variant-${silhouetteVariant(unitId)}${className ? ` ${className}` : ""}`;

  return (
    <div
      className={classes}
      aria-hidden="true"
      data-visual-id={resolved.visualId}
      data-visual-source={resolved.kind}
      data-fallback-visual-id={resolved.definition.fallbackId}
      data-resolved-visual-id={resolved.resolvedVisualId}
      data-action-visual-id={actionId ? actionVisualId(actionId) : undefined}
      data-status-visual-ids={statusIds.length > 0 ? statusIds.join(" ") : undefined}
      data-effect-visual-ids={effectIds.length > 0 ? effectIds.join(" ") : undefined}
    >
      {resolved.kind === "asset" && resolved.definition.source ? (
        <img
          className="combat-sprite"
          src={resolved.definition.source.path}
          width={resolved.definition.layout.width}
          height={resolved.definition.layout.height}
          alt=""
          onError={() =>
            setFailedVisualIds((current) =>
              current.includes(resolved.definition.id)
                ? current
                : [...current, resolved.definition.id],
            )
          }
        />
      ) : (
        <>
          <span className="silhouette-head" />
          <span className="silhouette-body" />
          <span className="silhouette-detail" />
        </>
      )}
    </div>
  );
}
