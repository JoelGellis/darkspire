import type { State } from "./engine";

export const BUILDINGS = {
  smith: {
    name: "Blacksmith",
    district: "THE EMBER YARD",
    symbol: "⚒",
    subtitle: "Armor & preparation",
    description:
      "Maintain the party's armor. Each level gives every hero +1 Block at the start of every fight.",
    baseCost: 45,
    x: 18,
    y: 55,
  },
  guild: {
    name: "Adventurers' Guild",
    district: "THE OLD HALL",
    symbol: "⚔",
    subtitle: "Cards & class paths",
    description:
      "Each level grants one reward redraw per expedition. Redraws offer fresh discoveries where possible. Browse every class action here.",
    baseCost: 40,
    x: 43,
    y: 31,
  },
  chapel: {
    name: "Candle Chapel",
    district: "SAINT'S RISE",
    symbol: "✦",
    subtitle: "Recovery after victory",
    description:
      "Each level restores 1 HP to every surviving hero after a won battle. The fallen stay fallen.",
    baseCost: 50,
    x: 70,
    y: 23,
  },
  infirmary: {
    name: "Infirmary",
    district: "THE WHITE HOUSE",
    symbol: "✚",
    subtitle: "Wound treatment",
    description:
      "Treat expedition wounds. Each level reduces treatment by 3 gold, from 15 down to 6.",
    baseCost: 30,
    x: 76,
    y: 60,
  },
  merchant: {
    name: "The Wayfarer",
    district: "MARKET SQUARE",
    symbol: "◈",
    subtitle: "Items, relics & salvage",
    description:
      "Buy permanent equipment and party relics, manage the stash, and salvage unwanted gear. Shop upgrades unlock higher item tiers.",
    baseCost: 80,
    x: 42,
    y: 69,
  },
  waystation: {
    name: "Watchtower",
    district: "THE NORTH ROAD",
    symbol: "♜",
    subtitle: "Safer retreat routes",
    description:
      "Each level increases gold banked by a map retreat by 5 percentage points: 50% up to 65%. Fleeing combat still loses run gold.",
    baseCost: 35,
    x: 16,
    y: 19,
  },
  graveyard: {
    name: "Graveyard",
    district: "BEYOND THE WALL",
    symbol: "†",
    subtitle: "Remember the fallen",
    description:
      "Names, service, and the things the dark took from them. No resurrection. No forgetting.",
    baseCost: 0,
    x: 91,
    y: 48,
  },
} as const;
export type BuildingId = keyof typeof BUILDINGS;
export type TownTrack =
  "smith" | "guild" | "chapel" | "infirmary" | "waystation";
export interface Town {
  version: 1;
  levels: Record<TownTrack, number>;
  redraws: number;
}
export function newTown(): Town {
  return {
    version: 1,
    levels: { smith: 0, guild: 0, chapel: 0, infirmary: 0, waystation: 0 },
    redraws: 0,
  };
}
export function level(s: State, id: BuildingId) {
  return id === "merchant"
    ? s.economy.merchantLevel
    : id === "graveyard"
      ? 0
      : s.town.levels[id];
}
export function upgradeCost(s: State, id: BuildingId) {
  return BUILDINGS[id].baseCost * (level(s, id) + 1);
}
export function restorationPreview(s: State, id: BuildingId): string {
  const current = level(s, id),
    next = Math.min(3, current + 1);
  switch (id) {
    case "smith":
      return `Starting Block per hero: +${current} → +${next}`;
    case "guild":
      return `Reward redraws per expedition: ${current} → ${next}`;
    case "chapel":
      return `Victory healing per survivor: ${current} → ${next} HP`;
    case "infirmary":
      return `Treatment price: ${15 - current * 3} → ${15 - next * 3} gold`;
    case "waystation":
      return `Map retreat banking: ${50 + current * 5}% → ${50 + next * 5}%`;
    case "merchant":
      return `Stock tier: ${["Basic", "Uncommon", "Rare", "Legendary"][current]} → ${["Basic", "Uncommon", "Rare", "Legendary"][next]}`;
    case "graveyard":
      return "The fallen cannot be restored.";
  }
}
export function treatmentCost(s: State) {
  return 15 - s.town.levels.infirmary * 3;
}
export function retreatRate(s: State) {
  return 0.5 + s.town.levels.waystation * 0.05;
}
export function upgrade(s: State, id: string) {
  if (s.screen !== "camp" || !Object.hasOwn(s.town.levels, id))
    throw Error("This building cannot be upgraded here.");
  const key = id as TownTrack,
    cost = upgradeCost(s, key);
  if (level(s, key) >= 3 || s.bank < cost)
    throw Error("Building is fully restored or you need more gold.");
  s.bank -= cost;
  s.town.levels[key]++;
  s.journal.push({
    seq: s.journal.length + 1,
    action: "town-upgrade",
    details: { building: key, level: level(s, key), cost },
  });
}
export function validateTown(s: State) {
  if (s.town === undefined) s.town = newTown();
  const t = s.town;
  if (
    !t ||
    t.version !== 1 ||
    !t.levels ||
    Object.keys(newTown().levels).some(
      (id) =>
        !Number.isInteger(t.levels[id as TownTrack]) ||
        t.levels[id as TownTrack] < 0 ||
        t.levels[id as TownTrack] > 3,
    ) ||
    !Number.isInteger(t.redraws) ||
    t.redraws < 0 ||
    t.redraws > t.levels.guild
  )
    throw Error("Invalid town progression");
}
