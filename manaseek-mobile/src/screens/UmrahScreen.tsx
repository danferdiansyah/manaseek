import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import * as Crypto from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
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
import { DemoNotice, PackageDetails } from "../components/PackageDetails";
import { Pagination } from "./BookingScreen";
import { useResource } from "../lib/resource";
import { api, ApiError, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { secure } from "../lib/secure";
import {
  formatRupiah,
  ROOM_TYPES,
  umrahDate,
  umrahUnitPrice,
} from "../lib/format";
import type {
  Checkout,
  Page as ApiPage,
  Room,
  Traveler,
  UmrahOrder,
  UmrahPackage,
} from "../lib/models";

const images = [
  require("../../assets/umrah/makkah-dawn.webp"),
  require("../../assets/umrah/madinah-serenity.webp"),
  require("../../assets/umrah/premium-stay.webp"),
];
export default function UmrahScreen() {
  const resource = useResource<{ items: UmrahPackage[] }>("/umrah/packages");
  return (
    <Page
      title="Perjalanan ke Tanah Suci"
      subtitle="Temukan rencana umroh yang sesuai untukmu."
      back
      onRefresh={resource.reload}
      refreshing={resource.loading && !!resource.data}
    >
      <AccountGate>
        <DemoNotice />
        <RowLink title="Pesanan paket umroh" href="/orders" />
        <ResourceState
          resource={resource}
          empty={!resource.data?.items.length}
        />
        {resource.data?.items.map((pkg, i) => (
          <Card key={pkg.id} style={{ padding: 0, overflow: "hidden" }}>
            <Image
              source={images[i % images.length]}
              style={{ width: "100%", height: 180 }}
            />
            <View style={{ padding: 18, gap: 12 }}>
              <Title>{pkg.name}</Title>
              <Body muted>
                {pkg.durationDays} hari · dari {pkg.departureCity}
              </Body>
              <Body>{pkg.summary || pkg.tagline}</Body>
              <Title>Mulai {formatRupiah(pkg.basePrice)}</Title>
              <Button
                title="Lihat paket dan jadwal"
                onPress={() =>
                  router.push({
                    pathname: "/umrah/[slug]",
                    params: { slug: pkg.slug },
                  })
                }
              />
            </View>
          </Card>
        ))}
      </AccountGate>
    </Page>
  );
}
export function UmrahDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const resource = useResource<UmrahPackage>(
    slug ? `/umrah/packages/${encodeURIComponent(slug)}` : null,
  );
  const pkg = resource.data;
  return (
    <Page title={pkg?.name ?? "Paket umroh"} back>
      <AccountGate>
        <DemoNotice />
        <ResourceState resource={resource} />
        {pkg ? (
          <>
            <Card>
              <Title>
                {pkg.durationDays} hari · {pkg.departureCity}
              </Title>
              <Title>Mulai {formatRupiah(pkg.basePrice)}</Title>
              <Body>{pkg.summary || pkg.tagline}</Body>
            </Card>
            <PackageDetails details={pkg.details} />
            <Card>
              <Title>Jadwal keberangkatan</Title>
              {pkg.departures.map((d) => (
                <Body key={d.id}>
                  {umrahDate(d.departureDate)} → {umrahDate(d.returnDate)} ·{" "}
                  {d.availableSeats} kursi
                </Body>
              ))}
              <Button
                title="Pilih jadwal dan pesan"
                disabled={!pkg.departures.some((d) => d.availableSeats > 0)}
                onPress={() =>
                  router.push({ pathname: "/checkout", params: { slug } })
                }
              />
            </Card>
          </>
        ) : null}
      </AccountGate>
    </Page>
  );
}
type PendingOrder = { slug: string; body: Checkout };
export function CheckoutScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  return (
    <Page title="Siapkan perjalananmu" back>
      <AccountGate>
        {user ? (
          <CheckoutForm key={`${user.id}:${slug}`} slug={slug} user={user} />
        ) : null}
      </AccountGate>
    </Page>
  );
}
function CheckoutForm({
  slug,
  user,
}: {
  slug: string;
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
}) {
  const resource = useResource<UmrahPackage>(
    slug ? `/umrah/packages/${encodeURIComponent(slug)}` : null,
  );
  const [departureId, setDepartureId] = useState("");
  const [room, setRoom] = useState<Room>("QUAD");
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [travelers, setTravelers] = useState<Traveler[]>([
    { fullName: user.name ?? "", gender: "MALE", birthDate: "" },
  ]);
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = `manaseek.order.${user.id}`;
  useEffect(() => {
    let active = true;
    void secure
      .get(key)
      .then((raw) => {
        if (active) setPending(raw ? (JSON.parse(raw) as PendingOrder) : null);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setRestored(true);
      });
    return () => {
      active = false;
    };
  }, [key]);
  const pkg = resource.data;
  const selected =
    departureId || pkg?.departures.find((d) => d.availableSeats > 0)?.id || "";
  function editTraveler(index: number, field: keyof Traveler, value: string) {
    setTravelers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    );
  }
  async function submit() {
    if (busy || !restored) return;
    const body: Checkout = pending?.body ?? {
      requestId: Crypto.randomUUID(),
      departureId: selected,
      roomType: room,
      contactName: name.trim(),
      contactEmail: email.trim(),
      contactPhone: phone.trim(),
      travelers: travelers.map((t) => ({ ...t, fullName: t.fullName.trim() })),
      acceptDemo: true,
    };
    if (
      !pending &&
      (!consent ||
        !body.departureId ||
        body.contactName.length < 2 ||
        !/^\S+@\S+\.\S+$/.test(body.contactEmail) ||
        !/^\+?[0-9]{8,15}$/.test(body.contactPhone) ||
        body.travelers.some(
          (t) =>
            t.fullName.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(t.birthDate),
        ))
    ) {
      setError(
        "Lengkapi jadwal, kontak, nama dan tanggal lahir setiap jamaah, lalu setujui simulasi.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    const work = pending ?? { slug, body };
    try {
      // Persist the exact payload before sending. Retries retain the backend idempotency key.
      await secure.set(key, JSON.stringify(work));
      setPending(work);
      const order = await api.post<UmrahOrder>("/umrah/orders", body);
      await secure.remove(key);
      setPending(null);
      router.replace({ pathname: "/orders/[id]", params: { id: order.id } });
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.status >= 400 &&
        e.status < 500 &&
        ![408, 429].includes(e.status)
      ) {
        await secure.remove(key);
        setPending(null);
      }
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <DemoNotice />
      <ResourceState resource={resource} />
      {pending ? (
        <Card>
          <Title>Lanjutkan permintaan sebelumnya</Title>
          <Body>
            Pesanan sebelumnya belum mendapat konfirmasi di perangkat. Kirim
            ulang permintaan yang sama untuk memeriksa hasilnya tanpa membuat
            pesanan ganda.
          </Body>
          <Body muted>
            {pending.body.travelers.length} jamaah · {pending.body.contactName}
          </Body>
          <Button
            title="Periksa dan lanjutkan pesanan"
            busy={busy}
            onPress={() => {
              void submit();
            }}
          />
          <RowLink title="Periksa riwayat pesanan" href="/orders" />
        </Card>
      ) : pkg ? (
        <>
          <Card>
            <Title>{pkg.name}</Title>
            <Title>Jadwal</Title>
            {pkg.departures
              .filter((d) => d.availableSeats > 0)
              .map((d) => (
                <Choice
                  key={d.id}
                  label={`${umrahDate(d.departureDate)} · ${d.availableSeats} kursi`}
                  selected={selected === d.id}
                  onPress={() => setDepartureId(d.id)}
                />
              ))}
            <Title>Jenis kamar</Title>
            {ROOM_TYPES.map((r) => (
              <Choice
                key={r.id}
                label={`${r.label} · ${formatRupiah(umrahUnitPrice(pkg, r.id))}/jamaah`}
                selected={room === r.id}
                onPress={() => setRoom(r.id as Room)}
              />
            ))}
            <Body muted>
              Kamar yang belum penuh dibagi dengan jamaah lain berjenis kelamin
              sama.
            </Body>
          </Card>
          <Card>
            <Title>Kontak pemesan</Title>
            <Field
              label="Nama kontak"
              value={name}
              onChangeText={setName}
              maxLength={100}
            />
            <Field
              label="Email kontak"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="Telepon kontak"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </Card>
          {travelers.map((t, i) => (
            <Card key={i}>
              <Title>Jamaah {i + 1}</Title>
              <Field
                label={`Nama lengkap jamaah ${i + 1}`}
                value={t.fullName}
                onChangeText={(value) => editTraveler(i, "fullName", value)}
                maxLength={100}
              />
              <View style={s.row}>
                <Choice
                  label="Laki-laki"
                  selected={t.gender === "MALE"}
                  onPress={() => editTraveler(i, "gender", "MALE")}
                />
                <Choice
                  label="Perempuan"
                  selected={t.gender === "FEMALE"}
                  onPress={() => editTraveler(i, "gender", "FEMALE")}
                />
              </View>
              <Field
                label={`Tanggal lahir jamaah ${i + 1} (YYYY-MM-DD)`}
                value={t.birthDate}
                onChangeText={(value) => editTraveler(i, "birthDate", value)}
                maxLength={10}
              />
              {travelers.length > 1 ? (
                <Button
                  title="Hapus jamaah ini"
                  secondary
                  onPress={() =>
                    setTravelers((prev) =>
                      prev.filter((_, index) => i !== index),
                    )
                  }
                />
              ) : null}
            </Card>
          ))}
          <Button
            title="Tambah jamaah"
            secondary
            disabled={travelers.length >= 6}
            onPress={() =>
              setTravelers((prev) => [
                ...prev,
                { fullName: "", gender: "MALE", birthDate: "" },
              ])
            }
          />
          <Card>
            <Title>
              Estimasi{" "}
              {formatRupiah(umrahUnitPrice(pkg, room) * travelers.length)}
            </Title>
            <Body muted>
              Total akhir dihitung server. Maksimal enam jamaah per pesanan.
            </Body>
            <Choice
              label="Saya memahami ini pesanan dan pembayaran simulasi"
              selected={consent}
              onPress={() => setConsent((v) => !v)}
            />
            <Button
              title="Pesan dan bayar simulasi"
              busy={busy}
              disabled={!consent || !selected || !restored}
              onPress={() => {
                void submit();
              }}
            />
          </Card>
        </>
      ) : null}
      {error ? <Notice error>{error}</Notice> : null}
    </>
  );
}
export function OrdersScreen() {
  const { user } = useAuth();
  const userId = user?.id;
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const resource = useResource<ApiPage<UmrahOrder>>(
    `/umrah/orders?page=${page}&limit=15`,
  );
  useEffect(() => {
    let active = true;
    if (userId)
      void secure
        .get(`manaseek.order.${userId}`)
        .then((raw) => {
          if (active) setPending(raw ? JSON.parse(raw) : null);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId, resource.data]);
  return (
    <Page
      title="Pesanan umroh"
      back
      onRefresh={resource.reload}
      refreshing={resource.loading && !!resource.data}
    >
      <AccountGate>
        <DemoNotice />
        {pending ? (
          <RowLink
            title="Lanjutkan permintaan yang belum dikonfirmasi"
            href={{ pathname: "/checkout", params: { slug: pending.slug } }}
          />
        ) : null}
        <ResourceState
          resource={resource}
          empty={!resource.data?.items.length}
        />
        {resource.data?.items.map((order) => (
          <RowLink
            key={order.id}
            title={order.packageSnapshot.name}
            subtitle={`${order.code} · ${order.travelerCount} jamaah\n${umrahDate(order.packageSnapshot.departureDate)} · ${formatRupiah(order.totalAmount)}`}
            href={{ pathname: "/orders/[id]", params: { id: order.id } }}
          />
        ))}
        <Pagination
          page={page}
          total={resource.data?.meta.totalPages ?? 1}
          onChange={setPage}
        />
      </AccountGate>
    </Page>
  );
}
export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useResource<UmrahOrder>(id ? `/umrah/orders/${id}` : null);
  const order = resource.data;
  return (
    <Page
      title="Bukti pesanan"
      back
      onRefresh={resource.reload}
      refreshing={resource.loading && !!order}
    >
      <AccountGate>
        <DemoNotice />
        <ResourceState resource={resource} />
        {order ? (
          <>
            <Card>
              <Title>{order.packageSnapshot.name}</Title>
              <Body>{order.code}</Body>
              <Body>
                {umrahDate(order.packageSnapshot.departureDate)} →{" "}
                {umrahDate(order.packageSnapshot.returnDate)}
              </Body>
              <Body>
                {order.travelerCount} jamaah · kamar {order.roomType}
              </Body>
              <Title>{formatRupiah(order.totalAmount)}</Title>
              <Body>
                Pembayaran simulasi:{" "}
                {order.payment?.status === "SUCCESS"
                  ? "Berhasil"
                  : order.payment?.status}
              </Body>
              <Body muted>{order.payment?.reference}</Body>
            </Card>
            <Card>
              <Title>Data jamaah</Title>
              {order.travelers?.map((t, i) => (
                <Body key={i}>
                  {t.fullName} ·{" "}
                  {t.gender === "MALE" ? "Laki-laki" : "Perempuan"} ·{" "}
                  {umrahDate(t.birthDate)}
                </Body>
              ))}
            </Card>
            <PackageDetails details={order.packageSnapshot.details} />
          </>
        ) : null}
      </AccountGate>
    </Page>
  );
}
