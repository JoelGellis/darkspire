(async function () {
  var checks = [];
  function check(value, label) { if (!value) throw new Error(label); checks.push(label); }
  try {
    DS.PlayerIdentity.set({type:'scripted',policy:'native-archive-fixture',policyVersion:'1'}); DS.Meta.newGame(); DS.Campfire._buildOffer();
    [0,1,2,3].forEach(DS.Campfire.toggleSelect); DS.Campfire.embark();
    check(DS.State.screen === 'map', 'Actual campfire embark reaches map');
    var id = DS.State.run.journalId;
    DS.Combat.initCombat(DS.Enemies.pickEncounter('normal'));
    DS.State.screen = 'combat'; DS.UI.render();
    DS.Combat.dealDamage(DS.State.combat.enemies[0], 3);
    DS.State.save();
    check(DS.State.load(), 'Real save restoration succeeds');
    check(DS.State.run.journalId === id, 'Reload joins the same journal');
    await DS.Telemetry.flush();
    var archive = await DS.Telemetry.archiveAll();
    var events = archive.events.filter(e=>e.runId===id);
    check(archive.persistence.indexOf('IndexedDB')===0,'Native IndexedDB stores full history');
    check(events.some(e=>e.type==='combat.dealDamage'),'Semantic damage retained in IndexedDB');
    check(events.some(e=>e.type==='run.resume'),'Reload event persisted');
    check(new Set(events.map(e=>e.seq)).size===events.length,'Sequence IDs remain unique');
    check(![...__archiveTestStore.keys()].some(k=>k.startsWith('darkspire_journal_v1:')),'Committed write-ahead journal drains from localStorage');
    check(!!document.getElementById('run-archive'),'Export control rendered');
    DS.State.screen='map'; DS.UI.render();
    var out=document.createElement('pre'); out.id='telemetry-test-result';
    out.style.cssText='position:fixed;top:8px;left:8px;z-index:20000;background:#162719;color:#fff;padding:16px;max-width:95vw;white-space:pre-wrap';
    out.textContent='PASS: '+checks.join('\nPASS: ')+'\nEvents: '+events.length;
    document.body.appendChild(out);
  } catch (error) {
    var out=document.createElement('pre'); out.id='telemetry-test-result'; out.textContent='FAIL: '+error.stack; document.body.appendChild(out);
  }
})();
