import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(`manaseek:${key}`);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown) {
    await AsyncStorage.setItem(`manaseek:${key}`, JSON.stringify(value));
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(`manaseek:${key}`);
  },
  async clearUser(id: string) {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
      k.startsWith(`manaseek:user:${id}:`),
    );
    if (keys.length) await AsyncStorage.multiRemove(keys);
  },
};
