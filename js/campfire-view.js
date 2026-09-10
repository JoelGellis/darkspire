// Campfire presentation only. Recruitment, persistence and embark stay in intro.js.
// Kept separate so the uncommitted gameplay wave can be reviewed independently.
(function() {
  'use strict';
  if (!DS.Campfire) return;

  var ranks = ['I', 'II', 'III', 'IV'];
  var positions = ['Front', 'Second', 'Third', 'Rear'];
  var roles = {
    fighter: 'Iron & resolve', cleric: 'Prayer & restoration', rogue: 'Steel & subterfuge',
    wizard: 'Fire & forbidden lore', barbarian: 'Fury & ruin', ranger: 'Arrow & instinct',
    necromancer: 'Ash & old debts', paladin: 'Oath & judgment'
  };
  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(c) {
      return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c];
    });
  }
  function portrait(entry, className) {
    var cls = Object.prototype.hasOwnProperty.call(roles, entry.heroClass) ? entry.heroClass : 'fighter';
    return '<img class="' + className + '" src="assets/exported/sprites/campfire-' + cls + '.png" alt="" draggable="false">';
  }
  function status(entry) {
    if (entry.source === 'recruit') return 'Fresh recruit · Free';
    if (entry.runsSurvived) return 'Veteran · ' + entry.runsSurvived + (entry.runsSurvived === 1 ? ' return' : ' returns');
    return 'Roster · Untested';
  }
  function injuryName(entry) {
    return entry.injury ? (typeof entry.injury === 'string' ? entry.injury : entry.injury.name || 'Wounded') : '';
  }

  DS.UI.renderCampfire = function(root) {
    var camp = DS.Campfire;
    if (!camp._offer) camp._buildOffer();
    var offer = camp._offer;
    var selected = camp._selected;
    var dead = DS.Meta.graveyard || [];
    var canResume = DS.State.hasRunSave && DS.State.hasRunSave();
    var ready = selected.length === 4;
    var active = document.activeElement;
    var focusId = active && root.contains(active) ? active.id : '';
    // Keep a living status region across selection renders, so screen readers
    // receive the new rank count instead of losing their live-region node.
    var announcement = root.querySelector('#cf-announcement');
    if (announcement) announcement.remove();

    var html = '<main class="cf-screen">' +
      '<header class="cf-header"><div class="cf-brand">DARKSPIRE<span>A light before the dark</span></div>' +
      '<div class="cf-chapter">THE STAGECOACH <span> / </span> EXPEDITION ' + (DS.Meta.runCount + 1) + '</div>' +
      '<div class="cf-bank"><span aria-hidden="true">◇</span> ' + DS.Meta.gold + '<small>Banked gold</small></div></header>' +
      '<section class="cf-scene" aria-labelledby="cf-scene-title">' +
      '<div class="cf-scene-copy"><p class="cf-eyebrow">AT THE FOOT OF THE SPIRE</p><h1 id="cf-scene-title">The last light.</h1>' +
      '<p>The road ends here.<br>Gather those who will face the dark.</p></div>' +
      '<div class="cf-fog" aria-hidden="true"></div><div class="cf-firelight" aria-hidden="true"></div>' +
      '<div class="cf-gathering" aria-hidden="true">';

    // Veterans gather at the fire before selection. Once mustering starts,
    // the four figures mirror the ordered party; unfilled ranks stay empty.
    var waiting = offer.map(function(e, i) { return e.source === 'roster' ? i : -1; }).filter(function(i) { return i >= 0; }).slice(0, 4);
    var sceneParty = selected.length ? selected : waiting;
    for (var i = 0; i < 4; i++) {
      var entry = offer[sceneParty[i]];
      if (i === 2) html += '<div class="cf-fire"><i></i><i></i><i></i><b></b><b></b><span class="cf-embers"></span></div>';
      html += '<div class="cf-figure cf-figure-' + i + (entry ? '' : ' cf-figure-empty') + '">' +
        (entry ? portrait(entry, 'cf-scene-portrait') + '<span>' + escape(entry.name) + '</span>' : '') + '</div>';
    }
    html += '</div><div class="cf-scene-caption">' + (selected.length ? 'The company gathers.' : 'The living gather at the edge of the light.') + '</div></section>' +
      '<div class="cf-content"><div class="cf-rosters' + (offer.some(function(e) { return e.source === 'recruit'; }) ? '' : ' cf-no-recruits') + '">';

    ['roster', 'recruit'].forEach(function(source) {
      var entries = offer.filter(function(e) { return e.source === source; });
      html += '<section class="cf-roster cf-roster-' + source + '" aria-labelledby="cf-heading-' + source + '">' +
        '<div class="cf-section-heading"><h2 id="cf-heading-' + source + '">' + (source === 'roster' ? 'By the fire' : 'From the stagecoach') +
        '</h2><span>' + entries.length + (source === 'roster' ? ' living' : ' available') + '</span></div><div class="cf-hero-grid">';
      if (!entries.length) html += '<p class="cf-empty">' + (source === 'roster' ? 'No one returned. New blood waits at the coach.' : 'No new arrivals. Your living roster is gathered.') + '</p>';
      offer.forEach(function(entry, index) {
        if (entry.source !== source) return;
        var rank = selected.indexOf(index);
        var wound = injuryName(entry);
        var name = entry.name || entry.heroDef.name;
        html += '<button type="button" id="cf-hero-' + index + '" class="cf-hero' +
          (rank !== -1 ? ' is-selected' : '') + (wound ? ' is-injured' : '') +
          (entry.runsSurvived ? ' is-veteran' : '') + '" data-offer="' + index + '" aria-pressed="' + (rank !== -1) +
          '" aria-label="' + escape(name + ', ' + entry.heroClass + ', ' + status(entry) + (wound ? ', ' + wound : '') +
            (rank !== -1 ? ', rank ' + (rank + 1) + ', remove from party' : ', select for party')) + '">' +
          '<span class="cf-portrait-frame">' + portrait(entry, 'cf-card-portrait') + '</span>' +
          '<span class="cf-hero-info"><span class="cf-status">' + escape(status(entry)) + '</span>' +
          '<strong>' + escape(name) + '</strong><span class="cf-class">' + escape(entry.heroClass) + ' · ' + escape(entry.variant || 'standard') + '</span>' +
          '<span class="cf-stats">Level ' + (entry.level || 1) + ' <span>·</span> ' + camp._effectiveMaxHp(entry) + ' max HP' +
          (entry.xp ? ' <span>·</span> ' + entry.xp + ' XP' : '') + '</span>' +
          '<span class="cf-trait' + (wound ? ' cf-wound' : '') + '">' + escape(wound || roles[entry.heroClass]) + '</span></span>' +
          '<span class="cf-pick" aria-hidden="true">' + (rank !== -1 ? ranks[rank] : '+') + '</span></button>';
      });
      html += '</div></section>';
    });

    html += '</div><section class="cf-muster" aria-labelledby="cf-muster-title"><div class="cf-section-heading">' +
      '<h2 id="cf-muster-title">The expedition</h2><span id="cf-count">' + selected.length + ' / 4 chosen</span></div>' +
      '<p class="cf-instruction">Choose four in marching order. Rank I holds the front. Remove a hero to change the order.</p>' +
      '<div class="cf-departure"><ol class="cf-ranks" aria-label="Party ranks, front to rear">';
    for (var slot = 0; slot < 4; slot++) {
      var chosen = offer[selected[slot]];
      html += '<li class="cf-rank' + (chosen ? ' is-filled' : '') + '"><span class="cf-rank-number">' + ranks[slot] + '</span>' +
        '<span class="cf-rank-info"><small>' + positions[slot] + '</small><strong>' + (chosen ? escape(chosen.name) : 'Unfilled') + '</strong></span>' +
        (chosen ? '<button type="button" id="cf-remove-' + slot + '" data-remove="' + selected[slot] + '" aria-label="Remove ' + escape(chosen.name) + ' from rank ' + (slot + 1) + '">×</button>' : '') + '</li>';
    }
    html += '</ol><button type="button" id="btn-descend" class="cf-button cf-descend"' + (ready ? '' : ' disabled') +
      '>Begin the descent <span aria-hidden="true">↓</span></button></div>' +
      '<div class="cf-actions"><button type="button" id="btn-visit-town" class="cf-text-button">Visit the town <span aria-hidden="true">↗</span></button>' +
      '<span class="cf-selection-help">' + (ready ? 'Company assembled. The Spire awaits.' : 'Choose ' + (4 - selected.length) + ' more to descend.') + '</span>' +
      (canResume ? '<button type="button" id="btn-resume-expedition" class="cf-button cf-resume">Resume expedition →</button>' : '') + '</div>' +
      (canResume ? '<p class="cf-save-note">An expedition is saved. Resume it, or assemble a new company to begin again.</p>' : '') +
      '</section><section class="cf-memorial" aria-labelledby="cf-fallen-title"><div class="cf-section-heading"><h2 id="cf-fallen-title">Beyond the firelight</h2>' +
      '<span>' + dead.length + ' fallen</span></div>';
    if (!dead.length) html += '<p class="cf-empty">The stones bear no names. May it remain so.</p>';
    else {
      html += '<ul class="cf-graves">';
      dead.slice(-6).reverse().forEach(function(g) {
        var def = camp._heroDef(g.heroClass);
        html += '<li><span class="cf-gravestone" aria-hidden="true"></span><span><strong>' + escape(g.name || (def ? def.name : g.heroClass)) +
          '</strong><small>Fallen · Expedition ' + ((g.runNumber || 0) + 1) + '</small></span></li>';
      });
      html += '</ul>';
      if (dead.length > 6) html += '<p class="cf-empty">And ' + (dead.length - 6) + ' more remembered in the town graveyard.</p>';
    }
    html += '</section><footer class="cf-footer">THE FIRE KEEPS NO PROMISES.</footer></div></main>';
    root.innerHTML = html;
    if (DS.EquipmentView) DS.EquipmentView.campfire(root);
    if (!announcement) {
      announcement = document.createElement('div');
      announcement.id = 'cf-announcement';
      announcement.className = 'cf-sr-only';
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
    }
    root.appendChild(announcement);
    announcement.textContent = selected.length + ' of 4 chosen. ' + selected.map(function(index, rank) {
      return 'Rank ' + (rank + 1) + ': ' + offer[index].name;
    }).join('. ');

    function toggle(index, focusTarget) {
      if (selected.length === 4 && selected.indexOf(index) === -1) {
        announcement.textContent = 'The party is full. Remove a chosen hero before selecting another.';
        return;
      }
      camp.toggleSelect(index);
      DS.UI.renderCampfire(root);
      var target = document.getElementById(focusTarget);
      if (target) target.focus({preventScroll: true});
    }
    root.querySelectorAll('[data-offer]').forEach(function(button) {
      button.onclick = function() { toggle(Number(button.dataset.offer), button.id); };
    });
    root.querySelectorAll('[data-remove]').forEach(function(button) {
      button.onclick = function() { toggle(Number(button.dataset.remove), 'cf-hero-' + button.dataset.remove); };
    });
    root.querySelector('#btn-descend').onclick = function() { if (camp._selected.length === 4) camp.embark(); };
    root.querySelector('#btn-visit-town').onclick = function() {
      camp._offer = null;
      camp._selected = [];
      DS.State.screen = 'town';
      DS.UI.render();
    };
    var resume = root.querySelector('#btn-resume-expedition');
    if (resume) resume.onclick = function() {
      if (DS.State.load()) DS.UI.render();
      else {
        DS.State.deleteRunSave();
        DS.UI.renderCampfire(root);
        document.getElementById('cf-announcement').textContent = 'The saved expedition could not be restored. Assemble a new company.';
        root.querySelector('.cf-selection-help').textContent = 'Save could not be restored. Assemble a new company.';
      }
    };
    if (focusId) {
      var restored = document.getElementById(focusId);
      if (restored) restored.focus({preventScroll: true});
    }
  };
})();
