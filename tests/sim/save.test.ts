import { describe, expect, it } from "vitest";
import {
  COMBAT_LAB_SAVE_KEY,
  createCombatLabSaveRepository,
  createDefaultCombatLabSave,
  type StorageLike,
} from "../../src/save";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }
}

class UnavailableStorage implements StorageLike {
  public getItem(): string | null {
    throw new Error("blocked");
  }

  public setItem(): void {
    throw new Error("blocked");
  }

  public removeItem(): void {
    throw new Error("blocked");
  }
}

describe("combat laboratory save repository", () => {
  it("round-trips selected equipment and minimal progress preferences", () => {
    const storage = new MemoryStorage();
    const repository = createCombatLabSaveRepository(storage);
    const save = {
      ...createDefaultCombatLabSave(),
      selectedEquipment: "quick_shoes" as const,
      aftermathCondition: {
        kind: "bruised" as const,
        heroId: "bo" as const,
        healthPenalty: 12 as const,
        sourceEventId: "event-0100",
      },
      progress: { pressureRearCompleted: true, punishFrontCompleted: false },
      preferences: { reducedMotion: true, audioEnabled: false, battleSpeed: 1.5 as const },
    };

    expect(repository.save(save)).toEqual({ ok: true });
    expect(repository.load()).toEqual({ status: "loaded", value: save });
  });

  it("loads an existing version-one save without the new condition field", () => {
    const storage = new MemoryStorage();
    const oldSave = createDefaultCombatLabSave();
    const oldShape = {
      version: oldSave.version,
      selectedEquipment: oldSave.selectedEquipment,
      progress: oldSave.progress,
      preferences: oldSave.preferences,
    };
    storage.setItem(COMBAT_LAB_SAVE_KEY, JSON.stringify(oldShape));
    const repository = createCombatLabSaveRepository(storage);

    expect(repository.load()).toEqual({
      status: "loaded",
      value: { ...oldShape, aftermathCondition: null },
    });
  });

  it("returns a recoverable malformed result and can clear it", () => {
    const storage = new MemoryStorage();
    storage.setItem(COMBAT_LAB_SAVE_KEY, "{not json");
    const repository = createCombatLabSaveRepository(storage);

    expect(repository.load()).toEqual(
      expect.objectContaining({ status: "recoverable_error", reason: "malformed" }),
    );
    expect(repository.clear()).toEqual({ ok: true });
    expect(repository.load()).toEqual({ status: "empty" });
  });

  it("returns a recoverable incompatible-version result and can clear it", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      COMBAT_LAB_SAVE_KEY,
      JSON.stringify({ ...createDefaultCombatLabSave(), version: 2 }),
    );
    const repository = createCombatLabSaveRepository(storage);

    expect(repository.load()).toEqual(
      expect.objectContaining({ status: "recoverable_error", reason: "incompatible" }),
    );
    expect(repository.clear()).toEqual({ ok: true });
    expect(repository.load()).toEqual({ status: "empty" });
  });

  it("rejects structurally invalid version-one data without throwing", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      COMBAT_LAB_SAVE_KEY,
      JSON.stringify({ ...createDefaultCombatLabSave(), selectedEquipment: "unknown" }),
    );
    const repository = createCombatLabSaveRepository(storage);

    expect(repository.load()).toEqual(
      expect.objectContaining({ status: "recoverable_error", reason: "malformed" }),
    );
  });

  it("does not persist playback timers or event cursors", () => {
    const storage = new MemoryStorage();
    const repository = createCombatLabSaveRepository(storage);
    const invalid = {
      ...createDefaultCombatLabSave(),
      playbackTime: 12,
      eventCursor: 40,
    };

    expect(repository.save(invalid)).toEqual(
      expect.objectContaining({ ok: false, reason: "invalid_value" }),
    );
  });

  it("reports unavailable storage without blocking a clean in-memory session", () => {
    const repository = createCombatLabSaveRepository(new UnavailableStorage());

    expect(repository.load()).toEqual(
      expect.objectContaining({ status: "recoverable_error", reason: "storage_unavailable" }),
    );
    expect(repository.save(createDefaultCombatLabSave())).toEqual(
      expect.objectContaining({ ok: false, reason: "storage_unavailable" }),
    );
    expect(repository.clear()).toEqual(
      expect.objectContaining({ ok: false, reason: "storage_unavailable" }),
    );
  });
});
