import { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
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
import { umrahDate } from "../lib/format";

export default function ProfileScreen() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function logout() {
    setBusy(true);
    try {
      await auth.logout();
      router.replace("/");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Ruang pribadimu"
      subtitle="Simpan informasi perjalanan dan kebutuhanmu di satu tempat."
    >
      <AccountGate>
        <Card>
          <Title>{auth.user?.name ?? "Jamaah"}</Title>
          <Body muted>{auth.user?.email}</Body>
          <Body muted>
            {auth.user?.role === "MUTAWIF" ? "Mutawif" : "Jamaah"}
          </Body>
        </Card>
        <RowLink title="Edit profil & kontak" href="/edit-profile" />
        <RowLink
          title="Dokumen perjalanan"
          subtitle="Paspor, visa, dan dokumen pendukung"
          href="/documents"
        />
        <RowLink title="Rencana perjalanan" href="/trips" />
        <RowLink title="Riwayat pendampingan" href="/bookings" />
        <RowLink title="Pesanan paket umroh" href="/orders" />
        <RowLink title="Notifikasi" href="/notifications" />
        {auth.user?.role === "MUTAWIF" ? (
          <RowLink title="Dashboard mutawif" href="/dashboard" />
        ) : null}
        {error ? <Notice error>{error}</Notice> : null}
        <Button
          title="Keluar dari akun"
          busy={busy}
          secondary
          onPress={() =>
            Alert.alert(
              "Keluar dari Manaseek?",
              "Data offline akun ini akan dihapus dari perangkat.",
              [
                { text: "Batal", style: "cancel" },
                {
                  text: "Keluar",
                  style: "destructive",
                  onPress: () => {
                    void logout();
                  },
                },
              ],
            )
          }
        />
      </AccountGate>
      <Body muted>Manaseek 1.0 · Pendamping ibadah haji & umrah</Body>
    </Page>
  );
}
type Profile = {
  city?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  mobilityNeed?: string;
};
export function EditProfileScreen() {
  const auth = useAuth();
  const resource = useResource<Profile>("/users/me/profile");
  return (
    <Page title="Profil & kontak" back>
      <AccountGate>
        <ResourceState resource={resource} />
        {resource.data && auth.user ? (
          <ProfileForm key={auth.user.id} profile={resource.data} />
        ) : null}
      </AccountGate>
    </Page>
  );
}
function ProfileForm({ profile }: { profile: Profile }) {
  const auth = useAuth();
  const [name, setName] = useState(auth.user?.name ?? "");
  const [phone, setPhone] = useState(auth.user?.phone ?? "");
  const [details, setDetails] = useState(profile);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function save() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.patch("/users/me", {
        name: name.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      await api.patch("/users/me/profile", {
        city: details.city ?? "",
        address: details.address ?? "",
        emergencyContactName: details.emergencyContactName ?? "",
        ...(details.emergencyContactPhone
          ? { emergencyContactPhone: details.emergencyContactPhone }
          : {}),
        medicalNotes: details.medicalNotes ?? "",
        mobilityNeed: details.mobilityNeed ?? "NONE",
      });
      await auth.refresh();
      setMessage("Profil berhasil disimpan.");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <Field
        label="Nama lengkap"
        value={name}
        onChangeText={setName}
        maxLength={80}
      />
      <Field
        label="Nomor telepon"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      {(
        [
          ["city", "Kota"],
          ["address", "Alamat"],
          ["emergencyContactName", "Nama kontak darurat"],
          ["emergencyContactPhone", "Telepon kontak darurat"],
          ["medicalNotes", "Catatan kesehatan"],
        ] as const
      ).map(([key, label]) => (
        <Field
          key={key}
          label={label}
          value={details[key] ?? ""}
          onChangeText={(v) => setDetails((prev) => ({ ...prev, [key]: v }))}
          multiline={key === "medicalNotes"}
        />
      ))}
      <Title>Kebutuhan mobilitas</Title>
      {[
        ["NONE", "Tidak ada"],
        ["WHEELCHAIR", "Kursi roda"],
        ["WALKING_AID", "Alat bantu jalan"],
        ["ELDERLY_ASSISTANCE", "Pendampingan lansia"],
      ].map(([id, label]) => (
        <Choice
          key={id}
          label={label}
          selected={(details.mobilityNeed ?? "NONE") === id}
          onPress={() => setDetails((prev) => ({ ...prev, mobilityNeed: id }))}
        />
      ))}
      {message ? <Notice>{message}</Notice> : null}
      <Button
        title="Simpan profil"
        busy={busy}
        disabled={name.trim().length < 2}
        onPress={() => {
          void save();
        }}
      />
    </Card>
  );
}
type Document = {
  id: string;
  type: string;
  number?: string;
  expiresAt?: string;
};
const documentTypes: Record<string, string> = {
  PASSPORT: "Paspor",
  VISA: "Visa",
  ID_CARD: "KTP",
  VACCINE_CERTIFICATE: "Sertifikat vaksin",
  OTHER: "Lainnya",
};
export function DocumentsScreen() {
  const resource = useResource<Document[]>("/users/me/documents");
  const [type, setType] = useState("PASSPORT");
  const [number, setNumber] = useState("");
  const [expires, setExpires] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        type,
        ...(number.trim() ? { number: number.trim() } : {}),
        ...(expires ? { expiresAt: expires } : {}),
      };
      if (editing) await api.patch(`/users/me/documents/${editing}`, body);
      else await api.post("/users/me/documents", body);
      setEditing(null);
      setNumber("");
      setExpires("");
      await resource.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function remove(id: string) {
    Alert.alert(
      "Hapus dokumen?",
      "Catatan dokumen ini akan dihapus dari akun.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            void api
              .delete(`/users/me/documents/${id}`)
              .then(resource.reload)
              .catch((e) => setError(errorMessage(e)));
          },
        },
      ],
    );
  }
  return (
    <Page title="Dokumen perjalanan" back>
      <AccountGate>
        <ResourceState resource={resource} empty={!resource.data?.length} />
        {resource.data?.map((doc) => (
          <Card key={doc.id}>
            <Title>{documentTypes[doc.type] ?? doc.type}</Title>
            <Body>{doc.number ?? "Tanpa nomor"}</Body>
            <Body muted>
              {doc.expiresAt
                ? `Berlaku hingga ${umrahDate(doc.expiresAt)}`
                : "Masa berlaku belum diisi"}
            </Body>
            <Button
              title="Edit dokumen"
              secondary
              onPress={() => {
                setEditing(doc.id);
                setType(doc.type);
                setNumber(doc.number ?? "");
                setExpires(doc.expiresAt?.slice(0, 10) ?? "");
              }}
            />
            <Button
              title="Hapus dokumen"
              secondary
              onPress={() => remove(doc.id)}
            />
          </Card>
        ))}
        <Card>
          <Title>{editing ? "Edit dokumen" : "Tambah dokumen"}</Title>
          <View style={[s.row, { flexWrap: "wrap" }]}>
            {Object.entries(documentTypes).map(([id, label]) => (
              <Choice
                key={id}
                label={label}
                selected={type === id}
                onPress={() => setType(id)}
              />
            ))}
          </View>
          <Field
            label="Nomor dokumen (opsional)"
            maxLength={60}
            value={number}
            onChangeText={setNumber}
          />
          <Field
            label="Berlaku hingga (YYYY-MM-DD, opsional)"
            maxLength={10}
            value={expires}
            onChangeText={setExpires}
          />
          {error ? <Notice error>{error}</Notice> : null}
          <Button
            title="Simpan dokumen"
            busy={busy}
            onPress={() => {
              void save();
            }}
          />
          {editing ? (
            <Button
              title="Batal edit"
              secondary
              onPress={() => {
                setEditing(null);
                setNumber("");
                setExpires("");
              }}
            />
          ) : null}
        </Card>
      </AccountGate>
    </Page>
  );
}
type Trip = {
  id: string;
  type: string;
  packageName?: string;
  agencyName?: string;
  departureDate: string;
  returnDate?: string;
  status: string;
};
export function TripsScreen() {
  const resource = useResource<Trip[]>("/users/me/trips");
  const [type, setType] = useState("UMRAH");
  const [name, setName] = useState("");
  const [agency, setAgency] = useState("");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        packageName: name.trim(),
        agencyName: agency.trim(),
        departureDate: departure,
        ...(returnDate ? { returnDate } : {}),
      };
      if (editing) await api.patch(`/users/me/trips/${editing}`, body);
      else await api.post("/users/me/trips", { ...body, type });
      setEditing(null);
      setName("");
      setAgency("");
      setDeparture("");
      setReturnDate("");
      await resource.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="Rencana perjalanan" back>
      <AccountGate>
        <ResourceState resource={resource} empty={!resource.data?.length} />
        {resource.data?.map((trip) => (
          <Card key={trip.id}>
            <Title>
              {trip.packageName || (trip.type === "HAJJ" ? "Haji" : "Umroh")}
            </Title>
            <Body>{trip.agencyName}</Body>
            <Body muted>
              {umrahDate(trip.departureDate)}
              {trip.returnDate ? ` → ${umrahDate(trip.returnDate)}` : ""}
            </Body>
            <Button
              title="Edit perjalanan"
              secondary
              onPress={() => {
                setEditing(trip.id);
                setType(trip.type);
                setName(trip.packageName ?? "");
                setAgency(trip.agencyName ?? "");
                setDeparture(trip.departureDate.slice(0, 10));
                setReturnDate(trip.returnDate?.slice(0, 10) ?? "");
              }}
            />
            <Button
              title="Hapus perjalanan"
              secondary
              onPress={() =>
                Alert.alert(
                  "Hapus perjalanan?",
                  "Rencana ini akan dihapus dari akun.",
                  [
                    { text: "Batal", style: "cancel" },
                    {
                      text: "Hapus",
                      style: "destructive",
                      onPress: () => {
                        void api
                          .delete(`/users/me/trips/${trip.id}`)
                          .then(resource.reload)
                          .catch((e) => setError(errorMessage(e)));
                      },
                    },
                  ],
                )
              }
            />
          </Card>
        ))}
        <Card>
          <Title>{editing ? "Edit perjalanan" : "Tambah perjalanan"}</Title>
          {!editing ? (
            <View style={s.row}>
              <Choice
                label="Umroh"
                selected={type === "UMRAH"}
                onPress={() => setType("UMRAH")}
              />
              <Choice
                label="Haji"
                selected={type === "HAJJ"}
                onPress={() => setType("HAJJ")}
              />
            </View>
          ) : null}
          <Field label="Nama paket" value={name} onChangeText={setName} />
          <Field label="Nama travel" value={agency} onChangeText={setAgency} />
          <Field
            label="Tanggal berangkat (YYYY-MM-DD)"
            value={departure}
            onChangeText={setDeparture}
            maxLength={10}
          />
          <Field
            label="Tanggal pulang (YYYY-MM-DD, opsional)"
            value={returnDate}
            onChangeText={setReturnDate}
            maxLength={10}
          />
          {error ? <Notice error>{error}</Notice> : null}
          <Button
            title="Simpan perjalanan"
            busy={busy}
            disabled={!departure}
            onPress={() => {
              void save();
            }}
          />
          {editing ? (
            <Button
              title="Batal edit"
              secondary
              onPress={() => setEditing(null)}
            />
          ) : null}
        </Card>
      </AccountGate>
    </Page>
  );
}
