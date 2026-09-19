/** Reviewed prop atlas: four columns, four rows; final three cells unused. */
export const ITEM_ART: Record<string, readonly [number, number]> = {
  blade: [0, 0],
  coat: [1, 0],
  charm: [2, 0],
  shadowknife: [3, 0],
  emberstaff: [0, 1],
  ironseal: [1, 1],
  prayerbeads: [2, 1],
  duskplate: [3, 1],
  kingsedge: [0, 2],
  wardbell: [1, 2],
  lantern: [2, 2],
  reliquary: [3, 2],
  coin: [0, 3],
};
// Expanded gear deliberately reuses reviewed prop paintings as visual families.
// Names and mechanics differ; these are not claimed as unique commissioned art.
Object.assign(ITEM_ART, {
  brigandine: ITEM_ART.coat,
  duelisttoken: ITEM_ART.ironseal,
  runicblade: ITEM_ART.kingsedge,
  ironheart: ITEM_ART.charm,
  dawnstandard: ITEM_ART.wardbell,
  wayfinder: ITEM_ART.lantern,
  saintsflame: ITEM_ART.reliquary,
});
for (const owner of [
  "fighter",
  "rogue",
  "wizard",
  "cleric",
  "barbarian",
  "ranger",
  "necromancer",
  "paladin",
]) {
  ITEM_ART[`${owner}-weapon`] =
    owner === "wizard" || owner === "necromancer" || owner === "cleric"
      ? ITEM_ART.emberstaff
      : owner === "rogue" || owner === "ranger"
        ? ITEM_ART.shadowknife
        : ITEM_ART.kingsedge;
  ITEM_ART[`${owner}-armor`] =
    owner === "fighter" || owner === "barbarian" || owner === "paladin"
      ? ITEM_ART.duskplate
      : ITEM_ART.coat;
  ITEM_ART[`${owner}-trinket`] =
    owner === "cleric" || owner === "paladin"
      ? ITEM_ART.prayerbeads
      : ITEM_ART.ironseal;
}
export function itemArtStyle(id: string): string {
  const [column, row] = ITEM_ART[id] ?? [0, 0];
  return `background-position:${(column * 100) / 3}% ${(row * 100) / 3}%`;
}
