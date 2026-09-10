// Shared armory controls: safe DOM text, persistent purchases, no combat swapping.
(function() {
  function el(tag, text, parent) { var node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (parent) parent.appendChild(node); return node; }
  function button(label, parent, action, disabled) { var b = el('button', label, parent); b.type = 'button'; b.className = 'cf-button'; b.disabled = !!disabled; b.onclick = action; return b; }
  function panel(root, title) {
    var launch=el('button',title);launch.type='button';launch.className='cf-button equipment-launch';
    var target=root.querySelector('.cf-actions')||root.querySelector('.screen')||root;target.appendChild(launch);
    var p=el('dialog');p.className='equipment-panel ds-dialog';p.setAttribute('aria-label',title);root.appendChild(p);
    var header=el('div',undefined,p);header.className='equipment-heading';el('h2',title,header);button('Close',header,function(){p.close();});
    launch.onclick=function(){if(title==='The expedition armorer'){var balance=p.querySelector('p');if(balance&&DS.State.run)balance.textContent=DS.State.run.gold+'g available. Purchased equipment is fitted now and returns with survivors.';}p.showModal();};
    if(DS.EquipmentView && DS.EquipmentView._reopen===title){DS.EquipmentView._reopen=null;p.showModal();}
    return p;
  }
  function row(parent, item) { var r = el('div', undefined, parent); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:12px 0;padding:10px;border-bottom:1px solid #493d32'; el('strong', item.name, r); el('span', item.desc || item.description || '', r); return r; }
  function choose(parent, entries, label) { var s = el('select', undefined, parent); s.setAttribute('aria-label', label); s.style.cssText = 'max-width:100%;padding:8px;background:#29221b;color:#ead8b4'; entries.forEach(function(e) { var o = el('option', e.label, s); o.value = e.value; }); return s; }
  DS.EquipmentView = {
    campfire: function(root) {
      if (!DS.Gear) return;
      var camp = DS.Campfire, p = panel(root, 'Arm the company');
      el('p', 'Carry at most two items per hero and two shared artifacts. Equipment survives with its wearer. Uncarried items stay safe in town.', p);
      var redraw = function() { p.close(); DS.EquipmentView._reopen='Arm the company'; DS.UI.renderCampfire(root); };
      if(camp._selected.length){var tabs=el('div',undefined,p);tabs.className='equipment-tabs';camp._selected.forEach(function(index){var e=camp._offer[index];var portrait=button(e.name,tabs,function(){DS.EquipmentView._hero=index;redraw();});portrait.className+=' equipment-portrait';var image=el('img');image.src='assets/exported/sprites/campfire-'+e.heroClass+'.png';image.alt='';portrait.prepend(image);});}
      var selectedHero=camp._selected.indexOf(DS.EquipmentView._hero)!==-1?DS.EquipmentView._hero:camp._selected[0];
      camp._selected.filter(function(index){return index===selectedHero;}).forEach(function(index) {
        var offer = camp._offer[index], rh = offer.source === 'roster' ? DS.Meta.heroRoster[offer.rosterIdx] : offer.recruit;
        var block = el('div', undefined, p);block.className='equipment-character';var figure=el('img',undefined,block);figure.className='equipment-full-portrait';figure.src='assets/exported/sprites/campfire-'+offer.heroClass+'.png';figure.alt=offer.name; el('h3', offer.name + ' — ' + camp._effectiveMaxHp(offer) + ' HP', block);
        var kit = (rh.kit || []).map(function(id) { var c = DS.Cards[offer.heroClass].find(function(d) { return d.id === id; }); return c ? c.name + ((rh.upgradedCards || []).indexOf(id) !== -1 ? '+' : '') + ' [ranks ' + (c.prefPos.length ? c.prefPos.join(',') : 'any') + ']' : id; });
        el('p', 'Starting actions: ' + kit.join(' · '), block);
        if (offer.source === 'recruit') { el('p', 'Join the roster to prepare equipment.', block); button('Recruit ' + offer.name, block, function() { offer.rosterIdx = DS.Meta.addHeroToRoster(offer.recruit); offer.source = 'roster'; redraw(); }); return; }
        if (rh.injury) button('Treat wound — ' + DS.Meta.INJURY_HEAL_COST + 'g', block, function() { if (DS.Meta.healInjury(offer.rosterIdx)) offer.injury = null; redraw(); }, DS.Meta.gold < DS.Meta.INJURY_HEAL_COST);
        DS.Gear.getEquipped(rh).forEach(function(item) { var r = row(block, item); button('Unequip', r, function() { DS.Gear.unequip(offer.rosterIdx, item.id); redraw(); }); });
        var candidates = DS.Meta.ownedGear.map(DS.Gear.getById).filter(function(item) { return item && item.slot !== 'artifact' && DS.Gear.classAllowed(item, offer.heroClass) && DS.Gear._equippedIds(rh).indexOf(item.id) === -1; });
        if (candidates.length) { var selector = choose(block, candidates.map(function(item) { var holder = DS.Gear.findRosterHolder(item.id); return {value:item.id,label:item.name + ' — ' + (item.desc || '') + (holder !== -1 ? ' (transfer)' : '')}; }), 'Equipment for ' + offer.name); button('Equip selected item', block, function() { var result = DS.Gear.equip(offer.rosterIdx, selector.value); if (!result.ok) el('p', 'Cannot equip: ' + result.reason.replace(/_/g, ' '), block); else redraw(); }, DS.Gear._equippedIds(rh).length >= DS.Gear.MAX_EQUIP_AT_START); }
      });
      el('h3', 'Shared artifacts (' + camp._artifacts.length + '/2)', p);
      DS.Gear.getOwnedArtifacts().forEach(function(item) { var r = row(p, item), at = camp._artifacts.indexOf(item.id); button(at === -1 ? 'Carry' : 'Leave in town', r, function() { if (at !== -1) camp._artifacts.splice(at, 1); else if (camp._artifacts.length < 2) camp._artifacts.push(item.id); redraw(); }, at === -1 && camp._artifacts.length >= 2); });
      if (!DS.Meta.ownedGear.length) el('p', 'Your armory is empty. The town merchant sells permanent equipment.', p);
    },
    shop: function(root) {
      var run = DS.State.run; if (!run || DS.State.screen !== 'shop') return;
      var p = panel(root, 'The expedition armorer');
      el('p', run.gold + 'g available. Purchased equipment is fitted now and returns with survivors.', p);
      run.gearShops = run.gearShops || {}; var key = run.currentNode || 'shop';
      if (!run.gearShops[key]) run.gearShops[key] = DS.Gear.getRunStock().map(function(i) { return i.id; });
      function redraw() { var gold=root.querySelector('.shop-gold');if(gold)gold.textContent=DS.State.run.gold+' Gold';DS.State.save(); p.close(); p.remove(); var launch=root.querySelector('.equipment-launch');if(launch)launch.remove();DS.EquipmentView._reopen='The expedition armorer';DS.EquipmentView.shop(root); }
      var shopTab=el('div',undefined,p);shopTab.className='equipment-tabs';button('Buy gear',shopTab,function(){DS.EquipmentView._shopPage='buy';redraw();});button('Fit & salvage',shopTab,function(){DS.EquipmentView._shopPage='carried';redraw();});
      if(DS.EquipmentView._shopPage!=='carried') run.gearShops[key].map(DS.Gear.getById).filter(function(i) { return i && (run.gearAcquired || []).indexOf(i.id) === -1 && !DS.Meta.ownsGear(i.id); }).forEach(function(item) {
        var r = row(p, item); el('span', item.price + 'g', r);
        var targets = run.heroes.map(function(h, i) { return {h:h,value:i,label:h.name}; }).filter(function(e) { return e.h.hp > 0 && DS.Gear.classAllowed(item, e.h.cls); });
        var select = item.slot !== 'artifact' ? choose(r, targets, 'Wearer for ' + item.name) : null;
        button('Buy and fit', r, function() { var result = DS.Gear.buyOnRun(item.id, select ? Number(select.value) : 0); if (result.ok) redraw(); else el('span', result.reason.replace(/_/g, ' '), r); }, run.gold < item.price || (select && !targets.length));
      });
      if(DS.EquipmentView._shopPage!=='carried')return;
      el('h3', 'Carried equipment', p);
      var ids = (run.artifacts || []).slice(); run.heroes.forEach(function(h) { if (h.hp > 0) ids = ids.concat(DS.Gear._equippedIds(h)); });
      var pages=Math.max(1,Math.ceil(ids.length/3)),page=Math.min(DS.EquipmentView._gearPage||0,pages-1);if(pages>1){button('Previous',p,function(){DS.EquipmentView._gearPage=(page+pages-1)%pages;redraw();});el('span',' '+(page+1)+' / '+pages+' ',p);button('Next',p,function(){DS.EquipmentView._gearPage=(page+1)%pages;redraw();});}
      ids.slice(page*3,page*3+3).forEach(function(id) { var item = DS.Gear.getById(id); if (!item) return; var r = row(p,item); button('Salvage — ' + DS.Gear.salvageValue(item) + 'g', r, function() { DS.Gear.salvage(id); redraw(); }); if (item.slot === 'artifact') return;
        var targets = run.heroes.map(function(h,i) { return {h:h,value:i,label:h.name}; }).filter(function(e) { return e.h.hp > 0 && DS.Gear.classAllowed(item,e.h.cls) && DS.Gear._equippedIds(e.h).indexOf(id) === -1; });
        if (targets.length) { var select = choose(r,targets,'Transfer ' + item.name); button('Transfer',r,function() { var result = DS.Gear.reassignOnRun(id,Number(select.value)); if(result.ok) redraw(); else el('span',result.reason.replace(/_/g,' '),r); }); }
      });
    }
  };
  var original = DS.UI.renderShop;
  DS.UI.renderShop = function(root) { original(root); DS.EquipmentView.shop(root); };
})();
