import * as E from "../src/engine";
import { routeMap, shrineChoices, currentShrine } from "../src/expedition";
import * as R from "../src/roster";
import type { ClassId } from "../src/content";

/** Replacements are recruited explicitly after death, exactly as at the stagecoach. */
export function assembleParty(s: E.State) {
  const formation: ClassId[] = ["fighter", "rogue", "cleric", "wizard"];
  for (const kind of formation) {
    if (s.party.some((u) => u.kind === kind)) continue;
    const reserve = s.roster.reserves.find((u) => u.kind === kind);
    if (reserve) R.activateHero(s, reserve.id);
    else R.recruitHero(s, kind);
  }
  for (let i = 0; i < formation.length; i++) {
    const u = s.party.find((u) => u.kind === formation[i])!;
    while (u.rank > i + 1) E.reorder(s, u.id, -1);
  }
}

/** Route decisions see exactly the information on the player's map. */
export function takeRoute(s: E.State, policy: "safe" | "loot" | "discovery") {
  const options = routeMap(s)[s.floor];
  if (!options?.length)
    throw Error("No available route before expedition settlement.");
  const priorities =
    policy === "safe"
      ? ["rest", "shrine", "shop", "combat", "elite", "boss"]
      : policy === "loot"
        ? ["shop", "elite", "combat", "shrine", "rest", "boss"]
        : ["elite", "rest", "combat", "shrine", "shop", "boss"];
  const choice = [...options].sort(
    (a, b) => priorities.indexOf(a.kind) - priorities.indexOf(b.kind),
  )[0];
  E.chooseRoute(s, choice.id);
}
export function visitShrine(s: E.State) {
  const choices = shrineChoices(s).filter((choice) => !choice.disabledReason);
  const hurt = E.alive(s.party).some((u) => u.hp < u.maxHp * 0.6);
  const priorities =
    currentShrine(s).id === "shrine"
      ? hurt
        ? ["mercy", "leave"]
        : ["blood", "mercy", "leave"]
      : currentShrine(s).id === "spring"
        ? hurt
          ? ["drink", "bottle", "leave"]
          : ["bottle", "drink", "leave"]
        : ["shelter", "insight", "leave"];
  const choice = priorities.find((id) => choices.some((c) => c.id === id));
  if (!choice) throw Error("Shrine has no legal exit.");
  E.shrineChoice(s, choice);
}
