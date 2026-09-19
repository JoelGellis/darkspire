import type { ClassId } from "./content";
export type ItemSlot = "weapon" | "armor" | "trinket" | "artifact";
export interface ItemDef {
  name: string;
  slot: ItemSlot;
  cost: number;
  tier: number;
  text: string;
  hp?: number;
  power?: number;
  block?: number;
  card?: string;
  owner?: ClassId;
  aura?: "guard" | "draw" | "heal" | "gold";
  auras?: ("guard" | "draw" | "heal" | "gold")[];
}
export const ITEMS: Record<string, ItemDef> = {
  blade: {
    name: "Tempered edge",
    slot: "weapon",
    cost: 18,
    tier: 0,
    power: 2,
    text: "+2 attack damage.",
  },
  coat: {
    name: "Pilgrim\u2019s mail",
    slot: "armor",
    cost: 16,
    tier: 0,
    hp: 8,
    text: "+8 maximum HP.",
  },
  charm: {
    name: "Candle charm",
    slot: "trinket",
    cost: 12,
    tier: 0,
    block: 3,
    text: "+3 Block at the start of each fight.",
  },
  shadowknife: {
    name: "Retreating edge",
    slot: "weapon",
    cost: 38,
    tier: 1,
    power: 1,
    card: "backstep",
    owner: "rogue",
    text: "Rogue: +1 attack damage. Adds Backstep while equipped.",
  },
  emberstaff: {
    name: "Emberwood staff",
    slot: "weapon",
    cost: 42,
    tier: 1,
    power: 1,
    card: "ember",
    owner: "wizard",
    text: "Wizard: +1 attack damage. Adds Ember Lance while equipped.",
  },
  ironseal: {
    name: "Vanguard seal",
    slot: "trinket",
    cost: 36,
    tier: 1,
    card: "hold-fast",
    owner: "fighter",
    text: "Fighter: adds Hold Fast while equipped.",
  },
  prayerbeads: {
    name: "Mercy beads",
    slot: "trinket",
    cost: 40,
    tier: 1,
    card: "mend",
    owner: "cleric",
    text: "Cleric: adds Mending Light while equipped.",
  },
  duskplate: {
    name: "Dusk-forged plate",
    slot: "armor",
    cost: 65,
    tier: 2,
    hp: 14,
    block: 3,
    text: "+14 maximum HP. +3 Block at the start of each fight.",
  },
  kingsedge: {
    name: "The Oathbreaker",
    slot: "weapon",
    cost: 80,
    tier: 3,
    power: 5,
    text: "+5 attack damage.",
  },
  wardbell: {
    name: "The Unbroken Bell",
    slot: "artifact",
    cost: 30,
    tier: 0,
    aura: "guard",
    text: "Party: every living hero starts each fight with 3 Block.",
  },
  lantern: {
    name: "Lantern of the Lost",
    slot: "artifact",
    cost: 60,
    tier: 1,
    aura: "draw",
    text: "Party: draw one extra card on the first turn of each fight.",
  },
  reliquary: {
    name: "Saint\u2019s Reliquary",
    slot: "artifact",
    cost: 70,
    tier: 2,
    aura: "heal",
    text: "Party: surviving heroes recover 3 HP after each victory.",
  },
  coin: {
    name: "The Ferryman\u2019s Coin",
    slot: "artifact",
    cost: 55,
    tier: 1,
    aura: "gold",
    text: "Party: gain 8 extra gold after each victory.",
  },
  brigandine: {
    name: "Roadworn brigandine",
    slot: "armor",
    cost: 32,
    tier: 1,
    hp: 5,
    block: 6,
    text: "+5 maximum HP. +6 Block at the start of each fight.",
  },
  duelisttoken: {
    name: "Duelist's token",
    slot: "trinket",
    cost: 34,
    tier: 1,
    power: 1,
    hp: 3,
    text: "+1 attack damage. +3 maximum HP.",
  },
  runicblade: {
    name: "Rune-etched edge",
    slot: "weapon",
    cost: 62,
    tier: 2,
    power: 4,
    text: "+4 attack damage.",
  },
  ironheart: {
    name: "Ironheart pendant",
    slot: "trinket",
    cost: 58,
    tier: 2,
    hp: 10,
    block: 4,
    text: "+10 maximum HP. +4 Block at the start of each fight.",
  },
  dawnstandard: {
    name: "Standard of the Last Dawn",
    slot: "artifact",
    cost: 120,
    tier: 3,
    auras: ["guard", "heal"],
    text: "Party: start fights with 3 Block and recover 3 HP after victories. Matching relic effects do not stack.",
  },
  wayfinder: {
    name: "The Wayfinder's Lantern",
    slot: "artifact",
    cost: 125,
    tier: 3,
    auras: ["draw", "gold"],
    text: "Party: draw one extra opening card and gain 8 extra victory gold. Matching relic effects do not stack.",
  },
  saintsflame: {
    name: "The Saint's Last Flame",
    slot: "artifact",
    cost: 130,
    tier: 3,
    auras: ["draw", "heal"],
    text: "Party: draw one extra opening card and recover 3 HP after victories. Matching relic effects do not stack.",
  },
};

// Each discipline has a weapon, armor and trinket. They use existing combat
// effects and add real class actions; there are no unimplemented item procs.
const classKits: [ClassId, string, string, string, string, string][] = [
  [
    "fighter",
    "Watchman's sword",
    "Bastion harness",
    "Marshal's insignia",
    "iron-cut",
    "hold-fast",
  ],
  [
    "rogue",
    "Ashglass knife",
    "Nightweave coat",
    "Smoke vial",
    "backstab",
    "backstep",
  ],
  [
    "wizard",
    "Star-etched staff",
    "Astral vestments",
    "Focus crystal",
    "ember",
    "aegis",
  ],
  [
    "cleric",
    "Chapel censer",
    "Votive vestments",
    "Chalice of mercy",
    "smite",
    "mend",
  ],
  ["barbarian", "Splitstone axe", "Totem hide", "Warhorn", "hew", "endure"],
  [
    "ranger",
    "Yewlong bow",
    "Trailwarden coat",
    "Falconer's clasp",
    "arrow",
    "pinning-shot",
  ],
  [
    "necromancer",
    "Ossuary staff",
    "Gravekeeper shroud",
    "Bone talisman",
    "grave-bolt",
    "bone-ward",
  ],
  [
    "paladin",
    "Dawn-forged sword",
    "Oathkeeper plate",
    "Pilgrim's sun",
    "oath-strike",
    "lay-on-hands",
  ],
];
for (const [owner, weapon, armor, trinket, attack, support] of classKits) {
  const label = owner.charAt(0).toUpperCase() + owner.slice(1);
  const cardNames: Record<string, string> = {
    "iron-cut": "Iron Cut",
    backstab: "Backstab",
    ember: "Ember Lance",
    smite: "Smite",
    hew: "Hew",
    arrow: "Hunting Arrow",
    "grave-bolt": "Grave Bolt",
    "oath-strike": "Oath Strike",
    "hold-fast": "Hold Fast",
    backstep: "Backstep",
    aegis: "Shield",
    mend: "Mending Light",
    endure: "Endure",
    "pinning-shot": "Pinning Shot",
    "bone-ward": "Bone Ward",
    "lay-on-hands": "Lay on Hands",
  };
  const defenses: Record<ClassId, [number, number]> = {
    fighter: [8, 7],
    rogue: [6, 8],
    wizard: [12, 2],
    cleric: [8, 6],
    barbarian: [16, 1],
    ranger: [8, 6],
    necromancer: [12, 2],
    paladin: [10, 5],
  };
  const [hp, block] = defenses[owner];
  ITEMS[`${owner}-weapon`] = {
    name: weapon,
    slot: "weapon",
    cost: 44,
    tier: 1,
    owner,
    power: 2,
    card: attack,
    text: `${label}: +2 attack damage. Adds ${cardNames[attack]} while equipped.`,
  };
  ITEMS[`${owner}-armor`] = {
    name: armor,
    slot: "armor",
    cost: 58,
    tier: 2,
    owner,
    hp,
    block,
    text: `${label}: +${hp} maximum HP. +${block} Block at the start of each fight.`,
  };
  ITEMS[`${owner}-trinket`] = {
    name: trinket,
    slot: "trinket",
    cost: 54,
    tier: 2,
    owner,
    hp: 4,
    card: support,
    text: `${label}: +4 maximum HP. Adds ${cardNames[support]} while equipped.`,
  };
}
export interface OwnedItem {
  uid: number;
  id: string;
  foundRun: number | null;
}
export interface Economy {
  version: 1;
  nextItem: number;
  stash: OwnedItem[];
  pack: OwnedItem[];
  artifacts: OwnedItem[];
  merchantLevel: number;
  stock: string[];
  stockKey: string;
  lastLoot: string[];
}
export const newEconomy = (): Economy => ({
  version: 1,
  nextItem: 1,
  stash: [],
  pack: [],
  artifacts: [],
  merchantLevel: 0,
  stock: [],
  stockKey: "",
  lastLoot: [],
});
