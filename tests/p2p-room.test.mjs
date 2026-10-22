import assert from 'node:assert/strict';
import test from 'node:test';
import { HVTBackend } from '../js/p2p-room.js';

class FakeDataChannel {
  constructor() { this.readyState = 'connecting'; this.messages = []; }
  send(message) { this.messages.push(message); }
  close() { this.readyState = 'closed'; this.onclose?.(); }
}
class FakePeerConnection {
  static instances = [];
  constructor() {
    this.signalingState = 'stable';
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
    this.iceGatheringState = 'complete';
    this.remoteSets = 0;
    FakePeerConnection.instances.push(this);
  }
  createDataChannel() { return (this.dataChannel = new FakeDataChannel()); }
  async createOffer() { return { type: 'offer', sdp: 'test-offer' }; }
  async setLocalDescription(description) {
    this.localDescription = description;
    this.signalingState = 'have-local-offer';
  }
  async setRemoteDescription(description) {
    this.remoteSets++;
    if (this.signalingState !== 'have-local-offer') throw new Error('Called in wrong state: stable');
    this.remoteDescription = description;
    this.signalingState = 'stable';
  }
  close() {
    this.connectionState = 'closed';
    this.onconnectionstatechange?.();
  }
}

test('an Answer is applied only once, and connection states distinguish waiting/connected/failed', async () => {
  globalThis.window = { RTCPeerConnection: FakePeerConnection };
  globalThis.RTCPeerConnection = FakePeerConnection;
  try {
    await HVTBackend.createRoom('Tester');
    const connection = FakePeerConnection.instances.at(-1);
    const states = [];
    const onlineStates = [];
    HVTBackend.listen(() => {}, () => {}, value => onlineStates.push(value), value => states.push(value));
    assert.equal(HVTBackend.getConnectionInfo().status, 'waiting-answer');
    const answer = JSON.stringify({ type: 'answer', sdp: 'test-answer' });
    assert.equal(await HVTBackend.acceptAnswer(answer), true);
    assert.equal(await HVTBackend.acceptAnswer(answer), false);
    assert.equal(connection.remoteSets, 1);
    assert.equal(HVTBackend.getConnectionInfo().answerApplied, true);
    assert.equal(connection.signalingState, 'stable');
    assert.equal(HVTBackend.getConnectionInfo().status, 'connecting');

    connection.connectionState = 'connected';
    connection.iceConnectionState = 'connected';
    connection.dataChannel.readyState = 'open';
    connection.dataChannel.onopen();
    connection.onconnectionstatechange();
    assert.equal(HVTBackend.getConnectionInfo().status, 'connected');
    assert.equal(HVTBackend.getConnectionInfo().connected, true);

    connection.connectionState = 'failed';
    connection.iceConnectionState = 'failed';
    connection.oniceconnectionstatechange();
    assert.equal(HVTBackend.getConnectionInfo().status, 'failed');
    assert.equal(HVTBackend.getConnectionInfo().connected, false);
    assert.deepEqual(states, ['waiting-answer', 'connecting', 'connected', 'failed']);
    assert.deepEqual(onlineStates, [false, true, false]);
    await HVTBackend.leave();
    assert.equal(HVTBackend.getConnectionInfo().status, 'idle');
  } finally {
    await HVTBackend.leave();
    delete globalThis.window;
    delete globalThis.RTCPeerConnection;
  }
});

test('invalid Answer can be retried without corrupting the host state', async () => {
  globalThis.window = { RTCPeerConnection: FakePeerConnection };
  globalThis.RTCPeerConnection = FakePeerConnection;
  try {
    await HVTBackend.createRoom('Tester');
    await assert.rejects(HVTBackend.acceptAnswer('{invalid}'), /JSON/);
    assert.equal(HVTBackend.getConnectionInfo().answerApplied, false);
    assert.equal(await HVTBackend.acceptAnswer(JSON.stringify({ type: 'answer', sdp: 'test-answer' })), true);
  } finally {
    await HVTBackend.leave();
    delete globalThis.window;
    delete globalThis.RTCPeerConnection;
  }
});
