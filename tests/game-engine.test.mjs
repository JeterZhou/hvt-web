import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HVTGame} from '../js/game-engine.js';
const canonical=JSON.parse(readFileSync(new URL('../js/seed43-map.json',import.meta.url)));
const make=()=>new HVTGame(canonical,43,20);

test('canonical network and phase protocol match Python snapshots',()=>{
 const g=make(),s=g.snapshotFor('attacker');
 assert.equal(s.nodes.length,20);assert.equal(s.edges.length,40);
 assert.equal(s.phase,'setup');assert.equal(s.resources.attacker_human_energy,5);
 assert.equal(s.resources.attacker_ai_energy,20);assert.equal(g.snapshotFor('defender').resources.budget,5);
 let a=g.process('attacker','start_round',{init_node:'p1',init_state:'active'});
 assert.equal(a.ok,true);assert.equal(g.phase,'attacker_human');assert.equal(g.current_round,1);
 assert.equal(g.process('defender','end_attacker').ok,false);
 assert.equal(g.process('attacker','end_attacker').ok,true);
 assert.equal(g.phase,'defender_prompt');assert.equal(g.process('defender','honeypot_prompt',{allow:false}).ok,true);
 assert.equal(g.phase,'defender_human');assert.equal(g.process('defender','finish_round').ok,true);
 assert.ok(['round_ready','game_over'].includes(g.phase));
});

test('defender manual balance retains x3 budget multiplier',()=>{
 const g=make();g.gs.budget=100;g.dMode('human');
 g.n('p1').real='lurk';g.n('p1').dScan='lurk';
 assert.equal(g.dAction('clear',{target:'p1'}).ok,true);
 assert.equal(g.gs.budget,94);assert.equal(g.n('p1').real,'DD');
 g.n('p2').real='active';g.n('p2').base='H';g.rand=()=>0;
 assert.equal(g.dAction('recapture',{target:'p2'}).ok,true);
 assert.equal(g.gs.budget,88);assert.equal(g.n('p2').base,'DD');
 g.n('p3').base='abandoned';assert.equal(g.dAction('restore',{target:'p3'}).ok,true);
 assert.equal(g.gs.budget,76);assert.equal(g.n('p3').base,'DD');
 g.gs.key=3;assert.equal(g.dAction('counter_c2',{}).ok,true);
 assert.equal(g.gs.budget,61);assert.equal(g.gs.c2_silenced_rounds,2);
});

test('invalid defender actions have zero cost',()=>{
 const g=make();g.gs.budget=60;g.dMode('human');
 g.n('p1').real='lurk';g.n('p2').base='abandoned';
 for(const a of [['recapture','p1'],['clear','p1'],['scan','p2'],['harden','p2'],['restore','p1']]){
   assert.equal(g.dAction(a[0],{target:a[1]}).ok,false,a[0]);assert.equal(g.gs.budget,60);
 }
});

test('attacker activation costs 6, sleep costs 1; only hidden defender view',()=>{
 const g=make();g.aMode('human');g.n('p4').real='lurk';
 let a=g.snapshotFor('attacker').nodes.find(x=>x.node==='p4');
 let d=g.snapshotFor('defender').nodes.find(x=>x.node==='p4');
 assert.equal(a.state,'lurk');assert.equal(d.state,'DD');
 assert.equal(g.aAction('activate',{target:'p4'}).ok,false); // only 5 energy
 g.gs.attacker_human_energy=7;
 assert.equal(g.aAction('activate',{target:'p4'}).ok,true);
 assert.equal(g.gs.attacker_human_energy,1);
 assert.equal(g.aAction('sleep',{target:'p4'}).ok,true);
 assert.equal(g.gs.attacker_human_energy,0);
});

test('host state survives JSON export/import',()=>{
 const g=make();g.startRound('p1','active');
 const h=make();Object.assign(h,JSON.parse(JSON.stringify(g)));
 assert.deepEqual(h.snapshotFor('attacker'),g.snapshotFor('attacker'));
 assert.deepEqual(h.snapshotFor('defender'),g.snapshotFor('defender'));
});

test('public defender snapshot excludes internal attacker scan, RNG, and hidden lurk',()=>{
 const g=make();g.n('p1').real='lurk';g.n('p2').real='lurk';g.n('p2').base='D';
 const s=g.snapshotFor('defender');
 assert.equal(s.nodes.find(n=>n.node==='p1').state,'DD');
 assert.equal(s.nodes.find(n=>n.node==='p2').state,'D');
 assert.equal(JSON.stringify(s).includes('rngState'),false);
 assert.equal(JSON.stringify(s).includes('aScan'),false);
});

test('a pending special attack cannot be overwritten or charged twice',()=>{
 const g=make();g.phase='attacker_human';g.gs.attacker_human_energy=100;
 for(const n of ['p1','p2','p3','p4'])g.n(n).real='active';
 const first=g.aAction('zombie',{target:'p5'});
 assert.equal(first.ok,true);
 const pending=JSON.stringify(g.pending),energy=g.gs.attacker_human_energy;
 const second=g.aAction('precise',{target:'p6',use_all_active:false,participants:'p1,p2'});
 assert.equal(second.ok,false);
 assert.equal(g.gs.attacker_human_energy,energy);
 assert.equal(JSON.stringify(g.pending),pending);
});

test('precision strike deduplicates repeated participant IDs',()=>{
 const g=make();g.gs.attacker_human_energy=100;
 g.n('p1').real='active';g.n('p2').real='active';
 const result=g.aAction('precise',{target:'p3',use_all_active:false,participants:'p1,p1,p2,p2,p1'});
 assert.equal(result.ok,true);
 assert.deepEqual(g.pending.participants,['p1','p2']);
 assert.equal(g.pending.attack_strength,3.6);
});

test('defender AI ignores stale lurk scans instead of looping',()=>{
 const g=make();g.gs.budget=20;g.n('p1').real='active';g.n('p1').dScan='lurk';
 const result=g.defenderAI();
 assert.ok(result.logs.length<50,`unexpectedly many AI actions: ${result.logs.length}`);
 assert.ok(result.logs.some(line=>line.startsWith('AI夺回节点')||line.startsWith('AI扫描')||line.startsWith('AI加固')));
 assert.equal(result.logs.some(line=>line.startsWith('AI清除潜伏')),false);
});

test('role snapshots do not reveal opponent-only resources or attack strength',()=>{
 const g=make();g.pending={type:'precise',target:'p3',participants:['p1','p2'],attack_strength:9.6,cooldown_rounds:1};
 const attacker=g.snapshotFor('attacker'),defender=g.snapshotFor('defender');
 assert.equal('budget' in attacker.resources,false);
 assert.equal('key' in attacker.resources,false);
 assert.equal('attacker_human_energy' in defender.resources,false);
 assert.equal('attacker_ai_energy' in defender.resources,false);
 assert.equal('attack_strength' in defender.pending_special_attack,false);
 assert.equal(defender.pending_special_attack.target,'p3');
});

test('special attack state is cleared immediately after round settlement',()=>{
 const g=make();g.phase='defender_human';g.current_round=1;g.gs.budget=0;
 g.n('p1').real='active';g.n('p2').real='lurk';
 g.pending={type:'precise',target:'p2',participants:['p1'],attack_strength:9,cooldown_rounds:1};
 const result=g.finishRound();
 assert.equal(result.ok,true);
 assert.equal(g.pending,null);
 assert.equal(g.snapshotFor('defender').pending_special_attack,null);
});

test('random fallback maps have no self-edges and remain connected',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=new HVTGame(null,seed,20);
  assert.ok(g.edges.every(([a,b])=>a!==b),`self-edge found for seed ${seed}`);
  const seen=new Set(['p1']),queue=['p1'];
  for(let i=0;i<queue.length;i++)for(const next of g.adj[queue[i]])if(!seen.has(next)){seen.add(next);queue.push(next);}
  assert.equal(seen.size,20,`disconnected graph for seed ${seed}`);
 }
});
