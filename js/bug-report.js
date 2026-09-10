// Local-only diagnostic capture for the demo. It never uploads or reads
// campaign data outside the current game state.
window.DS = window.DS || {};
DS.BugReport = (function () {
  'use strict';

  function copy(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (e) { return null; }
  }

  function capture(note) {
    var state = DS.State || {};
    var run = state.run || {};
    var combat = state.combat || {};
    var archive = DS.Telemetry && DS.Telemetry.archive ? DS.Telemetry.archive() : null;
    var events = archive && Array.isArray(archive.events) ? archive.events : [];
    return {
      type: 'darkspire-bug-report',
      schema: 1,
      game: 'Darkspire',
      version: DS.VERSION || 'development-unversioned',
      capturedAt: new Date().toISOString(),
      note: String(note || ''),
      screen: state.screen || null,
      floor: run.floor || 0,
      run: { floor: run.floor || 0, screen: state.screen || null },
      heroes: copy(run.heroes || []),
      enemies: copy(combat.enemies || []),
      fight: { enemies: copy(combat.enemies || []), turn: combat.turn || 0, energy: combat.energy || 0, maxEnergy: combat.maxEnergy || 0, selectedCard: combat.selectedCard },
      cards: {
        hand: (combat.hand || []).map(function (card) { return { id: card.baseId || card.id, name: card.name || null }; }),
        drawPile: (combat.drawPile || []).map(function (card) { return card.baseId || card.id; }),
        discardPile: (combat.discardPile || []).map(function (card) { return card.baseId || card.id; }),
        exhaustPile: (combat.exhaustPile || []).map(function (card) { return card.baseId || card.id; }),
        deckSize: Array.isArray(run.deck) ? run.deck.length : 0
      },
      recentActions: events.slice(-12).map(function (event) { return { type: event.type, time: event.time }; })
    };
  }

  function copyReport(report) {
    var text = JSON.stringify(report, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var field = document.createElement('textarea');
    field.value = text; field.setAttribute('readonly', ''); field.style.position = 'fixed'; field.style.opacity = '0';
    document.body.appendChild(field); field.select(); document.execCommand('copy'); field.remove();
    return Promise.resolve();
  }

  function mount() {
    if (!document.body || document.getElementById('ds-bug-report-launcher')) return;
    var button = document.createElement('button');
    button.id = 'ds-bug-report-launcher';
    button.className = 'ds-bug-report-launcher';
    button.type = 'button';
    button.textContent = 'Report a problem';
    button.onclick = function () {
      if (document.getElementById('ds-bug-report-panel')) return;
      var panel = document.createElement('section');
      panel.id = 'ds-bug-report-panel';
      panel.className = 'ds-bug-report-panel';
      panel.innerHTML = '<div class="ds-bug-report-header"><h2>Report a problem</h2><button type="button" class="ds-bug-report-close" aria-label="Close">×</button></div>' +
        '<p class="ds-bug-report-copy">This creates a local diagnostic snapshot. Nothing is sent automatically.</p>' +
        '<label><span>What happened?</span><textarea></textarea></label>' +
        '<div class="ds-bug-report-actions"><button type="button" class="btn ds-bug-report-save">Save snapshot</button><button type="button" class="btn ds-bug-report-copy">Copy report</button></div>' +
        '<p class="ds-bug-report-status" role="status"></p>';
      document.body.appendChild(panel);
      var closeButton = panel.querySelector && panel.querySelector('.ds-bug-report-close');
      var saveButton = panel.querySelector && panel.querySelector('.ds-bug-report-save');
      var copyButton = panel.querySelector && panel.querySelector('.ds-bug-report-copy');
      var noteField = panel.querySelector && panel.querySelector('textarea');
      var status = panel.querySelector && panel.querySelector('.ds-bug-report-status');
      if (!closeButton || !saveButton || !copyButton || !noteField || !status) return;
      closeButton.onclick = function () { panel.remove(); };
      saveButton.onclick = function () {
        var report = capture(noteField.value);
        var blob = new Blob([JSON.stringify(report, null, 2)], {type:'application/json'});
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'darkspire-report-' + Date.now() + '.json';
        link.click();
        status.textContent = 'Snapshot saved locally.';
      };
      copyButton.onclick = function () {
        copyReport(capture(noteField.value)).then(function () {
          status.textContent = 'Report copied to the clipboard.';
        }, function () {
          status.textContent = 'Copy was unavailable; save the snapshot instead.';
        });
      };
    };
    document.body.appendChild(button);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
  return { capture: capture, copy: copyReport, mount: mount };
}());
