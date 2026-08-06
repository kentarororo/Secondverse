export type SaveReadFailureReason = "malformed" | "incompatible" | "storage_unavailable";
export type SaveWriteFailureReason = "invalid_value" | "storage_unavailable";

export type SaveReadResult<T> =
  | { readonly status: "loaded"; readonly value: T }
  | { readonly status: "empty" }
  | {
      readonly status: "recoverable_error";
      readonly reason: SaveReadFailureReason;
      readonly message: string;
    };

export type SaveWriteResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: SaveWriteFailureReason; readonly message: string };

export interface SaveRepository<T> {
  load(): SaveReadResult<T>;
  save(value: T): SaveWriteResult;
  clear(): SaveWriteResult;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
