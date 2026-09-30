import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { api, ApiError, errorMessage } from "./api";
import { storage } from "./storage";
import { secure } from "./secure";
import type { Tokens } from "./api-client";
import type { User } from "./models";

type Session = Tokens & { user: User };
type Auth = {
  user: User | null;
  loading: boolean;
  issue: string | null;
  accept(session: Session): Promise<void>;
  refresh(): Promise<void>;
  logout(): Promise<void>;
};
const Context = createContext<Auth>(null!);
export const useAuth = () => useContext(Context);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState<string | null>(null);
  const update = useCallback((value: User | null) => {
    userRef.current = value;
    setUser(value);
  }, []);
  const refresh = useCallback(async () => {
    if (!api.session) return;
    const version = api.sessionVersion;
    try {
      const me = await api.get<User>("/auth/me");
      if (version !== api.sessionVersion) return;
      await storage.set("profile", me);
      if (version !== api.sessionVersion) return;
      update(me);
      setIssue(null);
    } catch (error) {
      if (version !== api.sessionVersion) return;
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        await api.setSession(null);
        await storage.remove("profile");
        update(null);
      } else
        setIssue("Sedang offline. Fitur yang tersimpan tetap dapat dibuka.");
    }
  }, [update]);
  useEffect(() => {
    api.onExpired = () => {
      const id = userRef.current?.id;
      update(null);
      void storage.remove("profile");
      if (id) void storage.clearUser(id);
    };
    void (async () => {
      try {
        await api.ready;
        if (api.session) {
          update(await storage.get<User>("profile"));
          // Show local tools/cache immediately while connectivity is checked.
          void refresh();
        }
      } catch (error) {
        setIssue(errorMessage(error));
      } finally {
        setLoading(false);
      }
    })();
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => listener.remove();
  }, [refresh, update]);
  async function accept(session: Session) {
    await api.setSession(session);
    await storage.set("profile", session.user);
    update(session.user);
    setIssue(null);
    await refresh();
  }
  async function logout() {
    const id = userRef.current?.id;
    const refreshToken = api.session?.refreshToken;
    const device = id ? await storage.get<string>(`user:${id}:push`) : null;
    if (device)
      await api
        .delete("/notifications/devices", { token: device })
        .catch(() => {});
    if (refreshToken)
      await api.post("/auth/logout", { refreshToken }).catch(() => {});
    await api.setSession(null);
    await storage.remove("profile");
    if (id) {
      await storage.clearUser(id);
      await secure.remove(`manaseek.order.${id}`);
    }
    update(null);
    setIssue(null);
  }
  return (
    <Context.Provider value={{ user, loading, issue, accept, refresh, logout }}>
      {children}
    </Context.Provider>
  );
}
