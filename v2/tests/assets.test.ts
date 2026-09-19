import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IMAGE_ASSETS } from "../src/assets";
import { CLASSES, ENCOUNTERS, CARDS } from "../src/content";
import { ITEMS } from "../src/items";
import { CARD_ART, DISCOVERY_ART, EXPANSION_ART } from "../src/card-art";
import { ITEM_ART } from "../src/item-art";

test("every card has a distinct painting and every item has a reviewed in-bounds prop family", () => {
  for (const [catalog, atlas, rows] of [
    [
      Object.fromEntries(
        Object.entries(CARDS).filter(
          ([, c]) => !c.discovery && !EXPANSION_ART[c.id],
        ),
      ),
      CARD_ART,
      3,
    ],
    [
      Object.fromEntries(
        Object.entries(CARDS).filter(
          ([, c]) => c.discovery && !EXPANSION_ART[c.id],
        ),
      ),
      DISCOVERY_ART,
      6,
    ],
    [
      Object.fromEntries(
        Object.entries(CARDS).filter(([id]) => EXPANSION_ART[id]),
      ),
      EXPANSION_ART,
      9,
    ],
    [ITEMS, ITEM_ART, 4],
  ] as const) {
    const cells = new Set<string>();
    for (const id of Object.keys(catalog)) {
      const cell = atlas[id];
      assert.ok(cell, `Missing painting for ${id}`);
      assert.ok(cell[0] >= 0 && cell[0] < 4 && cell[1] >= 0 && cell[1] < rows);
      if (catalog !== ITEMS)
        assert.ok(!cells.has(cell.join()), `Repeated painting for ${id}`);
      cells.add(cell.join());
    }
  }
});

test("reviewed card, item, and map exports preserve their source art", () => {
  for (const [source, exported] of [
    ["cards/action-atlas.png", "cards/action-atlas.png"],
    ["cards/returning-classes-atlas.png", "cards/returning-classes-atlas.png"],
    ["cards/discovery-atlas.png", "cards/discovery-atlas.png"],
    ["items/item-atlas.png", "items/item-atlas.png"],
    ["maps/cathedral-parchment.png", "renders/cathedral-parchment.png"],
  ]) {
    const original = readFileSync(
      new URL("../assets/source/" + source, import.meta.url),
    );
    const runtime = readFileSync(
      new URL("../public/assets/exported/" + exported, import.meta.url),
    );
    assert.deepEqual(runtime, original);
    assert.equal(runtime.subarray(1, 4).toString(), "PNG");
    assert.ok(
      runtime.readUInt32BE(16) >= 800 && runtime.readUInt32BE(20) >= 1000,
    );
  }
});
test("every playable class and encounter actor has a preloaded reviewed texture", () => {
  for (const kind of Object.keys(CLASSES)) {
    assert.ok(kind in IMAGE_ASSETS);
    assert.ok(kind + "-action" in IMAGE_ASSETS);
  }
  for (const encounter of Object.values(ENCOUNTERS))
    for (const [kind] of encounter.enemies)
      assert.ok(kind in IMAGE_ASSETS, `Missing ${kind} texture`);
});
test("runtime image manifest resolves to valid PNGs and actor sprites have alpha", () => {
  for (const [key, file] of Object.entries(IMAGE_ASSETS)) {
    const b = readFileSync(
      new URL("../public/assets/exported/" + file, import.meta.url),
    );
    assert.equal(b.subarray(1, 4).toString(), "PNG", key);
    assert.ok(b.readUInt32BE(16) >= 200 && b.readUInt32BE(20) >= 200, key);
    if (file.startsWith("sprites/"))
      assert.equal(b[25], 6, `${key} must be RGBA, not a baked background`);
  }
});
test("new accepted sprites preserve their exact source export", () => {
  for (const key of [
    "fighter-action",
    "rogue-action",
    "cleric-action",
    "wizard-action",
    "bellkeeper",
  ]) {
    const source = readFileSync(
      new URL("../assets/source/" + key + ".png", import.meta.url),
    );
    const runtime = readFileSync(
      new URL(
        "../public/assets/exported/sprites/" + key + ".png",
        import.meta.url,
      ),
    );
    assert.deepEqual(runtime, source, key);
  }
});
