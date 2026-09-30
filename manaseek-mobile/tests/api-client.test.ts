import { test } from "node:test";
import assert from "node:assert/strict";
import { ApiClient, ApiError, type Tokens } from "../src/lib/api-client";

const original = { accessToken: "old-access", refreshToken: "old-refresh" };
const rotated = { accessToken: "new-access", refreshToken: "new-refresh" };
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
const expired = () =>
  json({ error: { code: "TOKEN_INVALID", message: "Expired" } }, 401);
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
function create(transport: typeof fetch) {
  let saved: Tokens | null = { ...original };
  const client = new ApiClient(
    "https://api.example.test/api",
    {
      read: async () => saved,
      write: async (value) => {
        saved = value;
      },
    },
    transport,
  );
  return { client, saved: () => saved };
}
test("concurrent expired requests rotate once and retry with the new token", async () => {
  let refreshes = 0;
  const { client, saved } = create(async (url, init) => {
    if (String(url).endsWith("/auth/refresh")) {
      refreshes++;
      await new Promise((r) => setTimeout(r, 15));
      assert.equal(
        JSON.parse(String(init?.body)).refreshToken,
        original.refreshToken,
      );
      return json(rotated);
    }
    if (
      (init?.headers as Record<string, string>).Authorization ===
      "Bearer old-access"
    )
      return expired();
    return json({ ok: true });
  });
  const results = await Promise.all(
    Array.from({ length: 12 }, () => client.get("/users/me")),
  );
  assert.equal(refreshes, 1);
  assert.equal(results.length, 12);
  assert.deepEqual(saved(), rotated);
});
test("a delayed 401 reuses the completed rotation instead of rotating again", async () => {
  const late = deferred<Response>();
  let refreshes = 0;
  let requests = 0;
  const { client } = create(async (url, init) => {
    if (String(url).endsWith("/auth/refresh")) {
      refreshes++;
      return json(rotated);
    }
    if (
      (init?.headers as Record<string, string>).Authorization ===
      "Bearer old-access"
    )
      return ++requests === 1 ? late.promise : expired();
    return json({ ok: true });
  });
  const one = client.get("/one");
  await client.get("/two");
  late.resolve(expired());
  await one;
  assert.equal(refreshes, 1);
});
test("losing connectivity during refresh preserves the session for reconnect", async () => {
  const { client, saved } = create(async (url) => {
    if (String(url).endsWith("/auth/refresh")) throw new TypeError("offline");
    return expired();
  });
  let invalidated = false;
  client.onExpired = () => {
    invalidated = true;
  };
  await assert.rejects(
    client.get("/me"),
    (e: ApiError) => e.code === "NETWORK_ERROR",
  );
  assert.deepEqual(saved(), original);
  assert.equal(invalidated, false);
});
test("a revoked refresh clears the session exactly once", async () => {
  const { client, saved } = create(async () => expired());
  let invalidations = 0;
  client.onExpired = () => {
    invalidations++;
  };
  await assert.rejects(client.get("/me"));
  assert.equal(saved(), null);
  assert.equal(invalidations, 1);
});
test("logout during an in-flight refresh cannot resurrect the old account", async () => {
  const wait = deferred<Response>();
  const entered = deferred<void>();
  const { client, saved } = create(async (url) => {
    if (String(url).endsWith("/auth/refresh")) {
      entered.resolve();
      return wait.promise;
    }
    return expired();
  });
  const result = assert.rejects(
    client.get("/me"),
    (e: ApiError) => e.code === "SESSION_CHANGED",
  );
  await entered.promise;
  await client.setSession(null);
  wait.resolve(json(rotated));
  await result;
  assert.equal(saved(), null);
  assert.equal(client.session, null);
});
test("an old account response cannot be rendered after switching accounts", async () => {
  const wait = deferred<Response>();
  const entered = deferred<void>();
  const { client, saved } = create(async () => {
    entered.resolve();
    return wait.promise;
  });
  const result = assert.rejects(
    client.get("/private"),
    (e: ApiError) => e.code === "SESSION_CHANGED",
  );
  await entered.promise;
  const other = { accessToken: "other-access", refreshToken: "other-refresh" };
  await client.setSession(other);
  wait.resolve(json({ personal: "old account" }));
  await result;
  assert.deepEqual(saved(), other);
});
test("business failures never replay mutations automatically", async () => {
  let calls = 0;
  const { client } = create(async () => {
    calls++;
    return json(
      { error: { code: "CONFLICT", message: "Seats sold out" } },
      409,
    );
  });
  await assert.rejects(
    client.post("/umrah/orders", { requestId: "same-id" }),
    (e: ApiError) => e.code === "CONFLICT",
  );
  assert.equal(calls, 1);
});

test("fetch is invoked without binding the API client as its receiver", async () => {
  const { client } = create(async function (this: unknown) {
    assert.equal(this, undefined);
    return json({ ok: true });
  });
  assert.deepEqual(await client.get("/me"), { ok: true });
});
test("public login rejection does not rotate an existing session", async () => {
  let calls = 0;
  const { client, saved } = create(async (_url, init) => {
    calls++;
    assert.equal(
      (init?.headers as Record<string, string>).Authorization,
      undefined,
    );
    return expired();
  });
  await assert.rejects(
    client.post("/auth/google", { idToken: "bad" }, { public: true }),
  );
  assert.equal(calls, 1);
  assert.deepEqual(saved(), original);
});
