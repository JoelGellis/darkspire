window.DS = window.DS || {};

DS.Events = [

  // ============================================================
  // 1. MYSTERIOUS SHRINE
  // ============================================================
  {
    id: 'mysterious_shrine',
    name: 'Mysterious Shrine',
    text: 'A dark shrine pulses with forbidden energy. Ancient runes crawl across its surface like living things. The air tastes of iron and regret.',
    choices: [
      {
        label: 'Pray at the shrine',
        desc: 'Lose 10 HP on a random hero. Gain a random relic.',
        effect: function(state) {
          if (!state || !state.run || !state.run.heroes) return 'Nothing happens.';
          var alive = state.run.heroes.filter(function(h) { return h && h.hp > 0; });
          if (alive.length === 0) return 'No one is left to pray.';
          var victim = alive[Math.floor(Math.random() * alive.length)];
          victim.hp = Math.max(0, victim.hp - 10);
          // Grant a relic
          state.run.relics = state.run.relics || [];
          var ownedIds = state.run.relics.map(function(r) { return r.id; });
          var relic = (DS.Relics && DS.Relics.pickRandom) ? DS.Relics.pickRandom(ownedIds) : null;
          if (relic) {
            state.run.relics.push(relic);
            return victim.name + ' collapses before the shrine, blood dripping from their nose. The darkness yields a gift: ' + relic.name + '.';
          }
          // Fallback if no relics available
          state.run.gold = (state.run.gold || 0) + 40;
          return victim.name + ' suffers for nothing. The shrine is empty. You find 40 gold in the rubble.';
        }
      },
      {
        label: 'Smash the shrine',
        desc: 'Gain 30 gold.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          state.run.gold = (state.run.gold || 0) + 30;
          return 'Stone shatters. Gold coins spill from the wreckage, warm to the touch.';
        }
      },
      {
        label: 'Walk away',
        desc: 'Nothing happens.',
        effect: function(state) {
          return 'You leave the shrine to its silence. Some doors are better left closed.';
        }
      }
    ]
  },

  // ============================================================
  // 2. WANDERING MERCHANT
  // ============================================================
  {
    id: 'wandering_merchant',
    name: 'Wandering Merchant',
    text: 'A hunched figure sits beside a cart draped in moth-eaten velvet. His eyes gleam with too much knowledge. "Everything has a price," he rasps.',
    choices: [
      {
        label: 'Buy a card (50 gold)',
        desc: 'Add a random card to your deck.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          if ((state.run.gold || 0) < 50) return '"Come back when you can afford my wares." He waves you off.';
          state.run.gold -= 50;
          var card = (DS.Cards && DS.Cards.getRewardPool) ? DS.Cards.getRewardPool(1)[0] : null;
          if (card) {
            state.run.deck = state.run.deck || [];
            card.id = card.baseId + '_merchant_' + Math.floor(Math.random() * 10000);
            state.run.deck.push(card);
            return 'Gold changes hands. He produces ' + card.name + ' from beneath his cloak. "Use it well."';
          }
          state.run.gold += 50;
          return '"I seem to have misplaced my inventory." He shrugs.';
        }
      },
      {
        label: 'Buy a healing potion (30 gold)',
        desc: 'Heal all heroes 15 HP.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          if ((state.run.gold || 0) < 30) return '"No coin, no cure." He turns away.';
          state.run.gold -= 30;
          if (state.run.heroes) {
            state.run.heroes.forEach(function(h) {
              if (h && h.hp > 0 && h.maxHp) {
                h.hp = Math.min(h.hp + 15, h.maxHp);
              }
            });
          }
          return 'The potion tastes like tar and wildflowers. Warmth floods through the party.';
        }
      },
      {
        label: 'Walk away',
        desc: 'Nothing happens.',
        effect: function(state) {
          return '"Your loss," he mutters, already packing his cart.';
        }
      }
    ]
  },

  // ============================================================
  // 3. TRAINING GROUNDS
  // ============================================================
  {
    id: 'training_grounds',
    name: 'Training Grounds',
    text: 'An abandoned barracks. Practice dummies line the walls, scarred by a thousand blows. The sand in the sparring pit is dark with old sweat.',
    choices: [
      {
        label: 'Train',
        desc: 'A random hero gains +3 max HP.',
        effect: function(state) {
          if (!state || !state.run || !state.run.heroes) return 'Nothing happens.';
          var alive = state.run.heroes.filter(function(h) { return h && h.hp > 0; });
          if (alive.length === 0) return 'No one is left to train.';
          var hero = alive[Math.floor(Math.random() * alive.length)];
          hero.maxHp = (hero.maxHp || 0) + 3;
          hero.hp = (hero.hp || 0) + 3;
          return hero.name + ' pushes through exhaustion. Body hardened, resolve sharpened. (+3 max HP)';
        }
      },
      {
        label: 'Spar',
        desc: 'Upgrade a random card (+3 to its value).',
        effect: function(state) {
          if (!state || !state.run || !state.run.deck) return 'Nothing happens.';
          var upgradeable = state.run.deck.filter(function(c) { return c && !c.upgraded && c.value; });
          if (upgradeable.length === 0) return 'No cards to improve. The practice is wasted.';
          var card = upgradeable[Math.floor(Math.random() * upgradeable.length)];
          card.value += 3;
          card.upgraded = true;
          card.name = card.name + '+';
          card.desc = card.desc.replace(/\d+/, String(card.value));
          return 'Rigorous drilling refines technique. ' + card.name + ' has been upgraded.';
        }
      },
      {
        label: 'Walk away',
        desc: 'Nothing happens.',
        effect: function(state) {
          return 'You pass through without stopping. There will be time to train later. Maybe.';
        }
      }
    ]
  },

  // ============================================================
  // 4. TRAPPED CHEST
  // ============================================================
  {
    id: 'trapped_chest',
    name: 'Trapped Chest',
    text: 'A heavy iron chest sits in the center of the room. Scratch marks surround it. Someone tried to open it before. The scratches end abruptly.',
    choices: [
      {
        label: 'Open the chest',
        desc: '50% chance: gain a relic. 50% chance: 15 damage to all heroes.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          if (Math.random() < 0.5) {
            // Good outcome: relic
            state.run.relics = state.run.relics || [];
            var ownedIds = state.run.relics.map(function(r) { return r.id; });
            var relic = (DS.Relics && DS.Relics.pickRandom) ? DS.Relics.pickRandom(ownedIds) : null;
            if (relic) {
              state.run.relics.push(relic);
              return 'The lid creaks open. Inside: ' + relic.name + '. Fortune favors the bold.';
            }
            state.run.gold = (state.run.gold || 0) + 50;
            return 'The chest opens to reveal 50 gold. Not bad.';
          } else {
            // Bad outcome: damage
            if (state.run.heroes) {
              state.run.heroes.forEach(function(h) {
                if (h && h.hp > 0) {
                  h.hp = Math.max(0, h.hp - 15);
                }
              });
            }
            return 'A blast of necrotic energy erupts from the chest. The party staggers. (-15 HP to all)';
          }
        }
      },
      {
        label: 'Walk away',
        desc: 'Nothing happens.',
        effect: function(state) {
          return 'You leave the chest. Curiosity is a luxury the dead can\'t afford.';
        }
      }
    ]
  },

  // ============================================================
  // 5. THE BEGGAR
  // ============================================================
  {
    id: 'the_beggar',
    name: 'The Beggar',
    text: 'A wretched figure huddles against the wall, wrapped in rags that might once have been fine cloth. His eyes track you with unnerving precision.',
    choices: [
      {
        label: 'Give 25 gold',
        desc: 'He might remember your kindness.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          if ((state.run.gold || 0) < 25) return 'You reach for your purse, but it\'s too light. He nods knowingly.';
          state.run.gold -= 25;
          // Set flag: next event room or next combat end grants a relic
          state.run._beggarDebt = true;
          return '"Generous," he whispers. His eyes flash gold for an instant. "I will not forget." He vanishes into shadow.';
        }
      },
      {
        label: 'Ignore him',
        desc: 'Nothing happens.',
        effect: function(state) {
          return 'You walk past. He says nothing. But you feel his gaze on your back for a long, long time.';
        }
      },
      {
        label: 'Rob him',
        desc: 'Gain 25 gold. A random hero loses 5 max HP.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          state.run.gold = (state.run.gold || 0) + 25;
          if (state.run.heroes) {
            var alive = state.run.heroes.filter(function(h) { return h && h.hp > 0; });
            if (alive.length > 0) {
              var victim = alive[Math.floor(Math.random() * alive.length)];
              victim.maxHp = Math.max(1, (victim.maxHp || 1) - 5);
              victim.hp = Math.min(victim.hp, victim.maxHp);
              return 'You take his coins. Easy. But ' + victim.name + ' feels something hollow open inside. (-5 max HP). The beggar\'s laughter follows you down the corridor.';
            }
          }
          return 'You take his coins. The darkness feels heavier now.';
        }
      }
    ]
  },

  // ============================================================
  // 6. ANCIENT LIBRARY
  // ============================================================
  {
    id: 'ancient_library',
    name: 'Ancient Library',
    text: 'Shelves of crumbling books stretch into darkness. The pages whisper in languages that died before your grandparents were born. Knowledge and madness share a shelf here.',
    choices: [
      {
        label: 'Study the tomes',
        desc: 'Gain a Wizard card.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          state.run.deck = state.run.deck || [];
          // Try to find Arcane Intellect first, then any wizard card
          var card = null;
          if (DS.Cards && DS.Cards.wizard) {
            var pool = DS.Cards.wizard.slice();
            // Prefer Arcane Intellect
            var ai = pool.filter(function(c) { return c.id === 'wizard_arcane_intellect'; })[0];
            card = ai || pool[Math.floor(Math.random() * pool.length)];
            if (card) {
              var deckCard = {
                id: card.id + '_library_' + Math.floor(Math.random() * 10000),
                baseId: card.id,
                name: card.name,
                cost: card.cost,
                type: card.type,
                target: card.target,
                prefPos: card.prefPos.slice(),
                desc: card.desc,
                value: card.value,
                effect: card.effect,
                heroIdx: 3,
                heroCls: 'wizard',
                heroName: 'Wizard',
                upgraded: false
              };
              state.run.deck.push(deckCard);
              return 'Hours dissolve into study. The arcane patterns burn themselves into memory. Gained: ' + card.name + '.';
            }
          }
          return 'The text is indecipherable. Wasted effort.';
        }
      },
      {
        label: 'Burn the library',
        desc: 'Gain 20 gold.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          state.run.gold = (state.run.gold || 0) + 20;
          return 'Parchment catches fast. Gold leaf peels from burning spines and pools on the floor. You scrape it up. Knowledge destroyed for coin.';
        }
      },
      {
        label: 'Walk away',
        desc: 'Nothing happens.',
        effect: function(state) {
          return 'You leave the library to its slow decay. Some knowledge sleeps for a reason.';
        }
      }
    ]
  },

  // ============================================================
  // 7. BLOOD ALTAR
  // ============================================================
  {
    id: 'blood_altar',
    name: 'Blood Altar',
    text: 'A stone slab stained black with ancient sacrifice. The grooves are worn smooth by centuries of blood. The air hums with a low, expectant frequency.',
    choices: [
      {
        label: 'Sacrifice',
        desc: 'One random hero loses 15 HP. All OTHER heroes heal to full.',
        effect: function(state) {
          if (!state || !state.run || !state.run.heroes) return 'Nothing happens.';
          var alive = state.run.heroes.filter(function(h) { return h && h.hp > 0; });
          if (alive.length < 2) return 'Not enough blood to satisfy the altar. It demands more.';
          var victim = alive[Math.floor(Math.random() * alive.length)];
          victim.hp = Math.max(0, victim.hp - 15);
          state.run.heroes.forEach(function(h) {
            if (h && h !== victim && h.hp > 0 && h.maxHp) {
              h.hp = h.maxHp;
            }
          });
          return victim.name + ' screams as the altar drinks. The others feel life surge back into their veins. The cost is always someone else\'s.';
        }
      },
      {
        label: 'Pray',
        desc: 'All heroes heal 10 HP.',
        effect: function(state) {
          if (!state || !state.run || !state.run.heroes) return 'Nothing happens.';
          state.run.heroes.forEach(function(h) {
            if (h && h.hp > 0 && h.maxHp) {
              h.hp = Math.min(h.hp + 10, h.maxHp);
            }
          });
          return 'You kneel without offering blood. The altar grants a lesser blessing. Warmth returns to tired limbs.';
        }
      },
      {
        label: 'Walk away',
        desc: 'Nothing happens.',
        effect: function(state) {
          return 'You back away from the altar. Its hum follows you for three corridors.';
        }
      }
    ]
  },

  // ============================================================
  // 8. THE FORGE
  // ============================================================
  {
    id: 'the_forge',
    name: 'The Forge',
    text: 'An anvil sits before a furnace that still glows, though no smith tends it. Tools hang in perfect order on the walls. The heat is almost alive.',
    choices: [
      {
        label: 'Upgrade a card',
        desc: 'A random un-upgraded card gains +3 to its value.',
        effect: function(state) {
          if (!state || !state.run || !state.run.deck) return 'Nothing happens.';
          var upgradeable = state.run.deck.filter(function(c) { return c && !c.upgraded && typeof c.value === 'number'; });
          if (upgradeable.length === 0) return 'All cards are already at their peak. The forge has nothing to improve.';
          var card = upgradeable[Math.floor(Math.random() * upgradeable.length)];
          card.value += 3;
          card.upgraded = true;
          card.name = card.name + '+';
          card.desc = card.desc.replace(/\d+/, String(card.value));
          return 'The forge reshapes ' + card.name + '. The metal sings as it cools. Stronger than before.';
        }
      },
      {
        label: 'Repair armor',
        desc: 'All heroes gain 5 max HP.',
        effect: function(state) {
          if (!state || !state.run || !state.run.heroes) return 'Nothing happens.';
          state.run.heroes.forEach(function(h) {
            if (h && h.hp > 0) {
              h.maxHp += 5;
              h.hp += 5;
            }
          });
          return 'Dents hammered flat. Straps tightened. The party feels hardened by the forge\'s heat. (+5 max HP to all)';
        }
      },
      {
        label: 'Walk away',
        desc: 'Nothing happens.',
        effect: function(state) {
          return 'You leave the forge to its eternal vigil. The heat fades reluctantly from your back.';
        }
      }
    ]
  },

  // ============================================================
  // 9. THE PIT
  // ============================================================
  {
    id: 'the_pit',
    name: 'The Pit',
    text: 'A gaping hole in the stone floor. Warm air rises from below, carrying the smell of old metal and something alive. The edges are smooth — worn by hands, not tools.',
    choices: [
      {
        label: 'Jump in',
        desc: '50% chance: gain a relic. 50% chance: all heroes lose 20 HP.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          if (Math.random() < 0.5) {
            // Good outcome: relic
            state.run.relics = state.run.relics || [];
            var ownedIds = state.run.relics.map(function(r) { return r.id; });
            var relic = (DS.Relics && DS.Relics.pickRandom) ? DS.Relics.pickRandom(ownedIds) : null;
            if (relic) {
              state.run.relics.push(relic);
              return 'You land hard but alive. Something glints in the dark — ' + relic.name + '. Worth the bruises.';
            }
            state.run.gold = (state.run.gold || 0) + 40;
            return 'You land in a pile of old coins. 40 gold, and a long climb back up.';
          } else {
            // Bad outcome: damage
            if (state.run.heroes) {
              state.run.heroes.forEach(function(h) {
                if (h && h.hp > 0) {
                  h.hp = Math.max(0, h.hp - 20);
                }
              });
            }
            return 'The fall is worse than you expected. Bones crack. Darkness swallows the screams. (-20 HP to all)';
          }
        }
      },
      {
        label: 'Throw a torch',
        desc: 'Reveals 30 gold at the bottom.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          state.run.gold = (state.run.gold || 0) + 30;
          return 'The torch tumbles, illuminating a shallow ledge littered with coins. You climb down carefully and collect 30 gold.';
        }
      },
      {
        label: 'Walk away',
        desc: 'Nothing happens.',
        effect: function(state) {
          return 'You step back from the edge. The pit breathes once, then goes still.';
        }
      }
    ]
  },

  // ============================================================
  // 10. WOUNDED SOLDIER
  // ============================================================
  {
    id: 'wounded_soldier',
    name: 'Wounded Soldier',
    text: 'A soldier slumps against the wall, armor cracked, one hand pressed to a wound that has stopped bleeding only because there is so little blood left. His eyes find yours.',
    choices: [
      {
        label: 'Heal him',
        desc: 'He joins temporarily: +3 Block to all heroes in next combat.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          state.run._soldierBuff = true;
          return '"I owe you my life." He rises, steadier than he should be. "I\'ll hold the line with you — one fight." He falls into step behind the party.';
        }
      },
      {
        label: 'Rob him',
        desc: 'Gain 15 gold. A random hero loses 3 max HP.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          state.run.gold = (state.run.gold || 0) + 15;
          if (state.run.heroes) {
            var alive = state.run.heroes.filter(function(h) { return h && h.hp > 0; });
            if (alive.length > 0) {
              var victim = alive[Math.floor(Math.random() * alive.length)];
              victim.maxHp = Math.max(1, (victim.maxHp || 1) - 3);
              victim.hp = Math.min(victim.hp, victim.maxHp);
              return 'You take what he has. He doesn\'t resist. ' + victim.name + ' can\'t meet his eyes. (-3 max HP). The guilt weighs more than the gold.';
            }
          }
          return 'You take his coins. He watches in silence.';
        }
      },
      {
        label: 'Walk away',
        desc: 'Nothing happens.',
        effect: function(state) {
          return 'You leave him to his fate. His breathing follows you down the corridor, then stops.';
        }
      }
    ]
  },

  // ============================================================
  // 11. CURSED MIRROR
  // ============================================================
  {
    id: 'cursed_mirror',
    name: 'Cursed Mirror',
    text: 'A tall mirror stands in an alcove, its frame carved with faces frozen mid-scream. Your reflection moves a half-second too slow. It smiles when you don\'t.',
    choices: [
      {
        label: 'Look into it',
        desc: 'A random hero gains +5 max HP. Another loses 5 max HP.',
        effect: function(state) {
          if (!state || !state.run || !state.run.heroes) return 'Nothing happens.';
          var alive = state.run.heroes.filter(function(h) { return h && h.hp > 0; });
          if (alive.length < 2) return 'The mirror shows only one face. It cracks and goes dark.';
          // Shuffle and pick two
          var shuffled = alive.slice().sort(function() { return Math.random() - 0.5; });
          var winner = shuffled[0];
          var loser = shuffled[1];
          winner.maxHp = (winner.maxHp || 0) + 5;
          winner.hp = (winner.hp || 0) + 5;
          loser.maxHp = Math.max(1, (loser.maxHp || 1) - 5);
          loser.hp = Math.min(loser.hp, loser.maxHp);
          return winner.name + ' sees themselves grown vast and powerful. ' + loser.name + ' sees themselves withered and hollow. The mirror takes what it gives. (' + winner.name + ' +5 max HP, ' + loser.name + ' -5 max HP)';
        }
      },
      {
        label: 'Smash it',
        desc: 'Gain 20 gold.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          state.run.gold = (state.run.gold || 0) + 20;
          return 'Glass explodes. Behind the mirror: a small cache of gold, hidden by whoever hung it. 20 gold and seven years of bad luck.';
        }
      },
      {
        label: 'Walk away',
        desc: 'Nothing happens.',
        effect: function(state) {
          return 'You turn away. In the mirror, your reflection stays a moment longer, watching.';
        }
      }
    ]
  },

  // ============================================================
  // 12. THE GAMBLER
  // ============================================================
  {
    id: 'the_gambler',
    name: 'The Gambler',
    text: 'A figure in a threadbare coat sits at a table that shouldn\'t exist down here. Cards, dice, and a single coin. "Everyone\'s luck runs out," he says. "Question is when."',
    choices: [
      {
        label: 'Bet 30 gold',
        desc: 'Coin flip: win 60 gold or lose your bet.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          if ((state.run.gold || 0) < 30) return '"Can\'t play if you can\'t pay." He spins the coin idly.';
          state.run.gold -= 30;
          if (Math.random() < 0.5) {
            state.run.gold += 60;
            return 'The coin rings against the table. Heads. He slides 60 gold across with a grin. "Lucky. For now."';
          }
          return 'Tails. He pockets your gold without a word. The coin vanishes. "Better luck next life."';
        }
      },
      {
        label: 'Bet 50 gold',
        desc: 'Coin flip: win a relic or lose your bet.',
        effect: function(state) {
          if (!state || !state.run) return 'Nothing happens.';
          if ((state.run.gold || 0) < 50) return '"Big game needs big coin. Come back heavier."';
          state.run.gold -= 50;
          if (Math.random() < 0.5) {
            state.run.relics = state.run.relics || [];
            var ownedIds = state.run.relics.map(function(r) { return r.id; });
            var relic = (DS.Relics && DS.Relics.pickRandom) ? DS.Relics.pickRandom(ownedIds) : null;
            if (relic) {
              state.run.relics.push(relic);
              return 'The coin hangs in the air too long. Heads. He reaches under the table and produces ' + relic.name + '. "Been saving that for a winner."';
            }
            state.run.gold += 80;
            return 'Heads. He has nothing to give but gold — 80 coins pushed across the table with a shrug.';
          }
          return 'Tails. Your gold disappears into his coat. "The house always eats." He shuffles cards that weren\'t there before.';
        }
      },
      {
        label: 'Walk away',
        desc: 'Nothing happens.',
        effect: function(state) {
          return '"Smart," he mutters. "Or cowardly. Hard to tell the difference down here." The table is gone when you look back.';
        }
      }
    ]
  }

];

// Helper: pick a random event
DS.Events.pickRandom = function(visitedIds) {
  visitedIds = visitedIds || [];
  var available = DS.Events.filter(function(e) {
    return typeof e === 'object' && e.id && visitedIds.indexOf(e.id) === -1;
  });
  if (available.length === 0) {
    // All events visited, allow repeats
    available = DS.Events.filter(function(e) { return typeof e === 'object' && e.id; });
  }
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

// Helper: check beggar's debt (call at combat end or event room)
DS.Events.checkBeggarDebt = function(state) {
  if (!state || !state.run || !state.run._beggarDebt) return null;
  state.run._beggarDebt = false;
  state.run.relics = state.run.relics || [];
  var ownedIds = state.run.relics.map(function(r) { return r.id; });
  var relic = (DS.Relics && DS.Relics.pickRandom) ? DS.Relics.pickRandom(ownedIds) : null;
  if (relic) {
    state.run.relics.push(relic);
    return 'The beggar\'s voice echoes from nowhere: "A debt repaid." You find ' + relic.name + ' in your pack.';
  }
  // Fallback: give gold if no relics available
  state.run.gold = (state.run.gold || 0) + 30;
  return 'The beggar\'s voice echoes from nowhere: "A debt repaid." You find 30 gold in your pack.';
};
