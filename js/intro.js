window.DS = window.DS || {};

// ============================================================
// THE CAMPFIRE — Darkspire's stagecoach.
// Every expedition begins here. Outside-run screens are
// Darkest-Dungeon-side: dark, gothic, torchlit. Survivors and
// fresh recruits gather at the fire; the dead are stones at
// the edge of the light. Pick 4 heroes — CLICK ORDER = battle
// positions 1-4 (first chosen holds the front) — then descend.
//
// Flow: boot -> campfire -> BEGIN THE DESCENT -> DS.Game.startRun()
// Town is reachable from here ("VISIT THE TOWN") and routes back
// via the town's "Enter the Spire" button.
// ============================================================

DS.Campfire = {
  // --- Open balance params — TODO(Joel): tune these ---
  RECRUIT_MIN: 2,     // fresh recruits offered per campfire visit (min)
  RECRUIT_MAX: 4,     // ...and max (the first tutorial upgrade fields five)
  RECRUIT_COST: 0,    // recruits are FREE (DD stagecoach). Raise if joining should cost gold.
  ROSTER_CAP: 8,      // max living heroes on the persistent roster
  PARTY_SIZE: 5,      // the first tavern upgrade is granted immediately

  // Transient (per-visit) state — NOT persisted. The roster itself
  // lives in DS.Meta.heroRoster (already saved/loaded by meta.js).
  _offer: null,       // [{source:'roster'|'recruit', rosterIdx, heroClass, heroDef, runsSurvived}]
  _selected: [],
  _artifacts: [],      // indices into _offer, in CLICK ORDER (order = positions 1..4)

  // ===== ENTER (a fresh visit — rerolls the recruit offer) =====
  enter: function() {
    DS.Campfire._offer = null;
    DS.Campfire._selected = [];
    DS.Campfire._artifacts = [];
    DS.State.screen = 'campfire';
    DS.UI.render();
  },

  // ===== BUILD THE OFFER (veterans + fresh recruits) =====
  _buildOffer: function() {
    var pool = [];
    var rosterClasses = [];

    // 1. Living roster heroes (the veterans). Dead heroes were spliced
    //    out by DS.Meta.killHero and live only in DS.Meta.graveyard.
    (DS.Meta.heroRoster || []).forEach(function(rh, i) {
      if (rh.alive === false) return; // belt-and-braces; dead are normally removed
      var def = DS.Campfire._heroDef(rh.heroClass);
      if (!def) return;
      rosterClasses.push(rh.heroClass);
      pool.push({
        source: 'roster',
        rosterIdx: i,
        heroClass: rh.heroClass,
        heroDef: def,
        runsSurvived: rh.runsSurvived || 0,
        name: rh.name || def.name,
        variant: (DS.Meta.getKitVariant && DS.Meta.getKitVariant(rh)) || rh.variant || 'standard',
        level: rh.level || 1,        // RPG layer fields — default when absent
        xp: rh.xp || 0,
        injury: rh.injury || null    // display-only slot; injury logic comes later
      });
    });
    var aliveCount = pool.length;

    // 2. Fresh recruits — rolled by the pluggable DS.Meta.rollRecruit stub
    //    (the RPG-layer generator will replace its internals; this screen
    //    only depends on the {heroClass, name, variant, level, xp} shape).
    //    One hero per class for now: the engine matches roster heroes by class.
    var span = DS.Campfire.RECRUIT_MAX - DS.Campfire.RECRUIT_MIN;
    var want = DS.Campfire.RECRUIT_MIN + Math.floor(Math.random() * (span + 1));
    var needed = Math.max(0, DS.Campfire.PARTY_SIZE - aliveCount); // always offer enough to field a party
    var count = Math.max(want, needed);
    count = Math.min(count,
      Math.max(0, DS.Campfire.ROSTER_CAP - aliveCount)); // respect the roster cap

    var taken = rosterClasses.slice();
    for (var r = 0; r < count; r++) {
      var rolled = (DS.Meta.rollRecruit) ? DS.Meta.rollRecruit(taken) : null;
      if (!rolled) break;   // no classes left to roll
      var def2 = DS.Campfire._heroDef(rolled.heroClass);
      if (!def2) break;
      taken.push(rolled.heroClass);
      pool.push({
        source: 'recruit',
        rosterIdx: null,
        recruit: rolled,             // the actual rolled entry joins the roster at embark
        heroClass: rolled.heroClass,
        heroDef: def2,
        runsSurvived: 0,
        name: rolled.name || def2.name,
        variant: (DS.Meta.getKitVariant && DS.Meta.getKitVariant(rolled)) || rolled.variant || 'standard',
        level: rolled.level || 1,
        xp: rolled.xp || 0,
        injury: null
      });
    }

    DS.Campfire._offer = pool;
  },

  // ===== SELECTION (click order = positions 1..4) =====
  toggleSelect: function(offerIdx) {
    var sel = DS.Campfire._selected;
    var at = sel.indexOf(offerIdx);
    if (at !== -1) {
      sel.splice(at, 1);           // deselect — later picks shift up a rank
    } else {
      if (sel.length >= DS.Campfire.PARTY_SIZE) return; // party is full
      sel.push(offerIdx);
    }
  },

  // ===== BEGIN THE DESCENT =====
  embark: function() {
    if (DS.Campfire._selected.length !== DS.Campfire.PARTY_SIZE) return;

    var party = [];
    DS.Campfire._selected.forEach(function(offerIdx) {
      var entry = DS.Campfire._offer[offerIdx];
      if (entry.source === 'recruit' && entry.rosterIdx === null) {
        // Recruits join the permanent roster the moment they march
        // (addHeroToRoster persists via DS.Meta.save()).
        // Push the SAME rolled entry the player saw at the fire (kit, level,
        // xp travel with it) — passing just the class would re-roll the kit.
        entry.rosterIdx = DS.Meta.addHeroToRoster(entry.recruit || entry.heroClass);
        var rh = DS.Meta.heroRoster[entry.rosterIdx];
        if (rh) rh.name = entry.name;
      }
      party.push({ rosterIndex: entry.rosterIdx, heroClass: entry.heroClass });
    });

    // Click order becomes battle order: state.newRun assigns pos = index + 1.
    DS.State._selectedArtifacts = DS.Campfire._artifacts.slice();
    DS.State._selectedParty = party;
    DS.State.selectedHeroes = party.map(function(p) { return p.rosterIndex; });
    DS.Meta.save();

    DS.Campfire._offer = null;
    DS.Campfire._selected = [];

    DS.Game.startRun();
  },

  // ===== HELPERS =====
  _heroDef: function(cls) {
    for (var i = 0; i < DS.Heroes.length; i++) {
      if (DS.Heroes[i].cls === cls) return DS.Heroes[i];
    }
    return null;
  },

  _heroDefIdx: function(cls) {
    for (var i = 0; i < DS.Heroes.length; i++) {
      if (DS.Heroes[i].cls === cls) return i;
    }
    return -1;
  },

  // Mirrors state.newRun: base + chapel bonus + 5 HP per run survived
  _effectiveMaxHp: function(entry) {
    var chapel = (DS.Meta.getChapelBonus) ? DS.Meta.getChapelBonus() : 0;
    var rh = entry.source === 'roster' ? DS.Meta.heroRoster[entry.rosterIdx] : entry.recruit;
    var gearHp = rh && DS.Gear ? DS.Gear.getEquipped(rh).reduce(function(n, item) { return n + ((item.mods && item.mods.maxHp) || 0); }, 0) : 0;
    return Math.max(1, entry.heroDef.maxHp + chapel + ((rh || entry).maxHpBonus || 0) + (entry.runsSurvived || 0) * 5 - DS.Meta.getInjuryPenalty(rh || entry)) + gearHp;
  },

  // Gothic flavor lines, per class
  _flavor: {
    fighter:     'A wall of iron between the dark and the dying.',
    rogue:       'Two knives. No questions.',
    cleric:      'The light endures, even down here.',
    wizard:      'Reads the fire like scripture.',
    barbarian:   'Rage burns warmer than any fire.',
    necromancer: 'Death owes him favors.',
    paladin:     'An oath, kept past the point of sense.',
    ranger:      'Eyes on the treeline. Always.'
  }
};

// ============================================================
// RENDERING
// ============================================================

DS.UI.renderCampfire = function(root) {
  root.innerHTML = '';

  if (!DS.Campfire._offer) DS.Campfire._buildOffer();
  var offer = DS.Campfire._offer;
  var selected = DS.Campfire._selected;

  var screen = document.createElement('div');
  screen.className = 'screen campfire-screen';

  // --- Static scene scaffolding ---
  var html =
    '<div class="campfire-vignette"></div>' +
    '<div class="campfire-glow campfire-glow-a"></div>' +
    '<div class="campfire-glow campfire-glow-b"></div>' +

    '<div class="campfire-header">' +
      '<h1 class="campfire-title">DARKSPIRE</h1>' +
      '<div class="campfire-subtitle">The fire is low. The Spire waits.</div>' +
    '</div>' +

    '<div class="campfire-gold">💰 ' + DS.Meta.gold + '</div>' +

    '<div class="campfire-arc" id="campfire-arc"></div>' +

    '<div class="campfire-fire">' +
      '<div class="fire-flame fire-flame-back"></div>' +
      '<div class="fire-flame fire-flame-mid"></div>' +
      '<div class="fire-flame fire-flame-front"></div>' +
      '<div class="fire-log fire-log-l"></div>' +
      '<div class="fire-log fire-log-r"></div>' +
    '</div>' +

    '<div class="campfire-hint">Choose five — in the order they will stand. The first chosen holds the front.</div>' +

    '<div class="campfire-party" id="campfire-party"></div>' +

    '<div class="campfire-buttons" id="campfire-buttons"></div>' +

    '<div class="campfire-graves" id="campfire-graves"></div>';

  screen.innerHTML = html;
  root.appendChild(screen);

  // --- Hero arc (veterans + recruits around the fire) ---
  var arc = screen.querySelector('#campfire-arc');
  var n = offer.length;
  offer.forEach(function(entry, i) {
    var selIdx = selected.indexOf(i);
    var isSel = selIdx !== -1;
    var def = entry.heroDef;
    var color = def.colors.primary;

    var card = document.createElement('div');
    card.className = 'campfire-hero' +
      (isSel ? ' campfire-hero-selected' : '') +
      (entry.source === 'recruit' ? ' campfire-hero-recruit' : '');
    // Shallow arc: cards farther from center sit higher (around the fire)
    var mid = (n - 1) / 2;
    var lift = Math.round(Math.pow(Math.abs(i - mid), 1.4) * 10);
    card.style.transform = 'translateY(' + (-lift) + 'px)';

    // Position badge (1-4) when selected
    var badge = isSel ? '<div class="campfire-pos-badge">' + (selIdx + 1) + '</div>' : '';

    // Veteran stars / recruit tag
    var tag;
    if (entry.source === 'recruit') {
      tag = '<div class="campfire-hero-tag campfire-tag-recruit">newly arrived</div>';
    } else if (entry.runsSurvived > 0) {
      var stars = '';
      for (var s = 0; s < Math.min(entry.runsSurvived, 5); s++) stars += '★';
      tag = '<div class="campfire-hero-tag campfire-tag-veteran">' + stars + '</div>';
    } else {
      tag = '<div class="campfire-hero-tag">untested</div>';
    }

    // Level / XP line (RPG-layer fields; defaults shown when absent)
    var lvlLine = 'Lv ' + (entry.level || 1);
    if (entry.xp) lvlLine += ' · ' + entry.xp + ' XP';

    // Injury tag slot — display-only. Injury LOGIC is a future system; if a
    // roster entry carries an `injury` string it shows here, else stays empty.
    var injuryHtml = entry.injury ?
      '<div class="campfire-hero-injury">' + entry.injury + '</div>' : '';

    card.innerHTML =
      badge +
      '<div class="campfire-hero-sprite"></div>' +
      '<div class="campfire-hero-name" style="color:' + color + '">' + (entry.name || def.name) + '</div>' +
      '<div class="campfire-hero-class">' + entry.heroClass + ' · ' + (entry.variant || 'standard') + '</div>' +
      '<div class="campfire-hero-hp">' + lvlLine + ' · ❤ ' + DS.Campfire._effectiveMaxHp(entry) + ' HP</div>' +
      tag +
      injuryHtml +
      '<div class="campfire-hero-flavor">' + (DS.Campfire._flavor[entry.heroClass] || 'A stranger to the fire.') + '</div>';

    // Reuse the combat sprite builder so the figures match in-run visuals
    var spriteSlot = card.querySelector('.campfire-hero-sprite');
    var defIdx = DS.Campfire._heroDefIdx(entry.heroClass);
    if (defIdx !== -1 && DS.UI.buildSprite) {
      spriteSlot.appendChild(DS.UI.buildSprite(
        { isHero: true, heroIdx: defIdx, cls: entry.heroClass, name: def.name }, 'right'));
    }

    card.onclick = function() {
      DS.Campfire.toggleSelect(i);
      DS.UI.renderCampfire(root);
    };

    arc.appendChild(card);
  });

  // --- Party order bar (1 = front ... 4 = back) ---
  var partyBar = screen.querySelector('#campfire-party');
  var slotsHtml = '';
  var posLabels = ['FRONT', '2ND', '3RD', 'BACK'];
  for (var slot = 0; slot < 4; slot++) {
    if (slot < selected.length) {
      var e = offer[selected[slot]];
      slotsHtml +=
        '<div class="campfire-slot campfire-slot-filled" style="border-color:' + e.heroDef.colors.primary + '">' +
          '<div class="campfire-slot-pos">' + (slot + 1) + ' · ' + posLabels[slot] + '</div>' +
          '<div class="campfire-slot-name" style="color:' + e.heroDef.colors.primary + '">' + (e.name || e.heroDef.name) + '</div>' +
        '</div>';
    } else {
      slotsHtml +=
        '<div class="campfire-slot campfire-slot-empty">' +
          '<div class="campfire-slot-pos">' + (slot + 1) + ' · ' + posLabels[slot] + '</div>' +
          '<div class="campfire-slot-name">—</div>' +
        '</div>';
    }
  }
  partyBar.innerHTML = slotsHtml;

  // --- Buttons ---
  var btns = screen.querySelector('#campfire-buttons');
  var ready = selected.length === 5;
  var updateNotice = DS.State.migrationNotice || DS.Meta.progressionNotice;
  var btnHtml =
    (updateNotice ? '<div class="ds-update-notice" role="status"><strong>UPDATED</strong><span>' + updateNotice + '</span><button class="btn ds-update-dismiss" id="btn-dismiss-update">DISMISS</button></div>' : '') +
    '<button class="btn campfire-btn-descend' + (ready ? '' : ' campfire-btn-disabled') + '" id="btn-descend">' +
      'BEGIN THE DESCENT' + (ready ? '' : ' (' + selected.length + '/5)') +
    '</button>' +
    '<button class="btn campfire-btn-town" id="btn-visit-town">VISIT THE TOWN</button>';
  if (DS.State.hasRunSave && DS.State.hasRunSave()) {
    btnHtml += '<button class="btn campfire-btn-resume" id="btn-resume-expedition">RESUME EXPEDITION</button>';
  }
  btns.innerHTML = btnHtml;

  var dismissUpdate = document.getElementById('btn-dismiss-update');
  if (dismissUpdate) dismissUpdate.onclick = function() {
    DS.State.migrationNotice = null;
    DS.Meta.progressionNotice = null;
    DS.UI.renderCampfire(root);
  };

  document.getElementById('btn-descend').onclick = function() {
    if (DS.Campfire._selected.length !== 4) return;
    DS.Campfire.embark();
  };
  document.getElementById('btn-visit-town').onclick = function() {
    // Leaving = end of this visit; next campfire entry rerolls recruits
    DS.Campfire._offer = null;
    DS.Campfire._selected = [];
    DS.State.screen = 'town';
    DS.UI.render();
  };
  var resumeBtn = document.getElementById('btn-resume-expedition');
  if (resumeBtn) {
    resumeBtn.onclick = function() {
      if (DS.State.load()) {
        DS.UI.render();
      } else {
        DS.State.deleteRunSave();   // corrupt save — clear and stay at the fire
        DS.UI.render();
      }
    };
  }

  // --- The Fallen (graveyard flavor at the edge of the light) ---
  var graves = screen.querySelector('#campfire-graves');
  var dead = (DS.Meta.graveyard || []);
  if (dead.length > 0) {
    var shown = dead.slice(-6);   // most recent 6
    var gHtml = '<div class="campfire-graves-label">The Fallen</div><div class="campfire-graves-row">';
    shown.forEach(function(g) {
      var def = DS.Campfire._heroDef(g.heroClass);
      gHtml +=
        '<div class="campfire-grave" title="' + (def ? def.name : g.heroClass) +
          ' — lost on expedition ' + ((g.runNumber || 0) + 1) + '">' +
          '<div class="campfire-grave-stone"></div>' +
          '<div class="campfire-grave-name">' + (def ? def.name : g.heroClass) + '</div>' +
        '</div>';
    });
    if (dead.length > shown.length) {
      gHtml += '<div class="campfire-grave campfire-grave-more">+' + (dead.length - shown.length) + ' more</div>';
    }
    gHtml += '</div>';
    graves.innerHTML = gHtml;
  }
};
