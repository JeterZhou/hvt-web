/*
 * v3 experimental deployment configuration.
 * Only PUBLIC identifiers belong here. Never put TURN shared secrets or Tencent
 * Cloud secretId/secretKey in a static webpage or source repository.
 */
export const ONLINE_CONFIG = Object.freeze({
  env: 'hvt-web-d4gmwj3wb42ec6d22',                        // CloudBase full environment ID, e.g. example-123abc
  publishableKey: '',             // CloudBase Publishable Key (NOT a secret key)
  functionName: 'hvt-lobby',
  sdkUrl: './cloudbase.full.js',
});
