import { allHeroes } from "./roster";
import { availablePoints } from "./progression";
import type { State } from "./engine";
import {
  BUILDINGS,
  level,
  upgradeCost,
  restorationPreview,
  treatmentCost,
  retreatRate,
  type BuildingId,
} from "./town";
import { CLASSES, type ClassId } from "./content";
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const button = (text: string, action: string, attrs = "") =>
  `<button class="town-action" data-action="${action}" ${attrs}>${text}</button>`;
export function townMarkup(s: State) {
  return `<section class="town-screen"><div class="town-heading"><span class="eyebrow">THE ESTATE · EXPEDITION ${s.run + 1}</span><h1>The Last Light</h1><p>Build a refuge. Return with something worth saving.</p></div><div class="town-map" aria-label="Town districts">${Object.entries(
    BUILDINGS,
  )
    .map(
      ([id, b]) =>
        `<button class="town-building ${id}" style="--x:${b.x}%;--y:${b.y}%" data-action="building" data-id="${id}" aria-label="${b.name}: ${b.subtitle}"><span class="building-mark" aria-hidden="true">${b.symbol}</span><span class="building-sign"><small>${b.district}</small><strong>${b.name}</strong><em>${b.subtitle}</em>${id !== "graveyard" ? `<i>${[1, 2, 3].map((n) => `<b class="${n <= level(s, id as BuildingId) ? "lit" : ""}"></b>`).join("")}</i>` : `<i>${s.graveyard.length} remembered</i>`}</span></button>`,
    )
    .join(
      "",
    )}</div><aside class="town-ledger"><span class="eyebrow">ESTATE LEDGER</span><h2>${s.bank} <small>gold</small></h2><p>Starting Block <b>+${s.town.levels.smith}</b></p><p>Guild redraws <b>${s.town.levels.guild} / run</b></p><p>Victory healing <b>+${s.town.levels.chapel} HP</b></p><p>Wound care <b>${treatmentCost(s)} gold</b></p><p>Retreat banking <b>${Math.round(retreatRate(s) * 100)}%</b></p>${button("OPEN STASH", "inventory", 'data-page="bag"')}</aside><nav class="town-landmarks" aria-label="Camp services">${button("CAMPFIRE / PARTY", "town-close")}${button("STAGECOACH / RECRUIT", "roster")}${button("ARMORY / EQUIPMENT", "inventory", 'data-page="loadout"')}</nav><footer class="town-footer"><div><span class="eyebrow">THE ROAD WAITS</span><p>${s.party.length} / 4 heroes assigned / ${s.roster.reserves.length} reserves. One item each and one party relic.</p></div>${button("ASSEMBLE THE PARTY →", "town-close")}</footer></section>`;
}
export function buildingMarkup(s: State, id: BuildingId) {
  const b = BUILDINGS[id];
  if (!b) return "";
  const tier = level(s, id),
    cost = upgradeCost(s, id);
  let services = "";
  if (id === "merchant" || id === "smith")
    services = `<div class="town-service-buttons">${button("BROWSE ITEMS & RELICS", "inventory", 'data-page="merchant"')}${button("EQUIPMENT & LOADOUT", "inventory", 'data-page="loadout"')}${button("STASH & SALVAGE", "inventory", 'data-page="bag"')}</div>`;
  if (id === "guild")
    services = `<div class="town-service-buttons">${Object.entries(CLASSES)
      .map(([key, c]) =>
        button(
          `${c.title.toUpperCase()} · 9 CARDS`,
          "codex",
          `data-id="${key}"`,
        ),
      )
      .join(
        "",
      )}</div><h2>Choose a calling</h2><div class="town-heroes">${allHeroes(s)
      .map(
        (u) =>
          `<article><h3>${esc(u.name)}</h3><p>Level ${u.level} · ${u.path === null ? "Path available at level 2" : CLASSES[u.kind as ClassId].paths[u.path]}</p>${button(`SKILLS / ${availablePoints(u)} POINTS`, "skills", `data-id="${u.id}"`)}</article>`,
      )
      .join("")}</div>`;
  if (id === "infirmary")
    services = `<div class="town-heroes">${allHeroes(s)
      .map(
        (u) =>
          `<article><img src="assets/exported/sprites/campfire-${u.kind}.png" alt=""/><h3>${esc(u.name)}</h3><p>${u.wounded ? "Wounded · starts at 80% HP" : "Fit for the road"}</p>${button(u.wounded ? `TREAT · ${treatmentCost(s)} GOLD` : "NO TREATMENT NEEDED", "treat", `data-id="${u.id}" ${!u.wounded || s.bank < treatmentCost(s) ? "disabled" : ""}`)}</article>`,
      )
      .join("")}</div>`;
  if (id === "chapel")
    services = `<div class="town-service-note"><h2>A candle for the living.</h2><p>Current blessing: ${tier} HP restored to each survivor after a victory. Healthy heroes recover fully when they embark; wounded heroes need the Infirmary.</p></div>`;
  if (id === "waystation")
    services = `<div class="town-service-note"><h2>A way home.</h2><p>A map retreat currently banks ${Math.round(retreatRate(s) * 100)}% of expedition gold. Survivors bring their carried equipment home. Found loot is lost if you flee a fight.</p>${button("PREPARE THE PARTY", "town-close")}</div>`;
  if (id === "graveyard")
    services = `<div class="grave-list">${s.graveyard.length ? s.graveyard.map((u) => `<article><span>†</span><h2>${esc(u.name)}</h2><p>${CLASSES[u.kind as ClassId].title} · Level ${u.level} · ${u.xp} experience</p><p>${u.equipment?.length ?? (u.gear ? 1 : 0)} equipped item(s) lost</p></article>`).join("") : '<div class="town-service-note"><h2>No names in the stone.</h2><p>May it stay that way.</p></div>'}</div>`;
  return `<div class="building-interior"><span class="eyebrow">${b.district} · ${s.bank} GOLD</span><h1>${b.symbol} ${b.name}</h1><p class="building-description">${b.description}</p>${id !== "graveyard" ? `<div class="building-upgrade"><span>RESTORATION ${tier} / 3<br/><small>${tier === 3 ? "Fully restored" : esc(restorationPreview(s, id))}</small></span>${button(tier === 3 ? "FULLY RESTORED" : `RESTORE · ${cost} GOLD`, id === "merchant" ? "merchant-upgrade" : "town-upgrade", `data-id="${id}" ${tier >= 3 || s.bank < cost ? "disabled" : ""}`)}</div>` : ""}${services}<div class="town-service-buttons">${button("← TOWN SQUARE", "town")}</div></div>`;
}
