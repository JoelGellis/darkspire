(function() {
  var render=DS.UI.render;
  DS.UI.render=function() {
    render.apply(this,arguments);
    var combat=DS.State.combat;
    if(DS.State.screen!=='combat' || !combat) return;
    var forecast=DS.Combat.forecastIncoming();
    function note(id,text) {
      var el=document.getElementById(id); if(!el) return;
      var old=el.querySelector('.tactical-note'); if(old) old.remove();
      var label=document.createElement('div'); label.className='tactical-note'; label.textContent=text; label.title='Direct attack estimate before reactive kills, relic prevention and end-round damage. Committed dead victims retarget the living front hero. Guard and taunt can redirect attacks.'; el.appendChild(label);
    }
    DS.Combat.aliveHeroes().forEach(function(h) {
      var f=forecast[h.id], parts=['Est. incoming '+f.damage+' HP / '+f.hits+' hits'];
      if(f.poison) parts.push('+'+f.poison+' poison');
      if(h.guard) parts.push('Guarded by '+DS.Combat.guardTarget(h).name);
      if(h.riposte) parts.push('Riposte '+h.riposte+' × '+h.riposteDamage);
      note(h.id,parts.join(' · '));
    });
    DS.Combat.aliveHeroes().forEach(function(h) {
      var incoming=[];
      DS.Combat.aliveEnemies().forEach(function(e) {
        var intent=e.currentIntent || {};
        if ((intent.type || '').indexOf('attack') !== 0) return;
        (e.intentTargets || []).forEach(function(id,i) { if (DS.Combat.intentTarget(e,i) && id===h.id) incoming.push(e.name); });
      });
      var heroEl=document.getElementById(h.id);
      if (heroEl && incoming.length) {
        var marker=document.createElement('div'); marker.className='incoming-target-marker'; marker.textContent='⚔️';
        marker.title='Targeted here: '+incoming.join(', ')+' · Position '+h.pos;
        heroEl.appendChild(marker);
      }
    });
    document.querySelectorAll('.entity-intent[data-target-ids]').forEach(function(intentEl) {
      var ids=(intentEl.getAttribute('data-target-ids') || '').split(',').filter(Boolean);
      intentEl.onmouseenter=function(){ ids.forEach(function(id){ var target=document.getElementById(id); if(target) target.classList.add('target-preview'); }); };
      intentEl.onmouseleave=function(){ ids.forEach(function(id){ var target=document.getElementById(id); if(target) target.classList.remove('target-preview'); }); };
    });
    combat.hand.forEach(function(c,i) {
      var el=document.querySelector('[data-hand-idx="'+i+'"]'); if(!el) return;
      var costBadge=el.querySelector('.card-cost'); if(costBadge) costBadge.textContent=c.xCost ? 'X' : DS.Combat.cardCost(c);
      var keywords=[];
      if(c.target==='enemy' || c.target==='enemy_any') keywords.push('Reach '+DS.Combat.cardReach(c).join('/'));
      ['innate','retain','ethereal','exhaust'].forEach(function(key) { if(c[key]) keywords.push(key); });
      if(c.xCost) keywords.push('X = '+DS.Combat.cardCost(c));
      else if(c._turnCost!==undefined) keywords.push('This turn: '+DS.Combat.cardCost(c)+' energy');
      var check=DS.Combat.canPlayCard(c); if(!check.playable) keywords.push('Unavailable: '+check.reason);
      var label=document.createElement('div'); label.className='tactical-note'; label.textContent=keywords.join(' · '); el.appendChild(label);
      el.title=c.desc+' '+keywords.join('. ');
    });
    var selected=combat.hand[combat.selectedCard];
    if(selected) combat.enemies.forEach(function(e) { var el=document.getElementById(e.id); if(el) el.classList.toggle('tactical-unreachable',!DS.Combat.validTarget(selected,e)); });
  };
})();

