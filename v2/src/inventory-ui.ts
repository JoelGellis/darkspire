import { itemArtStyle } from "./item-art";
import { ITEMS, type OwnedItem } from "./items";
import * as Q from "./economy";
import type { State } from "./engine";
import { CLASSES, type ClassId } from "./content";
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const button = (label: string, action: string, attrs = "", disabled = false) =>
  `<button data-action="${action}" ${attrs} ${disabled ? "disabled" : ""}>${label}</button>`;
const rarity = ["COMMON", "UNCOMMON", "RARE", "LEGENDARY"];
const icon = (slot: string) =>
  slot === "weapon"
    ? "&#9876;"
    : slot === "armor"
      ? "&#9671;"
      : slot === "artifact"
        ? "&#10022;"
        : "&#9900;";
function tile(i: OwnedItem, actions: string) {
  const d = ITEMS[i.id];
  return `<article class="item-tile tier-${d.tier}"><span class="item-painting" style="${itemArtStyle(i.id)}" aria-hidden="true"></span><small>${rarity[d.tier]} &middot; ${d.slot.toUpperCase()}</small><h3>${esc(d.name)}</h3><p>${esc(d.text)}</p><small>${i.uid === 0 ? "PERMANENT PURCHASE" : i.foundRun === null ? "OWNED" : "FOUND THIS RUN - BRING IT HOME"}</small><div class="item-actions">${actions}</div></article>`;
}
export function inventoryMarkup(s: State, page = "loadout") {
  const camp = s.screen === "camp",
    safe = ["camp", "map", "reward", "rest", "shrine", "shop"].includes(
      s.screen,
    ),
    merchant = camp || s.screen === "shop",
    e = s.economy;
  const pack = camp ? e.stash : e.pack;
  const tabs = `<div class="inventory-tabs">${button("LOADOUT", "inventory", 'data-page="loadout"')}${button(`${camp ? "CAMP STASH" : "RUN PACK"} (${pack.length})`, "inventory", 'data-page="bag"')}${merchant ? button("MERCHANT", "inventory", 'data-page="merchant"') : ""}${button("ITEM CATALOG", "inventory", 'data-page="catalog"')}</div>`;
  let body = "";
  if (page.startsWith("catalog")) {
    const filter = page.split("-")[1] ?? "all";
    const definitions = Object.entries(ITEMS)
      .map(([id, d]) => ({ id, ...d }))
      .filter((d) => filter === "all" || d.slot === filter);
    body = `<p>All ${Object.keys(ITEMS).length} permanent items. Find them during expeditions or in merchant stock. This catalog is for planning; ownership is shown in your stash and loadout.</p><div class="inventory-tabs">${["all", "weapon", "armor", "trinket", "artifact"].map((slot) => button(slot === "artifact" ? "PARTY RELICS" : slot.toUpperCase(), "inventory", `data-page="catalog-${slot}" aria-pressed="${filter === slot}"`)).join("")}</div><div class="item-grid">${definitions.map((d) => tile({ uid: 0, id: d.id, foundRun: null }, `<p>${d.owner ? CLASSES[d.owner as ClassId].title : d.slot === "artifact" ? "Whole party" : "Any hero"}<br/>Buy: ${d.cost} gold · Salvage: ${Math.floor(d.cost / 2)} gold</p>`)).join("")}</div>`;
  } else if (page === "merchant" && merchant) {
    const offers = Q.stock(s),
      funds = camp ? s.bank : s.gold;
    body = `<div class="merchant-heading"><p>${camp ? "Safe stock improves with merchant level." : "Seven rotating offers, including rare gear. Purchases are permanent items."} ${funds} gold available.</p>${camp ? button(e.merchantLevel >= 3 ? "MERCHANT MAXED" : `UPGRADE MERCHANT - ${80 * (e.merchantLevel + 1)} GOLD`, "merchant-upgrade", "", e.merchantLevel >= 3 || funds < 80 * (e.merchantLevel + 1)) : ""}</div><div class="item-grid">${offers
      .map((id) =>
        tile(
          { uid: 0, id, foundRun: null },
          button(
            `BUY - ${ITEMS[id].cost} GOLD`,
            "item-buy",
            `data-item="${id}"`,
            funds < ITEMS[id].cost,
          ) +
            (ITEMS[id].slot !== "artifact"
              ? `<details class="item-compare"><summary>COMPARE WITH YOUR PARTY</summary>${s.party
                  .filter(
                    (u) =>
                      u.hp > 0 &&
                      (!ITEMS[id].owner || ITEMS[id].owner === u.kind),
                  )
                  .map(
                    (u) =>
                      `<p><b>${esc(u.name)}</b><br/>${esc(Q.comparison(s, id, u.id))}</p>`,
                  )
                  .join("")}</details>`
              : ""),
        ),
      )
      .join(
        "",
      )}</div>${!offers.length ? "<p>Stock sold out. New stock arrives next expedition.</p>" : ""}`;
  } else if (page === "bag") {
    body = `<p>${camp ? "Items here are safe, even if the entire party falls. Bring one item per hero and one party relic. Fill empty slots with finds and purchases during the run." : "Found items must survive the expedition. Victory and map retreat bring this pack home. Fleeing loses found loot; purchased items survive with the party."}</p><div class="item-grid">${pack
      .map((i) => {
        const d = ITEMS[i.id];
        const equip =
          d.slot === "artifact"
            ? button(
                "EQUIP FOR PARTY",
                "item-equip",
                `data-uid="${i.uid}" data-target="party"`,
                !safe ||
                  (camp && e.artifacts.length >= 1) ||
                  e.artifacts.some((a) => a.id === i.id),
              )
            : s.party
                .filter((u) => !d.owner || u.kind === d.owner)
                .map((u) =>
                  button(
                    `EQUIP ${esc(u.name)}<small class="equip-comparison">${esc(Q.comparison(s, i.id, u.id))}</small>`,
                    "item-equip",
                    `data-uid="${i.uid}" data-target="${u.id}"`,
                    !safe || u.hp <= 0,
                  ),
                )
                .join("");
        return tile(
          i,
          equip +
            (merchant
              ? button(
                  `SALVAGE - ${Math.floor(d.cost / 2)} GOLD`,
                  "item-sell",
                  `data-uid="${i.uid}"`,
                )
              : ""),
        );
      })
      .join(
        "",
      )}</div>${!pack.length ? `<div class="inventory-empty"><h2>${camp ? "Your stash is empty." : "Your pack is empty."}</h2><p>${merchant ? "Browse the merchant for gear and party artifacts." : "Win fights to find items, or visit the Wayfarer."}</p>${merchant ? button("BROWSE MERCHANT", "inventory", 'data-page="merchant"') : ""}</div>` : ""}`;
  } else {
    body = `<p>Weapon, armor, and trinket per hero. Start with one item per hero; fill the other two slots during the run. Bring one party relic, then add distinct relics as you find them. Manage equipment between fights.</p><h2>Party artifacts <small>${e.artifacts.length} equipped &middot; ${camp ? "bring 1" : "add distinct finds freely"}</small></h2><div class="artifact-slots">${e.artifacts.map((i) => tile(i, button("UNEQUIP", "item-unequip", `data-uid="${i.uid}"`, !safe))).join("")}${Array.from({ length: Math.max(0, 1 - e.artifacts.length) }, () => '<div class="empty-item-slot">&#10022; Empty party artifact slot<br/><small>Equip from your stash or run pack</small></div>').join("")}</div><div class="hero-loadouts">${s.party
      .map(
        (u) =>
          `<section><h2>${esc(u.name)}</h2><small>${u.hp > 0 ? u.kind.toUpperCase() : "FALLEN"} &middot; ${u.maxHp} MAX HP</small>${[
            "weapon",
            "armor",
            "trinket",
          ]
            .map((slot) => {
              const i = u.equipment?.find((i) => ITEMS[i.id].slot === slot);
              return i
                ? tile(
                    i,
                    button(
                      "UNEQUIP",
                      "item-unequip",
                      `data-uid="${i.uid}"`,
                      !safe || u.hp <= 0,
                    ),
                  )
                : `<div class="empty-item-slot">${icon(slot)} ${slot.toUpperCase()}<br/><small>Empty</small></div>`;
            })
            .join("")}</section>`,
      )
      .join(
        "",
      )}</div>${button(`OPEN ${camp ? "STASH" : "PACK"}`, "inventory", 'data-page="bag"')}`;
  }
  return `<div class="inventory-panel"><span class="eyebrow">${camp ? "THE CAMP ARMORY" : "EXPEDITION INVENTORY"} &middot; MERCHANT LEVEL ${e.merchantLevel}</span><h1>${page.startsWith("catalog") ? "The armory ledger." : page === "merchant" ? "The Wayfarer." : page === "bag" ? (camp ? "Kept for another dawn." : "What you carry home.") : "What you bring into the dark."}</h1>${tabs}${
    camp && Q.loadoutWarnings(s).length
      ? `<div class="loadout-warning"><b>Before your next descent</b>${Q.loadoutWarnings(
          s,
        )
          .map((t) => `<p>${esc(t)}</p>`)
          .join("")}</div>`
      : ""
  }${body}<p class="inventory-rules">Surviving heroes keep equipped items. Dead heroes lose their gear. A full wipe loses carried items and party artifacts; the camp stash stays safe. Gold purchases never expire after a run.</p></div>`;
}
export function worn(s: State, id: string) {
  return (s.party.find((u) => u.id === id)?.equipment ?? [])
    .map((i) => ITEMS[i.id].name)
    .join(" / ");
}
