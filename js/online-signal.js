import { ONLINE_CONFIG } from './online-config.js';
let clientPromise;
const enabled = () => !!ONLINE_CONFIG.env.trim();
function importSdk() {
  if (globalThis.cloudbase?.init) return Promise.resolve();
  if (typeof document === 'undefined') throw Error('CloudBase SDK requires a browser.');
  const sources = [ONLINE_CONFIG.sdkUrl, 'https://static.cloudbase.net/cloudbase-js-sdk/latest/cloudbase.full.js'];
  const tryLoad = url => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url; script.async = true;
    const timeout = setTimeout(() => { script.remove(); reject(Error('SDK loading timeout: ' + url)); }, 15000);
    script.onload = () => {clearTimeout(timeout);globalThis.cloudbase?.init ? resolve() : reject(Error('SDK global missing: ' + url));};
    script.onerror = () => {clearTimeout(timeout);script.remove();reject(Error('SDK loading failed: ' + url));};
    document.head.append(script);
  });
  return sources.reduce((p,url) => p.catch(() => tryLoad(url)), Promise.reject(Error('No SDK loaded')))
    .catch(() => {throw Error('CloudBase SDK could not load. Upload cloudbase.full.js next to index.html.');});
}

async function client() {
  if (!enabled()) throw Error('尚未配置 CloudBase 环境 ID，请先填写 js/online-config.js。');
  if (!clientPromise) clientPromise = (async () => {
    await importSdk();
    const config = { env: ONLINE_CONFIG.env };
    if (ONLINE_CONFIG.publishableKey) config.accessKey = ONLINE_CONFIG.publishableKey;
    const app = globalThis.cloudbase.init(config);
    const signedIn = await app.auth().signInAnonymously();
    if (signedIn?.error) throw Error(signedIn.error.message || 'CloudBase 匿名登录失败');
    return app;
  })().catch(error => { clientPromise = undefined; throw error; });
  return clientPromise;
}
async function call(action, data = {}) {
  const app = await client();
  const response = await app.callFunction({ name: ONLINE_CONFIG.functionName, data: { action, ...data } });
  if (response?.code) throw Error(response.message || response.code);
  const value = typeof response?.result === 'string' ? JSON.parse(response.result) : response?.result;
  if (!value?.ok) throw Error(value?.error || 'CloudBase 信令服务返回异常。');
  return value.data || {};
}
export const OnlineSignal = { enabled, call };
