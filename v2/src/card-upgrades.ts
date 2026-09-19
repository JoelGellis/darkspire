import { CARDS, type CardDef } from "./content";

// A card's serialized upgrade remains 0/1. Resolve the whole definition so UI,
// legality, previews, energy and effects cannot disagree about a mastered card.
type Upgrade = { changes: string; patch: Partial<CardDef> };
export const CARD_UPGRADES: Record<string, Upgrade> = {
  "iron-cut": {
    changes: "Damage +3; usable from rank III too.",
    patch: { ranks: [1, 2, 3] },
  },
  "hold-fast": { changes: "Block +3.", patch: {} },
  sunder: {
    changes: "Damage +3; reaches rank III.",
    patch: { reach: [1, 2, 3] },
  },
  backstab: { changes: "Damage +3.", patch: {} },
  venom: {
    changes: "Poison 3 → 5; damage stays 4.",
    patch: {
      value: 4,
      poisonAmount: 5,
      text: "Deal {v} damage. Apply 5 Poison.",
    },
  },
  backstep: {
    changes: "Block +3; retreat becomes optional.",
    patch: {
      optionalMove: true,
      text: "Gain {v} Block. You may retreat one rank.",
    },
  },
  mend: { changes: "Healing +3; usable from any rank.", patch: { ranks: [] } },
  ward: { changes: "Block +3.", patch: {} },
  smite: {
    changes: "Damage +3; reaches every enemy rank.",
    patch: { reach: [1, 2, 3, 4] },
  },
  ember: { changes: "Damage +3.", patch: {} },
  nova: {
    changes: "Energy 2 → 1; damage stays 8.",
    patch: { cost: 1, value: 8 },
  },
  aegis: { changes: "Block +3.", patch: {} },
  "shield-bash": {
    changes: "Self Block 5 → 9; damage stays 7.",
    patch: { value: 7, selfBlock: 9, text: "Deal {v} damage. Gain 9 Block." },
  },
  "reaping-arc": { changes: "Damage +3.", patch: {} },
  breakthrough: {
    changes: "Damage +3; advance becomes optional.",
    patch: {
      optionalMove: true,
      text: "Deal {v} damage. You may advance one rank.",
    },
  },
  bodyguard: {
    changes: "Ally Block +3; self Block 4 → 6.",
    patch: { selfBlock: 6, text: "Give an ally {v} Block. Gain 6 Block." },
  },
  rally: {
    changes: "Energy 1 → 0; Block stays 5.",
    patch: { cost: 0, value: 5 },
  },
  headsman: {
    changes: "Damage +3; usable from rank II too.",
    patch: { ranks: [1, 2] },
  },
  quickdraw: { changes: "Damage +3.", patch: {} },
  "smoke-screen": {
    changes: "Block +3; retreat becomes optional.",
    patch: {
      optionalMove: true,
      text: "Gain {v} Block. You may retreat one rank. Draw 1 card.",
    },
  },
  nightshade: {
    changes: "Poison 6 → 9; damage stays 2.",
    patch: {
      value: 2,
      poisonAmount: 9,
      text: "Deal {v} damage. Apply 9 Poison. Exhaust.",
    },
  },
  "shadow-lunge": {
    changes: "Damage +3; advance becomes optional.",
    patch: {
      optionalMove: true,
      text: "Deal {v} damage. You may advance one rank.",
    },
  },
  feint: {
    changes: "Next-attack reduction 5 → 8; damage stays 6.",
    patch: {
      value: 6,
      weaken: 8,
      text: "Deal {v} damage. Reduce its next attack by 8.",
    },
  },
  heartseeker: {
    changes: "Damage +3; can also target rank II.",
    patch: { reach: [2, 3, 4] },
  },
  sanctuary: {
    changes: "Other allies' Block 4 → 6; self Block stays 7.",
    patch: {
      value: 7,
      partyBlock: 6,
      text: "Gain {v} Block. Give every other ally 6 Block.",
    },
  },
  absolution: {
    changes: "Healing +3; also gives the target 4 Block.",
    patch: {
      targetBlock: 4,
      text: "Restore {v} HP. Cleanse Poison. Give 4 Block. Exhaust.",
    },
  },
  censure: {
    changes: "Damage +3; usable from any rank.",
    patch: { ranks: [] },
  },
  vespers: {
    changes: "Draw 2 → 3; Block stays 5.",
    patch: {
      value: 5,
      draw: 3,
      text: "Give an ally {v} Block. Draw 3 cards. Exhaust.",
    },
  },
  "martyrs-shield": {
    changes: "Energy 2 → 1; Block stays 17.",
    patch: { value: 17, cost: 1 },
  },
  judgement: {
    changes: "Damage +3; self Block 5 → 7.",
    patch: {
      selfBlock: 7,
      text: "Deal {v} damage, ignoring Block. Gain 7 Block.",
    },
  },
  "arcane-thread": { changes: "Damage +3.", patch: {} },
  "frost-bind": {
    changes: "Next-attack reduction 6 → 9; damage stays 6.",
    patch: {
      value: 6,
      weaken: 9,
      text: "Deal {v} damage. Reduce its next attack by 9.",
    },
  },
  "forbidden-page": {
    changes: "Draw 2 → 3; Block stays 3.",
    patch: {
      value: 3,
      draw: 3,
      text: "Gain {v} Block. Draw 3 cards. Exhaust.",
    },
  },
  "prism-ward": {
    changes: "Block +3; usable from any rank.",
    patch: { ranks: [] },
  },
  starfall: {
    changes: "Energy 3 → 2; damage stays 19.",
    patch: { value: 19, cost: 2 },
  },
  "soul-siphon": {
    changes: "Self Block 6 → 10; damage stays 8.",
    patch: { value: 8, selfBlock: 10, text: "Deal {v} damage. Gain 10 Block." },
  },
};
const expansions: Record<string, Upgrade> = {
  hew: {
    changes: "Damage +3; usable from rank III too.",
    patch: { ranks: [1, 2, 3] },
  },
  endure: {
    changes: "Energy 1 to 0; Block stays 10.",
    patch: { cost: 0, value: 10 },
  },
  onslaught: {
    changes: "Damage +3; advance becomes optional.",
    patch: {
      optionalMove: true,
      text: "Deal {v} damage. You may advance one rank.",
    },
  },
  earthsplitter: {
    changes: "Damage +3; usable from rank III too.",
    patch: { ranks: [1, 2, 3] },
  },
  "war-howl": {
    changes: "Draw 2 to 3; Block stays 6.",
    patch: {
      value: 6,
      draw: 3,
      text: "Gain {v} Block. Draw 3 cards. Exhaust.",
    },
  },
  "crushing-blow": {
    changes: "Attack reduction 6 to 9; damage stays 16.",
    patch: {
      value: 16,
      weaken: 9,
      text: "Deal {v} damage. Reduce its next attack by 9.",
    },
  },
  "iron-hide": {
    changes: "Energy 2 to 1; Block stays 20.",
    patch: { cost: 1, value: 20 },
  },
  "wild-charge": {
    changes: "Damage +3; advance becomes optional.",
    patch: {
      optionalMove: true,
      text: "Deal {v} damage. You may advance one rank. Gain 3 Block.",
    },
  },
  "last-stand": {
    changes: "Other allies' Block 5 to 8; self Block stays 12.",
    patch: {
      value: 12,
      partyBlock: 8,
      text: "Gain {v} Block. Give every other ally 8 Block. Exhaust.",
    },
  },
  arrow: { changes: "Damage +3; usable from any rank.", patch: { ranks: [] } },
  camouflage: {
    changes: "Block +3; retreat becomes optional.",
    patch: {
      optionalMove: true,
      text: "Gain {v} Block. You may retreat one rank.",
    },
  },
  "pinning-shot": {
    changes: "Attack reduction 3 to 6; damage stays 6.",
    patch: {
      value: 6,
      weaken: 6,
      text: "Deal {v} damage. Reduce its next attack by 6.",
    },
  },
  volley: {
    changes: "Energy 2 to 1; damage stays 8.",
    patch: { cost: 1, value: 8 },
  },
  "serpent-arrow": {
    changes: "Poison 5 to 8; damage stays 4.",
    patch: {
      value: 4,
      poisonAmount: 8,
      text: "Deal {v} damage. Apply 8 Poison.",
    },
  },
  "hunters-focus": {
    changes: "Draw 2 to 3; Block stays 3.",
    patch: {
      value: 3,
      draw: 3,
      text: "Gain {v} Block. Draw 3 cards. Exhaust.",
    },
  },
  "piercing-arrow": {
    changes: "Damage +3; reaches every enemy rank.",
    patch: { reach: [1, 2, 3, 4] },
  },
  snare: {
    changes: "Attack reduction 8 to 12; damage stays 4.",
    patch: {
      value: 4,
      weaken: 12,
      text: "Deal {v} damage. Reduce its next attack by 12. Exhaust.",
    },
  },
  "trail-ward": {
    changes: "Block +3; draw 1 to 2.",
    patch: { draw: 2, text: "Give an ally {v} Block. Draw 2 cards." },
  },
  "grave-bolt": {
    changes: "Damage +3; usable from any rank.",
    patch: { ranks: [] },
  },
  "bone-ward": {
    changes: "Ally Block +3; self Block 3 to 5.",
    patch: { selfBlock: 5, text: "Give an ally {v} Block. Gain 5 Block." },
  },
  blight: {
    changes: "Poison 4 to 7; damage stays 3.",
    patch: {
      value: 3,
      poisonAmount: 7,
      text: "Deal {v} damage. Apply 7 Poison.",
    },
  },
  "death-wave": {
    changes: "Energy 2 to 1; damage stays 9.",
    patch: { cost: 1, value: 9 },
  },
  enfeeble: {
    changes: "Attack reduction 6 to 9; damage stays 5.",
    patch: {
      value: 5,
      weaken: 9,
      text: "Deal {v} damage. Reduce its next attack by 9.",
    },
  },
  ossuary: {
    changes: "Other allies' Block 4 to 7; self Block stays 8.",
    patch: {
      value: 8,
      partyBlock: 7,
      text: "Gain {v} Block. Give every other ally 7 Block. Exhaust.",
    },
  },
  "forbidden-rite": {
    changes: "Draw 2 to 3; Block stays 2.",
    patch: {
      value: 2,
      draw: 3,
      text: "Gain {v} Block. Draw 3 cards. Exhaust.",
    },
  },
  "soul-rend": {
    changes: "Damage +3; self Block 5 to 8.",
    patch: {
      selfBlock: 8,
      text: "Deal {v} damage, ignoring Block. Gain 8 Block.",
    },
  },
  "grave-bloom": {
    changes: "Poison 9 to 13; damage stays 6.",
    patch: {
      value: 6,
      poisonAmount: 13,
      text: "Deal {v} damage. Apply 13 Poison. Exhaust.",
    },
  },
  "oath-strike": {
    changes: "Damage +3; self Block 2 to 4.",
    patch: { selfBlock: 4, text: "Deal {v} damage. Gain 4 Block." },
  },
  "aegis-of-dawn": {
    changes: "Block +3; usable from any rank.",
    patch: { ranks: [] },
  },
  "lay-on-hands": {
    changes: "Healing +3; also grants 4 Block.",
    patch: {
      targetBlock: 4,
      text: "Restore {v} HP. Cleanse Poison. Give 4 Block. Exhaust.",
    },
  },
  consecration: {
    changes: "Energy 2 to 1; damage stays 7.",
    patch: { cost: 1, value: 7 },
  },
  "judicators-blade": {
    changes: "Damage +3; reaches every enemy rank.",
    patch: { reach: [1, 2, 3, 4] },
  },
  bastion: {
    changes: "Other allies' Block 7 to 10; self Block stays 12.",
    patch: {
      value: 12,
      partyBlock: 10,
      text: "Gain {v} Block. Give every other ally 10 Block.",
    },
  },
  "cleansing-light": {
    changes: "Healing +3; target Block 6 to 9.",
    patch: {
      targetBlock: 9,
      text: "Restore {v} HP. Cleanse Poison. Give 9 Block. Exhaust.",
    },
  },
  rebuke: {
    changes: "Attack reduction 4 to 7; damage stays 7.",
    patch: {
      value: 7,
      weaken: 7,
      text: "Deal {v} damage. Reduce its next attack by 7.",
    },
  },
  "pilgrims-vow": {
    changes: "Draw 2 to 3; Block stays 5.",
    patch: {
      value: 5,
      draw: 3,
      text: "Give an ally {v} Block. Draw 3 cards. Exhaust.",
    },
  },
};
Object.assign(CARD_UPGRADES, expansions);
export function cardDefinition(c: { id: string; upgrade: number }): CardDef {
  const base = CARDS[c.id];
  if (!base) throw Error("Unknown card");
  return c.upgrade
    ? { ...base, value: base.value + 3, ...CARD_UPGRADES[c.id]?.patch }
    : base;
}
export function upgradeDescription(id: string) {
  return CARD_UPGRADES[id]?.changes ?? "Primary value +3.";
}
