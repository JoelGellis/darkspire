import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../src/engine";
import * as R from "../src/roster";
import { CARDS, CLASSES, CLASS_STARTERS, type ClassId } from "../src/content";
import { fight } from "../scripts/combat-policy";
import { takeRoute, visitShrine } from "../scripts/expedition-policy";

test("every class card and mastery resolves through real targeting, spending and save reload", () => {
  for (const id of Object.keys(CARDS))
    for (const upgrade of [0, 1]) {
      const s = E.createGame(51),
        def = CARDS[id];
      if (!s.party.some((u) => u.kind === def.owner))
        s.party[0] = E.hero(def.owner, 1);
      const owner = s.party.find((u) => u.kind === def.owner)!;
      const card: E.Card = { id, uid: s.nextCard++, upgrade };
      const resolved = E.effectiveCard(s, card);
      const rank = resolved.ranks[0] ?? owner.rank;
      const neighbor = s.party.find((u) => u.rank === rank)!;
      [owner.rank, neighbor.rank] = [neighbor.rank, owner.rank];
      E.embark(s, "Card rules verification");
      E.chooseRoute(s, "sentries");
      // Replace the hand with a legal card instance, preserving the rest of the real battle.
      card.uid = s.nextCard++;
      s.battle!.discard.push(...s.battle!.hand.splice(0));
      s.battle!.hand.push(card);
      const target = E.targets(s, card)[0];
      assert.ok(target, `${id}+${upgrade} should have a legal target`);
      const preview = E.preview(s, card, target.id);
      assert.ok(preview.length > 0);
      E.play(s, card.uid, target.id, false);
      assert.equal(s.battle!.energy, 3 - resolved.cost, `${id}+${upgrade}`);
      assert.equal(new Set(s.party.map((u) => u.rank)).size, 4);
      assert.deepEqual(E.deserialize(E.serialize(s)), s, `${id}+${upgrade}`);
      assert.throws(() => E.play(s, card.uid, target.id));
    }
});

test("all eight classes participate in bounded real expeditions with recruited parties", () => {
  const cohorts: ClassId[][] = [
    ["fighter", "ranger", "cleric", "necromancer"],
    ["barbarian", "rogue", "paladin", "wizard"],
    ["barbarian", "paladin", "ranger", "necromancer"],
  ];
  const participated = new Set<string>();
  let victories = 0;
  for (const cohort of cohorts)
    for (let seed = 1; seed <= 6; seed++) {
      let s = E.createGame(seed);
      // A funded estate is the fixture; recruiting and all combat use production actions.
      s.bank = 200;
      for (const u of [...s.party]) R.benchHero(s, u.id);
      for (const kind of cohort) {
        if (s.roster.reserves.some((u) => u.kind === kind))
          R.activateHero(s, kind);
        else R.recruitHero(s, kind);
        participated.add(kind);
      }
      E.embark(s, "Eight-class expedition verification");
      assert.equal(s.deck.length, 16);
      assert.ok(s.deck.every((c) => cohort.includes(CARDS[c.id].owner)));
      let decisions = 0;
      while (s.screen !== "summary" && decisions++ < 40) {
        if (s.screen === "map") takeRoute(s, "safe");
        else if (s.screen === "combat") fight(s);
        else if (s.screen === "reward")
          E.claimReward(s, s.reward[0]?.uid ?? null);
        else if (s.screen === "rest") E.rest(s, "heal");
        else if (s.screen === "shrine") visitShrine(s);
        else if (s.screen === "shop") s.screen = "map";
        else assert.fail(`Unexpected screen ${s.screen}`);
        s = E.deserialize(E.serialize(s));
      }
      assert.equal(
        s.screen,
        "summary",
        `cohort ${cohort} seed ${seed} did not finish`,
      );
      assert.ok(["victory", "defeat"].includes(s.outcome));
      if (s.outcome === "victory") {
        victories++;
        assert.equal(s.floor, 7);
      }
      E.returnToCamp(s);
      assert.doesNotThrow(() => E.deserialize(E.serialize(s)));
    }
  assert.equal(participated.size, Object.keys(CLASSES).length);
  assert.ok(
    victories > 0,
    "At least one recruited formation must be able to complete the expedition",
  );
});

test("empty and partial camp rosters save safely but cannot embark or lose currency", () => {
  const s = E.createGame();
  for (const u of [...s.party]) R.benchHero(s, u.id);
  assert.equal(s.party.length, 0);
  const snapshot = E.serialize(s);
  assert.doesNotThrow(() => E.deserialize(snapshot));
  assert.throws(() => E.embark(s, "Incomplete party"));
  assert.equal(E.serialize(s), snapshot);
  R.activateHero(s, "fighter");
  assert.throws(() => E.embark(s, "Incomplete party"));
  assert.doesNotThrow(() => E.deserialize(E.serialize(s)));
});

test("the expanded class catalog has complete, owner-correct starter kits", () => {
  assert.equal(Object.keys(CLASSES).length, 8);
  assert.equal(Object.keys(CARDS).length, 72);
  for (const kind of Object.keys(CLASSES) as ClassId[]) {
    assert.equal(CLASS_STARTERS[kind].length, 4);
    assert.ok(
      CLASS_STARTERS[kind].every(
        (id) => CARDS[id]?.owner === kind && !CARDS[id].discovery,
      ),
    );
  }
});

test("malformed combat power is rejected before a loaded turn can corrupt HP", () => {
  for (const power of ["twelve", null, -1, 1.5]) {
    const s = E.createGame();
    E.embark(s, "Import validation");
    E.chooseRoute(s, "sentries");
    Object.assign(s.battle!.enemies[0], { power });
    assert.throws(() => E.deserialize(E.serialize(s)), String(power));
  }
});

test("Veteran expeditions terminate through real combat and preserve configured difficulty", () => {
  for (let seed = 1; seed <= 8; seed++) {
    let s = E.createGame(seed);
    E.configureExpedition(s, { difficulty: "veteran" });
    E.embark(s, "Veteran systems verification");
    let decisions = 0;
    while (s.screen !== "summary" && decisions++ < 40) {
      if (s.screen === "map") takeRoute(s, "loot");
      else if (s.screen === "combat") fight(s);
      else if (s.screen === "reward")
        E.claimReward(s, s.reward[0]?.uid ?? null);
      else if (s.screen === "rest") E.rest(s, "heal");
      else if (s.screen === "shrine") visitShrine(s);
      else if (s.screen === "shop") s.screen = "map";
      else assert.fail(`Unexpected screen ${s.screen}`);
      s = E.deserialize(E.serialize(s));
      assert.equal(s.expedition.difficulty, "veteran");
    }
    assert.equal(s.screen, "summary");
    assert.ok(["victory", "defeat"].includes(s.outcome));
  }
});
