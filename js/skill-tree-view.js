// Persistent campfire progression: preview every recruit and train every living veteran.
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function heroFor(e) { return e.source === 'roster' ? DS.Meta.heroRoster[e.rosterIdx] : e.recruit; }
  function tutorialFor(h) { var t = DS.Meta.progressionTutorial; return t && !t.completed && h.firstLevelGains; }
  function gainsText(h) {
    var gains = h.firstLevelGains || [];
    return gains.map(function(g) { var def = (DS.Cards[h.heroClass] || []).find(function(c) { return c.id === g.upgradedCardId; });
      return 'Level ' + g.level + ': +' + g.maxHp + ' max HP, +' + g.power + ' attack power, +1 skill point' + (def ? ', ' + def.name + ' upgraded' : '') + '.';
    }).join(' ');
  }
  function dismiss() { DS.Meta.progressionTutorial = {completed:true}; DS.Meta.save(); }
  function openTree(selected) {
    var offer = DS.Campfire._offer || [];
    if (!offer.length) return;
    var opener = document.activeElement;
    var dialog = document.createElement('dialog'); dialog.className = 'skill-tree-dialog ds-dialog';
    dialog.setAttribute('aria-labelledby','skill-title');
    document.body.appendChild(dialog);
    dialog.addEventListener('close', function() { dialog.remove(); DS.UI.render(); var next=document.getElementById(opener && opener.id ? opener.id : 'btn-skill-trees') || document.getElementById('btn-skill-trees'); if(next) next.focus(); });
    function render(index) {
      var e = offer[index] || offer[0], h = heroFor(e); DS.Meta._backfillRosterEntry(h);
      e.variant = DS.Meta.getKitVariant(h);
      var needed = DS.Meta.xpToNext(h.level);
      var options = offer.map(function(entry,i) { return '<option value="'+i+'" '+(entry===e?'selected':'')+'>'+esc(entry.name)+' — '+esc(entry.heroClass)+' '+(entry.source==='recruit'?'(recruit)':'(hero '+(entry.rosterIdx+1)+')')+'</option>'; }).join('');
      dialog.innerHTML = '<div class="skill-tree-panel"><header><h2 id="skill-title">Hero skills</h2><button class="btn skill-tree-close">Close</button></header><label>Choose hero <select id="skill-hero">'+options+'</select></label>'+
        '<p>Class: '+esc(h.heroClass)+' · '+(h.subclass ? 'Subclass: '+esc(DS.Skills.nameFor(h.heroClass,h.subclass)) : 'Base class. Your first investment chooses one of the three subclasses below and closes the other paths.')+'</p><p>Level '+h.level+' · '+(needed===null?'Maximum level':h.xp+' / '+needed+' XP')+' · '+h.skillPoints+' skill points</p><p>Level growth: +2 max HP, +1 attack power and 1 skill point per level. One kit card upgrades automatically while any remain.</p>'+ 
        '<p>Progression bonuses: +'+h.maxHpBonus+' max HP · +'+h.power+' attack power · +'+h.blockBonus+' Block per gain. Changes apply to the next expedition.</p>'+
        (tutorialFor(h)?'<aside class="skill-tutorial" role="status">'+esc(gainsText(h))+' Compare all three paths. Choose a subclass by learning its first technique for one point. This choice closes the other paths.<button class="btn" id="skill-dismiss">Dismiss guide</button></aside>':'')+
        (e.source==='recruit'?'<p>Recruit preview. This rolled kit and tree join your roster when you embark with this hero.</p>':'')+
        ((h.legacySkills || []).length ? '<details><summary>Retained legacy training</summary><p>'+h.legacySkills.map(function(n){return esc(n.desc || n.name || n.cardId);}).join('<br>')+'</p></details>' : '') +
        '<p>Starting kit (varies independently of subclass): '+h.kit.map(function(id) { var c=DS.Cards[h.heroClass].find(function(c){return c.id===id;});return esc(c.name)+(h.upgradedCards.indexOf(id)>=0?'+':''); }).join(', ')+'</p><div class="skill-branches">'+h.skillTree.branches.map(function(b) {
          return '<section class="skill-branch"><h3>'+esc(b.name)+'</h3><p>'+esc(b.desc)+'</p><small>'+(h.subclass===b.id?'Chosen subclass':h.subclass?'Other subclass (closed)':'Learn the first technique to choose this subclass')+'</small>'+b.nodes.map(function(n,i) {
            var ready = e.source==='roster' && DS.Skills.canLearn(h,b,n,i);
            var reason = n.unlocked ? 'Learned' : h.subclass && h.subclass!==b.id ? 'Other subclass chosen' :
              h.level<n.minLevel ? 'Requires level '+n.minLevel : i&&!b.nodes[i-1].unlocked ? 'Learn the previous technique first' :
              h.skillPoints<1 ? 'Requires 1 skill point' : !h.subclass ? 'Choose '+b.name+' - spend 1 point' : 'Spend 1 point';
            return '<button class="skill-node '+(n.unlocked?'skill-node-unlocked':'')+'" data-node="'+esc(n.id)+'" '+(ready?'':'disabled')+'><small>LEVEL '+n.minLevel+'</small><strong>'+esc(n.name)+'</strong><span>'+esc(n.desc)+'</span><small>'+esc(reason)+'</small></button>';
          }).join('')+'</section>';
        }).join('')+'</div></div>';
      dialog.querySelector('.skill-tree-close').onclick=function(){dialog.close();};
      dialog.querySelector('#skill-hero').onchange=function(){render(Number(this.value));dialog.querySelector('#skill-hero').focus();};
      var guide=dialog.querySelector('#skill-dismiss');if(guide) guide.onclick=function(){dismiss();render(index);dialog.querySelector('.skill-tree-close').focus();};
      dialog.querySelectorAll('[data-node]').forEach(function(button){button.onclick=function(){if(DS.Meta.spendSkillPoint(e.rosterIdx,button.dataset.node)){render(index);dialog.querySelector('#skill-hero').focus();}};});
    }
    render(selected || 0); dialog.showModal();
  }
  DS.UI.openHeroSkills = openTree;
  var original = DS.UI.renderCampfire;
  DS.UI.renderCampfire=function(root){
    original.apply(this,arguments);
    var section=root.querySelector('.cf-muster'), offer=DS.Campfire._offer||[];
    if(!section || !offer.length) return;
    var button=document.createElement('button');button.id='btn-skill-trees';button.className='btn cf-skill-tree-button';button.textContent='VIEW HERO SKILLS';button.onclick=function(){openTree(0);};section.appendChild(button);
    offer.forEach(function(e,i){var h=heroFor(e);if(!tutorialFor(h))return;
      var card=root.querySelector('#cf-hero-'+i);if(card)card.classList.add('skill-level-highlight');
      var guide=document.createElement('div');guide.className='skill-tutorial';guide.setAttribute('role','status');
      guide.innerHTML='<p>'+esc(e.name)+' leveled up. '+esc(gainsText(h))+'</p><button class="btn skill-guide-open">Choose first skill</button><button class="btn skill-guide-dismiss">Dismiss guide</button>';
      guide.querySelector('.skill-guide-open').onclick=function(){openTree(i);};guide.querySelector('.skill-guide-dismiss').onclick=function(){dismiss();DS.UI.render();};section.appendChild(guide);
    });
    if(DS.Meta.progressionNotice){var note=document.createElement('p');note.textContent=DS.Meta.progressionNotice;section.appendChild(note);}
  };
  var style=document.createElement('style');style.textContent='.skill-tree-dialog.ds-dialog{width:min(1100px,94vw);max-width:94vw;max-height:90vh;overflow:auto;background:#201a19;color:#eee0c5;border:1px solid #c19b55;padding:24px}.skill-tree-dialog::backdrop{background:#000b}.skill-tree-panel p{margin:10px 0;line-height:1.4}.skill-tree-panel header{display:flex;justify-content:space-between;align-items:center}.skill-tree-panel select{max-width:100%;padding:8px;background:#302724;color:#fff}.skill-branches{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.skill-node{display:flex;flex-direction:column;gap:8px;text-align:left;width:100%;padding:14px;margin:10px 0;background:#352820;color:#f5e5c6;border:1px solid #b99a5b;white-space:normal}.skill-node:disabled{opacity:.65}.skill-node-unlocked{border-color:#94b981}.skill-node:focus-visible,.skill-tree-panel button:focus-visible,.skill-tree-panel select:focus-visible{outline:3px solid #f3cd72;outline-offset:3px}.skill-tutorial{padding:12px;border:1px solid #c19b55;margin:12px 0}.skill-level-highlight{outline:3px solid #eac16d!important}@media(max-width:650px){.skill-branches{grid-template-columns:1fr}.skill-tree-dialog{padding:14px}}';document.head.appendChild(style);
}());
