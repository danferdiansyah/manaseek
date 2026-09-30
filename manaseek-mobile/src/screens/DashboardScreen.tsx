import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import * as Location from "expo-location";
import { useIsFocused } from "expo-router";
import {
  AccountGate,
  Body,
  Button,
  Card,
  Choice,
  Field,
  Notice,
  Page,
  ResourceState,
  RowLink,
  Title,
  s,
} from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useResource } from "../lib/resource";
import {
  BOOKING_STATUS_LABELS,
  SERVICE_LABELS,
  formatSchedule,
} from "../lib/format";
import type { Booking, Mutawif, Page as ApiPage } from "../lib/models";

type OwnProfile = Mutawif & {
  slots: { dayOfWeek: number; startMinute: number; endMinute: number }[];
  verificationRequired: boolean;
};
export default function DashboardScreen() {
  const { user } = useAuth();
  const resource = useResource<OwnProfile>(
    user?.role === "MUTAWIF" ? "/mutawif/me" : null,
  );
  const bookings = useResource<ApiPage<Booking>>(
    user?.role === "MUTAWIF" ? "/bookings?limit=30" : null,
  );
  const focused = useIsFocused();
  const reloadBookings = bookings.reload;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const online = resource.data?.availabilityStatus === "ONLINE";
  useEffect(() => {
    if (!online || !focused) return;
    let disposed = false;
    let serial = 0;
    const version = api.sessionVersion;
    let watch: Location.LocationSubscription | undefined;
    const start = async () => {
      const ticket = ++serial;
      const granted = await Location.requestForegroundPermissionsAsync();
      if (!granted.granted) {
        setLocationMessage(
          "Izin lokasi dibutuhkan agar jamaah dapat menemukanmu.",
        );
        return;
      }
      if (disposed || ticket !== serial) return;
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 25,
          timeInterval: 30000,
        },
        (fix) => {
          if (disposed || ticket !== serial || api.sessionVersion !== version)
            return;
          void api
            .patch("/mutawif/me/location", {
              latitude: fix.coords.latitude,
              longitude: fix.coords.longitude,
              ...(fix.coords.accuracy && fix.coords.accuracy > 0
                ? { accuracy: fix.coords.accuracy }
                : {}),
            })
            .then(() => {
              if (!disposed)
                setLocationMessage(
                  "Lokasi aktif diperbarui saat kamu bergerak.",
                );
            })
            .catch((e) => {
              if (!disposed) setLocationMessage(errorMessage(e));
            });
        },
      );
      if (disposed || ticket !== serial) sub.remove();
      else watch = sub;
    };
    if (AppState.currentState === "active")
      void start().catch((e) => setLocationMessage(errorMessage(e)));
    const listener = AppState.addEventListener("change", (state) => {
      serial++;
      watch?.remove();
      watch = undefined;
      if (state === "active")
        void start().catch((e) => setLocationMessage(errorMessage(e)));
    });
    return () => {
      disposed = true;
      serial++;
      watch?.remove();
      listener.remove();
    };
  }, [online, focused]);
  useEffect(() => {
    if (!focused) return;
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void reloadBookings();
    }, 30000);
    return () => clearInterval(timer);
  }, [focused, reloadBookings]);
  async function availability(status: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (status === "ONLINE") {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted)
          throw new Error(
            "Aktifkan izin lokasi sebelum menerima pendampingan.",
          );
        const fix = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await api.patch("/mutawif/me/location", {
          latitude: fix.coords.latitude,
          longitude: fix.coords.longitude,
          ...(fix.coords.accuracy && fix.coords.accuracy > 0
            ? { accuracy: fix.coords.accuracy }
            : {}),
        });
      }
      await api.patch("/mutawif/me/availability", { status });
      await resource.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Ruang mutawif"
      subtitle="Kelola layanan dan dampingi jamaah dengan tenang."
      back
    >
      <AccountGate>
        {user?.role !== "MUTAWIF" ? (
          <Notice>Dashboard ini tersedia untuk akun mutawif.</Notice>
        ) : (
          <>
            <ResourceState resource={resource} />
            {resource.data ? (
              <>
                <Card>
                  <Title>
                    Status:{" "}
                    {resource.data.availabilityStatus === "ONLINE"
                      ? "Online"
                      : resource.data.availabilityStatus === "BUSY"
                        ? "Sibuk"
                        : "Offline"}
                  </Title>
                  <Body muted>
                    Verifikasi: {resource.data.verificationStatus}
                  </Body>
                  {resource.data.verificationNote ? (
                    <Notice>{resource.data.verificationNote}</Notice>
                  ) : null}
                  <Button
                    title={
                      online
                        ? "Berhenti menerima permintaan"
                        : "Online dan terima permintaan"
                    }
                    busy={busy}
                    onPress={() => {
                      void availability(online ? "OFFLINE" : "ONLINE");
                    }}
                  />
                  {online ? (
                    <Notice>
                      {locationMessage || "Menyiapkan lokasi…"} Lokasi dibagikan
                      selama dashboard terbuka; pencarian mengabaikan lokasi
                      yang sudah lama.
                    </Notice>
                  ) : null}
                </Card>
                {error ? <Notice error>{error}</Notice> : null}
                <Title>Permintaan pendampingan</Title>
                <ResourceState
                  resource={bookings}
                  empty={!bookings.data?.items.length}
                />
                {bookings.data?.items
                  .filter((b) =>
                    ["REQUESTED", "ACCEPTED", "ONGOING"].includes(b.status),
                  )
                  .map((b) => (
                    <RowLink
                      key={b.id}
                      title={`${b.jamaah?.name ?? "Jamaah"} · ${BOOKING_STATUS_LABELS[b.status]}`}
                      subtitle={`${formatSchedule(b.scheduledStartAt)} WAS · ${b.meetingPointLabel}`}
                      href={{
                        pathname: "/bookings/[id]",
                        params: { id: b.id },
                      }}
                    />
                  ))}
                <RowLink
                  title="Seluruh riwayat pendampingan"
                  href="/bookings"
                />
                <MutawifSettings
                  key={resource.data.id}
                  profile={resource.data}
                  reload={resource.reload}
                />
              </>
            ) : null}
          </>
        )}
      </AccountGate>
    </Page>
  );
}
function MutawifSettings({
  profile,
  reload,
}: {
  profile: OwnProfile;
  reload(): Promise<void>;
}) {
  const [bio, setBio] = useState(profile.bio ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [languages, setLanguages] = useState(profile.languages.join(", "));
  const [experience, setExperience] = useState(String(profile.yearsExperience));
  const [rates, setRates] = useState<Record<string, string>>(
    Object.fromEntries(
      (profile.rates ?? []).map((r) => [r.serviceType, String(r.hourlyRate)]),
    ),
  );
  const [documentType, setDocumentType] = useState("CERTIFICATE");
  const [documentUrl, setDocumentUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function work(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await reload();
      setMessage("Perubahan berhasil disimpan.");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Card>
        <Title>Profil pendamping</Title>
        <Field
          label="Tentang dirimu (minimal 20 karakter)"
          multiline
          value={bio}
          onChangeText={setBio}
          maxLength={1000}
        />
        <Field label="Kota layanan" value={city} onChangeText={setCity} />
        <Field
          label="Bahasa (pisahkan dengan koma: id, ar, en)"
          value={languages}
          onChangeText={setLanguages}
          autoCapitalize="none"
        />
        <Field
          label="Tahun pengalaman"
          value={experience}
          onChangeText={setExperience}
          keyboardType="number-pad"
        />
        <Button
          title="Simpan profil mutawif"
          busy={busy}
          onPress={() => {
            void work(() =>
              api.patch("/mutawif/me", {
                bio: bio.trim(),
                city: city.trim(),
                languages: languages
                  .split(",")
                  .map((l) => l.trim())
                  .filter(Boolean),
                yearsExperience: Number(experience),
              }),
            );
          }}
        />
      </Card>
      <Card>
        <Title>Tarif per jam (Rupiah)</Title>
        {Object.entries(SERVICE_LABELS).map(([id, label]) => (
          <Field
            key={id}
            label={label}
            keyboardType="number-pad"
            value={rates[id] ?? ""}
            onChangeText={(v) => setRates((prev) => ({ ...prev, [id]: v }))}
          />
        ))}
        <Body muted>Kosongkan layanan untuk menonaktifkannya.</Body>
        <Button
          title="Simpan tarif"
          busy={busy}
          onPress={() => {
            void work(() =>
              api.put("/mutawif/me/rates", {
                rates: Object.keys(SERVICE_LABELS)
                  .filter(
                    (id) =>
                      rates[id] ||
                      profile.rates?.some((r) => r.serviceType === id),
                  )
                  .map((id) => ({
                    serviceType: id,
                    hourlyRate: Number(
                      rates[id] ||
                        profile.rates?.find((r) => r.serviceType === id)
                          ?.hourlyRate ||
                        1,
                    ),
                    active: Boolean(rates[id]),
                  })),
              }),
            );
          }}
        />
      </Card>
      <Card>
        <Title>Dokumen verifikasi</Title>
        <Body muted>
          Gunakan tautan dokumen yang sudah diunggah melalui pengelola layanan.
          Upload berkas langsung belum tersedia pada backend.
        </Body>
        <View style={[s.row, { flexWrap: "wrap" }]}>
          {[
            ["ID_CARD", "Identitas"],
            ["PASSPORT", "Paspor"],
            ["CERTIFICATE", "Sertifikat"],
            ["OTHER", "Lainnya"],
          ].map(([id, label]) => (
            <Choice
              key={id}
              label={label}
              selected={documentType === id}
              onPress={() => setDocumentType(id)}
            />
          ))}
        </View>
        <Field
          label="Tautan dokumen (https://…)"
          value={documentUrl}
          onChangeText={setDocumentUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Button
          title="Tambahkan dokumen"
          busy={busy}
          disabled={!documentUrl.startsWith("https://")}
          secondary
          onPress={() => {
            void work(() =>
              api.post("/mutawif/me/documents", {
                type: documentType,
                fileUrl: documentUrl.trim(),
              }),
            );
          }}
        />
        {profile.documents?.map((doc) => (
          <Body key={doc.id}>✓ {doc.type}</Body>
        ))}
        {["DRAFT", "REJECTED"].includes(profile.verificationStatus ?? "") ? (
          <Button
            title="Ajukan verifikasi"
            busy={busy}
            onPress={() => {
              void work(() => api.post("/mutawif/me/submit", {}));
            }}
          />
        ) : null}
      </Card>
      {message ? <Notice>{message}</Notice> : null}
    </>
  );
}
