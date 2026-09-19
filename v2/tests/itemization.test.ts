import { test } from "node:test";
import assert from "node:assert/strict";
import { ITEMS } from "../src/items";
import { CARDS, CLASSES } from "../src/content";
import * as E from "../src/engine";
import * as Q from "../src/economy";

test("all eight classes have compatible weapon, armor and trinket builds with valid action cards", () => {
  for (const owner of Object.keys(CLASSES)) {
    for (const slot of ["weapon", "armor", "trinket"]) {
      const d = ITEMS[`${owner}-${slot}`];
      assert.ok(d, `${owner} ${slot}`);
      assert.equal(d.owner, owner);
      assert.equal(d.slot, slot);
    }
  }
  for (const [id, d] of Object.entries(ITEMS)) {
    assert.ok(d.cost > 0 && Number.isInteger(d.cost), id);
    assert.ok(d.tier >= 0 && d.tier <= 3, id);
    if (d.card) assert.equal(CARDS[d.card]?.owner, d.owner, id);
    assert.ok(
      d.hp || d.power || d.block || d.card || d.aura || d.auras?.length,
      id,
    );
  }
});

test("legendary combination relics apply real guard and healing without stacking matching auras", () => {
  const s = E.createGame(27);
  E.embark(s, "Relic QA");
  s.economy.artifacts.push(
    { uid: s.economy.nextItem++, id: "dawnstandard", foundRun: null },
    { uid: s.economy.nextItem++, id: "wardbell", foundRun: null },
  );
  E.chooseRoute(s, "sentries");
  assert.equal(s.party[0].block, 3);
  s.party[0].hp = 10;
  s.battle!.status = "won";
  E.finishBattle(s);
  assert.equal(s.party[0].hp, 13);
  assert.ok(E.deserialize(E.serialize(s)));
});

test("ordinary loot remains 75/25 common/uncommon as the catalog grows and never drops absent class gear", () => {
  const s = E.createGame();
  E.embark(s, "Loot QA");
  const count = [0, 0, 0, 0];
  for (let i = 0; i < 1000; i++) {
    Q.drop(s, "sentries", (i + 0.5) / 1000);
    const d = ITEMS[s.economy.pack.at(-1)!.id];
    count[d.tier]++;
    assert.ok(!d.owner || s.party.some((u) => u.kind === d.owner));
  }
  assert.deepEqual(count, [750, 250, 0, 0]);
  assert.throws(() => Q.drop(s, "sentries", -0.5));
  assert.throws(() => Q.drop(s, "sentries", NaN));
});

test("boss loot is 90% rare and 10% legendary; prices preserve salvage loss", () => {
  const s = E.createGame();
  E.embark(s, "Boss loot QA");
  const count = [0, 0, 0, 0];
  for (let i = 0; i < 1000; i++) {
    Q.drop(s, "boss", (i + 0.5) / 1000);
    count[ITEMS[s.economy.pack.at(-1)!.id].tier]++;
  }
  assert.deepEqual(count, [0, 0, 900, 100]);
  for (const d of Object.values(ITEMS))
    assert.ok(Math.floor(d.cost / 2) < d.cost);
});

test("run merchant cannot waste limited offers on absent class gear or duplicate guaranteed slots", () => {
  for (let run = 1; run <= 16; run++) {
    const s = E.createGame();
    s.screen = "shop";
    s.run = run;
    s.floor = 4;
    const offers = Q.stock(s);
    assert.equal(offers.length, 7);
    assert.equal(new Set(offers).size, 7);
    for (const id of offers)
      assert.ok(
        !ITEMS[id].owner || s.party.some((u) => u.kind === ITEMS[id].owner),
      );
  }
});
