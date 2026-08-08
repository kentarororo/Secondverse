/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/App";
import { DEFAULT_PLAN, useStudioStore } from "../../src/state/studioStore";

describe("candidate draft lab", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    window.localStorage.clear();
    useStudioStore.getState().resetLab();
  });

  afterEach(() => cleanup());

  it("shows three generated mechanical candidates without trial language or changing the battle team", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Candidates" }));

    expect(screen.getByText("Candidate set 1", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Choose a fighter" })).toBeInTheDocument();
    expect(screen.getByText(/current team stays unchanged/i)).toBeInTheDocument();
    expect(screen.queryByText(/trial/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getAllByText("Signature")).toHaveLength(3);
    expect(screen.getAllByText("Starting techniques")).toHaveLength(3);
    expect(screen.getAllByText("Starting stats")).toHaveLength(3);
    expect(screen.getAllByText("Candidate details")).toHaveLength(3);
    const firstCard = screen.getAllByRole("article")[0];
    if (!firstCard) throw new Error("Missing first candidate card");
    const firstDetails = within(firstCard).getByText("Candidate details");
    expect(within(firstCard).getByText("Build fingerprint")).not.toBeVisible();

    fireEvent.click(firstDetails);
    expect(within(firstCard).getByText("Growth clue")).toBeVisible();
    expect(within(firstCard).getByText("Exact later growth is still unknown.")).toBeVisible();
    expect(within(firstCard).getByText("Build fingerprint")).toBeVisible();
    expect(useStudioStore.getState().plan).toEqual(DEFAULT_PLAN);
  });

  it("records one favorite and clears it when the player asks for a new set", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Candidates" }));

    const firstCard = screen.getAllByRole("article")[0];
    if (!firstCard) throw new Error("Missing first candidate card");
    const choose = within(firstCard).getByRole("button", { name: /^Select / });
    const firstRosterId = useStudioStore.getState().candidateRoster?.rosterId;

    fireEvent.click(choose);
    expect(choose).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status", { name: "Selected fighter" })).toHaveTextContent(
      "Selected exact build",
    );
    expect(screen.getByRole("status", { name: "Selected fighter" })).toHaveTextContent(
      "This exact build stays selected",
    );
    expect(screen.getByRole("status", { name: "Selected fighter" })).toHaveClass(
      "candidate-selection-tray",
    );
    expect(screen.queryByRole("button", { name: /trial/i })).not.toBeInTheDocument();
    expect(useStudioStore.getState().favoriteCandidateId).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show new candidates" }));
    expect(useStudioStore.getState().candidateSetNumber).toBe(2);
    expect(useStudioStore.getState().candidateRoster?.rosterId).not.toBe(firstRosterId);
    expect(useStudioStore.getState().favoriteCandidateId).toBeNull();
    expect(screen.getByText("Candidate set 2", { exact: true })).toBeInTheDocument();
  });

  it("keeps the generated set while moving between the candidate lab and preparation", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Candidates" }));
    const rosterId = useStudioStore.getState().candidateRoster?.rosterId;

    fireEvent.click(screen.getByRole("button", { name: "Return to team preparation" }));
    expect(screen.getByRole("heading", { name: "Pressure the Rear" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Lab sections" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Candidates" }));

    expect(useStudioStore.getState().candidateRoster?.rosterId).toBe(rosterId);
  });
});
