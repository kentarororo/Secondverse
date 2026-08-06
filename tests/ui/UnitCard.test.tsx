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
      />,
    );

    const card = screen.getByRole("article");
    expect(card).toHaveClass("identity-ada", "role-guard", "reaction-damage", "is-targeted");
    expect(screen.getByText("HP −12")).toBeVisible();
    expect(card).toHaveAccessibleName(/current change HP −12/i);
  });
});
