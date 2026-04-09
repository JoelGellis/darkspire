window.DS = window.DS || {};

DS.UI = {
  // ===== MAIN RENDER DISPATCHER =====
  render: function() {
    var root = document.getElementById('game-root');
    var screen = DS.State.screen;

    if (screen === 'title') {
      DS.UI.renderTitle(root);
    } else if (screen === 'map') {
      DS.UI.renderMap(root);
    } else if (screen === 'combat') {
      DS.UI.renderCombat(root);
    } else if (screen === 'reward') {
      DS.UI.renderReward(root);
    } else if (screen === 'rest') {
      DS.UI.renderRest(root);
    } else if (screen === 'event') {
      DS.UI.renderEvent(root);
    } else if (screen === 'shop') {
      DS.UI.renderShop(root);
    } else if (screen === 'gameover') {
      DS.UI.renderGameOver(root);
    } else if (screen === 'town') {
      DS.UI.renderTown(root);
    } else if (screen === 'caravan') {
      DS.UI.renderCaravan(root);
    } else if (screen === 'summary') {
      DS.UI.renderSummary(root);
    }
  },

  // ===== RELIC ICONS HTML =====
  buildRelicIcons: function(relics) {
    if (!relics || !relics.length) return '';
    var html = '<div class="relic-icons">';
    relics.forEach(function(r) {
      html += '<span class="relic-icon" title="' + r.name + ': ' + r.desc + '">' + r.icon + '</span>';
    });
    html += '</div>';
    return html;
  },

  // ===== HERO STATUS BAR HTML (for map/event/shop) =====
  buildPartyBar: function() {
    var run = DS.State.run;
    if (!run) return '';
    var html = '<div class="party-bar">';
    run.heroes.forEach(function(h) {
      var pct = Math.max(0, (h.hp / h.maxHp) * 100);
      var color = h.hp <= 0 ? '#ff4040' : DS.Heroes[h.heroIdx].colors.primary;
      html +=
        '<div class="party-hero">' +
          '<div class="party-hero-name" style="color:' + color + '">' + h.name + '</div>' +
          '<div class="party-hero-hp">' + (h.hp <= 0 ? 'DEAD' : h.hp + '/' + h.maxHp) + '</div>' +
          '<div class="hp-bar-outer"><div class="hp-bar-inner hero-hp" style="width:' + pct + '%"></div></div>' +
        '</div>';
    });
    html += '</div>';
    return html;
  },

  // ===== TITLE SCREEN =====
  renderTitle: function(root) {
    root.innerHTML = '';
    var screen = document.createElement('div');
    screen.className = 'screen screen-title';
    var hasSave = DS.Meta && DS.Meta.hasSave();
    screen.innerHTML =
      '<div class="title-bg">' +
        '<div class="title-particles"></div>' +
        '<div class="title-content">' +
          '<div class="title-icon">\u2620\uFE0F</div>' +
          '<h1 class="title-text">DARKSPIRE</h1>' +
          '<div class="title-sub">Descend into darkness. Draw your cards. Survive.</div>' +
          (hasSave ? '<button class="btn btn-new-run" id="btn-continue">CONTINUE</button>' : '') +
          '<button class="btn btn-new-run" id="btn-new-game">NEW GAME</button>' +
        '</div>' +
      '</div>';
    root.appendChild(screen);
    if (hasSave) {
      document.getElementById('btn-continue').onclick = function() {
        DS.Meta.load();
        DS.State.screen = 'town';
        DS.UI.render();
      };
    }
    document.getElementById('btn-new-game').onclick = function() {
      DS.Meta.newGame();
      DS.State.screen = 'town';
      DS.UI.render();
    };
  },

  // ===== MAP SCREEN =====
  renderMap: function(root) {
    root.innerHTML = '';
    var screen = document.createElement('div');
    screen.className = 'screen screen-map';

    var run = DS.State.run;
    if (!run || !run.map) return;

    // Inject map-specific styles
    DS.UI._injectMapStyles();

    // Header
    var headerHtml =
      '<div class="map-header">' +
        '<div class="map-header-left">' +
          '<h1 class="game-title">DARKSPIRE</h1>' +
          '<span class="floor-indicator">Floor ' + run.floor + '</span>' +
          '<span class="gold-display map-gold">\uD83D\uDCB0 ' + run.gold + '</span>' +
        '</div>' +
        '<div class="map-header-right">' +
          DS.UI.buildRelicIcons(run.relics) +
        '</div>' +
      '</div>';

    // Map container
    var mapHtml = '<div class="map-body"><div id="map-canvas-container"></div></div>';

    // Party status
    var partyHtml = DS.UI.buildPartyBar();

    // Deck count + view button
    var deckHtml = '<div class="map-deck-info">Deck: ' + run.deck.length + ' cards <button class="btn btn-view-deck-small" id="btn-map-deck">VIEW DECK</button></div>';

    screen.innerHTML = headerHtml + mapHtml + '<div class="map-footer">' + partyHtml + deckHtml + '</div>';
    root.appendChild(screen);

    document.getElementById('btn-map-deck').onclick = function() {
      DS.UI.showDeckViewer();
    };

    // Render the canvas map
    var mapContainer = document.getElementById('map-canvas-container');
    DS.Map.render(mapContainer, run.map, run.currentNode, function(nodeId) {
      DS.Game.selectNode(nodeId);
    });
  },

  // ===== COMBAT SCREEN (STS-style) =====
  renderCombat: function(root) {
    var combat = DS.State.combat;
    var run = DS.State.run;
    if (!combat || !run) return;

    DS.UI._injectCombatStyles();

    if (!root.querySelector('.screen-combat')) {
      root.innerHTML = '';
      var screen = document.createElement('div');
      screen.className = 'screen screen-combat';

      var relicHtml = DS.UI.buildRelicIcons(run.relics);

      screen.innerHTML =
        '<div class="combat-top-bar">' +
          '<div class="top-bar-left">' +
            '<span class="floor-tag">FLOOR ' + run.floor + '</span>' +
            relicHtml +
          '</div>' +
          '<div class="top-bar-center">' +
            '<span class="turn-phase-indicator" id="turn-phase">' +
              (combat.animating ? 'ENEMY TURN' : 'YOUR TURN') +
            '</span>' +
          '</div>' +
          '<div class="top-bar-right">' +
            '<span class="gold-tag">\uD83D\uDCB0 <span id="gold-count">' + run.gold + '</span></span>' +
          '</div>' +
        '</div>' +
        '<div class="combat-stage">' +
          '<div class="stage-heroes" id="heroes-panel"></div>' +
          '<div class="stage-divider"></div>' +
          '<div class="stage-enemies" id="enemies-panel"></div>' +
          '<div class="combat-log-overlay" id="log-area">' +
            '<div id="log-entries"></div>' +
          '</div>' +
        '</div>' +
        '<div class="combat-bottom">' +
          '<div class="pile-slot draw-slot" id="btn-draw-pile">' +
            '<div class="pile-stack">' +
              '<div class="pile-card-back"></div>' +
              '<div class="pile-card-back"></div>' +
              '<div class="pile-card-back"></div>' +
            '</div>' +
            '<span class="pile-label">DRAW</span>' +
            '<span class="pile-count" id="deck-count">0</span>' +
          '</div>' +
          '<div class="energy-orb" id="energy-display">' +
            '<span class="energy-value">' + combat.energy + '/' + combat.maxEnergy + '</span>' +
          '</div>' +
          '<div class="hand-fan" id="hand-cards"></div>' +
          '<button class="btn btn-end-turn" id="btn-end-turn">' +
            '<span class="end-turn-text">END<br>TURN</span>' +
            '<span class="turn-num">Turn <span id="turn-num">' + combat.turn + '</span></span>' +
          '</button>' +
          '<div class="pile-slot discard-slot" id="btn-discard-pile">' +
            '<div class="pile-stack discard-stack">' +
              '<div class="pile-card-back"></div>' +
              '<div class="pile-card-back"></div>' +
              '<div class="pile-card-back"></div>' +
            '</div>' +
            '<span class="pile-label">DISCARD</span>' +
            '<span class="pile-count" id="discard-count">0</span>' +
            '<span class="pile-exhaust-label" id="exhaust-count"></span>' +
          '</div>' +
        '</div>';
      root.appendChild(screen);

      document.getElementById('btn-end-turn').onclick = function() {
        DS.Combat.endTurn();
      };
      document.getElementById('btn-draw-pile').onclick = function() {
        DS.UI.showPileViewer('Draw Pile', DS.State.combat.drawPile);
      };
      document.getElementById('btn-discard-pile').onclick = function() {
        DS.UI.showPileViewer('Discard Pile', DS.State.combat.discardPile);
      };
    }

    DS.UI.renderEnergy();
    DS.UI.renderHeroes();
    DS.UI.renderEnemies();
    DS.UI.renderHand();
    DS.UI.renderDeckInfo();
    document.getElementById('turn-num').textContent = combat.turn;

    // Update turn phase indicator
    var phaseEl = document.getElementById('turn-phase');
    if (phaseEl) {
      var isEnemyTurn = combat.animating;
      phaseEl.textContent = isEnemyTurn ? 'ENEMY TURN' : 'YOUR TURN';
      phaseEl.className = 'turn-phase-indicator' + (isEnemyTurn ? ' enemy-phase' : ' player-phase');
    }
  },

  renderEnergy: function() {
    var combat = DS.State.combat;
    var el = document.getElementById('energy-display');
    if (!el) return;
    el.innerHTML = '<span class="energy-value">' + combat.energy + '/' + combat.maxEnergy + '</span>';
    el.className = 'energy-orb' + (combat.energy === 0 ? ' depleted' : '');
  },

  renderDeckInfo: function() {
    var combat = DS.State.combat;
    var dc = document.getElementById('deck-count');
    var disc = document.getElementById('discard-count');
    var exh = document.getElementById('exhaust-count');
    if (dc) dc.textContent = combat.drawPile.length;
    if (disc) disc.textContent = combat.discardPile.length;
    if (exh) {
      var exLen = (combat.exhaustPile || []).length;
      exh.textContent = exLen > 0 ? '\u2620 ' + exLen : '';
    }
  },

  // ===== SPRITE BUILDER =====
  buildSprite: function(entity, facing) {
    facing = facing || 'right';
    var sprite = document.createElement('div');
    sprite.className = 'sprite sprite-' + facing;

    if (entity.isHero) {
      var heroDef = DS.Heroes[entity.heroIdx];
      var colors = heroDef.colors;
      var spriteDef = heroDef.sprite;
      sprite.classList.add('sprite-hero', 'sprite-' + entity.cls);

      // Body
      var body = document.createElement('div');
      body.className = 'sprite-body sprite-body-' + spriteDef.body;
      body.style.background = 'linear-gradient(180deg, ' + colors.primary + ', ' + colors.secondary + ')';

      // Head
      var head = document.createElement('div');
      head.className = 'sprite-head sprite-head-' + spriteDef.head;

      // Class-specific details
      if (entity.cls === 'fighter') {
        body.innerHTML =
          '<div class="sprite-shield"></div>' +
          '<div class="sprite-sword"></div>';
        head.style.background = 'linear-gradient(180deg, #a08030, #706020)';
        head.innerHTML = '<div class="sprite-visor"></div>';
      } else if (entity.cls === 'rogue') {
        body.innerHTML =
          '<div class="sprite-dagger sprite-dagger-l"></div>' +
          '<div class="sprite-dagger sprite-dagger-r"></div>';
        head.style.background = '#1a1a1a';
        head.innerHTML = '<div class="sprite-hood"></div>';
      } else if (entity.cls === 'cleric') {
        body.innerHTML =
          '<div class="sprite-staff sprite-staff-cleric"></div>';
        head.style.background = 'linear-gradient(180deg, #6699cc, #3a5a8a)';
        head.innerHTML = '<div class="sprite-halo"></div>';
      } else if (entity.cls === 'wizard') {
        body.innerHTML =
          '<div class="sprite-staff sprite-staff-wizard"><div class="sprite-orb"></div></div>';
        head.style.background = colors.secondary;
        head.innerHTML = '<div class="sprite-hat"></div>';
      }

      sprite.appendChild(head);
      sprite.appendChild(body);

      // Legs
      var legs = document.createElement('div');
      legs.className = 'sprite-legs';
      legs.style.borderTopColor = colors.secondary;
      sprite.appendChild(legs);

    } else {
      // Enemy sprite
      sprite.classList.add('sprite-enemy');
      var eBody = document.createElement('div');
      eBody.className = 'sprite-body sprite-body-enemy';
      var eHead = document.createElement('div');
      eHead.className = 'sprite-head sprite-head-enemy';

      // Style by enemy name
      var ename = entity.name.toLowerCase();
      if (ename.indexOf('bone') >= 0 || ename.indexOf('skeleton') >= 0) {
        sprite.classList.add('sprite-skeleton');
        eBody.style.background = 'linear-gradient(180deg, #d8c8b0, #a09080)';
        eHead.style.background = '#d8c8b0';
        eHead.innerHTML = '<div class="sprite-eye-l"></div><div class="sprite-eye-r"></div>';
      } else if (ename.indexOf('goblin') >= 0) {
        sprite.classList.add('sprite-goblin');
        eBody.style.background = 'linear-gradient(180deg, #4a7030, #2a4018)';
        eHead.style.background = '#4a7030';
        eHead.innerHTML = '<div class="sprite-eye-l sprite-eye-red"></div><div class="sprite-eye-r sprite-eye-red"></div><div class="sprite-ear-l"></div><div class="sprite-ear-r"></div>';
      } else if (ename.indexOf('cultist') >= 0) {
        sprite.classList.add('sprite-cultist');
        eBody.style.background = 'linear-gradient(180deg, #4a2040, #2a1020)';
        eHead.style.background = '#3a1830';
        eHead.innerHTML = '<div class="sprite-hood sprite-hood-enemy"></div>';
      } else if (ename.indexOf('slime') >= 0) {
        sprite.classList.add('sprite-slime');
        eBody.style.background = 'linear-gradient(180deg, #60c040, #308020)';
        eBody.style.borderRadius = '40% 40% 50% 50%';
        eHead.style.background = '#50b030';
        eHead.style.borderRadius = '50%';
        eHead.innerHTML = '<div class="sprite-eye-l sprite-eye-slime"></div><div class="sprite-eye-r sprite-eye-slime"></div>';
      } else if (ename.indexOf('bandit') >= 0) {
        sprite.classList.add('sprite-bandit');
        eBody.style.background = 'linear-gradient(180deg, #6a4a2a, #3a2a18)';
        eHead.style.background = '#5a3a20';
        eHead.innerHTML = '<div class="sprite-eye-l"></div><div class="sprite-eye-r"></div>';
        if (ename.indexOf('king') >= 0) {
          eHead.innerHTML += '<div class="sprite-crown"></div>';
        }
      } else if (ename.indexOf('lich') >= 0) {
        sprite.classList.add('sprite-lich');
        eBody.style.background = 'linear-gradient(180deg, #2a1040, #0a0010)';
        eHead.style.background = '#c8b8a0';
        eHead.innerHTML = '<div class="sprite-eye-l sprite-eye-lich"></div><div class="sprite-eye-r sprite-eye-lich"></div><div class="sprite-lich-crown"></div>';
      } else {
        eBody.style.background = 'linear-gradient(180deg, #604040, #3a2020)';
        eHead.style.background = '#604040';
      }

      sprite.appendChild(eHead);
      sprite.appendChild(eBody);

      var eLegs = document.createElement('div');
      eLegs.className = 'sprite-legs sprite-legs-enemy';
      if (ename.indexOf('slime') >= 0) {
        eLegs.style.display = 'none';
      }
      sprite.appendChild(eLegs);
    }

    return sprite;
  },

  // ===== HERO RENDERING =====
  renderHeroes: function() {
    var panel = document.getElementById('heroes-panel');
    var combat = DS.State.combat;
    var run = DS.State.run;
    panel.innerHTML = '';

    // Back to front: pos 4 is leftmost (back), pos 1 is rightmost (front, near enemies)
    for (var pos = 4; pos >= 1; pos--) {
      var hero = run.heroes.find(function(h) { return h.pos === pos; });
      if (!hero) {
        // Empty slot placeholder
        var empty = document.createElement('div');
        empty.className = 'stage-entity stage-hero empty-slot';
        empty.innerHTML = '<div class="entity-pos">' + pos + '</div><div class="entity-sprite-wrap"><div class="sprite-empty"></div></div>';
        panel.appendChild(empty);
        continue;
      }

      var dead = hero.hp <= 0;
      var pct = dead ? 0 : Math.max(0, (hero.hp / hero.maxHp) * 100);

      var targetable = false;
      if (combat.selectedCard !== null) {
        var card = combat.hand[combat.selectedCard];
        if (card && card.target === 'ally' && !dead) targetable = true;
        if (card && card.target === 'ally_dead' && dead) targetable = true;
      }

      var el = document.createElement('div');
      el.className = 'stage-entity stage-hero' +
        (dead ? ' dead' : '') +
        (targetable ? ' targetable' : '');
      el.id = hero.id;

      if (targetable) {
        (function(hId) {
          el.onclick = function() { DS.Combat.clickTarget(hId); };
        })(hero.id);
      }

      var statusHtml = '';
      if (hero.block > 0) statusHtml += '<span class="status-badge status-block">\uD83D\uDEE1\uFE0F ' + hero.block + '</span>';
      if (hero.poison > 0) statusHtml += '<span class="status-badge status-poison">\u2620 ' + hero.poison + '</span>';
      if (hero.weak > 0) statusHtml += '<span class="status-badge status-weak">WK ' + hero.weak + '</span>';
      if (hero.vulnerable > 0) statusHtml += '<span class="status-badge status-vuln">VU ' + hero.vulnerable + '</span>';
      if (hero.strength > 0) statusHtml += '<span class="status-badge status-str">STR ' + hero.strength + '</span>';
      if (hero.bleed > 0) statusHtml += '<span class="status-badge status-bleed">BLD ' + hero.bleed + '</span>';
      if (hero.stunned) statusHtml += '<span class="status-badge status-stun">\u26A1</span>';

      el.innerHTML =
        '<div class="entity-pos">' + hero.pos + '</div>' +
        '<div class="entity-sprite-wrap">' + DS.UI.buildSprite(hero, 'right').outerHTML + '</div>' +
        '<div class="entity-name ' + hero.cls + '">' + hero.name + '</div>' +
        '<div class="entity-hp-bar"><div class="entity-hp-fill hero-hp" style="width:' + pct + '%"></div></div>' +
        '<span class="entity-hp-text">' + (dead ? 'DEAD' : hero.hp + '/' + hero.maxHp) + '</span>' +
        (statusHtml ? '<div class="entity-statuses">' + statusHtml + '</div>' : '');

      panel.appendChild(el);
    }
  },

  // ===== ENEMY RENDERING =====
  renderEnemies: function() {
    var panel = document.getElementById('enemies-panel');
    var combat = DS.State.combat;
    panel.innerHTML = '';

    // Front to back: pos 1 leftmost (near heroes), higher positions to the right
    var sorted = combat.enemies.slice().sort(function(a, b) { return a.pos - b.pos; });
    sorted.forEach(function(enemy) {
      var dead = enemy.hp <= 0;
      var pct = dead ? 0 : Math.max(0, (enemy.hp / enemy.maxHp) * 100);

      var targetable = false;
      if (combat.selectedCard !== null) {
        var card = combat.hand[combat.selectedCard];
        if (card && (card.target === 'enemy' || card.target === 'enemy_any') && !dead) targetable = true;
      }

      // Intent display - floats above sprite
      var intentHtml = '';
      if (!dead && enemy.currentIntent) {
        var intent = enemy.currentIntent;
        var intentCls = 'entity-intent';
        var intentIcon = '\u2753';
        if (intent.type === 'attack' || intent.type === 'attack_multi' || intent.type === 'attack_all' || intent.type === 'attack_poison') {
          intentCls += ' intent-attack'; intentIcon = '\u2694\uFE0F';
        } else if (intent.type === 'defend') {
          intentCls += ' intent-defend'; intentIcon = '\uD83D\uDEE1\uFE0F';
        } else if (intent.type === 'buff') {
          intentCls += ' intent-buff'; intentIcon = '\u2B06\uFE0F';
        } else if (intent.type === 'heal_allies') {
          intentCls += ' intent-buff'; intentIcon = '\uD83D\uDC9A';
        } else if (intent.type === 'summon') {
          intentCls += ' intent-buff'; intentIcon = '\uD83D\uDC80';
        } else if (intent.type === 'poison') {
          intentCls += ' intent-attack'; intentIcon = '\u2620\uFE0F';
        }
        var displayDmg = intent.dmg ? intent.dmg + (enemy.dmgBuff || 0) : null;
        var desc = intent.desc;
        if (intent.type === 'attack' && displayDmg) {
          desc = intent.targeting === 'back' ? displayDmg + '\u2192' : '' + displayDmg;
        } else if (intent.type === 'attack_multi' && displayDmg) {
          desc = displayDmg + '\u00D7' + intent.hits;
        } else if (intent.type === 'attack_all' && displayDmg) {
          desc = displayDmg + ' ALL';
        }
        intentHtml = '<div class="' + intentCls + '"><span class="intent-icon">' + intentIcon + '</span> <span class="intent-value">' + desc + '</span></div>';
      }

      var statusHtml = '';
      if (enemy.block > 0) statusHtml += '<span class="status-badge status-block">\uD83D\uDEE1\uFE0F ' + enemy.block + '</span>';
      if (enemy.poison > 0) statusHtml += '<span class="status-badge status-poison">\u2620 ' + enemy.poison + '</span>';
      if (enemy.weak > 0) statusHtml += '<span class="status-badge status-weak">WK ' + enemy.weak + '</span>';
      if (enemy.vulnerable > 0) statusHtml += '<span class="status-badge status-vuln">VU ' + enemy.vulnerable + '</span>';
      if (enemy.bleed > 0) statusHtml += '<span class="status-badge status-bleed">BLD ' + enemy.bleed + '</span>';
      if (enemy.stunned) statusHtml += '<span class="status-badge status-stun">\u26A1</span>';
      if (enemy.dmgBuff > 0) statusHtml += '<span class="status-badge status-buff">\u2191+' + enemy.dmgBuff + '</span>';

      var el = document.createElement('div');
      el.className = 'stage-entity stage-enemy' +
        (dead ? ' dead' : '') +
        (targetable ? ' targetable' : '') +
        (enemy.isBoss ? ' boss' : '');
      el.id = enemy.id;

      if (targetable) {
        (function(eId) {
          el.onclick = function() { DS.Combat.clickTarget(eId); };
        })(enemy.id);
      }

      el.innerHTML =
        intentHtml +
        '<div class="entity-pos">' + enemy.pos + '</div>' +
        '<div class="entity-sprite-wrap">' + DS.UI.buildSprite(enemy, 'left').outerHTML + '</div>' +
        '<div class="entity-name">' + enemy.name + '</div>' +
        '<div class="entity-hp-bar"><div class="entity-hp-fill enemy-hp" style="width:' + pct + '%"></div></div>' +
        '<span class="entity-hp-text">' + (dead ? 'DEAD' : enemy.hp + '/' + enemy.maxHp) + '</span>' +
        (statusHtml ? '<div class="entity-statuses">' + statusHtml + '</div>' : '');

      panel.appendChild(el);
    });
  },

  // ===== HAND RENDERING =====
  renderHand: function() {
    var container = document.getElementById('hand-cards');
    var combat = DS.State.combat;
    if (!container) return;
    container.innerHTML = '';

    var total = combat.hand.length;
    var maxAngle = Math.min(total * 5, 35);

    combat.hand.forEach(function(card, idx) {
      var hero = DS.State.run.heroes[card.heroIdx];
      var check = DS.Combat.canPlayCard(card);
      var isSelected = combat.selectedCard === idx;

      var extraClass = '';
      if (!check.playable) {
        if (check.reason === 'dead') extraClass = 'hero-dead';
        else if (check.reason === 'position') extraClass = 'wrong-pos';
        else extraClass = 'unplayable';
      }

      var posOk = hero.hp > 0 && (card.prefPos.includes(hero.pos) || (check.playable && check.usesBoots));
      var artClass = 'card-art-' + card.type;

      // Fan arc math
      var t = total > 1 ? (idx / (total - 1)) - 0.5 : 0;
      var angle = t * maxAngle;
      var yOffset = Math.abs(t) * 30;

      var el = document.createElement('div');
      el.className = 'card ' + card.heroCls + (isSelected ? ' selected' : '') + (extraClass ? ' ' + extraClass : '');
      el.setAttribute('data-hand-idx', idx);
      if (!isSelected) {
        el.style.transform = 'rotate(' + angle + 'deg) translateY(' + yOffset + 'px)';
      }
      el.style.zIndex = isSelected ? 100 : idx + 1;
      if (check.playable && !combat.animating && !combat.gameOver) {
        (function(i) {
          el.onclick = function() { DS.Combat.selectCard(i); };
        })(idx);
      }

      var posReqStr = card.prefPos.join(',');
      var upgradedBadge = card.upgraded ? '<span class="card-upgraded">+</span>' : '';

      el.innerHTML =
        '<div class="card-art ' + artClass + '"></div>' +
        '<div class="card-header">' +
          '<div class="card-name">' + card.name + upgradedBadge + '</div>' +
          '<div class="card-cost">' + card.cost + '</div>' +
        '</div>' +
        '<div class="card-effect">' + card.desc + '</div>' +
        '<div class="card-footer">' +
          '<div class="card-class">' + card.heroName + '</div>' +
          '<div class="card-pos-req ' + (posOk ? 'pos-ok' : 'pos-bad') + '">' +
            (posOk ? '\u2713' : '\u2717') + ' Pos ' + posReqStr + (hero.hp > 0 ? ' (at ' + hero.pos + ')' : '') +
          '</div>' +
        '</div>';
      container.appendChild(el);
    });
  },

  // ===== REWARD SCREEN =====
  renderReward: function(root) {
    root.innerHTML = '';
    var screen = document.createElement('div');
    screen.className = 'screen screen-reward';

    var run = DS.State.run;
    var rewardCards = DS.Cards.getRewardPool(3);
    var goldReward = run._lastGoldReward || 0;

    // Show beggar message if any
    var beggarHtml = '';
    if (run._beggarMessage) {
      beggarHtml = '<div class="reward-subtitle" style="color:var(--purple);margin-bottom:12px;">' + run._beggarMessage + '</div>';
      run._beggarMessage = null;
    }

    var cardsHtml = '';
    rewardCards.forEach(function(card, i) {
      var artClass = 'card-art-' + card.type;
      cardsHtml +=
        '<div class="reward-card card ' + card.heroCls + '" data-reward-idx="' + i + '">' +
          '<div class="card-art ' + artClass + '"></div>' +
          '<div class="card-header">' +
            '<div class="card-name">' + card.name + '</div>' +
            '<div class="card-cost">' + card.cost + '</div>' +
          '</div>' +
          '<div class="card-effect">' + card.desc + '</div>' +
          '<div class="card-footer">' +
            '<div class="card-class">' + card.heroName + '</div>' +
            '<div class="card-pos-req">Pos ' + card.prefPos.join(',') + '</div>' +
          '</div>' +
        '</div>';
    });

    screen.innerHTML =
      '<div class="reward-panel">' +
        '<h2 class="reward-title">VICTORY</h2>' +
        '<div class="reward-gold">\uD83D\uDCB0 +' + goldReward + ' Gold (Total: ' + run.gold + ')</div>' +
        beggarHtml +
        '<div class="reward-subtitle">Choose a card to add to your deck:</div>' +
        '<div class="reward-cards">' + cardsHtml + '</div>' +
        '<button class="btn btn-skip" id="btn-skip-reward">SKIP</button>' +
      '</div>';

    root.appendChild(screen);

    // Wire up card clicks
    rewardCards.forEach(function(card, i) {
      var el = root.querySelector('[data-reward-idx="' + i + '"]');
      if (el) {
        el.onclick = function() {
          // Add card to deck
          var deckCard = {
            id: card.id + '_reward_' + Date.now(),
            baseId: card.baseId,
            name: card.name,
            cost: card.cost,
            type: card.type,
            target: card.target,
            prefPos: card.prefPos.slice(),
            desc: card.desc,
            value: card.value,
            effect: card.effect,
            heroIdx: card.heroIdx,
            heroCls: card.heroCls,
            heroName: card.heroName,
            upgraded: false
          };
          run.deck.push(deckCard);
          DS.State.stats.cardsCollected++;
          el.classList.add('selected');
          setTimeout(function() {
            DS.Game.afterReward();
          }, 400);
        };
      }
    });

    document.getElementById('btn-skip-reward').onclick = function() {
      DS.Game.afterReward();
    };
  },

  // ===== REST SCREEN =====
  renderRest: function(root) {
    root.innerHTML = '';
    var screen = document.createElement('div');
    screen.className = 'screen screen-rest';

    var run = DS.State.run;

    // Build hero status display
    var heroesHtml = '';
    run.heroes.forEach(function(h) {
      var pct = Math.max(0, (h.hp / h.maxHp) * 100);
      var color = h.hp <= 0 ? '#ff4040' : 'var(--text)';
      heroesHtml +=
        '<div class="rest-hero" id="rest-' + h.id + '">' +
          '<div class="rest-hero-name" style="color:' + (h.hp <= 0 ? '#ff4040' : DS.Heroes[h.heroIdx].colors.primary) + '">' +
            h.name + (h.hp <= 0 ? ' (DEAD)' : '') +
          '</div>' +
          '<div class="rest-hero-hp">' + h.hp + '/' + h.maxHp + ' HP</div>' +
          '<div class="hp-bar-outer"><div class="hp-bar-inner hero-hp" style="width:' + pct + '%"></div></div>' +
        '</div>';
    });

    screen.innerHTML =
      '<div class="rest-panel">' +
        '<div class="rest-fire">\uD83D\uDD25</div>' +
        '<h2 class="rest-title">REST AT THE CAMPFIRE</h2>' +
        '<div class="rest-subtitle">The darkness retreats... for now.</div>' +
        '<div class="rest-heroes">' + heroesHtml + '</div>' +
        '<div class="rest-choices">' +
          '<button class="btn btn-rest-heal" id="btn-rest-heal">' +
            '<div class="rest-choice-icon">\u2764\uFE0F</div>' +
            '<div class="rest-choice-title">REST</div>' +
            '<div class="rest-choice-desc">Heal all heroes 30% of max HP</div>' +
          '</button>' +
          '<button class="btn btn-rest-train" id="btn-rest-train">' +
            '<div class="rest-choice-icon">\u2694\uFE0F</div>' +
            '<div class="rest-choice-title">TRAIN</div>' +
            '<div class="rest-choice-desc">Upgrade one card (+50% effect)</div>' +
          '</button>' +
          '<button class="btn btn-rest-remove" id="btn-rest-remove">' +
            '<div class="rest-choice-icon">\uD83D\uDDD1\uFE0F</div>' +
            '<div class="rest-choice-title">PURGE</div>' +
            '<div class="rest-choice-desc">Remove a card from your deck</div>' +
          '</button>' +
        '</div>' +
      '</div>';

    root.appendChild(screen);

    document.getElementById('btn-rest-heal').onclick = function() {
      run.heroes.forEach(function(h) {
        if (h.hp > 0) {
          var healAmt = Math.floor(h.maxHp * 0.3);
          h.hp = Math.min(h.maxHp, h.hp + healAmt);
        }
      });
      DS.Game.afterRest();
    };

    document.getElementById('btn-rest-train').onclick = function() {
      DS.UI.renderTrainScreen(root);
    };

    document.getElementById('btn-rest-remove').onclick = function() {
      DS.UI.renderPurgeScreen(root);
    };
  },

  // ===== TRAIN (card upgrade) SCREEN =====
  renderTrainScreen: function(root) {
    root.innerHTML = '';
    var screen = document.createElement('div');
    screen.className = 'screen screen-train';

    var run = DS.State.run;

    // Get unique non-upgraded cards
    var seen = {};
    var upgradeable = [];
    run.deck.forEach(function(card, idx) {
      if (!card.upgraded && !seen[card.baseId]) {
        seen[card.baseId] = true;
        upgradeable.push({ card: card, idx: idx });
      }
    });

    var cardsHtml = '';
    upgradeable.forEach(function(entry, i) {
      var card = entry.card;
      var artClass = 'card-art-' + card.type;
      var upgradeDesc = card.desc;
      // Show what the upgrade would do
      if (card.value) {
        var newVal = Math.ceil(card.value * 1.5);
        upgradeDesc = card.desc.replace(String(card.value), String(newVal));
      }
      cardsHtml +=
        '<div class="reward-card card ' + card.heroCls + '" data-train-idx="' + i + '">' +
          '<div class="card-art ' + artClass + '"></div>' +
          '<div class="card-header">' +
            '<div class="card-name">' + card.name + ' \u2192 ' + card.name + '+</div>' +
            '<div class="card-cost">' + card.cost + '</div>' +
          '</div>' +
          '<div class="card-effect">' + upgradeDesc + '</div>' +
          '<div class="card-footer">' +
            '<div class="card-class">' + card.heroName + '</div>' +
            '<div class="card-pos-req">Pos ' + card.prefPos.join(',') + '</div>' +
          '</div>' +
        '</div>';
    });

    screen.innerHTML =
      '<div class="train-panel">' +
        '<h2 class="reward-title">TRAIN</h2>' +
        '<div class="reward-subtitle">Choose a card to upgrade (+50% effect):</div>' +
        '<div class="reward-cards train-cards">' + cardsHtml + '</div>' +
        '<button class="btn btn-skip" id="btn-skip-train">CANCEL</button>' +
      '</div>';

    root.appendChild(screen);

    // Wire up card clicks
    upgradeable.forEach(function(entry, i) {
      var el = root.querySelector('[data-train-idx="' + i + '"]');
      if (el) {
        el.onclick = function() {
          // Upgrade ALL copies of this card in the deck
          var baseId = entry.card.baseId;
          run.deck.forEach(function(deckCard) {
            if (deckCard.baseId === baseId && !deckCard.upgraded) {
              deckCard.upgraded = true;
              deckCard.name = deckCard.name + '+';
              if (deckCard.value) {
                var oldVal = deckCard.value;
                deckCard.value = Math.ceil(oldVal * 1.5);
                deckCard.desc = deckCard.desc.replace(String(oldVal), String(deckCard.value));
                // Rebind effect with new value
                DS.UI.rebindCardEffect(deckCard, deckCard.value);
              }
            }
          });
          el.classList.add('selected');
          setTimeout(function() {
            DS.Game.afterRest();
          }, 400);
        };
      }
    });

    document.getElementById('btn-skip-train').onclick = function() {
      DS.UI.renderRest(root);
    };
  },

  // ===== PURGE (card removal at rest) SCREEN =====
  renderPurgeScreen: function(root) {
    root.innerHTML = '';
    var screen = document.createElement('div');
    screen.className = 'screen screen-train';

    var run = DS.State.run;

    var cardsHtml = '';
    run.deck.forEach(function(card, i) {
      var artClass = 'card-art-' + card.type;
      cardsHtml +=
        '<div class="reward-card card ' + card.heroCls + '" data-purge-idx="' + i + '">' +
          '<div class="card-art ' + artClass + '"></div>' +
          '<div class="card-header">' +
            '<div class="card-name">' + card.name + '</div>' +
            '<div class="card-cost">' + card.cost + '</div>' +
          '</div>' +
          '<div class="card-effect">' + card.desc + '</div>' +
          '<div class="card-footer">' +
            '<div class="card-class">' + card.heroName + '</div>' +
            '<div class="card-pos-req">Pos ' + card.prefPos.join(',') + '</div>' +
          '</div>' +
        '</div>';
    });

    screen.innerHTML =
      '<div class="train-panel">' +
        '<h2 class="reward-title">PURGE</h2>' +
        '<div class="reward-subtitle">Choose a card to remove from your deck:</div>' +
        '<div class="reward-cards train-cards">' + cardsHtml + '</div>' +
        '<button class="btn btn-skip" id="btn-skip-purge">CANCEL</button>' +
      '</div>';

    root.appendChild(screen);

    run.deck.forEach(function(card, i) {
      var el = root.querySelector('[data-purge-idx="' + i + '"]');
      if (el) {
        el.onclick = function() {
          run.deck.splice(i, 1);
          el.classList.add('selected');
          setTimeout(function() {
            DS.Game.afterRest();
          }, 400);
        };
      }
    });

    document.getElementById('btn-skip-purge').onclick = function() {
      DS.UI.renderRest(root);
    };
  },

  // Rebind card effect with upgraded value
  rebindCardEffect: function(card, newVal) {
    var type = card.type;
    var target = card.target;

    // Skip compound-effect cards -- keep their original effect
    if (card.baseId === 'rogue_shadow_step' || card.baseId === 'cleric_bless') return;

    if (type === 'attack' && (target === 'enemy' || target === 'enemy_any')) {
      card.effect = function(state, hero, tgt) { DS.Combat.dealDamage(tgt, newVal); };
    } else if (type === 'attack' && target === 'all_enemies') {
      card.effect = function(state, hero, tgt) {
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.dealDamage(e, newVal);
        });
      };
    } else if (type === 'block' && target === 'self') {
      card.effect = function(state, hero, tgt) { DS.Combat.gainBlock(hero, newVal); };
    } else if (type === 'block' && target === 'ally') {
      card.effect = function(state, hero, tgt) { DS.Combat.gainBlock(tgt, newVal); };
    } else if (type === 'block' && target === 'all_allies') {
      card.effect = function(state, hero, tgt) {
        DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
          DS.Combat.gainBlock(h, newVal);
        });
      };
    } else if (type === 'heal') {
      card.effect = function(state, hero, tgt) { DS.Combat.healTarget(tgt, newVal); };
    } else if (type === 'draw') {
      card.effect = function(state, hero, tgt) {
        for (var i = 0; i < newVal; i++) DS.Combat.drawCard();
      };
    }
    // Shadow Step and Bless have compound effects -- keep original for now
  },

  // ===== EVENT SCREEN =====
  renderEvent: function(root) {
    root.innerHTML = '';
    var screen = document.createElement('div');
    screen.className = 'screen screen-event';

    var run = DS.State.run;
    var event = run._currentEvent;
    if (!event) {
      DS.Game.afterEvent();
      return;
    }

    DS.UI._injectEventStyles();

    var choicesHtml = '';
    event.choices.forEach(function(choice, i) {
      choicesHtml +=
        '<button class="btn btn-event-choice" data-choice-idx="' + i + '">' +
          '<div class="event-choice-label">' + choice.label + '</div>' +
          '<div class="event-choice-desc">' + choice.desc + '</div>' +
        '</button>';
    });

    screen.innerHTML =
      '<div class="event-panel">' +
        '<div class="event-icon">\u2753</div>' +
        '<h2 class="event-title">' + event.name + '</h2>' +
        '<div class="event-text">' + event.text + '</div>' +
        '<div class="event-choices" id="event-choices">' + choicesHtml + '</div>' +
        '<div class="event-result" id="event-result" style="display:none;"></div>' +
        '<button class="btn btn-event-continue" id="btn-event-continue" style="display:none;">CONTINUE</button>' +
      '</div>';

    root.appendChild(screen);

    // Wire up choice buttons
    event.choices.forEach(function(choice, i) {
      var btn = root.querySelector('[data-choice-idx="' + i + '"]');
      if (btn) {
        btn.onclick = function() {
          // Execute the effect
          var resultText = choice.effect(DS.State);
          resultText = resultText || 'Nothing happens.';

          // Hide choices, show result
          document.getElementById('event-choices').style.display = 'none';
          var resultEl = document.getElementById('event-result');
          resultEl.textContent = resultText;
          resultEl.style.display = 'block';
          document.getElementById('btn-event-continue').style.display = 'inline-block';
        };
      }
    });

    document.getElementById('btn-event-continue').onclick = function() {
      run._currentEvent = null;
      DS.Game.afterEvent();
    };
  },

  // ===== BOSS INTRO SPLASH =====
  showBossIntro: function(boss, callback) {
    var root = document.getElementById('game-root');
    root.innerHTML = '';
    var screen = document.createElement('div');
    screen.className = 'screen screen-boss-intro';

    var flavorText = {
      'The Lich': 'The air dies. Candles extinguish themselves. From the throne of bones, dead eyes open.',
      'Iron Golem': 'The ground shakes. Rivets scream. A mountain of iron unfolds from the darkness.',
      'Spider Queen': 'Silk threads catch the torchlight. A clicking sound, everywhere at once. She descends.',
      'Vampire Lord': 'The shadows bow. A figure of terrible beauty steps forward, mouth red, eyes ancient.'
    };
    var flavor = flavorText[boss.name] || 'A terrible presence fills the chamber. This is no ordinary foe.';

    screen.innerHTML =
      '<div class="boss-intro-panel">' +
        '<div class="boss-intro-icon">' + boss.icon + '</div>' +
        '<h1 class="boss-intro-name">' + boss.name + '</h1>' +
        '<div class="boss-intro-flavor">' + flavor + '</div>' +
        '<button class="btn btn-boss-fight" id="btn-boss-fight">FIGHT</button>' +
      '</div>';
    root.appendChild(screen);

    // Inject boss intro styles if not already present
    if (!document.getElementById('boss-intro-styles')) {
      var style = document.createElement('style');
      style.id = 'boss-intro-styles';
      style.textContent =
        '.screen-boss-intro { display:flex; align-items:center; justify-content:center; min-height:100vh; background:#0a0a0a; }' +
        '.boss-intro-panel { text-align:center; animation: bossAppear 0.6s ease-out; }' +
        '.boss-intro-icon { font-size:5rem; margin-bottom:0.5rem; animation: bossPulse 2s ease-in-out infinite; }' +
        '.boss-intro-name { font-size:2.5rem; color:#ff4444; text-transform:uppercase; letter-spacing:0.15em; margin-bottom:0.5rem; text-shadow: 0 0 20px #ff000066; }' +
        '.boss-intro-flavor { color:#999; font-style:italic; max-width:400px; margin:0 auto 1.5rem; line-height:1.5; }' +
        '.btn-boss-fight { font-size:1.2rem; padding:0.8rem 2.5rem; background:#cc2222; border:2px solid #ff4444; color:#fff; cursor:pointer; text-transform:uppercase; letter-spacing:0.1em; transition:all 0.2s; }' +
        '.btn-boss-fight:hover { background:#ff3333; transform:scale(1.05); }' +
        '@keyframes bossAppear { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }' +
        '@keyframes bossPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.1); } }';
      document.head.appendChild(style);
    }

    document.getElementById('btn-boss-fight').onclick = function() {
      callback();
    };
  },

  // ===== SHOP SCREEN =====
  renderShop: function(root) {
    root.innerHTML = '';
    var screen = document.createElement('div');
    screen.className = 'screen screen-shop';

    var run = DS.State.run;

    DS.UI._injectShopStyles();

    // Generate shop inventory
    var shopCards = DS.Cards.getRewardPool(3);
    var shopCardPrices = shopCards.map(function() {
      return 50 + Math.floor(Math.random() * 26); // 50-75
    });

    // Random relic for sale
    var ownedIds = (run.relics || []).map(function(r) { return r.id; });
    var shopRelic = DS.Relics.pickRandom(ownedIds);
    var relicPrice = 0;
    if (shopRelic) {
      if (shopRelic.rarity === 'common') relicPrice = 100;
      else if (shopRelic.rarity === 'uncommon') relicPrice = 125;
      else relicPrice = 150;
    }

    var removePrice = 75;

    // Build cards section
    var cardsHtml = '<div class="shop-section"><h3 class="shop-section-title">BUY CARDS</h3><div class="shop-cards">';
    shopCards.forEach(function(card, i) {
      var price = shopCardPrices[i];
      var canAfford = run.gold >= price;
      var artClass = 'card-art-' + card.type;
      cardsHtml +=
        '<div class="shop-card-wrap' + (canAfford ? '' : ' shop-unaffordable') + '" data-shop-card="' + i + '">' +
          '<div class="card ' + card.heroCls + '">' +
            '<div class="card-art ' + artClass + '"></div>' +
            '<div class="card-header">' +
              '<div class="card-name">' + card.name + '</div>' +
              '<div class="card-cost">' + card.cost + '</div>' +
            '</div>' +
            '<div class="card-effect">' + card.desc + '</div>' +
            '<div class="card-footer">' +
              '<div class="card-class">' + card.heroName + '</div>' +
              '<div class="card-pos-req">Pos ' + card.prefPos.join(',') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="shop-price' + (canAfford ? '' : ' shop-price-red') + '">\uD83D\uDCB0 ' + price + '</div>' +
        '</div>';
    });
    cardsHtml += '</div></div>';

    // Build relic section
    var relicHtml = '';
    if (shopRelic) {
      var canAffordRelic = run.gold >= relicPrice;
      relicHtml =
        '<div class="shop-section"><h3 class="shop-section-title">BUY RELIC</h3><div class="shop-relics">' +
          '<div class="shop-relic-wrap' + (canAffordRelic ? '' : ' shop-unaffordable') + '" id="shop-relic">' +
            '<div class="shop-relic-item">' +
              '<span class="shop-relic-icon">' + shopRelic.icon + '</span>' +
              '<div class="shop-relic-info">' +
                '<div class="shop-relic-name">' + shopRelic.name + '</div>' +
                '<div class="shop-relic-desc">' + shopRelic.desc + '</div>' +
                '<div class="shop-relic-rarity">' + shopRelic.rarity + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="shop-price' + (canAffordRelic ? '' : ' shop-price-red') + '">\uD83D\uDCB0 ' + relicPrice + '</div>' +
          '</div>' +
        '</div></div>';
    }

    // Build heal potion section
    var potionPrice = 30;
    var canAffordPotion = run.gold >= potionPrice;
    var potionHtml =
      '<div class="shop-section"><h3 class="shop-section-title">SERVICES</h3>' +
        '<div class="shop-remove' + (canAffordPotion ? '' : ' shop-unaffordable') + '" id="shop-potion-btn">' +
          '<div class="shop-remove-label">\u2764\uFE0F Healing Potion — Heal all heroes 15 HP</div>' +
          '<div class="shop-price' + (canAffordPotion ? '' : ' shop-price-red') + '">\uD83D\uDCB0 ' + potionPrice + '</div>' +
        '</div>' +
      '</div>';

    // Build remove card section
    var canAffordRemove = run.gold >= removePrice;
    var removeHtml =
      '<div class="shop-section"><h3 class="shop-section-title">REMOVE A CARD</h3>' +
        '<div class="shop-remove' + (canAffordRemove ? '' : ' shop-unaffordable') + '" id="shop-remove-btn">' +
          '<div class="shop-remove-label">Remove a card from your deck</div>' +
          '<div class="shop-price' + (canAffordRemove ? '' : ' shop-price-red') + '">\uD83D\uDCB0 ' + removePrice + '</div>' +
        '</div>' +
        '<div class="shop-remove-list" id="shop-remove-list" style="display:none;"></div>' +
      '</div>';

    screen.innerHTML =
      '<div class="shop-panel">' +
        '<div class="shop-header">' +
          '<h2 class="shop-title">THE SHOP</h2>' +
          '<div class="shop-gold">\uD83D\uDCB0 ' + run.gold + ' Gold</div>' +
        '</div>' +
        cardsHtml +
        relicHtml +
        potionHtml +
        removeHtml +
        '<button class="btn btn-shop-leave" id="btn-shop-leave">LEAVE SHOP</button>' +
      '</div>';

    root.appendChild(screen);

    // Wire up card buy clicks
    shopCards.forEach(function(card, i) {
      var wrap = root.querySelector('[data-shop-card="' + i + '"]');
      if (wrap && run.gold >= shopCardPrices[i]) {
        wrap.style.cursor = 'pointer';
        wrap.onclick = function() {
          if (run.gold < shopCardPrices[i]) return;
          run.gold -= shopCardPrices[i];
          var deckCard = {
            id: card.baseId + '_shop_' + Date.now(),
            baseId: card.baseId,
            name: card.name,
            cost: card.cost,
            type: card.type,
            target: card.target,
            prefPos: card.prefPos.slice(),
            desc: card.desc,
            value: card.value,
            effect: card.effect,
            heroIdx: card.heroIdx,
            heroCls: card.heroCls,
            heroName: card.heroName,
            upgraded: false
          };
          run.deck.push(deckCard);
          wrap.classList.add('shop-sold');
          wrap.onclick = null;
          wrap.innerHTML = '<div class="shop-sold-label">SOLD</div>';
          // Update gold display
          root.querySelector('.shop-gold').textContent = '\uD83D\uDCB0 ' + run.gold + ' Gold';
          // Re-check affordability
          DS.UI._shopCheckAffordability(root, shopCardPrices, relicPrice, removePrice, run);
        };
      }
    });

    // Wire up relic buy
    var relicWrap = document.getElementById('shop-relic');
    if (relicWrap && shopRelic && run.gold >= relicPrice) {
      relicWrap.style.cursor = 'pointer';
      relicWrap.onclick = function() {
        if (run.gold < relicPrice) return;
        run.gold -= relicPrice;
        DS.State.addRelic(shopRelic);
        relicWrap.classList.add('shop-sold');
        relicWrap.onclick = null;
        relicWrap.innerHTML = '<div class="shop-sold-label">SOLD</div>';
        root.querySelector('.shop-gold').textContent = '\uD83D\uDCB0 ' + run.gold + ' Gold';
        DS.UI._shopCheckAffordability(root, shopCardPrices, relicPrice, removePrice, run);
      };
    }

    // Wire up healing potion
    var potionBtn = document.getElementById('shop-potion-btn');
    if (potionBtn && canAffordPotion) {
      potionBtn.style.cursor = 'pointer';
      potionBtn.onclick = function() {
        if (run.gold < potionPrice) return;
        run.gold -= potionPrice;
        run.heroes.forEach(function(h) {
          if (h.hp > 0 && h.maxHp) {
            h.hp = Math.min(h.hp + 15, h.maxHp);
          }
        });
        potionBtn.classList.add('shop-sold');
        potionBtn.onclick = null;
        potionBtn.innerHTML = '<div class="shop-sold-label">HEALED</div>';
        root.querySelector('.shop-gold').textContent = '\uD83D\uDCB0 ' + run.gold + ' Gold';
        DS.UI._shopCheckAffordability(root, shopCardPrices, relicPrice, removePrice, run);
      };
    }

    // Wire up remove card
    var removeBtn = document.getElementById('shop-remove-btn');
    if (removeBtn && canAffordRemove) {
      removeBtn.style.cursor = 'pointer';
      removeBtn.onclick = function() {
        if (run.gold < removePrice) return;
        DS.UI._showRemoveCardList(root, run, removePrice, shopCardPrices, relicPrice);
      };
    }

    // Leave button
    document.getElementById('btn-shop-leave').onclick = function() {
      DS.Game.afterShop();
    };
  },

  _showRemoveCardList: function(root, run, removePrice, shopCardPrices, relicPrice) {
    var listEl = document.getElementById('shop-remove-list');
    if (!listEl) return;
    listEl.style.display = 'block';
    listEl.innerHTML = '';

    run.deck.forEach(function(card, i) {
      var el = document.createElement('div');
      el.className = 'shop-remove-card';
      el.innerHTML =
        '<span class="shop-remove-card-name ' + card.heroCls + '">' + card.name + (card.upgraded ? '+' : '') + '</span>' +
        '<span class="shop-remove-card-class">' + card.heroName + '</span>' +
        '<span class="shop-remove-card-desc">' + card.desc + '</span>';
      el.style.cursor = 'pointer';
      (function(idx) {
        el.onclick = function() {
          if (run.gold < removePrice) return;
          run.gold -= removePrice;
          run.deck.splice(idx, 1);
          // Hide list, update display
          listEl.style.display = 'none';
          var removeBtn = document.getElementById('shop-remove-btn');
          if (removeBtn) {
            removeBtn.classList.add('shop-sold');
            removeBtn.onclick = null;
            removeBtn.innerHTML = '<div class="shop-sold-label">CARD REMOVED</div>';
          }
          root.querySelector('.shop-gold').textContent = '\uD83D\uDCB0 ' + run.gold + ' Gold';
          DS.UI._shopCheckAffordability(root, shopCardPrices, relicPrice, removePrice, run);
        };
      })(i);
      listEl.appendChild(el);
    });
  },

  _shopCheckAffordability: function(root, cardPrices, relicPrice, removePrice, run) {
    // Grey out items that can no longer be afforded
    cardPrices.forEach(function(price, i) {
      var wrap = root.querySelector('[data-shop-card="' + i + '"]');
      if (wrap && !wrap.classList.contains('shop-sold')) {
        if (run.gold < price) {
          wrap.classList.add('shop-unaffordable');
          wrap.style.cursor = 'default';
          wrap.onclick = null;
        }
      }
    });
    var relicWrap = document.getElementById('shop-relic');
    if (relicWrap && !relicWrap.classList.contains('shop-sold') && run.gold < relicPrice) {
      relicWrap.classList.add('shop-unaffordable');
      relicWrap.style.cursor = 'default';
      relicWrap.onclick = null;
    }
    var removeBtn = document.getElementById('shop-remove-btn');
    if (removeBtn && !removeBtn.classList.contains('shop-sold') && run.gold < removePrice) {
      removeBtn.classList.add('shop-unaffordable');
      removeBtn.style.cursor = 'default';
      removeBtn.onclick = null;
    }
  },

  // ===== DECK VIEWER (modal overlay) =====
  showDeckViewer: function() {
    var run = DS.State.run;
    if (!run || !run.deck) return;

    var existing = document.getElementById('deck-viewer-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'deck-viewer-overlay';
    overlay.className = 'deck-viewer-overlay';

    var sorted = run.deck.slice().sort(function(a, b) {
      if (a.heroCls !== b.heroCls) return a.heroCls.localeCompare(b.heroCls);
      return a.name.localeCompare(b.name);
    });

    var cardsHtml = '';
    sorted.forEach(function(card) {
      var artClass = 'card-art-' + card.type;
      cardsHtml +=
        '<div class="card deck-viewer-card ' + card.heroCls + (card.upgraded ? ' upgraded' : '') + '">' +
          '<div class="card-art ' + artClass + '"></div>' +
          '<div class="card-header">' +
            '<div class="card-name">' + card.name + '</div>' +
            '<div class="card-cost">' + card.cost + '</div>' +
          '</div>' +
          '<div class="card-effect">' + card.desc + '</div>' +
          '<div class="card-footer">' +
            '<div class="card-class">' + card.heroName + '</div>' +
            '<div class="card-pos-req">Pos ' + card.prefPos.join(',') + '</div>' +
          '</div>' +
        '</div>';
    });

    overlay.innerHTML =
      '<div class="deck-viewer-panel">' +
        '<div class="deck-viewer-header">' +
          '<h2>YOUR DECK (' + run.deck.length + ' cards)</h2>' +
          '<button class="btn btn-close-deck" id="btn-close-deck">\u2715 CLOSE</button>' +
        '</div>' +
        '<div class="deck-viewer-cards">' + cardsHtml + '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('btn-close-deck').onclick = function() {
      overlay.remove();
    };
    overlay.onclick = function(e) {
      if (e.target === overlay) overlay.remove();
    };
  },

  // ===== PILE VIEWER (draw/discard/exhaust during combat) =====
  showPileViewer: function(title, pile) {
    if (!pile) return;

    var existing = document.getElementById('deck-viewer-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'deck-viewer-overlay';
    overlay.className = 'deck-viewer-overlay';

    var sorted = pile.slice().sort(function(a, b) {
      if (a.heroCls !== b.heroCls) return a.heroCls.localeCompare(b.heroCls);
      return a.name.localeCompare(b.name);
    });

    var cardsHtml = '';
    if (sorted.length === 0) {
      cardsHtml = '<div style="color:var(--text-dim);text-align:center;padding:40px;">Empty</div>';
    } else {
      sorted.forEach(function(card) {
        var artClass = 'card-art-' + card.type;
        cardsHtml +=
          '<div class="card deck-viewer-card ' + card.heroCls + (card.upgraded ? ' upgraded' : '') + '">' +
            '<div class="card-art ' + artClass + '"></div>' +
            '<div class="card-header">' +
              '<div class="card-name">' + card.name + '</div>' +
              '<div class="card-cost">' + card.cost + '</div>' +
            '</div>' +
            '<div class="card-effect">' + card.desc + '</div>' +
            '<div class="card-footer">' +
              '<div class="card-class">' + card.heroName + '</div>' +
              '<div class="card-pos-req">Pos ' + card.prefPos.join(',') + '</div>' +
            '</div>' +
          '</div>';
      });
    }

    overlay.innerHTML =
      '<div class="deck-viewer-panel">' +
        '<div class="deck-viewer-header">' +
          '<h2>' + title + ' (' + pile.length + ' cards)</h2>' +
          '<button class="btn btn-close-deck" id="btn-close-pile">\u2715 CLOSE</button>' +
        '</div>' +
        '<div class="deck-viewer-cards">' + cardsHtml + '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('btn-close-pile').onclick = function() {
      overlay.remove();
    };
    overlay.onclick = function(e) {
      if (e.target === overlay) overlay.remove();
    };
  },

  // ===== GAME OVER SCREEN =====
  renderGameOver: function(root) {
    root.innerHTML = '';
    var screen = document.createElement('div');
    screen.className = 'screen screen-gameover';

    var stats = DS.State.stats;
    var wasVictory = stats.floorsCleared >= 7;
    var run = DS.State.run;

    // Show relics collected
    var relicSummary = '';
    if (run && run.relics && run.relics.length > 0) {
      relicSummary = '<div class="stat-row">Relics: ' +
        run.relics.map(function(r) { return r.icon + ' ' + r.name; }).join(', ') +
        '</div>';
    }

    screen.innerHTML =
      '<div class="gameover-panel">' +
        '<h1 class="gameover-text ' + (wasVictory ? 'victory' : 'defeat') + '">' +
          (wasVictory ? 'VICTORY' : 'DEFEATED') +
        '</h1>' +
        '<div class="gameover-sub">' +
          (wasVictory ? 'The Lich is vanquished. Light returns to the Spire.' : 'Your party has fallen to darkness.') +
        '</div>' +
        '<div class="gameover-stats">' +
          '<div class="stat-row">Floors Cleared: ' + stats.floorsCleared + '</div>' +
          '<div class="stat-row">Enemies Slain: ' + stats.enemiesSlain + '</div>' +
          '<div class="stat-row">Cards Collected: ' + stats.cardsCollected + '</div>' +
          relicSummary +
        '</div>' +
        '<button class="btn btn-new-run" id="btn-gameover-restart">NEW RUN</button>' +
      '</div>';

    root.appendChild(screen);

    document.getElementById('btn-gameover-restart').onclick = function() {
      if (DS.Meta && DS.Meta.hasSave()) {
        DS.Meta.load();
        DS.State.screen = 'town';
      } else {
        DS.State.screen = 'title';
      }
      DS.UI.render();
    };
  },

  // ===== INJECT INLINE STYLES (map, event, shop) =====
  _stylesInjected: {},

  _injectMapStyles: function() {
    if (DS.UI._stylesInjected.map) return;
    DS.UI._stylesInjected.map = true;
    var style = document.createElement('style');
    style.textContent = [
      '.screen-map { display:flex; flex-direction:column; min-height:100vh; background:var(--bg-darkest); }',
      '.map-header { display:flex; justify-content:space-between; align-items:center; padding:12px 24px; background:linear-gradient(180deg,#1a0e28,var(--bg-dark)); border-bottom:2px solid var(--border); }',
      '.map-header-left { display:flex; align-items:center; gap:16px; }',
      '.map-header-right { display:flex; align-items:center; gap:8px; }',
      '.map-gold { font-size:14px; }',
      '.map-body { flex:1; display:flex; justify-content:center; align-items:center; padding:20px; }',
      '.map-footer { padding:16px 24px; border-top:2px solid var(--border); background:var(--bg-dark); }',
      '.map-deck-info { text-align:center; font-size:12px; color:var(--text-dim); margin-top:8px; letter-spacing:1px; }',
      '.relic-icons { display:flex; gap:6px; flex-wrap:wrap; }',
      '.relic-icon { font-size:20px; cursor:help; transition:transform 0.2s; }',
      '.relic-icon:hover { transform:scale(1.3); }',
      '.party-bar { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }',
      '.party-hero { padding:8px 14px; background:var(--bg-panel); border:1px solid var(--border); border-radius:6px; min-width:110px; text-align:center; }',
      '.party-hero-name { font-size:12px; font-weight:700; margin-bottom:3px; }',
      '.party-hero-hp { font-size:11px; color:var(--text-dim); margin-bottom:3px; }',
    ].join('\n');
    document.head.appendChild(style);
  },

  _injectEventStyles: function() {
    if (DS.UI._stylesInjected.event) return;
    DS.UI._stylesInjected.event = true;
    var style = document.createElement('style');
    style.textContent = [
      '.screen-event { display:flex; justify-content:center; align-items:center; background:radial-gradient(circle at 50% 40%,rgba(100,40,180,0.15) 0%,transparent 60%),var(--bg-darkest); }',
      '.event-panel { text-align:center; max-width:650px; padding:40px; }',
      '.event-icon { font-size:56px; margin-bottom:10px; }',
      '.event-title { font-size:36px; font-weight:900; letter-spacing:6px; color:var(--purple); text-shadow:0 0 20px rgba(140,60,220,0.4); margin-bottom:12px; }',
      '.event-text { font-size:15px; color:var(--text-dim); line-height:1.7; margin-bottom:28px; max-width:540px; margin-left:auto; margin-right:auto; font-style:italic; }',
      '.event-choices { display:flex; flex-direction:column; gap:12px; margin-bottom:20px; }',
      '.btn-event-choice { padding:16px 24px; text-align:left; background:var(--bg-panel); border:2px solid var(--border); border-radius:8px; cursor:pointer; transition:all 0.3s; color:var(--text); }',
      '.btn-event-choice:hover { border-color:var(--purple); box-shadow:0 0 16px rgba(140,60,220,0.2); background:rgba(100,40,160,0.1); }',
      '.event-choice-label { font-size:15px; font-weight:700; color:var(--text-bright); margin-bottom:4px; }',
      '.event-choice-desc { font-size:12px; color:var(--text-dim); }',
      '.event-result { font-size:15px; color:var(--text); line-height:1.6; margin-bottom:24px; padding:20px; background:var(--bg-panel); border:1px solid var(--border); border-radius:8px; font-style:italic; }',
      '.btn-event-continue { padding:14px 40px; font-size:16px; font-weight:700; letter-spacing:3px; }',
    ].join('\n');
    document.head.appendChild(style);
  },

  _injectShopStyles: function() {
    if (DS.UI._stylesInjected.shop) return;
    DS.UI._stylesInjected.shop = true;
    var style = document.createElement('style');
    style.textContent = [
      '.screen-shop { display:flex; justify-content:center; align-items:flex-start; background:radial-gradient(circle at 50% 30%,rgba(40,100,50,0.12) 0%,transparent 50%),var(--bg-darkest); min-height:100vh; padding-top:20px; }',
      '.shop-panel { text-align:center; max-width:800px; width:100%; padding:30px; }',
      '.shop-header { margin-bottom:24px; }',
      '.shop-title { font-size:40px; font-weight:900; letter-spacing:8px; color:var(--gold); text-shadow:0 0 20px rgba(212,168,67,0.3); margin-bottom:8px; }',
      '.shop-gold { font-size:20px; color:var(--gold); font-weight:700; }',
      '.shop-section { margin-bottom:28px; }',
      '.shop-section-title { font-size:14px; letter-spacing:3px; color:var(--text-dim); text-transform:uppercase; margin-bottom:12px; }',
      '.shop-cards { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }',
      '.shop-card-wrap { display:flex; flex-direction:column; align-items:center; gap:6px; transition:all 0.3s; border-radius:8px; padding:8px; }',
      '.shop-card-wrap:hover:not(.shop-unaffordable):not(.shop-sold) { transform:translateY(-6px); }',
      '.shop-price { font-size:14px; font-weight:700; color:var(--gold); }',
      '.shop-price-red { color:var(--red); }',
      '.shop-unaffordable { opacity:0.35; pointer-events:none; }',
      '.shop-sold { opacity:0.25; pointer-events:none; }',
      '.shop-sold-label { font-size:14px; font-weight:700; color:var(--text-dim); letter-spacing:2px; padding:20px; }',
      '.shop-relics { display:flex; justify-content:center; }',
      '.shop-relic-wrap { display:flex; flex-direction:column; align-items:center; gap:8px; padding:16px 24px; background:var(--bg-panel); border:2px solid var(--border); border-radius:8px; cursor:pointer; transition:all 0.3s; max-width:350px; }',
      '.shop-relic-wrap:hover:not(.shop-unaffordable):not(.shop-sold) { border-color:var(--gold); box-shadow:0 0 16px rgba(212,168,67,0.2); }',
      '.shop-relic-item { display:flex; align-items:center; gap:12px; text-align:left; }',
      '.shop-relic-icon { font-size:32px; }',
      '.shop-relic-name { font-size:15px; font-weight:700; color:var(--text-bright); }',
      '.shop-relic-desc { font-size:12px; color:var(--text-dim); margin-top:2px; }',
      '.shop-relic-rarity { font-size:10px; color:var(--text-dim); text-transform:uppercase; letter-spacing:1px; margin-top:2px; }',
      '.shop-remove { display:flex; justify-content:space-between; align-items:center; padding:16px 24px; background:var(--bg-panel); border:2px solid var(--border); border-radius:8px; cursor:pointer; transition:all 0.3s; }',
      '.shop-remove:hover:not(.shop-unaffordable):not(.shop-sold) { border-color:var(--crimson); box-shadow:0 0 12px rgba(196,60,60,0.2); }',
      '.shop-remove-label { font-size:14px; color:var(--text); }',
      '.shop-remove-list { max-height:300px; overflow-y:auto; margin-top:12px; display:flex; flex-direction:column; gap:4px; }',
      '.shop-remove-card { display:flex; gap:12px; align-items:center; padding:10px 16px; background:var(--bg-panel); border:1px solid var(--border); border-radius:6px; cursor:pointer; transition:all 0.2s; text-align:left; }',
      '.shop-remove-card:hover { border-color:var(--crimson); background:rgba(196,60,60,0.08); }',
      '.shop-remove-card-name { font-size:13px; font-weight:700; min-width:120px; }',
      '.shop-remove-card-name.fighter { color:var(--gold); }',
      '.shop-remove-card-name.rogue { color:var(--crimson); }',
      '.shop-remove-card-name.cleric { color:var(--blue); }',
      '.shop-remove-card-name.wizard { color:var(--purple); }',
      '.shop-remove-card-class { font-size:10px; color:var(--text-dim); text-transform:uppercase; letter-spacing:1px; min-width:60px; }',
      '.shop-remove-card-desc { font-size:11px; color:var(--text-dim); flex:1; }',
      '.btn-shop-leave { padding:14px 40px; font-size:16px; font-weight:700; letter-spacing:3px; margin-top:12px; }',
    ].join('\n');
    document.head.appendChild(style);
  },

  _injectCombatStyles: function() {
    if (DS.UI._stylesInjected.combat) return;
    DS.UI._stylesInjected.combat = true;
    var style = document.createElement('style');
    style.textContent = [
      '.top-bar-center { display:flex; align-items:center; justify-content:center; }',
      '.turn-phase-indicator { font-size:13px; font-weight:900; letter-spacing:3px; text-transform:uppercase; padding:3px 14px; border-radius:4px; transition:all 0.3s; }',
      '.turn-phase-indicator.player-phase { color:#44ff88; text-shadow:0 0 8px rgba(68,255,136,0.4); }',
      '.turn-phase-indicator.enemy-phase { color:#ff4444; text-shadow:0 0 8px rgba(255,68,68,0.4); animation:enemyPhasePulse 0.8s ease-in-out infinite; }',
      '@keyframes enemyPhasePulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }',
    ].join('\n');
    document.head.appendChild(style);
  }
};
