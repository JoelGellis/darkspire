import { ENCOUNTERS, type EncounterId } from "./content";
import type { State } from "./engine";

export const DIFFICULTIES = {
  standard: {
    name: "Pilgrim",
    description:
      "Standard enemy strength. Learn the cathedral at your own pace.",
    hp: 1,
    power: 0,
    gold: 1,
  },
  veteran: {
    name: "Veteran",
    description:
      "Enemies have 25% more HP and +2 attack. Earn 25% more combat gold.",
    hp: 1.25,
    power: 2,
    gold: 1.25,
  },
} as const;
export type Difficulty = keyof typeof DIFFICULTIES;
export type BlessingId = "shelter" | "insight";
export interface Expedition {
  version: 1;
  seed: number;
  difficulty: Difficulty;
  legacy: boolean;
  blessings: BlessingId[];
  prepared: boolean;
}
export interface RouteNode {
  id: string;
  kind: "combat" | "elite" | "boss" | "rest" | "shrine" | "shop";
  title: string;
  description: string;
  encounter?: EncounterId;
}
export function newExpedition(seed: number, legacy = false): Expedition {
  return {
    version: 1,
    seed: seed >>> 0,
    difficulty: "standard",
    legacy,
    blessings: [],
    prepared: false,
  };
}
export function configureExpedition(
  s: State,
  options: { seed?: number; difficulty?: Difficulty },
) {
  if (s.screen !== "camp") throw Error("Configure an expedition at camp.");
  if (
    options.seed !== undefined &&
    (!Number.isInteger(options.seed) ||
      options.seed < 0 ||
      options.seed > 4294967295)
  )
    throw Error("The route seed must be a whole number from 0 to 4294967295.");
  if (
    options.difficulty !== undefined &&
    !Object.hasOwn(DIFFICULTIES, options.difficulty)
  )
    throw Error("Unknown expedition difficulty.");
  if (options.seed !== undefined) s.expedition.seed = options.seed;
  if (options.difficulty !== undefined)
    s.expedition.difficulty = options.difficulty;
  s.journal.push({
    seq: s.journal.length + 1,
    action: "expedition-config",
    details: options,
  });
}
export function beginExpedition(s: State) {
  s.expedition.legacy = false;
  s.expedition.blessings = [];
  s.expedition.prepared = false;
  // The displayed seed reproduces both the route and combat draws for the same loadout.
  s.seed = s.expedition.seed;
}
const special: Record<string, RouteNode> = {
  rest: {
    id: "rest",
    kind: "rest",
    title: "A Quiet Flame",
    description:
      "Heal, master a card, thin your deck, or prepare for the next fight.",
  },
  shop: {
    id: "shop",
    kind: "shop",
    title: "The Wayfarer",
    description: "Buy or salvage permanent equipment with expedition gold.",
  },
  shrine: {
    id: "shrine",
    kind: "shrine",
    title: "Altar of Embers",
    description:
      "Trade five HP per survivor for +2 attack damage, or receive healing.",
  },
  echoes: {
    id: "echoes",
    kind: "shrine",
    title: "The Listening Stones",
    description:
      "Choose starting Block or another opening card for the rest of this run.",
  },
  spring: {
    id: "spring",
    kind: "shrine",
    title: "The Silver Spring",
    description: "Drink to heal the party or bottle two healing tonics.",
  },
};
export function nodeInfo(id: string): RouteNode {
  if (Object.hasOwn(special, id)) return special[id];
  if (!Object.hasOwn(ENCOUNTERS, id)) throw Error("Unknown route node.");
  const encounter = id as EncounterId,
    def = ENCOUNTERS[encounter];
  return {
    id,
    kind: def.tier,
    title: def.name,
    description: `${def.subtitle}. ${encounterTactics(encounter)}`,
    encounter,
  };
}
export function encounterTactics(id: EncounterId) {
  const d = ENCOUNTERS[id];
  if (d.tactics === "hunt")
    return "Hunters pressure the most wounded survivor every second round.";
  if (d.tactics === "chorus")
    return "Every third round, the choir's attacks grow by 3.";
  if (d.tactics === "bell")
    return "After round 3, every enemy's attacks grow by 2.";
  return "Armored fighters threaten the front; spirits and casters reach the rear.";
}
export function routeMap(s: State): RouteNode[][] {
  if (s.expedition.legacy)
    return [
      ["sentries"],
      ["rest", "beasts"],
      ["shrine", "elite"],
      ["shop", "rest"],
      ["boss"],
    ].map((row) => row.map(nodeInfo));
  let seed = s.expedition.seed;
  const pick = <T>(pool: readonly T[]): T => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return pool[Math.floor((seed / 4294967296) * pool.length)];
  };
  const early = pick(["beasts", "choir", "scavengers"]);
  const elite = pick(["elite", "covenant", "hunt"]);
  const late = pick(["procession", "choir", "scavengers"]);
  const alternate = pick(
    ["beasts", "procession", "choir"].filter((id) => id !== late),
  );
  const shrine = pick(["echoes", "spring"]);
  const boss = pick(["boss", "abbess", "devourer"]);
  return [
    ["sentries"],
    ["rest", early],
    ["shrine", elite],
    ["shop", "rest"],
    [late, alternate],
    [shrine, "rest"],
    [boss],
  ].map((row) => row.map(nodeInfo));
}
export function expeditionLength(s: State) {
  return routeMap(s).length;
}
export function currentShrine(s: State): RouteNode {
  const last = s.route.at(-1);
  return special[
    last && ["shrine", "echoes", "spring"].includes(last) ? last : "shrine"
  ];
}
export interface ShrineChoice {
  id: string;
  label: string;
  description: string;
  disabledReason: string;
}
export function shrineChoices(s: State): ShrineChoice[] {
  const kind = currentShrine(s).id;
  const survivors = s.party.filter((u) => u.hp > 0);
  const choices: ShrineChoice[] =
    kind === "shrine"
      ? [
          {
            id: "blood",
            label: "Offer your blood",
            description:
              "Lose 5 HP per survivor. Gain +2 attack damage for this expedition.",
            disabledReason: s.blessing
              ? "Ember blessing is already active."
              : survivors.some((u) => u.hp <= 5)
                ? "Every survivor needs more than 5 HP."
                : "",
          },
          {
            id: "mercy",
            label: "Ask for mercy",
            description: "Restore 8 HP to each living hero.",
            disabledReason: survivors.every((u) => u.hp === u.maxHp)
              ? "The party is already healthy."
              : "",
          },
        ]
      : kind === "echoes"
        ? [
            {
              id: "shelter",
              label: "Remember the shield",
              description:
                "Each hero begins every remaining fight with 4 extra Block.",
              disabledReason: s.expedition.blessings.includes("shelter")
                ? "This blessing is already active."
                : "",
            },
            {
              id: "insight",
              label: "Remember the word",
              description:
                "Draw one extra card at the start of every remaining fight.",
              disabledReason: s.expedition.blessings.includes("insight")
                ? "This blessing is already active."
                : "",
            },
          ]
        : [
            {
              id: "drink",
              label: "Drink together",
              description: "Restore 25% of maximum HP to every living hero.",
              disabledReason: survivors.every((u) => u.hp === u.maxHp)
                ? "The party is already healthy."
                : "",
            },
            {
              id: "bottle",
              label: "Bottle the water",
              description:
                "Gain 2 healing tonics, up to the carrying limit of 3.",
              disabledReason:
                s.potions >= 3 ? "Your tonic supply is full." : "",
            },
          ];
  return [
    ...choices,
    {
      id: "leave",
      label: "Leave undisturbed",
      description: "Continue without taking a blessing.",
      disabledReason: "",
    },
  ];
}
export function resolveShrine(s: State, id: string) {
  if (s.screen !== "shrine") throw Error("Not at shrine.");
  const choice = shrineChoices(s).find((c) => c.id === id);
  if (!choice) throw Error("This shrine does not offer that choice.");
  if (choice.disabledReason) throw Error(choice.disabledReason);
  const survivors = s.party.filter((u) => u.hp > 0);
  if (id === "blood") {
    survivors.forEach((u) => (u.hp -= 5));
    s.blessing = true;
  }
  if (id === "mercy" || id === "drink")
    survivors.forEach(
      (u) =>
        (u.hp = Math.min(
          u.maxHp,
          u.hp + (id === "mercy" ? 8 : Math.ceil(u.maxHp * 0.25)),
        )),
    );
  if (id === "shelter" || id === "insight") s.expedition.blessings.push(id);
  if (id === "bottle") s.potions = Math.min(3, s.potions + 2);
  s.journal.push({
    seq: s.journal.length + 1,
    action: "shrine-choice",
    details: { shrine: currentShrine(s).id, id },
  });
  s.screen = "map";
}
export function activeBlessings(
  s: State,
): { name: string; description: string }[] {
  return [
    ...(s.blessing
      ? [
          {
            name: "Ember blessing",
            description: "+2 attack damage this expedition.",
          },
        ]
      : []),
    ...(s.expedition.blessings.includes("shelter")
      ? [
          {
            name: "Shelter",
            description: "+4 Block to every hero at combat start.",
          },
        ]
      : []),
    ...(s.expedition.blessings.includes("insight")
      ? [{ name: "Insight", description: "+1 opening card each combat." }]
      : []),
    ...(s.expedition.prepared
      ? [
          {
            name: "Prepared",
            description:
              "+6 Block per hero and +1 opening card next combat only.",
          },
        ]
      : []),
  ];
}
export function migrateExpedition(s: State) {
  if (s.expedition === undefined) s.expedition = newExpedition(s.seed, true);
}
export function validateExpedition(s: State) {
  const e = s.expedition;
  if (
    !e ||
    e.version !== 1 ||
    !Number.isInteger(e.seed) ||
    e.seed < 0 ||
    e.seed > 4294967295 ||
    !Object.hasOwn(DIFFICULTIES, e.difficulty) ||
    typeof e.legacy !== "boolean" ||
    typeof e.prepared !== "boolean" ||
    !Array.isArray(e.blessings) ||
    e.blessings.some((id) => !["shelter", "insight"].includes(id)) ||
    new Set(e.blessings).size !== e.blessings.length
  )
    throw Error("Invalid expedition configuration.");
  if (s.floor > expeditionLength(s)) throw Error("Invalid expedition depth.");
  // Route history is validated against the frozen seed, never the mutable battle RNG.
  const map = routeMap(s);
  if (s.route.some((id, i) => !map[i]?.some((n) => n.id === id)))
    throw Error("Route history does not match this expedition.");
}
