import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth";
import { PushListener } from "../components/PushListener";
import { colors } from "../components/ui";
export { ErrorBoundary } from "expo-router";
export const unstable_settings = { initialRouteName: "(tabs)" };

function Navigation() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  useEffect(() => {
    if (!loading && user?.needsOnboarding && segments[0] !== "onboarding")
      router.replace("/onboarding");
  }, [user?.needsOnboarding, loading, segments]);
  if (loading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.paper,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          color={colors.green}
          accessibilityLabel="Menyiapkan Manaseek"
        />
      </View>
    );
  return (
    <>
      <StatusBar style="light" />
      <Stack
        key={user?.id ?? "guest"}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ presentation: "modal" }} />
      </Stack>
      <PushListener />
    </>
  );
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
