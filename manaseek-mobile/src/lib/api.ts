import { secure } from "./secure";
import { ApiClient, type Tokens } from "./api-client";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "https://manaseek-api.vercel.app/api"
).replace(/\/$/, "");
if (
  !API_URL.startsWith("https://") &&
  !(__DEV__ && API_URL.startsWith("http://"))
)
  throw new Error("EXPO_PUBLIC_API_URL harus memakai HTTPS.");
const KEY = "manaseek.session.v1";
export const api = new ApiClient(API_URL, {
  async read() {
    const value = await secure.get(KEY);
    try {
      const parsed = value ? (JSON.parse(value) as Tokens) : null;
      return parsed?.accessToken && parsed.refreshToken ? parsed : null;
    } catch {
      await secure.remove(KEY);
      return null;
    }
  },
  async write(tokens) {
    if (tokens) await secure.set(KEY, JSON.stringify(tokens));
    else await secure.remove(KEY);
  },
});
export { ApiError, errorMessage } from "./api-client";
