const assert=require('node:assert/strict');
const {loadGame}=require('./game-harness');
const {DS,memory}=loadGame();DS.UI.render=()=>{};
DS.PlayerIdentity.set({type:'scripted',policy:'subclass-regression',policyVersion:'1'});DS.Meta.newGame();
let paths=0,played=0;
for(const def of DS.Heroes) {
  const cls=def.cls;
  const signatures=new Set();
  for(let branchIndex=0;branchIndex<3;branchIndex++) {
    const h=DS.Meta.rollRecruit(cls);DS.Meta.heroRoster=[h];
    assert.equal(h.subclass,null);assert.equal(DS.Meta.getKitVariant(h),null);
    const branch=h.skillTree.branches[branchIndex];signatures.add(branch.nodes[0].cardId);
    const rolls=new Set(Array.from({length:80},()=>DS.Skills.generate(cls).branches[branchIndex].nodes[1].cardId));
    assert.equal(rolls.size,2,cls+'/'+branch.name+' has two persistent themed rolls');
    assert.ok(branch.desc.length>20);assert.equal(branch.nodes.length,5);
    assert.ok(branch.nodes.every(n=>n.kind==='card'||n.kind==='upgrade'),'no renamed generic stat branches');
    const beforeKit=JSON.stringify(h.kit);
    for(let tier=0;tier<5;tier++) {
      assert.equal(DS.Meta.spendSkillPoint(0,branch.nodes[tier].id),false,'level and point gate');
      DS.Meta.addXp(0,DS.Meta.xpToNext(h.level));
      assert.ok(DS.Meta.spendSkillPoint(0,branch.nodes[tier].id),cls+'/'+branch.name+' tier '+tier);
      assert.equal(h.subclass,branch.id);assert.equal(DS.Meta.getKitVariant(h),branch.name);
      assert.equal(h.skillPoints,0);
      assert.equal(DS.Meta.spendSkillPoint(0,h.skillTree.branches[(branchIndex+1)%3].nodes[0].id),false,'other subclass stays closed');
    }
    assert.equal(JSON.stringify(h.kit),beforeKit,'subclass never rerolls kit');
    assert.equal(h.level,6);assert.equal(h.skillCards.length,3);
    const deck=DS.Cards.buildStartingDeck([{cls,heroIdx:0,kit:h.kit,upgradedCards:h.upgradedCards,skillCards:h.skillCards}]);
    assert.equal(deck.length,11,'three techniques and two masteries, no duplicate mastery cards');
    for(const tier of [0,1]) {
      const card=deck.find(c=>c.id.includes('_skill_')&&c.baseId===branch.nodes[tier].cardId);
      assert.ok(card.upgraded,'learned technique really mastered');
      const base=DS.Cards[cls].find(c=>c.id===card.baseId),up=DS.Cards.UPGRADE_DEFS[card.baseId];
      assert.ok(Object.keys(up).filter(k=>k!=='name'&&k!=='desc').some(k=>JSON.stringify(up[k])!==JSON.stringify(base[k])||typeof up[k]==='function'&&up[k]!==base[k]),'mastery must change real behavior '+card.baseId);
      assert.equal(card.desc,DS.Cards.UPGRADE_DEFS[card.baseId].desc);
      assert.equal(card.effect,DS.Cards.UPGRADE_DEFS[card.baseId].effect||DS.Cards[cls].find(c=>c.id===card.baseId).effect);
    }
    DS.Meta.save();const snapshot=JSON.stringify(h);assert.ok(DS.Meta.load());assert.equal(JSON.stringify(DS.Meta.heroRoster[0]),snapshot,'path roll, mastery and choice survive reload');
    DS.State.newRun([{heroClass:cls,rosterIndex:0},{heroClass:'rogue'},{heroClass:'cleric'},{heroClass:'wizard'}]);
    // Play every branch's real hallmark, utility and capstone through the real engine.
    for(const id of h.skillCards) {
      DS.Combat.initCombat([{name:'Front',maxHp:250,intents:[{type:'attack',dmg:2,targeting:'front'}]},{name:'Rear',maxHp:250,intents:[{type:'attack',dmg:2,targeting:'front'}]}]);
      const b=DS.State.combat,hero=DS.State.run.heroes[0];
      const card=DS.State.run.deck.find(c=>c.baseId===id&&c.id.includes('_skill_'));
      DS.State.run.heroes.forEach(x=>{x.hp=Math.ceil(x.maxHp/2);x.poison=2;x.weak=1;});
      if(card.prefPos.length){const pos=card.prefPos[0],other=DS.State.run.heroes.find(x=>x.pos===pos);if(other)other.pos=hero.pos;hero.pos=pos;}
      hero.block=10;b.energy=5;
      if(card.target==='ally_dead')DS.State.run.heroes[1].hp=0;
      const target=DS.Combat.validTargets(card).find(t=>card.target==='ally_dead'?t.isHero&&t.hp<=0:card.target==='ally'?t.isHero:!t.isHero);
      b.hand=[card];assert.ok(DS.Combat.canPlayCard(card).playable,'technique playable '+id);
      DS.Combat.playCard(0,target||null);assert.ok(!b.hand.includes(card),'technique resolves '+id);played++;
    }
    paths++;
  }
  assert.equal(signatures.size,3,cls+' subclass identities use different hallmark actions');
}
// Old mixed branches keep learned effects but do not silently select a subclass.
DS.Meta.newGame();const old=DS.Meta.heroRoster[0];old.level=4;old.xp=2;old.progressionVersion=2;
old.skillTree={version:1,branches:[{nodes:[{id:'old_hp',kind:'maxHp',amount:4,unlocked:true},{id:'old_card',kind:'card',cardId:'fighter_taunt',unlocked:true}]},{nodes:[{id:'old_power',kind:'power',amount:1,unlocked:true}]},{nodes:[]}]};
old.skillCards=['fighter_taunt'];old.subclass='Bulwark';old.variant='Bulwark';old.skillPoints=0;
const kit=JSON.stringify(old.kit);DS.Meta._backfillRosterEntry(old);
assert.equal(old.subclass,null);assert.equal(DS.Meta.getKitVariant(old),null);assert.equal(old.skillPoints,3,'old points refunded once');
assert.equal(old.maxHpBonus,10);assert.equal(old.power,4);assert.ok(old.skillCards.includes('fighter_taunt'));assert.equal(old.legacySkills.length,3);assert.equal(JSON.stringify(old.kit),kit);
DS.Meta.spendSkillPoint(0,old.skillTree.branches[1].nodes[0].id);assert.equal(old.skillPoints,2);DS.Meta.save();
const snapshot=JSON.stringify(old);DS.Meta.load();assert.equal(JSON.stringify(DS.Meta.heroRoster[0]),snapshot,'legacy training does not duplicate or refund again');
assert.equal(DS.Meta.getRosterCapacity(),4);assert.equal(DS.Campfire.PARTY_SIZE,4);
console.log('subclasses: '+paths+' paths, '+played+' real technique plays, mastery effects, roll persistence, explicit choice, legacy effects/refund and four-party isolation passed');
