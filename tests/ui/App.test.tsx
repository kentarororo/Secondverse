/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/App";
import {
  COMBAT_LAB_SAVE_KEY,
  createCombatLabSaveRepository,
  type StorageLike,
} from "../../src/save";
import { useStudioStore } from "../../src/state/studioStore";
import { momentDurationMs, selectPlaybackMoments } from "../../src/ui/moments";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class UnavailableStorage implements StorageLike {
  getItem(): string | null {
    throw new Error("unavailable");
  }

  setItem(): void {
    throw new Error("unavailable");
  }

  removeItem(): void {
    throw new Error("unavailable");
  }
}

describe("combat lab journey", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.HTMLElement.prototype.scrollIntoView = () => undefined;
    useStudioStore.getState().resetLab();
  });

  afterEach(() => {
    cleanup();
  });

  it("moves from preparation through battle to the typed result", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Pressure the Rear", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/marks the hero in the rear slot before every third action it takes/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Battle details" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start battle" }));
    expect(screen.getByRole("button", { name: "Skip to result" })).toBeInTheDocument();
    expect(screen.getByLabelText("Battlefield")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Skip to result" }));
    expect(screen.getByRole("heading", { name: /Result: (Win|Loss|Draw)/ })).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Turning point" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Battle result" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Aftermath" })).toHaveTextContent(
      "Bo is Bruised. This hero was knocked out and starts the next battle with Max HP reduced from 84 to 72.",
    );
    const sourceEventId = useStudioStore.getState().aftermathFact?.sourceEventId;
    fireEvent.click(screen.getByRole("button", { name: "Show knockout detail" }));
    expect(useStudioStore.getState().focusedEventId).toBe(sourceEventId);
  });

  it("starts in Key moments, offers grouped Every action playback, and shows all three stances", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Start battle" }));

    expect(screen.getByRole("button", { name: "Key moments" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Every action" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("region", { name: "Current moment" })).toHaveTextContent(
      "Key moment 1 of",
    );
    const tracker = screen.getByRole("region", { name: "Plan tracker" });
    expect(within(tracker).getAllByRole("listitem")).toHaveLength(3);
    expect(tracker).toHaveTextContent("AdaBrace under pressureNot used yet");
    expect(tracker).toHaveTextContent("BoHit frontNot used yet");
    expect(tracker).toHaveTextContent("CyAid oneNot used yet");

    const result = useStudioStore.getState().result;
    expect(result).not.toBeNull();
    if (!result) return;
    fireEvent.click(screen.getByRole("button", { name: "Every action" }));
    expect(screen.getByRole("button", { name: "Every action" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("region", { name: "Current moment" })).toHaveTextContent(
      `Moment 1 of ${result.actionCount + 2}`,
    );
    expect(useStudioStore.getState().playbackCursor).toBe(0);
  });

  it("advances the raw cursor to grouped moment ends and keeps the causal summary in reduced motion", () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: "Start battle" }));
      const result = useStudioStore.getState().result;
      expect(result).not.toBeNull();
      if (!result) return;
      const playback = selectPlaybackMoments(result, "key");
      const firstSummary = screen.getByRole("region", { name: "Current moment" }).textContent;
      fireEvent.click(screen.getByRole("checkbox", { name: "Reduced motion" }));
      expect(screen.getByRole("region", { name: "Current moment" })).toHaveTextContent(
        "The battle begins.",
      );
      expect(screen.getByRole("region", { name: "Current moment" }).textContent).toBe(
        firstSummary,
      );

      act(() => {
        vi.advanceTimersByTime(momentDurationMs(playback[0]!.moment, true) + 1);
      });
      expect(useStudioStore.getState().playbackCursor).toBe(
        playback[1]!.moment.endEventIndex,
      );
      expect(screen.getByRole("region", { name: "Current moment" })).toHaveAccessibleName(
        "Current moment",
      );
      expect(screen.getAllByText("→")).toHaveLength(2);
      const advanced = playback.find((entry) => entry.routineActionsAdvanced > 0);
      expect(advanced).toBeDefined();
      if (advanced) {
        act(() => {
          useStudioStore.getState().setPlaying(false);
          useStudioStore.getState().setPlaybackCursor(advanced.moment.endEventIndex);
        });
        expect(screen.getByText(
          `${advanced.routineActionsAdvanced} routine ${advanced.routineActionsAdvanced === 1 ? "action has" : "actions have"} passed.`,
        )).toBeVisible();
      }
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it("shows one of two real stances for every hero and changes only the selected hero", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /front Ada/i })).toHaveTextContent(
      "Stance: Brace under pressure",
    );
    expect(screen.getByRole("button", { name: /middle Cy/i })).toHaveTextContent(
      "Stance: Aid one",
    );
    expect(screen.getByRole("button", { name: /rear Bo/i })).toHaveTextContent(
      "Stance: Hit front",
    );

    const adaStances = screen.getByRole("group", { name: "Ada stance" });
    expect(within(adaStances).getAllByRole("radio")).toHaveLength(2);
    expect(within(adaStances).getByRole("radio", { name: /Brace early.*18 guard/i })).toBeVisible();
    expect(
      within(adaStances).getByRole("radio", { name: /Brace under pressure.*26 guard/i }),
    ).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: /rear Bo/i }));
    const boStances = screen.getByRole("group", { name: "Bo stance" });
    expect(within(boStances).getAllByRole("radio")).toHaveLength(2);
    fireEvent.click(within(boStances).getByRole("radio", { name: /Finish weak/i }));

    expect(useStudioStore.getState().plan.stances).toEqual({
      ada: "ada_brace_under_pressure",
      bo: "bo_finish_weak",
      cy: "cy_aid_one",
    });
    expect(screen.getByText(/Stances: Ada — Brace under pressure; Bo — Finish weak; Cy — Aid one/i)).toBeVisible();
  });

  it("keeps preparation choices reversible and opens the second encounter with confirmed equipment", () => {
    const repository = createCombatLabSaveRepository(new MemoryStorage());
    render(<App repository={repository} />);

    fireEvent.click(screen.getByRole("button", { name: "Move to middle" }));
    expect(useStudioStore.getState().plan.formation.front).toBe("cy");

    fireEvent.click(screen.getByRole("button", { name: "Start battle" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip to result" }));
    expect(screen.getByRole("button", { name: "Next encounter" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Confirm equipment" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /Quick Shoes/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm equipment" }));
    fireEvent.click(screen.getByRole("button", { name: "Next encounter" }));

    expect(screen.getByRole("heading", { name: "Punish the Front", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/At 3 Strain, that hero is Broken/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Front equipment" })).toHaveTextContent(
      "Quick Shoes",
    );
    expect(useStudioStore.getState().plan.frontEquipment).toBe("quick_shoes");
    expect(useStudioStore.getState().plan.priorCondition).toEqual(
      expect.objectContaining({ kind: "bruised", heroId: "bo", healthPenalty: 12 }),
    );
  });

  it("persists confirmed equipment, preferences, and progress and resumes the second encounter", async () => {
    const storage = new MemoryStorage();
    const repository = createCombatLabSaveRepository(storage);
    const first = render(<App repository={repository} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Reduced motion" }));
    fireEvent.click(screen.getByRole("button", { name: "Mute sound" }));
    fireEvent.click(screen.getByRole("button", { name: "Start battle" }));
    fireEvent.click(screen.getByRole("button", { name: "1.5x" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip to result" }));

    const heavy = screen.getByRole("radio", { name: /Heavy Pad/i });
    const quick = screen.getByRole("radio", { name: /Quick Shoes/i });
    fireEvent.click(quick);
    expect(quick).toBeChecked();
    fireEvent.click(heavy);
    expect(heavy).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Confirm equipment" }));

    expect(repository.load()).toEqual(
      expect.objectContaining({
        status: "loaded",
        value: expect.objectContaining({
          selectedEquipment: "heavy_pad",
          aftermathCondition: expect.objectContaining({
            kind: "bruised",
            heroId: "bo",
            healthPenalty: 12,
            sourceEventId: expect.any(String),
          }),
          progress: { pressureRearCompleted: true, punishFrontCompleted: false },
          preferences: { reducedMotion: true, audioEnabled: false, battleSpeed: 1.5 },
        }),
      }),
    );

    first.unmount();
    useStudioStore.getState().resetLab();
    render(<App repository={repository} />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Punish the Front", level: 1 }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("region", { name: "Front equipment" })).toHaveTextContent(
      "Ada starts in the front slot with Guard +18 and Speed -3 from Heavy Pad.",
    );
    const bruisedCondition = screen.getByRole("region", { name: "Prior condition" });
    expect(bruisedCondition).toHaveTextContent("Bo: Bruised");
    expect(bruisedCondition).toHaveTextContent(
      "Bo starts this battle at 72/72 HP. Bruised reduces Max HP from 84 to 72.",
    );
    expect(screen.getByRole("button", { name: /rear Bo/i })).toHaveTextContent(
      "Bruised: HP 72/72; Max HP −12",
    );
    const bruisedStart = screen.getByRole("button", {
      name: "Start with Bo Bruised · −12 max HP",
    });
    expect(bruisedStart).toBeVisible();
    fireEvent.click(bruisedStart);
    expect(useStudioStore.getState().result?.command.plan.frontEquipment).toBe("heavy_pad");
    expect(useStudioStore.getState().result?.command.plan.priorCondition).toEqual(
      expect.objectContaining({ kind: "bruised", heroId: "bo", healthPenalty: 12 }),
    );
  });

  it("shows and persists an explicit no-injury aftermath when no hero was knocked out", () => {
    const storage = new MemoryStorage();
    const repository = createCombatLabSaveRepository(storage);
    render(<App repository={repository} />);

    fireEvent.click(screen.getByRole("button", { name: "Move to middle" }));
    fireEvent.click(screen.getByRole("button", { name: /rear Bo/i }));
    fireEvent.click(screen.getByRole("button", { name: "Move to front" }));
    fireEvent.click(screen.getByRole("radio", { name: /Cover rear/i }));
    fireEvent.click(screen.getByRole("button", { name: "Start battle" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip to result" }));

    expect(screen.getByRole("region", { name: "Aftermath" })).toHaveTextContent(
      "No injury. No hero was knocked out.",
    );
    fireEvent.click(screen.getByRole("radio", { name: /Quick Shoes/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm equipment" }));
    expect(repository.load()).toEqual(
      expect.objectContaining({
        status: "loaded",
        value: expect.objectContaining({ aftermathCondition: null }),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next encounter" }));

    const noInjuryCondition = screen.getByRole("region", { name: "Prior condition" });
    expect(noInjuryCondition).toHaveTextContent("No injury");
    expect(noInjuryCondition).toHaveTextContent(
      "No hero was knocked out in Pressure the Rear. The team starts with full Max HP.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Start battle" }));
    expect(useStudioStore.getState().result?.command.plan.priorCondition).toBeNull();
  });

  it("offers recoverable actions for malformed saved data", async () => {
    const storage = new MemoryStorage();
    storage.setItem(COMBAT_LAB_SAVE_KEY, "{broken");
    const repository = createCombatLabSaveRepository(storage);
    render(<App repository={repository} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("This save is damaged");
    expect(screen.getByRole("button", { name: "Delete saved data" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete saved data" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pressure the Rear", level: 1 })).toBeInTheDocument();
    expect(repository.load()).toEqual({ status: "empty" });
  });

  it("can continue clean after incompatible saved data", async () => {
    const storage = new MemoryStorage();
    storage.setItem(COMBAT_LAB_SAVE_KEY, JSON.stringify({ version: 99 }));
    const repository = createCombatLabSaveRepository(storage);
    render(<App repository={repository} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("current build");
    fireEvent.click(screen.getByRole("button", { name: "Start without saved data" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("can continue clean when browser storage cannot be read", async () => {
    const repository = createCombatLabSaveRepository(new UnavailableStorage());
    render(<App repository={repository} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be opened");
    fireEvent.click(screen.getByRole("button", { name: "Start without saved data" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
