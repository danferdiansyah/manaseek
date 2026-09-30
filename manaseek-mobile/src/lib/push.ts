import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";
import { storage } from "./storage";

export const pushConfigured =
  Platform.OS === "android" &&
  Constants.expoConfig?.extra?.pushConfigured === true;
export async function registerPush(userId: string, ask = false) {
  if (!pushConfigured)
    throw new Error(
      "Notifikasi perangkat belum tersedia pada versi aplikasi ini. Riwayat notifikasi tetap dapat dibuka.",
    );
  const version = api.sessionVersion;
  await Notifications.setNotificationChannelAsync("bookings", {
    name: "Pendampingan & perjalanan",
    importance: Notifications.AndroidImportance.HIGH,
  });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && ask)
    permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      "Izin notifikasi belum diberikan. Kamu bisa mengaktifkannya melalui pengaturan ponsel.",
    );
  const token = await Notifications.getDevicePushTokenAsync();
  if (version !== api.sessionVersion) return;
  await savePush(userId, String(token.data));
}
export async function savePush(userId: string, token: string) {
  await api.post("/notifications/devices", { token, platform: "ANDROID" });
  await storage.set(`user:${userId}:push`, token);
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function bookingFromNotification(
  data: Record<string, unknown>,
): string | null {
  return typeof data.bookingId === "string" && uuid.test(data.bookingId)
    ? data.bookingId
    : null;
}
