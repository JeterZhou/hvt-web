/*
 * GitHub Pages-only multiplayer transport.
 * Host (attacker) is authoritative; peer connection is established by manually
 * exchanging WebRTC offer/answer text. No Firebase, API key, or custom server.
 */
import { HVTGame } from './game-engine.js';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};
const ICE_TIMEOUT_MS = 25000;
const COMMAND_TTL_MS = 15000;
let gameMap = null;
let pc = null;
let channel = null;
let room = '';
let role = '';
let host = false;
let myName = 'Player';
let peerName = '';
let engine = null;
let started = false;
let ready = { attacker: false, defender: false };
let offerText = '';
let answerText = '';
let incomingOffer = '';
let connected = false;
let callbackSet = null;
let requestSerial = 0;
const pendingRequests = new Map();
let processing = Promise.resolve();

const cleanName = value => String(value || 'Player').trim().slice(0, 20) || 'Player';
const randomCode = () => Array.from(crypto.getRandomValues(new Uint8Array(4)))
  .map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
const parseDescription = (text, expectedType) => {
  let value;
  try { value = JSON.parse(String(text || '').trim()); }
  catch { throw Error('连接文本不是有效的 JSON，请完整复制邀请/答复内容。'); }
  if (!value || value.type !== expectedType || typeof value.sdp !== 'string') {
    throw Error(`连接文本格式错误：需要 ${expectedType} 描述。`);
  }
  return value;
};

function emitOnline(value) {
  connected = !!value;
  callbackSet?.onOnline?.(connected);
}
function lobbyState() {
  return {
    room: room || 'P2P',
    started,
    ready: !!(ready.attacker && ready.defender),
    players: {
      attacker: { nickname: host ? myName : peerName, ready: !!ready.attacker },
      defender: { nickname: host ? peerName : myName, ready: !!ready.defender },
    },
  };
}
function emitLobby() { callbackSet?.onLobby?.(lobbyState()); }
function send(message) {
  if (!channel || channel.readyState !== 'open') return false;
  try { channel.send(JSON.stringify(message)); return true; }
  catch (error) { console.warn('P2P send failed:', error); return false; }
}
function notifyView(snapshot, effects = []) { callbackSet?.onView?.(snapshot, effects); }
function sendLobby() {
  emitLobby();
  if (host) send({ type: 'lobby', state: lobbyState() });
}
function viewPair() {
  if (!engine) return null;
  return {
    attacker: engine.snapshotFor('attacker'),
    defender: engine.snapshotFor('defender'),
  };
}
function publishViews(before = null, command = null, params = {}, actorRole = '', result = { ok: true }) {
  if (!host || !engine) return;
  const after = viewPair();
  for (const side of ['attacker', 'defender']) {
    const effects = before
      ? engine.effects(before[side], after[side], side, command,
        { ...params, role: actorRole }, result)
      : [];
    if (side === 'attacker') {
      if (role === side) notifyView(after[side], effects);
      else send({ type: 'view', side, snapshot: after[side], effects });
    } else if (role === side) notifyView(after[side], effects);
    else send({ type: 'view', side, snapshot: after[side], effects });
  }
}
function maybeStart() {
  if (!host || started || !ready.attacker || !ready.defender) return;
  engine = new HVTGame(gameMap, 43, 20);
  started = true;
  sendLobby();
  publishViews();
}
async function runCommand(actorRole, command, params = {}, requestId = null) {
  if (!host || !engine || !started) {
    const result = { ok: false, msg: '房间未开始或房主尚未初始化游戏。' };
    if (requestId) send({ type: 'result', id: requestId, result });
    return result;
  }
  const before = viewPair();
  const result = engine.process(actorRole, command, params || {});
  publishViews(before, command, params || {}, actorRole, result);
  if (requestId) send({ type: 'result', id: requestId, result });
  return result;
}
function handleMessage(message) {
  if (!message || typeof message !== 'object') return;
  if (message.type === 'hello') {
    if (message.role !== (host ? 'defender' : 'attacker')) return;
    peerName = cleanName(message.nickname);
    if (!host && message.room) room = String(message.room).slice(0, 24);
    sendLobby();
    if (host) {
      send({ type: 'hello', role: 'attacker', nickname: myName, room });
      if (started) publishViews();
    }
    return;
  }
  if (message.type === 'lobby' && !host && message.state) {
    const state = message.state;
    if (state.room) room = String(state.room).slice(0, 24);
    started = !!state.started;
    ready = {
      attacker: !!state.players?.attacker?.ready,
      defender: !!state.players?.defender?.ready,
    };
    peerName = cleanName(state.players?.attacker?.nickname || peerName);
    emitLobby();
    return;
  }
  if (message.type === 'ready' && host && message.role === 'defender') {
    ready.defender = !!message.value;
    sendLobby();
    maybeStart();
    return;
  }
  if (message.type === 'command' && host && message.role === 'defender') {
    const id = String(message.id || '');
    const createdAt = Number(message.createdAt);
    if (!id) return;
    const expired = () => !Number.isFinite(createdAt) || createdAt <= 0 || Date.now() - createdAt > COMMAND_TTL_MS;
    if (expired()) {
      send({ type: 'result', id, result: { ok: false, msg: '指令已过期，未执行。请确认连接正常后重新操作。' } });
      return;
    }
    processing = processing.then(() => {
      if (expired()) {
        send({ type: 'result', id, result: { ok: false, msg: '指令在等待执行期间已过期，未执行。请重新操作。' } });
        return;
      }
      return runCommand('defender', message.command, message.params || {}, id);
    }).catch(error => {
      console.error('P2P command failed:', error);
      send({ type: 'result', id, result: { ok: false, msg: '房主执行指令失败，请检查控制台。' } });
    });
    return;
  }
  if (message.type === 'result' && !host) {
    const request = pendingRequests.get(String(message.id));
    if (request) {
      pendingRequests.delete(String(message.id));
      request.resolve(message.result || { ok: false, msg: '房主返回了空结果。' });
    }
    return;
  }
  if (message.type === 'view' && !host && message.side === 'defender' && message.snapshot) {
    notifyView(message.snapshot, Array.isArray(message.effects) ? message.effects : []);
  }
}
function setDataChannel(ch) {
  channel = ch;
  channel.onopen = () => {
    emitOnline(true);
    send({ type: 'hello', role, nickname: myName, room });
    if (host) sendLobby();
  };
  channel.onclose = () => emitOnline(false);
  channel.onerror = () => emitOnline(false);
  channel.onmessage = event => {
    try { handleMessage(JSON.parse(event.data)); }
    catch (error) { console.warn('Ignoring invalid P2P message:', error); }
  };
}
function setPeerConnection(next) {
  pc = next;
  pc.onconnectionstatechange = () => {
    const state = pc?.connectionState;
    emitOnline(state === 'connected' && channel?.readyState === 'open');
    if (state === 'failed' || state === 'closed') emitOnline(false);
  };
  pc.oniceconnectionstatechange = () => {
    if (pc?.iceConnectionState === 'failed' || pc?.iceConnectionState === 'closed') emitOnline(false);
  };
}
function waitForIceGathering(connection) {
  if (connection.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      connection.removeEventListener('icegatheringstatechange', check);
      reject(Error('收集网络连接信息超时。请刷新后重试，或改用不同网络。'));
    }, ICE_TIMEOUT_MS);
    const check = () => {
      if (connection.iceGatheringState !== 'complete') return;
      clearTimeout(timeout);
      connection.removeEventListener('icegatheringstatechange', check);
      resolve();
    };
    connection.addEventListener('icegatheringstatechange', check);
  });
}
function resetConnection() {
  for (const request of pendingRequests.values()) request.reject(Error('连接已关闭。'));
  pendingRequests.clear();
  try { channel?.close(); } catch {}
  try { pc?.close(); } catch {}
  pc = null; channel = null; engine = null; started = false;
  ready = { attacker: false, defender: false };
  offerText = ''; answerText = ''; incomingOffer = '';
  peerName = ''; connected = false; callbackSet = null; processing = Promise.resolve();
}

async function start() {
  if (!('RTCPeerConnection' in window)) throw Error('此浏览器不支持 WebRTC，请使用较新的 Chrome、Edge、Firefox 或 Safari。');
  gameMap = await (await fetch(new URL('./seed43-map.json', import.meta.url))).json();
  return true;
}
async function createRoom(name) {
  resetConnection();
  role = 'attacker'; host = true; myName = cleanName(name); room = `P2P-${randomCode()}`;
  const connection = new RTCPeerConnection(RTC_CONFIG);
  setPeerConnection(connection);
  setDataChannel(connection.createDataChannel('hvt-game', { ordered: true }));
  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  await waitForIceGathering(connection);
  offerText = JSON.stringify(connection.localDescription);
  ready.attacker = false;
  return lobbyState();
}
async function joinRoom(offer, side, name) {
  if (side !== 'defender') throw Error('GitHub-only 联机模式中，房主固定为攻击方，加入者为防守方。');
  resetConnection();
  role = 'defender'; host = false; myName = cleanName(name); room = 'P2P-CONNECTING';
  incomingOffer = String(offer || '').trim();
  const description = parseDescription(incomingOffer, 'offer');
  const connection = new RTCPeerConnection(RTC_CONFIG);
  setPeerConnection(connection);
  connection.ondatachannel = event => setDataChannel(event.channel);
  await connection.setRemoteDescription(description);
  const answer = await connection.createAnswer();
  await connection.setLocalDescription(answer);
  await waitForIceGathering(connection);
  answerText = JSON.stringify(connection.localDescription);
  return lobbyState();
}
async function acceptAnswer(answer) {
  if (!host || !pc) throw Error('当前页面不是等待答复的房主页面。');
  const description = parseDescription(answer, 'answer');
  await pc.setRemoteDescription(description);
  return true;
}
function getSignalInfo() { return { offer: offerText, answer: answerText, role, room }; }
async function resume() { throw Error('WebRTC 直连不能在刷新页面后自动恢复，请重新创建邀请并建立连接。'); }
function getLobby() { return lobbyState(); }
async function toggleReady(next) {
  if (!connected || !channel || channel.readyState !== 'open') throw Error('请先完成邀请/答复交换，等待连接状态显示“已连接”。');
  if (started) throw Error('对局已经开始。');
  ready[role] = !!next;
  if (host) {
    sendLobby();
    maybeStart();
  } else {
    send({ type: 'ready', role: 'defender', value: !!next });
    emitLobby();
  }
  return lobbyState();
}
async function leave() {
  resetConnection(); room = ''; role = ''; host = false; myName = 'Player';
}
function listen(onLobby, onView, onOnline) {
  callbackSet = { onLobby, onView, onOnline };
  emitLobby();
  emitOnline(connected && channel?.readyState === 'open');
  if (channel?.readyState === 'open') {
    send({ type: 'hello', role, nickname: myName, room });
    if (host) sendLobby();
    if (host && started) publishViews();
  }
  return () => { if (callbackSet?.onLobby === onLobby) callbackSet = null; };
}
async function sendCommand(command, params = {}) {
  if (!started) throw Error('双方尚未准备。');
  if (!connected || !channel || channel.readyState !== 'open') throw Error('连接已断开，请重新建立邀请连接。');
  if (host) {
    const id = `host-${++requestSerial}`;
    const result = await runCommand('attacker', command, params, null);
    return result;
  }
  const id = `guest-${Date.now()}-${++requestSerial}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(id);
      reject(Error('房主未在 18 秒内响应。请确认房主页面仍然打开且连接正常。'));
    }, 18000);
    pendingRequests.set(id, {
      resolve: value => { clearTimeout(timer); resolve(value); },
      reject: error => { clearTimeout(timer); reject(error); },
    });
    if (!send({ type: 'command', id, role: 'defender', command, params, createdAt: Date.now() })) {
      clearTimeout(timer); pendingRequests.delete(id); reject(Error('无法发送指令，连接可能已断开。'));
    }
  });
}

export const HVTBackend = { start, createRoom, joinRoom, resume, getLobby, toggleReady, leave, listen, sendCommand, acceptAnswer, getSignalInfo };
