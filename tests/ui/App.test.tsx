/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/App";
import {
  COMBAT_LAB_SAVE_KEY,
  createCombatLabSaveRepository,
  type StorageLike,
} from "../../src/save";
import { useStudioStore } from "../../src/state/studioStore";

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
    expect(screen.getByText(/marks that slot before every third action/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Exact events" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start battle" }));
    expect(screen.getByRole("button", { name: "Skip to result" })).toBeInTheDocument();
    expect(screen.getByLabelText("Battlefield")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Skip to result" }));
    expect(screen.getByRole("heading", { name: /Result: (Win|Loss|Draw)/ })).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Turning point" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Consequence" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Aftermath" })).toHaveTextContent(
      "Bo: Bruised. This hero was knocked out. Next battle maximum health −12.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Show source event" }));
    expect(useStudioStore.getState().focusedEventId).toBe("event-0073");
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
    expect(screen.getByText(/Three strain causes a break/i)).toBeInTheDocument();
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
            sourceEventId: "event-0073",
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
      "Starting guard +18; Speed -3",
    );
    const bruisedCondition = screen.getByRole("region", { name: "Prior condition" });
    expect(bruisedCondition).toHaveTextContent("Bo: Bruised");
    expect(bruisedCondition).toHaveTextContent(
      "Next battle HP 72/72. Maximum health −12 from 84.",
    );
    expect(screen.getByRole("button", { name: /rear Bo/i })).toHaveTextContent(
      "Bruised: HP 72/72, Max HP −12",
    );
    fireEvent.click(screen.getByRole("button", { name: "Start battle" }));
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
      "No hero was knocked out in Pressure the Rear. Starting health is unchanged.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Start battle" }));
    expect(useStudioStore.getState().result?.command.plan.priorCondition).toBeNull();
  });

  it("offers recoverable actions for malformed saved data", async () => {
    const storage = new MemoryStorage();
    storage.setItem(COMBAT_LAB_SAVE_KEY, "{broken");
    const repository = createCombatLabSaveRepository(storage);
    render(<App repository={repository} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Saved data is damaged");
    expect(screen.getByRole("button", { name: "Clear saved data" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear saved data" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pressure the Rear", level: 1 })).toBeInTheDocument();
    expect(repository.load()).toEqual({ status: "empty" });
  });

  it("can continue clean after incompatible saved data", async () => {
    const storage = new MemoryStorage();
    storage.setItem(COMBAT_LAB_SAVE_KEY, JSON.stringify({ version: 99 }));
    const repository = createCombatLabSaveRepository(storage);
    render(<App repository={repository} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("different version");
    fireEvent.click(screen.getByRole("button", { name: "Continue clean" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("can continue clean when browser storage cannot be read", async () => {
    const repository = createCombatLabSaveRepository(new UnavailableStorage());
    render(<App repository={repository} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be read");
    fireEvent.click(screen.getByRole("button", { name: "Continue clean" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
