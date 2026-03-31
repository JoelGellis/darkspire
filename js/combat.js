window.DS = window.DS || {};

DS.Combat = {
  // ===== RELIC HOOK HELPER =====
  fireRelicHook: function(hookName) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (DS.Relics && DS.Relics.fireHook) {
      return DS.Relics.fireHook(DS.State, hookName, args);
    }
    // Fallback inline loop
    if (!DS.State.run || !DS.State.run.relics) return [];
    var results = [];
    DS.State.run.relics.forEach(function(relic) {
      if (relic && typeof relic[hookName] === 'function') {
        var result = relic[hookName].apply(relic, [DS.State].concat(args));
        if (result) results.push(result);
      }
    });
    return results;
  },

  // Check if any owned relic has a specific flag
  hasRelicFlag: function(flagName) {
    if (!DS.State.run || !DS.State.run.relics) return false;
    return DS.State.run.relics.some(function(r) { return r && r[flagName]; });
  },

  // Sum a numeric flag across all relics
  sumRelicFlag: function(flagName) {
    if (!DS.State.run || !DS.State.run.relics) return 0;
    var total = 0;
    DS.State.run.relics.forEach(function(r) {
      if (r && typeof r[flagName] === 'number') total += r[flagName];
    });
    return total;
  },

  // ===== INIT =====
  initCombat: function(enemyPool) {
    DS.State.startCombat(enemyPool);
    var combat = DS.State.combat;
    var run = DS.State.run;

    // Floor scaling is handled in State.startCombat (copies + scales intents safely)

    // Apply energyBonus from relics
    var bonusEnergy = DS.Combat.sumRelicFlag('energyBonus');
    if (bonusEnergy > 0) {
      combat.maxEnergy += bonusEnergy;
      combat.energy += bonusEnergy;
    }

    // Build draw pile from run deck, deep copy each card
    combat.drawPile = run.deck.map(function(card) {
      return {
        id: card.id,
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
        upgraded: card.upgraded || false
      };
    });

    DS.Combat.shuffle(combat.drawPile);

    // Pick initial enemy intents
    combat.enemies.forEach(function(e) {
      DS.Combat.pickIntent(e);
    });

    // Clear log
    combat.log = [];

    // Draw opening hand
    for (var i = 0; i < 5; i++) DS.Combat.drawCard();

    // Fire onCombatStart relic hook
    DS.Combat.fireRelicHook('onCombatStart');
  },

  // ===== UTILITY =====
  shuffle: function(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  },

  aliveHeroes: function() {
    return DS.State.run.heroes.filter(function(h) { return h.hp > 0; });
  },

  aliveEnemies: function() {
    return DS.State.combat.enemies.filter(function(e) { return e.hp > 0; });
  },

  pickIntent: function(enemy) {
    enemy.currentIntent = enemy.intentPool[Math.floor(Math.random() * enemy.intentPool.length)];
  },

  sleep: function(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  },

  // ===== CAN PLAY CHECK =====
  canPlayCard: function(card) {
    var hero = DS.State.run.heroes[card.heroIdx];
    var combat = DS.State.combat;
    var run = DS.State.run;
    if (hero.hp <= 0) {
      // Soul Jar: dead heroes' cards can still be played at 50% effectiveness
      if (DS.Combat.hasRelicFlag('deadHeroCards')) {
        if (card.cost > combat.energy) return { playable: false, reason: 'energy' };
        return { playable: true, reason: null, soulJar: true };
      }
      return { playable: false, reason: 'dead' };
    }
    if (card.cost > combat.energy) return { playable: false, reason: 'energy' };
    if (!card.prefPos.includes(hero.pos)) {
      // Check for Position Boots relic — allows bypassing position once
      if (DS.Combat.hasRelicFlag('ignorePosition') && !run._bootsUsed) {
        return { playable: true, reason: null, usesBoots: true };
      }
      return { playable: false, reason: 'position' };
    }
    // Resurrect-type cards need at least one dead hero to target
    if (card.target === 'ally_dead') {
      var hasDead = run.heroes.some(function(h) { return h.hp <= 0; });
      if (!hasDead) return { playable: false, reason: 'no_target' };
    }
    return { playable: true, reason: null };
  },

  // ===== CARD SELECTION =====
  selectCard: function(idx) {
    var combat = DS.State.combat;
    if (combat.gameOver || combat.animating) return;
    var card = combat.hand[idx];
    if (!card) return;

    var check = DS.Combat.canPlayCard(card);
    if (!check.playable) return;

    // Deselect if clicking same card
    if (combat.selectedCard === idx) {
      combat.selectedCard = null;
      DS.UI.render();
      return;
    }

    combat.selectedCard = idx;

    // Auto-target for self/none/all
    if (card.target === 'none' || card.target === 'self' || card.target === 'all_allies' || card.target === 'all_enemies') {
      DS.Combat.playCard(idx, null);
      return;
    }

    DS.UI.render();
  },

  // ===== CLICK TARGET =====
  clickTarget: function(targetId) {
    var combat = DS.State.combat;
    if (combat.gameOver || combat.animating) return;
    if (combat.selectedCard === null) return;

    var card = combat.hand[combat.selectedCard];
    if (!card) return;

    var target = DS.State.run.heroes.find(function(h) { return h.id === targetId; }) ||
                 combat.enemies.find(function(e) { return e.id === targetId; });
    if (!target) return;
    // Allow targeting dead heroes for cards like Resurrect (ally_dead)
    if (target.hp <= 0 && card.target !== 'ally_dead') return;

    // Validate target type
    if ((card.target === 'enemy' || card.target === 'enemy_any') && target.isHero) return;
    if (card.target === 'ally' && !target.isHero) return;
    if (card.target === 'ally_dead' && (!target.isHero || target.hp > 0)) return;

    DS.Combat.playCard(combat.selectedCard, target);
  },

  // ===== PLAY CARD =====
  playCard: function(handIdx, target) {
    var combat = DS.State.combat;
    var card = combat.hand[handIdx];
    if (!card) return;

    var check = DS.Combat.canPlayCard(card);
    if (!check.playable) return;

    // If using Position Boots, mark them used
    if (check.usesBoots) {
      DS.State.run._bootsUsed = true;
      DS.Combat.logMsg('Position Boots activate! Position ignored.', 'system');
    }

    // Soul Jar: temporarily halve the card's value for this play
    var soulJarActive = check.soulJar || false;
    var originalValue = card.value;
    if (soulJarActive && card.value) {
      card.value = Math.ceil(card.value * 0.5);
      DS.Combat.logMsg('Soul Jar channels a fading spirit...', 'system');
    }

    var hero = DS.State.run.heroes[card.heroIdx];

    // Track last attacker for vampiric blade
    if (card.type === 'attack') {
      if (combat) combat._lastAttacker = hero;
    }

    // Apply Strength bonus and Weak penalty to attack card value
    var strengthBonus = 0;
    var weakPenalty = 1;
    if (card.type === 'attack' && card.value) {
      strengthBonus = hero.strength || 0;
      if (hero.weak > 0) weakPenalty = 0.75;
      if (strengthBonus > 0 || weakPenalty < 1) {
        card.value = Math.max(1, Math.ceil((card.value + strengthBonus) * weakPenalty));
      }
    }

    combat.energy -= card.cost;

    // Log
    var logText = hero.name + ' plays ' + card.name;
    if (target && target !== hero) logText += ' on ' + target.name;
    DS.Combat.logMsg(logText, card.type === 'attack' ? 'damage' : card.type === 'heal' ? 'heal' : 'block-log');

    // Animate card
    var cardEl = document.querySelector('[data-hand-idx="' + handIdx + '"]');
    if (cardEl) cardEl.classList.add('playing');

    // Execute (pass card as 4th arg so effects can use card.value)
    card.effect(DS.State, hero, target, card);

    // Fire onCardPlayed relic hook
    var hookResults = DS.Combat.fireRelicHook('onCardPlayed', card);
    // Apply any bonus damage from relic hooks (e.g., Sharpening Stone, Berserker's Ring)
    hookResults.forEach(function(result) {
      if (result && result.bonusDamage && target && !target.isHero && target.hp > 0) {
        DS.Combat.logMsg('Relic bonus: +' + result.bonusDamage + ' damage!', 'damage');
        DS.Combat.dealDamage(target, result.bonusDamage);
      }
    });

    // Restore modified card value
    if (originalValue !== undefined) {
      card.value = originalValue;
    }

    // Discard or exhaust
    combat.hand.splice(handIdx, 1);
    if (card._exhaust) {
      combat.exhaustPile.push(card);
      DS.Combat.logMsg(card.name + ' is exhausted!', 'system');
    } else {
      combat.discardPile.push(card);
    }
    combat.selectedCard = null;

    if (!combat.gameOver) DS.UI.render();
  },

  // ===== END TURN =====
  endTurn: async function() {
    var combat = DS.State.combat;
    if (combat.gameOver || combat.animating) return;
    combat.animating = true;
    combat.selectedCard = null;

    // Discard remaining hand
    combat.discardPile.push.apply(combat.discardPile, combat.hand);
    combat.hand = [];
    DS.UI.render();

    var endTurnBtn = document.getElementById('btn-end-turn');
    if (endTurnBtn) endTurnBtn.disabled = true;

    DS.Combat.logMsg('--- Enemy Turn ---', 'system');

    await DS.Combat.sleep(400);

    // Time Crystal: skip enemy actions on turn 1
    if (DS.State.run._timeCrystalActive && combat.turn === 1) {
      DS.State.run._timeCrystalActive = false;
      DS.Combat.logMsg('Time Crystal shimmers — enemies are frozen!', 'system');
      DS.Combat.logMsg('--- Your Turn ---', 'system');
      combat.turn++;
      combat.energy = combat.maxEnergy;
      // Dragon's Heart: decay by 1 instead of full reset
      if (DS.Combat.hasRelicFlag('persistentBlock')) {
        DS.State.run.heroes.forEach(function(h) {
          if (h.block > 0) h.block = Math.max(0, h.block - 1);
        });
      } else {
        DS.State.run.heroes.forEach(function(h) { h.block = 0; });
      }
      combat.enemies.forEach(function(e) { if (e.hp > 0) e.block = 0; });
      DS.Combat.fireRelicHook('onTurnStart');
      combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.pickIntent(e);
      });
      for (var tc = 0; tc < 5; tc++) DS.Combat.drawCard();
      combat.animating = false;
      if (endTurnBtn) endTurnBtn.disabled = false;
      DS.UI.render();
      return;
    }

    // Enemy actions
    for (var ei = 0; ei < combat.enemies.length; ei++) {
      var enemy = combat.enemies[ei];
      if (enemy.hp <= 0 || combat.gameOver) continue;

      // Stunned?
      if (enemy.stunned) {
        DS.Combat.logMsg(enemy.name + ' is stunned and cannot act!', 'stun-log');
        enemy.stunned = false;
        await DS.Combat.sleep(500);
        continue;
      }

      var intent = enemy.currentIntent;
      if (!intent) continue;

      // Track attacking enemy for Crown of Thorns
      combat._lastAttackingEnemy = enemy;

      // Apply enemyDamageBonus from relics (e.g., Philosopher's Stone)
      var enemyDmgBonus = DS.Combat.sumRelicFlag('enemyDamageBonus');

      // Weak: enemies deal 25% less damage when Weak
      var enemyWeakMult = (enemy.weak > 0) ? 0.75 : 1;

      if (intent.type === 'attack') {
        var alive = DS.Combat.aliveHeroes();
        if (!alive.length) break;
        var target;
        var tauntTarget = enemy.taunted ? DS.State.run.heroes.find(function(h) { return h.id === enemy.taunted && h.hp > 0; }) : null;
        if (tauntTarget) {
          target = tauntTarget;
        } else if (intent.targeting === 'front') {
          target = alive.reduce(function(a, b) { return a.pos < b.pos ? a : b; });
        } else if (intent.targeting === 'back') {
          target = alive.reduce(function(a, b) { return a.pos > b.pos ? a : b; });
        } else {
          target = alive[Math.floor(Math.random() * alive.length)];
        }
        var dmg = intent.dmg + (enemy.dmgBuff || 0) + enemyDmgBonus;
        if (enemy.weak > 0) dmg = Math.ceil(dmg * 0.75);
        DS.Combat.logMsg(enemy.name + ' attacks ' + target.name + ' for ' + dmg + '!', 'damage');
        DS.Combat.dealDamage(target, dmg);
        await DS.Combat.sleep(600);

      } else if (intent.type === 'attack_multi') {
        var alive2 = DS.Combat.aliveHeroes();
        if (!alive2.length) break;
        var dmg2 = intent.dmg + (enemy.dmgBuff || 0) + enemyDmgBonus;
        if (enemy.weak > 0) dmg2 = Math.ceil(dmg2 * 0.75);
        DS.Combat.logMsg(enemy.name + ' fires ' + intent.hits + ' shots for ' + dmg2 + ' each!', 'damage');
        for (var shot = 0; shot < intent.hits; shot++) {
          var targets = DS.Combat.aliveHeroes();
          if (!targets.length) break;
          var t = targets[Math.floor(Math.random() * targets.length)];
          DS.Combat.dealDamage(t, dmg2);
          await DS.Combat.sleep(300);
        }
        await DS.Combat.sleep(300);

      } else if (intent.type === 'attack_all') {
        var alive3 = DS.Combat.aliveHeroes();
        if (!alive3.length) break;
        var dmg3 = intent.dmg + (enemy.dmgBuff || 0) + enemyDmgBonus;
        if (enemy.weak > 0) dmg3 = Math.ceil(dmg3 * 0.75);
        DS.Combat.logMsg(enemy.name + ' attacks ALL heroes for ' + dmg3 + '!', 'damage');
        alive3.forEach(function(h) {
          DS.Combat.dealDamage(h, dmg3);
        });
        await DS.Combat.sleep(600);

      } else if (intent.type === 'attack_poison') {
        var alive4 = DS.Combat.aliveHeroes();
        if (!alive4.length) break;
        var target4;
        if (intent.targeting === 'front') {
          target4 = alive4.reduce(function(a, b) { return a.pos < b.pos ? a : b; });
        } else {
          target4 = alive4[Math.floor(Math.random() * alive4.length)];
        }
        var dmg4 = intent.dmg + (enemy.dmgBuff || 0) + enemyDmgBonus;
        if (enemy.weak > 0) dmg4 = Math.ceil(dmg4 * 0.75);
        DS.Combat.logMsg(enemy.name + ' strikes ' + target4.name + ' for ' + dmg4 + ' + ' + intent.poison + ' Poison!', 'damage');
        DS.Combat.dealDamage(target4, dmg4);
        DS.Combat.applyPoison(target4, intent.poison);
        await DS.Combat.sleep(600);

      } else if (intent.type === 'poison') {
        var alive5 = DS.Combat.aliveHeroes();
        if (!alive5.length) break;
        var target5 = alive5[Math.floor(Math.random() * alive5.length)];
        DS.Combat.logMsg(enemy.name + ' poisons ' + target5.name + ' for ' + intent.poison + '!', 'poison-log');
        DS.Combat.applyPoison(target5, intent.poison);
        await DS.Combat.sleep(500);

      } else if (intent.type === 'defend') {
        DS.Combat.gainBlock(enemy, intent.block);
        await DS.Combat.sleep(500);

      } else if (intent.type === 'buff') {
        combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          e.dmgBuff = (e.dmgBuff || 0) + intent.buffAmt;
        });
        DS.Combat.logMsg(enemy.name + ' roars! All enemies gain +' + intent.buffAmt + ' damage!', 'stun-log');
        await DS.Combat.sleep(500);

      } else if (intent.type === 'heal_allies') {
        combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.healTarget(e, intent.heal);
        });
        DS.Combat.logMsg(enemy.name + ' heals all allies for ' + intent.heal + '!', 'heal');
        await DS.Combat.sleep(500);

      } else if (intent.type === 'summon') {
        DS.Combat.logMsg(enemy.name + ' summons reinforcements!', 'system');
        // Revive any dead non-boss allies
        combat.enemies.forEach(function(e) {
          if (e.hp <= 0 && !e.isBoss) {
            e.hp = Math.round(e.maxHp * 0.75);
            e.block = 0;
            e.poison = 0;
            e.stunned = false;
            e.dmgBuff = 0;
            DS.Combat.pickIntent(e);
          }
        });
        await DS.Combat.sleep(500);

      } else if (intent.type === 'weaken') {
        var alive6 = DS.Combat.aliveHeroes();
        if (!alive6.length) break;
        var target6 = alive6[Math.floor(Math.random() * alive6.length)];
        DS.Combat.applyWeak(target6, intent.turns || 2);
        await DS.Combat.sleep(500);

      } else if (intent.type === 'vulnerable') {
        var alive7 = DS.Combat.aliveHeroes();
        if (!alive7.length) break;
        var target7 = alive7[Math.floor(Math.random() * alive7.length)];
        DS.Combat.applyVulnerable(target7, intent.turns || 2);
        await DS.Combat.sleep(500);
      }

      if (combat.gameOver) break;
      DS.UI.render();
    }

    combat._lastAttackingEnemy = null;

    if (combat.gameOver) {
      combat.animating = false;
      DS.UI.render();
      return;
    }

    // === Poison ticks ===
    var heroes = DS.State.run.heroes;
    for (var hi = 0; hi < heroes.length; hi++) {
      var h = heroes[hi];
      if (h.hp > 0 && h.poison > 0) {
        DS.Combat.logMsg(h.name + ' takes ' + h.poison + ' poison damage!', 'poison-log');
        h.hp = Math.max(0, h.hp - h.poison);
        DS.Combat.floatText(h, '-' + h.poison, 'poison');
        h.poison = Math.max(0, h.poison - 1);
        if (h.hp <= 0) {
          DS.Combat.logMsg(h.name + ' succumbs to poison!', 'kill');
          DS.Combat.checkGameOver();
        }
      }
    }

    for (var epi = 0; epi < combat.enemies.length; epi++) {
      var ep = combat.enemies[epi];
      if (ep.hp > 0 && ep.poison > 0) {
        DS.Combat.logMsg(ep.name + ' takes ' + ep.poison + ' poison damage!', 'poison-log');
        ep.hp = Math.max(0, ep.hp - ep.poison);
        DS.Combat.floatText(ep, '-' + ep.poison, 'poison');
        ep.poison = Math.max(0, ep.poison - 1);
        if (ep.hp <= 0) {
          DS.Combat.logMsg(ep.name + ' is slain by poison!', 'kill');
          DS.Combat.handleDeath(ep);
          DS.Combat.checkGameOver();
        }
      }
    }

    // === Status effect decay (Weak, Vulnerable, Bleed) ===
    var allUnits = heroes.concat(combat.enemies);
    for (var si = 0; si < allUnits.length; si++) {
      var u = allUnits[si];
      if (u.hp <= 0) continue;
      if (u.weak > 0) u.weak--;
      if (u.vulnerable > 0) u.vulnerable--;
      if (u.bleed > 0) {
        DS.Combat.logMsg(u.name + ' takes ' + u.bleed + ' Bleed damage!', 'damage');
        u.hp = Math.max(0, u.hp - u.bleed);
        DS.Combat.floatText(u, '-' + u.bleed, 'damage');
        u.bleed = Math.max(0, u.bleed - 1);
        if (u.hp <= 0) {
          DS.Combat.logMsg(u.name + ' bleeds out!', 'kill');
          if (!u.isHero) DS.Combat.handleDeath(u);
          DS.Combat.checkGameOver();
        }
      }
    }

    if (combat.gameOver) {
      combat.animating = false;
      DS.UI.render();
      return;
    }

    // === New player turn ===
    DS.Combat.logMsg('--- Your Turn ---', 'system');
    combat.turn++;
    combat.energy = combat.maxEnergy;

    // Block decay — Dragon's Heart: decay by 1 instead of full reset
    if (DS.Combat.hasRelicFlag('persistentBlock')) {
      DS.State.run.heroes.forEach(function(h) {
        if (h.block > 0) h.block = Math.max(0, h.block - 1);
      });
    } else {
      DS.State.run.heroes.forEach(function(h) { h.block = 0; });
    }
    // Enemies always lose block at player turn start
    combat.enemies.forEach(function(e) { if (e.hp > 0) e.block = 0; });

    // Fire onTurnStart relic hook
    DS.Combat.fireRelicHook('onTurnStart');

    // Pick new enemy intents
    combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
      e.taunted = null;
      DS.Combat.pickIntent(e);
    });

    // Draw new hand
    for (var d = 0; d < 5; d++) DS.Combat.drawCard();

    combat.animating = false;
    if (endTurnBtn) endTurnBtn.disabled = false;
    DS.UI.render();
  },

  // ===== COMBAT ACTIONS =====
  dealDamage: function(target, amount) {
    // Apply Vulnerable: target takes 50% more damage
    if (target.vulnerable > 0) {
      amount = Math.ceil(amount * 1.5);
    }

    // Block always absorbs and is consumed (Dragon's Heart just prevents reset)
    var blocked = Math.min(target.block, amount);
    var remaining = amount - blocked;
    target.block -= blocked;
    target.hp = Math.max(0, target.hp - remaining);

    if (blocked > 0) {
      DS.Combat.logMsg(target.name + ' blocks ' + blocked + ' damage.', 'block-log');
    }

    DS.Combat.floatText(target, remaining > 0 ? '-' + remaining : 'BLOCK', remaining > 0 ? 'damage' : 'block');

    // Screen shake on big hits
    if (remaining >= 10) {
      var root = document.getElementById('game-root');
      if (root) {
        root.classList.add('screen-shake');
        setTimeout(function() { root.classList.remove('screen-shake'); }, 300);
      }
    }

    var el = document.getElementById(target.id);
    if (el) el.classList.add('targeted');
    setTimeout(function() { if (el) el.classList.remove('targeted'); }, 300);

    // Fire onDamageTaken relic hook for heroes taking damage
    if (target.isHero && remaining > 0) {
      var dmgResults = DS.Combat.fireRelicHook('onDamageTaken', target, remaining);
      dmgResults.forEach(function(result) {
        if (result && result.prevented) {
          DS.Combat.logMsg(result.message || 'A relic intervenes!', 'system');
          DS.Combat.floatText(target, 'SAVED!', 'heal');
        }
      });
    }

    if (target.hp <= 0) {
      if (!target.isHero) {
        DS.Combat.fireRelicHook('onEnemyKill', target);
        DS.Combat.logMsg(target.name + ' is slain!', 'kill');
      } else {
        DS.Combat.logMsg(target.name + ' has fallen!', 'kill');
      }
      DS.Combat.handleDeath(target);
      DS.Combat.checkGameOver();
    }
  },

  healTarget: function(target, amount) {
    var before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + amount);
    var healed = target.hp - before;
    if (healed > 0) {
      DS.Combat.logMsg(target.name + ' heals ' + healed + ' HP.', 'heal');
      DS.Combat.floatText(target, '+' + healed, 'heal');
      var el = document.getElementById(target.id);
      if (el) { el.style.animation = 'none'; el.offsetHeight; el.style.animation = 'flash-heal 0.4s'; }
    }
  },

  gainBlock: function(target, amount) {
    target.block += amount;
    DS.Combat.logMsg(target.name + ' gains ' + amount + ' Block (total: ' + target.block + ').', 'block-log');
    DS.Combat.floatText(target, '+' + amount + ' BLK', 'block');
    var el = document.getElementById(target.id);
    if (el) { el.style.animation = 'none'; el.offsetHeight; el.style.animation = 'flash-block 0.4s'; }
  },

  applyPoison: function(target, amount) {
    target.poison = (target.poison || 0) + amount;
    DS.Combat.logMsg(target.name + ' gains ' + amount + ' Poison (total: ' + target.poison + ').', 'poison-log');
    DS.Combat.floatText(target, '+' + amount + ' PSN', 'poison');
  },

  applyWeak: function(target, turns) {
    target.weak = (target.weak || 0) + turns;
    DS.Combat.logMsg(target.name + ' is Weakened for ' + turns + ' turns! (ATK -25%)', 'stun-log');
    DS.Combat.floatText(target, 'WEAK', 'poison');
  },

  applyVulnerable: function(target, turns) {
    target.vulnerable = (target.vulnerable || 0) + turns;
    DS.Combat.logMsg(target.name + ' is Vulnerable for ' + turns + ' turns! (DMG +50%)', 'damage');
    DS.Combat.floatText(target, 'VULN', 'damage');
  },

  applyStrength: function(target, amount) {
    target.strength = (target.strength || 0) + amount;
    DS.Combat.logMsg(target.name + ' gains ' + amount + ' Strength!', 'stun-log');
    DS.Combat.floatText(target, '+' + amount + ' STR', 'block');
  },

  applyBleed: function(target, amount) {
    target.bleed = (target.bleed || 0) + amount;
    DS.Combat.logMsg(target.name + ' gains ' + amount + ' Bleed!', 'damage');
    DS.Combat.floatText(target, '+' + amount + ' BLD', 'damage');
  },

  moveForward: function(hero) {
    if (hero.pos <= 1) {
      DS.Combat.logMsg(hero.name + ' is already at the front.', '');
      return;
    }
    var heroes = DS.State.run.heroes;
    var inFront = heroes.find(function(h) { return h.hp > 0 && h.pos === hero.pos - 1; });
    if (inFront) {
      var oldPos = hero.pos;
      hero.pos = inFront.pos;
      inFront.pos = oldPos;
      DS.Combat.logMsg(hero.name + ' advances! ' + inFront.name + ' shifts to pos ' + inFront.pos + '.', '');
    } else {
      hero.pos--;
      DS.Combat.logMsg(hero.name + ' advances to position ' + hero.pos + '.', '');
    }
  },

  drawCard: function() {
    var combat = DS.State.combat;
    if (combat.drawPile.length === 0) {
      if (combat.discardPile.length === 0) return;
      combat.drawPile = DS.Combat.shuffle(combat.discardPile.slice());
      combat.discardPile = [];
      DS.Combat.logMsg('Deck reshuffled from discard.', 'system');
    }
    var card = combat.drawPile.pop();
    if (card) combat.hand.push(card);
  },

  handleDeath: function(target) {
    if (!target.isHero && target.deathEffect) {
      if (target.deathEffect === 'poison_random_2') {
        var alive = DS.Combat.aliveHeroes();
        if (alive.length > 0) {
          var victim = alive[Math.floor(Math.random() * alive.length)];
          DS.Combat.applyPoison(victim, 2);
          DS.Combat.logMsg(target.name + ' bursts! ' + victim.name + ' is poisoned!', 'poison-log');
        }
      } else if (target.deathEffect === 'explode_all_5') {
        DS.Combat.logMsg(target.name + ' explodes!', 'damage');
        DS.Combat.aliveHeroes().forEach(function(h) {
          DS.Combat.dealDamage(h, 5);
        });
      }
    }
  },

  checkGameOver: function() {
    var combat = DS.State.combat;
    if (DS.Combat.aliveHeroes().length === 0) {
      combat.gameOver = true;
      DS.Combat.logMsg('DEFEAT. Darkness claims all.', 'defeat');
      setTimeout(function() {
        DS.State.endCombat(false);
        DS.Game.onCombatDefeat();
      }, 800);
    } else if (DS.Combat.aliveEnemies().length === 0) {
      combat.gameOver = true;
      DS.Combat.logMsg('VICTORY! The darkness recedes.', 'victory');
      DS.Combat.fireRelicHook('onCombatEnd');
      setTimeout(function() {
        DS.State.endCombat(true);
        DS.Game.onCombatVictory();
      }, 800);
    }
  },

  // ===== FLOATING TEXT =====
  floatText: function(entity, text, type) {
    var el = document.getElementById(entity.id);
    if (!el) return;
    var float = document.createElement('div');
    float.className = 'floating-number ' + type;
    float.textContent = text;
    float.style.left = entity.isHero ? '60%' : '40%';
    float.style.top = '10px';
    el.appendChild(float);
    setTimeout(function() { float.remove(); }, 1000);
  },

  // ===== LOGGING =====
  logMsg: function(text, cls) {
    var container = document.getElementById('log-entries');
    if (!container) return;
    var entry = document.createElement('div');
    entry.className = 'log-entry ' + (cls || '');
    entry.textContent = '> ' + text;
    container.prepend(entry);
    while (container.children.length > 60) container.lastChild.remove();
  }
};
