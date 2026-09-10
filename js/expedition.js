// Expedition choices use earned temporary resources; gold remains permanent value.
(function() {
  var E = DS.Expedition = {
    POTION_CAP: 3,
    potions: {
      healing: {name:'Healing draught',desc:'Restore 10 HP to one living hero.',target:'hero'},
      antidote: {name:'Antidote',desc:'Remove all poison and bleed from one living hero.',target:'hero'},
      protection: {name:'Stoneblood',desc:'Give one living hero 14 Block.',target:'hero'},
      fire: {name:'Fire flask',desc:'Deal 16 damage to one enemy.',target:'enemy'},
      poison: {name:'Venom flask',desc:'Apply 7 Poison to one enemy.',target:'enemy'},
      disruption: {name:'Disruption flask',desc:'Stun one non-boss enemy; bosses suffer 3 Weak instead.',target:'enemy'}
    },
    blessings: {
      iron: {name:'Iron Vigil',desc:'Every combat: all living heroes start with 5 Block.'},
      fury: {name:'Ashen Fury',desc:'Every combat: all living heroes start with 1 Strength.'},
      renewal: {name:'Quiet Renewal',desc:'After each victory: heal all living heroes 3 HP.'}
    },
    ensure: function() { var r=DS.State.run;if(!r)return null;r.expedition=r.expedition||{potions:[],battles:0,camps:{},blessing:null,pendingBlessing:false};r.expedition.rewardedNodes=r.expedition.rewardedNodes||{};return r.expedition; },
    earnPotion: function(id) { var x=E.ensure();if(!x||!E.potions[id]||x.potions.length>=E.POTION_CAP)return false;x.potions.push(id);return true; },
    usePotion: function(slot,targetIdx) {
      var r=DS.State.run,c=DS.State.combat,x=E.ensure();
      if(!r||!c||DS.State.screen!=='combat'||c.gameOver||c.animating||c.playerTurn===false)return false;
      var id=x.potions[slot],def=E.potions[id];if(!def)return false;
      var t=def.target==='hero'?r.heroes[targetIdx]:c.enemies[targetIdx];if(!t||t.hp<=0)return false;
      if(id==='healing'&&t.hp>=t.maxHp)return false;
      if(id==='antidote'&&!t.poison&&!t.bleed)return false;
      x.potions.splice(slot,1);
      if(id==='healing')t.hp=Math.min(t.maxHp,t.hp+10);
      if(id==='antidote'){t.poison=0;t.bleed=0;}
      if(id==='protection')t.block=(t.block||0)+14;
      if(id==='fire')DS.Combat.dealDamage(t,16);
      if(id==='poison')t.poison=(t.poison||0)+7;
      if(id==='disruption'){if(t.isBoss)t.weak=(t.weak||0)+3;else t.stunned=true;}
      DS.Combat.logMsg(def.name+' used on '+t.name+'.','system');
      DS.Combat.checkGameOver();
      DS.State.save();DS.UI.render();return true;
    },
    flee: function() {
      var r=DS.State.run,c=DS.State.combat;
      if(!r||!c||DS.State.screen!=='combat'||c.animating||c.gameOver||c.playerTurn===false)return false;
      r.fledFrom=r.currentNode;r.fleeWounds=DS.Meta.applyFleeInjuries();r._fled=true;r._retreated=true;
      c.gameOver=true;DS.State.combat=null;DS.State.screen='summary';DS.UI.render();return true;
    },
    chooseBlessing: function(id) { var x=E.ensure();if(!x||!x.pendingBlessing||!E.blessings[id]||DS.State.screen!=='reward')return false;x.blessing=id;x.pendingBlessing=false;DS.State.save();return true; },
    camp: function(action,cardId) {
      var r=DS.State.run,x=E.ensure();if(!r||!x||DS.State.screen!=='rest'||x.camps[r.currentNode])return false;
      if(action==='train') {var card=r.deck.find(function(c){return c.id===cardId&&!c.upgraded&&!c.fromGear&&!c.temporary&&DS.Cards.UPGRADE_DEFS[c.baseId]&&r.heroes[c.heroIdx]&&r.heroes[c.heroIdx].hp>0;});if(!card)return false;DS.Cards.applyUpgrade(card);}
      else if(action==='heal')r.heroes.forEach(function(h){if(h.hp>0)h.hp=Math.min(h.maxHp,h.hp+Math.floor(h.maxHp*.2));});
      else if(action==='prepare')x.preparation=true;
      else return false;
      x.camps[r.currentNode]=action;DS.Game.afterRest();return true;
    },
    ledger: function(run,outcome) {
      var gained=Math.max(0,run.gold-(run.startGold||0)),treasury=DS.Meta.gold;
      var banked=outcome==='retreat'?Math.floor(gained*DS.Meta.RETREAT_BANK_RATE):(outcome==='defeat'||outcome==='flee')?0:run.gold;
      var lost=[],kept=[],fallen=[];
      run.heroes.forEach(function(h){var dead=outcome==='defeat'||(outcome!=='autoRetreat'&&h.hp<=0);if(dead)fallen.push(h.name);DS.Gear._equippedIds(h).forEach(function(id){(dead?lost:kept).push(id);});});
      (run.artifacts||[]).forEach(function(id){(outcome==='defeat'?lost:kept).push(id);});
      return {outcome:outcome,runGold:run.gold,banked:banked,treasuryBefore:treasury,treasuryLost:0,gearLost:lost,gearKept:kept,fallen:fallen};
    }
  };
  function node(tag,text,parent){var e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(parent)parent.appendChild(e);return e;}
  function button(text,parent,fn){var b=node('button',text,parent);b.type='button';b.className='btn';b.onclick=fn;return b;}
  function box(root,title){
    if(title==='One night by the fire'){var stage=node('section');stage.className='screen ds-expedition-camp';root.appendChild(stage);var p=node('div',undefined,stage);p.className='ds-expedition-choices';node('h2',title,p);return p;}
    var open=button(title,root,function(){dialog.showModal();});open.className='btn ds-expedition-launch';
    var dialog=node('dialog');dialog.className='ds-dialog ds-expedition-dialog';dialog.setAttribute('aria-label',title);root.appendChild(dialog);
    var header=node('header',undefined,dialog);node('h2',title,header);button('Return',header,function(){dialog.close();});return dialog;
  }

  var victory=DS.Game.onCombatVictory;
  DS.Game.onCombatVictory=function(){var r=DS.State.run,x=E.ensure();if(x&&!x.rewardedNodes[r.currentNode]){x.rewardedNodes[r.currentNode]=true;x.battles++;if(x.battles%2===1){var ids=Object.keys(E.potions);E.earnPotion(ids[Math.floor((x.battles-1)/2)%ids.length]);}var n=DS.Game._findNode(r.currentNode);if(n&&n.type==='elite')x.pendingBlessing=true;if(x.blessing==='renewal')r.heroes.forEach(function(h){if(h.hp>0)h.hp=Math.min(h.maxHp,h.hp+3);});}return victory.apply(this,arguments);};
  var init=DS.Combat.initCombat;
  DS.Combat.initCombat=function(){var result=init.apply(this,arguments),x=E.ensure();if(x){DS.State.run.heroes.forEach(function(h){if(h.hp<=0)return;if(x.blessing==='iron')h.block+=5;if(x.blessing==='fury')h.strength+=1;if(x.preparation)h.block+=8;});if(x.preparation){DS.State.combat.energy+=1;x.preparation=false;}}return result;};
  var combatView=DS.UI.renderCombat;
  DS.UI.renderCombat=function(root){combatView(root);var x=E.ensure(),c=DS.State.combat;if(!x||!c||c.gameOver)return;var p=box(root,'Supplies & escape');node('p','Flee ends the expedition: all unbanked run gold is lost. Your existing treasury stays safe. Each living hero has a 75% chance of returning Wounded.',p);button('Flee to the hamlet',p,E.flee);node('p','Potion belt '+x.potions.length+'/'+E.POTION_CAP+' — earned in battle; uses no energy.',p);
    x.potions.forEach(function(id,slot){var def=E.potions[id],r=node('div',undefined,p);node('span',def.name+': '+def.desc+' ',r);var s=node('select',undefined,r);s.setAttribute('aria-label','Target for '+def.name);(def.target==='hero'?DS.State.run.heroes:c.enemies).forEach(function(t,i){if(t.hp<=0)return;var o=node('option',t.name,s);o.value=i;});button('Use '+def.name,r,function(){E.usePotion(slot,Number(s.value));});});};
  var rewardView=DS.UI.renderReward;
  DS.UI.renderReward=function(root){rewardView(root);var x=E.ensure();if(!x)return;var p=box(root,'Spoils of the expedition');node('p','Potion belt: '+(x.potions.map(function(id){return E.potions[id].name;}).join(', ')||'empty'),p);if(x.pendingBlessing){node('p','An elite fell. Choose one run blessing. It replaces your current blessing and expires at expedition end.',p);Object.keys(E.blessings).forEach(function(id){var b=E.blessings[id];button(b.name+' — '+b.desc,p,function(){E.chooseBlessing(id);DS.UI.render();});});}else if(x.blessing)node('p',E.blessings[x.blessing].name+' — '+E.blessings[x.blessing].desc,p);};
  DS.UI.renderRest=function(root){root.innerHTML='';var p=box(root,'One night by the fire');node('p','Choose one: restore the living, hone a card, or prepare for the next battle.',p);button('Rest — heal all living heroes 20%',p,function(){E.camp('heal');});button('Prepare — next battle +8 Block each, +1 opening energy',p,function(){E.camp('prepare');});var r=node('div',undefined,p),s=node('select',undefined,r);s.setAttribute('aria-label','Card to train');DS.State.run.deck.filter(function(c){return !c.upgraded&&!c.fromGear&&!c.temporary&&DS.Cards.UPGRADE_DEFS[c.baseId]&&DS.State.run.heroes[c.heroIdx].hp>0;}).forEach(function(c){var o=node('option',c.heroName+': '+c.name,s);o.value=c.id;});button('Train selected card',r,function(){E.camp('train',s.value);});};
  // Temporary-healing purchases violate the permanent-gold doctrine.
  var shopView=DS.UI.renderShop;
  DS.UI.renderShop=function(root){shopView(root);var b=root.querySelector('#shop-potion-btn');if(b){var section=b.closest('.shop-section');if(section)section.remove();else b.remove();}};

  E.outcome=function(r){return r._autoRetreat?'autoRetreat':r._fled?'flee':r._retreated?'retreat':DS.State.stats.floorsCleared>=7?'victory':'defeat';};
  var summary=DS.UI.renderSummary;
  DS.UI.renderSummary=function(root){
    var removeSave=DS.State.deleteRunSave;DS.State.deleteRunSave=function(){};
    try{summary(root);}finally{DS.State.deleteRunSave=removeSave;}
    var r=DS.State.run;if(!r)return;var outcome=E.outcome(r),l=E.ledger(r,outcome);r.exitLedger=l;
    if(outcome==='flee'){var banner=root.querySelector('.summary-banner-text');if(banner)banner.textContent='ESCAPED';var flavor=root.querySelector('.summary-flavor');if(flavor)flavor.textContent='The living return. Unbanked gold stays in the dark.';}
    var rewards=root.querySelector('.summary-reward-gold');if(rewards)rewards.textContent='Gold banked: '+l.banked+' ? Treasury preserved: '+l.treasuryBefore;
    var p=box(root,'Settlement ledger');node('p','Run gold '+l.runGold+' ? Banked '+l.banked+' ? Treasury loss '+l.treasuryLost,p);node('p','Fallen: '+(l.fallen.join(', ')||'none'),p);node('p','Equipment lost: '+(l.gearLost.map(function(id){var i=DS.Gear.getById(id);return i?i.name:id;}).join(', ')||'none'),p);node('p','Equipment recovered: '+(l.gearKept.map(function(id){var i=DS.Gear.getById(id);return i?i.name:id;}).join(', ')||'none'),p);DS.State.save();
  };
  // A single campaign write carries both mutations and the settlement receipt.
  // No nested XP/death/save method may publish a half-settled campaign.
  var campaignFields=['gold','runCount','rosterCapacityVersion','victories','heroRoster','buildings','graveyard','unlocks','ownedGear','merchantLevel','lostGear','tutorialPerks','progressionTutorial'];
  var receipts={};
  try{receipts=(JSON.parse(localStorage.getItem('darkspire_meta'))||{}).settledExpeditions||{};}catch(e){}
  var originalMetaSave=DS.Meta.save;
  DS.Meta.save=function(){var data={};campaignFields.forEach(function(key){data[key]=DS.Meta[key];});data.settledExpeditions=receipts;localStorage.setItem('darkspire_meta',JSON.stringify(data));};
  var originalMetaLoad=DS.Meta.load;
  DS.Meta.load=function(){var ok=originalMetaLoad.apply(this,arguments);if(ok){try{receipts=(JSON.parse(localStorage.getItem('darkspire_meta'))||{}).settledExpeditions||{};}catch(e){}}return ok;};
  E.settle=function(run){
    if(!run)return false;var id=run.journalId||run.runId||String(run.startTime),outcome=E.outcome(run);
    if(receipts[id])return false;
    var indices=DS.UI._summaryGetRosterMap(run),ledger=E.ledger(run,outcome),save=DS.Meta.save;
    var backup={};campaignFields.forEach(function(key){backup[key]=JSON.parse(JSON.stringify(DS.Meta[key]));});
    DS.Meta.save=function(){};
    try{
      DS.Gear.resolveRunEnd(run,outcome==='flee'?'retreat':outcome,indices);
      var alive=run.heroes.map(function(h){return outcome==='autoRetreat'||h.hp>0;});
      if(outcome==='victory'){DS.Meta.applyVictoryRewards(ledger.banked,indices,alive);DS.State._pendingUnlocks=DS.Meta.checkUnlocks();}
      else if(outcome==='defeat'){
        DS.Meta._restInjuredAtHome(indices);indices.filter(function(i){return i>=0;}).sort(function(a,b){return b-a;}).forEach(function(i){DS.Meta.killHero(i);});DS.Meta.runCount++;DS.Meta.grantFirstRunRosterExpansion();
      }else DS.Meta.applyRetreatOutcome(ledger.banked,indices,alive);
      ledger.treasuryAfter=DS.Meta.gold;receipts[id]=ledger;
      DS.Meta.save=save;DS.Meta.save();
    }catch(error){DS.Meta.save=save;campaignFields.forEach(function(key){DS.Meta[key]=backup[key];});delete receipts[id];delete run.gearSettlement;throw error;}
    run.exitLedger=ledger;run.settlementApplied=true;
    if(DS.Telemetry)DS.Telemetry.record('expedition.settlement',{ledger:ledger});
    DS.State.run=null;DS.State.combat=null;DS.State._selectedParty=null;DS.State._runRosterMap=null;DS.State.deleteRunSave();DS.State.screen='town';DS.UI.render();return true;
  };
  DS.UI._summaryApplyResults=function(outcome,run){return E.settle(run);};
})();
