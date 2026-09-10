// Darkspire NON-STOP balance soak runner.
//
//   node sims/soak.js                 # run forever, 100 combats/encounter/batch
//   node sims/soak.js --n 250         # bigger batches (tighter per-batch CIs)
//   node sims/soak.js --batches 20    # stop after 20 batches instead of forever
//   node sims/soak.js --seed 1000     # base seed (each batch uses seed+batchNum)
//
// Unlike run.js (one seeded snapshot -> REPORT.md, overwritten), this keeps
// playing the REAL combat engine (js/combat.js, js/state.js, data/*.js) in a
// loop and APPENDS log data so the sample grows without bound:
//
//   sims/logs/balance-<startstamp>.jsonl   one JSON row per encounter per batch
//   sims/logs/rolling-<startstamp>.md      human-readable rolling summary (rewritten)
//
// Each batch draws a fresh seed (base + batchNum) so every batch is independent
// new data, yet the whole soak is reproducible from the base seed. Ctrl-C to stop;
// the JSONL is safe to read/analyze mid-run (line-buffered append).

const fs = require('fs');
const path = require('path');
const { loadGame } = require('./loader');
const { playerTurn } = require('./policy');

const MAX_TURNS = 60;

// Honest provenance: the "player" is a fixed scripted heuristic (sims/policy.js),
// NOT an LLM reasoning per move. Stamped into every log so the data can never be
// mistaken for "Claude played this." A constant player is the point — it isolates
// game balance from player-skill drift.
const PLAYER = {
  player: 'scripted-greedy-bot',
  policyFile: 'sims/policy.js',
  policyVersion: 'greedy-v1 (highest-value affordable card, focus front, mandatory reposition)',
  isLLM: false,
  note: 'Deterministic given seed. No model / no per-move reasoning.',
};

function parseArgs(argv) {
  const a = { n: 100, seed: 1000, batches: Infinity };
  for (let i = 2; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--n') a.n = parseInt(argv[++i], 10);
    else if (t === '--seed') a.seed = parseInt(argv[++i], 10);
    else if (t === '--batches') a.batches = parseInt(argv[++i], 10);
  }
  return a;
}

// --- single combat (mirrors run.js simCombat) ---
async function simCombat(DS, pool, floor) {
  DS.State.newRun();
  DS.State.run.floor = floor;
  DS.Combat.initCombat(pool);

  const combat = DS.State.combat;
  const heroes = DS.State.run.heroes;
  const totalMaxHp = heroes.reduce((s, h) => s + h.maxHp, 0);

  let turns = 0;
  while (!combat.gameOver && turns < MAX_TURNS) {
    turns++;
    playerTurn(DS);
    if (combat.gameOver) break;
    await DS.Combat.endTurn();
  }

  const heroesDead = heroes.filter((h) => h.hp <= 0).length;
  const curHp = heroes.reduce((s, h) => s + Math.max(0, h.hp), 0);
  const enemiesLeft = DS.Combat.aliveEnemies().length;
  const won = enemiesLeft === 0 && heroesDead < heroes.length;
  const timedOut = !combat.gameOver && turns >= MAX_TURNS;

  return { won, timedOut, turns, hpLost: totalMaxHp - curHp, heroesDead,
           anyHeroDied: heroesDead > 0, partyWiped: heroesDead >= heroes.length };
}

async function simEncounter(job, n, seed) {
  const { DS } = loadGame(seed + job.poolIdx * 1000 + job.floor);
  const pool = DS.Enemies[job.tier][job.poolIdx];
  const agg = { wins: 0, timeouts: 0, turns: 0, hpLost: 0, heroesDead: 0, anyDeath: 0, wipes: 0 };

  for (let i = 0; i < n; i++) {
    const r = await simCombat(DS, pool, job.floor);
    if (r.won) agg.wins++;
    if (r.timedOut) agg.timeouts++;
    agg.turns += r.turns;
    agg.hpLost += r.hpLost;
    agg.heroesDead += r.heroesDead;
    if (r.anyHeroDied) agg.anyDeath++;
    if (r.partyWiped) agg.wipes++;
  }

  return {
    label: job.label, tier: job.tier, floor: job.floor,
    enemies: pool.map((e) => e.name), n,
    winRate: agg.wins / n, timeoutRate: agg.timeouts / n,
    wipeRate: agg.wipes / n, anyDeathRate: agg.anyDeath / n,
    avgTurns: agg.turns / n, avgHpLost: agg.hpLost / n,
    avgHeroesDead: agg.heroesDead / n,
  };
}

// Build the encounter job list from whatever pools the game actually defines,
// at the floors where each tier appears (matches run.js so data is comparable).
function buildJobs(DS) {
  const jobs = [];
  DS.Enemies.normal.forEach((_, i) => {
    jobs.push({ label: `normal #${i + 1}`, tier: 'normal', poolIdx: i, floor: 1 });
    jobs.push({ label: `normal #${i + 1}`, tier: 'normal', poolIdx: i, floor: 5 });
  });
  DS.Enemies.elite.forEach((_, i) =>
    jobs.push({ label: `elite #${i + 1}`, tier: 'elite', poolIdx: i, floor: 4 }));
  DS.Enemies.boss.forEach((_, i) =>
    jobs.push({ label: `boss #${i + 1}`, tier: 'boss', poolIdx: i, floor: 6 }));
  return jobs;
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}
function pct(x) { return (x * 100).toFixed(1) + '%'; }

// Rolling summary: pool ALL batches seen so far per encounter config (sample-size
// weighted) so the estimate tightens as the soak runs.
function writeRolling(mdPath, cum, meta) {
  const rows = [...cum.values()].sort((a, b) => a.tier.localeCompare(b.tier) || a.label.localeCompare(b.label) || a.floor - b.floor);
  let md = `# Darkspire soak — rolling balance summary\n\n`;
  md += `_Live. Base seed \`${meta.seed}\`, ${meta.n} combats/encounter/batch. `;
  md += `**${meta.batches}** batches done · **${meta.totalCombats.toLocaleString()}** total combats · updated ${new Date().toISOString()}._\n\n`;
  md += `**Player:** \`${meta.player}\` (${meta.policyFile}) — a fixed scripted heuristic, **not** an LLM. `;
  md += `Deterministic given seed; no per-move reasoning. A constant player is intentional: it isolates game balance from player-skill drift.\n\n`;
  md += `Pooled across every batch (win rate ± rough 95% CI half-width = 1.96·√(p(1-p)/N)).\n\n`;
  md += `| Encounter | Floor | N | Win% | ±95% | Wipe% | Timeout% | AvgTurns | AvgHPLost |\n`;
  md += `|---|---|---|---|---|---|---|---|---|\n`;
  for (const r of rows) {
    const p = r.wins / r.N;
    const ci = 1.96 * Math.sqrt(Math.max(0, p * (1 - p)) / r.N);
    md += `| ${r.label} (${r.enemies.join(', ')}) | ${r.floor} | ${r.N} | ${pct(p)} | ±${(ci * 100).toFixed(1)} | `
        + `${pct(r.wipes / r.N)} | ${pct(r.timeouts / r.N)} | ${(r.turns / r.N).toFixed(1)} | ${(r.hpLost / r.N).toFixed(1)} |\n`;
  }
  fs.writeFileSync(mdPath, md);
}

async function main() {
  const args = parseArgs(process.argv);
  const logsDir = path.join(__dirname, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });

  const start = stamp();
  const jsonlPath = path.join(logsDir, `balance-${start}.jsonl`);
  const rollingPath = path.join(logsDir, `rolling-${start}.md`);
  // Synchronous append per row: the combat loop is CPU-bound on microtasks, which
  // starves a WriteStream's I/O drain (buffers in memory, never flushes). appendFileSync
  // guarantees each line is on disk immediately and safe to `tail` mid-run.
  const appendLine = (obj) => fs.appendFileSync(jsonlPath, JSON.stringify(obj) + '\n');

  // First line of every log = a provenance/meta record naming the player.
  appendLine({ kind: 'meta', ts: new Date().toISOString(),
    baseSeed: args.seed, combatsPerEncounterPerBatch: args.n, maxTurns: MAX_TURNS,
    party: 'Fighter/Rogue/Cleric/Wizard, starter decks, no progression', ...PLAYER });

  const { DS } = loadGame(args.seed);
  const jobs = buildJobs(DS);

  // cumulative accumulator keyed by encounter config
  const cum = new Map();
  const key = (j) => `${j.tier}|${j.label}|${j.floor}`;

  console.log(`Darkspire soak started. Player = ${PLAYER.player} (${PLAYER.policyFile}) — scripted, not an LLM.`);
  console.log(`  ${jobs.length} encounters × ${args.n} combats/batch = ${jobs.length * args.n} combats/batch.`);
  console.log(`  log:     ${path.relative(process.cwd(), jsonlPath)}`);
  console.log(`  rolling: ${path.relative(process.cwd(), rollingPath)}`);
  console.log(`  ${args.batches === Infinity ? 'Running forever — Ctrl-C to stop.' : args.batches + ' batches then stop.'}\n`);

  let totalCombats = 0;
  for (let batch = 0; batch < args.batches; batch++) {
    const seed = args.seed + batch;
    const t0 = Date.now();
    for (const job of jobs) {
      const r = await simEncounter(job, args.n, seed);
      totalCombats += args.n;

      // append raw batch row
      appendLine({ ts: new Date().toISOString(), batch, seed, ...r });

      // fold into cumulative
      const k = key(job);
      let c = cum.get(k);
      if (!c) { c = { label: r.label, tier: r.tier, floor: r.floor, enemies: r.enemies,
                      N: 0, wins: 0, timeouts: 0, wipes: 0, turns: 0, hpLost: 0 }; cum.set(k, c); }
      c.N += r.n;
      c.wins += Math.round(r.winRate * r.n);
      c.timeouts += Math.round(r.timeoutRate * r.n);
      c.wipes += Math.round(r.wipeRate * r.n);
      c.turns += r.avgTurns * r.n;
      c.hpLost += r.avgHpLost * r.n;
    }

    writeRolling(rollingPath, cum, { seed: args.seed, n: args.n, batches: batch + 1, totalCombats, ...PLAYER });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const overall = [...cum.values()].reduce((s, c) => s + c.wins, 0) / [...cum.values()].reduce((s, c) => s + c.N, 0);
    console.log(`batch ${String(batch + 1).padStart(4)} · seed ${seed} · ${secs}s · `
      + `${totalCombats.toLocaleString()} combats total · overall win ${pct(overall)}`);
  }

  console.log(`\nDone. ${totalCombats.toLocaleString()} combats logged to ${path.relative(process.cwd(), jsonlPath)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
