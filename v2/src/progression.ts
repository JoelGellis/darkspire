import {
  CLASSES,
  PATH_BONUSES,
  type CardDef,
  type ClassId,
  type Effect,
} from "./content";
import type { State, Unit } from "./engine";
import { allHeroes } from "./roster";

export type TrainedUnit = Unit & { skills?: string[] };
type Match = {
  effects?: Effect[];
  ids?: string[];
  ranks?: number[];
  exhaust?: boolean;
  minimumCost?: number;
};
type Benefits = {
  value?: number;
  poisonAmount?: number;
  selfBlock?: number;
  targetBlock?: number;
  partyBlock?: number;
  draw?: number;
  weaken?: number;
  pierce?: boolean;
  cleanse?: boolean;
};
type Rule = { when: Match; add: Benefits };
type Gift = { rules?: Rule[]; openingBlock?: number; turnBlock?: number };
export interface Skill extends Gift {
  id: string;
  owner: ClassId;
  path: number;
  name: string;
  description: string;
  cost: number;
  level: number;
  requires: string[];
  requiresAny?: string[];
  excludes?: string;
}
type Entry = [name: string, description: string, gift: Gift];
const attack: Effect[] = ["strike", "spell", "cleave", "poison"];
const protection: Effect[] = ["block", "step"];
const r = (when: Match, add: Benefits): Gift => ({ rules: [{ when, add }] });
const SKILL_LIST: Skill[] = [];
function path(
  owner: ClassId,
  index: number,
  foundation: Entry,
  left: Entry,
  right: Entry,
  mastery: Entry,
) {
  const prefix = `${owner}-${index}`;
  [foundation, left, right, mastery].forEach(([name, description, gift], n) => {
    SKILL_LIST.push({
      id: `${prefix}-${n}`,
      owner,
      path: index,
      name,
      description,
      ...gift,
      cost: n === 0 ? 1 : 2,
      level: n === 0 ? 2 : n === 3 ? 6 : 4,
      requires: n ? [`${prefix}-0`] : [],
      ...(n === 1 || n === 2 ? { excludes: `${prefix}-${3 - n}` } : {}),
      ...(n === 3 ? { requiresAny: [`${prefix}-1`, `${prefix}-2`] } : {}),
    });
  });
}

path(
  "fighter",
  0,
  [
    "Shield Drill",
    "Block cards grant +2 Block.",
    r({ effects: protection }, { value: 2 }),
  ],
  [
    "Driving Steel",
    "Attacks from rank I grant the Fighter 3 Block.",
    r({ effects: attack, ranks: [1] }, { selfBlock: 3 }),
  ],
  [
    "Prepared Line",
    "Start every battle with 7 additional Block.",
    { openingBlock: 7 },
  ],
  [
    "Unbroken Formation",
    "Block cards also give every other living ally 2 Block.",
    r({ effects: protection }, { partyBlock: 2 }),
  ],
);
path(
  "fighter",
  1,
  [
    "Heavy Hand",
    "Attacks costing 2 or more deal +3 damage.",
    r({ effects: attack, minimumCost: 2 }, { value: 3 }),
  ],
  [
    "Hew",
    "Cleave attacks deal +3 damage to every enemy.",
    r({ effects: ["cleave"] }, { value: 3 }),
  ],
  [
    "Condemn",
    "Single-target strikes reduce the target's committed attack by 3.",
    r({ effects: ["strike"] }, { weaken: 3 }),
  ],
  [
    "Final Sentence",
    "Attacks costing 2 or more ignore enemy Block.",
    r({ effects: attack, minimumCost: 2 }, { pierce: true }),
  ],
);
path(
  "fighter",
  2,
  [
    "Watchman's Oath",
    "Gain 2 additional Block at battle start and each player turn.",
    { openingBlock: 2, turnBlock: 2 },
  ],
  [
    "Shelter",
    "Bodyguard and Hold Fast give every other living ally 2 Block.",
    r({ ids: ["bodyguard", "hold-fast"] }, { partyBlock: 2 }),
  ],
  [
    "Shield Wall",
    "Block cards grant +4 Block.",
    r({ effects: ["block"] }, { value: 4 }),
  ],
  [
    "Rally the Guard",
    "Exhausting Block cards draw 1 additional card.",
    r({ effects: ["block"], exhaust: true }, { draw: 1 }),
  ],
);
path(
  "rogue",
  0,
  [
    "Close Work",
    "Attacks from ranks I or II deal +2 damage.",
    r({ effects: attack, ranks: [1, 2] }, { value: 2 }),
  ],
  [
    "Patient Hunter",
    "Attacks from ranks III or IV deal +3 damage.",
    r({ effects: attack, ranks: [3, 4] }, { value: 3 }),
  ],
  [
    "Silent Entry",
    "Backstab and Shadow Lunge reduce the target's committed attack by 3.",
    r({ ids: ["backstab", "shadow-lunge"] }, { weaken: 3 }),
  ],
  [
    "Unseen Blade",
    "Backstab and Shadow Lunge ignore enemy Block.",
    r({ ids: ["backstab", "shadow-lunge"] }, { pierce: true }),
  ],
);
path(
  "rogue",
  1,
  [
    "Toxicology",
    "Poison cards apply 2 additional Poison.",
    r({ effects: ["poison"] }, { poisonAmount: 2 }),
  ],
  [
    "Numbing Venom",
    "Poison cards reduce the target's committed attack by 3.",
    r({ effects: ["poison"] }, { weaken: 3 }),
  ],
  [
    "Sealed Vials",
    "Poison cards also grant the Rogue 4 Block.",
    r({ effects: ["poison"] }, { selfBlock: 4 }),
  ],
  [
    "Black Distillation",
    "Exhausting Poison cards apply 4 additional Poison.",
    r({ effects: ["poison"], exhaust: true }, { poisonAmount: 4 }),
  ],
);
path(
  "rogue",
  2,
  [
    "Light Footwork",
    "Retreat cards grant +3 Block.",
    r({ effects: ["step"] }, { value: 3 }),
  ],
  [
    "Riposte",
    "Strikes from ranks I or II grant the Rogue 3 Block.",
    r({ effects: ["strike"], ranks: [1, 2] }, { selfBlock: 3 }),
  ],
  [
    "Covering Smoke",
    "Retreat cards give every other living ally 2 Block.",
    r({ effects: ["step"] }, { partyBlock: 2 }),
  ],
  [
    "Disarming Cut",
    "Feint and Backstab reduce the target's committed attack by 4.",
    r({ ids: ["feint", "backstab"] }, { weaken: 4 }),
  ],
);
path(
  "cleric",
  0,
  [
    "Gentle Hands",
    "Healing cards restore +2 HP.",
    r({ effects: ["heal"] }, { value: 2 }),
  ],
  [
    "Afterglow",
    "Healing cards also give their target 5 Block.",
    r({ effects: ["heal"] }, { targetBlock: 5 }),
  ],
  [
    "Pure Light",
    "Healing cards cleanse the target's Poison.",
    r({ effects: ["heal"] }, { cleanse: true }),
  ],
  [
    "Beacon",
    "Healing cards also give every other living ally 3 Block.",
    r({ effects: ["heal"] }, { partyBlock: 3 }),
  ],
);
path(
  "cleric",
  1,
  [
    "Zeal",
    "Spell attacks deal +2 damage.",
    r({ effects: ["spell"] }, { value: 2 }),
  ],
  [
    "Rebuke",
    "Spell attacks reduce the target's committed attack by 2.",
    r({ effects: ["spell"] }, { weaken: 2 }),
  ],
  [
    "Conviction",
    "Spell attacks grant the Cleric 4 Block.",
    r({ effects: ["spell"] }, { selfBlock: 4 }),
  ],
  [
    "Searing Verdict",
    "Spell attacks ignore enemy Block.",
    r({ effects: ["spell"] }, { pierce: true }),
  ],
);
path(
  "cleric",
  2,
  [
    "Forewarning",
    "Block cards grant +2 Block.",
    r({ effects: ["block"] }, { value: 2 }),
  ],
  [
    "Cleansing Ward",
    "Block cards cleanse the target's Poison.",
    r({ effects: ["block"] }, { cleanse: true }),
  ],
  [
    "Shared Vision",
    "Block cards give every other living ally 1 Block.",
    r({ effects: ["block"] }, { partyBlock: 1 }),
  ],
  [
    "Revelation",
    "Exhausting Block cards draw 1 additional card.",
    r({ effects: ["block"], exhaust: true }, { draw: 1 }),
  ],
);
path(
  "wizard",
  0,
  [
    "Kindling",
    "Ember Lance and Cinderstorm deal +2 damage.",
    r({ ids: ["ember", "nova"] }, { value: 2 }),
  ],
  [
    "Wildfire",
    "Cleave attacks deal +3 damage to every enemy.",
    r({ effects: ["cleave"] }, { value: 3 }),
  ],
  [
    "Cinder Mantle",
    "Attacks grant the Wizard 2 Block.",
    r({ effects: attack }, { selfBlock: 2 }),
  ],
  [
    "White Flame",
    "Ember Lance and Cinderstorm ignore enemy Block.",
    r({ ids: ["ember", "nova"] }, { pierce: true }),
  ],
);
path(
  "wizard",
  1,
  [
    "Runic Geometry",
    "Block cards grant +3 Block.",
    r({ effects: ["block"] }, { value: 3 }),
  ],
  [
    "Warding Script",
    "Arcane Thread and Soul Siphon give every other living ally 2 Block.",
    r({ ids: ["arcane-thread", "soul-siphon"] }, { partyBlock: 2 }),
  ],
  [
    "Stored Aegis",
    "Start every battle with 8 additional Block.",
    { openingBlock: 8 },
  ],
  [
    "Living Grimoire",
    "Exhausting Block cards draw 1 additional card.",
    r({ effects: ["block"], exhaust: true }, { draw: 1 }),
  ],
);
path(
  "wizard",
  2,
  [
    "Slow the Hour",
    "Single-target spells reduce the target's committed attack by 1.",
    r({ effects: ["spell"] }, { weaken: 1 }),
  ],
  [
    "Frozen Moment",
    "Frost Bind reduces the target's committed attack by 4 more.",
    r({ ids: ["frost-bind"] }, { weaken: 4 }),
  ],
  [
    "Borrowed Shelter",
    "Block cards give every other living ally 2 Block.",
    r({ effects: ["block"] }, { partyBlock: 2 }),
  ],
  [
    "Time to Read",
    "Exhausting cards draw 1 additional card.",
    r({ exhaust: true }, { draw: 1 }),
  ],
);

path(
  "barbarian",
  0,
  [
    "Brutal Rhythm",
    "Strikes from rank I deal +2 damage.",
    r({ effects: ["strike"], ranks: [1] }, { value: 2 }),
  ],
  [
    "Blood Thunder",
    "Cleave attacks deal +3 damage to every enemy.",
    r({ effects: ["cleave"] }, { value: 3 }),
  ],
  [
    "Raging Guard",
    "Attacks costing 2 or more grant 4 Block.",
    r({ effects: attack, minimumCost: 2 }, { selfBlock: 4 }),
  ],
  [
    "Ruinous Charge",
    "Onslaught and Crushing Blow ignore enemy Block.",
    r({ ids: ["onslaught", "crushing-blow"] }, { pierce: true }),
  ],
);
path(
  "barbarian",
  1,
  [
    "Break Their Nerve",
    "Strikes reduce the target's committed attack by 1.",
    r({ effects: ["strike"] }, { weaken: 1 }),
  ],
  [
    "Shattering Impact",
    "Crushing Blow reduces the target's committed attack by 4 more.",
    r({ ids: ["crushing-blow"] }, { weaken: 4 }),
  ],
  [
    "Relentless",
    "Onslaught and Wild Charge deal +3 damage.",
    r({ ids: ["onslaught", "wild-charge"] }, { value: 3 }),
  ],
  [
    "Spoils of War",
    "Exhausting Block cards draw 1 additional card.",
    r({ effects: ["block"], exhaust: true }, { draw: 1 }),
  ],
);
path(
  "barbarian",
  2,
  [
    "Ancestral Hide",
    "Gain 2 additional Block at battle start and each player turn.",
    { openingBlock: 2, turnBlock: 2 },
  ],
  [
    "Stone Totem",
    "Block cards grant +4 Block.",
    r({ effects: ["block"] }, { value: 4 }),
  ],
  [
    "Sheltering Totem",
    "Block cards give every other living ally 2 Block.",
    r({ effects: ["block"] }, { partyBlock: 2 }),
  ],
  [
    "Ancestor's Cry",
    "Exhausting Block cards give every other living ally 3 additional Block.",
    r({ effects: ["block"], exhaust: true }, { partyBlock: 3 }),
  ],
);
path(
  "ranger",
  0,
  [
    "Steady Aim",
    "Attacks from rank IV deal +2 damage.",
    r({ effects: attack, ranks: [4] }, { value: 2 }),
  ],
  [
    "Broadheads",
    "Hunting Arrow deals +4 damage.",
    r({ ids: ["arrow"] }, { value: 4 }),
  ],
  [
    "Overwatch",
    "Pinning Shot reduces the target's committed attack by 4 more.",
    r({ ids: ["pinning-shot"] }, { weaken: 4 }),
  ],
  [
    "Perfect Flight",
    "Single-target strikes ignore enemy Block.",
    r({ effects: ["strike"] }, { pierce: true }),
  ],
);
path(
  "ranger",
  1,
  [
    "Prepared Ambush",
    "Poison cards apply 2 additional Poison.",
    r({ effects: ["poison"] }, { poisonAmount: 2 }),
  ],
  [
    "Barbed Snare",
    "Snare and Pinning Shot deal +3 damage.",
    r({ ids: ["snare", "pinning-shot"] }, { value: 3 }),
  ],
  [
    "Safe Distance",
    "Poison cards grant 4 Block.",
    r({ effects: ["poison"] }, { selfBlock: 4 }),
  ],
  [
    "Know the Ground",
    "Exhausting cards draw 1 additional card.",
    r({ exhaust: true }, { draw: 1 }),
  ],
);
path(
  "ranger",
  2,
  [
    "Brush Shelter",
    "Block and retreat cards grant +2 Block.",
    r({ effects: protection }, { value: 2 }),
  ],
  [
    "Shared Cover",
    "Camouflage and Trail Ward give every other living ally 2 Block.",
    r({ ids: ["camouflage", "trail-ward"] }, { partyBlock: 2 }),
  ],
  [
    "Herbal Ward",
    "Block cards cleanse the target's Poison.",
    r({ effects: ["block"] }, { cleanse: true }),
  ],
  [
    "Briar Arrows",
    "Single-target strikes reduce the target's committed attack by 3.",
    r({ effects: ["strike"] }, { weaken: 3 }),
  ],
);
path(
  "necromancer",
  0,
  [
    "Grave Hunger",
    "Single-target spells deal +2 damage.",
    r({ effects: ["spell"] }, { value: 2 }),
  ],
  [
    "Soul Armor",
    "Single-target spells grant 3 Block.",
    r({ effects: ["spell"] }, { selfBlock: 3 }),
  ],
  [
    "Harvest",
    "Death Wave deals +4 damage to every enemy.",
    r({ ids: ["death-wave"] }, { value: 4 }),
  ],
  [
    "Beyond the Veil",
    "Single-target spells ignore enemy Block.",
    r({ effects: ["spell"] }, { pierce: true }),
  ],
);
path(
  "necromancer",
  1,
  [
    "Plague Study",
    "Poison cards apply 2 additional Poison.",
    r({ effects: ["poison"] }, { poisonAmount: 2 }),
  ],
  [
    "Withering",
    "Poison cards reduce the target's committed attack by 3.",
    r({ effects: ["poison"] }, { weaken: 3 }),
  ],
  [
    "Ash Shroud",
    "Poison cards grant 4 Block.",
    r({ effects: ["poison"] }, { selfBlock: 4 }),
  ],
  [
    "Last Bloom",
    "Exhausting Poison cards apply 4 additional Poison.",
    r({ effects: ["poison"], exhaust: true }, { poisonAmount: 4 }),
  ],
);
path(
  "necromancer",
  2,
  [
    "Carved Runes",
    "Block cards grant +2 Block.",
    r({ effects: ["block"] }, { value: 2 }),
  ],
  [
    "Bone Lattice",
    "Block cards give every other living ally 2 Block.",
    r({ effects: ["block"] }, { partyBlock: 2 }),
  ],
  [
    "Grave Sentinel",
    "Start every battle with 8 additional Block.",
    { openingBlock: 8 },
  ],
  [
    "Whispered Counsel",
    "Exhausting Block cards draw 1 additional card.",
    r({ effects: ["block"], exhaust: true }, { draw: 1 }),
  ],
);
path(
  "paladin",
  0,
  [
    "Righteous Edge",
    "Single-target strikes deal +2 damage.",
    r({ effects: ["strike"] }, { value: 2 }),
  ],
  [
    "Holy Retaliation",
    "Oath Strike reduces the target's committed attack by 3.",
    r({ ids: ["oath-strike"] }, { weaken: 3 }),
  ],
  [
    "Sacred Flame",
    "Consecration deals +4 damage to every enemy.",
    r({ ids: ["consecration"] }, { value: 4 }),
  ],
  [
    "Stand Together",
    "Single-target strikes give every other living ally 2 Block.",
    r({ effects: ["strike"] }, { partyBlock: 2 }),
  ],
);
path(
  "paladin",
  1,
  [
    "Merciful Hands",
    "Healing cards restore +2 HP.",
    r({ effects: ["heal"] }, { value: 2 }),
  ],
  [
    "Sheltering Light",
    "Healing cards give their target 5 additional Block.",
    r({ effects: ["heal"] }, { targetBlock: 5 }),
  ],
  [
    "Guiding Light",
    "Healing cards draw 1 additional card.",
    r({ effects: ["heal"] }, { draw: 1 }),
  ],
  [
    "Dawn Chorus",
    "Healing cards give every other living ally 3 Block.",
    r({ effects: ["heal"] }, { partyBlock: 3 }),
  ],
);
path(
  "paladin",
  2,
  [
    "Vigil",
    "Gain 2 additional Block at battle start and each player turn.",
    { openingBlock: 2, turnBlock: 2 },
  ],
  [
    "Oath of Shelter",
    "Block cards grant +3 Block.",
    r({ effects: ["block"] }, { value: 3 }),
  ],
  [
    "Oath of Purity",
    "Block cards cleanse the target's Poison.",
    r({ effects: ["block"] }, { cleanse: true }),
  ],
  [
    "The Unbroken Oath",
    "Block cards give every other living ally 2 Block.",
    r({ effects: ["block"] }, { partyBlock: 2 }),
  ],
);

export const SKILLS: Readonly<Record<string, Skill>> = Object.fromEntries(
  SKILL_LIST.map((skill) => [skill.id, skill]),
);
export const skillsForPath = (owner: string, index: number) =>
  SKILL_LIST.filter((skill) => skill.owner === owner && skill.path === index);
export const earnedPoints = (u: TrainedUnit) =>
  Math.max(0, Math.min(5, u.level - 1));
export const spentPoints = (u: TrainedUnit) =>
  (u.skills ?? []).reduce((n, id) => n + (SKILLS[id]?.cost ?? 0), 0);
export const availablePoints = (u: TrainedUnit) =>
  earnedPoints(u) - spentPoints(u);
export const pathDescription = (owner: string, index: number) =>
  `${PATH_BONUSES[index]}. ${skillsForPath(owner, index)[0]?.description ?? ""}`;

export function trainingReason(s: State, u: TrainedUnit, skill: Skill): string {
  if (s.screen !== "camp")
    return "Train at the Adventurers' Guild between expeditions.";
  if (u.hp <= 0) return "Fallen heroes cannot train.";
  if (u.kind !== skill.owner || u.path !== skill.path)
    return u.path === null ? "Choose this subclass first." : "Another subclass is already chosen.";
  const owned = u.skills ?? [];
  if (owned.includes(skill.id)) return "Learned";
  if (u.level < skill.level) return `Requires level ${skill.level}.`;
  if (skill.requires.some((id) => !owned.includes(id)))
    return `Requires ${SKILLS[skill.requires[0]].name}.`;
  if (skill.excludes && owned.includes(skill.excludes))
    return `You chose ${SKILLS[skill.excludes].name}.`;
  if (skill.requiresAny && !skill.requiresAny.some((id) => owned.includes(id)))
    return "Choose a specialty first.";
  if (availablePoints(u) < skill.cost)
    return `Requires ${skill.cost} unspent skill points.`;
  return "";
}
export function trainSkill(s: State, heroId: string, skillId: string) {
  const u = allHeroes(s).find((u) => u.id === heroId) as
    TrainedUnit | undefined;
  const skill = SKILLS[skillId];
  if (!u || !skill) throw Error("Unknown hero or skill.");
  const reason = trainingReason(s, u, skill);
  if (reason) throw Error(reason);
  u.skills = [...(u.skills ?? []), skillId];
  s.journal.push({
    seq: s.journal.length + 1,
    action: "train-skill",
    details: { heroId, skillId, cost: skill.cost },
  });
}
export function migrate(s: State) {
  for (const u of [...allHeroes(s), ...s.graveyard] as TrainedUnit[])
    if (u.skills === undefined) u.skills = [];
}
export function validate(s: State) {
  for (const u of [...allHeroes(s), ...s.graveyard] as TrainedUnit[]) {
    const owned = u.skills;
    if (
      !Array.isArray(owned) ||
      owned.some((id) => typeof id !== "string") ||
      new Set(owned).size !== owned.length
    )
      throw Error("Invalid hero skill list.");
    if (
      owned.some((id) => {
        const skill = Object.hasOwn(SKILLS, id) ? SKILLS[id] : undefined;
        return (
          !skill ||
          skill.owner !== u.kind ||
          skill.path !== u.path ||
          skill.level > u.level ||
          skill.requires.some((req) => !owned.includes(req)) ||
          (skill.requiresAny &&
            !skill.requiresAny.some((req) => owned.includes(req))) ||
          (skill.excludes && owned.includes(skill.excludes))
        );
      }) ||
      spentPoints(u) > earnedPoints(u)
    )
      throw Error("Invalid hero skill progression.");
  }
}
const trained = (u: TrainedUnit) =>
  (u.skills ?? [])
    .map((id) => SKILLS[id])
    .filter((x): x is Skill => !!x && x.owner === u.kind && x.path === u.path);
export const openingBlock = (u: TrainedUnit) =>
  trained(u).reduce((n, skill) => n + (skill.openingBlock ?? 0), 0);
export const turnBlock = (u: TrainedUnit) =>
  trained(u).reduce((n, skill) => n + (skill.turnBlock ?? 0), 0);
function matches(u: Unit, d: CardDef, when: Match) {
  return (
    (!when.effects || when.effects.includes(d.effect)) &&
    (!when.ids || when.ids.includes(d.id)) &&
    (!when.ranks || when.ranks.includes(u.rank)) &&
    (when.exhaust === undefined || d.exhaust === when.exhaust) &&
    (when.minimumCost === undefined || d.cost >= when.minimumCost)
  );
}
// Rebuild printed text only for modified cards, using exactly the resolved effects.
function cardText(d: CardDef) {
  const first =
    d.effect === "heal"
      ? "Restore {v} HP to an ally."
      : protection.includes(d.effect)
        ? d.target === "ally"
          ? "Give an ally {v} Block."
          : "Gain {v} Block."
        : d.effect === "cleave"
          ? "Deal {v} damage to every enemy."
          : "Deal {v} damage.";
  return [
    first,
    d.pierce ? "Ignore enemy Block." : "",
    d.effect === "poison" ? `Apply ${d.poisonAmount ?? 3} Poison.` : "",
    d.effect === "step"
      ? `${d.optionalMove ? "You may retreat" : "Retreat"} one rank.`
      : "",
    d.move ? `${d.optionalMove ? "You may advance" : "Advance"} one rank.` : "",
    d.selfBlock ? `Gain ${d.selfBlock} Block.` : "",
    d.targetBlock ? `Target gains ${d.targetBlock} Block.` : "",
    d.partyBlock ? `Give every other ally ${d.partyBlock} Block.` : "",
    d.draw ? `Draw ${d.draw}.` : "",
    d.weaken ? `Reduce its next attack by ${d.weaken}.` : "",
    d.cleanse ? "Cleanse target's Poison." : "",
    d.exhaust ? "Exhaust." : "",
  ]
    .filter(Boolean)
    .join(" ");
}
export function enhanceCard(u: TrainedUnit, definition: CardDef): CardDef {
  if (u.kind !== definition.owner) return definition;
  const rules = trained(u)
    .flatMap((skill) => skill.rules ?? [])
    .filter((rule) => matches(u, definition, rule.when));
  if (!rules.length) return definition;
  const d = { ...definition };
  for (const { add } of rules) {
    for (const key of [
      "value",
      "poisonAmount",
      "selfBlock",
      "targetBlock",
      "partyBlock",
      "draw",
      "weaken",
    ] as const) {
      if (add[key])
        d[key] =
          (d[key] ??
            (key === "poisonAmount" && d.effect === "poison" ? 3 : 0)) +
          add[key]!;
    }
    if (add.pierce) d.pierce = true;
    if (add.cleanse) d.cleanse = true;
  }
  d.text = cardText(d);
  return d;
}
