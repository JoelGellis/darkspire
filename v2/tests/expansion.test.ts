import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../src/engine";
import * as T from "../src/town";
import {
  CARDS,
  DISCOVERIES,
  STARTER,
  CLASS_STARTERS,
  CLASSES,
} from "../src/content";
import { townMarkup, buildingMarkup } from "../src/town-ui";

function battle(id?: string) {
  const s = E.createGame(12);
  if (id && !s.party.some((u) => u.kind === CARDS[id].owner))
    s.party[0] = E.hero(CARDS[id].owner, 1);
  E.embark(s, "Scripted expansion verification");
  E.chooseRoute(s, "sentries");
  if (id) {
    const d = CARDS[id],
      u = s.party.find((u) => u.kind === d.owner)!;
    const rank = d.ranks[0] ?? u.rank;
    const neighbor = s.party.find((a) => a.rank === rank)!;
    [u.rank, neighbor.rank] = [neighbor.rank, u.rank];
    s.battle!.hand = [{ id, uid: s.nextCard++, upgrade: 0 }];
  }
  return s;
}
test("every class has six discoveries, separate from its intact starter deck", () => {
  assert.equal(DISCOVERIES.length, Object.keys(CLASSES).length * 6);
  assert.equal(STARTER.length, 16);
  for (const kind of Object.keys(CLASSES))
    assert.equal(
      DISCOVERIES.filter((id) => CARDS[id].owner === kind).length,
      6,
    );
  assert.ok(
    DISCOVERIES.every(
      (id) => !Object.values(CLASS_STARTERS).flat().includes(id),
    ),
  );
});
test("every discovery plays legally, consumes energy once, upgrades, and survives save/resume", () => {
  for (const id of DISCOVERIES) {
    const s = battle(id),
      c = s.battle!.hand[0];
    c.upgrade = 1;
    assert.ok(E.cardValue(s, c) >= CARDS[id].value, id);
    const target = E.targets(s, c)[0];
    assert.ok(target, id);
    E.play(s, c.uid, target.id);
    assert.equal(s.battle!.energy, 3 - E.cardDefinition(c).cost, id);
    assert.ok(
      (CARDS[id].exhaust ? s.battle!.exhaust : s.battle!.discard).some(
        (x) => x.uid === c.uid,
      ),
      id,
    );
    assert.deepEqual(E.deserialize(E.serialize(s)), s, id);
    assert.throws(() => E.play(s, c.uid, target.id));
  }
});
test("discovery rewards exclude starters, fallen classes, and cards already owned twice", () => {
  const s = battle();
  s.party.find((u) => u.kind === "rogue")!.hp = 0;
  for (const id of DISCOVERIES.filter((id) => CARDS[id].owner === "wizard"))
    for (let i = 0; i < 2; i++)
      s.deck.push({ id, uid: s.nextCard++, upgrade: 0 });
  s.battle!.status = "won";
  E.finishBattle(s);
  assert.equal(s.reward.length, 3);
  assert.ok(
    s.reward.every(
      (c) =>
        CARDS[c.id].discovery &&
        !["rogue", "wizard"].includes(CARDS[c.id].owner),
    ),
  );
  assert.equal(new Set(s.reward.map((c) => c.id)).size, 3);
});
test("draw, self protection, party protection, poison and disruption resolve as advertised", () => {
  let s = battle("shield-bash");
  E.play(s, s.battle!.hand[0].uid, "enemy-0");
  assert.equal(s.party[0].block, 5);
  s = battle("sanctuary");
  E.play(s, s.battle!.hand[0].uid, "cleric");
  assert.deepEqual(
    s.party.map((u) => u.block),
    [4, 4, 7, 4],
  );
  s = battle("nightshade");
  E.play(s, s.battle!.hand[0].uid, "enemy-0");
  assert.equal(s.battle!.enemies[0].poison, 6);
  s = battle("frost-bind");
  const before = s.battle!.intents[0].damage;
  E.play(s, s.battle!.hand[0].uid, "enemy-0");
  assert.equal(s.battle!.intents[0].damage, Math.max(0, before - 6));
  s = battle("forbidden-page");
  const count = s.battle!.draw.length;
  E.play(s, s.battle!.hand[0].uid, "wizard");
  assert.equal(s.battle!.hand.length, 2);
  assert.equal(s.battle!.draw.length, count - 2);
});
test("piercing previews match HP loss through armor and movement keeps rank ownership unique", () => {
  const s = battle("headsman");
  s.battle!.enemies[0].block = 30;
  assert.match(E.preview(s, s.battle!.hand[0], "enemy-0"), /22 HP lost/);
  E.play(s, s.battle!.hand[0].uid, "enemy-0");
  assert.equal(s.battle!.enemies[0].hp, 8);
  assert.equal(s.battle!.enemies[0].block, 30);
  const m = battle("breakthrough");
  E.play(m, m.battle!.hand[0].uid, "enemy-0");
  assert.equal(m.party[0].rank, 1);
  assert.equal(new Set(m.party.map((u) => u.rank)).size, 4);
});
test("town upgrades charge exact prices, cap levels, and reject purchases during expeditions", () => {
  const s = E.createGame();
  s.bank = 1000;
  for (let i = 0; i < 3; i++) T.upgrade(s, "smith");
  assert.equal(s.bank, 730);
  assert.equal(T.level(s, "smith"), 3);
  const snap = E.serialize(s);
  assert.throws(() => T.upgrade(s, "smith"));
  assert.equal(E.serialize(s), snap);
  E.embark(s, "QA");
  assert.throws(() => T.upgrade(s, "chapel"));
  E.chooseRoute(s, "sentries");
  assert.ok(s.party.every((u) => u.block === 3));
});
test("infirmary prices and improved retreat have real gold effects and survive saves", () => {
  const s = E.createGame();
  s.bank = 1000;
  T.upgrade(s, "infirmary");
  s.party[0].wounded = true;
  const bank = s.bank;
  E.healWound(s, "fighter");
  assert.equal(s.bank, bank - 12);
  assert.equal(s.party[0].wounded, false);
  for (let i = 0; i < 3; i++) T.upgrade(s, "waystation");
  E.embark(s, "QA");
  s.gold = 100;
  const before = s.bank;
  E.finishRun(s, "retreat");
  assert.equal(s.bank, before + 65);
  assert.deepEqual(E.deserialize(E.serialize(s)).town, s.town);
});
test("Guild redraws persist, change choices, run out, and reset only at embark", () => {
  const s = E.createGame();
  T.upgrade(s, "guild");
  E.embark(s, "QA");
  E.chooseRoute(s, "sentries");
  s.battle!.status = "won";
  E.finishBattle(s);
  const old = s.reward.map((c) => c.id);
  E.redrawReward(s);
  assert.ok(s.reward.every((c) => !old.includes(c.id)));
  assert.equal(s.town.redraws, 0);
  const loaded = E.deserialize(E.serialize(s));
  assert.throws(() => E.redrawReward(loaded));
  E.claimReward(s, null);
  E.finishRun(s, "retreat");
  E.returnToCamp(s);
  E.embark(s, "QA");
  assert.equal(s.town.redraws, 1);
});
test("chapel heals survivors only, old saves migrate and invalid towns are rejected", () => {
  const s = battle();
  s.town.levels.chapel = 2;
  s.party[0].hp = 20;
  s.party[1].hp = 0;
  s.battle!.status = "won";
  E.finishBattle(s);
  assert.equal(s.party[0].hp, 22);
  assert.equal(s.party[1].hp, 0);
  const old = JSON.parse(E.serialize(s));
  delete old.town;
  assert.deepEqual(E.deserialize(JSON.stringify(old)).town, T.newTown());
  for (const value of [-1, 4, 1.5, "1", null]) {
    const bad = structuredClone(s);
    (bad.town.levels as any).smith = value;
    assert.throws(() => E.deserialize(E.serialize(bad)));
  }
});
test("every town building exposes its working services and current prices", () => {
  const s = E.createGame();
  for (const id of Object.keys(T.BUILDINGS) as T.BuildingId[]) {
    assert.ok(townMarkup(s).includes(`data-id="${id}"`));
    assert.ok(buildingMarkup(s, id).includes(T.BUILDINGS[id].name));
  }
  assert.match(buildingMarkup(s, "guild"), /data-action="codex"/);
  assert.match(buildingMarkup(s, "infirmary"), /NO TREATMENT NEEDED/);
  assert.match(buildingMarkup(s, "merchant"), /80 GOLD/);
});
