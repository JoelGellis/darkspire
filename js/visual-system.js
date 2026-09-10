// Shared presentation adapters. Gameplay, saves and economy remain in their modules.
(function () {
  'use strict';
  var UI = DS.UI;
  var classes = ['fighter', 'cleric', 'rogue', 'wizard', 'barbarian', 'ranger', 'necromancer', 'paladin'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function heroAsset(cls) { return 'assets/exported/sprites/campfire-' + (classes.indexOf(cls) < 0 ? 'fighter' : cls) + '.png'; }
  function portrait(cls) { return '<span class="ds-portrait"><img src="' + heroAsset(cls) + '" alt="" draggable="false"></span>'; }
  function wrap(name, after) {
    var original = UI[name];
    if (!original) return;
    UI[name] = function () { var result = original.apply(this, arguments); after.apply(this, arguments); return result; };
  }
  function keyboardClick(el, label) {
    el.tabIndex = 0; el.setAttribute('role', 'button');
    if (label) el.setAttribute('aria-label', label);
    el.onkeydown = function(e) { if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); el.click(); } };
  }
  function modal(title, body, action, onAccept) {
    var oldFocus = document.activeElement;
    var dialog = document.createElement('dialog');
    dialog.className = 'ds-dialog';
    dialog.setAttribute('aria-labelledby', 'ds-dialog-title');
    dialog.innerHTML = '<h2 id="ds-dialog-title">' + esc(title) + '</h2><div class="ds-dialog-copy">' + body + '</div><div class="ds-dialog-actions"><button class="btn ds-cancel">Back</button>' + (action ? '<button class="btn ds-accept">' + esc(action) + '</button>' : '') + '</div>';
    document.body.appendChild(dialog);
    dialog.querySelector('.ds-cancel').onclick = function() { dialog.close(); };
    if (action) dialog.querySelector('.ds-accept').onclick = function() { dialog.close(); onAccept(); };
    dialog.onclose = function() { dialog.remove(); if (oldFocus && oldFocus.isConnected) oldFocus.focus(); };
    dialog.showModal();
    dialog.querySelector('.ds-cancel').focus();
  }
  function help() {
    modal('Welcome to Darkspire', '<p>' + (DS.Lore ? DS.Lore.premise : 'Four heroes. One shared deck. A road that may not bring everyone home.') + '</p><ol><li><b>Gather your company.</b> Choose four heroes at the fire. Your first choice takes rank I, at the front. The home roster can grow after your first expedition.</li><li><b>Prepare in town.</b> Your first Blacksmith upgrade is free, and your first Merchant item is discounted.</li><li><b>Choose a path.</b> Follow the marked routes through battles, merchants, mysteries and rest sites.</li><li><b>Fight with cards.</b> Spend energy, choose a valid target, then end your turn. Enemy symbols show their next action. Rank badges tell you where a card can be used.</li><li><b>Find the necklace.</b> Reach the top of the Dark Spire and take back what Tyrhung stole.</li></ol>', null);
  }
  // Intercept only the existing synchronous retreat confirmation, retaining its
  // actual text and all original effects. Never replace window.confirm globally.
  var originalRetreat = DS.Game.retreat;
  DS.Game.retreat = function() {
    var nativeConfirm = window.confirm, message;
    try { window.confirm = function(text) { message = text; return false; }; originalRetreat(); }
    finally { window.confirm = nativeConfirm; }
    if (!message) return;
    modal('Return to the hamlet?', '<p>' + esc(message).replace(/\n/g, '<br>') + '</p>', 'Retreat & bank gold', function() {
      try { window.confirm = function() { return true; }; originalRetreat(); }
      finally { window.confirm = nativeConfirm; }
    });
  };

  wrap('renderCampfire', function(root) {
    var scene = root.querySelector('.cf-scene');
    if (!scene) return;
    root.querySelector('.cf-screen').classList.add('ds-camp');
    var gathering = root.querySelector('.cf-gathering');
    var fire = gathering.querySelector('.cf-fire');
    if (fire) scene.appendChild(fire);
    gathering.remove();
    scene.appendChild(root.querySelector('.cf-rosters'));
    root.querySelector('#cf-scene-title').textContent = 'Choose your company';
    root.querySelector('.cf-scene-copy > p:last-child').textContent = 'Choose four heroes in marching order. The first stands at the front.';
    root.querySelector('.cf-scene-caption').remove();
    var helpButton = document.createElement('button');
    helpButton.className = 'cf-text-button ds-help'; helpButton.textContent = 'How to play'; helpButton.onclick = help;
    root.querySelector('.cf-actions').appendChild(helpButton);
    var recruits=root.querySelector('.cf-roster-recruit');
    if(recruits){
      var coach=document.createElement('button');coach.className='ds-world-coach';coach.type='button';coach.innerHTML='<img src="assets/exported/ui/stagecoach.svg" alt=""><span>Stagecoach</span><small>'+recruits.querySelectorAll('.cf-hero').length+' waiting</small>';scene.appendChild(coach);
      var coachDialog=document.createElement('dialog');coachDialog.className='ds-dialog ds-coach-dialog';coachDialog.setAttribute('aria-label','The stagecoach');
      var coachTitle=document.createElement('div');coachTitle.className='ds-coach-header';coachTitle.innerHTML='<div><h2>Stagecoach</h2><p>Click a hero card to choose them for the fire. They join your permanent roster when you begin the descent. Equipment is optional and can be handled separately.</p></div>';coachDialog.appendChild(coachTitle);
      var back=document.createElement('button');back.textContent='Return to the fire';back.className='btn';back.onclick=function(){coachDialog.close();};coachDialog.appendChild(back);coachDialog.appendChild(recruits);root.appendChild(coachDialog);coach.onclick=function(){coachDialog.showModal();};
    }
    var memorial = root.querySelector('.cf-memorial');
    var details = document.createElement('details'); details.className = 'ds-memorial';
    var summary = document.createElement('summary'); summary.textContent = 'Graveyard · ' + (DS.Meta.graveyard || []).length + ' remembered';
    details.appendChild(summary); memorial.replaceWith(details); details.appendChild(memorial);
    root.querySelectorAll('.cf-hero').forEach(function(button) {
      var entry = DS.Campfire._offer[Number(button.dataset.offer)];
      button.title = entry.name + ' · ' + entry.heroClass + '\n' + button.querySelector('.cf-stats').textContent + '\n' + button.querySelector('.cf-trait').textContent;
    });
  });

  function townSkin(root) {
    var screen = root.querySelector('.screen-town');
    if (!screen) return;
    screen.classList.add('ds-town');
    screen.querySelectorAll('.town-gear-card,.town-pick-hero,.town-card-available').forEach(function(el) {
      if (el.onclick) keyboardClick(el, el.textContent.trim().replace(/\s+/g,' '));
    });
    screen.querySelectorAll('.town-pick-hero').forEach(function(el) {
      var h = DS.Meta.heroRoster[Number(el.dataset.rosterIdx)]; if (h) el.insertAdjacentHTML('afterbegin', portrait(h.heroClass));
    });
    var buildings = screen.querySelector('.town-buildings');
    if (!buildings) return;
    screen.classList.add('ds-town-main');
    screen.querySelector('.game-title').textContent = 'THE ASHEN HAMLET';
    var title = document.createElement('p'); title.className = 'ds-town-caption';
    title.textContent = 'A little shelter. A little hope. Prepare for the road ahead.';
    buildings.prepend(title);
    var roster = DS.Meta.heroRoster.filter(function(h) { return h.alive; });
    screen.querySelectorAll('.town-hero-card').forEach(function(card, i) {
      var h = roster[i]; if (!h) return;
      card.insertAdjacentHTML('afterbegin', portrait(h.heroClass));
      var name = card.querySelector('.town-hero-name'); name.textContent = h.name || name.textContent;
      var stars = card.querySelector('.town-hero-stars'); if (stars) stars.textContent = 'Veteran · ' + h.runsSurvived + ' returns';
      if (h.injury) { card.classList.add('is-injured'); card.insertAdjacentHTML('beforeend', '<small class="ds-wound">' + esc(typeof h.injury === 'string' ? h.injury : h.injury.name) + '</small>'); }
    });
    screen.querySelectorAll('.town-building').forEach(function(building) {
      var originalAction = building.onclick;
      var name = building.querySelector('.town-building-name').textContent;
      keyboardClick(building, 'Visit ' + name);
      // Labels open a building panel; estate upgrades are explicit purchases,
      // never accidental spends from simply exploring the painted town.
      if (['town-building-chapel','town-building-tavern','town-building-graveyard'].indexOf(building.id) !== -1) {
        building.onclick = function() {
          var content = Array.from(building.children).filter(function(e) { return !e.classList.contains('town-building-icon'); }).map(function(e) { return '<p>' + esc(e.textContent) + '</p>'; }).join('');
          var key = building.id.replace('town-building-', '');
          var level = DS.Meta.buildings[key] ? DS.Meta.buildings[key].level : 0;
          var cost = DS.Buildings[key].getUpgradeCost(level);
          var canBuy = cost !== null && DS.Meta.gold >= cost;
          modal(name, content + (!canBuy && cost !== null ? '<p class="ds-wound">Not enough banked gold.</p>' : ''), canBuy ? 'Upgrade · ' + cost + ' gold' : null, function() { originalAction.call(building); });
        };
      }
    });
    var unlocks = screen.querySelector('.town-unlocks');
    if (unlocks) {
      var d = document.createElement('details'); d.className = 'ds-unlocks';
      d.innerHTML = '<summary>Class unlocks</summary>'; unlocks.replaceWith(d); d.appendChild(unlocks);
      screen.querySelector('.town-roster').appendChild(d);
    }
    screen.querySelector('#btn-enter-spire').textContent = 'Assemble party';
    var coach=document.createElement('button');coach.type='button';coach.className='ds-world-coach ds-town-coach';coach.innerHTML='<img src="assets/exported/ui/stagecoach.svg" alt=""><span>Stagecoach</span><small>Gather the company</small>';coach.onclick=function(){DS.Campfire.enter();};buildings.appendChild(coach);
    var newGame = screen.querySelector('#btn-new-game'); if (newGame) newGame.textContent = 'Reset campaign';
  }
  ['renderTown','_townShowBlacksmithHeroPicker','_townShowBlacksmithCards','_townShowBlacksmithConfirm','_townShowMerchant'].forEach(function(name) { wrap(name, townSkin); });

  UI.buildPartyBar = function() {
    var run = DS.State.run; if (!run) return '';
    return '<div class="party-bar ds-party-bar">' + run.heroes.slice().sort(function(a,b) { return a.pos - b.pos; }).map(function(h) {
      return '<div class="party-hero' + (h.hp <= 0 ? ' ds-dead' : '') + '">' + portrait(h.cls) + '<span class="ds-party-rank">' + h.pos + '</span><div class="party-hero-name">' + esc(h.name) + '</div><div class="party-hero-hp">' + (h.hp <= 0 ? 'Fallen' : h.hp + ' / ' + h.maxHp) + '</div><div class="hp-bar-outer"><div class="hp-bar-inner hero-hp" style="width:' + Math.max(0,h.hp/h.maxHp*100) + '%"></div></div></div>';
    }).join('') + '</div>';
  };
  var icons = {
    start: '<path d="M8 27h24M12 27V15l8-10 8 10v12M17 27v-9h6v9"/>',
    combat: '<path d="M7 5l20 20M5 5l3 8 18 18 5-5L13 8ZM9 26l5 5m-8 3 5-5M30 5 20 15m13-10-3 8-6 6M26 26l5 5m3 3-5-5"/>',
    elite: '<path d="M6 14 9 6l7 5 4-8 4 8 7-5 3 8-4 16H10ZM14 20l3 2m9-2-3 2M16 29l4-5 4 5"/>',
    rest: '<path d="M20 3c7 11-3 10 5 15l3-7c12 16 3 23-8 23S3 26 11 15l2 8c5-4 0-10 7-20ZM7 35l26-4M7 31l26 4"/>',
    event: '<path d="M12 12c0-12 20-12 20 0 0 8-12 6-12 14M20 32v2"/>',
    shop: '<path d="M7 15h26l-3 19H10ZM15 15V9a5 5 0 0 1 10 0v6M17 23h6m-6 5h6"/>',
    boss: '<path d="m7 11 4-7 7 9 4-9 7 9 4-9 2 18-5 12H10L5 22ZM13 22l5 3m9-3-5 3M17 33l3-5 3 5"/>'
  };
  function icon(type) { return '<svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' + (icons[type] || icons.event) + '</svg>'; }
  var labels = {start:'Entrance',combat:'Battle',elite:'Elite',rest:'Rest',event:'Unknown',shop:'Merchant',boss:'Boss'};
  UI.renderMap = function(root) {
    var run = DS.State.run; if (!run || !run.map) return;
    var available = DS.Map.getAvailableNodes(run.map, run.currentNode);
    var all = [].concat.apply([], run.map.floors), byId = {};
    all.forEach(function(n) { byId[n.id] = n; });
    function x(n) { return 8 + n.x * 84; } function y(n) { return 90 - n.floor * 13; }
    var paths = run.map.connections.map(function(c) {
      var a = byId[c.from], b = byId[c.to];
      return '<path class="' + (a.completed && b.visited ? 'ds-travelled' : '') + '" d="M' + x(a) + ' ' + y(a) + ' C' + x(a) + ' ' + (y(a)-6) + ' ' + x(b) + ' ' + (y(b)+6) + ' ' + x(b) + ' ' + y(b) + '"/>';
    }).join('');
    var nodes = all.map(function(n) {
      var canGo = available.some(function(a) { return (typeof a === 'string' ? a : a.id) === n.id; });
      return '<button class="ds-map-node ds-node-' + n.type + (canGo ? ' is-available' : '') + (n.id === run.currentNode ? ' is-current' : '') + (n.completed ? ' is-complete' : '') + '" style="left:' + x(n) + '%;top:' + y(n) + '%" data-node="' + n.id + '" aria-label="' + labels[n.type] + ', floor ' + n.floor + (canGo ? ', travel here' : n.completed ? ', completed' : ', unavailable') + '"' + (canGo ? '' : ' disabled') + '>' + icon(n.type) + '<span>' + labels[n.type] + '</span></button>';
    }).join('');
    root.innerHTML = '<main class="screen ds-map"><header class="ds-run-hud"><b>DARKSPIRE</b><span>Floor ' + run.floor + ' / 6</span><span class="ds-gold">◇ ' + run.gold + ' gold</span>' + UI.buildRelicIcons(run.relics) + UI.buildArtifactIcons(run.artifacts) + '<button class="btn" id="btn-map-deck">Deck · ' + run.deck.length + '</button><button class="btn" id="btn-map-retreat">Retreat</button></header><div class="ds-map-layout"><aside class="ds-map-party"><h2>The company</h2>' + UI.buildPartyBar() + '<p>Rank I holds the front.<br>Only the living return.</p></aside><section class="ds-chart" aria-label="Dungeon route"><h1>The Hollow Ascent</h1><p class="ds-chart-sub">' + (DS.Lore ? DS.Lore.map(run) : 'Choose a marked path. Reach the guardian.') + '</p><div class="ds-route"><svg class="ds-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + paths + '</svg>' + nodes + '</div></section><aside class="ds-map-key"><h2>Map legend</h2>' + ['combat','elite','rest','event','shop','boss'].map(function(t) { return '<div>' + icon(t) + '<span>' + labels[t] + '</span></div>'; }).join('') + '<p>Gold spent on upgrades lasts beyond this run.</p></aside></div></main>';
    root.querySelectorAll('[data-node]:not(:disabled)').forEach(function(button) { button.onclick = function() { DS.Game.selectNode(button.dataset.node); }; });
    root.querySelector('#btn-map-deck').onclick = function() { UI.showDeckViewer(); };
    var artifactButton = root.querySelector('#btn-artifacts');
    if (artifactButton) artifactButton.onclick = UI.showArtifactViewer;
    root.querySelector('#btn-map-retreat').onclick = function() { DS.Game.retreat(); };
  };

  var enemyRules = [
    [/spider/i,'spider'], [/wolf|alpha|rat|bat/i,'beast'], [/slime|slimeling/i,'slime'],
    [/fung|spore|mushroom/i,'fungus'], [/goblin/i,'goblin'], [/wraith|shade|phantom/i,'wraith'],
    [/mage|lich|cult|priest|caster|vampire|bearer/i,'occultist'], [/./,'sentinel']
  ];
  UI.buildSprite = function(entity, facing) {
    var sprite = document.createElement('div'); sprite.className = 'sprite ds-painted-sprite';
    var cls = entity.cls;
    var path = classes.indexOf(cls) >= 0 ? heroAsset(cls) : 'assets/exported/sprites/enemy-' + enemyRules.find(function(rule) { return rule[0].test(entity.name); })[1] + '.png';
    sprite.innerHTML = '<img src="' + path + '" alt="" draggable="false">';
    if (facing === 'left') sprite.classList.add('ds-face-left');
    return sprite;
  };
  function addCardArt(scope) {
    scope.querySelectorAll('.card').forEach(function(card) {
      var cls = classes.find(function(c) { return card.classList.contains(c); });
      if (!cls) return;
      // URL-valued custom properties resolve where CSS consumes them, so use
      // the document base explicitly (also works when opened through file://).
      card.style.setProperty('--ds-card-art', 'url("' + new URL(heroAsset(cls), document.baseURI).href + '")');
      var art = card.querySelector('.card-art');
      if (!art) { art = document.createElement('div'); art.className = 'card-art'; card.prepend(art); }
      var name = card.querySelector('.card-name'), cost = card.querySelector('.card-cost'), effect = card.querySelector('.card-effect');
      var description = name && cost && effect ? name.textContent + ', ' + cost.textContent + ' energy. ' + effect.textContent : card.textContent.trim().replace(/\s+/g, ' ');
      card.title = description;
      if (card.onclick) keyboardClick(card, description);
    });
  }
  wrap('renderHand', function() { var hand = document.getElementById('hand-cards'); if (hand) addCardArt(hand); });
  ['renderHeroes','renderEnemies'].forEach(function(method) {
    wrap(method, function() {
      document.querySelectorAll('.stage-entity.targetable').forEach(function(el) { keyboardClick(el, 'Target ' + el.querySelector('.entity-name').textContent); });
    });
  });
  wrap('renderCombat', function(root) {
    root.querySelector('.screen-combat').classList.add('ds-combat');
    var bar = root.querySelector('.top-bar-left');
    if (!bar.querySelector('.ds-battle-brand')) bar.insertAdjacentHTML('afterbegin','<b class="ds-battle-brand">DARKSPIRE</b>');
    ['btn-draw-pile','btn-discard-pile'].forEach(function(id) { var el = document.getElementById(id); keyboardClick(el, id === 'btn-draw-pile' ? 'View draw pile' : 'View discard pile'); });
  });
  ['renderReward','renderRest','renderTrainScreen','renderPurgeScreen','renderEvent','renderShop','renderSummary','renderGameOver','renderBossIntro'].forEach(function(method) {
    wrap(method, function(root) { if (root && root.querySelector) { var screen = root.querySelector('.screen'); if (screen) screen.classList.add('ds-interlude'); addCardArt(root); } });
  });
  wrap('renderRest', function(root) {
    var heroes = DS.State.run.heroes;
    root.querySelectorAll('.rest-hero').forEach(function(el, i) { el.insertAdjacentHTML('afterbegin', portrait(heroes[i].cls)); });
    var fire = root.querySelector('.rest-fire');
    if (fire) fire.innerHTML = '<div class="cf-fire"><i></i><i></i><i></i><b></b><b></b><span class="cf-embers"></span></div>';
    root.querySelectorAll('.rest-choice-icon').forEach(function(el, i) { el.innerHTML = icon(['rest','combat','event'][i]); });
  });
  wrap('showBossIntro', function(boss) {
    var root = document.getElementById('game-root');
    root.querySelector('.screen').classList.add('ds-interlude');
    var art = root.querySelector('.boss-intro-icon'); art.textContent = ''; art.appendChild(UI.buildSprite(boss, 'left'));
  });
  wrap('renderSummary', function(root) {
    if (!DS.State.run) return;
    root.querySelectorAll('.summary-hero-card').forEach(function(el, i) {
      var h = DS.State.run.heroes[i]; if (h) el.insertAdjacentHTML('afterbegin', portrait(h.cls));
    });
  });
  wrap('renderShop', function(root) {
    root.querySelectorAll('.shop-card-wrap,.shop-relic-wrap,.shop-remove,.shop-remove-card').forEach(function(el) {
      if (el.onclick && !el.classList.contains('shop-unaffordable') && !el.classList.contains('shop-sold')) keyboardClick(el, el.textContent.trim().replace(/\s+/g,' '));
    });
  });
  ['showDeckViewer','showPileViewer'].forEach(function(method) { wrap(method, function() { addCardArt(document); }); });
  // Page long inventories inside the game stage; every item stays reachable.
  function pages(container, selector, size) {
    if(!container || container.querySelector(':scope > .ds-pages'))return;
    var items=Array.from(container.querySelectorAll(selector));if(items.length<=size)return;
    var page=0,nav=document.createElement('nav');nav.className='ds-pages';nav.setAttribute('aria-label','Inventory pages');
    var previous=document.createElement('button'),label=document.createElement('span'),next=document.createElement('button');
    previous.textContent='Previous';next.textContent='Next';previous.className=next.className='btn';
    nav.append(previous,label,next);container.prepend(nav);
    function show(){items.forEach(function(item,i){item.hidden=i<page*size||i>=(page+1)*size;item.style.display=item.hidden?'none':'';});label.textContent=' '+(page+1)+' / '+Math.ceil(items.length/size)+' ';previous.disabled=page===0;next.disabled=(page+1)*size>=items.length;}
    previous.onclick=function(){page--;show();};next.onclick=function(){page++;show();};show();
  }
  wrap('renderTown',function(root){var roster=root.querySelector('.town-roster-list');pages(roster,'.town-hero-card',4);});
  wrap('_townShowMerchant',function(root){pages(root.querySelector('.town-subview'),'.town-gear-card',4);});
  wrap('_townShowBlacksmithCards',function(root){pages(root.querySelector('.town-subview'),'.town-card-available',6);});
  wrap('renderShop',function(root){
    var panel=root.querySelector('.shop-panel');if(!panel)return;
    var sections=Array.from(panel.querySelectorAll(':scope > .shop-section'));if(sections.length<2)return;
    var nav=document.createElement('nav');nav.className='ds-pages';panel.prepend(nav);
    sections.forEach(function(section,i){var b=document.createElement('button'),title=section.querySelector('h3');b.className='btn';b.textContent=title?title.textContent:'Services';b.onclick=function(){sections.forEach(function(s){s.style.display=s===section?'':'none';});};nav.appendChild(b);section.style.display=i===0?'':'none';});
  });
  ['showDeckViewer','showPileViewer'].forEach(function(method){wrap(method,function(){var root=document.querySelector('.deck-viewer-cards')||document.querySelector('.deck-viewer');if(root)pages(root,'.card',8);});});

})();
