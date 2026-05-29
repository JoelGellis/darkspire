// Darkspire Monte-Carlo balance harness.
//
//   node sims/run.js              # default: 1000 sims per encounter, writes REPORT.md
//   node sims/run.js --n 5000     # more samples
//   node sims/run.js --seed 123   # reproducible batch
//   node sims/run.js --quiet      # write REPORT.md without the console tables
//
// For every encounter pool the game can throw at the default party (Fighter /
// Rogue / Cleric / Wizard, starter decks, no relics/upgrades), at the floors
// where that pool actually appears, we run N combats and record win rate, avg
// turns, avg HP lost, and hero-death rate. See REPORT.md for interpretation.

const fs = require('fs');
const path = require('path');
const { loadGame } = require('./loader');
const { playerTurn } = require('./policy');

const MAX_TURNS = 60; // stalemate guard -> counted as a non-win ("timeout")

function parseArgs(argv) {
  const a = { n: 1000, seed: null, quiet: false };
  for (let i = 2; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--n') a.n = parseInt(argv[++i], 10);
    else if (t === '--seed') a.seed = parseInt(argv[++i], 10);
    else if (t === '--quiet') a.quiet = true;
  }
  return a;
}

// Run a single combat to completion. Returns the outcome record.
async function simCombat(DS, pool, floor) {
  DS.State.newRun();                 // fresh full-HP party + freshly shuffled starter deck
  DS.State.run.floor = floor;
  DS.Combat.initCombat(pool);        // engine deep-copies + floor-scales the pool

  const combat = DS.State.combat;
  const heroes = DS.State.run.heroes;
  const totalMaxHp = heroes.reduce((s, h) => s + h.maxHp, 0);

  let turns = 0;
  while (!combat.gameOver && turns < MAX_TURNS) {
    turns++;
    playerTurn(DS);
    if (combat.gameOver) break;
    await DS.Combat.endTurn();       // enemy acts, statuses tick, next player turn is set up
  }

  const heroesDead = heroes.filter((h) => h.hp <= 0).length;
  const curHp = heroes.reduce((s, h) => s + Math.max(0, h.hp), 0);
  const enemiesLeft = DS.Combat.aliveEnemies().length;
  const won = enemiesLeft === 0 && heroesDead < heroes.length;
  const timedOut = !combat.gameOver && turns >= MAX_TURNS;

  return {
    won,
    timedOut,
    turns,
    hpLost: totalMaxHp - curHp,
    heroesDead,
    anyHeroDied: heroesDead > 0,
    partyWiped: heroesDead >= heroes.length,
  };
}

async function simEncounter(label, tier, poolIdx, floor, n, seed) {
  // One freshly-loaded game per encounter, seeded off the base seed + index so
  // each encounter is independent yet the whole batch is reproducible.
  const { DS } = loadGame(seed === null ? null : seed + poolIdx * 1000 + floor);
  const pool = DS.Enemies[tier][poolIdx];

  const agg = {
    label, tier, floor, n,
    enemies: pool.map((e) => e.name),
    wins: 0, timeouts: 0,
    turns: 0, hpLost: 0, heroesDead: 0, anyDeath: 0, wipes: 0,
  };

  for (let i = 0; i < n; i++) {
    const r = await simCombat(DS, pool, floor);
    if (r.won) agg.wins++;
    if (r.timedOut) agg.timeouts++;
    agg.turns += r.turns;
    agg.hpLost += r.hpLost;
    agg.heroesDead += r.heroesDead;
    if (r.anyHeroDied) agg.anyDeath++;
    if (r.partyWiped) agg.wipes++;
  }

  return {
    label, tier, floor,
    enemies: agg.enemies,
    n,
    winRate: agg.wins / n,
    timeoutRate: agg.timeouts / n,
    avgTurns: agg.turns / n,
    avgHpLost: agg.hpLost / n,
    avgHeroesDead: agg.heroesDead / n,
    anyDeathRate: agg.anyDeath / n,
    wipeRate: agg.wipes / n,
  };
}

function pct(x) { return (x * 100).toFixed(1) + '%'; }
function num(x, d = 1) { return x.toFixed(d); }

// Difficulty verdict bands. The party fights with the STARTING deck and zero
// progression, so we judge relative to that: a starting party should crush most
// floor-1 normals, sweat through elites, and find the boss genuinely hard.
function verdict(r) {
  const w = r.winRate;
  if (r.tier === 'normal') {
    if (w >= 0.97) return 'TOO EASY';
    if (w >= 0.80) return 'ok';
    if (w >= 0.55) return 'hard';
    return 'TOO HARD';
  }
  if (r.tier === 'elite') {
    if (w >= 0.90) return 'TOO EASY';
    if (w >= 0.55) return 'ok';
    if (w >= 0.30) return 'hard';
    return 'TOO HARD';
  }
  // boss
  if (w >= 0.80) return 'TOO EASY';
  if (w >= 0.40) return 'ok';
  if (w >= 0.20) return 'hard';
  return 'TOO HARD';
}

function table(rows) {
  const head = ['Encounter', 'Floor', 'Win%', 'Wipe%', 'Timeout%', 'AvgTurns', 'AvgHPLost', 'AnyDeath%', 'Verdict'];
  const data = rows.map((r) => [
    r.label, String(r.floor), pct(r.winRate), pct(r.wipeRate), pct(r.timeoutRate),
    num(r.avgTurns), num(r.avgHpLost), pct(r.anyDeathRate), verdict(r),
  ]);
  const widths = head.map((h, i) => Math.max(h.length, ...data.map((d) => d[i].length)));
  const fmt = (cols) => cols.map((c, i) => c.padEnd(widths[i])).join('  ');
  let out = fmt(head) + '\n' + widths.map((w) => '-'.repeat(w)).join('  ') + '\n';
  out += data.map(fmt).join('\n');
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const { DS } = loadGame(args.seed); // just to count pools
  const counts = {
    normal: DS.Enemies.normal.length,
    elite: DS.Enemies.elite.length,
    boss: DS.Enemies.boss.length,
  };

  // Which floors each tier actually appears on (from js/map.js): normals 1-5,
  // elites 3-5, boss 6. We probe normals at both ends of their range to expose
  // the floor-scaling curve.
  const jobs = [];
  for (let i = 0; i < counts.normal; i++) {
    jobs.push({ label: `normal #${i + 1}`, tier: 'normal', poolIdx: i, floor: 1 });
    jobs.push({ label: `normal #${i + 1}`, tier: 'normal', poolIdx: i, floor: 5 });
  }
  for (let i = 0; i < counts.elite; i++) {
    jobs.push({ label: `elite #${i + 1}`, tier: 'elite', poolIdx: i, floor: 4 });
  }
  for (let i = 0; i < counts.boss; i++) {
    jobs.push({ label: `boss #${i + 1}`, tier: 'boss', poolIdx: i, floor: 6 });
  }

  const t0 = Date.now();
  const results = [];
  for (const j of jobs) {
    const r = await simEncounter(j.label, j.tier, j.poolIdx, j.floor, args.n, args.seed);
    results.push(r);
    if (!args.quiet) process.stdout.write('.'); // progress dots
  }
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  if (!args.quiet) process.stdout.write('\n');

  const byTier = (t) => results.filter((r) => r.tier === t);

  if (!args.quiet) {
    console.log(`\nDarkspire balance sim — ${args.n} combats/encounter, ${jobs.length} encounters, ${elapsed}s` +
      (args.seed !== null ? `, seed ${args.seed}` : ', unseeded'));
    console.log('\n=== NORMAL ENCOUNTERS (floors 1 & 5) ===\n' + table(byTier('normal')));
    console.log('\n=== ELITE ENCOUNTERS (floor 4) ===\n' + table(byTier('elite')));
    console.log('\n=== BOSS ENCOUNTERS (floor 6) ===\n' + table(byTier('boss')));
  }

  writeReport(results, args, elapsed, counts);
  if (!args.quiet) console.log(`\nWrote ${path.join('sims', 'REPORT.md')}`);
}

function mdTable(rows) {
  const head = '| Encounter | Floor | Win% | Wipe% | Timeout% | Avg Turns | Avg HP Lost | Any-Death% | Verdict |';
  const sep =  '|---|---|---|---|---|---|---|---|---|';
  const body = rows.map((r) =>
    `| ${r.label} (${r.enemies.join(', ')}) | ${r.floor} | ${pct(r.winRate)} | ${pct(r.wipeRate)} | ` +
    `${pct(r.timeoutRate)} | ${num(r.avgTurns)} | ${num(r.avgHpLost)} | ${pct(r.anyDeathRate)} | ${verdict(r)} |`
  ).join('\n');
  return [head, sep, body].join('\n');
}

function writeReport(results, args, elapsed, counts) {
  const byTier = (t) => results.filter((r) => r.tier === t);
  const tooEasy = results.filter((r) => verdict(r) === 'TOO EASY');
  const tooHard = results.filter((r) => verdict(r) === 'TOO HARD');

  const normals = byTier('normal');
  const normF1 = normals.filter((r) => r.floor === 1);
  const normF5 = normals.filter((r) => r.floor === 5);
  const avg = (arr, k) => (arr.reduce((s, r) => s + r[k], 0) / arr.length);

  let md = '';
  md += '# Darkspire Balance Report\n\n';
  md += `_Generated by \`sims/run.js\` — ${args.n} Monte-Carlo combats per encounter, ` +
        `${results.length} encounter configs, ${elapsed}s` +
        (args.seed !== null ? `, seed \`${args.seed}\`._\n\n` : ', unseeded (re-run for fresh draws)._\n\n');

  md += '## How to read this\n\n';
  md += 'The simulator runs the **real combat engine** (`js/combat.js`, `js/state.js`, ' +
        '`data/*.js`) headlessly. A scripted AI plays the **default party** ' +
        '(Fighter / Rogue / Cleric / Wizard) with **only their starting decks — no ' +
        'relics, no reward cards, no upgrades, no repositioning**. Every fight starts ' +
        'the party at full HP.\n\n';
  md += 'That makes this a clean **relative-difficulty probe** (which pools are spikes vs. ' +
        'pushovers), but it is **not** the win rate a real, progressing run would see — a ' +
        'real party reaches floor 5 / the boss with extra cards, relics, and upgrades ' +
        '(and also accumulated damage). Read the boss/elite numbers as *"starting party ' +
        'vs. scaled encounter"*, i.e. a floor on how hard they are, not the live experience.\n\n';
  md += '**Metrics:** Win% = enemies cleared without a party wipe. Wipe% = whole party died. ' +
        'Timeout% = combat hit the ' + MAX_TURNS + '-turn cap (almost always an enemy the ' +
        'greedy bot can\'t out-damage — a *stall*, counted as a non-win). Avg HP Lost = ' +
        'party max-HP minus HP remaining at end (net of healing). Any-Death% = share of ' +
        'fights where ≥1 hero died.\n\n';
  md += '**Verdict bands** (tuned to "starting party" expectations): normals should be ' +
        '≥80% (≥97% = too easy); elites ~30–55% is the sweat zone; the boss is meant to be ' +
        'genuinely hard for an *unupgraded* party.\n\n';

  md += '## Headline findings\n\n';
  const headline = [];
  // Auto-derived bullets.
  headline.push(`Starting-party clears **${pct(avg(normF1, 'winRate'))}** of floor-1 normals on ` +
    `average and **${pct(avg(normF5, 'winRate'))}** of the same pools at floor 5 — the floor ` +
    `scaling (+10% HP / +0.5 dmg per floor) costs ~${pct(avg(normF1,'winRate') - avg(normF5,'winRate'))} win rate across the normal tier.`);
  if (tooEasy.length) headline.push(`**${tooEasy.length}** encounter configs are *too easy* (trivial win rate): ` +
    tooEasy.map((r) => `${r.label}@F${r.floor}`).join(', ') + '.');
  if (tooHard.length) headline.push(`**${tooHard.length}** encounter configs are *too hard* for the starting party: ` +
    tooHard.map((r) => `${r.label}@F${r.floor} (${pct(r.winRate)})`).join(', ') + '.');
  const bosses = byTier('boss').slice().sort((a, b) => a.winRate - b.winRate);
  headline.push(`Boss spread (floor 6): ` + bosses.map((r) => `${r.enemies[0]} ${pct(r.winRate)}`).join(', ') +
    ` — these vary by ${pct(bosses[bosses.length-1].winRate - bosses[0].winRate)}, so the level-0 boss you draw swings run difficulty a lot.`);
  const stalls = results.filter((r) => r.timeoutRate >= 0.05).sort((a,b)=>b.timeoutRate-a.timeoutRate);
  if (stalls.length) headline.push(`Stall risk (timeout ≥5%): ` + stalls.map((r) => `${r.label}@F${r.floor} (${pct(r.timeoutRate)})`).join(', ') +
    ` — high-block enemies the greedy bot can\'t burn down. A smarter player breaks these, so treat as a soft signal.`);
  md += headline.map((h) => '- ' + h).join('\n') + '\n\n';

  md += '## Normal encounters\n\n';
  md += '_Probed at floor 1 (first combat) and floor 5 (deepest pre-boss) to show the scaling curve._\n\n';
  md += mdTable(normals.slice().sort((a,b)=> a.label.localeCompare(b.label) || a.floor-b.floor)) + '\n\n';

  md += '## Elite encounters (floor 4)\n\n';
  md += mdTable(byTier('elite')) + '\n\n';

  md += '## Boss encounters (floor 6)\n\n';
  md += mdTable(byTier('boss')) + '\n\n';

  md += '## Caveats / approximations\n\n';
  md += '- **AI policy.** Greedy "highest-value affordable card, focus the front enemy," with ' +
        'trivial anti-waste guards (no over-heal, AoE valued by target count). It does **not** ' +
        'reposition, plan multi-turn, sequence combos, save block for big incoming hits, or use ' +
        'reward cards. A skilled human is strictly better, so absolute win rates are a *lower bound* ' +
        'and timeout/stall numbers especially so.\n';
  md += '- **No progression.** Starter decks only, no relics/upgrades/equipment. Floor-5 and boss ' +
        'fights therefore look harder than a real run where the party has grown. The *relative* ' +
        'ordering of pools is the trustworthy signal.\n';
  md += '- **Enemy AI = engine default.** Intents are picked uniformly at random from each enemy\'s ' +
        'pool each turn (exactly as `DS.Combat.pickIntent` does in-game). No change.\n';
  md += '- **Stubbed for headless run:** all DOM/render calls are no-ops; `setTimeout` is a no-op ' +
        '(only cosmetic/post-combat callbacks use it); `DS.Combat.sleep` resolves instantly so the ' +
        'animation delays don\'t apply. Combat math, RNG, statuses, positions, floor scaling, combos, ' +
        'and death/summon effects all run unmodified from the real engine.\n';
  md += '- **Timeout = non-win.** A fight that reaches the ' + MAX_TURNS + '-turn cap is recorded as ' +
        'a stall (not a win and not a wipe). For high-block enemies this undercounts true win rate.\n\n';

  md += '## Re-run\n\n';
  md += '```\nnode sims/run.js               # 1000/encounter\nnode sims/run.js --n 5000      # tighter CIs\n' +
        'node sims/run.js --seed 42     # reproducible\n```\n';

  fs.writeFileSync(path.join(__dirname, 'REPORT.md'), md);
}

main().catch((e) => { console.error(e); process.exit(1); });
