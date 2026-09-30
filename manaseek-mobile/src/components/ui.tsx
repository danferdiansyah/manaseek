import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";

export const colors = {
  green: "#145B40",
  dark: "#103D2D",
  gold: "#AA8246",
  paper: "#F7F5EE",
  ink: "#203D30",
  muted: "#63766A",
  line: "#DFE7DF",
  light: "#EAF2E9",
  red: "#A53B35",
};
export const s = StyleSheet.create({
  text: { color: colors.ink, fontSize: 15, lineHeight: 23 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, lineHeight: 30 },
  subtitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
    lineHeight: 25,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderColor: colors.line,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: "#FFF",
  },
  button: {
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green,
  },
  buttonText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
  },
});
export function Body({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return <Text style={muted ? s.muted : s.text}>{children}</Text>;
}
export function Title({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={s.subtitle}>
      {children}
    </Text>
  );
}
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Button({
  title,
  onPress,
  busy,
  disabled,
  secondary = false,
}: {
  title: string;
  onPress(): void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.button,
        secondary && { backgroundColor: colors.light },
        { opacity: disabled || busy ? 0.5 : pressed ? 0.75 : 1 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? colors.green : "#FFF"} />
      ) : (
        <Text style={[s.buttonText, secondary && { color: colors.green }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.muted}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#89978D"
        style={[
          s.input,
          props.multiline && { minHeight: 90, textAlignVertical: "top" },
        ]}
        {...props}
      />
    </View>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <View
      accessibilityRole={error ? "alert" : undefined}
      style={{
        backgroundColor: error ? "#FBEAE6" : "#FFF2D8",
        padding: 14,
        borderRadius: 14,
      }}
    >
      <Text
        style={{
          color: error ? colors.red : "#785D2E",
          fontSize: 13,
          lineHeight: 20,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
export function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: selected ? colors.green : "#FFF",
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      <Text
        style={{ color: selected ? "#FFF" : colors.ink, fontWeight: "600" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function RowLink({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href: Href;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={[s.card, s.between]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Title>{title}</Title>
        {subtitle ? <Body muted>{subtitle}</Body> : null}
      </View>
      <Text style={{ fontSize: 23, color: colors.green }}>›</Text>
    </Pressable>
  );
}
export function Page({
  title,
  eyebrow = "MANASEEK",
  subtitle,
  children,
  back = false,
  refreshing = false,
  onRefresh,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  children: ReactNode;
  back?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const inset = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: Math.max(28, inset.bottom + 16),
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.green}
            />
          ) : undefined
        }
      >
        <LinearGradient
          colors={[colors.dark, colors.green]}
          style={{
            paddingHorizontal: 22,
            paddingTop: inset.top + 14,
            paddingBottom: 28,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            gap: 10,
          }}
        >
          <View style={s.between}>
            {back ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kembali"
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace("/")
                }
                style={{
                  minWidth: 48,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 25 }}>←</Text>
              </Pressable>
            ) : (
              <Text
                style={{
                  color: "#DFC493",
                  fontSize: 11,
                  letterSpacing: 2,
                  fontWeight: "700",
                }}
              >
                {eyebrow}
              </Text>
            )}
            <Image
              source={require("../../assets/mark.png")}
              style={{ width: 38, height: 38 }}
              resizeMode="contain"
            />
          </View>
          <Text
            accessibilityRole="header"
            style={{
              color: "#FFF",
              fontSize: 29,
              fontWeight: "700",
              lineHeight: 37,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: "#D5E6DC", fontSize: 14, lineHeight: 22 }}>
              {subtitle}
            </Text>
          ) : null}
        </LinearGradient>
        <View style={{ padding: 20, gap: 16 }}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function ResourceState({
  resource,
  empty,
}: {
  resource: {
    loading: boolean;
    error: string | null;
    offline?: boolean;
    data: unknown;
    reload(): unknown;
  };
  empty?: boolean;
}) {
  return (
    <>
      {resource.loading && !resource.data ? (
        <ActivityIndicator color={colors.green} style={{ padding: 25 }} />
      ) : null}
      {resource.error ? (
        <Card>
          <Notice error>{resource.error}</Notice>
          <Button
            title="Coba lagi"
            onPress={() => {
              void resource.reload();
            }}
            secondary
          />
        </Card>
      ) : null}
      {resource.offline ? (
        <Notice>
          Mode offline · menampilkan data yang tersimpan di perangkat.
        </Notice>
      ) : null}
      {empty && !resource.loading && !resource.error ? (
        <Card>
          <Body muted>Belum ada data untuk ditampilkan.</Body>
        </Card>
      ) : null}
    </>
  );
}
export function AccountGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <ActivityIndicator color={colors.green} />;
  return user ? (
    <>{children}</>
  ) : (
    <Card>
      <Title>Terhubung dengan perjalananmu</Title>
      <Body muted>
        Masuk untuk membuka data akun, panduan, dan layanan pendampingan.
      </Body>
      <Button
        title="Masuk dengan Google"
        onPress={() => router.push("/login")}
      />
    </Card>
  );
}
