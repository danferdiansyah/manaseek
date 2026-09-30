import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { api, ApiError, errorMessage } from "./api";
import { useAuth } from "./auth";
import { storage } from "./storage";

export function useResource<T>(path: string | null, cache = false) {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const run = useRef(0);
  const scope = user?.id;
  const reload = useCallback(async () => {
    const ticket = ++run.current;
    if (!path || !scope) {
      setData(null);
      setLoading(false);
      return;
    }
    const key = `user:${scope}:cache:${path}`;
    setLoading(true);
    setError(null);
    const cached = cache ? await storage.get<T>(key).catch(() => null) : null;
    if (run.current !== ticket) return;
    if (cached) setData(cached);
    try {
      const result = await api.get<T>(path);
      if (run.current !== ticket) return;
      if (cache) await storage.set(key, result).catch(() => {});
      if (run.current !== ticket) return;
      setData(result);
      setOffline(false);
    } catch (e) {
      if (run.current !== ticket) return;
      if (
        cached &&
        e instanceof ApiError &&
        (e.status === 0 || e.status >= 500)
      ) {
        setData(cached);
        setOffline(true);
      } else {
        setData(null);
        setOffline(false);
        setError(errorMessage(e));
      }
    } finally {
      if (run.current === ticket) setLoading(false);
    }
  }, [path, scope, cache]);
  const invalidate = useCallback(() => {
    run.current++;
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setData(null);
      setOffline(false);
      void reload();
    }, 0);
    return () => {
      clearTimeout(timer);
      invalidate();
    };
  }, [reload, invalidate]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void reload();
    });
    let wasOffline = false;
    const network = NetInfo.addEventListener((state) => {
      const connected =
        state.isConnected !== false && state.isInternetReachable !== false;
      if (connected && wasOffline) void reload();
      wasOffline = !connected;
    });
    return () => {
      sub.remove();
      network();
    };
  }, [reload]);
  return { data, loading, error, offline, reload, setData };
}
