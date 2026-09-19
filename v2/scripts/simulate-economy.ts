import * as E from "../src/engine";
import * as Q from "../src/economy";
import { ITEMS } from "../src/items";
import { fight } from "./combat-policy";
import { takeRoute, visitShrine, assembleParty } from "./expedition-policy";

// Compare visible-stock policies over repeated expeditions, with save validation after every node.
const value = (id: string) => {
  const d = ITEMS[id];
  return (
    (d.power ?? 0) * 3 +
    (d.hp ?? 0) * 0.3 +
    (d.block ?? 0) +
    (d.card ? 4 : 0) +
    (d.aura ? 6 : 0)
  );
};
function dress(s: E.State, camp: boolean) {
  if (camp) {
    for (const u of s.party)
      for (const i of [...(u.equipment ?? [])]) Q.unequip(s, i.uid);
    for (const i of [...s.economy.artifacts]) Q.unequip(s, i.uid);
  }
  const bag = camp ? s.economy.stash : s.economy.pack;
  for (const i of [...bag].sort((a, b) => value(b.id) - value(a.id))) {
    const d = ITEMS[i.id];
    if (d.slot === "artifact") {
      if (
        (!camp || !s.economy.artifacts.length) &&
        !s.economy.artifacts.some((a) => a.id === i.id)
      )
        Q.equip(s, i.uid, "party");
    } else {
      const hero = s.party
        .filter(
          (u) =>
            u.hp > 0 &&
            (!d.owner || u.kind === d.owner) &&
            (!camp || !u.equipment?.length),
        )
        .find((u) => {
          const old = u.equipment?.find((g) => ITEMS[g.id].slot === d.slot);
          return !old || value(i.id) > value(old.id);
        });
      if (hero) Q.equip(s, i.uid, hero.id);
    }
  }
}
const output = [];
for (const policy of ["save", "basics", "rare"] as const) {
  let wins = 0,
    purchases = 0,
    rare = 0,
    bank = 0,
    owned = 0;
  for (let seed = 1; seed <= 16; seed++) {
    let s = E.createGame(seed);
    for (let run = 0; run < 3; run++) {
      assembleParty(s);
      dress(s, true);
      E.embark(s, `Economy simulation - ${policy}`);
      let bound = 0;
      while (s.screen !== "summary" && bound++ < 30) {
        switch (s.screen) {
          case "map":
            dress(s, false);
            takeRoute(s, "loot");
            break;
          case "combat":
            fight(s);
            break;
          case "reward":
            E.claimReward(s, null);
            break;
          case "rest":
            E.rest(s, "heal");
            break;
          case "shrine":
            visitShrine(s);
            break;
          case "shop": {
            dress(s, false);
            if (policy !== "save") {
              const offers = [...Q.stock(s)]
                .filter((id) =>
                  policy === "basics"
                    ? ITEMS[id].tier === 0
                    : ITEMS[id].tier >= 2,
                )
                .sort((a, b) => value(b) - value(a));
              for (const id of offers) {
                if (s.gold >= ITEMS[id].cost) {
                  Q.buy(s, id);
                  purchases++;
                  if (ITEMS[id].tier >= 2) rare++;
                  dress(s, false);
                }
              }
            }
            s.screen = "map";
            break;
          }
          default:
            throw Error(`Unexpected screen ${s.screen}`);
        }
        s = E.deserialize(E.serialize(s));
      }
      if (s.screen !== "summary")
        throw Error("Campaign exceeded decision bound");
      if (s.outcome === "victory") wins++;
      E.returnToCamp(s);
      s = E.deserialize(E.serialize(s));
    }
    bank += s.bank;
    owned +=
      s.economy.stash.length +
      s.economy.artifacts.length +
      s.party.reduce((n, u) => n + (u.equipment?.length ?? 0), 0);
  }
  output.push({
    policy,
    expeditions: 48,
    wins,
    purchases,
    rarePurchases: rare,
    averageFinalBank: bank / 16,
    averageOwnedItems: owned / 16,
  });
}
console.log(JSON.stringify(output, null, 2));
