'use strict';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const palette = {
  DD: '#dceffa', D: '#188ef6', H: '#ffe662', HD: '#ff9444',
  lurk: '#bf7aff', Hlurk: '#b895ff', HlurkD: '#8868df',
  active: '#49fb8b', defenderActive: '#ff4b6e', abandoned: '#576878',
};

const resourceLabels = {
  zh: {
    attacker_human_energy: '人工攻击能量', attacker_ai_energy: 'AI 攻击能量',
    budget: '防守预算', key: '密钥', c2_silenced_rounds: 'C2 沉默回合',
    zombie_used: '僵尸军团已用', zombie_max: '军团上限',
  },
  en: {
    attacker_human_energy: 'Human attack energy', attacker_ai_energy: 'AI attack energy',
    budget: 'Defense budget', key: 'Keys', c2_silenced_rounds: 'C2 silence rounds',
    zombie_used: 'Zombie swarm used', zombie_max: 'Swarm cap',
  }
};
const phaseLabels = {
  zh: {
    setup: '初始部署', round_ready: '等待攻击方开回合',
    attacker_human: '攻击方行动中', defender_prompt: '等待蜜罐确认',
    defender_human: '防守方行动中', game_over: '对局结束',
  },
  en: {
    setup: 'Setup', round_ready: 'Waiting for attacker to start the round',
    attacker_human: 'Attacker phase', defender_prompt: 'Waiting for honeypot confirmation',
    defender_human: 'Defender phase', game_over: 'Game over',
  }
};
const i18n = {
  zh: {
    page_title: 'Human vs Trojan | Cyber Arena',
    landingSubtitle: '浏览器实时攻防对抗 · Web Cyber Arena',
    nicknameLabel: '玩家昵称', nicknamePlaceholder: '输入玩家昵称',
    createBtn: '创建房间（攻击方）', separatorText: '或者粘贴朋友的邀请',
    roomInputLabel: '房主邀请文本', roomInputPlaceholder: '粘贴朋友发来的完整邀请文本',
    role_defender: '防守方', role_attacker: '攻击方', joinBtn: '使用邀请加入',
    landingHint: '仅使用 GitHub Pages 和浏览器 WebRTC。房主创建邀请，朋友粘贴邀请并把答复发回房主；连接成功后双方准备即可开始。',
    roomListHead: '当前房间', lobbyLoading: '正在加载房间...',
    waitingTitle: '等待双方准备', waitingSubtitle: '房主把邀请发给朋友；朋友生成答复后发回房主。完成连接后双方点击准备。',
    roomCodeLabel: '连接标识', copyRoomBtn: '复制连接文本 ⧉',
    hostSignalHelp: '把下面的邀请文本私下发给朋友。朋友生成答复后，请粘贴到下方并点击连接。', guestSignalHelp: '请把下方答复文本完整复制并私下发回房主；房主应用答复后会自动连接。',
    offerOutputLabel: '邀请文本（发给朋友）', answerInputLabel: '朋友返回的答复', answerOutputLabel: '答复文本（发回房主）', acceptAnswerBtn: '应用答复并连接',
    attackerRoleLabel: 'ATTACKER / 攻击方', defenderRoleLabel: 'DEFENDER / 防守方',
    leaveLobbyBtn: '返回首页', roomMetaLabel: '房间',
    mapHeadLive: 'LIVE // 实时战况', resetCamera: '⟲ 重置视角', resetCameraTitle: '重置视角',
    focusCamera: '◎ 聚焦目标', focusCameraTitle: '聚焦已选择节点',
    mapHint: '拖动旋转 · Shift+拖动平移 · 滚轮缩放 · 点击选择 · 双击聚焦',
    legendNormal: '正常', legendInfected: '感染', legendShield: '防御', legendFocus: '选中',
    statusPanelTitle: '战局状态', commandsPanelTitle: '战术指令', nodeLabel: '目标节点',
    sourceLabel: '来源节点 / 第二节点', logsPanelTitle: '战斗日志', logsPanelSmall: 'REAL-TIME FEED',
    turnHintAttack: 'ATTACK', turnHintDefense: 'DEFENSE',
    connected: '● 已连接', reconnecting: '● 正在重连',
    roomWaitingPlayer: '等待连接...', ready: '✓ 已准备', waitingReady: '等待准备', absent: '未加入',
    readyBtn: '准备就绪', cancelReadyBtn: '取消准备',
    waitingHintPrepare: '连接成功后，点击「准备就绪」，等待另一位玩家。',
    waitingHintStarting: '双方已准备，正在进入地图...', waitingHintPeer: '已准备，等待另一位玩家准备...',
    roomCopied: '连接文本已复制', roomCopyManual: '无法自动复制，请在文本框中手动选择并复制。',
    noRooms: '此版本不维护公共房间列表。请通过邀请文本连接朋友。', roomStatusPlaying: '游戏中',
    roomLoadFail: '无法加载房间列表，请检查服务是否运行。',
    waitBothReady: '等待双方准备后才能执行指令',
    round: '回合 {current} / {max}', gameOverWinner: '对局结束！胜者：{winner}',
    winner_attacker: '攻击方', winner_defender: '防守方',
    free: '免费', noCost: '无资源消耗',
    skillCostPrefix: '单次消耗：',
    startRoundSetup: '初始投毒 / 开始回合', startRoundReady: '开始下一回合',
    startRoundDesc: '开始或推进下一回合。',
    activate: '激活', activateCost: '6 攻击能量', activateDesc: '将己方 lurk 节点转为 active；目标状态不符时不收费。',
    sleep: '休眠', sleepCost: '1 攻击能量', sleepDesc: '将己方 active 转为 lurk，以便隐藏感染。',
    scan: '扫描', scanCostAttack: '1 攻击能量', scanDescAttack: '从来源节点扫描指定目标，距离限制为 2。',
    zombie: '僵尸军团', zombieCost: '8 攻击能量', zombieDesc: '使用僵尸军团发起特殊占领，可被防御方抵抗。',
    precise: '精准狙击', preciseCost: '12 攻击能量', preciseDesc: '集合可用 active 节点发起特殊占领。',
    move_c2: 'C2 迁移', moveC2Cost: '15 攻击能量', moveC2Desc: '解除 C2 沉默并清空防守方已积累的密钥。',
    endAttack: '结束攻击阶段', endAttackDesc: '将行动权交给防守方。',
    allowHoneypot: '允许 AI 蜜罐', allowHoneypotCost: '免费', allowHoneypotDesc: '允许 AI 根据局势自动预部署一个蜜罐。',
    skipHoneypot: '跳过蜜罐', skipHoneypotCost: '免费', skipHoneypotDesc: '跳过本回合的 AI 预部署蜜罐。',
    harden: '加固', hardenCost: '3 防守预算', hardenDesc: '提升正常节点的防御强度，已加固或被占领节点不可加固。',
    scanDefenseCost: '3 防守预算', scanDescDefense: '侦测目标是否藏有 lurk 或 active 病毒。',
    clear: '清除', clearCost: '6 防守预算', clearDesc: '清除已确认的 lurk，未确认时不扣费。',
    recapture: '夺回', recaptureCost: '6 防守预算', recaptureDesc: '以 30% 成功率夺回 active；不能夺回 lurk，条件不符不收费。',
    restore: '恢复', restoreCost: '12 防守预算', restoreDesc: '将 abandoned 废置节点恢复成普通节点；目标未废置不收费。',
    counterC2: '反击 C2', counterC2Cost: '15 防守预算 + 3 密钥', counterC2Desc: '消耗密钥和预算，使攻击方 C2 沉默 2 回合。',
    clean: '流量清洗', cleanCost: '24 防守预算', cleanDesc: '有待处理的特殊攻击时投入 8 点等效清洗强度。',
    endRound: '结束本回合', endRoundDesc: '结束防守行动并推进回合。',
    gameEnded: '游戏已结束', waitingOpponent: '等待对方行动...',
    nodeDetailDefault: '点击节点查看状态', mapCountFormat: '{nodes} NODES / {links} LINKS',
    fxAttack: '⚠ 攻击指令发射 / ATTACK', fxInfect: '☣ 节点感染扩散 / INFECTION', fxDefend: '✦ 防御响应成功 / DEFENDED',
    invalidRoomCode: '请粘贴房主发送的完整邀请文本', requestFailed: '请求失败 ({status})',
    roleAttackerShort: 'ATTACKER', roleDefenderShort: 'DEFENDER',
  },
  en: {
    page_title: 'Human vs Trojan | Cyber Arena',
    landingSubtitle: 'Real-time browser attack / defense arena · Web Cyber Arena',
    nicknameLabel: 'Nickname', nicknamePlaceholder: 'Enter your nickname',
    createBtn: 'Create room (Attacker)', separatorText: 'or paste a friend’s invitation',
    roomInputLabel: 'Host invitation text', roomInputPlaceholder: 'Paste the complete invitation text from your friend',
    role_defender: 'Defender', role_attacker: 'Attacker', joinBtn: 'Join with invitation',
    landingHint: 'GitHub Pages + browser WebRTC only. The host creates an invitation; the friend pastes it and sends the answer back. Once connected, both players click Ready.',
    roomListHead: 'Active rooms', lobbyLoading: 'Loading rooms...',
    waitingTitle: 'Waiting for both players', waitingSubtitle: 'The host shares an invitation; the friend sends an answer back. Both players click Ready after connecting.',
    roomCodeLabel: 'Connection ID', copyRoomBtn: 'Copy connection text ⧉',
    hostSignalHelp: 'Send the invitation text below to your friend privately. Paste their answer below and click Connect when they send it back.', guestSignalHelp: 'Copy the complete answer below and send it privately to the host. The connection will start after the host applies it.',
    offerOutputLabel: 'Invitation text (send to friend)', answerInputLabel: 'Answer returned by your friend', answerOutputLabel: 'Answer text (send to host)', acceptAnswerBtn: 'Apply answer and connect',
    attackerRoleLabel: 'ATTACKER', defenderRoleLabel: 'DEFENDER',
    leaveLobbyBtn: 'Back to home', roomMetaLabel: 'Room',
    mapHeadLive: 'LIVE // real-time battlefield', resetCamera: '⟲ Reset view', resetCameraTitle: 'Reset view',
    focusCamera: '◎ Focus target', focusCameraTitle: 'Focus the selected node',
    mapHint: 'Drag to orbit · Shift+drag to pan · Wheel to zoom · Click to select · Double-click to focus',
    legendNormal: 'Normal', legendInfected: 'Infected', legendShield: 'Defense', legendFocus: 'Selected',
    statusPanelTitle: 'Battle status', commandsPanelTitle: 'Tactical commands', nodeLabel: 'Target node',
    sourceLabel: 'Source node / secondary node', logsPanelTitle: 'Battle log', logsPanelSmall: 'REAL-TIME FEED',
    turnHintAttack: 'ATTACK', turnHintDefense: 'DEFENSE',
    connected: '● Connected', reconnecting: '● Reconnecting',
    roomWaitingPlayer: 'Waiting for connection...', ready: '✓ Ready', waitingReady: 'Waiting', absent: 'Not joined',
    readyBtn: 'Ready', cancelReadyBtn: 'Cancel ready',
    waitingHintPrepare: 'After connecting, click “Ready” and wait for the other player.',
    waitingHintStarting: 'Both players are ready. Entering the map...', waitingHintPeer: 'Ready. Waiting for the other player...',
    roomCopied: 'Connection text copied', roomCopyManual: 'Could not copy automatically. Select and copy the text manually.',
    noRooms: 'This version has no public room directory. Connect friends using invitation text.', roomStatusPlaying: 'In game',
    roomLoadFail: 'Could not load the room list. Please check whether the server is running.',
    waitBothReady: 'Wait until both players are ready before issuing commands',
    round: 'Round {current} / {max}', gameOverWinner: 'Match finished! Winner: {winner}',
    winner_attacker: 'Attacker', winner_defender: 'Defender',
    free: 'Free', noCost: 'No cost',
    skillCostPrefix: 'Cost / use: ',
    startRoundSetup: 'Initial infection / Start round', startRoundReady: 'Start next round',
    startRoundDesc: 'Start or advance the next round.',
    activate: 'Activate', activateCost: '6 attack energy', activateDesc: 'Turn your lurk node into active. No cost if the target state does not qualify.',
    sleep: 'Sleep', sleepCost: '1 attack energy', sleepDesc: 'Turn your active node back into lurk to hide the infection.',
    scan: 'Scan', scanCostAttack: '1 attack energy', scanDescAttack: 'Scan the target from the source node with a range limit of 2.',
    zombie: 'Zombie swarm', zombieCost: '8 attack energy', zombieDesc: 'Launch a special capture attack with the zombie swarm. The defender may resist it.',
    precise: 'Precision strike', preciseCost: '12 attack energy', preciseDesc: 'Launch a special capture attack using all available active nodes.',
    move_c2: 'C2 relocation', moveC2Cost: '15 attack energy', moveC2Desc: 'Clear C2 silence and wipe the defender\'s accumulated keys.',
    endAttack: 'End attack phase', endAttackDesc: 'Pass control to the defender.',
    allowHoneypot: 'Allow AI honeypot', allowHoneypotCost: 'Free', allowHoneypotDesc: 'Allow the AI to auto-place one predicted honeypot.',
    skipHoneypot: 'Skip honeypot', skipHoneypotCost: 'Free', skipHoneypotDesc: 'Skip the AI pre-deployed honeypot this round.',
    harden: 'Harden', hardenCost: '3 defense budget', hardenDesc: 'Increase a normal node\'s defense. Hardened or occupied nodes cannot be hardened again.',
    scanDefenseCost: '3 defense budget', scanDescDefense: 'Check whether the target hides a lurk or active infection.',
    clear: 'Clear', clearCost: '6 defense budget', clearDesc: 'Clear a confirmed lurk. No cost if the target is not confirmed.',
    recapture: 'Recapture', recaptureCost: '6 defense budget', recaptureDesc: 'Attempt to retake an active node with 30% success. Lurk nodes cannot be recaptured.',
    restore: 'Restore', restoreCost: '12 defense budget', restoreDesc: 'Restore an abandoned node to a normal node. No cost if the target is not abandoned.',
    counterC2: 'Counter C2', counterC2Cost: '15 defense budget + 3 keys', counterC2Desc: 'Spend budget and keys to silence the attacker\'s C2 for 2 rounds.',
    clean: 'Traffic scrub', cleanCost: '24 defense budget', cleanDesc: 'Invest the equivalent of 8 scrub strength when a special attack is pending.',
    endRound: 'End round', endRoundDesc: 'Finish the defender turn and advance the round.',
    gameEnded: 'The game has ended', waitingOpponent: 'Waiting for the other player...',
    nodeDetailDefault: 'Click a node to inspect its status', mapCountFormat: '{nodes} NODES / {links} LINKS',
    fxAttack: '⚠ Attack command launched', fxInfect: '☣ Infection spreading', fxDefend: '✦ Defensive response successful',
    invalidRoomCode: 'Please paste the complete invitation text from the host', requestFailed: 'Request failed ({status})',
    roleAttackerShort: 'ATTACKER', roleDefenderShort: 'DEFENDER',
  }
};
let currentLang = localStorage.getItem('hvt_lang') === 'en' ? 'en' : 'zh';
let room = '', role = '', nickname = '', snap = null, online = false;
let commandPending = false, announcedGameOver = false;
let lobbyState = null, readyPending = false, reconnectTimer = null;
let selected = '', view = { x: 0, y: 0, k: 1 };
let coords = {}, drag = null, dragging = false;
let activeFX = [], effectFrame = 0, lastEventId = 0, toastTimer = null, noticeTimer = null;
let frameGeometry = null;
const prefersLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const tr = (key, vars = {}) => {
  let template = i18n[currentLang]?.[key] ?? i18n.zh[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
};
const resourceLabel = key => resourceLabels[currentLang]?.[key] ?? resourceLabels.zh[key] ?? key;
const phaseLabel = key => phaseLabels[currentLang]?.[key] ?? phaseLabels.zh[key] ?? key;
const roleDisplay = value => currentLang === 'zh'
  ? (value === 'attacker' ? tr('winner_attacker') : tr('winner_defender'))
  : (value === 'attacker' ? tr('winner_attacker') : tr('winner_defender'));
function translateEngineText(text) {
  if (currentLang === 'zh' || !text) return text || '';
  let out = text;
  const direct = [
    ['等待攻击方结束进攻阶段。', 'Waiting for the attacker to end the attack phase.'],
    ['等待防守方确认是否让 AI 预测并预部署蜜罐。', 'Waiting for the defender to confirm whether AI may predict and pre-deploy a honeypot.'],
    ['请先确认是否允许 AI 预测并预部署一个蜜罐。', 'Please confirm whether AI may predict and pre-deploy one honeypot first.'],
    ['已进入防守方人工阶段，等待防守方行动。', 'Entered the defender manual phase. Waiting for defender actions.'],
    ['防守方人工阶段：请先执行手动动作，完成后点击‘结束本回合’。', 'Defender manual phase: perform manual actions, then click “End round”.'],
    ['防守方已完成蜜罐确认，当前为人工阶段。', 'Defender honeypot confirmation completed. Manual phase is now active.'],
    ['本回合已结束，可开始下一回合。', 'This round has ended. You may start the next round.'],
  ];
  for (const [zh, en] of direct) out = out.replaceAll(zh, en);
  out = out.replace(/游戏结束，胜者：攻击方/g, 'Game over. Winner: Attacker');
  out = out.replace(/游戏结束，胜者：防守方/g, 'Game over. Winner: Defender');
  out = out.replace(/第\s*(\d+)\s*回合已开始。/g, (_, n) => `Round ${n} has started.`);
  out = out.replace(/第\s*(\d+)\s*回合/g, (_, n) => `Round ${n}`);
  return out;
}
function setLanguage(lang) {
  currentLang = lang === 'en' ? 'en' : 'zh';
  localStorage.setItem('hvt_lang', currentLang);
  applyLanguage();
}
function applyLanguage() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  document.title = tr('page_title');
  $('langToggle').textContent = currentLang === 'zh' ? 'EN' : '中文';
  $('landingSubtitle').textContent = tr('landingSubtitle');
  $('nicknameLabel').textContent = tr('nicknameLabel');
  $('nickname').placeholder = tr('nicknamePlaceholder');
  $('createBtn').textContent = tr('createBtn');
  $('separatorText').textContent = tr('separatorText');
  $('roomInputLabel').textContent = tr('roomInputLabel');
  $('roomInput').placeholder = tr('roomInputPlaceholder');
  $('roleInput').options[0].text = tr('role_defender');
  $('roleInput').options[1].text = currentLang === 'zh' ? '攻击方（房主专用）' : 'Attacker (host only)';
  $('joinBtn').textContent = tr('joinBtn');
  $('landingHint').textContent = tr('landingHint');
  $('roomListHead').textContent = tr('roomListHead');
  if (!$('lobby').children.length) $('lobby').textContent = tr('lobbyLoading');
  $('waitingTitle').textContent = tr('waitingTitle');
  $('waitingSubtitle').textContent = tr('waitingSubtitle');
  $('roomCodeLabel').textContent = tr('roomCodeLabel');
  $('hostSignalHelp').textContent = tr('hostSignalHelp');
  $('guestSignalHelp').textContent = tr('guestSignalHelp');
  document.querySelector('label[for=offerOutput]').textContent = tr('offerOutputLabel');
  document.querySelector('label[for=answerInput]').textContent = tr('answerInputLabel');
  document.querySelector('label[for=answerOutput]').textContent = tr('answerOutputLabel');
  $('acceptAnswerBtn').textContent = tr('acceptAnswerBtn');
  $('copyRoomBtn').innerHTML = `${tr('copyRoomBtn').replace(' ⧉','')} <icon-copy>⧉</icon-copy>`;
  if (room && HVTBackend?.getSignalInfo) updateSignalPanel();
  $('attackerRoleLabel').textContent = tr('attackerRoleLabel');
  $('defenderRoleLabel').textContent = tr('defenderRoleLabel');
  $('leaveLobbyBtn').textContent = tr('leaveLobbyBtn');
  $('roomMetaLabel').textContent = tr('roomMetaLabel');
  $('mapHeadLive').textContent = tr('mapHeadLive');
  $('resetCamera').textContent = tr('resetCamera');
  $('resetCamera').title = tr('resetCameraTitle');
  $('focusCamera').textContent = tr('focusCamera');
  $('focusCamera').title = tr('focusCameraTitle');
  $('mapHint').textContent = tr('mapHint');
  $('legendNormal').textContent = tr('legendNormal');
  $('legendInfected').textContent = tr('legendInfected');
  $('legendShield').textContent = tr('legendShield');
  $('legendFocus').textContent = tr('legendFocus');
  $('statusPanelTitle').textContent = tr('statusPanelTitle');
  $('commandsPanelTitle').textContent = tr('commandsPanelTitle');
  $('nodeLabel').textContent = tr('nodeLabel');
  $('sourceLabel').textContent = tr('sourceLabel');
  $('logsPanelTitle').textContent = tr('logsPanelTitle');
  $('logsPanelSmall').textContent = tr('logsPanelSmall');
  setConnection(online);
  if (lobbyState) applyLobby(lobbyState);
  if (snap) render(snap);
  else {
    $('mapCount').textContent = '3D TACTICAL GRID';
    $('nodeDetail').textContent = tr('nodeDetailDefault');
  }
  refreshRooms();
}

function showToast(message, isError = false) {
  const el = $('toast');
  el.textContent = message;
  el.className = `toast${isError ? ' error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
}
function getNickname() { return $('nickname').value.trim().slice(0, 20) || 'Player'; }
function setConnection(connected) {
  online = connected;
  for (const el of [$('waitingConnection'), $('connection')]) {
    el.textContent = connected ? tr('connected') : tr('reconnecting');
    el.classList.toggle('offline', !connected);
  }
  if ($('readyBtn') && lobbyState) $('readyBtn').disabled = readyPending || !!lobbyState.started || !connected;
}
function showPage(page) {
  for (const id of ['landing', 'waiting', 'game']) $(id).classList.toggle('hidden', id !== page);
  document.body.classList.toggle('attacker', page === 'game' && role === 'attacker');
  document.body.classList.toggle('defender', page === 'game' && role === 'defender');
  if (page === 'game') {
    $('role').textContent = role === 'attacker' ? tr('roleAttackerShort') : tr('roleDefenderShort');
    $('room').textContent = room;
    if (snap) renderGraph();
  }
}
function saveSession() { sessionStorage.setItem('hvt_player', JSON.stringify({ room, role, nickname })); }

async function createRoom() {
  const b = $('createBtn'); b.disabled = true;
  try {
    nickname = getNickname();
    const state = await HVTBackend.createRoom(nickname);
    room = state.room; role = 'attacker';
    await enterLobby(state, false);
  } catch (err) { showToast(err.message, true); }
  finally { b.disabled = false; }
}
async function joinRoom() {
  const b = $('joinBtn'); b.disabled = true;
  try {
    const invitation = $('roomInput').value.trim();
    if (!invitation) throw new Error(tr('invalidRoomCode'));
    role = $('roleInput').value; nickname = getNickname();
    const state = await HVTBackend.joinRoom(invitation, role, nickname);
    room = state.room;
    await enterLobby(state, false);
  } catch (err) { showToast(err.message, true); }
  finally { b.disabled = false; }
}
async function enterLobby(state, restored) {
  room = state.room || room;
  saveSession();
  applyLobby(state);
  updateSignalPanel();
  if (!state.started) showPage('waiting');
  else showPage('game');
  connect();
  if (!restored) refreshRooms();
}
function applyLobby(state) {
  lobbyState = state;
  if (state.room && state.room !== 'P2P-CONNECTING') room = state.room;
  $('waitingCode').textContent = state.room;
  for (const side of ['attacker', 'defender']) {
    const p = state.players[side];
    $(`${side}Name`).textContent = p.nickname || tr('roomWaitingPlayer');
    const badge = $(`${side}Ready`);
    badge.textContent = p.ready ? tr('ready') : (p.nickname ? tr('waitingReady') : tr('absent'));
    badge.classList.toggle('ready', !!p.ready);
  }
  const me = state.players[role];
  $('readyBtn').textContent = me?.ready ? tr('cancelReadyBtn') : tr('readyBtn');
  $('readyBtn').disabled = readyPending || state.started || !online;
  const otherRole = role === 'attacker' ? 'defender' : 'attacker';
  $('waitingHint').textContent = !me?.ready ? tr('waitingHintPrepare') :
    (state.players[otherRole].ready ? tr('waitingHintStarting') : tr('waitingHintPeer'));
  if (state.started && room === state.room) showPage('game');
}
async function toggleReady() {
  if (!lobbyState || readyPending || lobbyState.started) return;
  readyPending = true; $('readyBtn').disabled = true;
  try {
    const next = !lobbyState.players[role].ready;
    const state = await HVTBackend.toggleReady(next);
    applyLobby(state);
  } catch (err) { showToast(err.message, true); }
  finally { readyPending = false; if (lobbyState) $('readyBtn').disabled = !!lobbyState.started || !online; }
}
async function leaveLobby() {
  const previousRoom = room, previousRole = role, previousNick = nickname;
  if (lobbyState && !lobbyState.started && lobbyState.players[role]?.ready) {
    try { await HVTBackend.toggleReady(false); } catch (_) { /* room may be gone */ }
  }
  clearTimeout(reconnectTimer);
  room = ''; role = ''; snap = null; lobbyState = null;
  sessionStorage.removeItem('hvt_player');
  await HVTBackend.leave();
  activeFX = []; lastEventId = 0;
  showPage('landing');
  refreshRooms();
}
function updateSignalPanel() {
  const signal = HVTBackend?.getSignalInfo?.() || {};
  const isHost = role === 'attacker';
  $('hostSignalPanel').classList.toggle('hidden', !isHost);
  $('guestSignalPanel').classList.toggle('hidden', isHost);
  $('offerOutput').value = signal.offer || '';
  $('answerOutput').value = signal.answer || '';
  $('copyRoomBtn').innerHTML = `${currentLang === 'zh' ? (isHost ? '复制邀请文本' : '复制答复文本') : (isHost ? 'Copy invitation' : 'Copy answer')} <icon-copy>⧉</icon-copy>`;
}
async function copyRoom() {
  const signal = HVTBackend?.getSignalInfo?.() || {};
  const text = role === 'attacker' ? signal.offer : signal.answer;
  if (!text) { showToast(tr('roomCopyManual'), true); return; }
  try { await navigator.clipboard.writeText(text); showToast(tr('roomCopied')); }
  catch (_) { showToast(tr('roomCopyManual'), true); }
}
async function acceptPeerAnswer() {
  const button = $('acceptAnswerBtn'); button.disabled = true;
  try {
    await HVTBackend.acceptAnswer($('answerInput').value);
    $('waitingHint').textContent = currentLang === 'zh' ? '答复已应用，正在建立直连。请等待连接状态变为「已连接」。' : 'Answer applied. Establishing a direct connection; wait for Connected status.';
    showToast(currentLang === 'zh' ? '答复已应用，正在连接朋友。' : 'Answer applied. Connecting to your friend.');
  } catch (err) { showToast(err.message, true); }
  finally { button.disabled = false; }
}
async function refreshRooms() {
  // No server-side room directory exists in GitHub Pages-only P2P mode.
  $('lobby').textContent = currentLang === 'zh'
    ? '本版本不使用服务器房间列表。请通过邀请文本和答复文本建立浏览器直连。'
    : 'No server-side room list is used. Exchange invitation and answer text to establish a direct browser connection.';
}
function connect() {
  if (!room || !window.HVTBackend) return;
  HVTBackend.listen(
    data => applyLobby(data),
    (state, effects) => { render(state); if (lobbyState?.started && Array.isArray(effects)) receiveEffects(effects); },
    connected => setConnection(connected)
  );
}
async function cmd(command, params = {}) {
  if (!lobbyState?.started) { showToast(tr('waitBothReady'), true); return; }
  if (commandPending) return;
  commandPending = true;
  document.querySelectorAll('#actions button').forEach(b => b.disabled = true);
  try {
    const result = await HVTBackend.sendCommand(command, params);
    if (!result.ok) showToast(translateEngineText(result.msg), true);
  } catch (err) { showToast(err.message, true); }
  finally { commandPending = false; if (snap) renderActions(); }
}
function render(state) {
  snap = state;
  $('round').textContent = tr('round', { current: state.current_round, max: state.max_rounds });
  $('phase').textContent = phaseLabel(state.phase) || state.phase;
  $('status').textContent = translateEngineText(state.status);
  $('turnHint').textContent = (role === 'attacker' ? tr('turnHintAttack') : tr('turnHintDefense'));
  const stats = $('resources'); stats.replaceChildren();
  const useful = role === 'attacker'
    ? ['attacker_human_energy', 'attacker_ai_energy', 'zombie_used']
    : ['budget', 'key', 'c2_silenced_rounds', 'zombie_max'];
  for (const key of useful) {
    const v = state.resources[key];
    const el = document.createElement('div');
    el.append(document.createTextNode(`${resourceLabel(key)}\n`));
    const b = document.createElement('b'); b.textContent = v;
    el.append(document.createElement('br'), b); stats.append(el);
  }
  const logs = $('logs');
  logs.textContent = state.logs.slice(-55).map(translateEngineText).join('\n'); logs.scrollTop = logs.scrollHeight;
  const previousSource = $('source').value;
  if (!state.node_names.includes(selected)) selected = state.node_names[0] || '';
  for (const id of ['node', 'source']) {
    const control = $(id);
    if (control.options.length !== state.node_names.length ||
        Array.from(control.options).some((o, i) => o.value !== state.node_names[i])) {
      control.replaceChildren(...state.node_names.map(n => new Option(n, n)));
    }
  }
  $('node').value = selected;
  if (state.node_names.includes(previousSource)) $('source').value = previousSource;
  renderActions(); renderGraph();
  if (state.phase === 'game_over' && !announcedGameOver) { announcedGameOver=true; showToast(tr('gameOverWinner', { winner: roleDisplay(state.winner) })); }
}
function renderActions() {
  const container = $('actions'); container.replaceChildren();
  const node = () => $('node').value, source = () => $('source').value;
  const add = (label, emoji, fn, style = '', subtitle = '', description = '') => {
    const button = document.createElement('button');
    button.className = `skill ${style}`;
    const shownCost = subtitle || tr('noCost');
    button.title = description ? `${label}｜${tr('skillCostPrefix')}${shownCost}\n${description}` : `${label}｜${tr('skillCostPrefix')}${shownCost}`;
    const icon = document.createElement('span'); icon.textContent = emoji;
    const title = document.createElement('b'); title.textContent = label;
    const cost = document.createElement('small'); cost.className = 'cost'; cost.textContent = `${tr('skillCostPrefix')}${shownCost}`;
    button.append(icon, title, cost);
    if (description) { const meta = document.createElement('small'); meta.className = 'meta'; meta.textContent = description; button.append(meta); }
    button.onclick = fn; container.append(button);
  };
  if (role === 'attacker') {
    if (snap.phase === 'setup' || snap.phase === 'round_ready') {
      add(snap.phase === 'setup' ? tr('startRoundSetup') : tr('startRoundReady'), '▶',
        () => cmd('start_round', { init_node: node(), init_state: 'active' }), 'finish', tr('free'), tr('startRoundDesc'));
    }
    if (snap.phase === 'attacker_human') {
      add(tr('activate'), '⚡', () => cmd('action', { action: 'activate', target: node() }), '', tr('activateCost'), tr('activateDesc'));
      add(tr('sleep'), '◉', () => cmd('action', { action: 'sleep', target: node() }), '', tr('sleepCost'), tr('sleepDesc'));
      add(tr('scan'), '◎', () => cmd('action', { action: 'scan', source: source(), target: node(), radius: 2 }), '', tr('scanCostAttack'), tr('scanDescAttack'));
      add(tr('zombie'), '☣', () => cmd('action', { action: 'zombie', target: node(), special_mode: 'convert' }), 'danger', tr('zombieCost'), tr('zombieDesc'));
      add(tr('precise'), '⌖', () => cmd('action', { action: 'precise', target: node(), use_all_active: true, special_mode: 'convert' }), 'danger', tr('preciseCost'), tr('preciseDesc'));
      add(tr('move_c2'), '⇄', () => cmd('action', { action: 'move_c2' }), '', tr('moveC2Cost'), tr('moveC2Desc'));
      add(tr('endAttack'), '✓', () => cmd('end_attacker'), 'finish', tr('free'), tr('endAttackDesc'));
    }
  } else {
    if (snap.awaiting_defender_prompt) {
      add(tr('allowHoneypot'), '⬡', () => cmd('honeypot_prompt', { allow: true }), '', tr('allowHoneypotCost'), tr('allowHoneypotDesc'));
      add(tr('skipHoneypot'), '➜', () => cmd('honeypot_prompt', { allow: false }), '', tr('skipHoneypotCost'), tr('skipHoneypotDesc'));
    }
    if (snap.phase === 'defender_human') {
      [
        [tr('harden'),'harden','⬡',tr('hardenCost'),tr('hardenDesc')],
        [tr('scan'),'scan','◎',tr('scanDefenseCost'),tr('scanDescDefense')],
        [tr('clear'),'clear','✧',tr('clearCost'),tr('clearDesc')],
        [tr('recapture'),'recapture','✦',tr('recaptureCost'),tr('recaptureDesc')],
        [tr('restore'),'restore','↺',tr('restoreCost'),tr('restoreDesc')]
      ].forEach(([name, action, emoji, cost, desc]) => add(name, emoji, () => cmd('action', { action, target: node() }), '', cost, desc));
      add(tr('counterC2'), '⚔', () => cmd('action', { action: 'counter_c2' }), '', tr('counterC2Cost'), tr('counterC2Desc'));
      add(tr('clean'), '◈', () => cmd('action', { action: 'clean', clean_amount: 8 }), '', tr('cleanCost'), tr('cleanDesc'));
      add(tr('endRound'), '✓', () => cmd('finish_round'), 'finish', tr('free'), tr('endRoundDesc'));
    }
  }
  if (!container.children.length) {
    const hint = document.createElement('p'); hint.className = 'muted';
    hint.textContent = snap.phase === 'game_over' ? tr('gameEnded') : tr('waitingOpponent');
    container.append(hint);
  }
}

// Offline-friendly 3D projection. The SVG is a depth-sorted vector scene:
// no remote WebGL/CDN dependency, while the original gameplay remains authoritative.
let camera = { yaw: .24, pitch: -.32, zoom: 1, panX: 0, panY: 0 };
let cameraTween = null, hitNodes = [], hoveredNode = '';
// Repeatable volumetric landmarks: no randomness during render, no server-side gameplay state.
const stars = Array.from({length: 230}, (_, i) => {
  const hash = (n) => { const v = Math.sin(n * 127.1 + 78.233) * 43758.5453; return v - Math.floor(v); };
  return [(hash(i*3+1)-.5)*4.5, (hash(i*3+2)-.5)*3.2, (hash(i*3+3)-.5)*4.2, hash(i+901)];
});
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
function cameraPoint(raw) {
  const x = raw[0] * 315, y = raw[1] * 315, z = raw[2] * 315;
  const c = Math.cos(camera.yaw), s = Math.sin(camera.yaw);
  const xx = x*c - z*s, zz = x*s + z*c;
  const cp = Math.cos(camera.pitch), sp = Math.sin(camera.pitch);
  return { x: xx, y: y*cp - zz*sp, z: y*sp + zz*cp };
}
function cameraProject(raw) {
  const p = cameraPoint(raw);
  const perspective = 900 / Math.max(210, 900 + p.z);
  return { x: 500 + camera.panX + p.x * perspective * camera.zoom,
           y: 325 + camera.panY + p.y * perspective * camera.zoom,
           z: p.z, scale: perspective * camera.zoom };
}
function svgEl(name, attrs = {}, text = null) {
  const e = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) e.setAttribute(key, value);
  if (text !== null) e.textContent = text;
  return e;
}
function renderGraph() {
  if (!snap?.nodes?.length) return;
  const pos = snap.positions || {};
  coords = {};
  for (const [name, point] of Object.entries(pos)) coords[name] = cameraProject(point);
  const graph = $('graph');
  let defs = graph.querySelector('defs');
  if (!defs) {
    defs = svgEl('defs'); graph.prepend(defs);
    for (const [name, color] of Object.entries(palette)) {
      const grad = svgEl('radialGradient', { id: 'orb-'+name, cx:'30%', cy:'22%', r:'78%' });
      grad.append(svgEl('stop', { offset:'0%', 'stop-color':'#f3ffff' }),
                  svgEl('stop', { offset:'23%', 'stop-color':color }),
                  svgEl('stop', { offset:'100%', 'stop-color':'#06111f' }));
      defs.append(grad);
    }
  }
  const edges = $('edgeLayer'), nodes = $('nodeLayer'), space = $('spaceLayer');
  edges.replaceChildren(); nodes.replaceChildren(); space.replaceChildren();
  const starFragment = document.createDocumentFragment();
  for (const star of stars) {
    const q = cameraProject(star), depth = clamp(1 - Math.abs(q.z)/1400,.16,1);
    if (q.x < -12 || q.x > 1012 || q.y < -12 || q.y > 662) continue;
    starFragment.append(svgEl('circle', {cx:q.x,cy:q.y,r:star[3]>.975?1.32:.43+.45*star[3],
      fill:star[3]>.76?'#9bdcff':'#d6ecff', opacity:(.12+star[3]*.52)*depth, class:'space-star'}));
  }
  space.append(starFragment);
  // A faint instrument range plane anchors the network in apparent 3D space.
  for (const radius of [.7,1.25,1.85]) {
    const points = Array.from({length:97},(_,i)=>{
      const a=i*Math.PI*2/96, q=cameraProject([Math.cos(a)*radius,0,Math.sin(a)*radius]);
      return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
    }).join(' ');
    space.append(svgEl('polyline',{points,class:'range-orbit'}));
  }
  for (const [u, v] of snap.edges || []) {
    const a=coords[u], b=coords[v]; if (!a || !b) continue;
    const line=svgEl('line',{class:'edge',x1:a.x,y1:a.y,x2:b.x,y2:b.y,
      opacity:clamp(.45-(a.z+b.z)/2600,.12,.65),'stroke-width':clamp(.85*(a.scale+b.scale)/2,.38,1.65)});
    edges.append(line);
  }
  hitNodes=[];
  const ordered = [...snap.nodes].filter(n=>coords[n.node]).sort((a,b)=>coords[b.node].z-coords[a.node].z);
  for (const item of ordered) {
    const p=coords[item.node], r=clamp(6.2*p.scale,3.4,12);
    const state=role === 'defender' && item.state === 'active' ? 'defenderActive' :
      (Object.prototype.hasOwnProperty.call(palette,item.state)?item.state:'DD');
    const active = item.node === selected, hovered = item.node === hoveredNode;
    const color = palette[state] || '#addef5';
    const g=svgEl('g',{class:`node${active?' selected':''}${hovered?' hovered':''}`, 'data-node':item.node});
    const glow=svgEl('circle',{class:'node-glow',cx:p.x,cy:p.y,r:r*2.1,fill:color,opacity:active?.16:.08});
    const outerRing=svgEl('circle',{class:'node-outer-ring',cx:p.x,cy:p.y,r:r+5.8,stroke:color,'stroke-opacity':active?.88:.74,'stroke-width':active?2.05:1.65,fill:'none'});
    const halo=svgEl('circle',{class:'node-halo',cx:p.x,cy:p.y,r:r+1.9,stroke:color,'stroke-opacity':hovered||active?.42:.28});
    const orb=svgEl('circle',{class:'node-shell',cx:p.x,cy:p.y,r:r+1.1,fill:'none',stroke:color,'stroke-opacity':.92,'stroke-width':1.55});
    const innerFill=svgEl('circle',{class:'node-inner-fill',cx:p.x,cy:p.y,r:Math.max(2.4,r*.74),fill:color,'fill-opacity':.11});
    const core=svgEl('circle',{class:'node-core',cx:p.x,cy:p.y,r:Math.max(1.6,r*.38),fill:color,'fill-opacity':.2,stroke:color,'stroke-opacity':.88,'stroke-width':1.1});
    const seed=svgEl('circle',{class:'node-seed',cx:p.x,cy:p.y,r:Math.max(.72,r*.11),fill:'#dffbff','fill-opacity':.95});
    const label=svgEl('text',{x:p.x-r-13.5,y:p.y+1.7,class:'node-label'},item.node.toUpperCase());
    label.setAttribute('text-anchor','end');
    const title=svgEl('title',{},`${item.node} | ${item.state} | ${item.scan||''}`);
    g.append(glow,outerRing,halo,orb,innerFill,core,seed,label,title);
    nodes.append(g);
    // Target size stays generous even when the visual marker is very small.
    hitNodes.push({ name:item.node,x:p.x,y:p.y,r:Math.max(15,r+9),z:p.z });
  }
  const focused=snap.nodes.find(n=>n.node===selected);
  $('nodeDetail').textContent=focused?`${focused.node}  /  ${focused.state}${focused.scan?'  /  '+focused.scan:''}`:tr('nodeDetailDefault');
  $('mapCount').textContent=tr('mapCountFormat', { nodes: snap.nodes.length, links: (snap.edges||[]).length });
}
function displayGeometry() {
  const rect=$('graph').getBoundingClientRect();
  const scale=Math.min(rect.width/1000,rect.height/650);
  return {rect,scale,offsetX:(rect.width-1000*scale)/2,offsetY:(rect.height-650*scale)/2};
}
function project(point) {
  const {scale,offsetX,offsetY}=frameGeometry||displayGeometry();
  return {x:point.x*scale+offsetX,y:point.y*scale+offsetY};
}
function screenNode(name) { return project(coords[name]||{x:500,y:325}); }
function mapPointer(e) {
  const {rect,scale,offsetX,offsetY}=displayGeometry();
  return {x:(e.clientX-rect.left-offsetX)/scale,y:(e.clientY-rect.top-offsetY)/scale};
}
function nearestNode(p) {
  return hitNodes.filter(n=>Math.hypot(n.x-p.x,n.y-p.y)<n.r)
    .sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
}
function focusNode(name) {
  if (!snap?.positions?.[name]) return;
  const p=cameraProject(snap.positions[name]);
  camera.panX+=500-p.x; camera.panY+=325-p.y;
  renderGraph();
}
function resetCamera() {
  camera={yaw:.24,pitch:-.32,zoom:1,panX:0,panY:0}; renderGraph();
}
$('resetCamera').addEventListener('click',resetCamera);
$('focusCamera').addEventListener('click',()=>focusNode(selected));
$('graph').addEventListener('wheel',e=>{
  e.preventDefault(); if(!snap)return;
  const p=mapPointer(e), before=(p.x-500-camera.panX)/camera.zoom;
  const beforeY=(p.y-325-camera.panY)/camera.zoom;
  camera.zoom=clamp(camera.zoom*Math.exp(-e.deltaY*.0012),.48,3.5);
  camera.panX=p.x-500-before*camera.zoom;
  camera.panY=p.y-325-beforeY*camera.zoom;
  renderGraph();
},{passive:false});
$('graph').addEventListener('pointerdown',e=>{
  if(e.button!==0 && e.button!==1 && e.button!==2)return;
  drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,pan:e.shiftKey||e.button===1||e.button===2};
  dragging=false; $('graph').setPointerCapture(e.pointerId);
});
$('graph').addEventListener('contextmenu',e=>e.preventDefault());
$('graph').addEventListener('pointermove',e=>{
  const p=mapPointer(e), nearest=nearestNode(p);
  const nextHover=nearest?.name||'';
  if (hoveredNode !== nextHover) { hoveredNode=nextHover; if (!drag) renderGraph(); }
  $('graph').style.cursor=drag?'grabbing':(nearest?'pointer':'grab');
  if(!drag)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)dragging=true;
  if(dragging){
    if(drag.pan){const {scale}=displayGeometry();camera.panX+=dx/scale;camera.panY+=dy/scale;}
    else {camera.yaw+=dx*.006;camera.pitch=clamp(camera.pitch+dy*.006,-1.35,1.35);}
    renderGraph();
  }
  drag.x=e.clientX;drag.y=e.clientY;
});
$('graph').addEventListener('pointerup',e=>{
  if(drag&&!dragging){
    const nearest=nearestNode(mapPointer(e));
    if(nearest){selected=nearest.name;$('node').value=selected;renderGraph();}
  }
  drag=null;dragging=false;
});
$('graph').addEventListener('pointercancel',()=>{drag=null;dragging=false;});
$('graph').addEventListener('dblclick',e=>{const nearest=nearestNode(mapPointer(e));if(nearest)focusNode(nearest.name);});
$('node').addEventListener('change',e=>{selected=e.target.value;renderGraph();focusNode(selected);});
// Time-based canvas effects: a traveling packet along actual network paths,
// an expanding infection shockwave, and blue/gold defensive particles.
function receiveEffects(events) {
  const now = performance.now();
  for (const item of events) {
    if (item.id <= lastEventId) continue;
    lastEventId = item.id;
    if (!['attack','infect','defend'].includes(item.type)) continue;
    const path = Array.isArray(item.path) ? item.path.filter(n => coords[n]) : [];
    const duration = item.type === 'defend' ? 1550 : item.type === 'infect' ? 2100 : 1500;
    const particles = Array.from({ length: item.type === 'defend' ? 34 : 17 }, (_, i) => ({
      angle: Math.PI * 2 * i / (item.type === 'defend' ? 34 : 17) + Math.random() * .26,
      length: .5 + Math.random() * .65,
      size: 1.1 + Math.random() * 2.9,
    }));
    activeFX.push({ type: item.type, path, start: now + Math.min(500, activeFX.length * 85), duration, particles });
    const label = item.type === 'attack' ? tr('fxAttack') :
                  item.type === 'infect' ? tr('fxInfect') : tr('fxDefend');
    showEffectNotice(label, item.type === 'defend');
  }
  if (activeFX.length > 70) activeFX = activeFX.slice(-70);
  if (!effectFrame && activeFX.length && !prefersLessMotion) effectFrame = requestAnimationFrame(drawEffects);
}
function showEffectNotice(text, defended) {
  const n = $('fxNotice'); n.textContent = text;
  n.className = `fx-notice${defended ? ' defend' : ''}`;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => n.classList.add('hidden'), 1600);
}
function resizeCanvas() {
  const canvas = $('effectsCanvas');
  const width = canvas.clientWidth, height = canvas.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return ctx;
}
function packetPosition(route, progress) {
  if (route.length === 0) return screenNode('');
  if (route.length === 1) return route[0];
  const lengths = [];
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    const delta = Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y);
    lengths.push(delta); total += delta;
  }
  let distance = Math.max(0, Math.min(1, progress)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const t = Math.min(1, distance / (lengths[i] || 1));
      return { x: route[i].x + (route[i + 1].x - route[i].x) * t,
               y: route[i].y + (route[i + 1].y - route[i].y) * t };
    }
    distance -= lengths[i];
  }
  return route[route.length - 1];
}
function glowingRing(ctx, point, radius, color, alpha, width = 2.4) {
  ctx.save(); ctx.globalAlpha = Math.max(0, alpha);
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.shadowColor = color; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function drawPacket(ctx, route, progress, color) {
  if (!route.length) return;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = .27;
  ctx.setLineDash([6, 8]); ctx.beginPath();
  route.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;
  const tail = packetPosition(route, Math.max(0, progress - .17));
  const head = packetPosition(route, progress);
  const grad = ctx.createLinearGradient(tail.x, tail.y, head.x + .01, head.y + .01);
  grad.addColorStop(0, 'transparent'); grad.addColorStop(1, color);
  ctx.strokeStyle = grad; ctx.lineWidth = 4.8; ctx.shadowColor = color; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(head.x, head.y); ctx.stroke();
  ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.arc(head.x, head.y, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawEffects(now) {
  effectFrame = 0;
  if ($('game').classList.contains('hidden')) { activeFX = []; return; }
  const ctx = resizeCanvas();
  frameGeometry = displayGeometry();
  activeFX = activeFX.filter(fx => now <= fx.start + fx.duration);
  for (const fx of activeFX) {
    const t = (now - fx.start) / fx.duration;
    if (t < 0) continue;
    const progress = Math.max(0, Math.min(1, t));
    const route = fx.path.map(screenNode);
    const target = route[route.length - 1] || screenNode('');
    if (fx.type === 'attack') {
      drawPacket(ctx, route, Math.min(1, progress * 1.6), '#ff637e');
      glowingRing(ctx, target, 22 + progress * 21, '#fa5270', (1 - progress) * .6);
    } else if (fx.type === 'infect') {
      const arrival = Math.min(1, progress * 1.65);
      drawPacket(ctx, route, arrival, '#ff4369');
      if (arrival >= .7) {
        const p = (arrival - .7) / .3;
        for (let i = 0; i < 3; i++) {
          const phase = (p + i * .27) % 1;
          glowingRing(ctx, target, 18 + phase * 72, '#ff456d', (1 - phase) * .83, 2.5);
        }
        ctx.save(); ctx.fillStyle = '#ff7693'; ctx.shadowBlur = 24; ctx.shadowColor = '#ff456d';
        for (const pt of fx.particles) {
          const rad = 12 + p * 62 * pt.length;
          ctx.globalAlpha = (1 - p) * .85;
          ctx.beginPath(); ctx.arc(target.x + Math.cos(pt.angle) * rad, target.y + Math.sin(pt.angle) * rad, pt.size * (1 - p * .5), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    } else {
      const fade = Math.pow(1 - progress, 1.5);
      glowingRing(ctx, target, 16 + progress * 83, '#6af4ff', fade * .95, 3.4);
      glowingRing(ctx, target, 9 + progress * 56, '#d6faff', fade * .83, 1.6);
      ctx.save(); ctx.shadowBlur = 13; ctx.shadowColor = '#53e9fa';
      for (const pt of fx.particles) {
        const radius = 11 + progress * 94 * pt.length;
        const x = target.x + Math.cos(pt.angle) * radius;
        const y = target.y + Math.sin(pt.angle) * radius + progress * progress * 23;
        ctx.globalAlpha = fade; ctx.fillStyle = pt.size > 2.5 ? '#d7faff' : '#54e7fc';
        ctx.beginPath(); ctx.arc(x, y, pt.size * (1 - progress * .55), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }
  frameGeometry = null;
  if (activeFX.length) effectFrame = requestAnimationFrame(drawEffects);
}

$('langToggle').addEventListener('click', () => setLanguage(currentLang === 'zh' ? 'en' : 'zh'));

(async function init() {
  applyLanguage();
  const code = sessionStorage.getItem('hvt_player');
  if (code) {
    try {
      const saved = JSON.parse(code);
      if (!/^[A-F0-9]{8}$/.test(saved.room) || !['attacker', 'defender'].includes(saved.role)) throw Error('invalid');
      room = saved.room; role = saved.role; nickname = saved.nickname || 'Player';
      $('nickname').value = nickname;
      const lobby = await HVTBackend.resume(room, role);
      await enterLobby(lobby, true);
      return;
    } catch (_) { sessionStorage.removeItem('hvt_player'); room = ''; }
  }
  showPage('landing');
  await refreshRooms();
})();

window.acceptPeerAnswer = acceptPeerAnswer;
