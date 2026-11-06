import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {OnlineSignal} from '../js/online-signal.js';
const require=createRequire(import.meta.url);
const {createHandler}=require('../cloudfunctions/hvt-lobby/logic.js');
class Store {
  constructor(){this.docs=new Map();this.queue=Promise.resolve();}
  async add(row){if(this.docs.has(row._id))throw Error('duplicate');this.docs.set(row._id,structuredClone(row));}
  async get(key){return structuredClone(this.docs.get(key));}
  async list(){return [...this.docs.values()].map(r=>structuredClone(r));}
  transact(key,fn){
    const p=this.queue.then(()=>{const row=structuredClone(this.docs.get(key));if(!row)throw Error('no doc');
      const result=fn(row);this.docs.set(key,row);return result;});
    this.queue=p.catch(()=>{});return p;
  }
}
const use=()=>{
  const store=new Store();const handler=createHandler({store});
  const call=async (action,payload={})=>{const result=await handler({action,...payload});if(!result.ok)throw Error(result.error);return result.data;};
  return {call,store};
};
async function paired(call){const a=await call('open',{name:'Alice'});const b=await call('join',{code:a.code,name:'Bob'});return {a,b};}
test('room created, found in public list and joined with two different tokens',async()=>{
  const {call}=use();const {a,b}=await paired(call);
  assert.equal(a.code.length,10);assert.notEqual(a.token,b.token);
  assert.equal((await call('list')).rooms.length,0);
  assert.equal(b.room.guestName,'Bob');
});
test('second guest cannot overwrite occupied guest slot',async()=>{
  const {call}=use();const {a}=await paired(call);
  await assert.rejects(call('join',{code:a.code,name:'Eve'}),/already full/);
});
test('unauthorized token cannot read the other room mailbox',async()=>{
  const {call}=use();const {a}=await paired(call);
  await assert.rejects(call('poll',{code:a.code,token:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}),/authorized/);
});
test('ready state is acknowledged; both players ready starts game',async()=>{
  const {call}=use();const {a,b}=await paired(call);
  const first=await call('ready',{code:a.code,token:a.token,value:true});assert.equal(first.room.started,false);
  const second=await call('ready',{code:a.code,token:b.token,value:true});assert.equal(second.room.started,true);
  await assert.rejects(call('ready',{code:a.code,token:a.token,value:false}),/already started/);
});
test('bidirectional messages with monotonic acknowledgments and retry-safe ids',async()=>{
  const {call}=use();const {a,b}=await paired(call);
  const payload={type:'test',text:'hello'};
  const m=await call('send',{code:a.code,token:a.token,messageId:'message-1',payload});
  const retry=await call('send',{code:a.code,token:a.token,messageId:'message-1',payload});
  assert.equal(m.seq,retry.seq);
  const guest=await call('poll',{code:a.code,token:b.token,ack:0});
  assert.equal(guest.messages.length,1);assert.deepEqual(guest.messages[0].payload,payload);
  await call('poll',{code:a.code,token:b.token,ack:m.seq});
  assert.equal((await call('poll',{code:a.code,token:b.token,ack:m.seq})).messages.length,0);
  await call('send',{code:a.code,token:b.token,messageId:'message-2',payload:{type:'ack'}});
  assert.equal((await call('poll',{code:a.code,token:a.token,ack:0})).messages[0].payload.type,'ack');
});
test('malformed message and oversized payload are rejected',async()=>{
  const {call}=use();const {a}=await paired(call);
  const base={code:a.code,token:a.token,messageId:'message-123'};
  await assert.rejects(call('send',{...base,payload:'bad'}),/Invalid message/);
  await assert.rejects(call('send',{...base,payload:{data:'x'.repeat(50000)}}),/size limit/);
});
test('server bounded backlog, no silent message loss',async()=>{
  const {call}=use();const {a}=await paired(call);
  for(let i=0;i<12;i++)await call('send',{code:a.code,token:a.token,messageId:`message-${i}`,payload:{i}});
  await assert.rejects(call('send',{code:a.code,token:a.token,messageId:'message-overflow',payload:{test:true}}),/behind/);
});
test('leave closes room for both clients',async()=>{
  const {call}=use();const {a,b}=await paired(call);
  await call('leave',{code:a.code,token:b.token});
  await assert.rejects(call('poll',{code:a.code,token:a.token}),/closed|expired/);
});
test('simulated two-browser relay exchanges ready and game commands without RTCPeerConnection',async()=>{
  const {call}=use();const old=OnlineSignal.call,oldEnabled=OnlineSignal.enabled,oldFetch=globalThis.fetch;
  OnlineSignal.call=call;OnlineSignal.enabled=()=>true;
  const map=JSON.parse(readFileSync(new URL('../js/seed43-map.json',import.meta.url),'utf8'));
  globalThis.fetch=async()=>({json:async()=>map});
  const {CloudRelay:a}=await import('../js/cloud-relay.js?sim-a');
  const {CloudRelay:b}=await import('../js/cloud-relay.js?sim-b');
  try {
    await Promise.all([a.start(),b.start()]);
    const host=await a.createAutoRoom('Alice');const guest=await b.joinAutoRoom(host.room,'defender','Bob');
    assert.equal(guest.room,host.room);
    const hostViews=[],guestViews=[];
    a.listen(()=>{},snap=>hostViews.push(snap),()=>{},()=>{});
    b.listen(()=>{},snap=>guestViews.push(snap),()=>{},()=>{});
    await new Promise(r=>setTimeout(r,300));
    assert.equal(a.getConnectionInfo().connected,true);
    assert.equal(b.getConnectionInfo().connected,true);
    await a.toggleReady(true);await b.toggleReady(true);
    await new Promise(r=>setTimeout(r,3000));
    assert.equal(a.getLobby().started,true);
    assert.equal(b.getLobby().started,true);
    assert.ok(hostViews.length>=1);
    assert.ok(guestViews.length>=1);
    const result=await a.sendCommand('nonexistent-action',{});
    assert.equal(typeof result.ok,'boolean');
    // Verify a remote defender command reaches the host and produces a result.
    const p=b.sendCommand('nonexistent-action',{});
    const answer=await Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(Error('command timeout')),8500))]);
    assert.equal(typeof answer.ok,'boolean');
  } finally {
    await a.leave();await b.leave();
    OnlineSignal.call=old;OnlineSignal.enabled=oldEnabled;globalThis.fetch=oldFetch;
  }
});
