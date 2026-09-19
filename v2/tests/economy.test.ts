import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../src/engine";
import * as Q from "../src/economy";
import { ITEMS } from "../src/items";
import { inventoryMarkup } from "../src/inventory-ui";

test("equipment comparisons show net changes and card loss without mutating inventory", () => {
  const s = E.createGame();
  const i = { uid: s.economy.nextItem++, id: "shadowknife", foundRun: null };
  s.party[1].equipment = [i];
  const before = E.serialize(s);
  const text = Q.comparison(s, "blade", "rogue");
  assert.match(text, /Replaces Retreating edge/);
  assert.match(text, /\+1 attack/);
  assert.match(text, /loses Backstep/);
  assert.equal(E.serialize(s), before);
  assert.equal(Q.comparison(s, "emberstaff", "fighter"), "Cannot equip.");
});
test("loadout warnings name overloaded heroes and inventory shows equipment comparisons", () => {
  const s = E.createGame();
  s.party[0].equipment = [
    { uid: s.economy.nextItem++, id: "blade", foundRun: null },
    { uid: s.economy.nextItem++, id: "coat", foundRun: null },
  ];
  s.economy.stash.push({
    uid: s.economy.nextItem++,
    id: "kingsedge",
    foundRun: null,
  });
  assert.match(Q.loadoutWarnings(s)[0], /Aldric/);
  assert.match(inventoryMarkup(s, "bag"), /\+3 attack/);
  assert.match(inventoryMarkup(s, "loadout"), /Before your next descent/);
});
function game() {
  const s = E.createGame(42);
  s.bank = 500;
  return s;
}
function grant(
  s: E.State,
  id: string,
  where: "stash" | "pack" = "stash",
  found = false,
) {
  const i = { uid: s.economy.nextItem++, id, foundRun: found ? s.run : null };
  s.economy[where].push(i);
  return i;
}
function begin(s: E.State) {
  E.embark(s, "Economy QA");
  E.chooseRoute(s, "sentries");
}
test("merchant stock purchases persist, cannot be bought twice, and upgrades unlock tiers", () => {
  const s = game();
  Q.buy(s, "blade");
  assert.equal(s.bank, 482);
  assert.equal(s.economy.stash[0].id, "blade");
  assert.throws(() => Q.buy(s, "blade"));
  assert.throws(() => Q.buy(s, "emberstaff"));
  Q.upgradeMerchant(s);
  assert.equal(s.bank, 402);
  assert.ok(Q.stock(s).includes("emberstaff"));
  assert.deepEqual(E.deserialize(E.serialize(s)).economy, s.economy);
});
test("one item per hero and one relic at embark; run fills slots and gains distinct relics", () => {
  const s = game(),
    a = grant(s, "blade"),
    b = grant(s, "coat"),
    r = grant(s, "wardbell");
  Q.equip(s, a.uid, "fighter");
  Q.equip(s, b.uid, "fighter");
  Q.equip(s, r.uid, "party");
  const before = E.serialize(s);
  assert.throws(() => E.embark(s, "QA"), /one item per hero/);
  assert.equal(E.serialize(s), before);
  Q.unequip(s, b.uid);
  E.embark(s, "QA");
  const armor = grant(s, "coat", "pack");
  Q.equip(s, armor.uid, "fighter");
  const relic = grant(s, "lantern", "pack");
  Q.equip(s, relic.uid, "party");
  assert.equal(s.economy.artifacts.length, 2);
  E.chooseRoute(s, "sentries");
  assert.equal(s.battle!.hand.length, 6);
  assert.ok(s.party.every((u) => u.block === 3));
  assert.equal(s.party[0].maxHp, 60);
  const snap = E.serialize(s);
  assert.throws(() => Q.unequip(s, armor.uid));
  assert.equal(E.serialize(s), snap);
});
test("equipment changes cards, respects class, and does not erase another equipped card upgrade", () => {
  const s = game();
  const staff = grant(s, "emberstaff");
  assert.throws(() => Q.equip(s, staff.uid, "fighter"));
  Q.equip(s, staff.uid, "wizard");
  E.embark(s, "QA");
  assert.equal(s.deck.length, 17);
  const injected = s.deck.find((c) => c.itemUid === staff.uid)!;
  injected.upgrade = 1;
  const armor = grant(s, "coat", "pack");
  Q.equip(s, armor.uid, "wizard");
  assert.equal(s.deck.find((c) => c.itemUid === staff.uid)!.upgrade, 1);
  Q.unequip(s, staff.uid);
  assert.equal(s.deck.length, 16);
  assert.equal(E.power(s.party[3]), 0);
});
test("battle loot arrives once and safe retreat stores it with equipped relics persistent", () => {
  const s = game();
  begin(s);
  s.battle!.status = "won";
  E.finishBattle(s);
  assert.equal(s.economy.pack.length, 1);
  assert.throws(() => E.finishBattle(s));
  const id = s.economy.pack[0].id;
  E.claimReward(s, null);
  E.finishRun(s, "retreat");
  assert.equal(s.economy.pack.length, 0);
  assert.equal(s.economy.stash[0].id, id);
  assert.equal(s.economy.stash[0].foundRun, null);
  E.returnToCamp(s);
  assert.ok(E.deserialize(E.serialize(s)));
});
test("flee loses found loot but preserves purchases; wipe cannot touch camp stash", () => {
  const s = game();
  const safe = grant(s, "kingsedge");
  begin(s);
  grant(s, "coat", "pack", true);
  const bought = grant(s, "blade", "pack");
  E.finishRun(s, "flee");
  assert.deepEqual(
    s.economy.stash.map((i) => i.uid),
    [safe.uid, bought.uid],
  );
  E.returnToCamp(s);
  const equip = grant(s, "coat");
  Q.equip(s, equip.uid, "fighter");
  begin(s);
  grant(s, "lantern", "pack");
  s.party.forEach((u) => (u.hp = 0));
  s.battle!.status = "lost";
  E.finishBattle(s);
  assert.equal(s.economy.stash.length, 2);
  assert.equal(s.economy.pack.length, 0);
  assert.equal(s.party[0].equipment!.length, 0);
  assert.equal(s.graveyard[0].equipment![0].id, "coat");
});
test("salvage gives permanent value, does not duplicate items or heal via armor swapping", () => {
  const s = game();
  const armor = grant(s, "coat");
  Q.equip(s, armor.uid, "fighter");
  s.party[0].hp = 20;
  Q.unequip(s, armor.uid);
  Q.equip(s, armor.uid, "fighter");
  assert.equal(s.party[0].hp, 20);
  Q.unequip(s, armor.uid);
  Q.sell(s, armor.uid);
  assert.equal(s.bank, 508);
  assert.throws(() => Q.sell(s, armor.uid));
});
test("old gear migrates losslessly and malformed inventories cannot duplicate or bypass slots", () => {
  const s = game();
  s.party[0].gear = "coat";
  s.party[0].maxHp = 60;
  const old = JSON.parse(E.serialize(s));
  delete old.economy;
  const migrated = E.deserialize(JSON.stringify(old));
  assert.equal(migrated.party[0].equipment![0].id, "coat");
  assert.equal(migrated.party[0].gear, null);
  assert.equal(E.maxHp(migrated.party[0]), 60);
  const i = grant(s, "blade");
  s.economy.stash.push({ ...i });
  assert.throws(() => E.deserialize(E.serialize(s)), /duplicate item/);
});
test("run merchant always offers cheap gap fillers, a relic, and rare gear", () => {
  const s = game();
  s.screen = "shop";
  s.run = 1;
  s.floor = 4;
  const ids = Q.stock(s);
  assert.ok(["blade", "coat", "charm"].every((id) => ids.includes(id)));
  assert.ok(ids.some((id) => ITEMS[id].slot === "artifact"));
  assert.ok(ids.some((id) => ITEMS[id].tier >= 2));
});
test("coin and reliquary grant their real post-victory benefits", () => {
  const s = game();
  begin(s);
  s.economy.artifacts.push(
    grant(s, "coin", "pack"),
    grant(s, "reliquary", "pack"),
  );
  s.economy.pack = [];
  s.party[0].hp = 30;
  s.battle!.status = "won";
  E.finishBattle(s);
  assert.equal(s.gold, 28);
  assert.equal(s.party[0].hp, 33);
});
test("boss settlement cannot bank gold or loot a second time", () => {
  const s = game();
  E.embark(s, "QA");
  E.startBattle(s, "boss");
  s.battle!.status = "won";
  E.finishBattle(s);
  const before = E.serialize(s);
  assert.throws(() => E.finishRun(s, "victory"));
  assert.equal(E.serialize(s), before);
});
test("extra run relics survive but must be reduced to one for the next descent", () => {
  const s = game();
  E.embark(s, "QA");
  for (const id of ["wardbell", "lantern"]) {
    const i = grant(s, id, "pack", true);
    Q.equip(s, i.uid, "party");
  }
  E.finishRun(s, "retreat");
  E.returnToCamp(s);
  assert.throws(() => E.embark(s, "QA"), /one party relic/);
  Q.unequip(s, s.economy.artifacts[1].uid);
  assert.equal(s.economy.stash.length, 1);
  E.embark(s, "QA");
  assert.equal(s.economy.artifacts.length, 1);
});
