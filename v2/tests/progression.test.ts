import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../src/engine";
import * as P from "../src/progression";
import { CARDS, CLASSES, type ClassId } from "../src/content";
import { benchHero, activateHero } from "../src/roster";

function heroState(kind: ClassId = "fighter", path = 0) {
  const s = E.createGame(42);
  s.party = [
    kind,
    ...(Object.keys(CLASSES) as ClassId[])
      .filter((k) => k !== kind)
      .slice(0, 3),
  ].map((k, i) => E.hero(k, i + 1));
  const u = s.party[0];
  u.level = 6;
  u.xp = 15;
  E.choosePath(s, u.id, path);
  return s;
}
test("training spends earned levels, requires foundation and locks specialty without reset", () => {
  const s = heroState(),
    u = s.party[0];
  assert.equal(P.availablePoints(u), 5);
  assert.throws(() => P.trainSkill(s, u.id, "fighter-0-3"), /Requires/);
  P.trainSkill(s, u.id, "fighter-0-0");
  P.trainSkill(s, u.id, "fighter-0-1");
  assert.equal(P.availablePoints(u), 2);
  assert.throws(() => P.trainSkill(s, u.id, "fighter-0-2"), /You chose/);
  P.trainSkill(s, u.id, "fighter-0-3");
  assert.equal(P.availablePoints(u), 0);
  const before = E.serialize(s);
  assert.throws(() => P.trainSkill(s, u.id, "fighter-0-3"), /Learned/);
  assert.throws(() => E.choosePath(s, u.id, 1));
  assert.equal(E.serialize(s), before);
  assert.deepEqual(E.deserialize(before).party[0].skills, u.skills);
});
test("skills enforce level, owner and phase with atomic rejection", () => {
  const s = heroState(),
    u = s.party[0];
  u.level = 2;
  u.xp = 3;
  assert.throws(() => P.trainSkill(s, u.id, "fighter-0-1"), /level 4/);
  assert.throws(() => P.trainSkill(s, u.id, "rogue-0-0"), /subclass/);
  P.trainSkill(s, u.id, "fighter-0-0");
  assert.equal(P.availablePoints(u), 0);
  E.embark(s, "Tester");
  assert.throws(() => P.trainSkill(s, u.id, "fighter-0-1"), /Guild/);
});
test("legacy paths migrate with unspent points, including reserves and graveyard", () => {
  const s = heroState("wizard", 2);
  benchHero(s, "wizard");
  P.trainSkill(s, "wizard", "wizard-2-0");
  const restored = E.deserialize(E.serialize(s));
  assert.deepEqual(restored.roster.reserves[0].skills, ["wizard-2-0"]);
  activateHero(restored, "wizard");
  const raw = JSON.parse(E.serialize(restored));
  delete raw.party.find((u: E.Unit) => u.kind === "wizard").skills;
  const migrated = E.deserialize(JSON.stringify(raw));
  const wizard = migrated.party.find((u) => u.kind === "wizard")!;
  assert.equal(wizard.path, 2);
  assert.deepEqual(wizard.skills, []);
  assert.equal(P.availablePoints(wizard), 5);
});
test("imports reject forged skill lists, cross-class skills, missing prerequisites and both specialties", () => {
  for (const skills of [
    null,
    ["missing"],
    ["toString"],
    ["rogue-0-0"],
    ["fighter-0-1"],
    ["fighter-0-0", "fighter-0-0"],
    ["fighter-0-0", "fighter-0-1", "fighter-0-2"],
  ]) {
    const s = heroState();
    (s.party[0] as unknown as { skills: unknown }).skills = skills;
    assert.throws(() => E.deserialize(E.serialize(s)), /skill/);
  }
  const s = heroState();
  s.party[0].skills = ["fighter-0-0", "fighter-0-1", "fighter-0-3"];
  s.party[0].level = 4;
  assert.throws(() => E.deserialize(E.serialize(s)), /skill/);
});

test("all 96 skill nodes have observable effects consumed by real battle resolution", () => {
  assert.equal(Object.keys(P.SKILLS).length, 96);
  for (const skill of Object.values(P.SKILLS)) {
    const s = heroState(skill.owner, skill.path),
      u = s.party[0];
    for (const id of skill.requires) P.trainSkill(s, u.id, id);
    if (skill.requiresAny) P.trainSkill(s, u.id, skill.requiresAny[0]);
    const candidates = Object.values(CARDS).filter((c) => c.owner === u.kind);
    const before = candidates.flatMap((d) =>
      [1, 2, 3, 4].map((rank) => {
        u.rank = rank;
        return {
          id: d.id,
          rank,
          definition: E.effectiveCard(s, { id: d.id, uid: 999, upgrade: 0 }),
        };
      }),
    );
    u.rank = 1;
    P.trainSkill(s, u.id, skill.id);
    if (skill.openingBlock || skill.turnBlock) {
      const opening = P.openingBlock(u),
        perTurn = P.turnBlock(u);
      E.embark(s, "Skills QA");
      E.startBattle(s, "sentries");
      assert.equal(u.block, (u.path === 2 ? 3 : 0) + opening, skill.name);
      s.battle!.intents = [];
      E.endTurn(s);
      assert.equal(u.block, (u.path === 2 ? 3 : 0) + perTurn, skill.name);
      continue;
    }
    const witness = before.find(({ id, rank, definition }) => {
      u.rank = rank;
      const after = E.effectiveCard(s, { id, uid: 999, upgrade: 0 });
      return (
        (!after.ranks.length || after.ranks.includes(rank)) &&
        JSON.stringify(after) !== JSON.stringify(definition)
      );
    });
    assert.ok(witness, `${skill.name} must affect a playable class action`);
    s.party.forEach((hero, i) => {
      hero.rank = i + 1;
    });
    const neighbor = s.party.find((hero) => hero.rank === witness.rank)!;
    [neighbor.rank, u.rank] = [u.rank, neighbor.rank];
    E.embark(s, "Skills QA");
    E.startBattle(s, "sentries");
    const b = s.battle!;
    b.enemies.forEach((enemy) => {
      enemy.hp = 10000;
      enemy.maxHp = 10000;
      enemy.block = 2;
    });
    s.party.forEach((hero) => {
      hero.hp = 1;
      hero.block = 0;
      hero.poison = 2;
    });
    const card = { id: witness.id, uid: s.nextCard++, upgrade: 0 };
    b.hand = [card];
    const definition = E.effectiveCard(s, card),
      value = E.cardValue(s, card),
      target = E.targets(s, card)[0];
    assert.ok(target, `${skill.name} target`);
    const oldIntents = b.intents
      .filter((i) => i.source === target.id)
      .map((i) => i.damage);
    const events = E.play(s, card.uid, target.id);
    if (definition.effect === "heal")
      assert.equal(
        events.find((e) => e.kind === "heal")!.value,
        Math.min(target.maxHp - 1, value),
        skill.name,
      );
    else if (["block", "step"].includes(definition.effect))
      assert.equal(
        events.find((e) => e.kind === "block")!.value,
        value,
        skill.name,
      );
    else {
      const hit = events.find((e) => e.kind === "hit")!;
      assert.equal(hit.value, value - (definition.pierce ? 0 : 2), skill.name);
      if (definition.effect === "poison")
        assert.equal(target.poison, definition.poisonAmount ?? 3, skill.name);
    }
    if (definition.selfBlock)
      assert.ok(
        events.some(
          (e) =>
            e.kind === "block" &&
            e.target === u.id &&
            e.value === definition.selfBlock,
        ),
        skill.name,
      );
    if (definition.targetBlock)
      assert.ok(
        events.some(
          (e) =>
            e.kind === "block" &&
            e.target === target.id &&
            e.value === definition.targetBlock,
        ),
        skill.name,
      );
    if (definition.partyBlock)
      assert.equal(
        events.filter(
          (e) =>
            e.kind === "block" &&
            e.source === u.id &&
            e.target !== u.id &&
            e.value === definition.partyBlock,
        ).length,
        3,
        skill.name,
      );
    if (definition.draw)
      assert.equal(b.hand.length, definition.draw, skill.name);
    if (definition.cleanse) assert.equal(target.poison, 0, skill.name);
    if (definition.weaken)
      assert.deepEqual(
        b.intents.filter((i) => i.source === target.id).map((i) => i.damage),
        oldIntents.map((n) => Math.max(0, n - definition.weaken!)),
        skill.name,
      );
  }
});

test("skill poison stacks with card mastery and printed text matches effective poison", () => {
  const s = heroState("rogue", 1);
  P.trainSkill(s, "rogue", "rogue-1-0");
  const card = { id: "venom", uid: 100, upgrade: 1 };
  const d = E.effectiveCard(s, card);
  assert.equal(d.poisonAmount, 7);
  assert.match(d.text, /Apply 7 Poison/);
  assert.equal(
    E.cardDefinition(card).poisonAmount,
    5,
    "shared card definitions remain immutable",
  );
});
