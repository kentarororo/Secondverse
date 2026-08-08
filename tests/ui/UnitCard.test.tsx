/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { UnitSnapshot } from "../../src/sim";
import { UnitCard } from "../../src/ui/UnitCard";

const ada: UnitSnapshot = {
  id: "ada",
  name: "Ada",
  side: "heroes",
  slot: "middle",
  health: 88,
  maxHealth: 112,
  speed: 10,
  guard: 6,
  techniquePoints: 2,
  strain: 0,
  broken: false,
  defeated: false,
};

describe("UnitCard readability", () => {
  afterEach(cleanup);

  it("renders exact typed deltas at the affected stable silhouette", () => {
    render(
      <UnitCard
        unit={ada}
        targeted
        reaction="damage"
        deltas={[{ unitId: "ada", kind: "health", amount: -12, text: "HP −12" }]}
        statusCues={[
          { unitId: "ada", kind: "bruised", label: "Bruised · −12 max HP", visualId: "status.bruised" },
        ]}
        stanceRibbon={{
          heroId: "ada",
          stanceId: "ada_brace_under_pressure",
          name: "Brace under pressure",
          detail: "+26 guard · 2 points",
          trigger: "condition",
        }}
        actionId="brace"
      />,
    );

    const card = screen.getByRole("article");
    expect(card).toHaveClass("identity-ada", "role-guard", "reaction-damage", "is-targeted");
    expect(screen.getByLabelText("HP −12")).toHaveClass("delta-primary");
    expect(screen.getByText("Bruised · −12 max HP")).toBeVisible();
    expect(screen.getByLabelText("Brace under pressure stance used")).toHaveTextContent(
      "Condition metBrace under pressure+26 guard · 2 points",
    );
    expect(screen.getByText("Bruised · −12 max HP")).toHaveAttribute(
      "data-status-visual-id",
      "status.bruised",
    );
    expect(document.querySelector("[data-visual-id='unit.ada']")).toHaveAttribute(
      "data-visual-source",
      "css",
    );
    expect(document.querySelector("[data-action-visual-id='action.brace']")).toBeInTheDocument();
    expect(card).toHaveAccessibleName(/current change: HP −12/i);
  });
});
