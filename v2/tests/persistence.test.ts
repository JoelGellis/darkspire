import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CampaignPersistence,
  PREVIOUS_KEY,
  RECOVERY_KEY,
  MAX_SAVE_BYTES,
  type SaveStorage,
} from "../src/persistence";
import { createGame, serialize, SAVE_KEY } from "../src/engine";

class MemoryStorage implements SaveStorage {
  values = new Map<string, string>();
  failKey = "";
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (key === this.failKey) throw Error("QuotaExceededError");
    this.values.set(key, value);
  }
}
function setup() {
  const storage = new MemoryStorage();
  return { storage, saves: new CampaignPersistence(() => storage) };
}

test("autosave retains exactly the previous valid checkpoint and ignores identical saves", () => {
  const { storage, saves } = setup();
  const state = createGame(12);
  assert.equal(saves.load().status, "empty");
  assert.equal(saves.save(state).ok, true);
  const original = serialize(state);
  state.bank += 1;
  assert.equal(saves.save(state).ok, true);
  assert.equal(storage.getItem(PREVIOUS_KEY), original);
  saves.save(state);
  assert.equal(storage.getItem(PREVIOUS_KEY), original);
  assert.equal(storage.values.size, 2);
  assert.equal(saves.load().state?.bank, state.bank);
});

test("corruption loads a valid checkpoint without overwriting the original; explicit restore archives it", () => {
  const { storage, saves } = setup();
  storage.setItem(SAVE_KEY, "broken save bytes");
  storage.setItem(PREVIOUS_KEY, serialize(createGame(9)));
  const loaded = saves.load();
  assert.equal(loaded.status, "recovered");
  assert.equal(loaded.state?.seed, 9);
  assert.equal(saves.save(loaded.state!).ok, false);
  assert.equal(storage.getItem(SAVE_KEY), "broken save bytes");
  assert.equal(saves.restorePrevious().ok, true);
  assert.equal(saves.exportRecovery(), "broken save bytes");
  assert.equal(saves.load().status, "saved");
});

test("unrecoverable bytes are exportable and fresh start must preserve them", () => {
  const { storage, saves } = setup();
  storage.setItem(SAVE_KEY, "broken");
  assert.equal(saves.load().status, "corrupt");
  assert.equal(saves.exportSaved(createGame()), "broken");
  storage.failKey = RECOVERY_KEY;
  assert.equal(saves.startFresh(createGame()).ok, false);
  assert.equal(storage.getItem(SAVE_KEY), "broken");
  storage.failKey = "";
  assert.equal(saves.startFresh(createGame()).ok, true);
  assert.equal(saves.exportRecovery(), "broken");
});

test("failed imports leave active campaign intact at every storage failure point", () => {
  for (const key of [RECOVERY_KEY, PREVIOUS_KEY, SAVE_KEY]) {
    const { storage, saves } = setup();
    const original = serialize(createGame(8));
    storage.setItem(SAVE_KEY, original);
    storage.failKey = key;
    const result = saves.importSave(serialize(createGame(9)));
    assert.equal(result.ok, false, key);
    assert.equal(result.state, undefined);
    assert.equal(storage.getItem(SAVE_KEY), original, key);
  }
});

test("invalid and oversized imports do not touch storage", () => {
  const { storage, saves } = setup();
  const original = serialize(createGame());
  storage.setItem(SAVE_KEY, original);
  for (const bad of [
    "not json",
    '{"schema":2}',
    " ".repeat(MAX_SAVE_BYTES + 1),
  ])
    assert.equal(saves.importSave(bad).ok, false);
  assert.deepEqual([...storage.values], [[SAVE_KEY, original]]);
});

test("successful import can restore the former campaign; recovery remains available", () => {
  const { saves } = setup();
  saves.save(createGame(1));
  assert.equal(saves.importSave(serialize(createGame(2))).state?.seed, 2);
  assert.equal(saves.restorePrevious().state?.seed, 1);
  assert.equal(JSON.parse(saves.exportRecovery()!).seed, 2);
});

test("unavailable storage and quota failure never prevent live save export", () => {
  const saves = new CampaignPersistence(() => {
    throw Error("SecurityError");
  });
  const state = createGame();
  assert.equal(saves.load().status, "unavailable");
  assert.equal(saves.save(state).ok, false);
  assert.equal(saves.importSave(serialize(state)).ok, false);
  assert.equal(saves.exportSaved(state), serialize(state));
  assert.equal(saves.exportPrevious(), null);
});

test("corruption introduced while playing cannot be overwritten by autosave", () => {
  const { storage, saves } = setup();
  const state = createGame();
  saves.save(state);
  storage.setItem(SAVE_KEY, "external corruption");
  state.bank++;
  assert.equal(saves.save(state).ok, false);
  assert.equal(storage.getItem(SAVE_KEY), "external corruption");
});

test("a stale tab cannot overwrite a different valid campaign", () => {
  const { storage, saves } = setup();
  saves.save(createGame(11));
  const otherTab = new CampaignPersistence(() => storage);
  const old = otherTab.load().state!;
  const newest = createGame(22);
  saves.save(newest);
  old.bank++;
  assert.equal(otherTab.save(old).ok, false);
  assert.equal(storage.getItem(SAVE_KEY), serialize(newest));
});
