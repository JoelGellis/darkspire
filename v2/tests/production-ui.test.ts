import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../src/engine";
import * as R from "../src/roster";
import { townMarkup, buildingMarkup } from "../src/town-ui";
import { inventoryMarkup } from "../src/inventory-ui";
import { BUILDINGS, type BuildingId } from "../src/town";

test("all town interiors and inventory pages render for a wiped campaign and reserves-only camp", () => {
  const s = E.createGame();
  E.embark(s, "Town recovery");
  E.chooseRoute(s, "sentries");
  s.party.forEach((u) => (u.hp = 0));
  s.battle!.status = "lost";
  E.finishBattle(s);
  E.returnToCamp(s);
  assert.equal(s.party.length, 0);
  for (const state of [
    s,
    (() => {
      const reserves = E.createGame();
      for (const u of [...reserves.party]) R.benchHero(reserves, u.id);
      return reserves;
    })(),
  ]) {
    assert.match(townMarkup(state), /STAGECOACH/);
    for (const id of Object.keys(BUILDINGS) as BuildingId[])
      assert.ok(buildingMarkup(state, id).includes(BUILDINGS[id].name));
    for (const page of ["loadout", "bag", "merchant"])
      assert.ok(inventoryMarkup(state, page).includes("inventory-panel"));
    assert.doesNotThrow(() => E.deserialize(E.serialize(state)));
  }
});

test("save import rejects colliding actor IDs, unsupported textures and stacked enemy ranks", () => {
  for (const corrupt of [
    (s: E.State) => {
      const old = s.battle!.enemies[0].id;
      s.battle!.enemies[0].id = s.party[0].id;
      s.battle!.intents.forEach((i) => {
        if (i.source === old) i.source = s.party[0].id;
      });
    },
    (s: E.State) => (s.battle!.enemies[0].kind = "missing-texture"),
    (s: E.State) => (s.battle!.enemies[1].rank = s.battle!.enemies[0].rank),
  ]) {
    const s = E.createGame();
    E.embark(s, "Import actors");
    E.chooseRoute(s, "sentries");
    corrupt(s);
    assert.throws(() => E.deserialize(E.serialize(s)));
  }
});
