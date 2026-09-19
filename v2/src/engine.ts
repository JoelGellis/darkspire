import {
  CARDS,
  CLASSES,
  CLASS_STARTERS,
  GEAR,
  type ClassId,
  type GearId,
  type EncounterId,
  ENCOUNTERS,
} from "./content";
import { newEconomy, ITEMS, type Economy, type OwnedItem } from "./items";
import * as EconomyRules from "./economy";
import {
  newRoster,
  migrateRoster,
  validateRoster,
  type Roster,
} from "./roster";
import { cardDefinition } from "./card-upgrades";
import * as Progression from "./progression";
import {
  newExpedition,
  beginExpedition,
  routeMap,
  nodeInfo,
  resolveShrine,
  migrateExpedition,
  validateExpedition,
  DIFFICULTIES,
  type Expedition,
} from "./expedition";
export {
  configureExpedition,
  expeditionLength,
  routeMap,
  currentShrine,
  shrineChoices,
  activeBlessings,
} from "./expedition";
export { cardDefinition } from "./card-upgrades";
import {
  newTown,
  validateTown,
  retreatRate,
  treatmentCost,
  type Town,
} from "./town";
export interface Unit {
  id: string;
  name: string;
  kind: string;
  rank: number;
  hp: number;
  maxHp: number;
  block: number;
  poison: number;
  power: number;
  xp: number;
  level: number;
  path: number | null;
  gear: GearId | null;
  equipment?: OwnedItem[];
  wounded: boolean;
  skills?: string[];
}
export interface Card {
  uid: number;
  id: string;
  upgrade: number;
  itemUid?: number;
}
export interface Intent {
  source: string;
  target: string;
  damage: number;
}
export interface Battle {
  enemies: Unit[];
  hand: Card[];
  draw: Card[];
  discard: Card[];
  exhaust: Card[];
  energy: number;
  turn: number;
  intents: Intent[];
  encounter: EncounterId;
  status: "player" | "won" | "lost";
}
export interface GameEvent {
  kind: "hit" | "heal" | "block" | "move" | "death" | "turn" | "text";
  source?: string;
  target?: string;
  value?: number;
  blocked?: number;
  style?: string;
  text?: string;
}
export type Screen =
  "camp" | "map" | "combat" | "reward" | "rest" | "shrine" | "shop" | "summary";
export interface Journal {
  seq: number;
  action: string;
  details: unknown;
}
export interface State {
  schema: 1;
  seed: number;
  player: string;
  screen: Screen;
  party: Unit[];
  graveyard: Unit[];
  bank: number;
  gold: number;
  floor: number;
  route: string[];
  deck: Card[];
  battle: Battle | null;
  reward: Card[];
  blessing: boolean;
  potions: number;
  outcome: string;
  run: number;
  nextCard: number;
  journal: Journal[];
  economy: Economy;
  town: Town;
  roster: Roster;
  expedition: Expedition;
}
export const SAVE_KEY = "darkspire-2-campaign-v1";
export function hero(kind: ClassId, rank: number): Unit {
  const c = CLASSES[kind];
  return {
    id: kind,
    name: c.name,
    kind,
    rank,
    hp: c.hp,
    maxHp: c.hp,
    block: 0,
    poison: 0,
    power: 0,
    xp: 0,
    level: 1,
    path: null,
    skills: [],
    gear: null,
    wounded: false,
  };
}
export function createGame(seed = 7319): State {
  return {
    schema: 1,
    seed: seed >>> 0,
    player: "",
    screen: "camp",
    party: (["fighter", "rogue", "cleric", "wizard"] as ClassId[]).map((x, i) =>
      hero(x, i + 1),
    ),
    graveyard: [],
    bank: 40,
    gold: 0,
    floor: 0,
    route: [],
    deck: [],
    battle: null,
    reward: [],
    blessing: false,
    potions: 0,
    outcome: "",
    run: 0,
    nextCard: 1,
    journal: [],
    economy: newEconomy(),
    town: newTown(),
    roster: newRoster(),
    expedition: newExpedition(seed),
  };
}
export function record(s: State, action: string, details: unknown = {}) {
  s.journal.push({ seq: s.journal.length + 1, action, details });
}
export function random(s: State) {
  s.seed = (Math.imul(1664525, s.seed) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function shuffle<T>(s: State, a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function alive(units: Unit[]) {
  return units.filter((u) => u.hp > 0).sort((a, b) => a.rank - b.rank);
}
export function maxHp(u: Unit) {
  return (
    CLASSES[u.kind as ClassId].hp +
    (u.gear === "coat" ? 8 : 0) +
    EconomyRules.stat(u, "hp") +
    (u.path === 1 ? 5 : 0) +
    (u.level - 1) * 2
  );
}
export function power(u: Unit) {
  return (
    (u.gear === "blade" ? 2 : 0) +
    EconomyRules.stat(u, "power") +
    (u.path === 0 ? 2 : 0) +
    (u.level - 1)
  );
}
export function embark(s: State, player: string) {
  if (s.screen !== "camp" || !player.trim())
    throw Error("Enter a player name before descending.");
  if (s.party.length !== 4 || s.party.some((u) => u.hp <= 0))
    throw Error(
      "Assemble four living heroes at the Stagecoach before descending.",
    );
  EconomyRules.embark(s);
  beginExpedition(s);
  s.player = player.trim().slice(0, 40);
  s.run++;
  s.gold = 0;
  s.floor = 0;
  s.route = [];
  s.blessing = false;
  s.potions = 0;
  s.town.redraws = s.town.levels.guild;
  s.battle = null;
  s.outcome = "";
  s.deck = s.party
    .flatMap((u) => CLASS_STARTERS[u.kind as ClassId])
    .map((id) => ({ uid: s.nextCard++, id, upgrade: 0 }));
  for (const u of s.party)
    for (const gear of u.equipment ?? []) {
      const id = ITEMS[gear.id].card;
      if (id)
        s.deck.push({ id, uid: s.nextCard++, upgrade: 0, itemUid: gear.uid });
    }
  for (const u of s.party) {
    u.maxHp = maxHp(u);
    u.hp = u.wounded ? Math.ceil(u.maxHp * 0.8) : u.maxHp;
    u.block = 0;
    u.poison = 0;
  }
  s.screen = "map";
  record(s, "embark", {
    player: s.player,
    run: s.run,
    seed: s.seed,
    difficulty: s.expedition.difficulty,
    party: structuredClone(s.party),
  });
}
export function draw(s: State, n: number) {
  const b = s.battle!;
  for (let i = 0; i < n; i++) {
    if (!b.draw.length) b.draw = shuffle(s, b.discard.splice(0));
    const c = b.draw.pop();
    if (c) b.hand.push(c);
  }
}
export function startBattle(s: State, id: EncounterId) {
  const difficulty = DIFFICULTIES[s.expedition.difficulty];
  const prepared = s.expedition.prepared;
  const enemies = ENCOUNTERS[id].enemies.map((e, i): Unit => ({
    id: `enemy-${i}`,
    kind: e[0],
    name: e[1],
    hp: Math.ceil(e[2] * difficulty.hp),
    maxHp: Math.ceil(e[2] * difficulty.hp),
    power: e[3] + difficulty.power,
    block: 0,
    poison: 0,
    rank: i + 1,
    xp: 0,
    level: 1,
    path: null,
    gear: null,
    wounded: false,
  }));
  for (const u of s.party) {
    u.block =
      (u.gear === "charm" ? 3 : 0) +
      EconomyRules.stat(u, "block") +
      (EconomyRules.aura(s, "guard") ? 3 : 0) +
      (u.path === 2 ? 3 : 0);
    u.block += s.town.levels.smith;
    u.block +=
      Progression.openingBlock(u) +
      (prepared ? 6 : 0) +
      (s.expedition.blessings.includes("shelter") ? 4 : 0);
    u.poison = 0;
  }
  s.battle = {
    enemies,
    hand: [],
    draw: shuffle(
      s,
      structuredClone(s.deck).filter((c) =>
        s.party.some((u) => u.kind === CARDS[c.id].owner && u.hp > 0),
      ),
    ),
    discard: [],
    exhaust: [],
    energy: 3,
    turn: 1,
    intents: [],
    encounter: id,
    status: "player",
  };
  s.screen = "combat";
  draw(
    s,
    5 +
      (EconomyRules.aura(s, "draw") ? 1 : 0) +
      (prepared ? 1 : 0) +
      (s.expedition.blessings.includes("insight") ? 1 : 0),
  );
  s.expedition.prepared = false;
  rollIntents(s);
  record(s, "battle", { id });
}
function rollIntents(s: State) {
  const b = s.battle!,
    targets = alive(s.party);
  const tactics = ENCOUNTERS[b.encounter].tactics;
  const hunted = [...targets].sort(
    (a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.rank - b.rank,
  )[0];
  b.intents = alive(b.enemies).map((u, i) => ({
    source: u.id,
    target:
      tactics === "hunt" && b.turn % 2 === 0
        ? (hunted?.id ?? "")
        : (targets[
            u.kind === "occultist" || u.kind === "wraith"
              ? Math.min(targets.length - 1, 2 + Math.floor(random(s) * 2))
              : i % Math.min(targets.length, 2)
          ]?.id ?? ""),
    damage:
      u.power +
      (tactics === "bell" && b.turn > 3 ? 2 : 0) +
      (tactics === "chorus" && b.turn % 3 === 0 ? 3 : 0),
  }));
}
export function effectiveCard(s: State, c: Card) {
  const d = cardDefinition(c),
    u = s.party.find((u) => u.kind === d.owner);
  return u ? Progression.enhanceCard(u, d) : d;
}
export function cardValue(s: State, c: Card) {
  const d = effectiveCard(s, c),
    u = s.party.find((u) => u.kind === d.owner)!;
  return (
    d.value +
    (["strike", "spell", "cleave", "poison"].includes(d.effect)
      ? power(u) + (s.blessing ? 2 : 0)
      : d.effect === "heal" && u.path === 1
        ? 2
        : 0)
  );
}
export function cardReason(s: State, c: Card): string {
  const b = s.battle,
    d = effectiveCard(s, c),
    u = s.party.find((u) => u.kind === d.owner);
  if (s.screen !== "combat" || !b || b.status !== "player")
    return "Combat is over";
  if (!b.hand.some((x) => x.uid === c.uid)) return "Card is not in your hand";
  if (!u || u.hp <= 0) return "This hero has fallen";
  if (b.energy < d.cost) return "Not enough energy";
  if (d.ranks.length && !d.ranks.includes(u.rank))
    return `${CLASSES[d.owner].title} must be in rank ${d.ranks.join(" or ")}`;
  return "";
}
export function preview(s: State, c: Card, targetId: string): string {
  const target = targets(s, c).find((u) => u.id === targetId);
  if (!target) return "Out of reach";
  const d = effectiveCard(s, c),
    value = cardValue(s, c);
  const extras = [
    d.selfBlock ? `Caster gains ${d.selfBlock} Block.` : "",
    d.partyBlock ? `Other allies gain ${d.partyBlock} Block.` : "",
    d.draw ? `Draw ${d.draw}.` : "",
    d.weaken ? `Reduce its next attack by ${d.weaken}.` : "",
    d.move
      ? d.optionalMove
        ? "Optional advance one rank."
        : "Advance one rank."
      : "",
    d.cleanse ? "Cleanse Poison." : "",
    d.targetBlock ? `Target gains ${d.targetBlock} Block.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (d.effect === "heal")
    return `${target.name}: restore ${Math.min(value, target.maxHp - target.hp)} HP (up to ${value}). ${d.exhaust ? "Exhausts for this fight." : ""} ${extras}`;
  if (d.effect === "block" || d.effect === "step")
    return `${target.name}: gain ${value} Block${d.effect === "step" ? (d.optionalMove ? "; optional retreat one rank" : " and move back one rank") : ""}. ${extras}`;
  const blocked = d.pierce ? 0 : Math.min(target.block, value),
    loss = Math.min(target.hp, value - blocked);
  return `${target.name}: ${loss} HP lost${blocked ? `, ${blocked} absorbed by Block` : ""}${loss === target.hp ? " · lethal" : ""}${d.effect === "poison" ? ` · apply ${d.poisonAmount ?? 3} Poison` : ""}${d.target === "all" ? " · hits every enemy" : ""}${d.pierce ? " · ignores Block" : ""}. ${extras}`;
}
export function targets(s: State, c: Card): Unit[] {
  if (cardReason(s, c)) return [];
  const d = effectiveCard(s, c);
  if (d.target === "self")
    return alive(s.party).filter((u) => u.kind === d.owner);
  if (d.target === "ally") return alive(s.party);
  return alive(s.battle!.enemies).filter(
    (u) => !d.reach.length || d.reach.includes(u.rank),
  );
}
function hit(
  u: Unit,
  value: number,
  events: GameEvent[],
  source: string,
  style: string,
  ignoreBlock = false,
) {
  const blocked = ignoreBlock ? 0 : Math.min(u.block, value);
  u.block -= blocked;
  const loss = Math.min(u.hp, value - blocked);
  u.hp -= loss;
  events.push({
    kind: "hit",
    source,
    target: u.id,
    value: loss,
    blocked,
    style,
    text: blocked ? `${blocked} blocked` : "",
  });
  if (u.hp === 0) events.push({ kind: "death", target: u.id });
}
function checkOutcome(s: State) {
  const b = s.battle!;
  // Close gaps only after the complete action resolves. A melee survivor must
  // always be able to reach the remaining enemy front, including poison kills.
  [
    ...alive(b.enemies),
    ...b.enemies.filter((u) => u.hp <= 0).sort((a, b) => a.rank - b.rank),
  ].forEach((u, i) => {
    u.rank = i + 1;
  });
  if (!alive(s.party).length) b.status = "lost";
  else if (!alive(b.enemies).length) b.status = "won";
}
export function play(
  s: State,
  uid: number,
  targetId: string,
  moveWithCard = true,
): GameEvent[] {
  const b = s.battle;
  if (!b) throw Error("No battle");
  const c = b.hand.find((c) => c.uid === uid);
  if (!c) throw Error("Card is not in your hand");
  const reason = cardReason(s, c);
  if (reason) throw Error(reason);
  const d = effectiveCard(s, c),
    caster = s.party.find((u) => u.kind === d.owner)!,
    valid = targets(s, c);
  if (!valid.some((u) => u.id === targetId))
    throw Error("Target is out of reach");
  const events: GameEvent[] = [],
    value = cardValue(s, c);
  b.energy -= d.cost;
  b.hand = b.hand.filter((x) => x.uid !== uid);
  (d.exhaust ? b.exhaust : b.discard).push(c);
  for (const u of d.target === "all"
    ? valid
    : valid.filter((u) => u.id === targetId)) {
    if (d.effect === "heal") {
      const heal = Math.min(u.maxHp - u.hp, value);
      u.hp += heal;
      events.push({
        kind: "heal",
        source: caster.id,
        target: u.id,
        value: heal,
      });
    } else if (d.effect === "block" || d.effect === "step") {
      u.block += value;
      events.push({ kind: "block", source: caster.id, target: u.id, value });
    } else {
      hit(u, value, events, caster.id, d.effect, d.pierce);
      if (d.effect === "poison" && u.hp > 0) u.poison += d.poisonAmount ?? 3;
      if (d.weaken) {
        for (const intent of b.intents.filter((i) => i.source === u.id))
          intent.damage = Math.max(0, intent.damage - d.weaken);
        events.push({
          kind: "text",
          target: u.id,
          text: `Next attack −${d.weaken}`,
        });
      }
    }
    if (d.cleanse) u.poison = 0;
    if (d.targetBlock) {
      u.block += d.targetBlock;
      events.push({
        kind: "block",
        source: caster.id,
        target: u.id,
        value: d.targetBlock,
      });
    }
  }
  if (d.selfBlock) {
    caster.block += d.selfBlock;
    events.push({
      kind: "block",
      source: caster.id,
      target: caster.id,
      value: d.selfBlock,
    });
  }
  if (d.partyBlock)
    for (const ally of alive(s.party).filter((u) => u.id !== caster.id)) {
      ally.block += d.partyBlock;
      events.push({
        kind: "block",
        source: caster.id,
        target: ally.id,
        value: d.partyBlock,
      });
    }
  if (d.draw) draw(s, d.draw);
  if ((d.effect === "step" || d.move) && (!d.optionalMove || moveWithCard)) {
    const neighbor = s.party.find(
      (u) => u.rank === caster.rank + (d.move ?? 1),
    );
    if (neighbor) {
      [neighbor.rank, caster.rank] = [caster.rank, neighbor.rank];
      events.push({ kind: "move", source: caster.id, target: neighbor.id });
    }
  }
  checkOutcome(s);
  record(s, "card", {
    uid,
    id: c.id,
    targetId,
    moveWithCard: !d.optionalMove || moveWithCard,
    events,
  });
  return events;
}
export function move(s: State, id: string, direction: number): GameEvent[] {
  const b = s.battle!,
    u = s.party.find((u) => u.id === id),
    other = s.party.find((v) => v.rank === (u?.rank ?? 0) + direction);
  if (
    s.screen !== "combat" ||
    b.status !== "player" ||
    !u ||
    u.hp <= 0 ||
    !other ||
    b.energy < 1 ||
    Math.abs(direction) !== 1
  )
    throw Error("Cannot move there");
  [u.rank, other.rank] = [other.rank, u.rank];
  b.energy--;
  record(s, "move", { id, direction });
  return [{ kind: "move", source: id, target: other.id }];
}
export function endTurn(s: State): GameEvent[] {
  const b = s.battle!;
  if (s.screen !== "combat" || b.status !== "player")
    throw Error("Not your turn");
  const events: GameEvent[] = [];
  for (const u of alive(b.enemies)) {
    if (u.poison) {
      hit(u, u.poison, events, u.id, "poison", true);
      u.poison--;
    }
  }
  checkOutcome(s);
  if (b.status === "player") {
    for (const intent of b.intents) {
      const enemy = b.enemies.find((u) => u.id === intent.source);
      if (!enemy || enemy.hp <= 0) continue;
      const target = s.party.find((u) => u.id === intent.target);
      if (target && target.hp > 0)
        hit(
          target,
          intent.damage,
          events,
          enemy.id,
          ["occultist", "wraith"].includes(enemy.kind) ? "spell" : "strike",
        );
    }
    checkOutcome(s);
  }
  if (b.status === "player") {
    b.discard.push(...b.hand.splice(0));
    b.turn++;
    b.energy = 3;
    for (const u of s.party)
      u.block =
        u.hp > 0 ? (u.path === 2 ? 3 : 0) + Progression.turnBlock(u) : 0;
    draw(s, 5);
    rollIntents(s);
    events.push({ kind: "turn", value: b.turn });
  }
  record(s, "end-turn", { events });
  return events;
}
export function finishBattle(s: State) {
  const b = s.battle;
  if (s.screen !== "combat" || !b || b.status === "player")
    throw Error("Battle is not finished");
  if (b.status === "lost") {
    finishRun(s, "defeat");
    return;
  }
  const tier = ENCOUNTERS[b.encounter].tier;
  const gain =
    Math.floor(
      (tier === "boss" ? 60 : tier === "elite" ? 35 : 20) *
        DIFFICULTIES[s.expedition.difficulty].gold,
    ) + (EconomyRules.aura(s, "gold") ? 8 : 0);
  s.gold += gain;
  s.potions = Math.min(3, s.potions + 1);
  for (const u of alive(s.party)) {
    u.xp += tier === "boss" ? 3 : 1;
    u.level = Math.min(6, 1 + Math.floor(u.xp / 3));
    const previous = u.maxHp;
    u.maxHp = maxHp(u);
    u.hp += u.maxHp - previous;
    if (EconomyRules.aura(s, "heal")) u.hp = Math.min(u.maxHp, u.hp + 3);
    u.hp = Math.min(u.maxHp, u.hp + s.town.levels.chapel);
  }
  record(s, "victory", { encounter: b.encounter, gold: gain });
  EconomyRules.drop(s, tier, random(s));
  if (tier === "boss") {
    finishRun(s, "victory");
    return;
  }
  offerRewards(s);
  s.screen = "reward";
}
function offerRewards(s: State, previous: string[] = []) {
  const pool = Object.keys(CARDS).filter(
    (id) =>
      CARDS[id].discovery &&
      alive(s.party).some((u) => u.kind === CARDS[id].owner) &&
      s.deck.filter((c) => c.id === id).length < 2,
  );
  const fresh = pool.filter((id) => !previous.includes(id));
  s.reward = shuffle(s, fresh.length >= 3 ? fresh : pool)
    .slice(0, 3)
    .map((id) => ({ id, uid: s.nextCard++, upgrade: 0 }));
}
export function redrawReward(s: State) {
  if (s.screen !== "reward" || s.town.redraws < 1)
    throw Error("No Guild redraw available.");
  const previous = s.reward.map((c) => c.id);
  offerRewards(s, previous);
  s.town.redraws--;
  record(s, "reward-redraw", { previous, offers: s.reward.map((c) => c.id) });
}
export function claimReward(s: State, uid: number | null) {
  if (s.screen !== "reward") throw Error("No reward");
  if (uid !== null) {
    const c = s.reward.find((c) => c.uid === uid);
    if (!c) throw Error("Invalid reward");
    s.deck.push(c);
  }
  record(s, "reward", { uid });
  s.reward = [];
  s.screen = "map";
}
export function routeOptions(s: State): string[] {
  return routeMap(s)[s.floor]?.map((n) => n.id) ?? [];
}
export function chooseRoute(s: State, node: string) {
  if (s.screen !== "map" || !routeOptions(s).includes(node))
    throw Error("Route is not available");
  s.floor++;
  s.route.push(node);
  record(s, "route", { node });
  const info = nodeInfo(node);
  if (info.encounter) startBattle(s, info.encounter);
  else s.screen = info.kind as Screen;
}
export function rest(
  s: State,
  action: "heal" | "upgrade" | "remove" | "prepare",
  uid?: number,
) {
  if (s.screen !== "rest") throw Error("Not at rest");
  if (action === "heal") {
    for (const u of alive(s.party))
      u.hp = Math.min(u.maxHp, u.hp + Math.ceil(u.maxHp * 0.3));
  } else if (action === "upgrade") {
    const c = s.deck.find((c) => c.uid === uid);
    if (!c || c.upgrade) throw Error("Choose an unupgraded card");
    c.upgrade = 1;
  } else if (action === "remove") {
    const c = s.deck.find((c) => c.uid === uid);
    if (!c || c.itemUid !== undefined)
      throw Error("Choose a card not granted by equipment.");
    const owner = CARDS[c.id].owner;
    if (s.deck.filter((c) => CARDS[c.id].owner === owner).length <= 2)
      throw Error("Keep at least two cards for every hero.");
    s.deck = s.deck.filter((c) => c.uid !== uid);
  } else if (action === "prepare") {
    if (s.expedition.prepared) throw Error("The party is already prepared.");
    s.expedition.prepared = true;
  } else {
    throw Error("Unknown rest choice.");
  }
  record(s, "rest", { action, uid });
  s.screen = "map";
}
export function shrine(s: State, accept: boolean) {
  if (!s.expedition.legacy && currentShrineId(s) !== "shrine") {
    resolveShrine(
      s,
      accept
        ? currentShrineId(s) === "echoes"
          ? "shelter"
          : "bottle"
        : "leave",
    );
    return;
  }
  if (s.screen !== "shrine") throw Error("Not at shrine");
  if (accept) {
    if (alive(s.party).some((u) => u.hp <= 5))
      throw Error("Every living hero needs more than 5 HP");
    for (const u of alive(s.party)) u.hp -= 5;
    s.blessing = true;
  }
  record(s, "shrine", { accept });
  s.screen = "map";
}
function currentShrineId(s: State) {
  return ["echoes", "spring"].includes(s.route.at(-1) ?? "")
    ? s.route.at(-1)!
    : "shrine";
}
export function shrineChoice(s: State, id: string) {
  resolveShrine(s, id);
}
export function buyGear(s: State, id: string, gear: GearId) {
  if (s.screen !== "camp" && s.screen !== "shop")
    throw Error("No merchant here");
  const u = s.party.find((u) => u.id === id);
  if (!u || u.hp <= 0 || u.gear)
    throw Error("Choose a living hero with an empty equipment slot");
  const purse = s.screen === "camp" ? "bank" : "gold";
  if (s[purse] < GEAR[gear].cost) throw Error("Not enough gold");
  s[purse] -= GEAR[gear].cost;
  u.gear = gear;
  const old = u.maxHp;
  u.maxHp = maxHp(u);
  u.hp += u.maxHp - old;
  record(s, "gear", { id, gear });
}
export function choosePath(s: State, id: string, path: number) {
  const u = [...s.party, ...s.roster.reserves].find((u) => u.id === id);
  if (
    s.screen !== "camp" ||
    !u ||
    u.hp <= 0 ||
    u.level < 2 ||
    u.path !== null ||
    ![0, 1, 2].includes(path)
  )
    throw Error("Subclass not available");
  u.path = path;
  u.maxHp = maxHp(u);
  u.hp = u.maxHp;
  record(s, "subclass", { id, path });
}
export function useTonic(s: State, id: string): GameEvent[] {
  const u = s.party.find((u) => u.id === id);
  if (
    s.screen !== "combat" ||
    s.battle?.status !== "player" ||
    s.potions < 1 ||
    !u ||
    u.hp <= 0 ||
    u.hp >= u.maxHp
  )
    throw Error("Choose a wounded living hero and an available tonic");
  const value = Math.min(12, u.maxHp - u.hp);
  u.hp += value;
  s.potions--;
  const events: GameEvent[] = [{ kind: "heal", target: id, value }];
  record(s, "tonic", { id, value });
  return events;
}
export function reorder(s: State, id: string, direction: number) {
  const u = s.party.find((u) => u.id === id),
    other = s.party.find((v) => v.rank === (u?.rank ?? 0) + direction);
  if (s.screen !== "camp" || !u || !other || Math.abs(direction) !== 1)
    throw Error("Cannot change formation");
  [u.rank, other.rank] = [other.rank, u.rank];
  record(s, "formation", { id, direction });
}
export function salvage(s: State, id: string) {
  const u = s.party.find((u) => u.id === id);
  if (!["camp", "shop"].includes(s.screen) || !u?.gear || u.hp <= 0)
    throw Error("No equipment to salvage");
  const gain = Math.floor(GEAR[u.gear].cost / 2);
  s[s.screen === "camp" ? "bank" : "gold"] += gain;
  record(s, "salvage", { id, gear: u.gear, gain });
  u.gear = null;
  u.maxHp = maxHp(u);
  u.hp = Math.min(u.hp, u.maxHp);
}
export function swapGear(s: State, from: string, to: string) {
  const a = s.party.find((u) => u.id === from),
    b = s.party.find((u) => u.id === to);
  if (
    !["camp", "shop"].includes(s.screen) ||
    !a ||
    !b ||
    a === b ||
    a.hp <= 0 ||
    b.hp <= 0
  )
    throw Error("Cannot transfer equipment");
  [a.gear, b.gear] = [b.gear, a.gear];
  for (const u of [a, b]) {
    u.maxHp = maxHp(u);
    u.hp = Math.min(u.hp, u.maxHp);
  }
  record(s, "equipment-swap", { from, to });
}
export function finishRun(
  s: State,
  outcome: "victory" | "retreat" | "flee" | "defeat",
) {
  if (
    outcome === "victory" &&
    (s.screen !== "combat" ||
      s.battle?.status !== "won" ||
      ENCOUNTERS[s.battle.encounter].tier !== "boss")
  )
    throw Error("Victory is not ready to settle");
  if (
    outcome === "defeat" &&
    (s.screen !== "combat" || s.battle?.status !== "lost")
  )
    throw Error("Defeat is not ready to settle");
  if (outcome === "retreat" && s.screen !== "map")
    throw Error("Retreat between fights");
  if (
    outcome === "flee" &&
    (s.screen !== "combat" || s.battle?.status !== "player")
  )
    throw Error("Cannot flee now");
  const gain =
    outcome === "victory"
      ? s.gold
      : outcome === "retreat"
        ? Math.floor(s.gold * retreatRate(s))
        : 0;
  s.bank += gain;
  s.outcome = outcome;
  s.screen = "summary";
  for (const u of s.party) {
    if (u.hp <= 0) s.graveyard.push(structuredClone(u));
    else if (outcome === "flee") u.wounded = true;
  }
  EconomyRules.settle(s, outcome);
  record(s, "run-end", {
    outcome,
    banked: gain,
    fallen: s.party.filter((u) => u.hp <= 0).map((u) => u.id),
  });
}
export function returnToCamp(s: State) {
  if (s.screen !== "summary") throw Error("Run is still active");
  s.party = alive(s.party);
  s.party.forEach((u, i) => {
    u.rank = i + 1;
  });
  for (const u of s.roster.reserves) u.wounded = false;
  s.battle = null;
  s.deck = [];
  s.reward = [];
  s.route = [];
  s.floor = 0;
  s.expedition.seed = s.seed >>> 0;
  s.expedition.legacy = false;
  s.expedition.blessings = [];
  s.expedition.prepared = false;
  s.blessing = false;
  s.screen = "camp";
  record(s, "camp");
}
export function healWound(s: State, id: string) {
  const u = [...s.party, ...s.roster.reserves].find((u) => u.id === id);
  const cost = treatmentCost(s);
  if (s.screen !== "camp" || !u?.wounded || s.bank < cost)
    throw Error("Cannot treat wound");
  s.bank -= cost;
  u.wounded = false;
  record(s, "treat", { id });
}
export function serialize(s: State) {
  return JSON.stringify(s);
}
export function deserialize(raw: string): State {
  const s = JSON.parse(raw) as State;
  // Additive migration for first-playable saves created before tonics existed.
  if (s && s.schema === 1 && s.potions === undefined) s.potions = 0;
  const integer = (n: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    Number.isInteger(n) && Number(n) >= min && Number(n) <= max;
  const validCard = (c: Card) =>
    c &&
    Object.hasOwn(CARDS, c.id) &&
    integer(c.uid, 1) &&
    integer(c.upgrade, 0, 1) &&
    (c.itemUid === undefined || integer(c.itemUid, 1));
  const validUnit = (u: Unit) =>
    u &&
    typeof u.id === "string" &&
    typeof u.name === "string" &&
    integer(u.rank, 1, 4) &&
    integer(u.maxHp, 1, 10000) &&
    integer(u.hp, 0, u.maxHp) &&
    integer(u.block) &&
    integer(u.poison) &&
    integer(u.power, 0, 10000) &&
    integer(u.level, 1, 6) &&
    integer(u.xp) &&
    [null, 0, 1, 2].includes(u.path) &&
    (u.gear === null || u.gear in GEAR) &&
    typeof u.wounded === "boolean";
  if (
    !s ||
    s.schema !== 1 ||
    typeof s.player !== "string" ||
    s.player.length > 40 ||
    !integer(s.seed, 0, 4294967295) ||
    ![
      "camp",
      "map",
      "combat",
      "reward",
      "rest",
      "shrine",
      "shop",
      "summary",
    ].includes(s.screen) ||
    !integer(s.bank) ||
    !integer(s.gold) ||
    !integer(s.floor, 0, 7) ||
    !integer(s.run) ||
    !integer(s.nextCard, 1) ||
    typeof s.blessing !== "boolean" ||
    !integer(s.potions, 0, 3)
  )
    throw Error("Invalid Darkspire II campaign header");
  if (
    !Array.isArray(s.party) ||
    (s.screen === "camp" ? s.party.length > 4 : s.party.length !== 4) ||
    new Set(s.party.map((u) => u.rank)).size !== s.party.length ||
    new Set(s.party.map((u) => u.id)).size !== s.party.length ||
    new Set(s.party.map((u) => u.kind)).size !== s.party.length ||
    s.party.some(
      (u) =>
        !validUnit(u) || !Object.hasOwn(CLASSES, u.kind) || u.id !== u.kind,
    )
  )
    throw Error("Invalid party in save");
  if (
    !Array.isArray(s.graveyard) ||
    s.graveyard.some(
      (u) =>
        !validUnit(u) ||
        !Object.hasOwn(CLASSES, u.kind) ||
        u.id !== u.kind ||
        u.hp !== 0,
    ) ||
    !Array.isArray(s.route) ||
    s.route.length !== s.floor ||
    s.route.some(
      (n) =>
        typeof n !== "string" ||
        (!Object.hasOwn(ENCOUNTERS, n) &&
          !["rest", "shrine", "shop", "echoes", "spring"].includes(n)),
    )
  )
    throw Error("Invalid expedition history");
  EconomyRules.migrate(s);
  EconomyRules.validate(s);
  migrateRoster(s);
  validateRoster(s, validUnit);
  validateTown(s);
  migrateExpedition(s);
  validateExpedition(s);
  Progression.migrate(s);
  Progression.validate(s);
  if (
    !Array.isArray(s.deck) ||
    !Array.isArray(s.reward) ||
    [...s.deck, ...s.reward].some((c) => !validCard(c)) ||
    new Set(s.deck.map((c) => c.uid)).size !== s.deck.length
  )
    throw Error("Unknown or duplicate card in save");
  if (
    !Array.isArray(s.journal) ||
    s.journal.some(
      (e, i) => !e || e.seq !== i + 1 || typeof e.action !== "string",
    )
  )
    throw Error("Invalid journal");
  if (s.screen === "combat" && !s.battle)
    throw Error("Battle is missing from save");
  if (s.battle) {
    const b = s.battle;
    if (
      !Object.hasOwn(ENCOUNTERS, b.encounter) ||
      !["player", "won", "lost"].includes(b.status) ||
      !integer(b.energy, 0, 3) ||
      !integer(b.turn, 1) ||
      !Array.isArray(b.enemies) ||
      !b.enemies.length ||
      b.enemies.length > 4 ||
      b.enemies.length !== ENCOUNTERS[b.encounter].enemies.length ||
      b.enemies.some((u, index) =>
        !validUnit(u) ||
        u.id !== `enemy-${index}` ||
        u.kind !== ENCOUNTERS[b.encounter].enemies[index]?.[0] ||
        u.rank > b.enemies.length,
      ) ||
      new Set(b.enemies.map((u) => u.id)).size !== b.enemies.length ||
      new Set(b.enemies.map((u) => u.rank)).size !== b.enemies.length ||
      !Array.isArray(b.intents) ||
      b.intents.some(
        (i) =>
          !b.enemies.some((u) => u.id === i.source) ||
          !s.party.some((u) => u.id === i.target) ||
          !integer(i.damage),
      )
    )
      throw Error("Invalid combat in save");
    const piles = [b.hand, b.draw, b.discard, b.exhaust];
    if (piles.some((p) => !Array.isArray(p))) throw Error("Invalid card piles");
    const cards = piles.flat();
    if (
      cards.some((c) => !validCard(c)) ||
      new Set(cards.map((c) => c.uid)).size !== cards.length
    )
      throw Error("Invalid combat deck");
  }
  return s;
}
