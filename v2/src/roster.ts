import { CLASSES, type ClassId } from "./content";
import { hero, maxHp, record, type State, type Unit } from "./engine";

export interface Roster {
  reserves: Unit[];
  recruits: number;
}
export const newRoster = (): Roster => ({ reserves: [], recruits: 0 });
export const allHeroes = (s: State) => [
  ...s.party,
  ...(s.roster?.reserves ?? []),
];
export const recruitCost = (s: State) =>
  allHeroes(s).filter((u) => u.hp > 0).length < 4 ? 0 : 35;
export const recruitOffers = (s: State) =>
  (Object.keys(CLASSES) as ClassId[]).filter(
    (kind) => !allHeroes(s).some((u) => u.kind === kind),
  );
export function migrateRoster(s: State) {
  if (s.roster === undefined) s.roster = newRoster();
}
export function validateRoster(s: State, validUnit: (u: Unit) => boolean) {
  const r = s.roster;
  if (
    !r ||
    !Array.isArray(r.reserves) ||
    !Number.isSafeInteger(r.recruits) ||
    r.recruits < 0 ||
    r.reserves.length > Object.keys(CLASSES).length
  )
    throw Error("Invalid stagecoach roster.");
  if (
    r.reserves.some(
      (u) =>
        !validUnit(u) ||
        !Object.hasOwn(CLASSES, u.kind) ||
        u.id !== u.kind ||
        u.hp <= 0 ||
        u.gear !== null ||
        !Array.isArray(u.equipment) ||
        u.equipment.length,
    )
  )
    throw Error("Invalid reserve hero.");
  const owned = allHeroes(s);
  if (
    owned.length > Object.keys(CLASSES).length ||
    new Set(owned.map((u) => u.kind)).size !== owned.length ||
    new Set(owned.map((u) => u.id)).size !== owned.length
  )
    throw Error("A class may have only one active or reserve hero.");
}
function camp(s: State) {
  if (s.screen !== "camp")
    throw Error("Manage the roster at camp between expeditions.");
}
function ranks(s: State) {
  s.party
    .sort((a, b) => a.rank - b.rank)
    .forEach((u, i) => {
      u.rank = i + 1;
    });
}
function storeEquipment(s: State, u: Unit) {
  // Camp storage is safe; leaving the active party never destroys paid equipment.
  if (u.gear !== null)
    throw Error(
      "Move legacy equipment into the item stash before changing this hero's assignment.",
    );
  s.economy.stash.push(...(u.equipment ?? []));
  u.equipment = [];
  u.maxHp = maxHp(u);
  u.hp = Math.min(u.hp, u.maxHp);
}
export function recruitHero(s: State, kind: ClassId) {
  camp(s);
  if (!recruitOffers(s).includes(kind))
    throw Error("This class is already in your roster or is unavailable.");
  const cost = recruitCost(s);
  if (s.bank < cost) throw Error(`Recruitment costs ${cost} banked gold.`);
  const u = hero(kind, Math.min(4, s.party.length + 1));
  u.equipment = [];
  s.bank -= cost;
  s.roster.recruits++;
  if (s.party.length < 4) s.party.push(u);
  else s.roster.reserves.push(u);
  record(s, "recruit", {
    kind,
    cost,
    assignment: s.party.includes(u) ? "party" : "reserve",
  });
}
export function benchHero(s: State, id: string) {
  camp(s);
  const u = s.party.find((u) => u.id === id);
  if (!u || u.hp <= 0) throw Error("Choose a living active hero.");
  storeEquipment(s, u);
  s.party = s.party.filter((hero) => hero !== u);
  s.roster.reserves.push(u);
  ranks(s);
  record(s, "reserve", { id });
}
export function activateHero(s: State, id: string) {
  camp(s);
  if (s.party.length >= 4)
    throw Error("Reserve an active hero to make room first.");
  const u = s.roster.reserves.find((u) => u.id === id);
  if (!u || u.hp <= 0) throw Error("Choose a living reserve hero.");
  s.roster.reserves = s.roster.reserves.filter((hero) => hero !== u);
  u.rank = s.party.length + 1;
  s.party.push(u);
  record(s, "activate", { id });
}
