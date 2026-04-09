window.DS = window.DS || {};

// ===== POST-RUN SUMMARY SCREEN =====
// Shows results after victory or defeat, handles meta-state transitions back to town.
// Victory = floorsCleared >= 7 (boss beaten). Defeat = otherwise.

DS.UI.renderSummary = function(root) {
  DS.UI._injectSummaryStyles();

  // Run is ending — delete the mid-run save
  DS.State.deleteRunSave();

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

  // Count relics
  var relicCount = (run && run.relics) ? run.relics.length : 0;

  // Time elapsed
  var elapsed = '';
  if (run && run.startTime) {
    var ms = Date.now() - run.startTime;
    var totalSec = Math.floor(ms / 1000);
    var mins = Math.floor(totalSec / 60);
    var secs = totalSec % 60;
    elapsed = mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  // Gold calculations
  var runGold = (run && run.gold) || 0;
  var goldAwarded = isVictory ? runGold : Math.floor(runGold / 2);

  // Calculate score
  var score = DS.UI._summaryCalcScore(stats, runGold, relicCount, aliveCount, isVictory);

  // Record high score
  DS.UI._summaryRecordHighScore(stats, runGold, relicCount, score, isVictory);

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
      '<div class="summary-stat-row"><span class="summary-stat-label">Relics Found</span><span class="summary-stat-value">' + relicCount + '</span></div>' +
      '<div class="summary-stat-row"><span class="summary-stat-label">Gold Earned</span><span class="summary-stat-value">' + runGold + '</span></div>' +
      (elapsed ? '<div class="summary-stat-row"><span class="summary-stat-label">Time</span><span class="summary-stat-value">' + elapsed + '</span></div>' : '') +
      '<div class="summary-stat-row summary-stat-score"><span class="summary-stat-label">SCORE</span><span class="summary-stat-value">' + score + '</span></div>' +
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

  // ===== HIGH SCORES =====
  var highScoresHtml = DS.UI._summaryBuildHighScores();

  // ===== BUTTON =====
  var btnHtml = '<button class="btn summary-btn-return" id="btn-summary-return">RETURN TO TOWN</button>';

  screen.innerHTML = bannerHtml + statsHtml + heroesHtml + rewardsHtml + highScoresHtml + btnHtml;
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
    // Check for new unlocks
    DS.State._pendingUnlocks = DS.Meta.checkUnlocks();
  } else {
    // applyDefeatPenalty(runHeroRosterIndices)
    var validIndices = rosterIndices.filter(function(idx) { return idx !== -1; });
    DS.Meta.applyDefeatPenalty(validIndices);
    // applyDefeatPenalty halves existing meta gold; add run salvage separately
    DS.Meta.addGold(goldAwarded);
    DS.Meta.runCount++;
    DS.Meta.save();
  }

  // Clear run state and run save
  DS.State.run = null;
  DS.State.combat = null;
  DS.State._selectedParty = null;
  DS.State._runRosterMap = null;
  DS.State.deleteRunSave();

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

// ===== SCORING =====

DS.UI._summaryCalcScore = function(stats, gold, relics, aliveCount, isVictory) {
  var score = 0;
  score += stats.floorsCleared * 100;       // 100 per floor
  score += stats.enemiesSlain * 25;          // 25 per kill
  score += stats.cardsCollected * 10;        // 10 per card picked up
  score += relics * 50;                      // 50 per relic
  score += gold;                             // 1 per gold
  score += aliveCount * 75;                  // 75 per surviving hero
  if (isVictory) score += 500;               // Victory bonus
  return score;
};

// ===== HIGH SCORES (localStorage) =====

DS.UI._summaryRecordHighScore = function(stats, gold, relics, score, isVictory) {
  try {
    var raw = localStorage.getItem('darkspire_highscores');
    var scores = raw ? JSON.parse(raw) : [];

    scores.push({
      score: score,
      floors: stats.floorsCleared,
      kills: stats.enemiesSlain,
      gold: gold,
      relics: relics,
      victory: isVictory,
      date: new Date().toISOString().slice(0, 10)
    });

    // Sort descending, keep top 5
    scores.sort(function(a, b) { return b.score - a.score; });
    scores = scores.slice(0, 5);

    localStorage.setItem('darkspire_highscores', JSON.stringify(scores));
  } catch(e) {
    console.warn('High score save failed:', e);
  }
};

DS.UI._summaryGetHighScores = function() {
  try {
    var raw = localStorage.getItem('darkspire_highscores');
    return raw ? JSON.parse(raw) : [];
  } catch(e) {
    return [];
  }
};

DS.UI._summaryBuildHighScores = function() {
  var scores = DS.UI._summaryGetHighScores();
  if (scores.length === 0) return '';

  var html = '<div class="summary-highscores">' +
    '<h3 class="summary-hs-title">HIGH SCORES</h3>' +
    '<div class="summary-hs-list">';

  scores.forEach(function(entry, i) {
    var rank = i + 1;
    var badge = entry.victory ? ' summary-hs-victory' : '';
    html +=
      '<div class="summary-hs-row' + badge + '">' +
        '<span class="summary-hs-rank">#' + rank + '</span>' +
        '<span class="summary-hs-score">' + entry.score + '</span>' +
        '<span class="summary-hs-detail">F' + entry.floors + ' / ' + entry.kills + ' kills' + (entry.victory ? ' / WIN' : '') + '</span>' +
        '<span class="summary-hs-date">' + entry.date + '</span>' +
      '</div>';
  });

  html += '</div></div>';
  return html;
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
    '.summary-stat-score .summary-stat-label { color:var(--gold); font-weight:700; }',
    '.summary-stat-score .summary-stat-value { color:var(--gold); font-size:16px; }',

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

    // High scores
    '.summary-highscores { background:var(--bg-panel); border:2px solid var(--border); border-radius:8px; padding:16px 24px; min-width:300px; max-width:420px; width:100%; }',
    '.summary-hs-title { font-size:12px; color:var(--text-dim); text-transform:uppercase; letter-spacing:3px; margin:0 0 10px 0; text-align:center; }',
    '.summary-hs-row { display:flex; align-items:center; gap:10px; padding:4px 0; font-size:12px; color:var(--text-dim); }',
    '.summary-hs-victory { color:var(--gold); }',
    '.summary-hs-rank { width:24px; font-weight:700; }',
    '.summary-hs-score { width:60px; font-weight:700; color:var(--text-bright); }',
    '.summary-hs-detail { flex:1; }',
    '.summary-hs-date { font-size:11px; }',

    // Return button
    '.summary-btn-return { padding:14px 48px; font-size:16px; font-weight:700; letter-spacing:3px; margin-top:8px; cursor:pointer; }'
  ].join('\n');
  document.head.appendChild(style);
};

// ===== AUTO-SAVE HOOK =====
// Wraps DS.UI.render to auto-save when transitioning to the map screen.
// This file loads after ui.js so DS.UI.render exists.

(function() {
  var _originalRender = DS.UI.render;
  DS.UI.render = function() {
    _originalRender.call(DS.UI);
    // Auto-save after rendering the map screen
    if (DS.State.screen === 'map' && DS.State.run) {
      DS.State.save();
    }
  };
})();

// ===== TITLE SCREEN HOOK =====
// Wraps renderTitle to add "Resume Run" button when a run save exists,
// and show high scores on the title screen.

(function() {
  var _originalRenderTitle = DS.UI.renderTitle;
  DS.UI.renderTitle = function(root) {
    _originalRenderTitle.call(DS.UI, root);

    var hasRunSave = DS.State.hasRunSave();
    var scores = DS.UI._summaryGetHighScores();

    // Insert "Resume Run" button if applicable
    if (hasRunSave) {
      var content = root.querySelector('.title-content');
      if (content) {
        var resumeBtn = document.createElement('button');
        resumeBtn.className = 'btn btn-new-run';
        resumeBtn.id = 'btn-resume-run';
        resumeBtn.textContent = 'RESUME RUN';
        resumeBtn.style.background = '#2a6e2a';
        resumeBtn.style.borderColor = '#3a8e3a';
        // Insert before the first button
        var firstBtn = content.querySelector('button');
        if (firstBtn) {
          content.insertBefore(resumeBtn, firstBtn);
        } else {
          content.appendChild(resumeBtn);
        }
        resumeBtn.onclick = function() {
          // Load meta first
          if (DS.Meta && DS.Meta.hasSave()) {
            DS.Meta.load();
          }
          // Load the run save
          if (DS.State.load()) {
            DS.UI.render();
          } else {
            // Save was corrupt — fall through to town
            DS.State.deleteRunSave();
            if (DS.Meta && DS.Meta.hasSave()) {
              DS.Meta.load();
              DS.State.screen = 'town';
            } else {
              DS.State.screen = 'title';
            }
            DS.UI.render();
          }
        };
      }
    }

    // Show high scores on title screen
    if (scores.length > 0) {
      DS.UI._injectSummaryStyles();
      var hsHtml = DS.UI._summaryBuildHighScores();
      var hsDiv = document.createElement('div');
      hsDiv.style.marginTop = '20px';
      hsDiv.style.maxWidth = '400px';
      hsDiv.style.width = '100%';
      hsDiv.innerHTML = hsHtml;
      var content = root.querySelector('.title-content');
      if (content) content.appendChild(hsDiv);
    }
  };
})();
