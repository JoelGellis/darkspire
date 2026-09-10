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
DS.Meta.heroRoster = DS.Heroes.slice(0,4).map(h=>DS.Meta.rollRecruit(h.cls));
const roster = DS.Meta.heroRoster;
roster[0].injury = {id:'wounded'};
roster[0].upgradedCards = [roster[0].kit[3]];
DS.Meta.ownedGear = DS.Gear.catalog.map(i=>i.id);
const allowed = DS.Gear.catalog.filter(i=>i.slot!=='artifact' && DS.Gear.classAllowed(i,roster[0].heroClass));
const weapon = allowed.find(i=>i.grantsCard);
assert.ok(DS.Gear.equip(0,weapon.id).ok);
const armor = allowed.find(i=>i.slot==='armor');
assert.ok(DS.Gear.equip(0,armor.id).ok);
const extra = allowed.find(i=>i.slot==='trinket');
assert.equal(DS.Gear.equip(0,extra.id).ok,false,'lean departure refuses third item');
DS.Campfire._buildOffer();
DS.Campfire._selected=[0,1,2,3];
const artifacts = DS.Gear.getOwnedArtifacts().slice(0,2).map(i=>i.id);
DS.Campfire._artifacts = artifacts;
const hp = DS.Campfire._effectiveMaxHp(DS.Campfire._offer[0]);
DS.Campfire.embark();
let run=DS.State.run;
assert.equal(run.heroes[0].maxHp,hp,'wounded geared preview equals expedition HP');
assert.deepEqual(Array.from(new Set(run.deck.filter(c=>c.heroIdx===0&&!c.fromGear).map(c=>c.baseId))),Array.from(roster[0].kit));
const mastered=run.deck.find(c=>c.heroIdx===0&&c.baseId===roster[0].kit[3]);
assert.equal(mastered.upgraded,true);
const upgrade=DS.Cards.UPGRADE_DEFS[mastered.baseId]; if(upgrade.effect) assert.equal(mastered.effect,upgrade.effect,'canonical upgrade effect'); if(upgrade.value!==undefined) assert.equal(mastered.value,upgrade.value);
assert.equal(run.artifacts.length,2);
assert.equal(run.deck.filter(c=>c.fromGear===weapon.id).length,1);
const size=run.deck.length;
DS.Gear.applyLoadout(run,[0,1,2,3],artifacts);
assert.equal(run.deck.length,size,'loadout idempotent');
DS.State.save();DS.State.run=null;assert.ok(DS.State.load());run=DS.State.run;
assert.equal(run.deck.find(c=>c.fromGear===weapon.id).effect,weapon.grantsCard.effect,'gear effect restores');
assert.equal(run.deck.find(c=>c.baseId===mastered.baseId).effect,mastered.effect,'mastery restores');
assert.equal(run.artifacts.length,2);
DS.State.screen='combat';assert.equal(DS.Gear.salvage(weapon.id),-1);assert.equal(DS.Gear.reassignOnRun(weapon.id,1).ok,false);
DS.State.screen='shop';
const gold=run.gold;
assert.equal(DS.Gear.salvage(weapon.id),DS.Gear.salvageValue(weapon));
assert.equal(run.gold,gold+DS.Gear.salvageValue(weapon));
assert.equal(run.deck.some(c=>c.fromGear===weapon.id),false);
assert.equal(DS.Gear.salvage(weapon.id),-1,'cannot sell twice');
assert.equal(DS.Meta.ownsGear(weapon.id),false);
const purchase=DS.Gear.catalog.find(i=>i.grantsCard&&i.id!==weapon.id&&DS.Gear.classAllowed(i,run.heroes[1].cls));
DS.Meta.ownedGear=DS.Meta.ownedGear.filter(id=>id!==purchase.id);run.gold=1000;
assert.ok(DS.Gear.buyOnRun(purchase.id,1).ok);
assert.equal(DS.Gear.buyOnRun(purchase.id,1).ok,false,'cannot duplicate purchase');
run.heroes[1].hp=0;
assert.equal(DS.Gear.salvage(purchase.id),-1,'death cannot be undone by salvage');
const injuredBefore=run.heroes[0].hp=12;
assert.ok(DS.Gear.reassignOnRun(armor.id,2).ok);
assert.ok(DS.Gear.reassignOnRun(armor.id,0).ok);
assert.equal(run.heroes[0].hp,injuredBefore,'bouncing HP armor cannot heal');
const report=DS.Gear.resolveRunEnd(run,'retreat',[0,1,2,3]);
assert.ok(report.lost.includes(purchase.id));
assert.ok(report.kept.includes(armor.id),'ordinary purchased gear is permanent');
assert.equal(DS.Gear.resolveRunEnd(run,'retreat',[0,1,2,3]),report,'settlement once');
DS.Meta.applyRetreatOutcome(0,[0,1,2,3],[true,false,true,true]);
assert.equal(DS.Meta.ownsGear(purchase.id),false);
assert.ok(DS.Meta.lostGear.some(e=>e.itemId===purchase.id));
assert.equal(DS.Gear._equippedIds(DS.Meta.heroRoster[0]).filter(id=>id===armor.id).length,1,'survivor slot not duplicated');
console.log('party-equipment: kit/mastery/wounds/loadout/artifacts/acquisition/death/salvage/save passed');
