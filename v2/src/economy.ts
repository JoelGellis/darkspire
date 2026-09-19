import { ITEMS, newEconomy, type OwnedItem } from "./items";
import { CARDS, CLASSES, CLASS_STARTERS, type ClassId } from "./content";
import type { State, Unit } from "./engine";

export function stat(u: Unit, key: "hp" | "power" | "block") {
  return (u.equipment ?? []).reduce(
    (sum, i) => sum + (ITEMS[i.id][key] ?? 0),
    0,
  );
}
export function aura(s: State, effect: string) {
  return s.economy.artifacts.some(
    (i) =>
      ITEMS[i.id].aura === effect ||
      ITEMS[i.id].auras?.some((a) => a === effect),
  );
}
export function baseDeck(s: State): string[] {
  return [
    ...s.party.flatMap((u) => CLASS_STARTERS[u.kind as ClassId]),
    ...s.party.flatMap((u) =>
      (u.equipment ?? []).flatMap((i) =>
        ITEMS[i.id].card ? [ITEMS[i.id].card!] : [],
      ),
    ),
  ];
}
function note(s: State, action: string, details: unknown) {
  s.journal.push({ seq: s.journal.length + 1, action, details });
}
function item(s: State, id: string, found = false): OwnedItem {
  return { uid: s.economy.nextItem++, id, foundRun: found ? s.run : null };
}
export function migrate(s: State) {
  if (s.economy === undefined) {
    s.economy = newEconomy();
    for (const u of s.party ?? []) {
      u.equipment = [];
      if (u.gear && ITEMS[u.gear]) {
        u.equipment.push(item(s, u.gear));
        u.gear = null;
      }
    }
  }
}
export function validate(s: State) {
  const e = s.economy;
  if (
    !e ||
    e.version !== 1 ||
    !Number.isInteger(e.nextItem) ||
    e.nextItem < 1 ||
    !Number.isInteger(e.merchantLevel) ||
    e.merchantLevel < 0 ||
    e.merchantLevel > 3 ||
    !Array.isArray(e.stock) ||
    e.stock.some((id) => !Object.hasOwn(ITEMS, id)) ||
    typeof e.stockKey !== "string" ||
    !Array.isArray(e.lastLoot) ||
    e.lastLoot.some((id) => !Object.hasOwn(ITEMS, id))
  )
    throw Error("Invalid item economy");
  const groups = [
    e.stash,
    e.pack,
    e.artifacts,
    ...s.party.map((u) => u.equipment ?? []),
  ];
  if (groups.some((g) => !Array.isArray(g))) throw Error("Invalid inventory");
  const all = groups.flat();
  if (
    all.some(
      (i) =>
        !i ||
        !Object.hasOwn(ITEMS, i.id) ||
        !Number.isInteger(i.uid) ||
        i.uid < 1 ||
        i.uid >= e.nextItem ||
        (i.foundRun !== null &&
          (!Number.isInteger(i.foundRun) ||
            i.foundRun < 1 ||
            i.foundRun > s.run)),
    ) ||
    new Set(all.map((i) => i.uid)).size !== all.length
  )
    throw Error("Invalid or duplicate item");
  if (
    e.artifacts.some((i) => ITEMS[i.id].slot !== "artifact") ||
    new Set(e.artifacts.map((i) => i.id)).size !== e.artifacts.length
  )
    throw Error("Invalid party artifacts");
  for (const u of s.party) {
    const kit = u.equipment ?? [];
    if (
      kit.length > 3 ||
      new Set(kit.map((i) => ITEMS[i.id].slot)).size !== kit.length ||
      kit.some(
        (i) =>
          ITEMS[i.id].slot === "artifact" ||
          (ITEMS[i.id].owner && ITEMS[i.id].owner !== u.kind),
      )
    )
      throw Error("Invalid hero equipment");
  }
}
export function stock(s: State): string[] {
  const e = s.economy,
    camp = s.screen === "camp";
  const key = camp
    ? `camp-${s.run}-${e.merchantLevel}`
    : `shop-${s.run}-${s.floor}`;
  if (e.stockKey !== key) {
    const pool = Object.keys(ITEMS).filter(
      (id) =>
        ITEMS[id].tier <= (camp ? e.merchantLevel : 3) &&
        (camp ||
          !ITEMS[id].owner ||
          s.party.some((u) => u.hp > 0 && u.kind === ITEMS[id].owner)),
    );
    // Stable local stock rotation does not consume combat RNG.
    const offset = (s.run * 7 + s.floor * 3) % pool.length;
    const rotating = [...pool.slice(offset), ...pool.slice(0, offset)].filter(
      (id) => !["blade", "coat", "charm"].includes(id),
    );
    e.stock = camp ? pool : ["blade", "coat", "charm", ...rotating.slice(0, 4)];
    if (!camp && !e.stock.some((id) => ITEMS[id].tier >= 2))
      e.stock[e.stock.length - 1] = "duskplate";
    if (!camp && !e.stock.some((id) => ITEMS[id].slot === "artifact"))
      e.stock[e.stock.length - 2] = "wardbell";
    e.stockKey = key;
  }
  return e.stock;
}
function safe(s: State) {
  if (!["camp", "map", "reward", "rest", "shrine", "shop"].includes(s.screen))
    throw Error("Manage items between fights.");
}
function bag(s: State) {
  return s.screen === "camp" ? s.economy.stash : s.economy.pack;
}
export function buy(s: State, id: string) {
  if (!["camp", "shop"].includes(s.screen) || !Object.hasOwn(ITEMS, id))
    throw Error("No merchant here.");
  const offers = stock(s),
    index = offers.indexOf(id),
    purse = s.screen === "camp" ? "bank" : "gold";
  if (index < 0 || s[purse] < ITEMS[id].cost)
    throw Error("Item unavailable or not enough gold.");
  s[purse] -= ITEMS[id].cost;
  offers.splice(index, 1);
  bag(s).push(item(s, id));
  note(s, "item-buy", { id, cost: ITEMS[id].cost });
}
export function upgradeMerchant(s: State) {
  const cost = 80 * (s.economy.merchantLevel + 1);
  if (s.screen !== "camp" || s.economy.merchantLevel >= 3 || s.bank < cost)
    throw Error("Merchant upgrade unavailable.");
  s.bank -= cost;
  s.economy.merchantLevel++;
  note(s, "merchant-upgrade", { level: s.economy.merchantLevel, cost });
}
function refresh(s: State, u: Unit) {
  u.maxHp =
    CLASSES[u.kind as ClassId].hp +
    (u.gear === "coat" ? 8 : 0) +
    stat(u, "hp") +
    (u.path === 1 ? 5 : 0) +
    (u.level - 1) * 2;
  u.hp = Math.min(u.hp, u.maxHp);
  // Equipment cards are rebuilt between fights; they never leak after unequipping.
  if (s.screen !== "camp") {
    const equipped = s.party.flatMap((hero) => hero.equipment ?? []);
    s.deck = s.deck.filter(
      (c) =>
        c.itemUid === undefined || equipped.some((i) => i.uid === c.itemUid),
    );
    for (const hero of s.party)
      for (const gear of hero.equipment ?? []) {
        const id = ITEMS[gear.id].card;
        if (id && !s.deck.some((c) => c.itemUid === gear.uid))
          s.deck.push({ id, uid: s.nextCard++, upgrade: 0, itemUid: gear.uid });
      }
  }
}
export function equip(s: State, uid: number, target: string) {
  safe(s);
  const b = bag(s),
    index = b.findIndex((i) => i.uid === uid),
    i = b[index];
  if (!i) throw Error("Item not in this inventory.");
  const d = ITEMS[i.id];
  if (d.slot === "artifact") {
    if (
      target !== "party" ||
      (s.screen === "camp" && s.economy.artifacts.length >= 1) ||
      s.economy.artifacts.some((a) => a.id === i.id)
    )
      throw Error(
        "Bring one party relic from camp. During runs, add any distinct relic; duplicate auras do not stack.",
      );
    b.splice(index, 1);
    s.economy.artifacts.push(i);
  } else {
    const u = s.party.find((u) => u.id === target);
    if (!u || u.hp <= 0 || (d.owner && d.owner !== u.kind))
      throw Error("Choose a compatible living hero.");
    u.equipment ??= [];
    const old = u.equipment.findIndex((g) => ITEMS[g.id].slot === d.slot);
    b.splice(index, 1);
    if (old >= 0) b.push(...u.equipment.splice(old, 1));
    u.equipment.push(i);
    refresh(s, u);
  }
  note(s, "item-equip", { uid, target });
}
export function unequip(s: State, uid: number) {
  safe(s);
  const u = s.party.find((u) => u.equipment?.some((i) => i.uid === uid));
  if (u && u.hp <= 0) throw Error("The fallen cannot return equipment.");
  const list = u?.equipment ?? s.economy.artifacts,
    index = list.findIndex((i) => i.uid === uid);
  if (index < 0) throw Error("Item is not equipped.");
  bag(s).push(...list.splice(index, 1));
  if (u) refresh(s, u);
  note(s, "item-unequip", { uid });
}
export function sell(s: State, uid: number) {
  if (!["camp", "shop"].includes(s.screen))
    throw Error("Salvage at a merchant.");
  const b = bag(s),
    index = b.findIndex((i) => i.uid === uid);
  if (index < 0) throw Error("Unequip the item before salvaging.");
  const i = b[index],
    gain = Math.floor(ITEMS[i.id].cost / 2);
  b.splice(index, 1);
  s[s.screen === "camp" ? "bank" : "gold"] += gain;
  note(s, "item-salvage", { id: i.id, gain });
}
export function embark(s: State) {
  const problems = loadoutWarnings(s);
  if (problems.length) throw Error(problems.join(" "));
  s.economy.lastLoot = [];
}
export function loadoutWarnings(s: State): string[] {
  const problems = s.party
    .filter((u) => (u.equipment?.length ?? 0) + (u.gear ? 1 : 0) > 1)
    .map(
      (u) =>
        `${u.name}: bring one item per hero; store ${(u.equipment?.length ?? 0) + (u.gear ? 1 : 0) - 1} extra.`,
    );
  if (s.economy.artifacts.length > 1)
    problems.push(
      `Bring one party relic; store ${s.economy.artifacts.length - 1} extra.`,
    );
  if (s.economy.pack.length)
    problems.push("Return carried items to camp before descending.");
  return problems;
}
export function comparison(s: State, id: string, heroId: string): string {
  const d = ITEMS[id],
    u = s.party.find((u) => u.id === heroId);
  if (
    !d ||
    !u ||
    u.hp <= 0 ||
    (d.owner && d.owner !== u.kind) ||
    d.slot === "artifact"
  )
    return "Cannot equip.";
  const old = u.equipment?.find((i) => ITEMS[i.id].slot === d.slot),
    previous = old ? ITEMS[old.id] : undefined;
  const changes: string[] = [];
  for (const [key, label] of [
    ["power", "attack"],
    ["hp", "max HP"],
    ["block", "starting Block"],
  ] as const) {
    const delta = (d[key] ?? 0) - (previous?.[key] ?? 0);
    if (delta) changes.push(`${delta > 0 ? "+" : ""}${delta} ${label}`);
  }
  if (previous?.card !== d.card) {
    if (previous?.card) changes.push(`loses ${CARDS[previous.card].name}`);
    if (d.card) changes.push(`adds ${CARDS[d.card].name}`);
  }
  return `${previous ? `Replaces ${previous.name}` : `Empty ${d.slot} slot`}. ${changes.length ? changes.join("; ") : "Same bonuses."}`;
}
export function drop(s: State, kind: string, roll: number) {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1)
    throw Error("Loot roll must be in [0, 1).");
  const pool = Object.keys(ITEMS).filter(
    (id) =>
      (!ITEMS[id].owner ||
        s.party.some((u) => u.hp > 0 && u.kind === ITEMS[id].owner)) &&
      (kind === "boss"
        ? ITEMS[id].tier >= 2
        : kind === "elite"
          ? ITEMS[id].slot === "artifact"
          : ITEMS[id].slot !== "artifact" && ITEMS[id].tier <= 1),
  );
  // Weight rarity bands, then share the band's chance across eligible items.
  // Adding class items cannot silently flood the economy with rarer salvage.
  const weights =
    kind === "boss"
      ? [0, 0, 90, 10]
      : kind === "elite"
        ? [45, 40, 13, 2]
        : [75, 25, 0, 0];
  const counts = weights.map(
    (_, tier) => pool.filter((id) => ITEMS[id].tier === tier).length,
  );
  const weighted = pool.map((id) => ({
    id,
    weight: weights[ITEMS[id].tier] / counts[ITEMS[id].tier],
  }));
  let cursor = roll * weighted.reduce((sum, entry) => sum + entry.weight, 0);
  const id =
    weighted.find((entry) => (cursor -= entry.weight) < 0)?.id ??
    weighted.at(-1)!.id;
  s.economy.pack.push(item(s, id, true));
  s.economy.lastLoot = [id];
  note(s, "item-found", { id });
}
export function settle(s: State, outcome: string) {
  const lost: OwnedItem[] = [];
  for (const u of s.party) {
    u.equipment ??= [];
    if (u.hp <= 0) {
      lost.push(...u.equipment);
      u.equipment = [];
    } else if (outcome === "flee") {
      lost.push(...u.equipment.filter((i) => i.foundRun === s.run));
      u.equipment = u.equipment.filter((i) => i.foundRun !== s.run);
      refresh(s, u);
    }
  }
  if (outcome === "defeat") {
    lost.push(...s.economy.pack, ...s.economy.artifacts);
    s.economy.pack = [];
    s.economy.artifacts = [];
  } else if (outcome === "flee") {
    for (const key of ["pack", "artifacts"] as const) {
      lost.push(...s.economy[key].filter((i) => i.foundRun === s.run));
      s.economy[key] = s.economy[key].filter((i) => i.foundRun !== s.run);
    }
  }
  for (const i of [
    ...s.economy.pack,
    ...s.economy.artifacts,
    ...s.party.flatMap((u) => u.equipment ?? []),
  ])
    i.foundRun = null;
  s.economy.stash.push(...s.economy.pack.splice(0));
  note(s, "item-settlement", {
    outcome,
    lost: lost.map((i) => i.id),
    stored: s.economy.stash.length,
  });
}
