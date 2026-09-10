// Browser-only isolated regression + visual handoff. Never touches campaign storage.
window.addEventListener('load',function(){
  DS.PlayerIdentity.set({type:'scripted',policy:'progression-ui-fixture',policyVersion:'1'});
  DS.Meta.newGame();DS.Meta.heroRoster=DS.Heroes.map(function(h){return DS.Meta.rollRecruit(h.cls);});
  DS.Meta.addXp(5,8);DS.Campfire.enter();
  function check(ok,msg){if(!ok)throw Error('Progression UI: '+msg);}
  document.querySelector('.skill-guide-open').click();
  check(document.querySelector('#skill-hero').value==='5','guide opens leveled ranger');
  var select=document.querySelector('#skill-hero');check(select.options.length===8,'all eight heroes reachable');
  for(var i=0;i<8;i++){select=document.querySelector('#skill-hero');select.value=String(i);select.dispatchEvent(new Event('change'));check(document.querySelectorAll('.skill-branch').length===3,'three branches for hero '+i);}
  select=document.querySelector('#skill-hero');select.value='5';select.dispatchEvent(new Event('change'));
  check(document.querySelectorAll('.skill-node').length===15,'five tiers in all three paths');
  check(document.querySelector('.skill-tree-panel').textContent.includes('closes the other paths'),'commitment disclosed before choosing');
  document.querySelector('.skill-node:not(:disabled)').click();check(DS.Meta.progressionTutorial.completed,'first spend completes tutorial');
  check(DS.Meta.heroRoster[5].skillPoints===0,'spends on selected hero');
  check(DS.Meta.heroRoster[5].subclass==='ranger_deadeye','explicit subclass identity selected');
  check(document.querySelectorAll('.skill-node:not(:disabled)').length===0,'no extra spend without points');
  check(document.querySelector('.skill-tree-panel').textContent.includes('Subclass: Deadeye'),'chosen identity visible');
  DS.Meta.save();DS.Meta.load();check(DS.Meta.progressionTutorial.completed,'completed flag survives reload');
  var closedDialog=document.querySelector('.skill-tree-dialog');
  closedDialog.addEventListener('close',function(){
    // Leave the approved tutorial visible for desktop/mobile visual review.
    DS.Meta.progressionTutorial={completed:false};delete DS.Meta.heroRoster[5].firstLevelGains;
    DS.Meta.addXp(2,8);DS.Campfire.enter();DS.UI.openHeroSkills(2);
    var result=document.createElement('p');result.textContent='PASS: all-hero switching, branch rendering, guided selection, real point spend and persistence.';result.style.color='#b9e8ab';document.querySelector('.skill-tree-panel').prepend(result);
  },{once:true});
  closedDialog.close();
});
