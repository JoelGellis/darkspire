import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../src/engine";
import { ENCOUNTERS, type EncounterId } from "../src/content";
import { ITEMS } from "../src/items";
import * as X from "../src/expedition";

function game(seed = 43) {
  const s = E.createGame(seed);
  E.embark(s, "Route test");
  return s;
}
function win(s: E.State) {
  s.battle!.enemies.forEach((u) => (u.hp = 0));
  s.battle!.status = "won";
  E.finishBattle(s);
  if (s.screen === "reward") E.claimReward(s, s.reward[0]?.uid ?? null);
}
test("route generation is reproducible, varied, and independent of combat RNG", () => {
  const maps = new Set<string>(),
    bosses = new Set<string>(),
    elites = new Set<string>();
  for (let seed = 1; seed <= 100; seed++) {
    const s = game(seed),
      route = X.routeMap(s);
    assert.equal(route.length, 7);
    assert.equal(route[0][0].id, "sentries");
    assert.equal(route[6][0].kind, "boss");
    assert.ok(route[3].some((n) => n.kind === "shop"));
    assert.ok(route[5].some((n) => n.kind === "rest"));
    assert.ok(route[4].every((n) => n.kind === "combat"));
    maps.add(JSON.stringify(route));
    bosses.add(route[6][0].id);
    elites.add(route[2][1].id);
    for (let i = 0; i < 20; i++) E.random(s);
    assert.deepEqual(X.routeMap(s), route);
    assert.deepEqual(X.routeMap(E.deserialize(E.serialize(s))), route);
  }
  assert.ok(maps.size > 30);
  assert.equal(bosses.size, 3);
  assert.equal(elites.size, 3);
});
test("all seven stages settle, roundtrip saves and finish every seeded boss", () => {
  for (let seed = 1; seed <= 20; seed++) {
    let s = game(seed);
    while (s.screen !== "summary") {
      if (s.screen === "map") E.chooseRoute(s, E.routeOptions(s).at(-1)!);
      else if (s.screen === "combat") win(s);
      else if (s.screen === "rest") E.rest(s, "heal");
      else if (s.screen === "shrine") E.shrineChoice(s, "leave");
      else if (s.screen === "shop") s.screen = "map";
      else assert.fail(`Unexpected phase ${s.screen}`);
      s = E.deserialize(E.serialize(s));
    }
    assert.equal(s.floor, 7);
    assert.equal(s.outcome, "victory");
    assert.deepEqual(E.routeOptions(s), []);
    assert.throws(() => E.finishRun(s, "victory"));
  }
});
test("pre-expansion campaigns preserve their five-stage route until next embark", () => {
  const source = game(),
    raw = JSON.parse(E.serialize(source));
  delete raw.expedition;
  const s = E.deserialize(JSON.stringify(raw));
  assert.equal(X.expeditionLength(s), 5);
  for (const id of ["sentries", "rest", "shrine", "rest", "boss"]) {
    E.chooseRoute(s, id);
    if (s.screen === "combat") win(s);
    if (s.screen === "rest") E.rest(s, "heal");
    if (s.screen === "shrine") E.shrine(s, false);
    assert.doesNotThrow(() => E.deserialize(E.serialize(s)));
  }
  E.returnToCamp(s);
  E.embark(s, "Route test");
  assert.equal(X.expeditionLength(s), 7);
});
test("difficulty is explicit, persists, and affects actual stats and rewards", () => {
  const s = E.createGame(19);
  X.configureExpedition(s, { difficulty: "veteran", seed: 77 });
  E.embark(s, "Veteran");
  assert.throws(() => X.configureExpedition(s, { difficulty: "standard" }));
  E.chooseRoute(s, "sentries");
  assert.equal(s.battle!.enemies[0].maxHp, 38);
  assert.equal(s.battle!.enemies[0].power, 9);
  win(s);
  assert.equal(s.gold, 25);
  assert.equal(E.deserialize(E.serialize(s)).expedition.difficulty, "veteran");
  const baseline = game();
  E.chooseRoute(baseline, "sentries");
  assert.equal(baseline.battle!.enemies[0].maxHp, 30);
  assert.equal(baseline.battle!.enemies[0].power, 7);
});
test("all encounter tiers award appropriate loot and bosses settle the campaign", () => {
  for (const id of Object.keys(ENCOUNTERS) as EncounterId[]) {
    const s = game();
    E.startBattle(s, id);
    win(s);
    const tier = ENCOUNTERS[id].tier;
    assert.equal(s.gold, tier === "boss" ? 60 : tier === "elite" ? 35 : 20);
    assert.equal(s.screen, tier === "boss" ? "summary" : "map");
    const item = ITEMS[s.economy.lastLoot[0]];
    if (tier === "boss") assert.ok(item.tier >= 2);
    if (tier === "elite") assert.equal(item.slot, "artifact");
  }
});
test("hunters commit to the wounded target and chorus threat appears in intents", () => {
  const s = game();
  E.startBattle(s, "hunt");
  s.party[3].hp = 5;
  s.battle!.intents = [];
  E.endTurn(s);
  assert.ok(s.battle!.intents.every((i) => i.target === s.party[3].id));
  const c = game();
  E.startBattle(c, "choir");
  c.battle!.turn = 2;
  c.battle!.intents = [];
  E.endTurn(c);
  assert.ok(
    c.battle!.intents.every(
      (i) =>
        i.damage ===
        c.battle!.enemies.find((u) => u.id === i.source)!.power + 3,
    ),
  );
});
test("rest preparation is single-use and removal protects the minimum class kit", () => {
  const s = game();
  s.screen = "rest";
  E.rest(s, "prepare");
  assert.equal(s.expedition.prepared, true);
  E.startBattle(s, "sentries");
  assert.ok(s.party.every((u) => u.block === 6));
  assert.equal(s.battle!.hand.length, 6);
  assert.equal(s.expedition.prepared, false);
  E.startBattle(s, "sentries");
  assert.ok(s.party.every((u) => u.block === 0));
  assert.equal(s.battle!.hand.length, 5);
  const cards = s.deck.filter((c) => c.id === "iron-cut");
  for (const card of cards) {
    s.screen = "rest";
    E.rest(s, "remove", card.uid);
  }
  s.screen = "rest";
  assert.throws(
    () => E.rest(s, "remove", s.deck.find((c) => c.id === "sunder")!.uid),
    /two cards/,
  );
  assert.equal(s.screen, "rest");
});
test("shrine choices validate payment before mutation and earned auras affect combat", () => {
  const s = game();
  s.screen = "shrine";
  s.party[0].hp = 5;
  const before = E.serialize(s);
  assert.throws(() => E.shrineChoice(s, "blood"));
  assert.equal(E.serialize(s), before);
  E.shrineChoice(s, "mercy");
  assert.equal(s.party[0].hp, 13);
  s.screen = "shrine";
  s.route = ["echoes"];
  E.shrineChoice(s, "shelter");
  E.startBattle(s, "sentries");
  assert.ok(s.party.every((u) => u.block === 4));
  s.screen = "shrine";
  s.route = ["echoes"];
  E.shrineChoice(s, "insight");
  E.startBattle(s, "sentries");
  assert.equal(s.battle!.hand.length, 6);
  s.screen = "shrine";
  s.route = ["spring"];
  s.potions = 2;
  E.shrineChoice(s, "bottle");
  assert.equal(s.potions, 3);
  s.screen = "shrine";
  assert.throws(() => E.shrineChoice(s, "bottle"), /full/);
  E.shrineChoice(s, "leave");
});
test("malformed expedition imports reject modifiers, duplicate blessings and impossible history", () => {
  for (const corrupt of [
    (s: E.State) => (s.expedition.seed = -1),
    (s: E.State) => (s.expedition.blessings = ["shelter", "shelter"]),
    (s: E.State) => {
      s.floor = 1;
      s.route = ["boss"];
    },
    (s: E.State) => Object.assign(s.expedition, { difficulty: "impossible" }),
  ]) {
    const s = game();
    corrupt(s);
    assert.throws(() => E.deserialize(E.serialize(s)));
  }
});
