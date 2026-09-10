window.addEventListener('load',function() {
  if(DS.PlayerIdentity)DS.PlayerIdentity.set({type:'scripted',policy:'equipment-fixture',policyVersion:'1'});
  var b=document.createElement('button');b.textContent='Fixture: open merchant';b.style.cssText='position:fixed;top:4px;left:44%;z-index:9000';b.onclick=function(){if(!DS.State.run) return; DS.State.run.gold=500; DS.Meta.ownedGear=DS.Meta.ownedGear.filter(function(id){return DS.State.run.heroes.some(function(h){return DS.Gear._equippedIds(h).indexOf(id)!==-1;});});DS.State.screen='shop';DS.UI.render();};document.body.appendChild(b);
  var mode=new URLSearchParams(location.search).get('mode');if(mode){DS.Campfire._buildOffer();DS.Campfire._selected=[0,1,2,3];DS.Campfire.embark();if(mode==='shop')b.click();if(mode==='combat'){DS.Combat.initCombat(DS.Enemies.normal[0]);DS.State.screen='combat';DS.UI.render();}if(mode==='town'){DS.State.screen='town';DS.UI.render();}}
});
