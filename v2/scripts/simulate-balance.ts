import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import * as E from "../src/engine";
import * as Q from "../src/economy";
import * as R from "../src/roster";
import * as T from "../src/town";
import { type ClassId } from "../src/content";
import { ITEMS } from "../src/items";
import { configureExpedition, routeMap } from "../src/expedition";
import { fight } from "./combat-policy";

const parties: Record<string, ClassId[]> = {
  founders: ["fighter", "rogue", "cleric", "wizard"],
  newcomers: ["paladin", "barbarian", "ranger", "necromancer"],
  mixed: ["barbarian", "paladin", "cleric", "ranger"],
};
type Policy = "save" | "basics" | "rare" | "estate";
const score = (id: string) => {
  const d = ITEMS[id];
  return (
    (d.power ?? 0) * 4 +
    (d.hp ?? 0) * 0.35 +
    (d.block ?? 0) +
    (d.card ? 4 : 0) +
    (d.aura ? 10 : 0) +
    (d.auras?.length ?? 0) * 10
  );
};
function dress(s: E.State) {
  const camp = s.screen === "camp";
  if (camp) {
    for (const hero of s.party)
      for (const item of [...(hero.equipment ?? [])]) Q.unequip(s, item.uid);
    for (const item of [...s.economy.artifacts]) Q.unequip(s, item.uid);
  }
  const bag = camp ? s.economy.stash : s.economy.pack;
  for (const item of [...bag].sort((a, b) => score(b.id) - score(a.id))) {
    const d = ITEMS[item.id];
    if (d.slot === "artifact") {
      if (
        (!camp || !s.economy.artifacts.length) &&
        !s.economy.artifacts.some((i) => i.id === item.id)
      )
        Q.equip(s, item.uid, "party");
    } else {
      const hero = s.party.find(
        (u) =>
          u.hp > 0 &&
          (!d.owner || d.owner === u.kind) &&
          (!camp || !u.equipment?.length) &&
          !(u.equipment ?? []).some(
            (i) => ITEMS[i.id].slot === d.slot && score(i.id) >= score(item.id),
          ),
      );
      if (hero) Q.equip(s, item.uid, hero.id);
    }
  }
}
function buy(s: E.State, policy: Policy) {
  if (policy === "save" || policy === "estate") return;
  const purse = s.screen === "camp" ? "bank" : "gold";
  for (const id of [...Q.stock(s)]
    .filter((id) =>
      policy === "basics" ? ITEMS[id].tier === 0 : ITEMS[id].tier >= 2,
    )
    .sort((a, b) => score(b) - score(a))) {
    const d = ITEMS[id];
    const useful =
      d.slot === "artifact"
        ? !s.economy.artifacts.some((i) => i.id === id)
        : s.party.some(
            (u) =>
              (!d.owner || d.owner === u.kind) &&
              !(u.equipment ?? []).some(
                (i) => ITEMS[i.id].slot === d.slot && score(i.id) >= score(id),
              ),
          );
    if (useful && s[purse] >= d.cost) {
      Q.buy(s, id);
      dress(s);
    }
  }
}
const rows: object[] = [];
for (const [partyName, kinds] of Object.entries(parties))
  for (const difficulty of ["standard", "veteran"] as const)
    for (const policy of ["save", "basics", "rare", "estate"] as const) {
      let wins = 0,
        deaths = 0,
        earned = 0,
        spent = 0,
        salvage = 0,
        unbankedGold = 0,
        lost = 0,
        bank = 0,
        permanentInvestment = 0,
        retainedValue = 0,
        completed = 0;
      for (let seed = 1; seed <= 8; seed++) {
        const before = {
          earned,
          spent,
          salvage,
          permanentInvestment,
          unbankedGold,
        };
        let s = E.createGame(seed);
        // Isolated equal-budget composition fixtures, not a claim these recruits are free in play.
        s.party = kinds.map((kind, index) => ({
          ...E.hero(kind, index + 1),
          equipment: [],
        }));
        for (let run = 0; run < 3; run++) {
          for (const kind of kinds)
            if (!R.allHeroes(s).some((u) => u.kind === kind))
              R.recruitHero(s, kind);
          s.party
            .sort(
              (a, b) =>
                kinds.indexOf(a.kind as ClassId) -
                kinds.indexOf(b.kind as ClassId),
            )
            .forEach((u, i) => (u.rank = i + 1));
          dress(s);
          // Reclaim duplicate copies; keep one of each item for future loadouts.
          const seen = new Set<string>();
          for (const item of [...s.economy.stash]) {
            if (seen.has(item.id)) Q.sell(s, item.uid);
            else seen.add(item.id);
          }
          if (policy === "estate")
            for (const id of ["chapel", "smith", "guild"] as const)
              if (T.level(s, id) < 3 && s.bank >= T.upgradeCost(s, id))
                T.upgrade(s, id);
          if (
            policy === "rare" &&
            s.economy.merchantLevel < 2 &&
            s.bank >= 80 * (s.economy.merchantLevel + 1)
          )
            Q.upgradeMerchant(s);
          buy(s, policy);
          configureExpedition(s, { difficulty, seed: seed + run * 901 });
          E.embark(s, `Balance ${partyName} ${policy}`);
          let decisions = 0;
          while (s.screen !== "summary" && decisions++ < 50) {
            switch (s.screen) {
              case "map": {
                dress(s);
                const options = routeMap(s)[s.floor];
                const choice =
                  options.find((n) => n.kind === "shop") ??
                  options.find(
                    (n) =>
                      n.kind === "elite" ||
                      n.kind === "combat" ||
                      n.kind === "boss",
                  ) ??
                  options.find((n) => n.kind === "rest") ??
                  options[0];
                E.chooseRoute(s, choice.id);
                break;
              }
              case "combat":
                try {
                  fight(s);
                } catch (error) {
                  console.error(
                    JSON.stringify({
                      partyName,
                      difficulty,
                      policy,
                      seed,
                      run,
                      party: s.party,
                      battle: s.battle,
                    }),
                  );
                  throw error;
                }
                break;
              case "reward":
                E.claimReward(s, s.reward[run % s.reward.length]?.uid ?? null);
                break;
              case "rest":
                E.rest(s, "heal");
                break;
              case "shop":
                dress(s);
                buy(s, policy);
                s.screen = "map";
                break;
              default:
                throw Error(`Unexpected balance screen ${s.screen}`);
            }
            s = E.deserialize(E.serialize(s));
          }
          assert.equal(s.screen, "summary");
          completed++;
          if (s.outcome === "victory") wins++;
          const settlement = s.journal.findLast(
            (event) => event.action === "run-end",
          )!.details as { banked: number };
          unbankedGold += s.gold - settlement.banked;
          E.returnToCamp(s);
          s = E.deserialize(E.serialize(s));
        }
        for (const event of s.journal) {
          const d = event.details as {
            gold?: number;
            cost?: number;
            gain?: number;
            lost?: string[];
          };
          if (event.action === "victory") earned += d.gold ?? 0;
          if (
            event.action === "item-buy" ||
            event.action === "recruit" ||
            event.action === "treat"
          )
            spent += d.cost ?? 0;
          if (event.action === "item-salvage") salvage += d.gain ?? 0;
          if (
            event.action === "town-upgrade" ||
            event.action === "merchant-upgrade"
          )
            permanentInvestment += d.cost ?? 0;
          if (event.action === "item-settlement")
            lost += (d.lost ?? []).reduce((sum, id) => sum + ITEMS[id].cost, 0);
        }
        deaths += s.graveyard.length;
        bank += s.bank;
        retainedValue += [
          ...s.economy.stash,
          ...s.economy.artifacts,
          ...s.party.flatMap((u) => u.equipment ?? []),
        ].reduce((sum, item) => sum + ITEMS[item.id].cost, 0);
        assert.ok(s.bank >= 0);
        assert.equal(
          s.bank,
          40 +
            earned -
            before.earned +
            salvage -
            before.salvage -
            spent +
            before.spent -
            permanentInvestment +
            before.permanentInvestment -
            unbankedGold +
            before.unbankedGold,
          `Gold conservation: ${partyName}/${difficulty}/${policy}/${seed}`,
        );
      }
      rows.push({
        party: partyName,
        difficulty,
        policy,
        expeditions: completed,
        wins,
        heroDeaths: deaths,
        earnedGold: earned,
        purchaseAndTreatmentGold: spent,
        salvageGold: salvage,
        lostUnbankedGold: unbankedGold,
        lostItemRetailValue: lost,
        permanentInvestmentGold: permanentInvestment,
        averageFinalBank: bank / 8,
        averageRetainedItemRetailValue: retainedValue / 8,
      });
    }
const report = {
  sample:
    "8 seeds × 3 consecutive runs × 3 party compositions × 2 difficulties × 4 policies = 576 expeditions",
  limitations:
    "Scripted visible-information policy; equal-budget party fixtures; no player skill/fun inference; no skill training or manual retreats; retail inventory value is not liquid gold.",
  rows,
};
mkdirSync("reports", { recursive: true });
writeFileSync(
  "reports/economy-balance.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
