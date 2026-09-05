// No dependency DOM harness: checks presentation contracts against real modules.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const noop = () => {};
const element = () => ({innerHTML:'', classList:{add:noop,remove:noop},style:{setProperty:noop},
  appendChild:noop,addEventListener:noop,remove:noop,prepend:noop,setAttribute:noop,
  querySelector:()=>element(),querySelectorAll:()=>[]});
const memory = new Map();
const ctx = {console,URL,setTimeout:()=>0,clearTimeout:noop,requestAnimationFrame:()=>0,
  cancelAnimationFrame:noop,addEventListener:noop,
  document:{baseURI:'file:///C:/game/index.html',getElementById:()=>null,querySelector:()=>null,
    querySelectorAll:()=>[],createElement:element,body:element(),head:element(),addEventListener:noop},
  localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}};
ctx.window=ctx; vm.createContext(ctx);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const m of html.matchAll(/<script src="([^"]+)"/g)) vm.runInContext(fs.readFileSync(path.join(root,m[1]),'utf8'),ctx,{filename:m[1]});
const {DS}=ctx; DS.UI.render=noop; DS.Meta.newGame(); DS.Campfire._buildOffer();
[0,1,2,3].forEach(DS.Campfire.toggleSelect); DS.Campfire.embark();
for(let seed=0;seed<100;seed++) {
  const run=DS.State.run; run.map=DS.Map.generate(); run.currentNode=run.map.floors[0][0].id;
  DS.Map.completeNode(run.map,run.currentNode);
  const target=element(); DS.UI.renderMap(target);
  assert.equal((target.innerHTML.match(/data-node=/g)||[]).length,run.map.floors.flat().length);
  const buttons=[...target.innerHTML.matchAll(/<button[^>]+data-node="([^"]+)"[^>]*>/g)];
  const enabled=buttons.filter(m=>!m[0].includes(' disabled')).map(m=>m[1]);
  assert.deepEqual(enabled.sort(),Array.from(DS.Map.getAvailableNodes(run.map,run.currentNode)).sort());
  assert.ok(!target.innerHTML.includes('<canvas'),'map remains semantic HTML and SVG');
  assert.ok(!target.innerHTML.includes('NaN'),'valid route geometry');
}
for(const h of DS.Heroes) {
  const sprite=DS.UI.buildSprite({cls:h.cls,name:h.name},'right');
  assert.ok(sprite.innerHTML.includes('campfire-'+h.cls+'.png'));
}
for(const tier of ['normal','elite','boss']) for(const encounter of DS.Enemies[tier]) for(const enemy of encounter) {
  const sprite=DS.UI.buildSprite(enemy,'left');
  const asset=sprite.innerHTML.match(/src="([^"]+)"/)[1];
  assert.ok(fs.existsSync(path.join(root,asset)),enemy.name+' has a reviewed export');
}
DS.State.run.heroes[0].name='<Edric & Ash>';
assert.ok(DS.UI.buildPartyBar().includes('&lt;Edric &amp; Ash&gt;'),'names escaped');
DS.State.run.heroes[0].hp=0;
assert.ok(DS.UI.buildPartyBar().includes('Fallen'),'dead state visible');
const card={classList:{contains:c=>c==='fighter'},style:{setProperty:(name,value)=>{card.art=value;}},
  querySelector:()=>element(),onclick:null};
const hand={innerHTML:'',querySelectorAll:()=>[card],appendChild:noop};
DS.State.combat={hand:[],enemies:[],energy:3,maxEnergy:3};
ctx.document.getElementById=id=>id==='hand-cards'?hand:null;
DS.UI.renderHand();
assert.ok(card.art.includes('file:///C:/game/assets/exported/sprites/campfire-fighter.png'),'card URL resolves at document, not CSS folder');
for(const file of ['css/game-theme.css','js/visual-system.js']) {
  const source=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(!/assets\/source\//.test(source),'no source art in runtime');
  for(const m of source.matchAll(/(?:\.\.\/)?assets\/exported\/[\w/-]+\.png/g)) assert.ok(fs.existsSync(path.join(root,m[0].replace(/^\.\.\//,''))),m[0]);
}
console.log('PASS: 100 route maps, available nodes, shared hero/enemy exports, dead/escaped party labels, direct-file card URLs, asset boundary');
