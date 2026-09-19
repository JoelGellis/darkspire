import { CLASSES, CARDS, CLASS_STARTERS, type ClassId } from "./content";
import type { State, Unit } from "./engine";
import { recruitCost, recruitOffers } from "./roster";
import "./roster.css";
const role: Record<ClassId, string> = {
  fighter: "Front-line shield and heavy strikes. Strong in ranks I–II.",
  rogue:
    "Close-range blades, Poison and retreating defense. Flexible formation.",
  cleric: "Targeted healing and protection, with spells from ranks II–III.",
  wizard: "Long-range spells and sweeping attacks. Best in ranks III–IV.",
  barbarian:
    "Heavy front-line damage and powerful self-defense. Best in ranks I–II.",
  ranger:
    "Long-range arrows, attack disruption and traps. Best in ranks III–IV.",
  necromancer: "Poison, weakening spells and bone wards. Best in ranks II–IV.",
  paladin:
    "Front-line attacks, ally shields and cleansing heals. Best in ranks I–II.",
};
const portrait = (kind: string) =>
  `<img class="roster-portrait" src="assets/exported/sprites/campfire-${kind}.png" alt="" loading="lazy" />`;
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function rosterMarkup(s: State) {
  const atCamp = s.screen === "camp",
    cost = recruitCost(s);
  const card = (u: Unit, reserve: boolean) => {
    const c = CLASSES[u.kind as ClassId];
    return `<article class="item-tile roster-tile">${portrait(u.kind)}<small>${reserve ? "RESERVE" : `RANK ${u.rank}`} &middot; LEVEL ${u.level} ${c.title.toUpperCase()}</small><h3>${esc(u.name)}</h3><p>${u.path === null ? "Subclass unchosen" : c.paths[u.path]}${u.wounded ? " · Wounded" : ""}</p><p>${u.hp} / ${u.maxHp} HP · ${u.xp} XP</p><button data-action="roster-${reserve ? "activate" : "bench"}" data-id="${u.id}" ${!atCamp || (reserve && s.party.length >= 4) ? "disabled" : ""}>${reserve ? "ADD TO PARTY" : "SEND TO RESERVE"}</button></article>`;
  };
  return `<div class="roster"><span class="eyebrow">THE STAGECOACH</span><h1>Who goes into the dark?</h1><p>Assemble four living heroes. Each class has one living place in your roster. Reserve heroes retain their levels and skills; equipment returns safely to the stash when a hero rests here. Sitting out an expedition heals reserve wounds.</p><h2>Active party · ${s.party.length} / 4</h2><div class="item-grid">${s.party.map((u) => card(u, false)).join("") || "<p>The expedition left no survivors. Free recruits can rebuild your party.</p>"}</div><h2>Reserves · ${s.roster.reserves.length}</h2><div class="item-grid">${s.roster.reserves.map((u) => card(u, true)).join("") || "<p>No heroes in reserve.</p>"}</div><h2>Arrivals · ${cost ? `${cost} gold each` : "free replacements"}</h2><p>${cost ? "A larger roster costs 35 banked gold per recruit." : "While fewer than four heroes remain in your entire roster, recruitment is free. No campaign can run out of replacements."} New heroes start at level 1; a fallen veteran's training is gone.</p><div class="item-grid">${
    recruitOffers(s)
      .map((kind) => {
        const c = CLASSES[kind];
        return `<article class="item-tile roster-tile roster-arrival">${portrait(kind)}<small>LEVEL 1 &middot; ${c.hp} HP</small><h3>${c.title}</h3><p>${esc(c.name)} · ${c.paths.join(" / ")}</p><p>${role[kind]}</p><details><summary>STARTING ACTIONS</summary><p>${CLASS_STARTERS[kind].map((id) => CARDS[id].name).join(" · ")}</p></details><button data-action="roster-recruit" data-kind="${kind}" ${!atCamp || s.bank < cost ? "disabled" : ""}>${cost ? `RECRUIT · ${cost} GOLD` : "RECRUIT FREE"}</button></article>`;
      })
      .join("") || "<p>Every class is represented in your roster.</p>"
  }</div></div>`;
}
