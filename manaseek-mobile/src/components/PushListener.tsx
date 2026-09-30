import { useEffect } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import {
  bookingFromNotification,
  pushConfigured,
  registerPush,
  savePush,
} from "../lib/push";

export function PushListener() {
  const { user } = useAuth();
  const userId = user?.id;
  useEffect(() => {
    if (!pushConfigured || !userId) return;
    const version = api.sessionVersion;
    let active = true;
    let handled: string | undefined;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    const register = () => {
      if (active && version === api.sessionVersion)
        void registerPush(userId).catch(() => {});
    };
    register();
    const navigate = (response: Notifications.NotificationResponse | null) => {
      if (
        !active ||
        !response ||
        api.sessionVersion !== version ||
        handled === response.notification.request.identifier
      )
        return;
      handled = response.notification.request.identifier;
      const id = bookingFromNotification(
        response.notification.request.content.data ?? {},
      );
      if (id) router.push({ pathname: "/bookings/[id]", params: { id } });
      else router.push("/notifications");
      void Notifications.clearLastNotificationResponseAsync();
    };
    const tap = Notifications.addNotificationResponseReceivedListener(navigate);
    void Notifications.getLastNotificationResponseAsync()
      .then(navigate)
      .catch(() => {});
    const token = Notifications.addPushTokenListener((value) => {
      if (active && version === api.sessionVersion)
        void savePush(userId, String(value.data)).catch(() => {});
    });
    const foreground = AppState.addEventListener("change", (s) => {
      if (s === "active") register();
    });
    return () => {
      active = false;
      tap.remove();
      token.remove();
      foreground.remove();
    };
  }, [userId]);
  return null;
}
