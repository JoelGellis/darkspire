import { deserialize, serialize, SAVE_KEY, type State } from "./engine";

export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export const PREVIOUS_KEY = `${SAVE_KEY}-previous`;
export const RECOVERY_KEY = `${SAVE_KEY}-recovery`;
export const MAX_SAVE_BYTES = 8 * 1024 * 1024;
export interface SaveResult {
  ok: boolean;
  message: string;
  state?: State;
}
export interface LoadResult {
  state: State | null;
  status: "empty" | "saved" | "recovered" | "corrupt" | "unavailable";
  message: string;
}

/** The getter also catches browsers which throw on accessing localStorage itself. */
export class CampaignPersistence {
  private blocked = false;
  private observed: string | null | undefined;
  constructor(private readonly storage: () => SaveStorage) {}

  private parse(raw: string): State {
    if (new TextEncoder().encode(raw).byteLength > MAX_SAVE_BYTES)
      throw Error("Save exceeds the 8 MB import limit.");
    return deserialize(raw);
  }

  load(): LoadResult {
    try {
      const storage = this.storage();
      const raw = storage.getItem(SAVE_KEY);
      this.observed = raw;
      if (raw !== null) {
        try {
          const state = this.parse(raw);
          this.blocked = false;
          return { state, status: "saved", message: "Saved locally" };
        } catch {
          this.blocked = true;
        }
      }
      const previous = storage.getItem(PREVIOUS_KEY);
      if (previous !== null) {
        try {
          const state = this.parse(previous);
          this.blocked = true;
          return {
            state,
            status: "recovered",
            message:
              "Previous checkpoint loaded. Restore it from Help to resume saving; the original save is preserved.",
          };
        } catch {
          // Keep unreadable bytes available to export, even when both slots fail.
        }
      }
      this.blocked = raw !== null || previous !== null;
      return {
        state: null,
        status: this.blocked ? "corrupt" : "empty",
        message: this.blocked
          ? "Unreadable save preserved. Export it or start fresh from Help."
          : "New campaign",
      };
    } catch {
      this.blocked = true;
      return {
        state: null,
        status: "unavailable",
        message:
          "Browser storage is unavailable. Export your live campaign from Help before closing.",
      };
    }
  }

  save(state: State): SaveResult {
    if (this.blocked)
      return {
        ok: false,
        message:
          "Autosave paused. Restore a checkpoint, import a save, or start fresh from Help.",
      };
    return this.write(serialize(state), false);
  }

  /** Validate and commit before the caller changes its live state. */
  importSave(raw: string): SaveResult {
    return this.write(raw, true);
  }

  startFresh(state: State): SaveResult {
    return this.write(serialize(state), true);
  }

  restorePrevious(): SaveResult {
    try {
      const raw = this.storage().getItem(PREVIOUS_KEY);
      if (raw === null)
        return { ok: false, message: "No previous checkpoint is available." };
      return this.write(raw, true);
    } catch {
      return {
        ok: false,
        message:
          "Could not read the previous checkpoint. Your campaign was not changed.",
      };
    }
  }

  private write(raw: string, explicit: boolean): SaveResult {
    let state: State;
    try {
      state = this.parse(raw);
    } catch {
      return {
        ok: false,
        message:
          "That is not a valid Darkspire II save (maximum 8 MB). Your campaign was not changed.",
      };
    }
    const next = serialize(state);
    try {
      const storage = this.storage();
      const existing = storage.getItem(SAVE_KEY);
      if (
        !explicit &&
        this.observed !== undefined &&
        existing !== this.observed &&
        existing !== next
      ) {
        this.blocked = true;
        return {
          ok: false,
          message:
            "Another tab changed this campaign. Export this tab's live save, then reload to use the newest checkpoint.",
        };
      }
      if (existing !== next) {
        if (existing !== null) {
          let valid = false;
          try {
            this.parse(existing);
            valid = true;
          } catch {
            /* Preserve corrupt originals. */
          }
          if (!valid && !explicit) {
            this.blocked = true;
            return {
              ok: false,
              message:
                "The stored save changed or became unreadable. It has been preserved; use Help to recover.",
            };
          }
          // Every backup must succeed before touching the active slot. Web Storage
          // setItem is atomic: a quota/security failure leaves that slot unchanged.
          if (explicit) storage.setItem(RECOVERY_KEY, existing);
          if (valid) storage.setItem(PREVIOUS_KEY, existing);
        }
        storage.setItem(SAVE_KEY, next);
      }
      this.blocked = false;
      this.observed = next;
      return { ok: true, state, message: "Saved locally" };
    } catch {
      return {
        ok: false,
        message:
          "Save failed. The previous stored campaign is intact. Export your live campaign from Help before closing.",
      };
    }
  }

  exportSaved(fallback: State): string {
    try {
      return this.storage().getItem(SAVE_KEY) ?? serialize(fallback);
    } catch {
      return serialize(fallback);
    }
  }

  exportPrevious(): string | null {
    try {
      return this.storage().getItem(PREVIOUS_KEY);
    } catch {
      return null;
    }
  }

  exportRecovery(): string | null {
    try {
      return this.storage().getItem(RECOVERY_KEY);
    } catch {
      return null;
    }
  }
}
