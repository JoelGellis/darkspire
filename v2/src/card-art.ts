import { EXTRA_CARDS } from "./class-expansion";
import { DISCOVERIES } from "./content";
/** Row-major cells of the reviewed twelve-painting atlas. */
export const CARD_ART: Record<string, readonly [number, number]> = {
  "iron-cut": [0, 0],
  "hold-fast": [1, 0],
  sunder: [2, 0],
  backstab: [3, 0],
  venom: [0, 1],
  backstep: [1, 1],
  mend: [2, 1],
  ward: [3, 1],
  smite: [0, 2],
  ember: [1, 2],
  nova: [2, 2],
  aegis: [3, 2],
};
export const DISCOVERY_ART = Object.fromEntries(
  DISCOVERIES.filter((id) => !EXTRA_CARDS.some((c) => c.id === id)).map(
    (id, i) => [id, [i % 4, Math.floor(i / 4)] as const],
  ),
);
export const EXPANSION_ART = Object.fromEntries(
  EXTRA_CARDS.map((c, i) => [c.id, [Math.floor(i / 9), i % 9] as const]),
);
export function cardArtStyle(id: string): string {
  if (EXPANSION_ART[id]) {
    const [column, row] = EXPANSION_ART[id];
    // Reviewed actual cell boundaries; generation is painterly, not a uniform grid.
    const edges = [0, 174, 346, 520, 723, 925, 1163, 1370, 1584, 1881];
    const h = edges[row + 1] - edges[row];
    return `background-image:url('assets/exported/cards/returning-classes-atlas.png');background-size:400% ${188100 / h}%;background-position:${(column * 100) / 3}% ${(edges[row] * 100) / (1881 - h)}%`;
  }
  if (DISCOVERY_ART[id]) {
    const [column, row] = DISCOVERY_ART[id];
    // Reviewed row boundaries in the generated 1024x1536 painting.
    const edges = [0, 227, 443, 664, 902, 1168, 1536];
    const height = edges[row + 1] - edges[row];
    return `background-image:url('assets/exported/cards/discovery-atlas.png');background-size:400% ${153600 / height}%;background-position:${(column * 100) / 3}% ${(edges[row] * 100) / (1536 - height)}%`;
  }
  const [column, row] = CARD_ART[id] ?? [0, 0];
  return `background-position:${(column * 100) / 3}% ${row * 50}%`;
}
