import * as E from "../src/engine";
import { fight } from "./combat-policy";
import { takeRoute, visitShrine } from "./expedition-policy";
const results = [];
for (let seed = 1; seed <= 32; seed++) {
  let s = E.createGame(seed);
  E.buyGear(s, "fighter", "blade");
  E.embark(s, "scripted tactician v1 · deterministic visible-state policy");
  let count = 0;
  while (s.screen !== "summary" && count++ < 30) {
    switch (s.screen) {
      case "map":
        takeRoute(s, "safe");
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
      case "shop":
        s.screen = "map";
        break;
      default:
        throw Error(s.screen);
    }
    s = E.deserialize(E.serialize(s));
  }
  if (s.screen !== "summary")
    throw Error(`Seed ${seed} exceeded expedition decision bound.`);
  results.push({
    seed,
    outcome: s.outcome,
    survivors: E.alive(s.party).length,
    actions: s.journal.length,
    depth: s.floor,
    route: s.route,
  });
}
console.log(
  JSON.stringify(
    {
      runs: results.length,
      wins: results.filter((r) => r.outcome === "victory").length,
      results,
    },
    null,
    2,
  ),
);
