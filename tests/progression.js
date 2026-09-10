const assert=require('node:assert/strict');
const {loadGame}=require('./game-harness');
const {DS,memory}=loadGame();
DS.UI.render=()=>{};DS.PlayerIdentity.set({type:'scripted',policy:'progression-regression',policyVersion:'1'});DS.Meta.newGame();
DS.Meta.heroRoster=DS.Heroes.map(h=>DS.Meta.rollRecruit(h.cls));
for(const [idx,h] of DS.Meta.heroRoster.entries()) {
  const def=id=>DS.Cards[h.heroClass].find(c=>c.id===id);
  assert.equal(h.kit.length,4);assert.ok(h.kit.every(def));
  const variants=new Set(Array.from({length:40},()=>DS.Meta.rollKit(h.heroClass).join(',')));
  assert.ok(variants.size>=2,h.heroClass+' has varied starting kits');
  const trees=new Set(Array.from({length:25},()=>JSON.stringify(DS.Skills.generate(h.heroClass))));
  assert.ok(trees.size>1,'randomized specialization');
  assert.equal(h.skillTree.branches.length,3);
  for(const b of h.skillTree.branches) {assert.equal(b.nodes.length,3);assert.ok(b.nodes.filter(n=>n.kind==='card').every(n=>def(n.cardId)));}
  assert.equal(DS.Meta.addXp(idx,8).length,1);
  assert.equal(h.level,2);assert.equal(h.maxHpBonus,2);assert.equal(h.power,1);assert.equal(h.skillPoints,1);
  const b=h.skillTree.branches[0];assert.equal(DS.Meta.spendSkillPoint(idx,b.nodes[1].id),false);
  assert.equal(DS.Meta.spendSkillPoint(idx,b.nodes[0].id),true);
  assert.equal(DS.Meta.spendSkillPoint(idx,b.nodes[0].id),false);
  DS.Meta.addXp(idx,28);assert.equal(h.level,4);
  assert.ok(DS.Meta.spendSkillPoint(idx,b.nodes[1].id));assert.ok(DS.Meta.spendSkillPoint(idx,b.nodes[2].id));
  const deck=DS.Cards.buildStartingDeck([{cls:h.heroClass,heroIdx:idx,kit:h.kit,upgradedCards:h.upgradedCards,skillCards:h.skillCards}]);
  assert.equal(deck.length,9);assert.equal(deck.filter(c=>c.baseId===b.nodes[2].cardId).length,h.kit.includes(b.nodes[2].cardId)?3:1);
  const snapshot=JSON.stringify(h);DS.Meta._backfillRosterEntry(h);assert.equal(JSON.stringify(h),snapshot,'idempotent progression');
}
assert.equal(DS.Meta.progressionTutorial.completed,true,'first spend completes tutorial');
DS.Meta.save();const saved=JSON.stringify(DS.Meta.heroRoster);const fresh=loadGame({memory});assert.ok(fresh.DS.Meta.load());assert.equal(JSON.stringify(fresh.DS.Meta.heroRoster),saved,'exact tree/build refresh');assert.equal(fresh.DS.Meta.progressionTutorial.completed,true);
const legacy={heroClass:'fighter',level:4,xp:7,kit:['removed_card','fighter_strike'],upgradedCards:['removed_card','fighter_strike'],alive:true};DS.Meta._backfillRosterEntry(legacy);
assert.equal(legacy.skillPoints,3);assert.equal(legacy.maxHpBonus,6);assert.equal(legacy.power,3);assert.deepEqual(Array.from(legacy.kit),['fighter_strike']);assert.deepEqual(Array.from(legacy.upgradedCards),['fighter_strike']);
DS.Meta.heroRoster=[legacy];DS.Meta.save();const tree=JSON.stringify(legacy.skillTree);DS.Meta.load();assert.equal(JSON.stringify(DS.Meta.heroRoster[0].skillTree),tree);
DS.Campfire._buildOffer();const hp=DS.Campfire._effectiveMaxHp(DS.Campfire._offer[0]);DS.State.newRun([{heroClass:'fighter',rosterIndex:0},{heroClass:'rogue'},{heroClass:'cleric'},{heroClass:'wizard'}]);assert.equal(DS.State.run.heroes[0].maxHp,hp);assert.equal(DS.State.run.heroes[0].power,3);
DS.Meta.addXp(0,1000);assert.equal(DS.Meta.heroRoster[0].level,6);assert.equal(DS.Meta.heroRoster[0].xp,0);assert.equal(DS.Meta.addXp(0,Infinity).length,0);
console.log('progression: eight classes, varied kits/trees, stat growth, prerequisites, skill deck injection, migration/refresh, HP preview, tutorial and cap passed');

// Actual combat consumes level power and learned Block, not just displayed fields.
DS.Meta.heroRoster=[DS.Meta.rollRecruit('fighter')];DS.Meta.addXp(0,8);
DS.State.newRun([{heroClass:'fighter',rosterIndex:0},{heroClass:'rogue'},{heroClass:'cleric'},{heroClass:'wizard'}]);
DS.Combat.initCombat([{name:'Dummy',maxHp:100,intents:[{type:'attack',dmg:1,targeting:'front'}]}]);
let battle=DS.State.combat, fighter=DS.State.run.heroes[0], enemy=battle.enemies[0];
let strike=DS.State.run.deck.find(c=>c.baseId==='fighter_strike');
battle.hand=[strike];battle.energy=10;const before=enemy.hp;
DS.Combat.playCard(0,enemy);assert.equal(before-enemy.hp,strike.value+fighter.power,'level power deals real damage');
fighter.block=0;fighter.blockBonus=1;DS.Combat.gainBlock(fighter,4);assert.equal(fighter.block,5,'learned block gains apply');
console.log('progression: real combat power and Block effects passed');

// Starter attack copies must inherit class reach and keep mechanical upgrade metadata.
for(const h of DS.Heroes) {
  const kit=DS.Meta.rollKit(h.cls);
  const deck=DS.Cards.buildStartingDeck([{cls:h.cls,heroIdx:0,kit,upgradedCards:kit}]);
  for(const c of deck) {
    if(c.type==='attack') assert.ok(DS.Combat.cardReach(c).length>0,h.cls+' starter has real reach');
    const up=DS.Cards.UPGRADE_DEFS[c.baseId];
    if(up && up.reach) assert.deepEqual(Array.from(c.reach),Array.from(up.reach),'upgraded reach survives cloning');
  }
}
console.log('progression: starter reach and upgrade metadata passed');

// Four in the expedition; roster spaces grow separately after settlement and town upgrades.
DS.Meta.newGame();
assert.deepEqual(Array.from(DS.Meta.heroRoster,h=>h.heroClass),['fighter','rogue','cleric','wizard']);
assert.equal(DS.Meta.getRosterCapacity(),4);assert.equal(DS.Campfire.PARTY_SIZE,4);
DS.Campfire._buildOffer();assert.equal(DS.Campfire._offer.length,4,'no surplus recruits before first run');
DS.Campfire._selected=[];[0,1,2,3].forEach(i=>DS.Campfire.toggleSelect(i));
assert.equal(DS.Campfire._selected.length,4);
DS.Meta.applyRetreatOutcome(0,[0,1,2,3],[true,true,true,true]);
assert.equal(DS.Meta.runCount,1);assert.equal(DS.Meta.getRosterCapacity(),5);
DS.Campfire._buildOffer();assert.equal(DS.Campfire._offer.filter(e=>e.source==='recruit').length,1,'one extra recruit if four survive');
DS.Campfire._selected=[0,1,2,3];DS.Campfire.toggleSelect(4);assert.equal(DS.Campfire._selected.length,4,'fifth hero cannot join expedition');
DS.Meta.gold=10000;for(let i=0;i<5;i++)assert.ok(DS.Meta.upgradeBuilding('tavern'));
assert.equal(DS.Meta.getRosterCapacity(),25);assert.equal(DS.Campfire.PARTY_SIZE,4);
DS.Meta.heroRoster=DS.Heroes.map(h=>DS.Meta.rollRecruit(h.cls));DS.Meta.save();
const old=JSON.parse(memory.get('darkspire_meta'));delete old.rosterCapacityVersion;delete old.tutorialPerks.rosterExpansion;old.runCount=0;old.buildings.tavern.level=1;memory.set('darkspire_meta',JSON.stringify(old));
assert.ok(DS.Meta.load());assert.equal(DS.Meta.heroRoster.length,8,'migration never deletes surplus roster heroes');assert.equal(DS.Meta.getRosterCapacity(),4);
DS.Campfire._buildOffer();assert.equal(DS.Campfire._offer.filter(e=>e.source==='recruit').length,0,'overcapacity roster is preserved without adding recruits');
console.log('progression: fixed four-person expeditions; initial four, first-run fifth roster slot, roster upgrades and surplus legacy heroes passed');
