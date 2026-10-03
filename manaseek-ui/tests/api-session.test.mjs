import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const originalFetch = globalThis.fetch;
const originalStorage = globalThis.localStorage;
afterEach(() => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage; });
const old = { accessToken: 'old-access', refreshToken: 'old-refresh' };
const fresh = { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
const expired = () => json({ error: { code: 'TOKEN_INVALID', message: 'Expired' } }, 401);
function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { resolve, promise };
}
async function setup(fetcher) {
  const data = new Map();
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  globalThis.fetch = fetcher;
  const client = await import(`../src/lib/api.js?test=${Math.random()}`);
  client.saveTokens(old);
  return client;
}

test('simultaneous expired requests share one refresh', async () => {
  let refreshes = 0;
  const wait = deferred();
  const client = await setup(async (url, init) => {
    if (url.endsWith('/auth/refresh')) { refreshes++; await wait.promise; return json(fresh); }
    return init.headers.authorization === 'Bearer old-access' ? expired() : json({ ok: true });
  });
  const requests = Array.from({ length: 12 }, () => client.api.get('/private'));
  await new Promise(r => setTimeout(r, 20));
  wait.resolve();
  assert.equal((await Promise.all(requests)).length, 12);
  assert.equal(refreshes, 1);
  assert.deepEqual(client.getTokens(), fresh);
});

test('late 401 reuses a token that has already rotated', async () => {
  let refreshes = 0;
  const delayed = deferred();
  const client = await setup(async (url, init) => {
    if (url.endsWith('/auth/refresh')) { refreshes++; return json(fresh); }
    if (init.headers.authorization === 'Bearer old-access') return url.endsWith('/late') ? delayed.promise : expired();
    return json({ ok: true });
  });
  const late = client.api.get('/late');
  await client.api.get('/first');
  delayed.resolve(expired());
  await late;
  assert.equal(refreshes, 1);
});

test('logout while refreshing cannot resurrect old credentials', async () => {
  const started = deferred();
  const response = deferred();
  const client = await setup(async url => {
    if (url.endsWith('/auth/refresh')) { started.resolve(); return response.promise; }
    return expired();
  });
  const pending = client.api.get('/private');
  const rejection = assert.rejects(pending, { code: 'SESSION_CHANGED' });
  await started.promise;
  client.clearTokens();
  response.resolve(json(fresh));
  await rejection;
  assert.deepEqual(client.getTokens(), { accessToken: null, refreshToken: null });
});

test('an old account response cannot populate a newly signed-in account', async () => {
  const response = deferred();
  const client = await setup(async () => response.promise);
  const pending = client.api.get('/private');
  client.saveTokens({ accessToken: 'other-access', refreshToken: 'other-refresh' });
  response.resolve(json({ private: 'old user' }));
  await assert.rejects(pending, { code: 'SESSION_CHANGED' });
  assert.equal(client.getTokens().accessToken, 'other-access');
});

test('a temporary refresh failure preserves the session', async () => {
  const client = await setup(async url => url.endsWith('/auth/refresh')
    ? json({ error: { code: 'INTERNAL_ERROR', message: 'Temporary outage' } }, 503) : expired());
  let logouts = 0;
  client.setUnauthenticatedHandler(() => logouts++);
  await assert.rejects(client.api.get('/private'), { status: 503 });
  assert.deepEqual(client.getTokens(), old);
  assert.equal(logouts, 0);
});

test('AI permission rejection is not a logout', async () => {
  const client = await setup(async () => json({ error: { code: 'AI_ACCESS_DENIED', message: 'Restricted' } }, 403));
  await assert.rejects(client.api.get('/chat/sessions'), { code: 'AI_ACCESS_DENIED' });
  assert.deepEqual(client.getTokens(), old);
});
