/* HumanVsTrojan browser engine v1. Port of the web-reachable mechanics in
 * HVT_final.py and HostGameEngine (HVT_LAN.py), v3 LabelTune.
 * No Python/runtime dependencies. Visual topology for canonical seed 43 is
 * loaded from a pre-export of the original networkx spring_layout.
 * NOTE: random events use browser PRNG, not Python's Mersenne Twister.
 */
export class HVTGame {
  constructor(map, seed = 43, maxRounds = 20) {
    this.seed = seed; this.max_rounds = maxRounds;
    this.names = Array.from({length:20}, (_,i)=>`p${i+1}`);
    this.rngState=(seed>>>0)||1;
    if (map && seed===43) { this.edges=map.edges; this.positions=map.positions; this.importance=map.importance; }
    else this.makeMap();
    this.adj=Object.fromEntries(this.names.map(n=>[n,[]]));
    for(const [a,b] of this.edges){this.adj[a].push(b);this.adj[b].push(a);}
    this.paths=Object.fromEntries(this.names.map(n=>[n,this.dijkstra(n)]));
    if(!this.importance) this.computeImportance();
    this.nodes=Object.fromEntries(this.names.map(n=>[n,{real:'DD',base:'DD',aScan:'unknown',dScan:'unknown',cooldown:0}]));
    this.gs={attacker_human_energy:5,attacker_ai_energy:20,attacker_energy_mode:'ai',defender_budget_mode:'ai',budget:5,key:0,c2_silenced_rounds:0,c2_move_count:0,zombie_used:0,zombie_max:2,ai_tried_targets:[]};
    this.phase='setup';this.current_round=0;this.pending=null;this.specialMode='convert';this.extraDefense=0;this.winner=null;this.logsA=[];this.logsD=[];
    this.statusA='请选择初始感染点和初始状态，然后点击开始。';this.statusD='等待攻击方完成开局。';this.globalStatus=`地图已按 seed=${seed} 重置。`;
  }
  rand(){this.rngState=(Math.imul(this.rngState,1664525)+1013904223)>>>0;return this.rngState/4294967296;}
  makeMap(){
    const e=new Set(); const add=(a,b)=>{ if(a!==b)e.add([a,b].sort((x,y)=>Number(x.slice(1))-Number(y.slice(1))).join('|')); };
    for(let i=0;i<20;i++) for(let j=i+1;j<20;j++)if(this.rand()<.2)add(this.names[i],this.names[j]);
    for(const n of this.names)if(![...e].some(k=>k.split('|').includes(n))){const candidates=this.names.filter(v=>v!==n);add(n,candidates[Math.floor(this.rand()*candidates.length)]);}
    this.edges=[...e].map(k=>k.split('|'));
    const links=()=>{const a=Object.fromEntries(this.names.map(n=>[n,[]]));for(const [x,y] of this.edges){a[x].push(y);a[y].push(x);}return a;};
    let graph=links(), seen=new Set();for(const n of this.names){if(seen.has(n))continue;const c=[n];seen.add(n);for(let i=0;i<c.length;i++)for(const k of graph[c[i]])if(!seen.has(k)){seen.add(k);c.push(k);}if(c.length<20){const other=this.names.find(v=>!seen.has(v));if(other){add(c[0],other);graph=links();}}}
    this.edges=[...e].map(k=>k.split('|'));
    this.positions=Object.fromEntries(this.names.map((n,i)=>[n,[Math.cos(2*Math.PI*i/20)*.75,(this.rand()-.5)*1.5,Math.sin(2*Math.PI*i/20)*.75]]));
  }
  dijkstra(start){const distances={[start]:0},queue=[start];for(let k=0;k<queue.length;k++){const n=queue[k];for(const j of this.adj[n])if(distances[j]===undefined){distances[j]=distances[n]+1;queue.push(j);}}return distances;}
  distance(a,b){return this.paths[a]?.[b]??Infinity;}
  computeImportance(){this.importance={};for(const n of this.names){const deg=this.adj[n].length/19;let close=0;let sum=0;for(const o of this.names)if(o!==n)sum+=this.distance(n,o);close=sum?19/sum:0;this.importance[n]=.35*deg+.20*close+.10;}}
  n(id){return this.nodes[id];}
  infected(n){return ['lurk','active'].includes(this.n(n).real);}
  realBefore(){return Object.fromEntries(this.names.map(n=>[n,this.n(n).real]));}
  msg(ok,msg){return {ok,msg};}
  logA(s){this.logsA.push(s);this.logsA=this.logsA.slice(-200);}
  logD(s){this.logsD.push(s);this.logsD=this.logsD.slice(-200);}
  valid(n){return !!this.n(n);}
  eKey(){return this.gs.attacker_energy_mode==='human'?'attacker_human_energy':'attacker_ai_energy';}
  payEnergy(n){const k=this.eKey();if(this.gs[k]<n)return false;this.gs[k]-=n;return true;}
  payBudget(n){const amount=n*(this.gs.defender_budget_mode==='human'?3:1);if(this.gs.budget<amount)return false;this.gs.budget-=amount;return true;}
  c2(){return this.gs.attacker_energy_mode==='ai'||this.gs.c2_silenced_rounds<=0;}
  hardened(n){return ['D','HD'].includes(this.n(n).base);}
  honey(n){return ['H','HD'].includes(this.n(n).base);}
  aMode(m){this.gs.attacker_energy_mode=m;}
  dMode(m){this.gs.defender_budget_mode=m;}
  aAction(action,p){
    const target=p.target||p.source||'',source=p.source||'',n=this.n(target);
    if(action==='move_c2') {if(!this.payEnergy(15))return this.msg(false,'人类玩家 energy 不足，C2 迁移固定需要 15');this.gs.c2_silenced_rounds=0;this.gs.key=0;this.gs.c2_move_count++;return this.msg(true,'C2 已完成迁移，现有反制效果失效，防守方需重新积攒 key');}
    if(!n)return this.msg(false,'无效节点');
    if(action==='activate'){
      if(!this.c2())return this.msg(false,'C2 被静默，无法激活');if(n.real!=='lurk')return this.msg(false,'目标不是 lurk，无法激活');
      if(!this.payEnergy(6))return this.msg(false,'能量不足');n.real='active';return this.msg(true,`${target} 激活成功（消耗 6 能量）`);
    }
    if(action==='sleep'){
      if(!this.c2())return this.msg(false,'C2 被静默，无法休眠');if(n.real!=='active')return this.msg(false,'目标不是 active，无法休眠');
      if(!this.payEnergy(1))return this.msg(false,'能量不足');n.real='lurk';return this.msg(true,`${target} 已转回 lurk`);
    }
    if(action==='scan'){
      if(!this.c2())return this.msg(false,'C2 被静默，无法扫描');if(!this.valid(source)||!this.infected(source))return this.msg(false,'扫描源未感染');
      if(this.distance(source,target)>(Number(p.radius)||2))return this.msg(false,'超出扫描半径');
      if(!this.payEnergy(1))return this.msg(false,'能量不足');n.aScan={distance:this.distance(source,target),real_state:n.real,base_state:n.base,neighbors:[...this.adj[target]]};return this.msg(true,'扫描成功');
    }
    if(action==='zombie'||action==='precise'){
      if(this.pending)return this.msg(false,'已有特殊攻击等待结算，请在本次结算后再发动下一次特殊攻击');
      if(!this.c2())return this.msg(false,'C2 被静默，无法发动特殊攻击');
      if(n.base==='abandoned')return this.msg(false,'废置节点不能成为目标');
      if(action==='zombie'&&this.gs.zombie_used>=this.gs.zombie_max)return this.msg(false,'本局僵尸军团次数已耗尽');
      const infected=this.names.filter(x=>this.infected(x));if(action==='zombie'&&infected.length<Math.ceil(.2*this.names.length))return this.msg(false,`感染规模不足，当前 ${infected.length}/${Math.ceil(.2*this.names.length)}`);
      let participants=this.names.filter(x=>this.n(x).real==='active'&&this.n(x).cooldown===0);
      if(action==='precise'&&p.use_all_active===false)participants=[...new Set(String(p.participants||'').split(',').map(x=>x.trim()).filter(Boolean))];
      if(!participants.length)return this.msg(false,'没有可参与特殊攻击的 active 节点');
      if(participants.some(x=>!this.valid(x)||this.n(x).real!=='active'||this.n(x).cooldown>0))return this.msg(false,'参与节点不满足 active / 冷却条件');
      if(action==='precise'&&participants.includes(target))return this.msg(false,'目标不能同时作为参与者');
      if(!this.payEnergy(action==='zombie'?8:12))return this.msg(false,'能量不足');
      this.pending={type:action,target,participants,attack_strength:participants.length*(action==='precise'?1.8:1)+(action==='precise'&&n.real==='lurk'?.5:0),cooldown_rounds:1};
      this.specialMode=p.special_mode==='destroy'?'destroy':'convert';if(action==='zombie')this.gs.zombie_used++;
      return this.msg(true,`${action==='zombie'?'僵尸军团':'精准打击'}已发动，目标 ${target}，攻击强度 ${this.pending.attack_strength.toFixed(2)}`);
    }
    return this.msg(false,'未知攻击动作');
  }
  spread(source,target,far=false){
    if(!this.valid(source)||!this.valid(target))return this.msg(false,'无效节点');const n=this.n(target),d=this.distance(source,target);
    if(!this.infected(source)||source===target||this.infected(target)||n.base==='abandoned')return this.msg(false,'目标或来源不满足传播条件');
    if(far&&!this.c2())return this.msg(false,'C2 被静默，无法远程传播');
    if(far?(d>5||d<2):d!==1)return this.msg(false,'传播范围不符合规则');
    if(!this.payEnergy(far?d*2:1))return this.msg(false,'能量不足');
    const chance=(far?.60/d:.60)*(this.hardened(target)?.7:1);
    if(this.rand()<chance){n.real='lurk';if(this.honey(target))n.dScan='lurk';return this.msg(true,'传播成功');}return this.msg(false,'传播失败');
  }
  normalAttack(source,target){
    if(!this.valid(source)||!this.valid(target)||!this.infected(source)||this.distance(source,target)!==1||this.n(target).base==='abandoned'||this.n(target).real==='active')return this.msg(false,'普通攻击目标或来源不合法');
    if(!this.payEnergy(4))return this.msg(false,'能量不足');this.n(source).real='active';let chance=(this.hardened(target)?.15:.30)+(this.n(target).real==='lurk'?.10:0);
    if(this.rand()<chance){this.n(target).real='active';if(this.honey(target)){this.gs.key++;this.n(target).dScan='lurk';}return this.msg(true,'普通攻击成功');}return this.msg(false,'普通攻击失败');
  }
  dAction(action,p){
    const target=p.target||p.source||'', n=this.n(target);if(['harden','scan','clear','recapture','restore'].includes(action)&&!n)return this.msg(false,'请选择有效的目标节点。');
    if(action==='harden'){
      if(n.real==='active'||n.base==='abandoned'||this.hardened(target))return this.msg(false,'不能加固该节点');
      if(!this.payBudget(1))return this.msg(false,'预算不足');n.base=n.base==='H'?'HD':'D';return this.msg(true,`${target} 加固成功`);
    }
    if(action==='honeypot'){
      if(this.names.filter(x=>this.honey(x)).length>=3||n.real==='active'||n.base==='abandoned'||this.honey(target))return this.msg(false,'该节点不能部署蜜罐');
      if(!this.payBudget(1))return this.msg(false,'预算不足');n.base=n.base==='D'?'HD':'H';return this.msg(true,`${target} 蜜罐部署成功`);
    }
    if(action==='scan'){
      if(n.base==='abandoned')return this.msg(false,'发动失败：废置节点无法扫描，未消耗预算');if(!this.payBudget(1))return this.msg(false,'预算不足');n.dScan=n.real==='DD'?'DD':n.real;
      return this.msg(true,n.real==='lurk'?`${target} 扫描发现潜伏病毒`:`${target} 扫描完成`);
    }
    if(action==='clear'){
      if(n.dScan!=='lurk'||n.real!=='lurk')return this.msg(false,'发动失败：只能清除已确认且仍处于 lurk 的节点，未消耗预算');
      if(!this.payBudget(2))return this.msg(false,'预算不足');n.real='DD';n.dScan='DD';return this.msg(true,`${target} 的潜伏病毒已被清除`);
    }
    if(action==='recapture'){
      if(n.real!=='active')return this.msg(false,'发动失败：目标不是 active 占领节点（潜伏不可夺回），未消耗预算');
      if(!this.payBudget(2))return this.msg(false,'预算不足');if(this.rand()<.30){n.real='DD';n.base='DD';n.dScan='DD';return this.msg(true,`${target} 夺回成功`);}return this.msg(false,`${target} 夺回失败`);
    }
    if(action==='restore'){
      if(n.base!=='abandoned')return this.msg(false,'发动失败：目标不是 abandoned 废置节点，未消耗预算');
      if(!this.payBudget(4))return this.msg(false,'预算不足');n.real='DD';n.base='DD';n.dScan='DD';return this.msg(true,`${target} 恢复成功`);
    }
    if(action==='counter_c2'){
      if(this.gs.key<3)return this.msg(false,`C2 线索不足，当前仅有 ${this.gs.key}/3`);if(!this.payBudget(5))return this.msg(false,'预算不足');
      this.gs.key-=3;this.gs.c2_silenced_rounds+=2;return this.msg(true,'C2 已被静默 2 回合');
    }
    if(action==='clean'){
      if(!this.pending)return this.msg(false,'当前没有待响应的特殊攻击，无法进行流量清洗。');
      const invest=Number(p.clean_amount)||8,cost=invest*3;if(this.gs.budget<cost)return this.msg(false,`budget 不足，清洗 ${invest} 需要 ${cost} budget。`);
      this.gs.budget-=cost;const add=Math.max(0,invest-8)*.7;this.extraDefense+=add;return this.msg(true,`人类部署流量清洗成功，花费 ${cost} budget，额外防御 +${add.toFixed(2)}`);
    }
    return this.msg(false,'未知防守动作');
  }
  risk(n){let v=2.5*(this.importance[n]||0)+.45*this.adj[n].length;for(const j of this.adj[n]){if(this.infected(j))v+=1.6;if(['lurk','active'].includes(this.n(j).dScan))v+=1.2;}return v;}
  candidates(predicate,extra=()=>0){return this.names.filter(predicate).sort((a,b)=>((this.risk(b)+extra(b))-(this.risk(a)+extra(a)))||b.localeCompare(a));}
  attackerAI(){
    this.aMode('ai');let out=[],tried=new Set();const ratio=this.names.filter(n=>this.infected(n)).length/20;const high=ratio>=.70;
    for(let step=0;step<200;step++){
      const options=[];const sources=this.names.filter(n=>this.infected(n));if(!sources.length)break;
      for(const target of this.names){if(this.n(target).base==='abandoned'||tried.has(target))continue;
        for(const source of sources){const d=this.distance(source,target);
          if(this.n(target).real==='DD' && d>=1&&d<=5){const sc=(d===1?3.2:2.7)*(this.importance[target]||0)+(d===1?.55:.45)*this.adj[target].length-(d===1?.2:.45*d);options.push({kind:d===1?'near':'far',target,source,score:sc});}
          if(this.n(target).real!=='active'&&d===1){const sc=3.8*(this.importance[target]||0)+.55*this.adj[target].length+(this.n(target).real==='lurk'?1.6:0)+(this.honey(target)?.3:0);options.push({kind:'attack',target,source,score:sc});}
        }
      }
      const sort=(kind)=>options.filter(x=>kind==='spread'?x.kind!=='attack':x.kind==='attack').sort((a,b)=>b.score-a.score)[0];
      let pick;if(high)pick=sort('attack')||sort('spread');else pick=sort('spread')||(this.gs.attacker_ai_energy>=10?sort('attack'):null);
      if(!pick)break;const cost=pick.kind==='attack'?4:pick.kind==='near'?1:this.distance(pick.source,pick.target)*2;
      if(this.gs.attacker_ai_energy<cost)break;
      const res=pick.kind==='attack'?this.normalAttack(pick.source,pick.target):this.spread(pick.source,pick.target,pick.kind==='far');
      out.push(`AI${pick.kind==='attack'?'普通攻击':'传播'}: ${res.msg}`);tried.add(pick.target);this.gs.ai_tried_targets.push(pick.target);
      if(this.gs.attacker_ai_energy<=0||(!high&&this.gs.attacker_ai_energy<4&&step>=1))break;
    }
    return [`AI策略: 当前感染率 ${(ratio*100).toFixed(0)}%，${high?'攻击优先':'扩散优先'}`,...(out.length?out:['AI提示: 本回合 AI 未找到可执行动作'])];
  }
  defenderAI(){
    this.dMode('ai');let extra=0,logs=[],scanned=new Set(),failedClear=new Set();for(let step=0;step<200;step++){
      const budget=this.gs.budget;if(budget<=0)break;
      if(this.pending&&budget-3>=8&&extra===0){const invest=Math.min(12,Math.max(8,budget-3));this.gs.budget-=invest;extra+=Math.max(0,invest-8)*.7;logs.push(`AI流量清洗: 投入 ${invest} budget，额外防御 +${extra.toFixed(2)}`);continue;}
      const clear=this.names.filter(n=>!failedClear.has(n)&&this.n(n).dScan==='lurk'&&this.n(n).real==='lurk').sort((a,b)=>(this.importance[b]-this.importance[a]));
      if(clear.length&&budget-3>=3){const r=this.dAction('clear',{target:clear[0]});logs.push(`AI清除潜伏: ${r.msg}`);if(!r.ok)failedClear.add(clear[0]);continue;}
      const active=this.names.filter(n=>this.n(n).real==='active').sort((a,b)=>(this.importance[b]-this.importance[a]));
      if(active.length&&budget-3>=7){const r=this.dAction('recapture',{target:active[0]});logs.push(`AI夺回节点: ${r.msg}`);continue;}
      const scans=this.candidates(n=>!scanned.has(n)&&this.n(n).base!=='abandoned'&&!['lurk','active'].includes(this.n(n).dScan),n=>this.n(n).dScan==='unknown'?1:0);
      if(scans.length&&budget-3>=1){const n=scans[0];scanned.add(n);logs.push(`AI扫描: ${this.dAction('scan',{target:n}).msg}`);continue;}
      const hardens=this.candidates(n=>!['D','HD','abandoned'].includes(this.n(n).base)&&this.n(n).real!=='active');
      if(hardens.length&&budget-3>=1){logs.push(`AI加固: ${this.dAction('harden',{target:hardens[0]}).msg}`);continue;}
      break;
    }
    return {extra,logs};
  }
  process(role,command,p={}){
    let res;if(command==='start_round')res=role==='attacker'?this.startRound(p.init_node,p.init_state):this.msg(false,'角色无权执行');
    else if(command==='end_attacker')res=role==='attacker'?this.endAttacker():this.msg(false,'角色无权执行');
    else if(command==='honeypot_prompt')res=role==='defender'?this.honeypot(!!p.allow):this.msg(false,'角色无权执行');
    else if(command==='finish_round')res=role==='defender'?this.finishRound():this.msg(false,'角色无权执行');
    else if(command==='action'){
      if(role==='attacker'&&this.phase==='attacker_human'){this.aMode('human');res=this.aAction(p.action,p);this.logA(res.msg);this.statusA=res.msg;}
      else if(role==='defender'&&this.phase==='defender_human'){this.dMode('human');res=this.dAction(p.action,p);this.dMode('ai');this.logD(res.msg);this.statusD=res.msg;}
      else res=this.msg(false,'当前不是所属阵营的人类操作阶段');
    }else res=this.msg(false,'未知命令');
    return res;
  }
  startRound(initial='p1',state='active'){
    if(!this.valid(initial))return this.msg(false,'请选择有效的初始感染节点');
    if(this.phase==='setup'){
      if(!['active','lurk'].includes(state))return this.msg(false,'非法初始感染状态');this.n(initial).real=state;this.logA(`${initial} 已被设为初始感染点，状态=${state}`);this.phase='round_ready';
    }
    if(this.phase!=='round_ready')return this.msg(false,'当前阶段不能开始下一回合');
    if(!this.names.some(n=>this.infected(n)))return this.msg(false,'请先设置初始感染点。');
    if(this.current_round>=this.max_rounds){this.winner='defender';this.phase='game_over';return this.msg(false,'达到最大回合数');}
    this.current_round++;this.pending=null;this.specialMode='convert';this.extraDefense=0;
    const count=this.names.filter(n=>this.infected(n)).length, hg=2+Math.floor(count*.3),ag=2+Math.ceil(count*.7);
    this.gs.attacker_human_energy+=hg;this.gs.attacker_ai_energy+=ag;
    this.logA(`R${this.current_round} 回能: 人类 +${hg}，AI +${ag}`);this.logD(`R${this.current_round} 进攻方回能完成`);
    this.gs.budget+=2+this.names.filter(n=>this.n(n).real!=='active'&&this.n(n).base!=='abandoned').length*2;
    for(const line of this.attackerAI())this.logA(line);
    this.phase='attacker_human';this.statusA='攻击方人工阶段：激活 / 休眠 / 扫描 / 僵尸军团 / 精准狙击 / C2迁移。';this.statusD='等待攻击方结束进攻阶段。';this.globalStatus=`第 ${this.current_round} 回合已开始。`;
    return this.msg(true,this.globalStatus);
  }
  endAttacker(){if(this.phase!=='attacker_human')return this.msg(false,'当前不是攻击方阶段');this.phase='defender_prompt';this.statusA='攻击方阶段结束，等待防守方确认蜜罐。';this.statusD='请先确认是否允许 AI 预测并预部署一个蜜罐。';return this.msg(true,'等待防守方确认蜜罐预部署。');}
  honeypot(allow){if(this.phase!=='defender_prompt')return this.msg(false,'当前不是防守方蜜罐确认阶段');
    let msg='人类选择：本回合不进行 AI 预测蜜罐预部署。';if(allow){const c=this.candidates(n=>!['H','HD','abandoned'].includes(this.n(n).base)&&this.n(n).real!=='active');
      if(c.length){this.dMode('human');const r=this.dAction('honeypot',{target:c[0]});this.dMode('ai');msg=`AI 预测蜜罐预部署 -> ${c[0]}: ${r.msg}`;}else msg='当前没有适合部署蜜罐的节点，已跳过。';}
    this.logD(msg);this.phase='defender_human';this.statusA='已进入防守方人工阶段，等待防守方行动。';this.statusD='防守方人工阶段：可手动动作，完成后结束回合。';return this.msg(true,msg);
  }
  finishRound(){if(this.phase!=='defender_human')return this.msg(false,'当前还不能结束回合。');
    const ai=this.defenderAI();this.extraDefense+=ai.extra;for(const line of ai.logs)this.logD(line);
    if(this.pending){const p=this.pending,n=this.n(p.target);let defense=(this.hardened(p.target)?1.5:1)-(n.real==='lurk'?.3:0)+this.extraDefense;
      const success=p.attack_strength>Math.max(.1,defense);let msg;
      if(success){if(this.specialMode==='destroy'){n.real='DD';n.base='abandoned';n.aScan='unknown';n.dScan='unknown';msg=`${p.type} 攻击成功，${p.target} 被摧毁为 abandoned`;}
        else{n.real='active';if(this.honey(p.target))this.gs.key++;msg=`${p.type} 攻击成功，${p.target} 转为 active`;}}else msg=`${p.type} 攻击失败`;
      for(const who of p.participants)if(this.valid(who))this.n(who).cooldown=Math.max(this.n(who).cooldown,p.cooldown_rounds);
      this.logA('特殊攻击结算: '+msg);this.logD('特殊攻击结算: '+msg);
      this.pending=null;this.specialMode='convert';
    }
    if(this.gs.c2_silenced_rounds>0)this.gs.c2_silenced_rounds--;
    for(const n of this.names)if(this.n(n).cooldown>0)this.n(n).cooldown--;
    const active=this.names.filter(n=>this.n(n).real==='active').length,inf=this.names.filter(n=>this.infected(n)).length;
    let msg='游戏继续';if(active>=Math.ceil(20/3)){this.winner='attacker';msg=`病毒方胜利：active 节点数达到 ${active}/20`;}else if(inf===0){this.winner='defender';msg='防守方胜利：所有病毒节点已被清除';}else if(this.current_round>=this.max_rounds){this.winner='defender';msg=`防守方时间胜利：达到最大回合数 ${this.max_rounds}`;}
    this.logA(msg);this.logD(msg);this.statusA=msg;this.statusD=msg;this.phase=this.winner?'game_over':'round_ready';this.globalStatus=this.winner?`游戏结束，胜者：${this.winner}`:'本回合已结束，可开始下一回合。';return this.msg(true,this.globalStatus);
  }
  display(n){const s=this.n(n);if(s.base==='abandoned')return 'abandoned';if(s.real==='active')return 'active';if(s.real==='lurk'&&s.dScan==='lurk')return s.base==='DD'?'lurk':s.base==='H'?'Hlurk':'HlurkD';return s.base;}
  snapshotFor(role){
    const r=this.gs;
    const resources=role==='attacker'
      ? {attacker_human_energy:r.attacker_human_energy,attacker_ai_energy:r.attacker_ai_energy,zombie_used:r.zombie_used,zombie_max:r.zombie_max,c2_silenced_rounds:r.c2_silenced_rounds}
      : {budget:r.budget,key:r.key,c2_silenced_rounds:r.c2_silenced_rounds,zombie_max:r.zombie_max};
    return {role,phase:this.phase,current_round:this.current_round,max_rounds:this.max_rounds,winner:this.winner,seed:this.seed,logic_path:'JavaScript browser engine',global_status:this.globalStatus,status:role==='attacker'?this.statusA:this.statusD,
      resources,
      turn_hint:role==='attacker'?'人类：激活 / 休眠 / 扫描 / 僵尸军团 / 精准狙击 / C2迁移':'人类：加固 / 扫描 / 清除 / 夺回 / 恢复 / 流量清洗 / 反击 C2',
      nodes:this.names.map(n=>{const s=this.n(n);return role==='attacker'?{node:n,state:s.base==='abandoned'?'abandoned':this.infected(n)?s.real:'DD',scan:typeof s.aScan==='object'?`dist=${s.aScan.distance} base=${s.aScan.base_state}`:s.aScan,remark:this.infected(n)?`真实=${s.real}`:s.base}:{node:n,base:s.base,state:this.display(n),scan:s.dScan};}),
      node_names:this.names,positions:this.positions,edges:this.edges,pending_special_attack:role==='defender'&&this.pending?{type:this.pending.type,target:this.pending.target}:null,awaiting_defender_prompt:role==='defender'&&this.phase==='defender_prompt',logs:role==='attacker'?this.logsA:this.logsD};
  }
  effects(before,after,role,command,params,result){
    if(!result.ok)return [];const fx=[];const target=params.target||params.init_node||'';
    if(command==='action'&&params.action&&params.role===role&&['scan','zombie','precise','activate','sleep','harden','clear','recapture','restore','clean'].includes(params.action))fx.push({type:role==='attacker'?'attack':'defend',path:target?[target]:[],label:params.action});
    for(const item of after.nodes){const old=before.nodes.find(n=>n.node===item.node);if(!old||old.state===item.state)continue;
      if(item.state==='active'||(role==='attacker'&&item.state==='lurk')||['lurk','Hlurk','HlurkD'].includes(item.state)&&!['lurk','Hlurk','HlurkD'].includes(old.state))fx.push({type:'infect',path:[item.node]});
      else if(['active','lurk','Hlurk','HlurkD'].includes(old.state))fx.push({type:'defend',path:[item.node],label:'cleared'});
    }return fx.slice(0,24);
  }
}
