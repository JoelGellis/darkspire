import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../src/engine";
import * as R from "../src/roster";
import * as P from "../src/progression";
import * as Q from "../src/economy";
import { CLASS_STARTERS } from "../src/content";

test("recruit, reserve and embark substitute class decks while preserving veterans and stash", () => {
  const s = E.createGame();
  s.bank = 200;
  R.recruitHero(s, "barbarian");
  assert.equal(s.bank, 165);
  assert.equal(s.roster.reserves.length, 1);
  const fighter = s.party[0];
  fighter.level = 4;
  fighter.xp = 9;
  E.choosePath(s, "fighter", 0);
  P.trainSkill(s, "fighter", "fighter-0-0");
  R.benchHero(s, "fighter");
  R.activateHero(s, "barbarian");
  assert.deepEqual(s.roster.reserves[0].skills, ["fighter-0-0"]);
  assert.equal(R.recruitOffers(s).includes("fighter"), false);
  assert.throws(() => R.recruitHero(s, "fighter"));
  assert.ok(Q.baseDeck(s).includes("hew"));
  assert.ok(!Q.baseDeck(s).includes("iron-cut"));
  E.embark(s, "Roster QA");
  assert.equal(s.deck.length, 16);
  assert.deepEqual(
    s.deck
      .filter((c) => CLASS_STARTERS.barbarian.includes(c.id))
      .map((c) => c.id),
    CLASS_STARTERS.barbarian,
  );
  assert.throws(() => R.benchHero(s, "barbarian"));
  assert.throws(() => R.recruitHero(s, "ranger"));
  assert.deepEqual(E.deserialize(E.serialize(s)).roster.reserves[0].skills, [
    "fighter-0-0",
  ]);
});
test("a wipe leaves no automatic replacements and a penniless campaign can rebuild freely", () => {
  const s = E.createGame();
  s.bank = 0;
  E.embark(s, "Wipe QA");
  E.startBattle(s, "sentries");
  s.party.forEach((u) => {
    u.hp = 0;
  });
  s.battle!.status = "lost";
  E.finishBattle(s);
  E.returnToCamp(s);
  assert.equal(s.party.length, 0);
  assert.equal(s.graveyard.length, 4);
  assert.throws(() => E.embark(s, "Incomplete"), /four living/);
  for (const kind of ["barbarian", "paladin", "ranger", "necromancer"] as const)
    R.recruitHero(s, kind);
  assert.equal(s.bank, 0);
  assert.equal(s.party.length, 4);
  assert.throws(() => R.recruitHero(s, "fighter"), /35/);
  E.embark(s, "Rebuilt");
  assert.equal(s.deck.length, 16);
  assert.equal(E.deserialize(E.serialize(s)).graveyard.length, 4);
});
test("one casualty remains dead, partial replacement has fresh training, reserves remain intact", () => {
  const s = E.createGame();
  s.bank = 50;
  R.recruitHero(s, "ranger");
  s.party[0].level = 6;
  s.party[0].xp = 15;
  E.choosePath(s, "fighter", 2);
  P.trainSkill(s, "fighter", "fighter-2-0");
  E.embark(s, "Loss QA");
  E.startBattle(s, "sentries");
  s.party[0].hp = 0;
  E.finishRun(s, "flee");
  E.returnToCamp(s);
  assert.equal(s.party.length, 3);
  assert.equal(s.graveyard[0].level, 6);
  assert.equal(s.roster.reserves.length, 1);
  assert.equal(
    R.recruitCost(s),
    35,
    "existing reserve counts toward replacement safety net",
  );
  R.activateHero(s, "ranger");
  assert.equal(s.party.length, 4);
  s.bank = 35;
  R.recruitHero(s, "fighter");
  const replacement = s.roster.reserves.find((u) => u.kind === "fighter")!;
  assert.equal(replacement.level, 1);
  assert.equal(replacement.path, null);
  assert.deepEqual(replacement.skills, []);
  assert.deepEqual(E.deserialize(E.serialize(s)).graveyard[0].skills, [
    "fighter-2-0",
  ]);
});
test("reserve saves reject duplicate ownership, equipped reserves, dead reserves and forged skills", () => {
  const s = E.createGame();
  R.recruitHero(s, "barbarian");
  const original = E.serialize(s);
  const mutations = [
    (x: E.State) => {
      x.roster.reserves.push(structuredClone(x.party[0]));
    },
    (x: E.State) => {
      x.roster.reserves[0].hp = 0;
    },
    (x: E.State) => {
      x.roster.reserves[0].skills = ["barbarian-0-3"];
    },
    (x: E.State) => {
      x.roster.reserves[0].gear = "blade";
    },
  ];
  for (const mutate of mutations) {
    const x = JSON.parse(original) as E.State;
    mutate(x);
    assert.throws(() => E.deserialize(E.serialize(x)));
  }
  const legacy = JSON.parse(E.serialize(E.createGame()));
  delete legacy.roster;
  assert.deepEqual(E.deserialize(JSON.stringify(legacy)).roster, {
    reserves: [],
    recruits: 0,
  });
});
test("benching returns every item to safe storage and reserve wounds can be treated", () => {
  const s = E.createGame();
  s.bank = 100;
  const armor = { uid: s.economy.nextItem++, id: "coat", foundRun: null };
  s.economy.stash.push(armor);
  Q.equip(s, armor.uid, "fighter");
  const fighter = s.party[0];
  fighter.hp = fighter.maxHp;
  fighter.wounded = true;
  const armoredMax = fighter.maxHp;
  R.benchHero(s, "fighter");
  assert.equal(fighter.maxHp, armoredMax - 8);
  assert.equal(fighter.hp, fighter.maxHp);
  assert.deepEqual(fighter.equipment, []);
  assert.deepEqual(s.economy.stash, [armor]);
  E.healWound(s, "fighter");
  assert.equal(fighter.wounded, false);
  assert.equal(s.bank, 85);
  assert.deepEqual(E.deserialize(E.serialize(s)).economy.stash, [armor]);
  R.activateHero(s, "fighter");
  Q.equip(s, armor.uid, "fighter");
  assert.equal(
    fighter.hp,
    armoredMax - 8,
    "reserve transfer never heals via armor swapping",
  );
});
test("dead enemy gaps close after direct, cleave and poison damage so melee can finish", () => {
  for (const mode of ["direct", "poison", "cleave"]) {
    const s = E.createGame();
    E.embark(s, "Rank QA");
    E.startBattle(s, "sentries");
    const b = s.battle!;
    b.enemies[0].hp = 1;
    if (mode === "poison") {
      b.enemies[0].poison = 2;
      b.intents = [];
      E.endTurn(s);
    } else {
      const card = {
        id: mode === "cleave" ? "nova" : "iron-cut",
        uid: s.nextCard++,
        upgrade: 0,
      };
      b.hand = [card];
      E.play(s, card.uid, b.enemies[0].id);
    }
    assert.equal(b.enemies[0].hp, 0);
    assert.equal(b.enemies[1].rank, 1);
    assert.equal(b.enemies[2].rank, 2);
    assert.equal(new Set(b.enemies.map((u) => u.rank)).size, 3);
    const cut = { id: "iron-cut", uid: s.nextCard++, upgrade: 0 };
    b.hand = [cut];
    b.energy = 3;
    assert.deepEqual(
      E.targets(s, cut).map((u) => u.id),
      ["enemy-1", "enemy-2"],
    );
    if (mode === "cleave")
      assert.ok(
        b.enemies[1].hp < b.enemies[1].maxHp &&
          b.enemies[2].hp < b.enemies[2].maxHp,
      );
  }
});
