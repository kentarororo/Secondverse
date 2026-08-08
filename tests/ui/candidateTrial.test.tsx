/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/App";
import { useStudioStore } from "../../src/state/studioStore";

function selectFirstCandidateAndStart(): string {
  fireEvent.click(screen.getByRole("button", { name: "Candidate trial" }));
  const firstCard = screen.getAllByRole("article")[0];
  if (!firstCard) throw new Error("Missing first candidate card");
  const name = within(firstCard).getByRole("heading", { level: 2 }).textContent;
  if (!name) throw new Error("Missing first candidate name");
  fireEvent.click(within(firstCard).getByRole("button", { name: `Select ${name}` }));
  fireEvent.click(screen.getByRole("button", { name: `Start ${name}'s trial` }));
  return name;
}

describe("candidate battle trial journey", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useStudioStore.getState().resetLab();
  });

  afterEach(() => cleanup());

  it("starts the selected deterministic candidate in a battlefield-first trial", () => {
    render(<App />);
    const name = selectFirstCandidateAndStart();
    const result = useStudioStore.getState().candidateTrialResult;

    expect(result).not.toBeNull();
    expect(result?.candidate.identity.displayName).toBe(name);
    expect(result?.initialUnits).toHaveLength(6);
    expect(screen.getByRole("heading", { name: `${name}'s battle trial` })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Candidate trial battlefield" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Trial playback controls" })).toBeInTheDocument();
    expect(screen.getByText(/A round ends after every living fighter has one action/i)).toBeVisible();
    expect(screen.getByRole("region", { name: "Current trial moment" })).toHaveTextContent(
      "Key moment 1 of",
    );
    expect(screen.getByRole("heading", { name: "Rule tracker" })).toBeInTheDocument();
    expect(screen.getAllByText("Setup", { exact: true }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Round 0/i)).not.toBeInTheDocument();
  });

  it("skips to an exact kit report and keeps the selected fighter", () => {
    render(<App />);
    const name = selectFirstCandidateAndStart();
    fireEvent.click(screen.getByRole("button", { name: "Skip to trial result" }));

    expect(screen.getByRole("heading", { name: /Trial result: (Win|Loss|Draw)/ })).toHaveFocus();
    const report = screen.getByRole("region", { name: `What ${name}'s kit did` });
    expect(within(report).getAllByRole("article")).toHaveLength(3);
    expect(report).toHaveTextContent("Signature");
    expect(report).toHaveTextContent("Advantage");
    expect(report).toHaveTextContent("Risk");
    expect(report).toHaveTextContent(/Triggered \d+ (time|times)|required action|threshold|did not reach/i);
    expect(report).toHaveTextContent("Combat outcome:");
    expect(screen.getByText("How starting stats became battle values")).toBeInTheDocument();
    expect(screen.getAllByText("Battle details")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: `Keep ${name} selected` }));
    expect(screen.getByRole("heading", { name: "Choose a fighter to test" })).toBeInTheDocument();
    expect(useStudioStore.getState().favoriteCandidateId).toBe(
      useStudioStore.getState().candidateTrialResult?.candidate.candidateId,
    );
    expect(screen.getByRole("button", { name: `Start ${name}'s trial` })).toBeInTheDocument();
  });

  it("replays the same selected candidate and battle seed identically", () => {
    const firstRender = render(<App />);
    selectFirstCandidateAndStart();
    const first = useStudioStore.getState().candidateTrialResult;
    expect(first).not.toBeNull();

    firstRender.unmount();
    useStudioStore.getState().resetLab();
    render(<App />);
    selectFirstCandidateAndStart();
    expect(useStudioStore.getState().candidateTrialResult).toEqual(first);
  });
});
