/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/App";
import { DEFAULT_PLAN, useStudioStore } from "../../src/state/studioStore";

describe("candidate draft lab", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useStudioStore.getState().resetLab();
  });

  afterEach(() => cleanup());

  it("shows three generated mechanical candidates without changing the battle team", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Candidate trial" }));

    expect(screen.getByRole("heading", { name: "Choose a future recruit" })).toBeInTheDocument();
    expect(screen.getByText(/does not change the current battle team yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getAllByText("Signature")).toHaveLength(3);
    expect(screen.getAllByText("Starting techniques")).toHaveLength(3);
    expect(screen.getAllByText("Build fingerprint")).toHaveLength(3);
    expect(useStudioStore.getState().plan).toEqual(DEFAULT_PLAN);
  });

  it("records one favorite and clears it when the player asks for a new set", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Candidate trial" }));

    const firstCard = screen.getAllByRole("article")[0];
    if (!firstCard) throw new Error("Missing first candidate card");
    const choose = within(firstCard).getByRole("button", { name: /^Choose / });
    const firstRosterId = useStudioStore.getState().candidateRoster?.rosterId;

    fireEvent.click(choose);
    expect(choose).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Favorite recorded:");
    expect(useStudioStore.getState().favoriteCandidateId).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show new candidates" }));
    expect(useStudioStore.getState().candidateSetNumber).toBe(2);
    expect(useStudioStore.getState().candidateRoster?.rosterId).not.toBe(firstRosterId);
    expect(useStudioStore.getState().favoriteCandidateId).toBeNull();
  });

  it("keeps the generated set while moving between the candidate lab and preparation", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Candidate trial" }));
    const rosterId = useStudioStore.getState().candidateRoster?.rosterId;

    fireEvent.click(screen.getByRole("button", { name: "Battle preparation" }));
    expect(screen.getByRole("heading", { name: "Pressure the Rear" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Candidate trial" }));

    expect(useStudioStore.getState().candidateRoster?.rosterId).toBe(rosterId);
  });
});
