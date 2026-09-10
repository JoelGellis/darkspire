// Game-only, local expedition archive. Never sends data over the network.
(function () {
  'use strict';
  var DS = window.DS;
  var PREFIX = 'darkspire_journal_v1:';
  var sessionId = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  var pending = [], sequence = 0, active = null, depth = 0, previous = '';
  var writes = [], database = null;
  var ready = new Promise(function (resolve) {
    if (!window.indexedDB) { resolve(null); return; }
    var request = window.indexedDB.open('darkspire-run-archive', 1);
    request.onupgradeneeded = function () { request.result.createObjectStore('events', {keyPath: 'key'}); };
    request.onsuccess = function () { database = request.result; resolve(database); };
    request.onerror = function () { resolve(null); fail(request.error); };
    request.onblocked = function () { fail(new Error('Archive database blocked by another tab; close older Darkspire tabs.')); };
  });
  function persist(key, entry) {
    var task = ready.then(async function (db) {
      if (!db) return;
      var stored = {key: key, entry: entry};
      if (window.CompressionStream) {
        var stream = new Blob([JSON.stringify(entry)]).stream().pipeThrough(new CompressionStream('gzip'));
        stored = {key: key, encoding: 'gzip', data: await new Response(stream).blob()};
      }
      return new Promise(function (resolve) {
        var tx = db.transaction('events', 'readwrite');
        tx.objectStore('events').put(stored);
        tx.oncomplete = function () {
          localStorage.removeItem(key);
          pending = pending.filter(function (p) { return p.key !== key; });
          resolve();
        };
        tx.onabort = tx.onerror = function () { fail(tx.error || new Error('Archive transaction failed')); resolve(); };
      });
    }).catch(function (error) { fail(error); });
    writes.push(task);
    task.then(function () { writes.splice(writes.indexOf(task), 1); });
  }
  function clean(value) {
    var seen = [];
    return JSON.parse(JSON.stringify(value, function (key, v) {
      if (typeof v === 'function') return undefined;
      if (v && typeof v === 'object') {
        while (seen.length && seen[seen.length - 1] !== this) seen.pop();
        if (seen.indexOf(v) >= 0) return '[circular]';
        seen.push(v);
      }
      return v;
    }));
  }
  function snapshot() {
    return clean({screen: DS.State.screen, run: DS.State.run, combat: DS.State.combat,
      stats: DS.State.stats, rosterMap: DS.State._runRosterMap,
      campaign: {gold: DS.Meta.gold, roster: DS.Meta.heroRoster, graveyard: DS.Meta.graveyard,
        runCount: DS.Meta.runCount, gearInventory: DS.Meta.gearInventory}});
  }
  function fail(error) {
    T.storageError = String(error && error.message || error);
    console.error('Darkspire archive storage failed; unsaved events remain in memory. Export before closing.', error);
    var old = document.getElementById('run-archive');
    if (old) old.remove();
    mount();
  }
  function record(type, detail) {
    if (!active) return;
    sequence = Math.max(sequence, Number(localStorage.getItem('darkspire_journal_sequence:' + active)) || 0) + 1;
    var entry = {schema: 1, runId: active, sessionId: sessionId, eventId: sessionId + ':' + sequence, seq: sequence, time: new Date().toISOString(),
      actor: clean(DS.PlayerIdentity ? DS.PlayerIdentity.current : {type:'unknown'}),
      type: type, detail: clean(detail || {}), state: snapshot()};
    var key = PREFIX + active + ':' + String(sequence).padStart(8, '0') + ':' + sessionId;
    try { localStorage.setItem(key, JSON.stringify(entry)); }
    catch (e) { pending.push({key: key, entry: entry}); fail(e); }
    try { localStorage.setItem('darkspire_journal_sequence:' + active, String(sequence)); } catch (e) { fail(e); }
    persist(key, entry);
    previous = JSON.stringify(entry.state);
    return entry;
  }
  function begin() {
    if (!DS.State.run) return;
    active = DS.State.run.journalId || ('run-' + Date.now().toString(36) + '-' +
      (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2)));
    DS.State.run.journalId = active;
    sequence = Number(localStorage.getItem('darkspire_journal_sequence:' + active)) || 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(PREFIX + active + ':') === 0) sequence = Math.max(sequence, Number(key.split(':')[2]) || 0);
    }
    record(sequence ? 'run.resume' : 'run.start', {version: DS.VERSION || 'development-unversioned',
      seed: DS.State.run.seed === undefined ? null : DS.State.run.seed,
      randomness: DS.State.run.seed === undefined ? 'Seed unavailable; snapshots support diagnosis, not deterministic replay.' : 'seeded'});
  }
  function wrap(obj, name, label) {
    if (!obj || typeof obj[name] !== 'function') return;
    var fn = obj[name];
    obj[name] = function () {
      var args = clean(Array.prototype.slice.call(arguments));
      var before = active ? snapshot() : null;
      var result;
      depth++;
      try { result = fn.apply(this, arguments); }
      catch (error) { depth--; record(label + '.error', {args: args, error: String(error)}); throw error; }
      function done(value) {
        depth--;
        if (active) record(label, {args: args, before: before, result: value === undefined ? null : clean(value)});
        return value;
      }
      if (result && typeof result.then === 'function') return result.then(done, function (error) {
        depth--; record(label + '.error', {args: args, error: String(error)}); throw error;
      });
      return done(result);
    };
  }
  var T = DS.Telemetry = {
    schema: 1, storageError: null, snapshot: snapshot, record: record,
    archive: function () {
      var events = [], corrupt = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(PREFIX) === 0) {
          try { events.push(JSON.parse(localStorage.getItem(key))); }
          catch (e) { corrupt.push({key: key, raw: localStorage.getItem(key)}); }
        }
      }
      pending.forEach(function (p) { events.push(p.entry); });
      events.sort(function (a, b) { return a.runId.localeCompare(b.runId) || a.seq - b.seq; });
      return {schema: 1, game: 'Darkspire', exportedAt: new Date().toISOString(),
        storageError: T.storageError, unsavedEvents: pending.length, corruptRecords: corrupt, events: events};
    },
    flush: async function () { while (writes.length) await Promise.all(writes.slice()); },
    archiveAll: async function () {
      await ready; await T.flush();
      var archive = T.archive(), records = [];
      if (database) records = await new Promise(function (resolve, reject) {
        var request = database.transaction('events', 'readonly').objectStore('events').getAll();
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function () { reject(request.error); };
      });
      var map = new Map();
      for (var i = 0; i < records.length; i++) {
        var stored = records[i], entry = stored.entry;
        if (stored.encoding === 'gzip') entry = JSON.parse(await new Response(stored.data.stream().pipeThrough(new DecompressionStream('gzip'))).text());
        map.set(entry.eventId || entry.runId + ':' + entry.seq, entry);
      }
      archive.events.forEach(function (e) { map.set(e.eventId || e.runId + ':' + e.seq, e); });
      archive.events = Array.from(map.values()).sort(function (a, b) { return a.runId.localeCompare(b.runId) || a.seq - b.seq; });
      archive.persistence = database ? 'IndexedDB with synchronous local journal' : 'localStorage fallback';
      return archive;
    },
    exportArchive: async function () {
      record('archive.export');
      var blob = new Blob([JSON.stringify(await T.archiveAll(), null, 2)], {type: 'application/json'});
      var url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'darkspire-run-archive-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
  };
  function mount() {
    if (!document.body || document.getElementById('run-archive')) return;
    var box = document.createElement('div'); box.id = 'run-archive';
    box.style.cssText = 'display:none;position:fixed;bottom:4px;left:4px;z-index:10000;background:#191714;color:#eee;padding:5px;font:12px sans-serif;max-width:320px';
    var button = document.createElement('button'); button.textContent = 'Export run archive';
    button.onclick = T.exportArchive; box.appendChild(button);
    if (DS.PlayerIdentity) { var identify = document.createElement('button'); identify.textContent='Change player';identify.onclick=DS.PlayerIdentity.change;box.appendChild(identify); }
    var info = document.createElement('span');
    info.textContent = T.storageError ? ' STORAGE FULL: export before closing. New events are only in memory.' : ' Saved on this browser. Export to share for analysis.';
    box.appendChild(info); document.body.appendChild(box);
    if (!window.__darkspireArchiveShortcut) {
      window.__darkspireArchiveShortcut = true;
      document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'e') {
          event.preventDefault();
          box.style.display = box.style.display === 'none' ? 'block' : 'none';
        }
      });
    }
  }
  var newRun = DS.State.newRun;
  DS.State.newRun = function () { var result = newRun.apply(this, arguments); begin(); return result; };
  var save = DS.State.save;
  DS.State.save = function () {
    var result = save.apply(this, arguments);
    try {
      var raw = localStorage.getItem('darkspire_save');
      if (raw && active) { var data = JSON.parse(raw); data.journalId = active; localStorage.setItem('darkspire_save', JSON.stringify(data)); }
    } catch (e) { fail(e); }
    record('run.save'); return result;
  };
  var load = DS.State.load;
  DS.State.load = function () {
    var id = null;
    try { id = JSON.parse(localStorage.getItem('darkspire_save') || '{}').journalId; } catch (e) { /* engine diagnoses invalid save */ }
    var result = load.apply(this, arguments);
    if (result && DS.State.run) { if (id) DS.State.run.journalId = id; begin(); }
    return result;
  };
  ['playCard','endTurn','moveHeroAction','initCombat','dealDamage','healTarget','gainBlock','applyStatus',
    'handleDeath','drawCard','discardCard','exhaustCard','generateCard','logMsg'].forEach(function (name) { wrap(DS.Combat, name, 'combat.' + name); });
  ['selectNode','startRun','onCombatVictory','onCombatDefeat','retreat','flee','afterReward','afterRest','afterEvent','afterShop'].forEach(function (name) { wrap(DS.Game, name, 'game.' + name); });
  ['buyOnRun','reassignOnRun','salvage','applyLoadout','resolveRunEnd','buyInTown','getRunStock'].forEach(function (name) { wrap(DS.Gear, name, 'gear.' + name); });
  wrap(DS.UI, '_summaryApplyResults', 'run.settlement');
  wrap(DS.Cards, 'getRewardPool', 'reward.offer');
  ['earnPotion','usePotion','flee','chooseBlessing','camp'].forEach(function (name) { wrap(DS.Expedition, name, 'expedition.' + name); });
  ['healInjury','addXp','killHero'].forEach(function (name) { wrap(DS.Meta, name, 'campaign.' + name); });
  ['endCombat','addRelic'].forEach(function (name) { wrap(DS.State, name, 'state.' + name); });
  var render = DS.UI.render;
  DS.UI.render = function () {
    var result = render.apply(this, arguments);
    if (active && !depth && JSON.stringify(snapshot()) !== previous) record('screen.stateChange');
    mount(); return result;
  };
  // Event/card/reward handlers often mutate inline, so capture after every game click as well.
  document.addEventListener('click', function () {
    if (active && JSON.stringify(snapshot()) !== previous) record('interaction.stateChange');
  });
  window.addEventListener('pagehide', function () { record('session.pagehide'); });
  // Replay any synchronous journal records left by a closed tab before its IDB transaction committed.
  for (var storedIndex = 0; storedIndex < localStorage.length; storedIndex++) {
    var storedKey = localStorage.key(storedIndex);
    if (storedKey && storedKey.indexOf(PREFIX) === 0) {
      try { persist(storedKey, JSON.parse(localStorage.getItem(storedKey))); } catch (e) { fail(e); }
    }
  }
  mount();
})();
