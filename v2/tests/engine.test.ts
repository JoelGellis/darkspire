import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../src/engine";
import { CARDS } from "../src/content";
import { recruitHero } from "../src/roster";
function battle(seed = 42) {
  const s = E.createGame(seed);
  E.embark(s, "QA · scripted tactician v1");
  E.chooseRoute(s, "sentries");
  return s;
}
function hand(s: E.State, ...ids: string[]) {
  s.battle!.hand = ids.map((id) => ({ id, uid: s.nextCard++, upgrade: 0 }));
}
test("requires identity, isolates campaign schema, rejects illegal routes", () => {
  const s = E.createGame();
  assert.throws(() => E.embark(s, ""));
  E.embark(s, "Tester");
  assert.throws(() => E.chooseRoute(s, "boss"));
  assert.equal(s.floor, 0);
  assert.throws(() => E.deserialize('{"schema":3}'));
});
test("rank and reach restrictions are enforced without spending energy", () => {
  const s = battle();
  hand(s, "backstab", "sunder");
  s.party[1].rank = 4;
  s.party[3].rank = 2;
  assert.throws(() => E.play(s, s.battle!.hand[0].uid, "enemy-0"), /rank/);
  assert.throws(() => E.play(s, s.battle!.hand[1].uid, "enemy-2"), /reach/);
  assert.equal(s.battle!.energy, 3);
});
test("damage consumes block before HP; card can only be played once", () => {
  const s = battle();
  hand(s, "iron-cut");
  const c = s.battle!.hand[0],
    u = s.battle!.enemies[0];
  u.block = 4;
  const hp = u.hp;
  E.play(s, c.uid, u.id);
  assert.equal(u.block, 0);
  assert.equal(u.hp, hp - 5);
  assert.equal(s.battle!.energy, 2);
  assert.throws(() => E.play(s, c.uid, u.id));
});
test("targeted block protects the named intent and expires at turn start", () => {
  const s = battle();
  hand(s, "hold-fast");
  s.battle!.intents = [{ source: "enemy-0", target: "fighter", damage: 7 }];
  const u = s.party[0],
    hp = u.hp;
  E.play(s, s.battle!.hand[0].uid, u.id);
  assert.equal(u.block, 12);
  E.endTurn(s);
  assert.equal(u.hp, hp);
  assert.equal(u.block, 0);
  assert.equal(s.battle!.energy, 3);
  assert.equal(s.battle!.hand.length, 5);
});
test("class defenses enforce self targets and charge for flexible protection", () => {
  const s = battle();
  hand(s, "hold-fast", "backstep", "aegis", "ward");
  const [tank, rogue, wizard, cleric] = [...s.battle!.hand];
  for (const [card, owner] of [
    [tank, "fighter"],
    [rogue, "rogue"],
    [wizard, "wizard"],
  ] as const) {
    assert.deepEqual(
      E.targets(s, card).map((u) => u.id),
      [owner],
    );
    const before = E.serialize(s);
    assert.throws(() => E.play(s, card.uid, "cleric"));
    assert.equal(E.serialize(s), before);
  }
  E.play(s, tank.uid, "fighter");
  assert.equal(s.party[0].block, 12);
  E.play(s, rogue.uid, "rogue");
  assert.equal(s.party[1].block, 5);
  assert.equal(s.party[1].rank, 3);
  assert.equal(s.party[2].rank, 2);
  assert.equal(s.battle!.energy, 2);
  assert.equal(E.targets(s, cleric).length, 4);
  E.play(s, cleric.uid, "wizard");
  assert.equal(s.party[3].block, 7);
  assert.equal(s.battle!.energy, 1);
});

test("Shield is free, self-only and stays exhausted through a reshuffle", () => {
  const s = battle();
  hand(s, "aegis");
  const card = s.battle!.hand[0];
  s.battle!.energy = 0;
  E.play(s, card.uid, "wizard");
  assert.equal(s.party[3].block, 7);
  assert.equal(s.battle!.energy, 0);
  assert.deepEqual(s.battle!.exhaust, [card]);
  s.battle!.draw = [];
  s.battle!.intents = [];
  E.endTurn(s);
  assert.ok(!s.battle!.hand.some((c) => c.uid === card.uid));
  assert.deepEqual(s.battle!.exhaust, [card]);
});

test("enemy cast and melee events preserve committed damage and absorbed totals", () => {
  const s = battle();
  s.battle!.intents = [
    { source: "enemy-0", target: "fighter", damage: 7 },
    { source: "enemy-1", target: "wizard", damage: 6 },
    { source: "enemy-2", target: "wizard", damage: 5 },
  ];
  s.party[0].block = 7;
  const events = E.endTurn(s).filter((e) => e.kind === "hit");
  assert.equal(events[0].style, "strike");
  assert.equal(events[0].value, 0);
  assert.equal(events[0].blocked, 7);
  assert.equal(events[1].style, "spell");
  assert.equal(events[2].style, "spell");
  assert.equal(s.party[3].hp, 21);
});

test("poison ticks through block, can kill before the enemy attacks", () => {
  const s = battle();
  const u = s.battle!.enemies[0],
    hp = s.party[0].hp;
  u.hp = 2;
  u.block = 100;
  u.poison = 3;
  s.battle!.intents = [{ source: u.id, target: "fighter", damage: 20 }];
  E.endTurn(s);
  assert.equal(u.hp, 0);
  assert.equal(u.block, 100);
  assert.equal(s.party[0].hp, hp);
});
test("healing is capped and exhausts; dead allies are not valid targets", () => {
  const s = battle();
  hand(s, "mend");
  const c = s.battle!.hand[0];
  s.party[0].hp -= 3;
  E.play(s, c.uid, "fighter");
  assert.equal(s.party[0].hp, s.party[0].maxHp);
  assert.equal(s.battle!.exhaust.length, 1);
  hand(s, "mend");
  s.party[0].hp = 0;
  assert.throws(() => E.play(s, s.battle!.hand[0].uid, "fighter"));
});
test("movement preserves unique ranks including fallen slots", () => {
  const s = battle();
  s.party[1].hp = 0;
  E.move(s, "fighter", 1);
  assert.deepEqual(
    s.party.map((u) => u.rank),
    [2, 1, 3, 4],
  );
  assert.equal(s.battle!.energy, 2);
  hand(s, "backstep");
  s.party[1].hp = 10;
  E.play(s, s.battle!.hand[0].uid, "rogue");
  assert.equal(new Set(s.party.map((u) => u.rank)).size, 4);
});
test("exact save/resume preserves next turn RNG, piles, intents and effects", () => {
  const s = battle(123);
  hand(s, "venom");
  E.play(s, s.battle!.hand[0].uid, "enemy-2");
  const resumed = E.deserialize(E.serialize(s));
  assert.deepEqual(E.endTurn(s), E.endTurn(resumed));
  assert.deepEqual(s, resumed);
});
test("no dead-hero cards in a new fight, and rewards match survivors", () => {
  const s = battle();
  s.party[0].hp = 0;
  E.startBattle(s, "beasts");
  assert.ok(
    [...s.battle!.draw, ...s.battle!.hand].every(
      (c) => CARDS[c.id].owner !== "fighter",
    ),
  );
  s.battle!.enemies.forEach((u) => (u.hp = 0));
  s.battle!.status = "won";
  E.finishBattle(s);
  assert.ok(s.reward.every((c) => CARDS[c.id].owner !== "fighter"));
  const n = s.deck.length;
  E.claimReward(s, s.reward[0].uid);
  assert.equal(s.deck.length, n + 1);
  assert.throws(() => E.claimReward(s, null));
});
test("equipment costs real gold and subclass choices survive saves", () => {
  const s = E.createGame();
  E.buyGear(s, "fighter", "blade");
  assert.equal(s.bank, 10);
  assert.equal(E.power(s.party[0]), 2);
  assert.throws(() => E.buyGear(s, "fighter", "coat"));
  s.party[0].xp = 3;
  s.party[0].level = 2;
  E.choosePath(s, "fighter", 0);
  assert.equal(E.power(s.party[0]), 5);
  assert.throws(() => E.choosePath(s, "fighter", 2));
  assert.equal(E.deserialize(E.serialize(s)).party[0].path, 0);
});
test("flee wounds survivors, loses gathered gold and fallen equipment", () => {
  const s = battle();
  s.party[0].gear = "blade";
  s.party[0].hp = 0;
  s.gold = 40;
  const bank = s.bank;
  E.finishRun(s, "flee");
  assert.equal(s.bank, bank);
  assert.equal(s.party[1].wounded, true);
  assert.equal(s.graveyard.length, 1);
  E.returnToCamp(s);
  assert.equal(
    s.party.some((u) => u.kind === "fighter"),
    false,
  );
  assert.equal(s.party.find((u) => u.id === "rogue")!.wounded, true);
  recruitHero(s, "fighter");
  assert.equal(s.party.find((u) => u.id === "fighter")!.gear, null);
  assert.equal(s.party.find((u) => u.id === "fighter")!.level, 1);
  E.healWound(s, "rogue");
  assert.equal(s.bank, bank - 15);
  assert.equal(s.party.find((u) => u.id === "rogue")!.wounded, false);
});
test("retreat banks half run gold once; rest and altar cannot be repeated", () => {
  const s = battle();
  s.screen = "map";
  s.gold = 35;
  const bank = s.bank;
  E.finishRun(s, "retreat");
  assert.equal(s.bank, bank + 17);
  assert.throws(() => E.finishRun(s, "retreat"));
  const r = battle();
  r.screen = "rest";
  r.party[0].hp = 10;
  E.rest(r, "heal");
  assert.equal(r.party[0].hp, 26);
  assert.throws(() => E.rest(r, "heal"));
  r.screen = "shrine";
  E.shrine(r, true);
  assert.equal(r.blessing, true);
  assert.equal(r.party[0].hp, 21);
  assert.throws(() => E.shrine(r, true));
});
test("draw/discard conserves unique cards through repeated shuffles", () => {
  const s = battle();
  for (let i = 0; i < 8; i++) {
    s.battle!.intents = [];
    E.endTurn(s);
    const cards = [
      ...s.battle!.hand,
      ...s.battle!.draw,
      ...s.battle!.discard,
      ...s.battle!.exhaust,
    ];
    assert.equal(cards.length, s.deck.length);
    assert.equal(new Set(cards.map((c) => c.uid)).size, cards.length);
  }
});
test("gear transfers and salvage conserve inventory and adjust HP caps", () => {
  const s = E.createGame();
  E.buyGear(s, "fighter", "coat");
  assert.equal(s.party[0].maxHp, 60);
  E.swapGear(s, "fighter", "wizard");
  assert.equal(s.party[0].maxHp, 52);
  assert.equal(s.party[0].hp, 52);
  assert.equal(s.party[3].maxHp, 40);
  assert.equal(s.party[3].hp, 32);
  E.salvage(s, "wizard");
  assert.equal(s.bank, 27);
  assert.equal(s.party[3].gear, null);
  assert.equal(s.party[3].maxHp, 32);
  assert.throws(() => E.salvage(s, "wizard"));
});
test("camp formation is free and remains valid after embark", () => {
  const s = E.createGame();
  E.reorder(s, "fighter", 1);
  E.embark(s, "Keeper");
  assert.equal(s.party[0].rank, 2);
  assert.equal(s.party[1].rank, 1);
  assert.equal(s.bank, 40);
  assert.throws(() => E.reorder(s, "fighter", 1));
  assert.doesNotThrow(() => E.deserialize(E.serialize(s)));
});
test("malformed imports reject invalid HP, currency, cards, ranks and piles", () => {
  for (const corrupt of [
    (s: E.State) => {
      s.bank = -1;
    },
    (s: E.State) => {
      s.party[0].hp = 9999;
    },
    (s: E.State) => {
      s.party[0].rank = 3;
    },
    (s: E.State) => {
      s.battle!.draw.push(s.battle!.hand[0]);
    },
    (s: E.State) => {
      s.battle!.energy = 99;
    },
    (s: E.State) => {
      s.deck[0].id = "not-real";
    },
  ]) {
    const s = battle();
    corrupt(s);
    assert.throws(() => E.deserialize(E.serialize(s)));
  }
});
test("completed combat can resume and award its outcome exactly once", () => {
  const s = battle();
  s.battle!.enemies.forEach((u) => (u.hp = 0));
  s.battle!.status = "won";
  const restored = E.deserialize(E.serialize(s));
  E.finishBattle(restored);
  assert.equal(restored.gold, 20);
  assert.equal(restored.screen, "reward");
  assert.throws(() => E.finishBattle(restored));
});
test("earned tonics heal without energy, cannot revive and reset next expedition", () => {
  const s = battle();
  s.battle!.status = "won";
  s.battle!.enemies.forEach((u) => (u.hp = 0));
  E.finishBattle(s);
  assert.equal(s.potions, 1);
  E.claimReward(s, null);
  E.startBattle(s, "boss");
  s.party[0].hp -= 18;
  const energy = s.battle!.energy;
  E.useTonic(s, "fighter");
  assert.equal(s.party[0].hp, s.party[0].maxHp - 6);
  assert.equal(s.battle!.energy, energy);
  assert.equal(s.potions, 0);
  assert.throws(() => E.useTonic(s, "fighter"));
  s.potions = 1;
  s.party[0].hp = 0;
  assert.throws(() => E.useTonic(s, "fighter"));
  E.finishRun(s, "flee");
  E.returnToCamp(s);
  recruitHero(s, "fighter");
  E.embark(s, "Keeper");
  assert.equal(s.potions, 0);
});
test("old slice saves gain an empty tonic inventory and combat previews match damage", () => {
  const s = battle();
  const legacy = JSON.parse(E.serialize(s));
  delete legacy.potions;
  assert.equal(E.deserialize(JSON.stringify(legacy)).potions, 0);
  hand(s, "iron-cut");
  const u = s.battle!.enemies[0];
  u.hp = 4;
  u.block = 5;
  const c = s.battle!.hand[0];
  assert.match(E.preview(s, c, u.id), /4 HP lost, 5 absorbed by Block.*lethal/);
  const event = E.play(s, c.uid, u.id)[0];
  assert.equal(event.value, 4);
  assert.equal(event.blocked, 5);
});
