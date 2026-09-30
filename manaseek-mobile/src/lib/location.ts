import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import { useIsFocused } from "expo-router";
import { storage } from "./storage";

export type Position = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
  label: string;
};
export function usePosition() {
  const focused = useIsFocused();
  const [position, setPosition] = useState<Position | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  const refresh = useCallback(async () => {
    const ticket = ++generation.current;
    setBusy(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          "Izin lokasi belum diberikan. Aktifkan lewat pengaturan ponsel atau pilih kota.",
        );
      const fix = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Lokasi belum ditemukan. Coba di area terbuka atau pilih kota.",
                ),
              ),
            18000,
          ),
        ),
      ]);
      if (!mounted.current || ticket !== generation.current) return;
      const next = {
        ...fix.coords,
        timestamp: fix.timestamp,
        label: "Lokasi perangkat",
      };
      setPosition(next);
      await storage.set("location", next);
    } catch (e) {
      if (mounted.current && ticket === generation.current)
        setError(e instanceof Error ? e.message : "Lokasi belum tersedia.");
    } finally {
      if (mounted.current && ticket === generation.current) setBusy(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidate();
    };
  }, [invalidate]);
  useEffect(() => {
    if (!focused) return;
    let active = true;
    const ticket = generation.current;
    void storage
      .get<Position>("location")
      .then((p) => {
        if (active && ticket === generation.current) setPosition(p);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [focused]);
  const select = (latitude: number, longitude: number, label: string) => {
    generation.current++;
    const next = {
      latitude,
      longitude,
      label,
      accuracy: null,
      timestamp: Date.now(),
    };
    setPosition(next);
    setBusy(false);
    setError(null);
    void storage
      .set("location", next)
      .catch(() =>
        setError(
          "Lokasi dipakai saat ini, tetapi belum tersimpan di perangkat.",
        ),
      );
  };
  return { position, busy, error, refresh, select };
}

export function useHeading(enabled: boolean) {
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let watcher: Location.LocationSubscription | undefined;
    let serial = 0;
    async function start() {
      const ticket = ++serial;
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted || disposed || ticket !== serial) return;
      const sub = await Location.watchHeadingAsync((value) => {
        setHeading(value.trueHeading >= 0 ? value.trueHeading : null);
        setAccuracy(value.accuracy);
      });
      if (disposed || ticket !== serial) sub.remove();
      else watcher = sub;
    }
    void start().catch(() => setHeading(null));
    const state = AppState.addEventListener("change", (value) => {
      serial++;
      watcher?.remove();
      watcher = undefined;
      if (value === "active") void start().catch(() => setHeading(null));
    });
    return () => {
      disposed = true;
      serial++;
      watcher?.remove();
      state.remove();
    };
  }, [enabled]);
  return { heading, accuracy };
}
