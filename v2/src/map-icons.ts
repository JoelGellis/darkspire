/** Small ink emblems authored as vectors to remain sharp at every stage scale. */
const emblems: Record<string, string> = {
  sentries:
    '<path d="m10 6 16 16m-4-12L6 26m0-20 1 7 6-6-7-1Zm20 0-7 1 6 6 1-7ZM7 21l4 4m10-4 4 4M5 27l3-3m16 0 3 3"/>',
  beasts:
    '<path d="m8 5 4 5 8 0 4-5 3 12-5 9H10l-5-9 3-12Zm3 10 2 2m8-2-2 2m-6 4 3 2 3-2m-3 2v3"/>',
  rest: '<path d="M16 3c3 7-2 9 3 12 2-2 3-4 3-6 7 9 3 15-6 15S3 17 11 10c-1 5 2 5 2 5s4-5 3-12ZM6 28l20-3M6 25l20 3"/>',
  shrine:
    '<path d="m16 3 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7ZM8 27h16M11 23h10M4 5v5m-2-2h5m20 11v5m-2-2h5"/>',
  elite:
    '<path d="M7 13 5 6l7 4 4-6 4 6 7-4-2 7H7Zm1 3h16v6l-8 7-8-7v-6Zm4 4 2 1m6-1-2 1m-4 4h4"/>',
  shop: '<path d="M6 13h20l-2 15H8L6 13Zm-2 0 3-8h18l3 8M11 5l-1 8m6-8v8m5-8 1 8M13 28v-9h6v9"/>',
  boss: '<path d="M8 23h16l-3-5v-7a5 5 0 0 0-10 0v7l-3 5Zm6 3c0 4 4 4 4 0M16 3V1M5 8l-3-2m25 2 3-2M4 16H1m27 0h3"/>',
  visited: '<path d="m7 16 6 6L26 8"/>',
};
export function mapIcon(node: string) {
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${emblems[node] ?? emblems.sentries}</svg>`;
}
