// Headless loader for Darkspire's browser combat engine.
//
// The game is plain browser code: every file does `window.DS = window.DS || {}`
// and assumes `window`, `document`, and `setTimeout` exist. We do NOT modify any
// game file. Instead we eval the real js/ + data/ files inside a Node `vm`
// sandbox that provides just enough of a browser to make combat run:
//
//   - window           -> the sandbox global itself (so `window.DS` === global DS)
//   - document         -> stubs that return null/no-op (all DOM calls in combat.js
//                          are null-guarded, so rendering simply does nothing)
//   - setTimeout       -> no-op. The only setTimeout callbacks in the combat path
//                          are cosmetic (screen-shake cleanup) or the post-combat
//                          transition (endCombat/onCombatVictory) which we drive
//                          ourselves. Skipping them keeps `DS.State.combat` intact
//                          for us to read the result.
//   - Math.random      -> optionally reseeded for reproducible Monte-Carlo runs.
//
// After load we override DS.Combat.sleep() to resolve immediately (the engine
// awaits ~400-600ms sleeps between enemy actions for animation; at 1000+ sims
// those real delays would be fatal). This is a runtime override in OUR harness,
// not an edit to the game source.

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');

// Load order mirrors index.html, minus everything combat doesn't need.
// Default party = DS.Heroes.slice(0,4) = the 4 classes in heroes.js, and their
// starter cards all live in cards.js, so the extra hero/relic/event files are
// not required to simulate the base encounters.
const GAME_FILES = [
  'data/heroes.js',
  'data/cards.js',
  'data/enemies.js',
  'js/state.js',
  'js/combat.js',
];

// mulberry32 — tiny seedable PRNG so a given seed reproduces a whole batch.
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeDocStub() {
  const noopEl = {
    classList: { add() {}, remove() {} },
    style: {},
    appendChild() {}, removeChild() {}, remove() {}, prepend() {},
    set textContent(_v) {}, get textContent() { return ''; },
    children: [], offsetHeight: 0,
  };
  return {
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return Object.assign({}, noopEl); },
    body: noopEl,
  };
}

// Build a fresh, fully-loaded DS namespace. seed is optional (number).
function loadGame(seed) {
  const sandbox = {};
  sandbox.window = sandbox;          // window.DS -> global DS
  sandbox.document = makeDocStub();
  sandbox.setTimeout = function () { return 0; };
  sandbox.clearTimeout = function () {};
  sandbox.console = console;

  // Reproducible randomness: a Math object that delegates everything to the real
  // Math but swaps in a seeded random(). The vm uses this as its global Math.
  if (seed !== undefined && seed !== null) {
    const m = Object.create(Math);
    m.random = makeRng(seed);
    sandbox.Math = m;
  }

  vm.createContext(sandbox);

  for (const rel of GAME_FILES) {
    const code = fs.readFileSync(path.join(REPO, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }

  const DS = sandbox.DS;

  // Stubs the engine calls but that live in files we didn't load.
  DS.UI = DS.UI || {};
  DS.UI.render = function () {};
  DS.UI.rebindCardEffect = function () {};
  DS.Game = DS.Game || {};
  DS.Game.onCombatVictory = function () {};
  DS.Game.onCombatDefeat = function () {};
  DS.Game._applyCombatBuffs = function () {};

  // Kill the animation sleeps — return an already-resolved promise.
  DS.Combat.sleep = function () { return Promise.resolve(); };

  return { DS, sandbox };
}

module.exports = { loadGame, makeRng };
