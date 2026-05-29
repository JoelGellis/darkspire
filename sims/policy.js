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
// The bot does NOT reposition (no move actions) and does NOT upgrade/buy — it
// plays the raw starting deck. That makes it a clean *relative* difficulty probe
// across encounters; it is intentionally not a skilled human. Findings are
// sensitive to this policy — see REPORT.md caveats.

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

// Play out one full player turn (greedy until nothing useful / energy gone).
function playerTurn(DS) {
  const combat = DS.State.combat;
  let guard = 0;
  while (!combat.gameOver && guard++ < 40) {
    const play = pickBestPlay(DS);
    if (!play) break;
    DS.Combat.playCard(play.handIdx, play.target);
  }
}

module.exports = { playerTurn, pickBestPlay, frontEnemy, lowestHpHero };
