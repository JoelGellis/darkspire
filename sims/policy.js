// Deterministic combat AI for the simulator.
//
// Policy (per the harness brief: "play highest-value affordable card, target
// front enemy"), with a few trivial guards so it's a fair baseline rather than
// a pathological one:
//
//   - Each player turn, repeatedly pick the highest-"value" card that is both
//     playable (engine's canPlayCard) and affordable (cost <= energy), play it,
//     then recompute — until nothing useful remains or energy runs out.
//   - "Value" = card.value, with AoE cards (all_enemies / all_allies) scaled by
//     the number of targets they hit, so a 6-to-all Cleave outranks a 7 Strike
//     when 2+ enemies are up. This is the only cleverness; it does not plan ahead.
//   - Targeting: attacks hit the FRONT living enemy (lowest pos). Single-ally
//     heals/buffs go to the most-wounded living hero. Self/none/all auto-resolve.
//   - Guards (avoid obviously-wasted energy): never heal a full-HP target; never
//     cast an all-ally heal when nobody is hurt; skip resurrect (no dead-ally
//     targeting in the starter kit anyway).
//
// The bot DOES reposition (the hard position gate makes it mandatory): when a
// high-value card is locked by rank, it will spend energy moving that hero into a
// preferred position and then play it — if the card's value beats playing something
// now, net of a per-move energy penalty. It still does NOT upgrade/buy — it plays the
// raw starting deck. That keeps it a clean *relative* difficulty probe across
// encounters; it is intentionally not a skilled human. See REPORT.md caveats.

function frontEnemy(DS) {
  const alive = DS.Combat.aliveEnemies();
  if (!alive.length) return null;
  return alive.reduce((a, b) => (a.pos < b.pos ? a : b));
}

function lowestHpHero(DS) {
  const alive = DS.Combat.aliveHeroes();
  if (!alive.length) return null;
  return alive.reduce((a, b) => (a.hp < b.hp ? a : b));
}

function anyHurt(DS) {
  return DS.Combat.aliveHeroes().some((h) => h.hp < h.maxHp);
}

function scoreCard(DS, card) {
  let v = card.value || 0;
  if (card.target === 'all_enemies') v *= Math.max(1, DS.Combat.aliveEnemies().length);
  else if (card.target === 'all_allies') v *= Math.max(1, DS.Combat.aliveHeroes().length);
  return v;
}

// Returns { handIdx, target } for the best play, or null if nothing useful.
function pickBestPlay(DS) {
  const combat = DS.State.combat;
  const heroes = DS.State.run.heroes;
  const candidates = [];

  combat.hand.forEach((card, idx) => {
    const check = DS.Combat.canPlayCard(card);
    if (!check.playable) return;
    if (card.cost > combat.energy) return;

    let target = null;

    if (card.target === 'enemy' || card.target === 'enemy_any') {
      target = frontEnemy(DS);
      if (!target) return;
    } else if (card.target === 'ally') {
      if (card.type === 'heal') {
        target = lowestHpHero(DS);
        if (!target || target.hp >= target.maxHp) return; // no one to heal
      } else {
        // ally block/buff -> shore up the most-wounded ally
        target = lowestHpHero(DS) || heroes[card.heroIdx];
        if (!target) return;
      }
    } else if (card.target === 'ally_dead') {
      return; // skip revives in the baseline
    } else if (card.target === 'self') {
      if (card.type === 'heal') {
        const h = heroes[card.heroIdx];
        if (!h || h.hp >= h.maxHp) return;
      }
      target = null; // engine auto-targets self
    } else {
      // 'none', 'all_allies', 'all_enemies'
      if (card.type === 'heal' && !anyHurt(DS)) return;
      target = null; // engine auto-resolves
    }

    candidates.push({ handIdx: idx, target, cost: card.cost, score: scoreCard(DS, card) });
  });

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score || a.cost - b.cost);
  return candidates[0];
}

// ---- Repositioning (the hard position gate makes this mandatory strategy) ----

// Fewest single-rank moves to bring a card's hero into a preferred rank, plus the
// direction of the first step. Null if already in position or the card has no prefPos.
function moveToPlay(DS, card) {
  const hero = DS.State.run.heroes[card.heroIdx];
  if (!hero || hero.hp <= 0 || !card.prefPos || !card.prefPos.length) return null;
  if (card.prefPos.includes(hero.pos)) return null;
  let best = null;
  card.prefPos.forEach((p) => {
    const dist = Math.abs(p - hero.pos);
    if (best === null || dist < best.dist) {
      best = { dist, dir: p < hero.pos ? 'forward' : 'back' };
    }
  });
  return best;
}

// Does this hero already have a playable card in hand right now?
function heroHasPlayable(DS, heroIdx) {
  return DS.State.combat.hand.some((c) => {
    if (c.heroIdx !== heroIdx) return false;
    const ch = DS.Combat.canPlayCard(c);
    return ch.playable && c.cost <= DS.State.combat.energy;
  });
}

// The hero one rank toward `dir` (the one a move would swap with), or null.
function neighborToward(DS, hero, dir) {
  const target = dir === 'forward' ? hero.pos - 1 : hero.pos + 1;
  return DS.State.run.heroes.find((h) => h.hp > 0 && h.pos === target) || null;
}

// CONSERVATIVE repositioning: only un-stick a hero who has NO playable card, and never
// swap a neighbor who's currently working (that would just scramble a good formation —
// the party starts in ideal ranks). The swap-based move makes greedy repositioning a
// net loss, so we move only to rescue an otherwise-wasted hero turn.
const MOVE_PENALTY = 4;
function pickBestMovePlay(DS) {
  const combat = DS.State.combat;
  const moveCost = DS.Combat.hasRelicFlag('freeMove') ? 0 : 1;
  let best = null;
  combat.hand.forEach((card, idx) => {
    const check = DS.Combat.canPlayCard(card);
    if (check.playable || check.reason !== 'position') return; // only rank-locked cards
    if (card.cost > combat.energy) return;
    if (heroHasPlayable(DS, card.heroIdx)) return;            // hero isn't stuck — don't scramble
    const plan = moveToPlay(DS, card);
    if (!plan) return;
    if (card.cost + plan.dist * moveCost > combat.energy) return;
    // Don't drag a working neighbor out of their rank.
    const nb = neighborToward(DS, DS.State.run.heroes[card.heroIdx], plan.dir);
    if (nb && heroHasPlayable(DS, DS.State.run.heroes.indexOf(nb))) return;
    const score = scoreCard(DS, card) - MOVE_PENALTY * plan.dist;
    if (score <= 0) return;
    if (!best || score > best.score) {
      best = { handIdx: idx, dir: plan.dir, score, heroIdx: card.heroIdx };
    }
  });
  return best;
}

// Play out one full player turn: interleave repositioning with greedy card plays.
function playerTurn(DS) {
  const combat = DS.State.combat;
  let guard = 0;
  while (!combat.gameOver && guard++ < 60) {
    const direct = pickBestPlay(DS);
    const movePlay = pickBestMovePlay(DS);
    // Prefer the better of: play now, vs. move-into-rank-then-play (net of move penalty).
    if (movePlay && (!direct || movePlay.score > direct.score)) {
      const before = DS.State.run.heroes[movePlay.heroIdx].pos;
      DS.Combat.moveHeroAction(movePlay.heroIdx, movePlay.dir);
      if (DS.State.run.heroes[movePlay.heroIdx].pos === before) {
        // Move was blocked (no energy / at the edge) — fall back to a direct play or stop.
        if (direct) { DS.Combat.playCard(direct.handIdx, direct.target); continue; }
        break;
      }
      continue; // re-evaluate after the move
    }
    if (direct) { DS.Combat.playCard(direct.handIdx, direct.target); continue; }
    break;
  }
}

module.exports = { playerTurn, pickBestPlay, pickBestMovePlay, frontEnemy, lowestHpHero };
