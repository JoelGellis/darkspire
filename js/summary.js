window.DS = window.DS || {};

// ===== POST-RUN SUMMARY SCREEN =====
// Shows results after victory or defeat, handles meta-state transitions back to town.
// Victory = floorsCleared >= 7 (boss beaten). Defeat = otherwise.

DS.UI.renderSummary = function(root) {
  DS.UI._injectSummaryStyles();

  root.innerHTML = '';
  var screen = document.createElement('div');
  screen.className = 'screen summary-screen';

  var stats = DS.State.stats;
  var run = DS.State.run;
  var isVictory = stats.floorsCleared >= 7;

  // Count alive/dead heroes
  var aliveCount = 0;
  var deadCount = 0;
  if (run && run.heroes) {
    run.heroes.forEach(function(h) {
      if (h.hp > 0) aliveCount++;
      else deadCount++;
    });
  }

  // Gold calculations
  var runGold = (run && run.gold) || 0;
  var goldAwarded = isVictory ? runGold : Math.floor(runGold / 2);

  // ===== BANNER =====
  var bannerHtml =
    '<div class="summary-banner ' + (isVictory ? 'summary-victory' : 'summary-defeat') + '">' +
      '<div class="summary-banner-text">' + (isVictory ? 'VICTORY' : 'DEFEAT') + '</div>' +
      '<div class="summary-flavor">' +
        (isVictory
          ? 'You have conquered the Spire... for now.'
          : 'The darkness claims all... but the town endures.') +
      '</div>' +
    '</div>';

  // ===== STATS =====
  var statsHtml =
    '<div class="summary-stats">' +
      '<div class="summary-stat-row"><span class="summary-stat-label">Floors Cleared</span><span class="summary-stat-value">' + stats.floorsCleared + '/7</span></div>' +
      '<div class="summary-stat-row"><span class="summary-stat-label">Enemies Slain</span><span class="summary-stat-value">' + stats.enemiesSlain + '</span></div>' +
      '<div class="summary-stat-row"><span class="summary-stat-label">Cards Collected</span><span class="summary-stat-value">' + stats.cardsCollected + '</span></div>' +
      '<div class="summary-stat-row"><span class="summary-stat-label">Gold Earned</span><span class="summary-stat-value">' + runGold + '</span></div>' +
    '</div>';

  // ===== HEROES =====
  var heroesHtml = '<div class="summary-heroes">';
  if (run && run.heroes) {
    run.heroes.forEach(function(h) {
      var heroDef = DS.Heroes[h.heroIdx];
      var color = heroDef ? heroDef.colors.primary : '#888';
      // On defeat ALL heroes shown as dead regardless of hp
      var alive = isVictory && h.hp > 0;

      if (alive) {
        heroesHtml +=
          '<div class="summary-hero-card summary-hero-alive">' +
            '<div class="summary-hero-name" style="color:' + color + '">' + h.name + '</div>' +
            '<div class="summary-hero-class">' + h.cls + '</div>' +
            '<div class="summary-hero-hp">' + h.hp + '/' + h.maxHp + ' HP</div>' +
            '<div class="summary-hero-bonus">+5 Max HP</div>' +
          '</div>';
      } else {
        heroesHtml +=
          '<div class="summary-hero-card summary-hero-dead">' +
            '<div class="summary-hero-skull">&#9760;</div>' +
            '<div class="summary-hero-name">' + h.name + '</div>' +
            '<div class="summary-hero-class">' + h.cls + '</div>' +
            '<div class="summary-hero-fallen">FALLEN</div>' +
          '</div>';
      }
    });
  }
  heroesHtml += '</div>';

  // ===== REWARDS =====
  var rewardsHtml = '<div class="summary-rewards">';
  if (isVictory) {
    rewardsHtml +=
      '<div class="summary-reward-line summary-reward-gold">Gold Secured: +' + goldAwarded + '</div>' +
      '<div class="summary-reward-line">Veterans Returning: ' + aliveCount + '</div>';
    if (deadCount > 0) {
      rewardsHtml += '<div class="summary-reward-line summary-reward-loss">Heroes Lost: ' + deadCount + '</div>';
    }
  } else {
    rewardsHtml +=
      '<div class="summary-reward-line summary-reward-gold">Gold Salvaged: +' + goldAwarded + '</div>' +
      '<div class="summary-reward-line summary-reward-loss">All expedition heroes lost.</div>';
  }
  rewardsHtml += '</div>';

  // ===== BUTTON =====
  var btnHtml = '<button class="btn summary-btn-return" id="btn-summary-return">RETURN TO TOWN</button>';

  screen.innerHTML = bannerHtml + statsHtml + heroesHtml + rewardsHtml + btnHtml;
  root.appendChild(screen);

  // ===== WIRE UP RETURN =====
  document.getElementById('btn-summary-return').onclick = function() {
    DS.UI._summaryApplyResults(isVictory, run, goldAwarded);
  };
};

// ===== APPLY RUN RESULTS TO META =====

DS.UI._summaryApplyResults = function(isVictory, run, goldAwarded) {
  var rosterIndices = DS.UI._summaryGetRosterMap(run);

  if (isVictory) {
    // applyVictoryRewards(goldEarned, runHeroRosterIndices, aliveFlags)
    var aliveFlags = run.heroes.map(function(h) { return h.hp > 0; });
    DS.Meta.applyVictoryRewards(goldAwarded, rosterIndices, aliveFlags);
  } else {
    // applyDefeatPenalty(runHeroRosterIndices)
    var validIndices = rosterIndices.filter(function(idx) { return idx !== -1; });
    DS.Meta.applyDefeatPenalty(validIndices);
    // applyDefeatPenalty halves existing meta gold; add run salvage separately
    DS.Meta.addGold(goldAwarded);
    DS.Meta.runCount++;
    DS.Meta.save();
  }

  // Clear run state
  DS.State.run = null;
  DS.State.combat = null;
  DS.State._selectedParty = null;
  DS.State._runRosterMap = null;

  // Go to town
  DS.State.screen = 'town';
  DS.UI.render();
};

// ===== ROSTER INDEX MAPPING =====
// Maps each run hero index → meta roster index.
// Uses _runRosterMap if set at run start, otherwise falls back to heroClass matching.

DS.UI._summaryGetRosterMap = function(run) {
  var indices = [];
  if (!run || !run.heroes) return indices;

  // Preferred: use the map set by the wire instance at run start
  if (DS.State._runRosterMap) {
    for (var i = 0; i < run.heroes.length; i++) {
      var mapped = DS.State._runRosterMap[i];
      indices.push(mapped !== undefined ? mapped : -1);
    }
    return indices;
  }

  // Fallback: match by heroClass against the roster
  var used = {};
  for (var i = 0; i < run.heroes.length; i++) {
    var cls = run.heroes[i].cls;
    var found = -1;
    for (var r = 0; r < DS.Meta.heroRoster.length; r++) {
      if (DS.Meta.heroRoster[r].heroClass === cls && !used[r]) {
        found = r;
        break;
      }
    }
    if (found !== -1) used[found] = true;
    indices.push(found);
  }
  return indices;
};

// ===== INJECT SUMMARY STYLES =====

DS.UI._injectSummaryStyles = function() {
  if (DS.UI._stylesInjected.summary) return;
  DS.UI._stylesInjected.summary = true;
  var style = document.createElement('style');
  style.textContent = [
    // Screen layout
    '.summary-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; padding:40px 20px; background:var(--bg-darkest); gap:24px; }',

    // Banner — victory gold, defeat dark red
    '.summary-banner { text-align:center; margin-bottom:8px; }',
    '.summary-banner-text { font-size:52px; font-weight:900; letter-spacing:10px; text-transform:uppercase; }',
    '.summary-victory .summary-banner-text { color:var(--gold); text-shadow:0 0 30px rgba(212,168,67,0.5), 0 0 60px rgba(212,168,67,0.2); }',
    '.summary-defeat .summary-banner-text { color:var(--crimson); text-shadow:0 0 30px rgba(196,60,60,0.4), 0 0 60px rgba(196,60,60,0.15); }',
    '.summary-flavor { font-size:14px; color:var(--text-dim); font-style:italic; margin-top:8px; letter-spacing:1px; }',

    // Stats box
    '.summary-stats { background:var(--bg-panel); border:2px solid var(--border); border-radius:8px; padding:20px 32px; min-width:300px; max-width:420px; width:100%; }',
    '.summary-stat-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(46,31,69,0.5); }',
    '.summary-stat-row:last-child { border-bottom:none; }',
    '.summary-stat-label { font-size:13px; color:var(--text-dim); letter-spacing:1px; }',
    '.summary-stat-value { font-size:13px; color:var(--text-bright); font-weight:700; }',

    // Hero cards
    '.summary-heroes { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }',
    '.summary-hero-card { padding:16px 20px; border-radius:8px; text-align:center; min-width:120px; max-width:150px; }',
    '.summary-hero-alive { background:var(--bg-panel); border:2px solid #3a8040; box-shadow:0 0 12px rgba(58,128,64,0.2); }',
    '.summary-hero-dead { background:rgba(20,14,28,0.8); border:2px solid var(--crimson-dim); opacity:0.6; }',
    '.summary-hero-name { font-size:15px; font-weight:700; margin-bottom:2px; }',
    '.summary-hero-dead .summary-hero-name { color:var(--text-dim); }',
    '.summary-hero-class { font-size:10px; color:var(--text-dim); text-transform:uppercase; letter-spacing:2px; margin-bottom:4px; }',
    '.summary-hero-hp { font-size:12px; color:var(--text-dim); }',
    '.summary-hero-bonus { font-size:11px; color:#5cb85c; font-weight:700; margin-top:6px; letter-spacing:1px; }',
    '.summary-hero-skull { font-size:24px; margin-bottom:4px; }',
    '.summary-hero-fallen { font-size:11px; color:var(--crimson); font-weight:700; letter-spacing:2px; margin-top:6px; }',

    // Rewards
    '.summary-rewards { text-align:center; padding:16px; }',
    '.summary-reward-line { font-size:14px; color:var(--text-bright); margin-bottom:6px; letter-spacing:1px; }',
    '.summary-reward-gold { color:var(--gold); font-weight:700; font-size:16px; }',
    '.summary-reward-loss { color:var(--crimson-dim); }',

    // Return button
    '.summary-btn-return { padding:14px 48px; font-size:16px; font-weight:700; letter-spacing:3px; margin-top:8px; cursor:pointer; }'
  ].join('\n');
  document.head.appendChild(style);
};
