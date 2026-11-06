'use strict';
const crypto = require('node:crypto');
const HASH = value => crypto.createHash('sha256').update(value).digest('hex');
const token = () => crypto.randomBytes(24).toString('base64url');
const ROOM_LIFE = 20 * 60 * 1000;
const MAX_LIFE = 3 * 60 * 60 * 1000;
const MAX_PAYLOAD = 35000;
const MAX_PENDING_PER_SIDE = 12;
const nameOf = value => String(value || 'Player').trim().slice(0,20) || 'Player';
const ok = data => ({ok:true,data});
const codeOf = raw => {
  const code = String(raw || '').trim().toUpperCase();
  if (!/^[A-F0-9]{10}$/.test(code)) throw Error('Invalid room code');
  return code;
};
function active(room) {
  if (!room || room.status === 'closed' || Date.now() > room.expiresAt || Date.now() > room.createdAt + MAX_LIFE) {
    throw Error('Room not found, closed or expired');
  }
  return room;
}
function sideOf(room, supplied) {
  if (typeof supplied !== 'string' || supplied.length < 16) throw Error('Invalid room token');
  const digest = HASH(supplied);
  if (digest === room.hostTokenHash) return 'host';
  if (room.guestTokenHash && digest === room.guestTokenHash) return 'guest';
  throw Error('Not authorized for this room');
}
function publicState(room, side) {
  const peerTime = side === 'host' ? room.guestSeenAt : room.hostSeenAt;
  return {
    code:room._id, hostName:room.hostName, guestName:room.guestName,
    readyHost:room.readyHost, readyGuest:room.readyGuest,
    started:room.started, paired:room.status === 'full',
    peerAlive:room.status === 'full' && Date.now() - peerTime < 45000,
    status:room.status
  };
}
function createHandler({store}) {
  return async event => {
    try {
      const action = String(event?.action || '');
      if (action === 'list') {
        const rooms = await store.list();
        return ok({rooms:rooms.filter(r => r.status === 'open' && r.expiresAt > Date.now() &&
          Date.now()-r.hostSeenAt < 75000 && Date.now()-r.createdAt < MAX_LIFE)
          .slice(0,40).map(r => ({code:r._id,hostName:r.hostName,createdAt:r.createdAt}))});
      }
      if (action === 'open') {
        const hostName = nameOf(event.name);
        for (let attempt=0;attempt<6;attempt++) {
          const code = crypto.randomBytes(5).toString('hex').toUpperCase();
          const secret = token(), now=Date.now();
          const entry = {_id:code,status:'open',hostName,guestName:'',
            hostTokenHash:HASH(secret),guestTokenHash:'',
            readyHost:false,readyGuest:false,started:false,
            createdAt:now,expiresAt:now+ROOM_LIFE,
            hostSeenAt:now,guestSeenAt:0,seq:0,ackHost:0,ackGuest:0,messages:[]};
          try {await store.add(entry);return ok({code,token:secret,room:publicState(entry,'host')});}
          catch(e) {if(attempt===5) throw e;}
        }
      }
      const code=codeOf(event.code);
      if (action === 'join') {
        const guestName=nameOf(event.name), secret=token();
        const room=await store.transact(code,r => {
          active(r);
          if(r.status !== 'open') throw Error('Room is already full');
          if(Date.now()-r.hostSeenAt>75000) throw Error('Host is offline');
          r.guestName=guestName;r.guestTokenHash=HASH(secret);r.guestSeenAt=Date.now();
          r.status='full';r.expiresAt=Math.min(Date.now()+ROOM_LIFE,r.createdAt+MAX_LIFE);
          return publicState(r,'guest');
        });
        return ok({code,token:secret,room});
      }
      if (action === 'poll') {
        const data=await store.transact(code,r => {
          active(r);const side=sideOf(r,event.token);
          const now=Date.now();
          if(side==='host') r.hostSeenAt=now; else r.guestSeenAt=now;
          r.expiresAt=Math.min(now+ROOM_LIFE,r.createdAt+MAX_LIFE);
          const ackField=side==='host'?'ackHost':'ackGuest';
          const nextAck=Number(event.ack);
          if(Number.isSafeInteger(nextAck) && nextAck>=r[ackField] && nextAck<=r.seq) r[ackField]=nextAck;
          r.messages=r.messages.filter(m => m.seq > (m.to==='host'?r.ackHost:r.ackGuest));
          return {room:publicState(r,side),messages:r.messages.filter(m => m.to===side).map(m => ({seq:m.seq,payload:m.payload}))};
        });
        return ok(data);
      }
      if (action === 'ready') {
        const data=await store.transact(code,r => {
          active(r);const side=sideOf(r,event.token);
          if(r.status !== 'full') throw Error('Waiting for second player');
          if(r.started) throw Error('Game has already started');
          if(side==='host') r.readyHost=event.value===true; else r.readyGuest=event.value===true;
          if(r.readyHost && r.readyGuest) r.started=true;
          return {room:publicState(r,side)};
        });
        return ok(data);
      }
      if (action === 'send') {
        if(!event.payload || typeof event.payload!=='object' || Array.isArray(event.payload)) throw Error('Invalid message');
        const content=JSON.stringify(event.payload);
        if(content.length>MAX_PAYLOAD) throw Error('Game message exceeds size limit');
        const messageId=String(event.messageId||'').slice(0,80);
        if(!/^[A-Za-z0-9_-]{8,80}$/.test(messageId)) throw Error('Invalid message id');
        const data=await store.transact(code,r => {
          active(r);const side=sideOf(r,event.token);
          if(r.status!=='full') throw Error('Second player has not joined');
          const to=side==='host'?'guest':'host';
          const previous=r.messages.find(m=>m.id===messageId && m.from===side);
          if(previous) return {seq:previous.seq};
          if(r.messages.filter(m=>m.to===to).length>=MAX_PENDING_PER_SIDE) throw Error('Receiver is behind; wait for connection to recover');
          const seq=++r.seq;
          r.messages.push({seq,to,from:side,id:messageId,payload:event.payload,at:Date.now()});
          return {seq};
        });
        return ok(data);
      }
      if (action === 'leave') {
        await store.transact(code,r => {
          active(r);sideOf(r,event.token);r.status='closed';r.expiresAt=Date.now();r.messages=[];
        });
        return ok({code});
      }
      throw Error('Unsupported action');
    } catch(error) {return {ok:false,error:String(error?.message||error).slice(0,240)};}
  };
}
module.exports={createHandler};
