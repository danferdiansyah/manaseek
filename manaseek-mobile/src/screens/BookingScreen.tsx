import { useState } from "react";
import { Linking, View } from "react-native";
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
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useResource } from "../lib/resource";
import {
  BOOKING_STATUS_LABELS,
  SERVICE_LABELS,
  formatRupiah,
  formatSchedule,
} from "../lib/format";
import type { Booking, Mutawif, Page as ApiPage, Service } from "../lib/models";

export default function BookingScreen() {
  const { mutawifId } = useLocalSearchParams<{ mutawifId: string }>();
  const resource = useResource<Mutawif>(
    mutawifId ? `/mutawif/${mutawifId}` : null,
  );
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(2);
  const [meeting, setMeeting] = useState("Pintu King Fahd, Masjidil Haram");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rate =
    resource.data?.rates?.find((r) => r.serviceType === service) ??
    resource.data?.rates?.[0];
  async function submit() {
    if (!rate || busy) return;
    const scheduledStartAt = `${date}T${time}:00+03:00`;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
      !Number.isFinite(Date.parse(scheduledStartAt)) ||
      Date.parse(scheduledStartAt) <= Date.now()
    ) {
      setError(
        "Masukkan tanggal dan waktu mendatang yang valid (Waktu Arab Saudi).",
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.post<Booking>("/bookings", {
        mutawifId,
        serviceType: rate.serviceType,
        scheduledStartAt,
        durationHours: duration,
        meetingPointLabel: meeting.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      router.replace({ pathname: "/bookings/[id]", params: { id: result.id } });
    } catch (e) {
      setError(
        `${errorMessage(e)} Jika koneksi terputus, periksa riwayat booking sebelum memesan lagi.`,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="Atur pendampingan" back>
      <AccountGate>
        <ResourceState resource={resource} />
        {resource.data ? (
          <>
            <Card>
              <Title>{resource.data.user?.name}</Title>
              {resource.data.rates?.map((r) => (
                <Choice
                  key={r.serviceType}
                  label={`${SERVICE_LABELS[r.serviceType]} · ${formatRupiah(r.hourlyRate)}/jam`}
                  selected={rate?.serviceType === r.serviceType}
                  onPress={() => setService(r.serviceType)}
                />
              ))}
            </Card>
            <Card>
              <Notice>
                Seluruh jadwal menggunakan Waktu Arab Saudi (UTC+3).
              </Notice>
              <Field
                label="Tanggal (YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
                maxLength={10}
              />
              <Field
                label="Jam (HH:MM)"
                value={time}
                onChangeText={setTime}
                maxLength={5}
              />
              <Title>Durasi</Title>
              <View style={[s.row, { flexWrap: "wrap" }]}>
                {[1, 2, 3, 4, 6, 8, 12].map((n) => (
                  <Choice
                    key={n}
                    label={`${n} jam`}
                    selected={n === duration}
                    onPress={() => setDuration(n)}
                  />
                ))}
              </View>
              <Field
                label="Titik pertemuan"
                value={meeting}
                onChangeText={setMeeting}
                maxLength={160}
              />
              <Field
                label="Catatan (opsional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={500}
              />
            </Card>
            <Card>
              <Title>
                Estimasi{" "}
                {formatRupiah(Number(rate?.hourlyRate ?? 0) * duration)}
              </Title>
              <Body muted>
                Harga akhir ditetapkan layanan. Pembayaran diselesaikan langsung
                di luar aplikasi.
              </Body>
              {error ? <Notice error>{error}</Notice> : null}
              <Button
                title="Ajukan pendampingan"
                busy={busy}
                disabled={!rate || meeting.trim().length < 3}
                onPress={() => {
                  void submit();
                }}
              />
              <Button
                title="Periksa riwayat booking"
                secondary
                onPress={() => router.push("/bookings")}
              />
            </Card>
          </>
        ) : null}
      </AccountGate>
    </Page>
  );
}
export function BookingsScreen() {
  const [page, setPage] = useState(1);
  const resource = useResource<ApiPage<Booking>>(
    `/bookings?page=${page}&limit=15`,
  );
  return (
    <Page
      title="Pendampinganmu"
      back
      onRefresh={resource.reload}
      refreshing={resource.loading && !!resource.data}
    >
      <AccountGate>
        <ResourceState
          resource={resource}
          empty={!resource.data?.items.length}
        />
        {resource.data?.items.map((b) => (
          <RowLink
            key={b.id}
            title={`${b.code} · ${BOOKING_STATUS_LABELS[b.status] ?? b.status}`}
            subtitle={`${b.mutawif?.user.name ?? b.jamaah?.name ?? SERVICE_LABELS[b.serviceType]}\n${formatSchedule(b.scheduledStartAt)} WAS`}
            href={{ pathname: "/bookings/[id]", params: { id: b.id } }}
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
export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange(n: number): void;
}) {
  return total > 1 || page > 1 ? (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Button
          title="Sebelumnya"
          secondary
          disabled={page <= 1}
          onPress={() => onChange(page - 1)}
        />
      </View>
      <Body muted>
        {page}/{Math.max(page, total)}
      </Body>
      <View style={{ flex: 1 }}>
        <Button
          title="Berikutnya"
          secondary
          disabled={page >= total}
          onPress={() => onChange(page + 1)}
        />
      </View>
    </View>
  ) : null;
}
export function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const resource = useResource<Booking>(id ? `/bookings/${id}` : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const b = resource.data;
  async function action(name: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(
        `/bookings/${id}/${name}`,
        name === "cancel" ? { reason: reason.trim() } : {},
      );
      await resource.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function review() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/reviews", {
        bookingId: id,
        rating,
        comment: comment.trim(),
      });
      await resource.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title={b?.code ?? "Detail pendampingan"}
      back
      onRefresh={resource.reload}
      refreshing={resource.loading && !!b}
    >
      <AccountGate>
        <ResourceState resource={resource} />
        {b ? (
          <>
            <Card>
              <Title>{BOOKING_STATUS_LABELS[b.status] ?? b.status}</Title>
              <Body>{b.mutawif?.user.name ?? b.jamaah?.name}</Body>
              <Body>
                {SERVICE_LABELS[b.serviceType]} · {b.durationHours} jam
              </Body>
              <Body>{formatSchedule(b.scheduledStartAt)} WAS</Body>
              <Body>{b.meetingPointLabel}</Body>
              {b.notes ? <Body muted>{b.notes}</Body> : null}
              <Title>{formatRupiah(b.totalAmount)}</Title>
              <Body muted>Pembayaran langsung di luar aplikasi.</Body>
              <Button
                title="Buka titik pertemuan di peta"
                secondary
                onPress={() => {
                  void Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.meetingPointLabel)}`,
                  ).catch((e) => setError(errorMessage(e)));
                }}
              />
            </Card>
            {error ? <Notice error>{error}</Notice> : null}
            {user?.role === "MUTAWIF" ? (
              <Card>
                {b.status === "REQUESTED" ? (
                  <>
                    <Button
                      title="Terima permintaan"
                      busy={busy}
                      onPress={() => {
                        void action("accept");
                      }}
                    />
                    <Button
                      title="Tolak permintaan"
                      busy={busy}
                      secondary
                      onPress={() => {
                        void action("reject");
                      }}
                    />
                  </>
                ) : null}
                {b.status === "ACCEPTED" ? (
                  <Button
                    title="Mulai pendampingan"
                    busy={busy}
                    onPress={() => {
                      void action("start");
                    }}
                  />
                ) : null}
                {b.status === "ONGOING" ? (
                  <Button
                    title="Selesaikan pendampingan"
                    busy={busy}
                    onPress={() => {
                      void action("complete");
                    }}
                  />
                ) : null}
              </Card>
            ) : null}
            {["REQUESTED", "ACCEPTED", "ONGOING"].includes(b.status) ? (
              <Card>
                <Field
                  label="Alasan pembatalan"
                  value={reason}
                  onChangeText={setReason}
                  maxLength={255}
                />
                <Button
                  title="Batalkan pendampingan"
                  busy={busy}
                  disabled={reason.trim().length < 3}
                  secondary
                  onPress={() => {
                    void action("cancel");
                  }}
                />
              </Card>
            ) : null}
            {user?.role === "JAMAAH" &&
            b.status === "COMPLETED" &&
            !b.review ? (
              <Card>
                <Title>Bagaimana pendampinganmu?</Title>
                <View style={s.row}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Choice
                      key={n}
                      label={`${n}★`}
                      selected={rating === n}
                      onPress={() => setRating(n)}
                    />
                  ))}
                </View>
                <Field
                  label="Ulasan (opsional)"
                  multiline
                  maxLength={1000}
                  value={comment}
                  onChangeText={setComment}
                />
                <Button
                  title="Kirim ulasan"
                  busy={busy}
                  onPress={() => {
                    void review();
                  }}
                />
              </Card>
            ) : null}
            {b.review ? (
              <Notice>Ulasanmu: {b.review.rating} bintang.</Notice>
            ) : null}
            {b.events?.length ? (
              <Card>
                <Title>Riwayat status</Title>
                {b.events.map((event) => (
                  <Body key={event.id}>
                    {BOOKING_STATUS_LABELS[event.toStatus] ?? event.toStatus} ·{" "}
                    {formatSchedule(event.createdAt)} WAS
                  </Body>
                ))}
              </Card>
            ) : null}
          </>
        ) : null}
      </AccountGate>
    </Page>
  );
}
