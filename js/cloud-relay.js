/* CloudBase relay transport. No WebRTC or TURN is required in this mode. */
import {HVTGame} from './game-engine.js';
import {OnlineSignal} from './online-signal.js';
const PERIOD=2500;
let map, room='', role='', host=false, nickname='Player', peerName='', auth=null;
let started=false, engine=null, connected=false, status='idle', callbacks=null;
let ready={attacker:false,defender:false}, pollTimer=null, generation=0, failureCount=0;
let ack=0, serial=0, sequence=Promise.resolve();
const pending=new Map(), completed=new Set();
const cleanName=v=>String(v||'Player').trim().slice(0,20)||'Player';
const call=(action,extra={})=>OnlineSignal.call(action,{...auth,action,...extra});
function currentLobby() {
  return {room,started,ready:!!(ready.attacker && ready.defender),players:{
    attacker:{nickname:host?nickname:peerName,ready:ready.attacker},
    defender:{nickname:host?peerName:nickname,ready:ready.defender}
  }};
}
function fireLobby(){callbacks?.onLobby?.(currentLobby());}
function fireConnection(value,state){
  if(connected!==value){connected=value;callbacks?.onOnline?.(connected);}
  if(status!==state){status=state;callbacks?.onConnectionStatus?.(status);}
}
function receiveRoom(r) {
  peerName=cleanName(host?r.guestName:r.hostName);
  if(!(host?r.guestName:r.hostName))peerName='';
  ready.attacker=!!r.readyHost;ready.defender=!!r.readyGuest;
  started=!!r.started;
  fireLobby();
  fireConnection(!!r.paired && !!r.peerAlive,r.paired?(r.peerAlive?'connected':'disconnected'):'waiting-answer');
  if(host && started && !engine){
    engine=new HVTGame(map,43,20);
    void publishView().catch(err=>console.warn('Initial relay snapshot:',err));
  }
}
async function transmit(payload) {
  if(!auth)throw Error('Room has been closed');
  return call('send',{payload,messageId:`${Date.now()}_${++serial}_${Math.random().toString(36).slice(2,10)}`});
}
async function publishView(before=null,command=null,params={},actor='',result={ok:true}) {
  if(!host||!engine)return;
  const pair={attacker:engine.snapshotFor('attacker'),defender:engine.snapshotFor('defender')};
  const effects=before?{
    attacker:engine.effects(before.attacker,pair.attacker,'attacker',command,{...params,role:actor},result),
    defender:engine.effects(before.defender,pair.defender,'defender',command,{...params,role:actor},result)
  }:{attacker:[],defender:[]};
  callbacks?.onView?.(pair.attacker,effects.attacker);
  await transmit({type:'view',snapshot:pair.defender,effects:effects.defender});
}
async function execute(actor,command,params={}) {
  if(!host||!engine||!started)return {ok:false,msg:'Game not started yet'};
  const before={attacker:engine.snapshotFor('attacker'),defender:engine.snapshotFor('defender')};
  const result=engine.process(actor,command,params);
  await publishView(before,command,params,actor,result);
  return result;
}
async function consume(payload) {
  if(!payload || typeof payload!=='object')return;
  if(host && payload.type==='command') {
    const id=String(payload.id||'');if(!id)return;
    if(completed.has(id))return;
    completed.add(id);if(completed.size>200)completed.clear();
    let result;
    if(!Number.isFinite(payload.time) || Date.now()-payload.time>60000 || payload.time>Date.now()+10000)
      result={ok:false,msg:'Command expired, please retry'};
    else {try {result=await execute('defender',payload.command,payload.params||{});}
      catch(e){result={ok:false,msg:String(e?.message||e)};}}
    await transmit({type:'result',id,result});
  }
  if(!host && payload.type==='view' && payload.snapshot) callbacks?.onView?.(payload.snapshot,Array.isArray(payload.effects)?payload.effects:[]);
  if(!host && payload.type==='result') {
    const p=pending.get(payload.id);if(p){pending.delete(payload.id);clearTimeout(p.timer);p.resolve(payload.result||{ok:false,msg:'Empty result'});}
  }
}
async function pollOnce(g) {
  const res=await call('poll',{ack});if(g!==generation)return;
  receiveRoom(res.room);
  for(const message of res.messages||[]) {
    if(g!==generation)return;
    if(message.seq<=ack)continue;
    await consume(message.payload);
    ack=message.seq;
  }
}
function schedule(g,delay=PERIOD) {
  clearTimeout(pollTimer);
  if(g!==generation||!auth)return;
  pollTimer=setTimeout(async()=>{
    if(g!==generation||!auth)return;
    try {await pollOnce(g);failureCount=0;}
    catch(error){
      if(g!==generation)return;
      failureCount++;
      console.warn('CloudBase relay polling error:',error);
      if(/expired|closed|not found|authorized/i.test(String(error?.message)))fireConnection(false,'failed');
      else if(failureCount>=2)fireConnection(false,'disconnected');
    }
    schedule(g);
  },delay);
}
function reset() {
  generation++;clearTimeout(pollTimer);pollTimer=null;
  for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Room closed'));}
  pending.clear();completed.clear();auth=null;engine=null;room='';role='';nickname='Player';peerName='';
  ready={attacker:false,defender:false};started=false;host=false;connected=false;status='idle';
  ack=0;failureCount=0;callbacks=null;sequence=Promise.resolve();
}
async function start(){map=await(await fetch(new URL('./seed43-map.json',import.meta.url))).json();return true;}
async function createAutoRoom(name) {
  reset();host=true;role='attacker';nickname=cleanName(name);
  try{const r=await OnlineSignal.call('open',{name:nickname});room=r.code;auth={code:r.code,token:r.token};receiveRoom(r.room);schedule(generation,100);return currentLobby();}
  catch(error){reset();throw error;}
}
async function joinAutoRoom(code,side,name) {
  if(side!=='defender')throw Error('Joining player must be defender');
  reset();host=false;role='defender';nickname=cleanName(name);
  try{const r=await OnlineSignal.call('join',{code:String(code).trim().toUpperCase(),name:nickname});room=r.code;auth={code:r.code,token:r.token};receiveRoom(r.room);schedule(generation,100);return currentLobby();}
  catch(error){reset();throw error;}
}
function isAutoEnabled(){return OnlineSignal.enabled();}
async function listRooms(){if(!isAutoEnabled())return [];return (await OnlineSignal.call('list')).rooms||[];}
async function toggleReady(value){
  if(!connected)throw Error('Waiting for both players to connect via CloudBase');
  if(started)throw Error('Game already started');
  const r=await call('ready',{value:!!value});receiveRoom(r.room);return currentLobby();
}
function listen(onLobby,onView,onOnline,onConnectionStatus){
  callbacks={onLobby,onView,onOnline,onConnectionStatus};fireLobby();
  callbacks.onOnline?.(connected);callbacks.onConnectionStatus?.(status);
  if(host&&engine)void publishView().catch(console.warn);
  return()=>{if(callbacks?.onLobby===onLobby)callbacks=null;};
}
async function sendCommand(command,params={}){
  if(!started)throw Error('Both players must be ready');
  if(!connected)throw Error('CloudBase connection is temporarily unavailable');
  if(host)return execute('attacker',command,params);
  const id=`request_${Date.now()}_${++serial}`;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(Error('Host did not respond within 60 seconds'));},60000);
    pending.set(id,{resolve,reject,timer});
    transmit({type:'command',id,command,params,time:Date.now()}).catch(error=>{
      const p=pending.get(id);if(p){clearTimeout(p.timer);pending.delete(id);reject(error);}
    });
  });
}
async function leave(){const old=auth;reset();if(old)await OnlineSignal.call('leave',old).catch(() => {});}
function getLobby(){return currentLobby();}
function getSignalInfo(){return {room,role,offer:'',answer:''};}
function getConnectionInfo(){return {status,connected,mode:'auto',path:'cloudbase-relay',answerApplied:false};}
async function resume(){throw Error('Refresh requires rejoining the CloudBase test room');}
export const CloudRelay={start,isAutoEnabled,listRooms,createAutoRoom,joinAutoRoom,toggleReady,
  listen,sendCommand,leave,getLobby,getSignalInfo,getConnectionInfo,resume};
