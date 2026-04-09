window.DS = window.DS || {};

DS.Caravan = {
  // Transient state for the caravan screen
  _selected: [],       // indices into _pool
  _pool: [],           // { source: 'roster'|'recruit', rosterIdx: N|null, heroDef: {}, cost: N, heroClass: str }

  // ===== GENERATE POOL =====
  // Build the combined pool of roster heroes + fresh recruits
  generatePool: function() {
    var pool = [];
    var rosterClasses = [];

    // 1. Roster heroes (alive) — always free
    DS.Meta.heroRoster.forEach(function(rh, i) {
      if (!rh.alive) return;
      var def = DS.Caravan._findHeroDef(rh.heroClass);
      if (!def) return;
      rosterClasses.push(rh.heroClass);
      pool.push({
        source: 'roster',
        rosterIdx: i,
        heroDef: def,
        heroClass: rh.heroClass,
        cost: 0,
        runsSurvived: rh.runsSurvived
      });
    });

    // 2. Count alive roster heroes for welfare check
    var aliveCount = pool.length;

    // 3. Determine recruit slots
    var totalSlots = DS.Meta.getCaravanSlots();
    var recruitSlots = Math.max(0, totalSlots - pool.length);

    // 4. Welfare rule: if fewer than 2 alive AND gold < 30, guarantee 2 free recruits min
    var welfare = (aliveCount < 2 && DS.Meta.gold < 30);

    // 5. Build available classes (unlocked and not already in roster)
    var unlockedClasses = (DS.Meta && DS.Meta.getUnlockedClasses) ? DS.Meta.getUnlockedClasses() : DS.Heroes.map(function(h) { return h.cls; });
    var available = unlockedClasses.filter(function(cls) {
      return rosterClasses.indexOf(cls) === -1;
    });

    // Shuffle available classes
    DS.Caravan._shuffle(available);

    // 6. Generate recruits — first 2 free ("desperate travelers"), rest cost 30-60g
    var freeCount = welfare ? Math.max(2, recruitSlots) : 2;
    if (welfare) recruitSlots = Math.max(recruitSlots, freeCount);

    for (var r = 0; r < recruitSlots && r < available.length; r++) {
      var cls = available[r];
      var def = DS.Caravan._findHeroDef(cls);
      if (!def) continue;

      var cost = 0;
      if (r >= freeCount) {
        cost = 30 + Math.floor(Math.random() * 31); // 30-60g
      }

      pool.push({
        source: 'recruit',
        rosterIdx: null,
        heroDef: def,
        heroClass: cls,
        cost: cost,
        runsSurvived: 0
      });
    }

    DS.Caravan._pool = pool;
    DS.Caravan._selected = [];

    // Cache recruits so re-renders don't regenerate
    DS.State._caravanRecruits = pool.filter(function(e) { return e.source === 'recruit'; });
  },

  // ===== TOGGLE SELECTION =====
  toggleSelect: function(poolIdx) {
    var entry = DS.Caravan._pool[poolIdx];
    var idx = DS.Caravan._selected.indexOf(poolIdx);
    if (idx !== -1) {
      // Deselect
      DS.Caravan._selected.splice(idx, 1);
    } else {
      // Select (max 4)
      if (DS.Caravan._selected.length >= 4) return;
      // Can't select paid recruit you can't afford
      if (entry.cost > 0 && DS.Meta.gold < DS.Caravan._projectedCost(poolIdx)) return;
      DS.Caravan._selected.push(poolIdx);
    }
  },

  // ===== PROJECTED COST (if this recruit were added to selection) =====
  _projectedCost: function(newPoolIdx) {
    var total = DS.Caravan._pool[newPoolIdx].cost;
    DS.Caravan._selected.forEach(function(idx) {
      total += DS.Caravan._pool[idx].cost;
    });
    return total;
  },

  // ===== TOTAL COST =====
  getSelectionCost: function() {
    var total = 0;
    DS.Caravan._selected.forEach(function(idx) {
      total += DS.Caravan._pool[idx].cost;
    });
    return total;
  },

  // ===== CAN AFFORD =====
  canAfford: function() {
    return DS.Meta.gold >= DS.Caravan.getSelectionCost();
  },

  // ===== EMBARK =====
  embark: function() {
    if (DS.Caravan._selected.length !== 4) return;
    if (!DS.Caravan.canAfford()) return;

    // a. Deduct gold for paid recruits
    var totalCost = DS.Caravan.getSelectionCost();
    if (totalCost > 0) {
      DS.Meta.spendGold(totalCost);
    }

    // b. Add recruited heroes to roster, build _selectedParty
    var selectedParty = [];
    DS.Caravan._selected.forEach(function(poolIdx) {
      var entry = DS.Caravan._pool[poolIdx];
      if (entry.source === 'recruit') {
        DS.Meta.addHeroToRoster(entry.heroClass);
        entry.rosterIdx = DS.Meta.heroRoster.length - 1;
      }
      selectedParty.push({
        rosterIndex: entry.rosterIdx,
        heroClass: entry.heroClass
      });
    });

    // c. Save
    DS.Meta.save();

    // d. Store selected party
    DS.State._selectedParty = selectedParty;
    DS.State.selectedHeroes = selectedParty.map(function(p) { return p.rosterIndex; });

    // Clean up caravan state
    DS.Caravan._pool = [];
    DS.Caravan._selected = [];
    DS.State._caravanRecruits = null;

    // e. Navigate to map
    DS.State.screen = 'map';

    // f. Start the run
    if (DS.Game && DS.Game.startRun) {
      DS.Game.startRun();
    }
  },

  // ===== HELPERS =====
  _findHeroDef: function(cls) {
    for (var i = 0; i < DS.Heroes.length; i++) {
      if (DS.Heroes[i].cls === cls) return DS.Heroes[i];
    }
    return null;
  },

  _shuffle: function(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  },

  _getEffectiveMaxHp: function(entry) {
    var base = entry.heroDef.maxHp;
    var chapel = DS.Meta.getChapelBonus();
    var veteran = (entry.runsSurvived || 0) * 5;
    return base + chapel + veteran;
  }
};

// ===== UI RENDERING =====

DS.UI.renderCaravan = function(root) {
  root.innerHTML = '';
  var screen = document.createElement('div');
  screen.className = 'screen caravan-screen';

  DS.UI._injectCaravanStyles();

  // Generate pool if not done (use cached recruits to avoid regeneration)
  if (!DS.Caravan._pool.length) {
    DS.Caravan.generatePool();
  }

  var pool = DS.Caravan._pool;
  var selected = DS.Caravan._selected;

  // Split pool into roster and recruits
  var roster = [];
  var recruits = [];
  pool.forEach(function(entry, i) {
    entry._poolIdx = i;
    if (entry.source === 'roster') roster.push(entry);
    else recruits.push(entry);
  });

  // === HEADER ===
  var headerHtml =
    '<div class="caravan-header">' +
      '<div>' +
        '<h1 class="caravan-title">The Caravan Arrives...</h1>' +
        '<div class="caravan-subtitle">Select 4 heroes for your expedition.</div>' +
      '</div>' +
      '<div class="caravan-gold">\uD83D\uDCB0 ' + DS.Meta.gold + ' Gold</div>' +
    '</div>';

  // === VETERAN HEROES section ===
  var rosterHtml = '';
  if (roster.length > 0) {
    rosterHtml = '<div class="caravan-section">' +
      '<h2 class="caravan-section-title">Veteran Heroes</h2>' +
      '<div class="caravan-cards">';
    roster.forEach(function(entry) {
      rosterHtml += DS.UI._buildCaravanCard(entry, selected);
    });
    rosterHtml += '</div></div>';
  }

  // === TRAVELERS SEEKING WORK section ===
  var recruitsHtml = '<div class="caravan-section">' +
    '<h2 class="caravan-section-title">Travelers Seeking Work</h2>' +
    '<div class="caravan-cards">';
  if (recruits.length === 0) {
    recruitsHtml += '<div class="caravan-empty">No travelers in sight.</div>';
  }
  recruits.forEach(function(entry) {
    recruitsHtml += DS.UI._buildCaravanCard(entry, selected);
  });
  recruitsHtml += '</div></div>';

  // === SELECTED PARTY BAR ===
  var partyHtml = DS.UI._buildCaravanPartyBar(pool, selected);

  // === BUTTONS ===
  var canEmbark = selected.length === 4 && DS.Caravan.canAfford();
  var totalCost = DS.Caravan.getSelectionCost();
  var buttonsHtml =
    '<div class="caravan-buttons">' +
      '<button class="btn caravan-btn-back" id="caravan-back">Back to Town</button>' +
      '<button class="btn caravan-btn-embark' + (canEmbark ? '' : ' caravan-btn-disabled') + '" id="caravan-embark">' +
        'Embark!' + (totalCost > 0 ? ' (\uD83D\uDCB0 ' + totalCost + 'g)' : '') +
      '</button>' +
    '</div>';

  screen.innerHTML = headerHtml + rosterHtml + recruitsHtml + partyHtml + buttonsHtml;
  root.appendChild(screen);

  // Wire up card clicks
  pool.forEach(function(entry, i) {
    var card = root.querySelector('[data-caravan-idx="' + i + '"]');
    if (!card) return;
    card.style.cursor = 'pointer';
    card.onclick = function() {
      DS.Caravan.toggleSelect(i);
      DS.UI.renderCaravan(root);
    };
  });

  // Wire up embark
  var embarkBtn = document.getElementById('caravan-embark');
  if (embarkBtn) {
    embarkBtn.onclick = function() {
      if (selected.length !== 4 || !DS.Caravan.canAfford()) return;
      DS.Caravan.embark();
    };
  }

  // Wire up back
  var backBtn = document.getElementById('caravan-back');
  if (backBtn) {
    backBtn.onclick = function() {
      DS.Caravan._pool = [];
      DS.Caravan._selected = [];
      DS.State._caravanRecruits = null;
      DS.State.screen = 'town';
      DS.UI.render();
    };
  }
};

// ===== BUILD HERO CARD HTML =====
DS.UI._buildCaravanCard = function(entry, selected) {
  var isSelected = selected.indexOf(entry._poolIdx) !== -1;
  var def = entry.heroDef;
  var color = def.colors.primary;
  var effectiveHp = DS.Caravan._getEffectiveMaxHp(entry);
  var isRoster = entry.source === 'roster';
  var isPaid = entry.cost > 0;
  var cantAfford = isPaid && DS.Meta.gold < entry.cost;

  var classes = 'caravan-hero-card';
  if (isSelected) classes += ' caravan-hero-selected';
  if (isPaid) classes += ' caravan-hero-paid';
  else classes += ' caravan-hero-free';
  if (cantAfford && !isSelected) classes += ' caravan-card-unaffordable';

  var html =
    '<div class="' + classes + '" data-caravan-idx="' + entry._poolIdx + '" style="border-color:' + (isSelected ? color : 'transparent') + '">' +
      '<div class="caravan-card-inner" style="background: linear-gradient(135deg, ' + def.colors.secondary + ', #1a1a2e)">' +
        '<div class="caravan-card-name" style="color:' + color + '">' + def.name + '</div>' +
        '<div class="caravan-card-class">' + entry.heroClass + '</div>' +
        '<div class="caravan-card-stats">' +
          '<span class="caravan-stat">\u2764 ' + effectiveHp + ' HP</span>' +
          '<span class="caravan-stat">Pos ' + def.startPos + '</span>' +
        '</div>';

  // Veteran stars
  if (entry.runsSurvived > 0) {
    var stars = '';
    for (var s = 0; s < entry.runsSurvived; s++) stars += '\u2B50';
    html += '<div class="caravan-veteran-badge">' + stars + '</div>';
  }

  // Cost badge
  if (isPaid) {
    html += '<div class="caravan-cost-badge">\uD83D\uDCB0 ' + entry.cost + 'g</div>';
  } else {
    html += '<div class="caravan-cost-badge caravan-badge-free">FREE</div>';
  }

  html += '</div></div>';
  return html;
};

// ===== BUILD PARTY BAR =====
DS.UI._buildCaravanPartyBar = function(pool, selected) {
  var totalCost = DS.Caravan.getSelectionCost();
  var html = '<div class="caravan-party-bar">' +
    '<div class="caravan-party-header">' +
      '<h3 class="caravan-party-title">Selected Party (' + selected.length + '/4)</h3>' +
      (totalCost > 0 ? '<span class="caravan-party-cost">Total: \uD83D\uDCB0 ' + totalCost + 'g</span>' : '') +
    '</div>' +
    '<div class="caravan-party-slots">';

  // Build party sorted by startPos
  var party = [];
  selected.forEach(function(idx) {
    party.push(pool[idx]);
  });
  party.sort(function(a, b) {
    return a.heroDef.startPos - b.heroDef.startPos;
  });

  for (var slot = 0; slot < 4; slot++) {
    if (slot < party.length) {
      var entry = party[slot];
      var color = entry.heroDef.colors.primary;
      html +=
        '<div class="caravan-party-slot" style="border-color:' + color + '">' +
          '<div class="caravan-slot-name" style="color:' + color + '">' + entry.heroDef.name + '</div>' +
          '<div class="caravan-slot-pos">Pos ' + entry.heroDef.startPos + '</div>' +
        '</div>';
    } else {
      html += '<div class="caravan-party-slot caravan-party-slot-empty"><div class="caravan-slot-label">Empty</div></div>';
    }
  }

  html += '</div></div>';
  return html;
};

// ===== CARAVAN STYLES =====
DS.UI._injectCaravanStyles = function() {
  if (document.getElementById('caravan-styles')) return;
  var style = document.createElement('style');
  style.id = 'caravan-styles';
  style.textContent =
    '.caravan-screen { padding: 20px; max-width: 800px; margin: 0 auto; }' +

    '.caravan-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 1px solid #444; padding-bottom: 12px; }' +
    '.caravan-title { font-size: 1.6em; color: #e0c080; margin: 0; }' +
    '.caravan-subtitle { font-size: 0.9em; color: #888; margin-top: 4px; }' +
    '.caravan-gold { font-size: 1.2em; color: #ffd700; white-space: nowrap; }' +

    '.caravan-section { margin-bottom: 24px; }' +
    '.caravan-section-title { font-size: 1.1em; color: #aaa; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px; }' +
    '.caravan-empty { color: #666; font-style: italic; padding: 12px; }' +

    '.caravan-cards { display: flex; flex-wrap: wrap; gap: 12px; }' +

    '.caravan-hero-card { border: 2px solid transparent; border-radius: 8px; transition: border-color 0.2s, transform 0.15s, opacity 0.2s; width: 160px; }' +
    '.caravan-hero-card:hover { transform: translateY(-2px); }' +
    '.caravan-hero-selected { border-width: 3px; box-shadow: 0 0 12px rgba(255,255,255,0.15); }' +
    '.caravan-card-unaffordable { opacity: 0.45; }' +
    '.caravan-card-inner { border-radius: 6px; padding: 14px 12px; min-height: 120px; display: flex; flex-direction: column; gap: 6px; }' +
    '.caravan-card-name { font-size: 1.1em; font-weight: bold; }' +
    '.caravan-card-class { font-size: 0.8em; color: #888; text-transform: uppercase; letter-spacing: 1px; }' +
    '.caravan-card-stats { font-size: 0.85em; color: #ccc; display: flex; gap: 10px; }' +

    '.caravan-veteran-badge { font-size: 0.85em; color: #ffd700; }' +

    '.caravan-cost-badge { font-size: 0.9em; font-weight: bold; margin-top: auto; padding-top: 4px; }' +
    '.caravan-hero-paid .caravan-cost-badge { color: #ffd700; }' +
    '.caravan-badge-free { color: #6c6; }' +

    '.caravan-party-bar { background: #1a1a2e; border: 1px solid #333; border-radius: 8px; padding: 14px; margin-bottom: 20px; }' +
    '.caravan-party-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }' +
    '.caravan-party-title { margin: 0; font-size: 0.95em; color: #aaa; }' +
    '.caravan-party-cost { font-size: 0.9em; color: #ffd700; }' +
    '.caravan-party-slots { display: flex; gap: 12px; }' +
    '.caravan-party-slot { flex: 1; border: 2px solid #444; border-radius: 6px; padding: 10px; text-align: center; min-height: 50px; display: flex; flex-direction: column; justify-content: center; background: rgba(255,255,255,0.03); }' +
    '.caravan-party-slot-empty { border-style: dashed; background: none; color: #555; }' +
    '.caravan-slot-pos { font-size: 0.75em; color: #888; }' +
    '.caravan-slot-name { font-size: 0.95em; font-weight: bold; }' +
    '.caravan-slot-label { font-size: 0.85em; }' +

    '.caravan-buttons { display: flex; justify-content: space-between; gap: 12px; margin-top: 16px; }' +
    '.caravan-btn-back { background: #333; color: #aaa; border: 1px solid #555; padding: 10px 24px; border-radius: 4px; cursor: pointer; font-size: 1em; }' +
    '.caravan-btn-back:hover { background: #444; }' +
    '.caravan-btn-embark { background: #2a6e2a; color: #fff; border: 1px solid #3a8e3a; padding: 10px 32px; border-radius: 4px; cursor: pointer; font-size: 1.1em; font-weight: bold; }' +
    '.caravan-btn-embark:hover { background: #3a8e3a; }' +
    '.caravan-btn-disabled { opacity: 0.4; cursor: not-allowed !important; }' +
    '.caravan-btn-disabled:hover { background: #2a6e2a; }';
  document.head.appendChild(style);
};
