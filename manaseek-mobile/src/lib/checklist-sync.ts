import type { Checklist } from "./models";
export type PendingTick = { completed: boolean; revision: string };
export type ChecklistSnapshot = {
  data: Checklist | null;
  pending: Record<string, PendingTick>;
};
export interface ChecklistStorage {
  read(): Promise<ChecklistSnapshot | null>;
  write(value: ChecklistSnapshot): Promise<void>;
}

/** Serializes local writes and keeps a newer offline edit when an older PUT finishes. */
export class ChecklistSync {
  private state: ChecklistSnapshot = { data: null, pending: {} };
  private writes = Promise.resolve();
  private syncing: Promise<void> | null = null;
  private listeners = new Set<(value: ChecklistSnapshot) => void>();
  subscribe(listener: (value: ChecklistSnapshot) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }
  constructor(
    private store: ChecklistStorage,
    private send: (id: string, completed: boolean) => Promise<Checklist>,
  ) {}
  get snapshot() {
    return this.state;
  }
  async load() {
    this.state = (await this.store.read()) ?? this.state;
    this.notify();
  }
  private async publish() {
    const snapshot = JSON.parse(
      JSON.stringify(this.state),
    ) as ChecklistSnapshot;
    const write = this.writes
      .catch(() => {})
      .then(() => this.store.write(snapshot));
    this.writes = write;
    await write;
    this.notify();
  }
  async replace(data: Checklist) {
    this.state = { ...this.state, data };
    await this.publish();
  }
  async tick(id: string, completed: boolean, revision: string) {
    this.state = {
      ...this.state,
      pending: { ...this.state.pending, [id]: { completed, revision } },
    };
    await this.publish();
  }
  async sync(isCurrent: () => boolean = () => true) {
    if (this.syncing) return this.syncing;
    const task = (async () => {
      while (isCurrent()) {
        const entry = Object.entries(this.state.pending)[0];
        if (!entry) return;
        const [id, tick] = entry;
        const data = await this.send(id, tick.completed);
        if (!isCurrent()) return;
        const pending = { ...this.state.pending };
        if (pending[id]?.revision === tick.revision) delete pending[id];
        this.state = { data, pending };
        await this.publish();
      }
    })();
    this.syncing = task;
    try {
      await task;
    } finally {
      if (this.syncing === task) this.syncing = null;
    }
  }
}
