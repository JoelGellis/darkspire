window.DS = window.DS || {};

// ===== TOWN SCREEN =====
// Hub between runs. Shows hero roster, buildings, and action buttons.
// Reads from DS.Meta (gold, roster, buildings, graveyard),
// DS.Buildings (costs, descriptions), DS.Heroes and DS.Cards (display info).

DS.UI.renderTown = function(root) {
  root.innerHTML = '';
  DS.UI._injectTownStyles();

  // Defensive: bail if meta layer isn't loaded yet
  if (!DS.Meta) {
    root.innerHTML = '<div class="screen screen-town"><div class="town-header"><h1 class="game-title">Loading...</h1></div></div>';
    return;
  }

  var screen = document.createElement('div');
  screen.className = 'screen screen-town';

  var meta = DS.Meta;

  // ===== HEADER =====
  var headerHtml =
    '<div class="town-header">' +
      '<h1 class="game-title">DARKSPIRE &mdash; Town</h1>' +
      '<div class="town-header-stats">' +
        '<span class="gold-display town-gold">&#x1F4B0; ' + meta.gold + ' Gold</span>' +
        '<span class="town-runs">Runs: ' + meta.runCount + '</span>' +
      '</div>' +
    '</div>';

  // ===== HERO ROSTER =====
  var rosterHtml = '<div class="town-roster"><h2 class="town-section-title">HERO ROSTER</h2><div class="town-roster-list">';
  meta.heroRoster.forEach(function(hero, i) {
    var heroDef = DS.UI._townFindHeroDef(hero.heroClass);
    var cards = DS.Cards[hero.heroClass] || [];
    var upgCount = (hero.upgradedCards || []).length;
    var isVet = hero.runsSurvived > 0;
    var color = heroDef ? heroDef.colors.primary : '#aaa';

    if (hero.alive) {
      var totalHp = heroDef ? heroDef.maxHp + hero.runsSurvived * 5 + DS.Meta.getChapelBonus() : 0;
      var stars = '';
      for (var s = 0; s < hero.runsSurvived; s++) stars += '\u2B50';
      rosterHtml +=
        '<div class="town-hero-card' + (isVet ? ' town-hero-veteran' : '') + '">' +
          '<div class="town-hero-name" style="color:' + color + '">' +
            (heroDef ? heroDef.name : hero.heroClass) +
          '</div>' +
          (stars ? '<div class="town-hero-stars" title="Survived ' + hero.runsSurvived + ' run(s)">' + stars + '</div>' : '') +
          '<div class="town-hero-stats">' +
            '<span>HP: ' + (heroDef ? totalHp : '?') + '</span>' +
            '<span>Runs: ' + hero.runsSurvived + '</span>' +
            '<span>Upgrades: ' + upgCount + '/4</span>' +
          '</div>' +
        '</div>';
    }
  });

  // Empty roster message
  var aliveCount = meta.heroRoster.filter(function(h) { return h.alive; }).length;
  if (aliveCount === 0) {
    rosterHtml += '<div class="town-empty">No heroes remain. Visit the caravan.</div>';
  }

  rosterHtml += '</div>';

  // Graveyard
  if (meta.graveyard && meta.graveyard.length > 0) {
    rosterHtml += '<div class="town-graveyard"><h3 class="town-graveyard-title">&#9760; Graveyard</h3>';
    meta.graveyard.forEach(function(g) {
      var gDef = DS.UI._townFindHeroDef(g.heroClass);
      var gName = gDef ? gDef.name : g.heroClass;
      rosterHtml += '<span class="town-grave">' + gName + ' (survived ' + g.runsSurvived + ')</span>';
    });
    rosterHtml += '</div>';
  }
  rosterHtml += '</div>';

  // ===== BUILDINGS =====
  var buildingsHtml = '<div class="town-buildings"><h2 class="town-section-title">BUILDINGS</h2><div class="town-buildings-grid">';

  // Blacksmith
  var bs = DS.Buildings.blacksmith;
  buildingsHtml +=
    '<div class="town-building" id="town-building-blacksmith">' +
      '<div class="town-building-icon">' + bs.icon + '</div>' +
      '<div class="town-building-name">' + bs.name + '</div>' +
      '<div class="town-building-desc">' + bs.desc + '</div>' +
      '<div class="town-building-cost">Cost: ' + bs.useCost + 'g per upgrade</div>' +
    '</div>';

  // Chapel
  var ch = DS.Buildings.chapel;
  var chapelLvl = meta.buildings.chapel.level;
  var chapelMax = ch.maxLevel;
  var chapelCost = ch.getUpgradeCost(chapelLvl);
  var chapelBonus = ch.getBonusAtLevel(chapelLvl);
  buildingsHtml +=
    '<div class="town-building" id="town-building-chapel">' +
      '<div class="town-building-icon">' + ch.icon + '</div>' +
      '<div class="town-building-name">' + ch.name + '</div>' +
      '<div class="town-building-desc">' + ch.desc + '</div>' +
      '<div class="town-building-level">Level ' + chapelLvl + '/' + chapelMax + '</div>' +
      '<div class="town-building-bonus">Current bonus: +' + chapelBonus + ' max HP</div>' +
      (chapelCost !== null
        ? '<div class="town-building-cost">Upgrade: ' + chapelCost + 'g</div>'
        : '<div class="town-building-cost">MAX LEVEL</div>') +
    '</div>';

  // Tavern
  var tv = DS.Buildings.tavern;
  var tavernLvl = meta.buildings.tavern.level;
  var tavernMax = tv.maxLevel;
  var tavernCost = tv.getUpgradeCost(tavernLvl);
  var tavernSlots = tv.getSlotsAtLevel(tavernLvl);
  buildingsHtml +=
    '<div class="town-building" id="town-building-tavern">' +
      '<div class="town-building-icon">' + tv.icon + '</div>' +
      '<div class="town-building-name">' + tv.name + '</div>' +
      '<div class="town-building-desc">' + tv.desc + '</div>' +
      '<div class="town-building-level">Level ' + tavernLvl + '/' + tavernMax + '</div>' +
      '<div class="town-building-bonus">Caravan offers ' + tavernSlots + ' heroes</div>' +
      (tavernCost !== null
        ? '<div class="town-building-cost">Upgrade: ' + tavernCost + 'g</div>'
        : '<div class="town-building-cost">MAX LEVEL</div>') +
    '</div>';

  buildingsHtml += '</div></div>';

  // ===== ACTION BUTTONS =====
  var actionsHtml =
    '<div class="town-actions">' +
      '<button class="btn town-btn-spire" id="btn-enter-spire">ENTER THE SPIRE</button>' +
      '<button class="btn town-btn-newgame" id="btn-new-game">NEW GAME</button>' +
    '</div>';

  screen.innerHTML = headerHtml + rosterHtml + buildingsHtml + actionsHtml;
  root.appendChild(screen);

  // ===== WIRE UP BUILDING CLICKS =====

  document.getElementById('town-building-blacksmith').onclick = function() {
    DS.UI._townShowBlacksmithHeroPicker(root);
  };

  document.getElementById('town-building-chapel').onclick = function() {
    if (chapelCost === null) return;
    if (meta.gold < chapelCost) {
      DS.UI._townFlash(root, 'Not enough gold! Need ' + chapelCost + 'g.');
      return;
    }
    if (DS.Meta.upgradeBuilding('chapel')) {
      DS.UI._townFlash(root, 'Chapel upgraded! All heroes gain +3 max HP.');
      DS.UI.renderTown(root);
    }
  };

  document.getElementById('town-building-tavern').onclick = function() {
    if (tavernCost === null) return;
    if (meta.gold < tavernCost) {
      DS.UI._townFlash(root, 'Not enough gold! Need ' + tavernCost + 'g.');
      return;
    }
    if (DS.Meta.upgradeBuilding('tavern')) {
      DS.UI._townFlash(root, 'Tavern upgraded! Caravan now offers ' + tv.getSlotsAtLevel(meta.buildings.tavern.level) + ' heroes.');
      DS.UI.renderTown(root);
    }
  };

  // ===== WIRE UP ACTION BUTTONS =====

  document.getElementById('btn-enter-spire').onclick = function() {
    DS.State.screen = 'caravan';
    DS.UI.render();
  };

  document.getElementById('btn-new-game').onclick = function() {
    DS.UI._townShowConfirm(root, 'Start a new game? All progress will be lost.', function() {
      DS.Meta.newGame();
      DS.Meta.save();
      DS.UI.renderTown(root);
    });
  };
};

// ===== BLACKSMITH SUB-VIEW: HERO PICKER =====

DS.UI._townShowBlacksmithHeroPicker = function(root) {
  root.innerHTML = '';
  var screen = document.createElement('div');
  screen.className = 'screen screen-town';

  var meta = DS.Meta;

  var html =
    '<div class="town-subview">' +
      '<h2 class="town-section-title">BLACKSMITH &mdash; Choose a Hero</h2>' +
      '<div class="town-sub-desc">Pick a hero to upgrade one of their base cards. Cost: ' + DS.Buildings.blacksmith.useCost + 'g</div>' +
      '<div class="town-gold-display">&#x1F4B0; ' + meta.gold + ' Gold</div>' +
      '<div class="town-hero-picker">';

  var hasAny = false;
  meta.heroRoster.forEach(function(hero, i) {
    if (!hero.alive) return;
    var heroDef = DS.UI._townFindHeroDef(hero.heroClass);
    var cards = DS.Cards[hero.heroClass] || [];
    var upgraded = hero.upgradedCards || [];
    // Count upgradeable base cards (indices 0-3)
    var upgradeableCount = 0;
    for (var c = 0; c < 4; c++) {
      if (cards[c] && upgraded.indexOf(cards[c].id) === -1) upgradeableCount++;
    }
    if (upgradeableCount === 0) return;
    hasAny = true;

    var color = heroDef ? heroDef.colors.primary : '#aaa';
    html +=
      '<div class="town-pick-hero" data-roster-idx="' + i + '">' +
        '<div class="town-pick-hero-name" style="color:' + color + '">' + (heroDef ? heroDef.name : hero.heroClass) + '</div>' +
        '<div class="town-pick-hero-info">' + upgradeableCount + ' card(s) upgradeable</div>' +
      '</div>';
  });

  if (!hasAny) {
    html += '<div class="town-empty">No heroes have upgradeable cards.</div>';
  }

  html +=
      '</div>' +
      '<button class="btn town-btn-back" id="btn-bs-back">BACK</button>' +
    '</div>';

  screen.innerHTML = html;
  root.appendChild(screen);

  // Wire hero picks
  meta.heroRoster.forEach(function(hero, i) {
    var el = root.querySelector('[data-roster-idx="' + i + '"]');
    if (el) {
      el.onclick = function() {
        DS.UI._townShowBlacksmithCards(root, i);
      };
    }
  });

  document.getElementById('btn-bs-back').onclick = function() {
    DS.UI.renderTown(root);
  };
};

// ===== BLACKSMITH SUB-VIEW: CARD PICKER =====

DS.UI._townShowBlacksmithCards = function(root, rosterIdx) {
  root.innerHTML = '';
  var screen = document.createElement('div');
  screen.className = 'screen screen-town';

  var meta = DS.Meta;
  var hero = meta.heroRoster[rosterIdx];
  if (!hero) { DS.UI.renderTown(root); return; }

  var heroDef = DS.UI._townFindHeroDef(hero.heroClass);
  var heroName = heroDef ? heroDef.name : hero.heroClass;
  var color = heroDef ? heroDef.colors.primary : '#aaa';
  var cards = DS.Cards[hero.heroClass] || [];
  var upgraded = hero.upgradedCards || [];
  var useCost = DS.Buildings.blacksmith.useCost;
  var canAfford = meta.gold >= useCost;

  var html =
    '<div class="town-subview">' +
      '<h2 class="town-section-title">BLACKSMITH &mdash; <span style="color:' + color + '">' + heroName + '</span></h2>' +
      '<div class="town-sub-desc">Select a card to upgrade (+50% value). Cost: ' + useCost + 'g</div>' +
      '<div class="town-gold-display">&#x1F4B0; ' + meta.gold + ' Gold</div>' +
      '<div class="town-card-picker">';

  for (var c = 0; c < 4; c++) {
    var card = cards[c];
    if (!card) continue;
    var alreadyUpgraded = upgraded.indexOf(card.id) !== -1;
    var newValue = Math.ceil(card.value * 1.5);

    if (alreadyUpgraded) {
      html +=
        '<div class="town-card town-card-done">' +
          '<div class="town-card-name">' + card.name + '</div>' +
          '<div class="town-card-desc">' + card.desc + '</div>' +
          '<div class="town-card-upgraded">UPGRADED (' + card.value + ' &rarr; ' + newValue + ')</div>' +
        '</div>';
    } else {
      html +=
        '<div class="town-card town-card-available' + (canAfford ? '' : ' town-card-unaffordable') + '" data-card-idx="' + c + '">' +
          '<div class="town-card-name">' + card.name + '</div>' +
          '<div class="town-card-desc">' + card.desc + '</div>' +
          '<div class="town-card-upgrade-preview">' + card.value + ' &rarr; ' + newValue + ' (+50%)</div>' +
        '</div>';
    }
  }

  html +=
      '</div>' +
      '<button class="btn town-btn-back" id="btn-bs-back">BACK</button>' +
    '</div>';

  screen.innerHTML = html;
  root.appendChild(screen);

  // Wire card clicks
  for (var c = 0; c < 4; c++) {
    var el = root.querySelector('[data-card-idx="' + c + '"]');
    if (el && canAfford) {
      (function(cardIdx) {
        el.onclick = function() {
          DS.UI._townShowBlacksmithConfirm(root, rosterIdx, cardIdx);
        };
      })(c);
    }
  }

  document.getElementById('btn-bs-back').onclick = function() {
    DS.UI._townShowBlacksmithHeroPicker(root);
  };
};

// ===== BLACKSMITH SUB-VIEW: CONFIRM UPGRADE =====

DS.UI._townShowBlacksmithConfirm = function(root, rosterIdx, cardIdx) {
  root.innerHTML = '';
  var screen = document.createElement('div');
  screen.className = 'screen screen-town';

  var meta = DS.Meta;
  var hero = meta.heroRoster[rosterIdx];
  if (!hero) { DS.UI.renderTown(root); return; }

  var heroDef = DS.UI._townFindHeroDef(hero.heroClass);
  var heroName = heroDef ? heroDef.name : hero.heroClass;
  var color = heroDef ? heroDef.colors.primary : '#aaa';
  var cards = DS.Cards[hero.heroClass] || [];
  var card = cards[cardIdx];
  if (!card) { DS.UI.renderTown(root); return; }

  var useCost = DS.Buildings.blacksmith.useCost;
  var newValue = Math.ceil(card.value * 1.5);

  var html =
    '<div class="town-subview">' +
      '<h2 class="town-section-title">CONFIRM UPGRADE</h2>' +
      '<div class="town-confirm-card">' +
        '<div class="town-confirm-hero" style="color:' + color + '">' + heroName + '</div>' +
        '<div class="town-confirm-name">' + card.name + '</div>' +
        '<div class="town-confirm-desc">' + card.desc + '</div>' +
        '<div class="town-confirm-values">' +
          '<span class="town-confirm-old">' + card.value + '</span>' +
          ' &rarr; ' +
          '<span class="town-confirm-new">' + newValue + '</span>' +
          ' (+50%)' +
        '</div>' +
        '<div class="town-confirm-cost">Cost: ' + useCost + 'g</div>' +
      '</div>' +
      '<div class="town-confirm-buttons">' +
        '<button class="btn town-btn-confirm" id="btn-bs-confirm">UPGRADE</button>' +
        '<button class="btn town-btn-back" id="btn-bs-cancel">CANCEL</button>' +
      '</div>' +
    '</div>';

  screen.innerHTML = html;
  root.appendChild(screen);

  document.getElementById('btn-bs-confirm').onclick = function() {
    if (!DS.Meta.spendGold(useCost)) {
      DS.UI._townFlash(root, 'Not enough gold!');
      return;
    }
    DS.Buildings.blacksmith.applyUpgrade(
      { cls: hero.heroClass, upgradedCards: hero.upgradedCards },
      card.id
    );
    // Also update via Meta for save consistency
    DS.Meta.upgradeHeroCard(rosterIdx, card.id);
    DS.Meta.save();
    DS.UI._townFlash(root, card.name + ' upgraded!');
    // Return to card picker for this hero
    DS.UI._townShowBlacksmithCards(root, rosterIdx);
  };

  document.getElementById('btn-bs-cancel').onclick = function() {
    DS.UI._townShowBlacksmithCards(root, rosterIdx);
  };
};

// ===== HELPERS =====

// Find hero definition by class name
DS.UI._townFindHeroDef = function(heroClass) {
  for (var i = 0; i < DS.Heroes.length; i++) {
    if (DS.Heroes[i].cls === heroClass) return DS.Heroes[i];
  }
  return null;
};

// Flash a message on screen (temporary notification)
DS.UI._townFlash = function(root, msg) {
  var existing = root.querySelector('.town-flash');
  if (existing) existing.remove();

  var flash = document.createElement('div');
  flash.className = 'town-flash';
  flash.textContent = msg;
  root.appendChild(flash);
  setTimeout(function() {
    if (flash.parentNode) flash.remove();
  }, 2000);
};

// Confirmation dialog overlay
DS.UI._townShowConfirm = function(root, msg, onConfirm) {
  var existing = root.querySelector('.town-confirm-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'town-confirm-overlay';
  overlay.innerHTML =
    '<div class="town-confirm-box">' +
      '<div class="town-confirm-msg">' + msg + '</div>' +
      '<div class="town-confirm-buttons">' +
        '<button class="btn town-btn-confirm" id="btn-confirm-yes">YES</button>' +
        '<button class="btn town-btn-back" id="btn-confirm-no">NO</button>' +
      '</div>' +
    '</div>';
  root.appendChild(overlay);

  document.getElementById('btn-confirm-yes').onclick = function() {
    overlay.remove();
    onConfirm();
  };
  document.getElementById('btn-confirm-no').onclick = function() {
    overlay.remove();
  };
};

// ===== INJECT TOWN STYLES =====
DS.UI._injectTownStyles = function() {
  if (DS.UI._stylesInjected.town) return;
  DS.UI._stylesInjected.town = true;
  var style = document.createElement('style');
  style.textContent =
    '.screen-town { padding: 20px 24px; max-width: 800px; margin: 0 auto; min-height: 100vh; background: var(--bg-darkest); }' +

    '.town-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid var(--border); }' +
    '.town-header-stats { display: flex; gap: 16px; align-items: center; }' +
    '.town-gold { font-size: 1.2em; color: var(--gold); }' +
    '.town-runs { font-size: 0.9em; color: var(--text-dim); }' +

    '.town-section-title { font-size: 1.1em; color: var(--text-dim); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0; }' +
    '.town-roster { margin-bottom: 28px; }' +
    '.town-roster-list { display: flex; flex-wrap: wrap; gap: 12px; }' +

    '.town-hero-card { background: var(--bg-panel); border: 2px solid var(--border); border-radius: 8px; padding: 14px 16px; min-width: 160px; max-width: 200px; }' +
    '.town-hero-veteran { border-color: var(--gold-dim); }' +
    '.town-hero-name { font-size: 1.1em; font-weight: 700; margin-bottom: 4px; }' +
    '.town-hero-stars { font-size: 0.85em; margin-bottom: 4px; }' +
    '.town-hero-stats { font-size: 0.8em; color: var(--text-dim); display: flex; flex-direction: column; gap: 2px; }' +

    '.town-empty { color: var(--text-dim); font-style: italic; padding: 12px 0; }' +

    '.town-graveyard { margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--border); }' +
    '.town-graveyard-title { font-size: 0.9em; color: var(--crimson-dim); margin: 0 0 6px 0; }' +
    '.town-grave { font-size: 0.8em; color: var(--text-dim); margin-right: 12px; }' +

    '.town-buildings { margin-bottom: 28px; }' +
    '.town-buildings-grid { display: flex; flex-wrap: wrap; gap: 12px; }' +
    '.town-building { background: var(--bg-panel); border: 2px solid var(--border); border-radius: 8px; padding: 16px; min-width: 200px; max-width: 240px; cursor: pointer; transition: border-color 0.2s, transform 0.15s; }' +
    '.town-building:hover { border-color: var(--border-light); transform: translateY(-2px); }' +
    '.town-building-icon { font-size: 1.6em; margin-bottom: 6px; }' +
    '.town-building-name { font-size: 1em; font-weight: 700; color: var(--text-bright); margin-bottom: 4px; }' +
    '.town-building-desc { font-size: 0.8em; color: var(--text-dim); margin-bottom: 6px; line-height: 1.4; }' +
    '.town-building-level { font-size: 0.85em; color: var(--blue); margin-bottom: 2px; }' +
    '.town-building-bonus { font-size: 0.8em; color: var(--green); margin-bottom: 4px; }' +
    '.town-building-cost { font-size: 0.85em; color: var(--gold); font-weight: 700; }' +

    '.town-actions { display: flex; gap: 12px; margin-top: 24px; }' +
    '.town-btn-spire { background: var(--crimson); color: #fff; border: 1px solid var(--crimson-dim); padding: 12px 32px; border-radius: 4px; cursor: pointer; font-size: 1.1em; font-weight: 700; letter-spacing: 2px; }' +
    '.town-btn-spire:hover { background: #d84848; }' +
    '.town-btn-newgame { background: var(--bg-panel); color: var(--text-dim); border: 1px solid var(--border); padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 0.9em; }' +
    '.town-btn-newgame:hover { background: var(--bg-card); }' +

    '.town-subview { max-width: 600px; margin: 0 auto; padding: 40px 20px; }' +
    '.town-sub-desc { font-size: 0.9em; color: var(--text-dim); margin-bottom: 12px; }' +
    '.town-gold-display { font-size: 1.1em; color: var(--gold); margin-bottom: 16px; }' +

    '.town-hero-picker { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }' +
    '.town-pick-hero { background: var(--bg-panel); border: 2px solid var(--border); border-radius: 8px; padding: 14px 18px; cursor: pointer; transition: border-color 0.2s; min-width: 140px; }' +
    '.town-pick-hero:hover { border-color: var(--border-light); }' +
    '.town-pick-hero-name { font-weight: 700; margin-bottom: 4px; }' +
    '.town-pick-hero-info { font-size: 0.8em; color: var(--text-dim); }' +

    '.town-card-picker { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }' +
    '.town-card { background: var(--bg-panel); border: 2px solid var(--border); border-radius: 8px; padding: 14px; min-width: 160px; max-width: 200px; }' +
    '.town-card-available { cursor: pointer; transition: border-color 0.2s, transform 0.15s; }' +
    '.town-card-available:hover { border-color: var(--gold-dim); transform: translateY(-2px); }' +
    '.town-card-done { opacity: 0.5; }' +
    '.town-card-unaffordable { opacity: 0.4; cursor: not-allowed; }' +
    '.town-card-name { font-weight: 700; color: var(--text-bright); margin-bottom: 4px; }' +
    '.town-card-desc { font-size: 0.8em; color: var(--text-dim); margin-bottom: 6px; }' +
    '.town-card-upgraded { font-size: 0.8em; color: var(--green); font-weight: 700; }' +
    '.town-card-upgrade-preview { font-size: 0.85em; color: var(--gold); font-weight: 700; }' +

    '.town-confirm-card { background: var(--bg-panel); border: 2px solid var(--gold-dim); border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center; }' +
    '.town-confirm-hero { font-size: 1.1em; font-weight: 700; margin-bottom: 4px; }' +
    '.town-confirm-name { font-size: 1.2em; font-weight: 700; color: var(--text-bright); margin-bottom: 4px; }' +
    '.town-confirm-desc { font-size: 0.9em; color: var(--text-dim); margin-bottom: 8px; }' +
    '.town-confirm-values { font-size: 1em; margin-bottom: 8px; }' +
    '.town-confirm-old { color: var(--text-dim); }' +
    '.town-confirm-new { color: var(--gold); font-weight: 700; }' +
    '.town-confirm-cost { color: var(--gold); font-weight: 700; }' +

    '.town-confirm-buttons { display: flex; gap: 12px; justify-content: center; }' +
    '.town-btn-confirm { background: var(--green); color: #fff; border: 1px solid var(--green-dim); padding: 10px 28px; border-radius: 4px; cursor: pointer; font-weight: 700; }' +
    '.town-btn-confirm:hover { background: #5cb85c; }' +
    '.town-btn-back { background: var(--bg-panel); color: var(--text-dim); border: 1px solid var(--border); padding: 10px 24px; border-radius: 4px; cursor: pointer; }' +
    '.town-btn-back:hover { background: var(--bg-card); }' +

    '.town-confirm-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }' +
    '.town-confirm-box { background: var(--bg-panel); border: 2px solid var(--border); border-radius: 10px; padding: 28px 36px; text-align: center; max-width: 400px; }' +
    '.town-confirm-msg { font-size: 1em; color: var(--text); margin-bottom: 20px; }' +

    '.town-flash { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: var(--bg-card); color: var(--gold); border: 1px solid var(--gold-dim); padding: 10px 24px; border-radius: 6px; font-weight: 700; z-index: 200; animation: fadeIn 0.2s; }' +
    '@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }';
  document.head.appendChild(style);
};
