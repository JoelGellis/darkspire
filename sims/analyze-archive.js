// Analyze an exported local game archive; no network requests or hidden-state decisions.
const fs = require('node:fs');
function analyze(archive) {
  const runs = new Map();
  for (const event of archive.events || []) {
    if (!runs.has(event.runId)) runs.set(event.runId,{runId:event.runId,events:0,cards:{},damageDealt:0,
      damageTaken:0,blockConsumed:0,energySpent:0,turns:0,buildChanges:[],outcomes:[],limitations:[]});
    const r = runs.get(event.runId); r.events++;
    const before = event.detail && event.detail.before;
    const after = event.state;
    if (event.type === 'run.start') {
      r.version=event.detail.version; r.seed=event.detail.seed;
      r.initialParty=(after.run.heroes||[]).map(h=>({id:h.id,cls:h.cls,hp:h.hp,gear:h.gear}));
    }
    if (event.type==='combat.dealDamage' && before && after && after.run) {
      const target=event.detail.args[0];
      const heroes=before.run.heroes||[];
      const friendly=heroes.some(h=>h.id===target.id);
      const previous=(friendly?heroes:before.combat.enemies).find(h=>h.id===target.id);
      const current=(friendly?after.run.heroes:after.combat.enemies).find(h=>h.id===target.id);
      if (previous && current) {
        const lost=Math.max(0,previous.hp-current.hp);
        if(friendly) {r.damageTaken+=lost;r.blockConsumed+=Math.max(0,(previous.block||0)-(current.block||0));}
        else r.damageDealt+=lost;
      }
    }
    if (event.type==='combat.playCard' && before && before.combat && after.combat) {
      const index=event.detail.args[0],card=before.combat.hand[index];
      if(card && !after.combat.hand.some(c=>c.id===card.id)) {
        r.cards[card.baseId||card.id]=(r.cards[card.baseId||card.id]||0)+1;
        r.energySpent+=Math.max(0,before.combat.energy-after.combat.energy);
      }
    }
    if(event.type==='combat.endTurn') r.turns++;
    if(event.type==='run.settlement')r.outcomes.push(event.detail.args[0]);
    if(after && after.run) {
      const signature=JSON.stringify({deck:(after.run.deck||[]).map(c=>({id:c.id,baseId:c.baseId,upgraded:c.upgraded})),
        heroes:after.run.heroes.map(h=>({id:h.id,gear:h.gear})),artifacts:after.run.artifacts});
      if(r._build && signature!==r._build)r.buildChanges.push({seq:event.seq,type:event.type,floor:after.run.floor,
        deckSize:after.run.deck.length,partyHp:after.run.heroes.reduce((s,h)=>s+Math.max(0,h.hp),0),build:JSON.parse(signature)});
      r._build=signature;
    }
  }
  return [...runs.values()].map(r=>{
    delete r._build;
    r.observedDamagePerNetEnergy=r.energySpent?r.damageDealt/r.energySpent:null;
    r.observedDamagePerEndedTurn=r.turns?r.damageDealt/r.turns:null;
    r.limitations.push('Damage includes status, relic and other sources; per-energy ratio is observational, not causal card efficiency.',
      'Block consumed measures absorbed hits, not all prevented damage or hypothetical avoidable deaths.',
      'Build changes identify investigation points; winning and high damage do not prove fun or balance.');
    return r;
  });
}
if(require.main===module) {
  if(!process.argv[2])throw new Error('Usage: node sims/analyze-archive.js path/to/export.json [output.json]');
  const result=JSON.stringify(analyze(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))),null,2);
  if(process.argv[3])fs.writeFileSync(process.argv[3],result);else process.stdout.write(result+'\n');
}
module.exports={analyze};
