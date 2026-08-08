/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CombatVisual } from "../../src/ui/CombatVisual";
import {
  ACTION_VISUAL_IDS,
  COMBAT_ASSET_MANIFEST,
  COMBAT_FALLBACK_MANIFEST,
  EFFECT_VISUAL_IDS,
  FALLBACK_VISUAL_IDS,
  STATUS_VISUAL_IDS,
  UNIT_VISUAL_IDS,
  combatAssetDefinitionSchema,
  resolveUnitVisual,
} from "../../src/ui/assets";

describe("combat asset fallback contract", () => {
  afterEach(cleanup);

  it("validates stable unit, action, status, and effect hooks without raster sources", () => {
    const expectedIds = [
      ...UNIT_VISUAL_IDS,
      ...ACTION_VISUAL_IDS,
      ...STATUS_VISUAL_IDS,
      ...EFFECT_VISUAL_IDS,
    ];
    expect(Object.keys(COMBAT_ASSET_MANIFEST)).toEqual(expectedIds);
    for (const definition of Object.values(COMBAT_ASSET_MANIFEST)) {
      expect(combatAssetDefinitionSchema.parse(definition)).toEqual(definition);
      expect(definition.source).toBeNull();
      expect(definition.fallbackId).toMatch(/^fallback\./);
    }
    expect(Object.keys(COMBAT_FALLBACK_MANIFEST)).toEqual(FALLBACK_VISUAL_IDS);
    for (const definition of Object.values(COMBAT_FALLBACK_MANIFEST)) {
      expect(combatAssetDefinitionSchema.parse(definition)).toEqual(definition);
      expect(definition.source).toBeNull();
    }
  });

  it("uses fixed CSS geometry without requesting a missing image", () => {
    render(
      <CombatVisual
        unitId="bo"
        actionId="heavy_hit"
        statusIds={["status.marked"]}
        effectIds={["effect.damage"]}
      />,
    );
    const visual = document.querySelector("[data-visual-id='unit.bo']");

    expect(resolveUnitVisual("bo").kind).toBe("css");
    expect(visual).toHaveAttribute("data-fallback-visual-id", "fallback.role.damage");
    expect(visual).toHaveAttribute("data-resolved-visual-id", "fallback.css");
    expect(visual).toHaveAttribute("data-action-visual-id", "action.heavy_hit");
    expect(visual).toHaveAttribute("data-status-visual-ids", "status.marked");
    expect(visual).toHaveAttribute("data-effect-visual-ids", "effect.damage");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(visual?.querySelector(".silhouette-body")).toBeInTheDocument();
  });
});
