import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../src/engine";
import { CARDS } from "../src/content";
import {
  CARD_UPGRADES,
  cardDefinition,
  upgradeDescription,
} from "../src/card-upgrades";
function setup(id: string, upgrade = 1) {
  const s = E.createGame(99);
  E.embark(s, "Scripted upgrade QA");
  E.chooseRoute(s, "sentries");
  const c = { id, uid: s.nextCard++, upgrade };
  s.battle!.hand = [c];
  return { s, c };
}
test("all 72 definitions have explicit upgrades without mutating base definitions", () => {
  const before = JSON.stringify(CARDS);
  assert.equal(Object.keys(CARD_UPGRADES).length, Object.keys(CARDS).length);
  for (const id of Object.keys(CARDS)) {
    const base = cardDefinition({ id, upgrade: 0 }),
      next = cardDefinition({ id, upgrade: 1 });
    assert.ok(upgradeDescription(id).length > 0);
    assert.ok(next.cost >= 0 && next.cost <= base.cost, id);
    assert.ok(next.value >= base.value, id);
    assert.notDeepEqual(next, base, id);
  }
  assert.equal(JSON.stringify(CARDS), before);
});
test("cheaper upgrades change legality, actual spending and post-load behavior", () => {
  for (const [id, cost] of [
    ["nova", 1],
    ["rally", 0],
    ["martyrs-shield", 1],
    ["starfall", 2],
  ] as const) {
    const { s, c } = setup(id);
    s.battle!.energy = cost;
    const loaded = E.deserialize(E.serialize(s));
    assert.equal(E.cardReason(loaded, c), "", id);
    const target = E.targets(loaded, c)[0];
    E.play(loaded, c.uid, target.id);
    assert.equal(loaded.battle!.energy, 0, id);
    const base = setup(id, 0);
    base.s.battle!.energy = cost;
    assert.match(E.cardReason(base.s, base.c), /energy/, id);
  }
});
test("reach and rank mastery unlock real targets instead of only changing text", () => {
  const cut = setup("iron-cut");
  cut.s.party[0].rank = 3;
  cut.s.party[2].rank = 1;
  assert.equal(E.cardReason(cut.s, cut.c), "");
  assert.match(E.cardReason(cut.s, { ...cut.c, upgrade: 0 }), /rank/);
  const smite = setup("smite");
  smite.s.battle!.enemies[2].rank = 4;
  assert.ok(E.targets(smite.s, smite.c).some((u) => u.rank === 4));
  assert.ok(
    !E.targets(smite.s, { ...smite.c, upgrade: 0 }).some((u) => u.rank === 4),
  );
});
test("poison and disruption upgrade the secondary effect without inflating primary damage", () => {
  const { s, c } = setup("nightshade");
  assert.equal(E.cardValue(s, c), 2);
  assert.match(E.preview(s, c, "enemy-0"), /9 Poison/);
  E.play(s, c.uid, "enemy-0");
  assert.equal(s.battle!.enemies[0].poison, 9);
  assert.equal(s.battle!.enemies[0].hp, 28);
  const frost = setup("frost-bind");
  const before = frost.s.battle!.intents[0].damage;
  E.play(frost.s, frost.c.uid, "enemy-0");
  assert.equal(frost.s.battle!.intents[0].damage, Math.max(0, before - 9));
});
test("mastered movement cards can stay or move; base movement cannot be bypassed", () => {
  let { s, c } = setup("backstep");
  E.play(s, c.uid, "rogue", false);
  assert.equal(s.party[1].rank, 2);
  assert.equal(s.party[1].block, 8);
  ({ s, c } = setup("backstep"));
  E.play(s, c.uid, "rogue", true);
  assert.equal(s.party[1].rank, 3);
  ({ s, c } = setup("backstep", 0));
  E.play(s, c.uid, "rogue", false);
  assert.equal(s.party[1].rank, 3);
  ({ s, c } = setup("breakthrough"));
  s.party[0].rank = 2;
  s.party[1].rank = 1;
  E.play(s, c.uid, "enemy-0", false);
  assert.equal(s.party[0].rank, 2);
});
test("upgraded absolution heals, cleanses and protects the selected ally", () => {
  const { s, c } = setup("absolution");
  const target = s.party[0];
  target.hp = 20;
  target.poison = 5;
  E.play(s, c.uid, target.id);
  assert.equal(target.hp, 34);
  assert.equal(target.poison, 0);
  assert.equal(target.block, 4);
  assert.equal(s.party[2].block, 0);
  assert.equal(s.battle!.exhaust[0].uid, c.uid);
});
test("rest upgrades one exact card instance and preserves equipment ownership", () => {
  const s = E.createGame();
  E.embark(s, "QA");
  s.screen = "rest";
  const c = { id: "starfall", uid: s.nextCard++, upgrade: 0, itemUid: 44 };
  s.deck.push(c);
  const duplicate = { ...c, uid: s.nextCard++, itemUid: 45 };
  s.deck.push(duplicate);
  E.rest(s, "upgrade", c.uid);
  assert.equal(c.upgrade, 1);
  assert.equal(c.itemUid, 44);
  assert.equal(duplicate.upgrade, 0);
  assert.throws(() => E.rest(s, "upgrade", duplicate.uid));
});
