import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ChecklistSync,
  type ChecklistSnapshot,
} from "../src/lib/checklist-sync";
import type { Checklist } from "../src/lib/models";
const checklist = (completed = false): Checklist => ({
  items: [{ id: "passport", title: "Paspor", category: "DOCUMENT", completed }],
  meta: { total: 1, completed: completed ? 1 : 0 },
});
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
test("offline edits survive restart and replay as idempotent PUTs", async () => {
  let disk: ChecklistSnapshot = { data: checklist(), pending: {} };
  const store = {
    read: async () => copy(disk),
    write: async (value: ChecklistSnapshot) => {
      disk = copy(value);
    },
  };
  const offline = new ChecklistSync(store, async () => {
    throw new Error("offline");
  });
  await offline.load();
  await offline.tick("passport", true, "first");
  await assert.rejects(offline.sync());
  assert.equal(disk.pending.passport.completed, true);
  const requests: boolean[] = [];
  const online = new ChecklistSync(store, async (_id, checked) => {
    requests.push(checked);
    return checklist(checked);
  });
  await online.load();
  await online.sync();
  assert.deepEqual(requests, [true]);
  assert.deepEqual(disk.pending, {});
  assert.equal(disk.data?.items[0].completed, true);
});
test("an edit made during a sync is not discarded by the older response", async () => {
  let disk: ChecklistSnapshot = { data: checklist(), pending: {} };
  let release!: (value: Checklist) => void;
  let entered!: () => void;
  const started = new Promise<void>((r) => {
    entered = r;
  });
  const response = new Promise<Checklist>((r) => {
    release = r;
  });
  const requests: boolean[] = [];
  const queue = new ChecklistSync(
    {
      read: async () => copy(disk),
      write: async (value) => {
        disk = copy(value);
      },
    },
    async (_id, checked) => {
      requests.push(checked);
      if (requests.length === 1) {
        entered();
        return response;
      }
      return checklist(checked);
    },
  );
  await queue.load();
  await queue.tick("passport", true, "first");
  const syncing = queue.sync();
  await started;
  await queue.tick("passport", false, "second");
  release(checklist(true));
  await syncing;
  assert.deepEqual(requests, [true, false]);
  assert.equal(disk.data?.items[0].completed, false);
  assert.deepEqual(disk.pending, {});
});
test("sync stops when the authenticated account changes", async () => {
  let calls = 0;
  const queue = new ChecklistSync(
    { read: async () => null, write: async () => {} },
    async () => {
      calls++;
      return checklist(true);
    },
  );
  await queue.tick("passport", true, "first");
  await queue.sync(() => false);
  assert.equal(calls, 0);
  assert.equal(queue.snapshot.pending.passport.completed, true);
});
