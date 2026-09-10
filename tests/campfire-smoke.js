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
assert.ok(offer.length >= 4, 'fresh campaign can field four');
assert.equal(new Set(offer.map(e=>e.heroClass)).size, offer.length, 'unique classes');
const oldRosterCount = DS.Meta.heroRoster.length;
[2,0,3,1].forEach(DS.Campfire.toggleSelect);
assert.deepEqual(Array.from(DS.Campfire._selected),[2,0,3,1]);
DS.Campfire.toggleSelect(0);
assert.deepEqual(Array.from(DS.Campfire._selected),[2,3,1], 'removal closes rank gap');
DS.Campfire.toggleSelect(0);
if (offer.length > 4) {
  DS.Campfire.toggleSelect(4);
  assert.equal(DS.Campfire._selected.length,4,'cannot add fifth hero');
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
assert.equal(DS.Campfire._offer.length,4,'wipe still permits a complete fresh party');
assert.ok(DS.Campfire._offer.every(e=>e.source==='recruit'));
context.localStorage.setItem('darkspire_save','{broken');
const expectedErrors = [];
context.console = {...console, error:(...args)=>expectedErrors.push(args), warn:(...args)=>expectedErrors.push(args)};
assert.equal(DS.State.load(),false,'corrupt save returns to campfire recovery');
assert.equal(expectedErrors.length,1,'corrupt save is diagnosed');
const css = fs.readFileSync(path.join(root,'css/campfire.css'),'utf8');
for (const match of css.matchAll(/url\(['"]?([^'"\)]+)/g)) {
  assert.ok(fs.existsSync(path.resolve(root,'css',match[1])),'CSS asset exists');
}
for (const h of DS.Heroes) assert.ok(fs.existsSync(path.join(root,'assets/exported/sprites','campfire-'+h.cls+'.png')));
assert.ok(!/assets\/source\//.test(fs.readFileSync(path.join(root,'js/campfire-view.js'),'utf8')+css));
console.log('PASS: campfire selection, ranks, recruit persistence, embark, save/resume, death/refill, roster cap, wipe, corrupt save, asset paths');
