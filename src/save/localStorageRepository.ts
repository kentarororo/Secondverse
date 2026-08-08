import type { z } from "zod";
import type {
  SaveReadResult,
  SaveRepository,
  SaveWriteResult,
  StorageLike,
} from "./repository";

export interface VersionedSaveCodec<T> {
  readonly version: number;
  readonly schema: z.ZodType<T>;
}

function readStoredVersion(input: unknown): number | null {
  if (typeof input !== "object" || input === null || !("version" in input)) {
    return null;
  }
  const version = (input as { readonly version?: unknown }).version;
  return typeof version === "number" && Number.isInteger(version) ? version : null;
}

export class LocalStorageSaveRepository<T> implements SaveRepository<T> {
  public constructor(
    private readonly storage: StorageLike,
    private readonly key: string,
    private readonly codec: VersionedSaveCodec<T>,
  ) {}

  public load(): SaveReadResult<T> {
    let raw: string | null;
    try {
      raw = this.storage.getItem(this.key);
    } catch {
      return {
        status: "recoverable_error",
        reason: "storage_unavailable",
        message: "Your saved game could not be opened. You can start without it.",
      };
    }

    if (raw === null) {
      return { status: "empty" };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return {
        status: "recoverable_error",
        reason: "malformed",
        message: "This save is damaged and cannot be used.",
      };
    }

    const storedVersion = readStoredVersion(parsed);
    if (storedVersion !== null && storedVersion !== this.codec.version) {
      return {
        status: "recoverable_error",
        reason: "incompatible",
        message: "This save cannot be used with the current build.",
      };
    }

    const validation = this.codec.schema.safeParse(parsed);
    if (!validation.success) {
      return {
        status: "recoverable_error",
        reason: "malformed",
        message: "This save is incomplete and cannot be used.",
      };
    }

    return { status: "loaded", value: validation.data };
  }

  public save(value: T): SaveWriteResult {
    const validation = this.codec.schema.safeParse(value);
    if (!validation.success) {
      return {
        ok: false,
        reason: "invalid_value",
        message: "Your latest change could not be saved.",
      };
    }

    try {
      this.storage.setItem(this.key, JSON.stringify(validation.data));
      return { ok: true };
    } catch {
      return {
        ok: false,
        reason: "storage_unavailable",
        message: "Your latest change could not be saved. You can keep playing, but it may be lost when you close the game.",
      };
    }
  }

  public clear(): SaveWriteResult {
    try {
      this.storage.removeItem(this.key);
      return { ok: true };
    } catch {
      return {
        ok: false,
        reason: "storage_unavailable",
        message: "The saved game could not be deleted in this browser.",
      };
    }
  }
}
