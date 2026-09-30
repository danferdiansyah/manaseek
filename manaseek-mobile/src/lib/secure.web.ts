// Browser preview only: credentials live in memory and disappear on refresh.
// Android/iOS resolve secure.ts, which uses the OS encrypted credential store.
const values = new Map<string, string>();
export const secure = {
  async get(key: string) {
    return values.get(key) ?? null;
  },
  async set(key: string, value: string) {
    values.set(key, value);
  },
  async remove(key: string) {
    values.delete(key);
  },
};
