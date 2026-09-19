import Phaser from "phaser";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-600.css";
import "./style.css";
import { mapIcon } from "./map-icons";
import { cardArtStyle } from "./card-art";
import * as E from "./engine";
import * as Q from "./economy";
import * as T from "./town";
import { upgradeDescription } from "./card-upgrades";
import { townMarkup, buildingMarkup } from "./town-ui";
import { ITEMS } from "./items";
import { inventoryMarkup, worn } from "./inventory-ui";
import {
  CARDS,
  STARTER,
  CLASSES,
  GEAR,
  PATH_BONUSES,
  ENCOUNTERS,
  type GearId,
  type ClassId,
} from "./content";
import { BattleStage, actorX } from "./stage";
import { Soundscape } from "./audio";
import { CampaignPersistence, MAX_SAVE_BYTES } from "./persistence";
import { loadPreferences, savePreferences } from "./preferences";
import { progressionMarkup } from "./progression-ui";
import { trainSkill, availablePoints } from "./progression";
import { rosterMarkup } from "./roster-ui";
import { recruitHero, benchHero, activateHero } from "./roster";
import { DIFFICULTIES, encounterTactics } from "./expedition";
const ui = document.querySelector<HTMLDivElement>("#interface")!;
const gameEl = document.querySelector<HTMLDivElement>("#game")!;
let state = E.createGame(),
  selected: number | null = null,
  busy = false,
  modal = "",
  notice = "",
  townOpen = true,
  moveWithCard = true,
  codexUpgraded = false,
  saveError = "";
const storage = new CampaignPersistence(() => localStorage);
const loaded = storage.load();
if (loaded.state) state = loaded.state;
if (!["saved", "empty"].includes(loaded.status))
  notice = saveError = loaded.message;
const preferences = loadPreferences();
if (
  state.screen === "combat" &&
  state.battle &&
  state.battle.status !== "player"
)
  E.finishBattle(state);
const sound = new Soundscape();
sound.enabled = preferences.sound;
const stage = new BattleStage(sound, () => render());
stage.setReduced(preferences.reducedMotion);
document.body.classList.toggle("reduced-motion", preferences.reducedMotion);
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "stage",
  width: 1600,
  height: 900,
  transparent: true,
  scene: stage,
  render: { antialias: true },
  audio: { noAudio: true },
  fps: { target: 60, forceSetTimeOut: false },
  scale: { mode: Phaser.Scale.NONE },
});
function fit() {
  const scale = Math.min(innerWidth / 1600, innerHeight / 900);
  gameEl.style.transform = `translate(-50%,-50%) scale(${scale})`;
}
addEventListener("resize", fit);
fit();
const esc = (v: unknown) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const btn = (label: string, action: string, attrs = "", style = "") =>
  `<button class="${style}" data-action="${action}" ${attrs}>${label}</button>`;
const roman = (n: number) => ["", "I", "II", "III", "IV"][n] ?? String(n);
function persist() {
  const saved = storage.save(state);
  saveError = saved.ok ? "" : saved.message;
  if (!saved.ok) say(saved.message);
}
function persistPreferences() {
  if (!savePreferences({ sound: sound.enabled, reducedMotion: stage.reduced }))
    say(
      "Settings work for this session, but browser storage could not save them.",
    );
}
function say(text: string) {
  notice = text;
  document.querySelector("#announcement")!.textContent = text;
}
function cardMarkup(c: E.Card, index = 0, mode = "hand") {
  const shown = mode === "upgrade" ? { ...c, upgrade: 1 } : c;
  const d =
      mode === "view" ? E.cardDefinition(shown) : E.effectiveCard(state, shown),
    reason = mode === "hand" ? E.cardReason(state, c) : "",
    value = mode === "view" ? d.value : E.cardValue(state, shown);
  return `<button class="card ${d.owner} ${selected === c.uid ? "selected" : ""} ${reason ? "unavailable" : ""}" data-action="${mode === "hand" ? "card" : mode === "reward" ? "reward" : "upgrade"}" data-uid="${c.uid}" title="${esc(reason || d.flavor)}" aria-label="${esc(d.name)}${shown.upgrade ? " upgraded" : ""}: ${esc(d.text.replace("{v}", String(value)))}${reason ? ". " + esc(reason) : ""}" aria-pressed="${selected === c.uid}" ${mode === "view" ? "disabled" : ""} style="--card-color:${CLASSES[d.owner].color};--tilt:${(index - (mode === "hand" ? ((state.battle?.hand.length ?? 1) - 1) / 2 : 1)) * 2}deg"><span class="cost">${d.cost}</span><span class="card-owner">${CLASSES[d.owner].title}<span>${d.exhaust ? "EXHAUST" : d.effect === "block" || d.effect === "step" ? "SKILL" : d.effect === "heal" ? "HEAL" : "ATTACK"}</span></span><div class="card-art painted-art" style="${cardArtStyle(c.id)}" aria-hidden="true"></div><strong>${d.name}${shown.upgrade ? " +" : ""}</strong><p>${d.text.replace("{v}", `<b>${value}</b>`)}</p><span class="card-ranks">RANK ${d.ranks.length ? d.ranks.map(roman).join(" / ") : "ANY"} <i>·</i> ${d.target === "ally" ? "ALLY" : d.target === "self" ? "SELF" : d.target === "all" ? "ALL ENEMIES" : "REACH " + d.reach.map(roman).join("–")}</span>${mode === "hand" ? `<span class="hotkey">${index + 1}</span>` : ""}</button>`;
}
function header() {
  return `<header><button class="wordmark" data-action="camp-info">DARKSPIRE <em>II</em></button><div class="chapter"><span>THE HOLLOW CATHEDRAL</span><small>${state.screen === "camp" ? "THE LAST LIGHT" : state.screen === "combat" ? `DESCENT ${state.floor} / ${E.expeditionLength(state)} &nbsp; · &nbsp; ROUND ${state.battle!.turn}` : `DESCENT ${state.floor} / ${E.expeditionLength(state)}`}</small></div><nav><span class="gold">◈ ${state.screen === "camp" ? state.bank : state.gold}<small> ${state.screen === "camp" ? "BANKED" : "GOLD"}</small></span>${btn(sound.enabled ? "♫ SOUND" : "♫ MUTED", "sound")}${state.screen === "camp" ? btn(townOpen ? "PARTY" : "TOWN", townOpen ? "town-close" : "town") : ""}${btn("ITEMS", "inventory", 'data-page="loadout"')}${btn("DECK", "deck")}${btn("?", "help", 'aria-label="How to play"', "help-button")}</nav></header>`;
}
function miniParty() {
  return `<div class="mini-party">${[...state.party]
    .sort((a, b) => b.rank - a.rank)
    .map(
      (u) =>
        `<div class="mini-hero ${u.hp <= 0 ? "fallen" : ""}"><img src="assets/exported/sprites/campfire-${u.kind}.png" alt=""/><span><small>${roman(u.rank)} · ${CLASSES[u.kind as ClassId].title}</small><strong>${esc(u.name)}</strong><i>${u.hp} / ${u.maxHp} HP ${u.gear ? " · " + GEAR[u.gear].name : ""}</i></span></div>`,
    )
    .join("")}</div>`;
}
function camp() {
  if (townOpen) return townMarkup(state);
  return `<section class="camp"><div class="camp-title"><span class="eyebrow">A FIRE AGAINST THE DARK</span><h1>The last light.</h1><p>Four souls. One descent. Whatever survives comes home.</p></div><div class="camp-roster">${[
    ...state.party,
  ]
    .sort((a, b) => b.rank - a.rank)
    .map(
      (u) =>
        `<article class="camp-hero"><div class="hero-halo"></div><img class="full-hero" src="assets/exported/sprites/campfire-${u.kind}.png" alt="${esc(u.name)}"/><div class="hero-caption"><span class="eyebrow">RANK ${roman(u.rank)} · ${CLASSES[u.kind as ClassId].title}</span><h2>${esc(u.name)}</h2><p>LEVEL ${u.level} ${u.path !== null ? " · " + CLASSES[u.kind as ClassId].paths[u.path] : ""} · ${u.maxHp} HP</p><span class="gear-label">${worn(state, u.id) || (u.gear ? GEAR[u.gear].name : "No equipment")}${u.wounded ? " · Wounded" : ""}</span><div class="formation-controls">${btn("&lsaquo;", "formation", `data-id="${u.id}" data-direction="1" aria-label="Move ${esc(u.name)} back in formation" ${u.rank === state.party.length ? "disabled" : ""}`)}${btn("&rsaquo;", "formation", `data-id="${u.id}" data-direction="-1" aria-label="Move ${esc(u.name)} forward in formation" ${u.rank === 1 ? "disabled" : ""}`)}</div><div>${btn("EQUIP", "equipment", `data-id="${u.id}"`)}${btn(`SKILLS${availablePoints(u) ? " / " + availablePoints(u) : ""}`, "skills", `data-id="${u.id}"`)}${u.wounded ? btn(`TREAT - ${T.treatmentCost(state)} GOLD`, "treat", `data-id="${u.id}"`) : ""}</div></div></article>`,
    )
    .join(
      "",
    )}</div><div class="embark-panel"><div class="expedition-options"><label>ROUTE <input id="route-seed" type="number" min="0" max="4294967295" value="${state.expedition.seed}" aria-label="Route seed"/></label><label>DIFFICULTY <select id="difficulty" aria-label="Difficulty">${Object.entries(
    DIFFICULTIES,
  )
    .map(
      ([id, d]) =>
        `<option value="${id}" ${state.expedition.difficulty === id ? "selected" : ""}>${d.name}</option>`,
    )
    .join(
      "",
    )}</select></label>${btn("STAGECOACH", "roster")}</div><label>YOUR NAME <input id="player-name" maxlength="40" autocomplete="off" value="${esc(state.player)}" placeholder="Name this expedition’s keeper"/></label>${btn("DESCEND INTO THE HOLLOW <span>→</span>", "embark", state.party.length !== 4 ? "disabled" : "", "primary large")}<small>${state.party.length !== 4 ? `Recruit or assign ${4 - state.party.length} more heroes at the stagecoach.` : Q.loadoutWarnings(state).map(esc).join(" ") || "One item per hero. One party relic."}<br/>Heroes persist. The fallen do not. ${state.graveyard.length ? `${state.graveyard.length} remembered in the graveyard.` : state.run ? "Your survivors are ready for another descent." : "Your first expedition awaits."}</small></div><span class="edition">DARKSPIRE II · THE LAST LIGHT</span></section>`;
}
function combat() {
  const b = state.battle!,
    c = b.hand.find((c) => c.uid === selected),
    valid =
      selected === -1
        ? E.alive(state.party)
            .filter((u) => u.hp < u.maxHp)
            .map((u) => u.id)
        : c
          ? E.targets(state, c).map((u) => u.id)
          : [];
  const movementChoice =
    c && E.effectiveCard(state, c).optionalMove
      ? btn(
          moveWithCard
            ? "MOVEMENT: YES (CLICK TO STAY)"
            : "MOVEMENT: NO (STAY IN RANK)",
          "card-movement",
          `aria-pressed="${moveWithCard}"`,
          "movement-choice",
        )
      : "";
  return `<section class="combat"><div class="encounter-title"><span class="eyebrow">${ENCOUNTERS[b.encounter].subtitle}</span><h1>${ENCOUNTERS[b.encounter].name}</h1><p class="encounter-tactics">${encounterTactics(b.encounter)}</p></div><div class="battle-status">${busy ? "RESOLVING" : b.status === "player" ? "YOUR TURN" : b.status === "won" ? "VICTORY" : "PARTY LOST"}<span>${busy ? "Steel, then silence." : selected === -1 ? "Choose a wounded hero for the tonic." : c ? `Choose a target for ${CARDS[c.id].name}` : "Choose a card, then its target."}</span>${movementChoice}</div>${[
    ...state.party,
    ...b.enemies,
  ]
    .map((u) => {
      const enemy = u.id.startsWith("enemy"),
        intent = b.intents.find((i) => i.source === u.id),
        incoming = b.intents
          .filter(
            (i) =>
              i.target === u.id &&
              b.enemies.some((e) => e.id === i.source && e.hp > 0),
          )
          .reduce((v, i) => v + i.damage, 0);
      return `<div class="actor-ui ${u.name === "The Last Bellkeeper" ? "boss-actor" : ""} ${enemy ? "enemy" : "hero"} ${u.hp <= 0 ? "fallen" : ""}" style="left:${actorX(u, enemy) - 79}px"><button class="actor-target ${valid.includes(u.id) ? "valid" : ""}" data-action="target" data-id="${u.id}" aria-label="${esc(u.name)}, ${u.hp} HP${valid.includes(u.id) ? ", valid target" : ""}" ${busy || u.hp <= 0 ? "disabled" : ""}></button>${enemy && intent && u.hp > 0 ? `<div class="intent"><b>† ${intent.damage}</b><span>→ ${esc(state.party.find((h) => h.id === intent.target)?.name ?? "—")}</span></div>` : !enemy && incoming && u.hp > 0 ? `<div class="incoming">† ${incoming} INCOMING</div>` : ""}<div class="actor-info"><strong>${esc(u.name)}</strong><div class="health"><i style="width:${(u.hp / u.maxHp) * 100}%"></i><span>${u.hp} / ${u.maxHp}</span></div><div class="unit-meta"><span class="rank">${roman(u.rank)}</span>${u.block ? `<span class="block">◇ ${u.block}</span>` : ""}${u.poison ? `<span class="poison">⋰ ${u.poison}</span>` : ""}${!enemy && u.hp > 0 ? `<span class="move-buttons">${btn("‹", "move", `data-id="${u.id}" data-direction="1" aria-label="Move ${esc(u.name)} back" ${busy || b.energy < 1 || u.rank === state.party.length ? "disabled" : ""}`)}${btn("›", "move", `data-id="${u.id}" data-direction="-1" aria-label="Move ${esc(u.name)} forward" ${busy || b.energy < 1 || u.rank === 1 ? "disabled" : ""}`)}</span>` : ""}</div></div></div>`;
    })
    .join(
      "",
    )}<div class="combat-tray"><div class="energy-block"><div class="energy-orb">${b.energy}<small>/ 3</small></div><span>ENERGY</span>${btn(`▱ ${b.draw.length} <small>DRAW</small>`, "draw", "", "pile")}</div><div class="hand" style="--hand-count:${b.hand.length}">${b.hand.map((c, i) => cardMarkup(c, i)).join("")}${!b.hand.length ? '<p class="empty-hand">Your hand is empty.<br/>End your turn to draw again.</p>' : ""}</div><div class="tonic-control">${btn("TONIC &middot; " + state.potions + "<small>RESTORE 12 HP &middot; FREE</small>", "tonic", `${busy || !state.potions || !state.party.some((u) => u.hp > 0 && u.hp < u.maxHp) ? "disabled" : ""}`, selected === -1 ? "selected" : "")}</div><div class="turn-block">${btn("END TURN <span>→</span>", "end", `${busy || b.status !== "player" ? "disabled" : ""}`, "primary end-turn")}<small>[ E ]</small>${btn(`▱ ${b.discard.length} <small>DISCARD</small>`, "discard", "", "pile")}${btn("FLEE", "flee", busy ? "disabled" : "", "quiet")}</div></div><div class="combat-footer"><span>${state.blessing ? "✧ EMBER BLESSING · +2 ATTACK" : "◈ " + state.gold + " GOLD"} &nbsp; · &nbsp; ${btn(b.exhaust.length + " EXHAUSTED", "exhaust", "", "exhaust-pile")}</span><span>1–9 SELECT CARD &nbsp; · &nbsp; E END TURN &nbsp; · &nbsp; ESC CANCEL</span></div></section>`;
}
function map() {
  const columns = E.routeMap(state);
  const x = (i: number) => 390 + i * (1050 / (columns.length - 1));
  const y = (i: number, j: number) =>
    columns[i].length === 1 ? 420 : 330 + j * 205;
  let paths = "";
  for (let i = 0; i < columns.length - 1; i++)
    for (let a = 0; a < columns[i].length; a++)
      for (let b = 0; b < columns[i + 1].length; b++) {
        const traveled =
          i < state.floor - 1 &&
          state.route[i] === columns[i][a].id &&
          state.route[i + 1] === columns[i + 1][b].id;
        const next =
          i === state.floor - 1 && state.route[i] === columns[i][a].id;
        paths += `<path class="${traveled ? "traveled" : next ? "next-route" : ""}" d="M ${x(i)} ${y(i, a)} C ${x(i) + 80} ${y(i, a)},${x(i + 1) - 80} ${y(i + 1, b)},${x(i + 1)} ${y(i + 1, b)}"/>`;
      }
  return `<section class="map-screen expanded-route"><div class="map-copy"><span class="eyebrow">EXPEDITION ${String(state.run).padStart(2, "0")}</span><h1>Into<br/>the hollow.</h1><p>${DIFFICULTIES[state.expedition.difficulty].name} / ${columns.length} stages<br/>Route seed ${state.expedition.seed}</p><p>Choose your way.<br/>Bring someone home.</p>${btn("RETREAT TO CAMP", "retreat", "", "quiet")}<small>Bank ${Math.round(T.retreatRate(state) * 100)}% of gathered gold.<br/>Survivors keep their equipment.</small>${E.activeBlessings(
    state,
  )
    .map(
      (b) =>
        `<p class="map-blessing" title="${esc(b.description)}">+ ${esc(b.name)}</p>`,
    )
    .join(
      "",
    )}</div><svg class="routes" viewBox="0 0 1600 900" aria-hidden="true"><g>${paths}</g></svg>${columns
    .map((nodes, i) =>
      nodes
        .map((node, j) => {
          const available = i === state.floor,
            visited = i < state.floor && state.route[i] === node.id;
          return `<button class="map-node ${available ? "available" : ""} ${visited ? "visited" : ""} ${node.kind === "boss" ? "boss-node" : ""}" style="left:${x(i)}px;top:${y(i, j) - 122}px" data-action="route" data-node="${node.id}" title="${esc(node.description)}" ${available ? "" : "disabled"}><span>${mapIcon(visited ? "visited" : node.kind === "combat" ? "sentries" : node.kind)}</span><strong>${esc(node.title)}</strong><small>${node.kind.toUpperCase()}</small></button>`;
        })
        .join(""),
    )
    .join(
      "",
    )}<div class="map-heading"><span class="eyebrow">THE HOLLOW CATHEDRAL</span><p>THE OUTER AISLES <span>&rarr;</span> THE BELL TOWER</p></div>${miniParty()}</section>`;
}
function reward() {
  return `<section class="interlude"><span class="eyebrow">THE DARK RELENTS</span><h1>Something worth keeping.</h1><p>Discover a new class action for this expedition. Each can be upgraded at a rest site.</p><div class="reward-cards">${state.reward.map((c, i) => cardMarkup(c, i, "reward")).join("")}</div>${state.town.redraws ? btn(`GUILD REDRAW - ${state.town.redraws} LEFT`, "reward-redraw", "", "quiet") : ""}${btn("CONTINUE WITHOUT A CARD →", "skip", "", "quiet")}<p class="muted">Your surviving heroes gained experience. Gold and a healing tonic have been gathered. ${state.economy.lastLoot.map((id) => ITEMS[id].name).join(", ")} added to your run pack. ${btn("INSPECT LOOT", "inventory", 'data-page="bag"')}</p></section>`;
}
function restScreen() {
  return `<section class="interlude rest-site"><span class="eyebrow">A MOMENT OF MERCY</span><h1>A quiet flame.</h1><p>The stones are cold. The fire is enough.</p><div class="choice-row">${btn('<span class="choice-icon" aria-hidden="true">♨</span><h2>Tend the wounded</h2><p>Restore 30% maximum HP<br/>to every living hero.</p>', "rest-heal", "", "choice")}${btn('<span class="choice-icon" aria-hidden="true">†</span><h2>Sharpen your craft</h2><p>Upgrade one card.<br/>Preview each improvement.<br/>Choose one mastered action.</p>', "rest-upgrade", "", "choice")}${btn('<span class="choice-icon" aria-hidden="true">&#9671;</span><h2>Pack for danger</h2><p>Next fight: +6 starting Block per hero<br/>and one extra opening card.</p>', "rest-prepare", "", "choice")}${btn('<span class="choice-icon" aria-hidden="true">&#9009;</span><h2>Travel lighter</h2><p>Remove one non-equipment card.<br/>Keep at least two actions per class.</p>', "rest-remove", "", "choice")}</div>${miniParty()}</section>`;
}
function shrineScreen() {
  const shrine = E.currentShrine(state);
  return `<section class="interlude shrine-site"><span class="eyebrow">FOUND POWER / THIS EXPEDITION ONLY</span><h1>${esc(shrine.title)}</h1><p>${esc(shrine.description)}</p><div class="choice-row">${E.shrineChoices(
    state,
  )
    .map((c) =>
      btn(
        `<h2>${esc(c.label)}</h2><p>${esc(c.description)}</p>${c.disabledReason ? `<small>${esc(c.disabledReason)}</small>` : ""}`,
        "shrine-choice",
        `data-id="${c.id}" ${c.disabledReason ? "disabled" : ""}`,
        "choice",
      ),
    )
    .join("")}</div>${miniParty()}</section>`;
}
function shopScreen() {
  return `<section class="interlude"><span class="eyebrow">THE WAYFARER</span><h1>Iron for the road.</h1>${btn("BROWSE MERCHANT", "inventory", 'data-page="merchant"', "primary")}<p>Permanent gear and party artifacts. Equip purchases from your run pack; fill empty slots before the bell.</p><div class="shop-party">${state.party.map((u) => `<article><img src="assets/exported/sprites/campfire-${u.kind}.png" alt=""/><h2>${esc(u.name)}</h2><p>${esc(worn(state,u.id) || (u.gear ? GEAR[u.gear].name : "No equipment"))}</p>${btn("BROWSE EQUIPMENT", "equipment", `data-id="${u.id}" ${u.hp <= 0 ? "disabled" : ""}`)}</article>`).join("")}</div>${btn("CONTINUE THE DESCENT →", "shop-leave", "", "primary large")}</section>`;
}
function summary() {
  const victory = state.outcome === "victory",
    fallen = state.party.filter((u) => u.hp <= 0);
  return `<section class="interlude summary"><span class="eyebrow">${victory ? "THE BELL FALLS SILENT" : "THE DESCENT IS OVER"}</span><h1>${victory ? "Dawn, against all odds." : state.outcome === "retreat" ? "Live to descend again." : state.outcome === "flee" ? "The price of survival." : "The fire burns for no one."}</h1><p>${victory ? "The cathedral guardian is defeated. Your survivors return with everything." : state.outcome === "retreat" ? `${Math.round(T.retreatRate(state) * 100)}% of your gathered gold is banked. Your survivors keep their equipment.` : state.outcome === "flee" ? "Your survivors escaped wounded. All gathered gold was lost." : "Your party and their equipment are lost. New recruits await at the fire."}</p><div class="run-stats"><div><b>${state.floor}</b><span>DEPTH REACHED</span></div><div><b>${state.bank}</b><span>GOLD IN CAMP</span></div><div><b>${E.alive(state.party).length}</b><span>RETURNED</span></div><div><b>${fallen.length}</b><span>REMEMBERED</span></div></div>${miniParty()}${btn("RETURN TO THE FIRE →", "return", "", "primary large")}${btn("EXPORT EXPEDITION", "export", "", "quiet")}</section>`;
}
let renderedModal = "";
let modalOpener: Record<string, string | undefined> | undefined;
function render() {
  if (state.screen !== "combat") selected = null;
  const sameModal = !!modal && modal === renderedModal;
  const scrollTop = sameModal
    ? (ui.querySelector(".modal")?.scrollTop ?? 0)
    : 0;
  const focus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement.dataset
      : undefined;
  if (modal && !renderedModal && focus?.action) modalOpener = { ...focus };
  ui.innerHTML = `${header()}${{ camp, combat, map, reward, rest: restScreen, shrine: shrineScreen, shop: shopScreen, summary }[state.screen]()}${notice ? `<div class="notice" role="status">${esc(notice)} ${btn("×", "dismiss", 'aria-label="Dismiss notification"')}</div>` : ""}<div class="save-status">${saveError ? esc(saveError) : "◆ SAVED LOCALLY"}</div>${modal ? `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${modal.startsWith("equipment") ? "Equipment" : modal.startsWith("paths") ? "Subclass choices" : "Expedition details"}">${btn("×", "close", 'aria-label="Close dialog"', "close")}${modalContent()}</section></div>` : ""}`;
  ui.classList.toggle("busy", busy);
  ui.dataset.screen = state.screen;
  if (modal)
    for (const child of Array.from(ui.children)) {
      if (
        child instanceof HTMLElement &&
        !child.classList.contains("modal-backdrop")
      )
        child.inert = true;
    }
  stage.sync(state);
  const c = state.battle?.hand.find((c) => c.uid === selected);
  stage.highlight(
    selected === -1
      ? E.alive(state.party)
          .filter((u) => u.hp < u.maxHp)
          .map((u) => u.id)
      : c
        ? E.targets(state, c).map((u) => u.id)
        : [],
  );
  if (modal) {
    const dialog = ui.querySelector<HTMLElement>(".modal")!;
    const previous =
      sameModal && focus?.action
        ? Array.from(
            dialog.querySelectorAll<HTMLElement>("[data-action]"),
          ).find((el) =>
            Object.entries(focus).every(
              ([key, value]) => el.dataset[key] === value,
            ),
          )
        : undefined;
    (previous ?? dialog.querySelector<HTMLButtonElement>("button"))?.focus({
      preventScroll: true,
    });
    dialog.scrollTop = scrollTop;
  } else if (focus?.action || modalOpener?.action) {
    const restore = renderedModal && modalOpener ? modalOpener : focus!;
    const candidates = Array.from(
      ui.querySelectorAll<HTMLElement>("[data-action]"),
    );
    candidates
      .find(
        (el) =>
          el.dataset.action === restore.action &&
          el.dataset.id === restore.id &&
          el.dataset.uid === restore.uid,
      )
      ?.focus({ preventScroll: true });
    if (renderedModal) modalOpener = undefined;
  }
  renderedModal = modal;
}
function modalContent() {
  const [type, id] = modal.split(":");
  if (type === "roster") return rosterMarkup(state);
  if (type === "remove") {
    const cards = state.deck.filter(
      (c) =>
        !c.itemUid &&
        state.deck.filter((x) => CARDS[x.id].owner === CARDS[c.id].owner)
          .length > 2,
    );
    return `<span class="eyebrow">REST / REMOVE ONE CARD</span><h1>Leave a habit behind.</h1><p>Equipment cards stay with their item. Each class keeps at least two actions.</p><div class="deck-grid">${cards.map((c) => `<article>${cardMarkup(c, 0, "view")}${btn("REMOVE THIS COPY", "remove-card", `data-uid="${c.uid}"`)}</article>`).join("") || "No cards can be removed."}</div>`;
  }
  if (type === "skills") return progressionMarkup(state, id);
  if (type === "building") return buildingMarkup(state, id as T.BuildingId);
  if (type === "codex") {
    const owner = Object.hasOwn(CLASSES, id) ? (id as ClassId) : "fighter";
    return `<span class="eyebrow">GUILD ARCHIVE / ${CLASSES[owner].title}</span><h1>Ways to survive.</h1><p>Three starter actions. Six discoveries earned during expeditions. Equipment can add further copies.</p><div class="town-service-buttons">${Object.entries(
      CLASSES,
    )
      .map(([key, c]) => btn(c.title, "codex", `data-id="${key}"`))
      .join(
        "",
      )}${btn(codexUpgraded ? "SHOW BASE CARDS" : "SHOW UPGRADES", "codex-version")}${btn("BACK TO GUILD", "building", 'data-id="guild"')}</div><div class="deck-grid">${Object.values(
      CARDS,
    )
      .filter((c) => c.owner === owner)
      .map(
        (c, i) =>
          `<div><span class="eyebrow">${c.discovery ? "EXPEDITION DISCOVERY" : "STARTER ACTION"}</span>${cardMarkup({ uid: -i - 1, id: c.id, upgrade: codexUpgraded ? 1 : 0 }, 0, "view")}${codexUpgraded ? `<p class="upgrade-note">${esc(upgradeDescription(c.id))}</p>` : ""}</div>`,
      )
      .join("")}</div>`;
  }
  if (type === "inventory") return inventoryMarkup(state, id);
  if (type === "equipment") {
    const u = state.party.find((u) => u.id === id)!;
    return `<span class="eyebrow">THE WAYFARER · ${state.screen === "camp" ? state.bank : state.gold} GOLD</span><h1>Equip ${esc(u.name)}.</h1>${
      u.gear
        ? `<p>${GEAR[u.gear].name} equipped. ${GEAR[u.gear].description}.</p><p>Each hero carries one item in this first slice. Transfer freely, or salvage for half its purchase price.</p><div class="equipment-list">${state.party
            .filter((h) => h.id !== id && h.hp > 0)
            .map((h) =>
              btn(
                `<div><h2>${h.gear ? "Swap with" : "Give to"} ${esc(h.name)}</h2><p>${h.gear ? GEAR[h.gear].name : "Empty equipment slot"}</p></div>`,
                "swap-gear",
                `data-id="${id}" data-to="${h.id}"`,
                "equipment-option",
              ),
            )
            .join(
              "",
            )}</div>${btn("SALVAGE - " + Math.floor(GEAR[u.gear].cost / 2) + " gold", "salvage", `data-id="${id}"`, "quiet")}`
        : `<div class="equipment-list">${Object.entries(GEAR)
            .map(([key, g]) =>
              btn(
                `<span>◇</span><div><h2>${g.name}</h2><p>${g.description}</p></div><b>${g.cost} ◈</b>`,
                "buy",
                `data-id="${id}" data-gear="${key}" ${(state.screen === "camp" ? state.bank : state.gold) < g.cost ? "disabled" : ""}`,
                "equipment-option",
              ),
            )
            .join("")}</div>`
    }`;
  }
  if (type === "paths") {
    const u = state.party.find((u) => u.id === id)!;
    return `<span class="eyebrow">LEVEL ${u.level} · A LASTING CHOICE</span><h1>Choose ${esc(u.name)}’s path.</h1><p>This choice stays with the hero and is lost on death.</p><div class="equipment-list">${CLASSES[u.kind as ClassId].paths.map((p, i) => btn(`<div><h2>${p}</h2><p>${PATH_BONUSES[i]}</p></div>`, "path", `data-id="${id}" data-path="${i}"`, "equipment-option")).join("")}</div>`;
  }
  if (type === "help")
    return `<span class="eyebrow">A KEEPER’S FIELD NOTES</span><h1>Make every action count.</h1><div class="help-copy"><p><b>Play:</b> select a card, then a highlighted hero or enemy. Your four heroes share 3 energy. End your turn to draw five cards.</p><p><b>Position:</b> rank I is closest to the enemy. Cards show required hero ranks and enemy reach. The arrows below a hero swap adjacent ranks for 1 energy.</p><p><b>Intent:</b> the number above an enemy is its next attack, with its committed target named beneath. Incoming totals also appear above your heroes. If that target falls, the attack is lost.</p><p><b>Survival:</b> Block absorbs damage and expires at your next turn. Poison ignores Block, then decreases by 1. Cards marked Exhaust leave the deck for this fight, including Shield and Mending Light. Inspect them using the exhausted pile below your hand.</p><p><b>Expedition:</b> gear, experience and subclasses persist with surviving heroes. Map retreat banks 50-65% of run gold, depending on the Watchtower. Fleeing loses run gold and wounds survivors; the Infirmary treats wounds for 6-15 camp gold. Death takes the hero and their gear.</p><p><b>Controls:</b> 1–9 select cards; E ends the turn; Escape cancels targeting or closes a panel. All actions also use buttons.</p></div><div class="dialog-actions">${btn(stage.reduced ? "MOTION: REDUCED" : "MOTION: FULL", "motion")}${btn("EXPORT EXPEDITION", "export")}${btn("EXPORT LIVE SAVE", "export-save")}<label class="file-button">IMPORT SAVE<input type="file" id="import-save" accept="application/json,.json"/></label>${btn("EXPORT STORED SAVE", "export-stored")}${storage.exportPrevious() ? btn("RESTORE PREVIOUS CHECKPOINT", "restore-previous") + btn("EXPORT PREVIOUS", "export-previous") : ""}${storage.exportRecovery() ? btn("EXPORT RECOVERY BACKUP", "export-recovery") : ""}${saveError ? btn("START FRESH - KEEP BACKUP", "recover-save") : ""}</div><p class="muted">Eight classes, seeded seven-stage expeditions, three equipment slots per hero and party relics. Bring one item per hero and one relic; fill the rest during the run. Each class has three skill paths. Train in camp with points earned by leveling; death takes those skills with the hero. The stagecoach recruits replacements and reserves. All saves and journals stay in this browser. Export your live save for an off-device backup. Import and checkpoint restoration preserve the replaced save.</p>`;
  if (type === "retreat" || type === "flee")
    return `<span class="eyebrow">A HARD DECISION</span><h1>${type === "flee" ? "Leave the fight?" : "Return to the fire?"}</h1><p>${type === "flee" ? "Living heroes escape wounded. All gathered gold is lost." : ` ${Math.round(T.retreatRate(state) * 100)}% of gathered gold is banked. Living heroes keep equipment and experience. Carried loot goes to the camp stash; party relics return too.`}</p>${btn(type === "flee" ? "FLEE NOW" : "RETREAT NOW", type + "-confirm", "", "primary large")}`;
  const cards =
    type === "draw"
      ? (state.battle?.draw ?? [])
      : type === "discard"
        ? (state.battle?.discard ?? [])
        : type === "exhaust"
          ? (state.battle?.exhaust ?? [])
          : state.screen === "camp"
            ? Q.baseDeck(state).map((id, i) => ({
                id,
                uid: -(i + 1),
                upgrade: 0,
              }))
            : state.deck;
  return `<span class="eyebrow">${type === "upgrade" ? "REST · CHOOSE ONE CARD" : type.toUpperCase() + " · " + cards.length + " CARDS"}</span><h1>${type === "upgrade" ? "Sharpen your craft." : type === "draw" ? "The draw pile." : type === "discard" ? "Spent, not forgotten." : type === "exhaust" ? "Spent for this fight." : state.screen === "camp" ? "Your next starting deck." : "Your expedition deck."}</h1>${type === "draw" ? "<p>Sorted by name. Draw order stays hidden.</p>" : type === "exhaust" ? "<p>These cards return next fight. They cannot be drawn again this battle.</p>" : state.screen === "camp" ? "<p>Each descent starts with these cards. Rewards and upgrades last for that expedition.</p>" : ""}<div class="deck-grid">${[
    ...cards,
  ]
    .sort((a, b) => a.id.localeCompare(b.id))
    .filter((c) => type !== "upgrade" || !c.upgrade)
    .map((c) =>
      type === "upgrade"
        ? `<article class="upgrade-option">${cardMarkup(c, 2, "upgrade")}<p class="upgrade-note">${esc(upgradeDescription(c.id))}</p></article>`
        : cardMarkup(c, 2, "view"),
    )
    .join("")}</div>`;
}
function impactHud(view: E.State, e: E.GameEvent) {
  const u = [...view.party, ...(view.battle?.enemies ?? [])].find(
    (u) => u.id === e.target,
  );
  if (!u) return;
  if (e.kind === "hit") {
    u.hp = Math.max(0, u.hp - (e.value ?? 0));
    u.block = Math.max(0, u.block - (e.blocked ?? 0));
  }
  if (e.kind === "heal") u.hp = Math.min(u.maxHp, u.hp + (e.value ?? 0));
  if (e.kind === "block") u.block += e.value ?? 0;
  const target = ui.querySelector<HTMLButtonElement>(
      `[data-action="target"][data-id="${u.id}"]`,
    ),
    panel = target?.parentElement;
  if (!panel) return;
  const bar = panel.querySelector<HTMLElement>(".health i"),
    label = panel.querySelector(".health span");
  if (bar) bar.style.width = `${(u.hp / u.maxHp) * 100}%`;
  if (label) label.textContent = `${u.hp} / ${u.maxHp}`;
  let block = panel.querySelector<HTMLElement>(".block");
  if (u.block && !block) {
    block = document.createElement("span");
    block.className = "block";
    panel.querySelector(".unit-meta")?.append(block);
  }
  if (block) {
    block.textContent = `\u25c7 ${u.block}`;
    block.hidden = !u.block;
  }
  if (e.kind === "death") {
    panel.classList.add("fallen");
    panel.querySelector<HTMLElement>(".intent")?.remove();
  }
}
async function animate(fn: () => E.GameEvent[]) {
  if (busy) return;
  const before = structuredClone(state);
  let events: E.GameEvent[];
  try {
    events = fn();
  } catch (error) {
    state = before;
    throw error;
  }
  const after = state;
  state = before;
  busy = true;
  selected = null;
  render();
  state = after;
  persist();
  try {
    await stage.play(events, (e) => impactHud(before, e));
  } finally {
    busy = false;
    stage.sync(state);
    if (state.battle?.status !== "player" && state.screen === "combat")
      E.finishBattle(state);
    persist();
    render();
  }
}
function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
ui.addEventListener("click", async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "button[data-action]",
  );
  if (!button || button.disabled) return;
  const { action, id, uid } = button.dataset;
  const n = Number(uid);
  if (busy && action !== "sound") return;
  if (busy && action === "sound") {
    sound.toggle();
    persistPreferences();
    button.textContent = sound.enabled ? "♫ SOUND" : "♫ MUTED";
    return;
  }
  try {
    await sound.unlock().catch(() => {
      sound.enabled = false;
    });
    if (action !== "dismiss") notice = "";
    switch (action) {
      case "roster":
        if (state.screen === "camp") modal = "roster";
        break;
      case "roster-recruit":
        recruitHero(state, button.dataset.kind as ClassId);
        break;
      case "roster-bench":
        benchHero(state, id!);
        break;
      case "roster-activate":
        activateHero(state, id!);
        break;
      case "town":
        if (state.screen !== "camp") break;
        townOpen = true;
        modal = "";
        break;
      case "town-close":
        townOpen = false;
        modal = "";
        break;
      case "building":
        if (state.screen === "camp" && Object.hasOwn(T.BUILDINGS, id!))
          modal = `building:${id}`;
        break;
      case "codex-version":
        codexUpgraded = !codexUpgraded;
        break;
      case "card-movement":
        moveWithCard = !moveWithCard;
        break;
      case "codex":
        modal = `codex:${id}`;
        break;
      case "town-upgrade":
        T.upgrade(state, id!);
        say(
          `${T.BUILDINGS[id as T.BuildingId].name} restored to level ${T.level(state, id as T.BuildingId)}.`,
        );
        break;
      case "reward-redraw":
        E.redrawReward(state);
        break;
      case "embark":
        E.configureExpedition(state, {
          seed: Number(
            ui.querySelector<HTMLInputElement>("#route-seed")!.value,
          ),
          difficulty: ui.querySelector<HTMLSelectElement>("#difficulty")!
            .value as keyof typeof DIFFICULTIES,
        });
        E.embark(
          state,
          ui.querySelector<HTMLInputElement>("#player-name")!.value,
        );
        break;
      case "route":
        E.chooseRoute(state, button.dataset.node!);
        break;
      case "card": {
        const c = state.battle!.hand.find((c) => c.uid === n)!;
        const reason = E.cardReason(state, c);
        if (reason) {
          say(reason);
          break;
        }
        selected = selected === n ? null : n;
        moveWithCard = true;
        break;
      }
      case "tonic":
        selected = selected === -1 ? null : -1;
        break;
      case "target": {
        if (selected === null) {
          const u = [...state.party, ...state.battle!.enemies].find(
            (u) => u.id === id,
          )!;
          say(
            `${u.name}: ${u.hp}/${u.maxHp} HP${u.block ? `, ${u.block} Block` : ""}. Select a card to act.`,
          );
          break;
        }
        await animate(() =>
          selected === -1
            ? E.useTonic(state, id!)
            : E.play(state, selected!, id!, moveWithCard),
        );
        return;
      }
      case "end":
        await animate(() => E.endTurn(state));
        return;
      case "move":
        await animate(() =>
          E.move(state, id!, Number(button.dataset.direction)),
        );
        return;
      case "reward":
        E.claimReward(state, n);
        break;
      case "skip":
        E.claimReward(state, null);
        break;
      case "rest-heal":
        E.rest(state, "heal");
        break;
      case "rest-prepare":
        E.rest(state, "prepare");
        break;
      case "rest-remove":
        modal = "remove";
        break;
      case "remove-card":
        E.rest(state, "remove", n);
        modal = "";
        break;
      case "rest-upgrade":
        modal = "upgrade";
        break;
      case "upgrade":
        if (modal === "upgrade") {
          E.rest(state, "upgrade", n);
          modal = "";
        }
        break;
      case "shrine-choice":
        E.shrineChoice(state, id!);
        break;
      case "skills":
        modal = `skills:${id ?? state.party[0]?.id ?? ""}`;
        break;
      case "train-skill":
        trainSkill(state, id!, button.dataset.skill!);
        say("Training learned. This skill stays with its hero.");
        break;
      case "shrine-accept":
        E.shrine(state, true);
        break;
      case "shrine-leave":
        E.shrine(state, false);
        break;
      case "shop-leave":
        state.screen = "map";
        break;
      case "inventory":
        modal = "inventory:" + (button.dataset.page || "loadout");
        break;
      case "item-buy":
        Q.buy(state, button.dataset.item!);
        say("Purchased permanently. Equip it from your inventory.");
        break;
      case "merchant-upgrade":
        Q.upgradeMerchant(state);
        say("Merchant improved. Better stock is now available.");
        break;
      case "item-equip":
        Q.equip(state, Number(button.dataset.uid), button.dataset.target!);
        say("Loadout updated.");
        break;
      case "item-unequip":
        Q.unequip(state, Number(button.dataset.uid));
        say("Item returned to inventory.");
        break;
      case "item-sell":
        Q.sell(state, Number(button.dataset.uid));
        say("Item salvaged for gold.");
        break;
      case "equipment":
        modal = "inventory:loadout";
        break;
      case "buy":
        E.buyGear(state, id!, button.dataset.gear as GearId);
        modal = "";
        say("Equipment secured. It returns with its wearer.");
        break;
      case "formation":
        E.reorder(state, id!, Number(button.dataset.direction));
        break;
      case "salvage":
        E.salvage(state, id!);
        modal = "";
        say("Equipment salvaged. Gold returned to your available funds.");
        break;
      case "swap-gear":
        E.swapGear(state, id!, button.dataset.to!);
        modal = "";
        say("Equipment transferred. Hero stats updated.");
        break;
      case "paths":
        modal = `paths:${id}`;
        break;
      case "path":
        E.choosePath(state, id!, Number(button.dataset.path));
        modal = `skills:${id}`;
        break;
      case "treat":
        E.healWound(state, id!);
        break;
      case "retreat":
      case "flee":
        modal = action;
        break;
      case "retreat-confirm":
        E.finishRun(state, "retreat");
        modal = "";
        break;
      case "flee-confirm":
        E.finishRun(state, "flee");
        modal = "";
        break;
      case "return":
        E.returnToCamp(state);
        townOpen = true;
        break;
      case "sound":
        sound.toggle();
        persistPreferences();
        break;
      case "motion":
        stage.setReduced(!stage.reduced);
        document.body.classList.toggle("reduced-motion", stage.reduced);
        say("Motion preference updated for combat effects.");
        persistPreferences();
        break;
      case "deck":
      case "draw":
      case "discard":
      case "exhaust":
      case "help":
        modal = action;
        break;
      case "camp-info":
        say(
          "Darkspire II · The Hollow Cathedral. A separate campaign from Darkspire 1.0.",
        );
        break;
      case "close":
        modal = "";
        break;
      case "dismiss":
        notice = "";
        break;
      case "export":
        download(
          `darkspire-2-expedition-${state.run}.json`,
          JSON.stringify(
            { player: state.player, run: state.run, journal: state.journal },
            null,
            2,
          ),
        );
        break;
      case "restore-previous": {
        const result = storage.restorePrevious();
        if (!result.ok || !result.state) throw Error(result.message);
        state = result.state;
        if (state.screen === "combat" && state.battle?.status !== "player")
          E.finishBattle(state);
        saveError = "";
        modal = "";
        selected = null;
        say(
          "Previous checkpoint restored. The replaced save is preserved for export.",
        );
        break;
      }
      case "recover-save": {
        const result = storage.startFresh(E.createGame());
        if (!result.ok || !result.state) throw Error(result.message);
        state = result.state;
        saveError = "";
        modal = "";
        say(
          "Fresh campaign started. The original save is preserved in recovery storage.",
        );
        break;
      }
      case "export-save":
        download("darkspire-2-live-save.json", E.serialize(state));
        break;
      case "export-stored":
        download("darkspire-2-stored-save.json", storage.exportSaved(state));
        break;
      case "export-previous": {
        const raw = storage.exportPrevious();
        if (!raw) throw Error("No previous checkpoint is available.");
        download("darkspire-2-previous-save.json", raw);
        break;
      }
      case "export-recovery": {
        const raw = storage.exportRecovery();
        if (!raw) throw Error("No recovery backup is available.");
        download("darkspire-2-recovery-save.json", raw);
        break;
      }
    }
    persist();
    render();
  } catch (error) {
    say(
      error instanceof Error
        ? error.message
        : "That action could not be completed.",
    );
    render();
  }
});
addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (
    (event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLTextAreaElement) &&
    !modal
  )
    return;
  if (event.key === "Escape") {
    if (busy) return;
    modal = "";
    selected = null;
    render();
    return;
  }
  if (modal) {
    if (event.key === "Tab") {
      const list = Array.from(
        ui.querySelectorAll<HTMLElement>(
          ".modal button:not(:disabled),.modal input:not(:disabled),.modal select:not(:disabled),.modal a[href],.modal summary,.modal textarea:not(:disabled),.modal [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (!list.length) return;
      const i = list.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && i === 0) {
        event.preventDefault();
        list.at(-1)!.focus();
      } else if (!event.shiftKey && i === list.length - 1) {
        event.preventDefault();
        list[0].focus();
      }
    }
    return;
  }
  if (busy || state.screen !== "combat") return;
  if (/^[1-9]$/.test(event.key)) {
    const card = state.battle!.hand[Number(event.key) - 1];
    if (card)
      ui.querySelector<HTMLButtonElement>(
        `[data-action="card"][data-uid="${card.uid}"]`,
      )?.click();
  }
  if (event.key.toLowerCase() === "e") {
    event.preventDefault();
    ui.querySelector<HTMLButtonElement>('[data-action="end"]')?.click();
  }
});
render();

ui.addEventListener("change", async (event) => {
  const input = event.target;
  if (
    input instanceof HTMLSelectElement &&
    input.id === "difficulty" &&
    state.screen === "camp"
  ) {
    E.configureExpedition(state, {
      difficulty: input.value as keyof typeof DIFFICULTIES,
    });
    persist();
    return;
  }
  if (
    input instanceof HTMLInputElement &&
    input.id === "route-seed" &&
    state.screen === "camp"
  ) {
    try {
      E.configureExpedition(state, { seed: Number(input.value) });
      persist();
    } catch (error) {
      say(error instanceof Error ? error.message : "Invalid seed.");
    }
    return;
  }
  if (
    !(input instanceof HTMLInputElement) ||
    input.id !== "import-save" ||
    !input.files?.[0]
  )
    return;
  try {
    if (input.files[0].size > MAX_SAVE_BYTES)
      throw Error("Save exceeds the 8 MB import limit.");
    const result = storage.importSave(await input.files[0].text());
    if (!result.ok || !result.state) throw Error(result.message);
    state = result.state;
    if (state.screen === "combat" && state.battle?.status !== "player")
      E.finishBattle(state);
    saveError = "";
    modal = "";
    selected = null;
    persist();
    say(
      "Campaign restored. The previous save was kept as a local recovery backup.",
    );
    render();
  } catch (error) {
    say(
      error instanceof Error
        ? error.message
        : "Import failed. Your campaign was not changed.",
    );
    render();
  }
});

ui.addEventListener("input", (event) => {
  const input = event.target;
  if (input instanceof HTMLInputElement && input.id === "player-name")
    state.player = input.value.slice(0, 40);
});

function targetPreview(event: Event) {
  const el = event.target;
  if (!(el instanceof HTMLElement) || busy) return;
  const button = el.closest<HTMLElement>('[data-action="target"]');
  const c = state.battle?.hand.find((c) => c.uid === selected);
  if (!button || !c) return;
  const span = ui.querySelector(".battle-status span");
  if (span) span.textContent = E.preview(state, c, button.dataset.id!);
}
ui.addEventListener("mouseover", targetPreview);
ui.addEventListener("focusin", targetPreview);
