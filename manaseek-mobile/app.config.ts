import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Manaseek",
  slug: "manaseek-mobile",
  version: "1.0.0",
  scheme: "manaseek",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/mark.png",
  android: {
    package: "id.manaseek.app",
    versionCode: 1,
    ...(process.env.GOOGLE_SERVICES_JSON
      ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
      : {}),
    adaptiveIcon: {
      foregroundImage: "./assets/mark.png",
      backgroundColor: "#F7F5EE",
    },
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "POST_NOTIFICATIONS",
    ],
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
    ],
  },
  ios: { bundleIdentifier: "id.manaseek.app", supportsTablet: true },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Manaseek memakai lokasi untuk waktu shalat, kiblat, dan mutawif terdekat.",
      },
    ],
    ["expo-notifications", { color: "#145B40", defaultChannel: "bookings" }],
    "@react-native-google-signin/google-signin",
  ],
  experiments: { typedRoutes: true },
  extra: { pushConfigured: Boolean(process.env.GOOGLE_SERVICES_JSON) },
};
export default config;
