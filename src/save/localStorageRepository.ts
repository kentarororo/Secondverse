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
        message: "Saved data could not be read. You can continue with a clean laboratory.",
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
        message: "Saved data is damaged. Clear it to start clean.",
      };
    }

    const storedVersion = readStoredVersion(parsed);
    if (storedVersion !== null && storedVersion !== this.codec.version) {
      return {
        status: "recoverable_error",
        reason: "incompatible",
        message: "Saved data uses a different version. Clear it to start clean.",
      };
    }

    const validation = this.codec.schema.safeParse(parsed);
    if (!validation.success) {
      return {
        status: "recoverable_error",
        reason: "malformed",
        message: "Saved data is incomplete. Clear it to start clean.",
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
        message: "The current laboratory state is not valid and was not saved.",
      };
    }

    try {
      this.storage.setItem(this.key, JSON.stringify(validation.data));
      return { ok: true };
    } catch {
      return {
        ok: false,
        reason: "storage_unavailable",
        message: "Saved data could not be written. The current session can continue.",
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
        message: "Saved data could not be cleared in this browser.",
      };
    }
  }
}
