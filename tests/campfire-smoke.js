// Dependency-free integration checks against the real index.html script order.
// Browser layout and DOM interaction coverage is recorded in .agent/STATE.md.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const memory = new Map();
const noop = () => {};
const element = () => ({classList:{add:noop,remove:noop},style:{},appendChild:noop,addEventListener:noop,
  remove:noop,prepend:noop,setAttribute:noop,querySelector:()=>null,querySelectorAll:()=>[]});
const context = {
  console, setTimeout:()=>0, clearTimeout:noop, requestAnimationFrame:()=>0,
  cancelAnimationFrame:noop, addEventListener:noop,
  document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
    createElement:element,body:element(),head:element(),addEventListener:noop},
  localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}
};
context.window = context;
vm.createContext(context);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
for (const script of scripts) vm.runInContext(fs.readFileSync(path.join(root,script),'utf8'),context,{filename:script});
const {DS} = context;
DS.UI.render = noop;
DS.PlayerIdentity.set({type:'scripted',policy:'regression-suite',policyVersion:'1'}); DS.Meta.newGame();
DS.Campfire._buildOffer();
const offer = DS.Campfire._offer;
assert.equal(DS.Meta.heroRoster.length,4,'new campaign starts with four roster heroes');
assert.ok(offer.length >= 4, 'fresh campaign can field four');
assert.ok(new Set(offer.map(e=>e.heroClass)).size >= 4, 'original four classes remain represented');
const oldRosterCount = DS.Meta.heroRoster.length;
[2,0,3,1].forEach(DS.Campfire.toggleSelect);
assert.deepEqual(Array.from(DS.Campfire._selected),[2,0,3,1]);
DS.Campfire.toggleSelect(0);
assert.deepEqual(Array.from(DS.Campfire._selected),[2,3,1], 'removal closes rank gap');
DS.Campfire.toggleSelect(0);
if (offer.length > 4) {
  DS.Campfire.toggleSelect(4);
  assert.equal(DS.Campfire._selected.length,4,'cannot add a fifth party hero');
}
assert.equal(DS.Meta.heroRoster.length,oldRosterCount,'selection alone does not recruit');
const ordered = DS.Campfire._selected.map(i=>offer[i]);
const expectedClasses = Array.from(ordered,e=>e.heroClass);
const expectedHp = Array.from(ordered,DS.Campfire._effectiveMaxHp);
DS.Campfire.embark();
assert.equal(DS.State.screen,'map');
assert.deepEqual(Array.from(DS.State.run.heroes,h=>h.cls),expectedClasses,'click order reaches run');
assert.deepEqual(Array.from(DS.State.run.heroes,h=>h.pos),[1,2,3,4]);
assert.deepEqual(Array.from(DS.State.run.heroes,h=>h.maxHp),expectedHp,'preview matches current engine');
assert.equal(DS.State.run.deck.length,32);
for (const entry of ordered.filter(e=>e.source==='recruit')) {
  assert.equal(DS.Meta.heroRoster[entry.rosterIdx],entry.recruit,'same rolled recruit persists');
}
DS.State.run.gold = 43;
DS.State.save();
assert.ok(DS.State.hasRunSave());
DS.State.run = null;
assert.ok(DS.State.load(),'saved expedition resumes');
assert.equal(DS.State.run.gold,43);
assert.deepEqual(Array.from(DS.State.run.heroes,h=>h.cls),expectedClasses);
assert.ok(DS.State.run.deck.every(c=>typeof c.effect==='function'),'card effects rehydrate');
const legacySave = JSON.parse(memory.get('darkspire_save'));
legacySave.version = 1;
legacySave.run.deck.push({id:'retired-card',baseId:'removed_card_v0',heroCls:'rogue',heroIdx:1});
memory.set('darkspire_save',JSON.stringify(legacySave));
DS.State.run = null;
assert.ok(DS.State.load(),'legacy save migrates without losing the campaign');
assert.equal(DS.State.run.deck.some(c=>c.baseId==='removed_card_v0'),false,'retired cards are filtered during migration');
assert.match(DS.State.migrationNotice,/schema 3|retired card/,'migration explains the repair');
assert.ok(memory.has('darkspire_recovery_checkpoint'),'pre-migration recovery checkpoint is retained');
assert.equal(JSON.parse(memory.get('darkspire_save')).version,3,'migrated save is rewritten at the current schema');
const activeFive = JSON.parse(memory.get('darkspire_save'));
DS.Meta.ownedGear = ['gear-kept-during-party-migration'];
DS.Meta.buildings.tavern.level = 2;
DS.Meta.save();
activeFive.run.heroes.push(Object.assign({}, activeFive.run.heroes[0], {id:'hero_4',pos:5}));
activeFive.selectedHeroes = [0,1,2,3,4];
memory.set('darkspire_save',JSON.stringify(activeFive));
DS.State.run = null;
assert.ok(DS.State.load(),'five-hero active save migrates safely');
assert.equal(DS.State.screen,'campfire','five-hero run returns to campfire');
assert.equal(DS.State.run,null,'incompatible active run is not resumed');
assert.equal(DS.Meta.heroRoster.length,4,'active-party migration preserves the roster');
assert.deepEqual(Array.from(DS.Meta.ownedGear),['gear-kept-during-party-migration'],'active-party migration preserves gear');
assert.equal(DS.Meta.buildings.tavern.level,2,'active-party migration preserves town upgrades');
assert.ok(memory.has('darkspire_recovery_checkpoint'),'five-hero raw save is retained as recovery checkpoint');
DS.Meta.buildings.tavern.level = 0;
DS.Meta.applyRetreatOutcome(0,[0,1,2,3],[true,true,true,true]);
assert.equal(DS.Meta.getRosterCapacity(),5,'first resolved run grants one roster slot');
DS.Meta.save();
DS.Campfire.enter(); DS.Campfire._buildOffer();
assert.equal(DS.Campfire._offer.length,5,'post-tutorial stagecoach can offer a fifth roster body');
const killed = DS.Meta.heroRoster[0];
DS.Meta.killHero(0);
assert.ok(!DS.Meta.heroRoster.includes(killed));
assert.equal(DS.Meta.graveyard.length,1);
DS.Campfire.enter();
DS.Campfire._buildOffer();
assert.ok(DS.Campfire._offer.filter(e=>e.source==='roster').every(e=>DS.Meta.heroRoster[e.rosterIdx]!==killed));
assert.ok(DS.Campfire._offer.length>=4,'recruitment replenishes losses');
DS.Meta.heroRoster = DS.Heroes.map(h=>DS.Meta.rollRecruit(h.cls));
DS.Campfire._buildOffer();
assert.equal(DS.Campfire._offer.length,8);
assert.ok(DS.Campfire._offer.every(e=>e.source==='roster'),'full roster has no recruits');
DS.Meta.heroRoster = [];
DS.Campfire._buildOffer();
assert.equal(DS.Campfire._offer.length,4,'wipe replenishes a complete four-hero party');
assert.ok(DS.Campfire._offer.every(e=>e.source==='recruit'));
context.localStorage.setItem('darkspire_save','{broken');
const expectedErrors = [];
context.console = {...console, error:(...args)=>expectedErrors.push(args), warn:(...args)=>expectedErrors.push(args)};
assert.equal(DS.State.load(),true,'corrupt active save recovers the prior checkpoint');
assert.equal(DS.State.recoveredFromBackup,true,'recovery path is marked');
assert.match(DS.State.migrationNotice,/recovered the last good checkpoint/,'recovery explains what happened');
const css = fs.readFileSync(path.join(root,'css/campfire.css'),'utf8');
for (const match of css.matchAll(/url\(['"]?([^'"\)]+)/g)) {
  assert.ok(fs.existsSync(path.resolve(root,'css',match[1])),'CSS asset exists');
}
for (const h of DS.Heroes) assert.ok(fs.existsSync(path.join(root,'assets/exported/sprites','campfire-'+h.cls+'.png')));
assert.ok(!/assets\/source\//.test(fs.readFileSync(path.join(root,'js/campfire-view.js'),'utf8')+css));
console.log('PASS: campfire selection, ranks, recruit persistence, embark, save/resume, death/refill, roster cap, wipe, corrupt save, asset paths');
