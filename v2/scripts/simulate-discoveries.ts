import assert from "node:assert/strict";
import * as E from "../src/engine";
import * as T from "../src/town";
import { CARDS } from "../src/content";
import { fight } from "./combat-policy";
import { takeRoute, visitShrine, assembleParty } from "./expedition-policy";

// Whole expeditions with actual discoveries, rest upgrades and estate investment.
// Bounded scripted verification, never a proxy for human enjoyment.
const results = [];
for (const invest of [false, true])
  for (let seed = 1; seed <= 16; seed++) {
    let s = E.createGame(seed);
    for (let run = 0; run < 3; run++) {
      assembleParty(s);
      if (invest)
        for (const id of [
          "guild",
          "smith",
          "chapel",
          "waystation",
          "infirmary",
        ] as const) {
          if (T.level(s, id) < 3 && s.bank >= T.upgradeCost(s, id))
            T.upgrade(s, id);
        }
      E.embark(
        s,
        `scripted discovery-policy v1 / ${invest ? "estate" : "save"}`,
      );
      let steps = 0;
      while (s.screen !== "summary" && steps++ < 35) {
        switch (s.screen) {
          case "map":
            takeRoute(s, seed % 2 ? "discovery" : "safe");
            break;
          case "combat":
            fight(s);
            break;
          case "reward":
            if (s.town.redraws && run === 1) E.redrawReward(s);
            E.claimReward(s, s.reward[run % s.reward.length]?.uid ?? null);
            break;
          case "rest": {
            const choice =
              s.deck.find((c) => CARDS[c.id].discovery && !c.upgrade) ??
              s.deck.find((c) => !c.upgrade);
            if (choice) E.rest(s, "upgrade", choice.uid);
            else E.rest(s, "heal");
            break;
          }
          case "shrine":
            visitShrine(s);
            break;
          case "shop":
            s.screen = "map";
            break;
          default:
            throw Error(`Unexpected screen ${s.screen}`);
        }
        s = E.deserialize(E.serialize(s));
      }
      assert.equal(s.screen, "summary", "expedition exceeded bound");
      results.push({
        seed,
        run,
        invest,
        outcome: s.outcome,
        discoveries: s.deck.filter((c) => CARDS[c.id].discovery).length,
        upgrades: s.deck.filter((c) => c.upgrade).length,
      });
      E.returnToCamp(s);
      s = E.deserialize(E.serialize(s));
    }
  }
const discoveryRuns = results.filter((r) => r.discoveries > 0).length;
assert.ok(discoveryRuns > 0);
assert.ok(results.some((r) => r.upgrades > 0));
console.log(
  JSON.stringify(
    {
      expeditions: results.length,
      withDiscoveries: discoveryRuns,
      withUpgrades: results.filter((r) => r.upgrades > 0).length,
      wins: results.filter((r) => r.outcome === "victory").length,
      defeats: results.filter((r) => r.outcome === "defeat").length,
    },
    null,
    2,
  ),
);
