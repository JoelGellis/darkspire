// Fixed class/subclass identities with saved, themed rolls inside each path.
// Inspiration: official Last Spell hero-specific perk-tree update (see docs/SUBCLASSES.md).
window.DS = window.DS || {};
DS.Skills = (function () {
  'use strict';
  // [id, title, role, hallmark, two utility rolls, capstone]. All actions already exist.
  var specs = {
    fighter: [
      ['bulwark','Bulwark','Absorb attacks and protect an ally.','iron_will',['fortify','second_wind'],'intercept'],
      ['warlord','Warlord','Build Strength, expose targets and rally the party.','war_cry',['shield_bash','second_wind'],'rally'],
      ['reaver','Reaver','Sweep enemy ranks and break enemy armor.','cleave',['whirlwind','shield_bash'],'sunder']
    ],
    rogue: [
      ['assassin','Assassin','Finish a priority target with burst damage and debuffs.','assassinate',['lacerate','weaken'],'reserve_blade'],
      ['duelist','Duelist','Chain strikes, reposition and cycle the hand.','flurry',['smoke_bomb','fan_of_knives'],'improvise'],
      ['venomist','Venomist','Spread Poison and wear down weakened enemies.','caltrops',['weaken','lacerate'],'poison_blade']
    ],
    cleric: [
      ['lifekeeper','Lifekeeper','Restore the party and rescue a fallen ally.','cleansing_light',['martyrdom','sanctuary'],'resurrect'],
      ['warden','Warden','Shield the group and cleanse harmful effects.','sanctuary',['purify','cleansing_light'],'bless'],
      ['inquisitor','Inquisitor','Expose enemy ranks to holy damage.','divine_wrath',['holy_nova','purify'],'holy_fire']
    ],
    wizard: [
      ['evoker','Evoker','Chain destructive spells into an energy-spending finisher.','chain_lightning',['meteor','blizzard'],'arcane_barrage'],
      ['arcanist','Arcanist','Empower allies, manipulate positioning and reduce card costs.','empower',['teleport','mirror_image'],'overcharge'],
      ['frostweaver','Frostweaver','Weaken enemy ranks and protect the caster while controlling the field.','blizzard',['mana_shield','mirror_image'],'frost_nova']
    ],
    barbarian: [
      ['berserker','Berserker','Turn low health into repeated strikes and Strength.','frenzy',['pain_threshold','undying_rage'],'blood_rage'],
      ['ravager','Ravager','Sweep the front line and exploit Vulnerable enemies.','whirlwind_axe',['berserker_roar','headbutt'],'rampage'],
      ['bloodreaver','Bloodreaver','Recover health from kills and fight through missing HP.','bloodlust',['pain_threshold','headbutt'],'undying_rage']
    ],
    ranger: [
      ['deadeye','Deadeye','Mark and finish a single high-value target.','called_shot',['mark_prey','camouflage'],'aimed_shot'],
      ['trapper','Trapper','Bleed, weaken and expose prey with traps.','bear_trap',['mark_prey','camouflage'],'snare_trap'],
      ['volley_archer','Volley Archer','Cover enemy ranks with repeated and area shots.','volley',['multi_shot','camouflage'],'rain_of_arrows']
    ],
    necromancer: [
      ['plaguebringer','Plaguebringer','Seed Poison, amplify it and punish crowded ranks.','plague_spread',['corpse_explosion','mass_curse'],'blight'],
      ['soulbinder','Soulbinder','Drain enemies to restore allies and trade health for cards.','soul_siphon',['death_coil','dark_pact'],'life_drain'],
      ['bonecaller','Bonecaller','Exploit fallen enemies, curse survivors and profit from exhausted cards.','corpse_explosion',['death_coil','mass_curse'],'ash_covenant']
    ],
    paladin: [
      ['guardian','Guardian','Draw attacks, protect the company and convert Block into offense.','guardian_stance',['aura_of_protection','holy_avenger'],'shield_of_faith'],
      ['avenger','Avenger','Expose a target and turn faith into decisive front-line damage.','divine_smite',['sacred_oath','holy_avenger'],'retribution'],
      ['hospitaller','Hospitaller','Sustain the line with healing attacks and party protection.','crusader_strike',['aura_of_protection','consecrate'],'lay_on_hands']
    ]
  };
  function definition(cls,id) { return (DS.Cards[cls] || []).find(function(c) { return c.id === id; }); }
  function node(cls,branch,tier,kind,id) {
    var def=definition(cls,id);
    if(!def) throw Error('Unknown subclass technique '+id);
    var upgrade=DS.Cards.UPGRADE_DEFS[id];
    if(kind==='upgrade' && !upgrade) throw Error('Missing subclass mastery '+id);
    return {id:branch+'_tier_'+tier,tier:tier,minLevel:tier+1,kind:kind,cardId:id,
      name:kind==='upgrade'?def.name+' Mastery':def.name,
      desc:kind==='upgrade'?'Upgrade this hero\'s starting copies of '+def.name+'. '+upgrade.desc:
        'Add one '+def.name+' to this hero\'s starting deck. '+def.desc,
      unlocked:false,requires:tier>1?branch+'_tier_'+(tier-1):null};
  }
  function generate(cls) {
    return {version:3,branches:(specs[cls] || []).map(function(spec) {
      var id=cls+'_'+spec[0], hallmark=cls+'_'+spec[3], utility=cls+'_'+spec[4][Math.floor(Math.random()*spec[4].length)];
      return {id:id,name:spec[1],desc:spec[2],nodes:[
        node(cls,id,1,'card',hallmark),node(cls,id,2,'card',utility),
        node(cls,id,3,'upgrade',hallmark),node(cls,id,4,'upgrade',utility),node(cls,id,5,'card',cls+'_'+spec[5])
      ]};
    })};
  }
  function valid(tree,cls) {
    if(!tree || tree.version!==3 || !Array.isArray(tree.branches) || tree.branches.length!==3) return false;
    var expected=specs[cls];
    return !!expected && tree.branches.every(function(b,i) {
      var spec=expected[i], id=cls+'_'+spec[0];
      return b && b.id===id && Array.isArray(b.nodes) && b.nodes.length===5 && b.nodes.every(function(n,j) {
        var kind=j===2 || j===3?'upgrade':'card';
        var cardId=j===0 || j===2?cls+'_'+spec[3]:j===4?cls+'_'+spec[5]:null;
        return n && n.id===id+'_tier_'+(j+1) && n.kind===kind && !!definition(cls,n.cardId) &&
          (cardId?n.cardId===cardId:spec[4].some(function(x){return cls+'_'+x===n.cardId;})) &&
          (j!==3 || n.cardId===b.nodes[1].cardId);
      });
    });
  }
  function repair(tree,cls) {
    tree.branches.forEach(function(b,i){b.name=specs[cls][i][1];b.desc=specs[cls][i][2];b.nodes=b.nodes.map(function(n,j){
      var canonical=node(cls,b.id,j+1,n.kind,n.cardId);canonical.unlocked=!!n.unlocked;return canonical;
    });});
  }
  function migrate(hero) {
    if(valid(hero.skillTree,hero.heroClass)) { repair(hero.skillTree,hero.heroClass);return; }
    // Preserve learned effects outside the new subclass tree; old kit variants never choose a path.
    var legacy=Array.isArray(hero.legacySkills)?hero.legacySkills:[];
    var branches=hero.skillTree && Array.isArray(hero.skillTree.branches)?hero.skillTree.branches:[];
    branches.forEach(function(b){(Array.isArray(b.nodes)?b.nodes:[]).forEach(function(n){
      if(!n || !n.unlocked || ['maxHp','power','block','card','upgrade'].indexOf(n.kind)<0)return;
      if((n.kind==='card'||n.kind==='upgrade')&&!definition(hero.heroClass,n.cardId))return;
      if(legacy.some(function(old){return old.id===n.id;}))return;
      legacy.push({id:n.id,name:n.name,desc:n.desc,kind:n.kind,amount:Number(n.amount)||0,cardId:n.cardId,unlocked:true});
    });});
    // Also keep previously granted compatible skill cards in partial saves without a readable tree.
    (Array.isArray(hero.skillCards)?hero.skillCards:[]).forEach(function(id){
      if(definition(hero.heroClass,id)&&!legacy.some(function(n){return n.kind==='card'&&n.cardId===id;}))
        legacy.push({id:'legacy_'+id,kind:'card',cardId:id,name:definition(hero.heroClass,id).name,unlocked:true});
    });
    hero.legacySkills=legacy;hero.skillTree=generate(hero.heroClass);hero.subclass=null;
  }
  function selected(hero) { return hero.skillTree && hero.skillTree.branches.find(function(b){return b.id===hero.subclass;}); }
  function canLearn(hero,branch,n,index) {
    return hero.alive!==false && hero.skillPoints>0 && !n.unlocked && hero.level>=n.minLevel &&
      (!hero.subclass || hero.subclass===branch.id) && (index===0 || branch.nodes[index-1].unlocked);
  }
  function subclasses(cls) {
    return (specs[cls] || []).map(function(spec) { return { id: cls + '_' + spec[0], name: spec[1], desc: spec[2] }; });
  }
  function nameFor(cls,id) {
    var found = subclasses(cls).find(function(s) { return s.id === id; });
    return found ? found.name : null;
  }
  return {generate:generate,valid:valid,repair:repair,migrate:migrate,selected:selected,canLearn:canLearn,subclasses:subclasses,nameFor:nameFor,specs:specs};
}());
