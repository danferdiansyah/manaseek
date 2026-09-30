import { useState } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import {
  Body,
  Button,
  Card,
  Choice,
  Field,
  Notice,
  Page,
} from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Tokens } from "../lib/api-client";
import type { User } from "../lib/models";

type Session = Tokens & { user: User };
export default function LoginScreen() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("ahmad@manaseek.test");
  async function login(dev = false) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      let session: Session;
      if (dev && __DEV__ && process.env.EXPO_PUBLIC_DEV_LOGIN === "true") {
        session = await api.post<Session>(
          "/auth/dev-login",
          { email: email.trim() },
          { public: true },
        );
      } else {
        if (Platform.OS !== "android" && Platform.OS !== "ios")
          throw new Error(
            "Gunakan aplikasi Android untuk masuk dengan Google.",
          );
        const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        if (!clientId)
          throw new Error(
            "Login Google belum tersedia. Silakan coba setelah aplikasi diperbarui.",
          );
        const { GoogleSignin, isSuccessResponse } =
          await import("@react-native-google-signin/google-signin");
        GoogleSignin.configure({
          webClientId: clientId,
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        });
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        const result = await GoogleSignin.signIn();
        if (!isSuccessResponse(result)) return;
        if (!result.data.idToken)
          throw new Error(
            "Google belum mengembalikan token masuk. Silakan coba lagi.",
          );
        session = await api.post<Session>(
          "/auth/google",
          { idToken: result.data.idToken },
          { public: true },
        );
      }
      await auth.accept(session);
      router.replace(session.user.needsOnboarding ? "/onboarding" : "/");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Selamat datang."
      subtitle="Satu akun untuk seluruh perjalanan ibadahmu."
      back
    >
      <Card>
        <Body>
          Masuk atau daftar menggunakan akun Google yang sama dengan Manaseek
          web.
        </Body>
        {error ? <Notice error>{error}</Notice> : null}
        <Button
          title="Lanjutkan dengan Google"
          busy={busy}
          onPress={() => {
            void login();
          }}
        />
      </Card>
      {__DEV__ && process.env.EXPO_PUBLIC_DEV_LOGIN === "true" ? (
        <Card>
          <Notice>Akun pengembangan · hanya untuk backend lokal.</Notice>
          <Field
            label="Email pengembangan"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button
            title="Masuk akun pengembangan"
            busy={busy}
            secondary
            onPress={() => {
              void login(true);
            }}
          />
        </Card>
      ) : null}
    </Page>
  );
}

export function OnboardingScreen() {
  const auth = useAuth();
  const [role, setRole] = useState<"JAMAAH" | "MUTAWIF">("JAMAAH");
  const [name, setName] = useState(auth.user?.name ?? "");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const session = await api.post<Session>("/auth/onboarding", {
        role,
        name: name.trim(),
        city: city.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      await auth.accept(session);
      router.replace("/");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Kenalan dulu, yuk."
      subtitle="Lengkapi profil untuk memulai perjalanan."
    >
      <Card>
        <Choice
          label="Saya jamaah"
          selected={role === "JAMAAH"}
          onPress={() => setRole("JAMAAH")}
        />
        <Choice
          label="Saya mutawif"
          selected={role === "MUTAWIF"}
          onPress={() => setRole("MUTAWIF")}
        />
        <Field label="Nama lengkap" value={name} onChangeText={setName} />
        <Field label="Kota asal" value={city} onChangeText={setCity} />
        <Field
          label="Nomor kontak (opsional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        {error ? <Notice error>{error}</Notice> : null}
        <Button
          title="Simpan dan lanjutkan"
          busy={busy}
          disabled={name.trim().length < 2 || city.trim().length < 2}
          onPress={() => {
            void save();
          }}
        />
      </Card>
    </Page>
  );
}
