// Zero-LLM-token, bounded combat probes against the complete shipped script order.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {loadGame}=require('../tests/game-harness');
const {analyze}=require('./analyze-archive');
const VERSION='1';
function observe(DS) {
  const combat=DS.State.combat;
  const entity=e=>({id:e.id,name:e.name,hp:e.hp,maxHp:e.maxHp,pos:e.pos,block:e.block||0,
    poison:e.poison||0,weak:e.weak||0,vulnerable:e.vulnerable||0,strength:e.strength||0});
  return JSON.parse(JSON.stringify({energy:combat.energy,turn:combat.turn,heroes:DS.State.run.heroes.map(entity),
    enemies:combat.enemies.map(e=>({...entity(e),intent:e.currentIntent,targets:e.intentTargets})),
    hand:combat.hand.map((card,index)=>({index,id:card.id,baseId:card.baseId,heroIdx:card.heroIdx,
      name:card.name,type:card.type,target:card.target,value:card.value||0,cost:DS.Combat.cardCost(card),
      prefPos:card.prefPos||[],xCost:!!card.xCost,playable:DS.Combat.canPlayCard(card).playable,
      targets:['enemy','enemy_any','ally','ally_dead'].includes(card.target)?DS.Combat.validTargets(card).map(entity):[]})),
    drawCount:combat.drawPile.length,discardCount:combat.discardPile.length}));
}
function choose(view,personality,step) {
  const options=[];
  for(const card of view.hand.filter(c=>c.playable)) {
    const targets=card.targets.length?card.targets:[null];
    for(const target of targets) {
      let score=card.value;
      if(card.target==='all_enemies')score*=view.enemies.filter(e=>e.hp>0).length;
      if(card.type==='heal')score=target?Math.min(score,target.maxHp-target.hp):score;
      if(card.type==='block' || card.type==='defend')score*=personality==='gambler'?0.35:0.8;
      if(target&&view.enemies.some(e=>e.id===target.id)&&card.value>=target.hp+target.block)score+=8;
      if(card.xCost)score*=view.energy;
      score/=Math.max(0.6,card.cost);
      if(personality==='newcomer')score=100-card.index;
      if(personality==='breaker')score=((card.index+step*7+(target?target.pos:0))%11);
      options.push({type:'play',index:card.index,targetId:target&&target.id,score});
    }
  }
  options.sort((a,b)=>b.score-a.score);
  if(options.length)return {...options[0],reason:personality+' visible-state heuristic; no search of hidden piles or future randomness'};
  if(view.energy>=2 && personality!=='newcomer') {
    const locked=view.hand.find(c=>!c.playable&&c.cost<view.energy&&c.prefPos.length&&view.heroes[c.heroIdx]&&view.heroes[c.heroIdx].hp>0&&!c.prefPos.includes(view.heroes[c.heroIdx].pos));
    if(locked) {
      const pos=view.heroes[locked.heroIdx].pos,target=locked.prefPos.reduce((a,b)=>Math.abs(a-pos)<Math.abs(b-pos)?a:b);
      return {type:'move',heroIdx:locked.heroIdx,direction:target<pos?'forward':'back',reason:'Move toward a visible rank-locked card'};
    }
  }
  return {type:'end',reason:'No chosen affordable play; policy may miss combinations'};
}
async function episode(seed,personality,{write=true,outputDir=path.resolve(__dirname,'../private-run-data')}={}) {
  const game=loadGame({seed}),{DS}=game;
  DS.UI.render=()=>{};
  DS.VERSION='worktree-'+crypto.createHash('sha256').update(game.scripts.map(f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8')).join('\n')).digest('hex').slice(0,16);
  DS.PlayerIdentity.set({type:'scripted',policy:'combat-'+personality,policyVersion:VERSION});
  DS.Meta.newGame();DS.Campfire._buildOffer();[0,2,1,3].forEach(DS.Campfire.toggleSelect);DS.Campfire.embark();
  DS.Telemetry.record('probe.setup',{seed,scope:'Bounded combat probe, not a complete expedition',personality});
  const tiers=['normal','normal','elite'];let completed=0,outcome='turn-limit',steps=0;
  for(let battle=0;battle<tiers.length;battle++) {
    DS.State.run.floor=battle+1;
    DS.Combat.initCombat(DS.Enemies.pickEncounter(tiers[battle]));DS.State.screen='combat';
    let turns=0,turnActions=0;
    while(DS.State.combat&&!DS.State.combat.gameOver&&turns<30&&steps<240) {
      const view=observe(DS),action=turnActions>=20?{type:'end',reason:'Safety action limit'}:choose(view,personality,steps);
      DS.Telemetry.record('policy.decision',{policy:personality,policyVersion:VERSION,observation:view,action});
      if(action.type==='play')DS.Combat.playCard(action.index,DS.State.run.heroes.concat(DS.State.combat.enemies).find(e=>e.id===action.targetId)||null);
      else if(action.type==='move')DS.Combat.moveHeroAction(action.heroIdx,action.direction);
      else {await DS.Combat.endTurn();turns++;turnActions=0;}
      turnActions++;steps++;
    }
    if(DS.Combat.aliveHeroes().length===0){outcome='defeat';DS.State.endCombat(false);DS.Game.onCombatDefeat();break;}
    if(DS.Combat.aliveEnemies().length){outcome='turn-limit';break;}
    completed++;DS.State.endCombat(true);DS.Game.onCombatVictory();
    // Genuine reward definitions, owned by a living party member; explicit probe draft event.
    const pool=DS.Cards.getRewardPool(3,DS.State.run.heroes.filter(h=>h.hp>0).map(h=>h.cls));
    const chosen=pool.slice().sort((a,b)=>(b.value||0)-(a.value||0))[personality==='newcomer'?Math.min(1,pool.length-1):0];
    if(chosen) {
      const card=Object.assign({},chosen,{id:chosen.baseId+'_probe_'+battle,heroIdx:DS.State.run.heroes.findIndex(h=>h.cls===chosen.heroCls&&h.hp>0)});
      DS.State.run.deck.push(card);DS.Telemetry.record('probe.draft',{offered:pool.map(c=>c.baseId),chosen:card.baseId});
    }
    DS.Game.afterReward();outcome='completed-probe';
  }
  DS.Telemetry.record('probe.finished',{outcome,completedBattles:completed,steps});
  const archive=await DS.Telemetry.archiveAll();
  const report={seed,personality,policyVersion:VERSION,outcome,completedBattles:completed,steps,
    scope:'At most three combats with reward drafts; no full-run/victory/balance claim',analysis:analyze(archive)};
  if(write) {
    fs.mkdirSync(outputDir,{recursive:true});
    const filename='probe-'+Date.now()+'-'+seed+'-'+personality;
    fs.writeFileSync(path.join(outputDir,filename+'.json.gz'),zlib.gzipSync(JSON.stringify(archive)));
    fs.writeFileSync(path.join(outputDir,filename+'-summary.json'),JSON.stringify(report,null,2));
  }
  return report;
}
async function main() {
  const runs=Number(process.argv[2]||4),start=Number(process.argv[3]||100);
  if(!Number.isInteger(runs)||runs<1||runs>32)throw Error('Batch size must be 1–32, bounded by 240 decisions per probe.');
  for(let i=0;i<runs;i++) {
    const policy=['tactician','newcomer','gambler','breaker'][i%4];
    const r=await episode(start+Math.floor(i/4),policy);console.log(JSON.stringify({seed:r.seed,policy,outcome:r.outcome,battles:r.completedBattles,steps:r.steps}));
  }
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={observe,choose,episode};
