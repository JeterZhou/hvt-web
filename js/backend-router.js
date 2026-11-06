/* Preserve v2.1 manual WebRTC while using CloudBase relay for auto rooms. */
import {HVTBackend as Manual} from './p2p-room.js';
import {CloudRelay} from './cloud-relay.js';
let active=Manual;
async function start(){await CloudRelay.start();try{await Manual.start();}catch(e){console.warn('Manual WebRTC unavailable:',e);}}
async function createRoom(...args){active=Manual;return Manual.createRoom(...args);}
async function joinRoom(...args){active=Manual;return Manual.joinRoom(...args);}
async function createAutoRoom(...args){active=CloudRelay;return CloudRelay.createAutoRoom(...args);}
async function joinAutoRoom(...args){active=CloudRelay;return CloudRelay.joinAutoRoom(...args);}
async function leave(){try{return await active.leave();}finally{active=Manual;}}
export const HVTBackend={start,createRoom,joinRoom,createAutoRoom,joinAutoRoom,leave,
  listRooms:(...a)=>CloudRelay.listRooms(...a),isAutoEnabled:()=>CloudRelay.isAutoEnabled(),
  getLobby:(...a)=>active.getLobby(...a),toggleReady:(...a)=>active.toggleReady(...a),
  listen:(...a)=>active.listen(...a),sendCommand:(...a)=>active.sendCommand(...a),
  resume:(...a)=>active.resume(...a),getConnectionInfo:(...a)=>active.getConnectionInfo(...a),
  getSignalInfo:(...a)=>active.getSignalInfo(...a),acceptAnswer:(...a)=>active.acceptAnswer?.(...a)};
