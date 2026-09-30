import { useState } from "react";
import { Image, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  AccountGate,
  Body,
  Button,
  Card,
  Choice,
  Notice,
  Page,
  ResourceState,
  Title,
  colors,
  s,
} from "../components/ui";
import { LocationPicker } from "../components/LocationPicker";
import { usePosition } from "../lib/location";
import { useResource } from "../lib/resource";
import { SERVICE_LABELS, formatDistance, formatRupiah } from "../lib/format";
import type { Mutawif, Page as ApiPage, Review, Service } from "../lib/models";

export default function MutawifScreen() {
  const location = usePosition();
  const [service, setService] = useState<Service | null>(null);
  const point = location.position;
  const query = point
    ? `/mutawif/nearby?latitude=${point.latitude.toFixed(4)}&longitude=${point.longitude.toFixed(4)}&radiusKm=25${service ? `&serviceType=${service}` : ""}`
    : null;
  const resource = useResource<Mutawif[]>(query);
  return (
    <Page
      title="Bersama mutawif"
      subtitle="Pendamping untuk setiap langkah perjalananmu."
      onRefresh={resource.reload}
      refreshing={resource.loading && !!resource.data}
    >
      <AccountGate>
        <Card>
          <LocationPicker location={location} />
          <Body muted>
            Pencarian radius 25 km dari titik yang dipilih. Jarak merupakan
            perkiraan.
          </Body>
        </Card>
        <View style={[s.row, { flexWrap: "wrap" }]}>
          <Choice
            label="Semua"
            selected={!service}
            onPress={() => setService(null)}
          />
          {Object.entries(SERVICE_LABELS).map(([id, label]) => (
            <Choice
              key={id}
              label={label}
              selected={id === service}
              onPress={() => setService(id as Service)}
            />
          ))}
        </View>
        <ResourceState
          resource={resource}
          empty={!!point && !resource.data?.length}
        />
        {resource.data?.map((m) => (
          <Card key={m.id}>
            <View style={s.row}>
              {m.avatarUrl ? (
                <Image
                  source={{ uri: m.avatarUrl }}
                  style={{ width: 52, height: 52, borderRadius: 18 }}
                />
              ) : (
                <Text style={{ fontSize: 32 }}>◉</Text>
              )}
              <View style={{ flex: 1 }}>
                <Title>{m.name ?? "Mutawif"}</Title>
                <Body muted>
                  {m.yearsExperience} tahun pengalaman · {m.city}
                </Body>
              </View>
            </View>
            <Body muted>
              {formatDistance(m.distanceKm)} ·{" "}
              {m.ratingCount
                ? `★ ${m.ratingAverage.toFixed(1)} (${m.ratingCount} ulasan)`
                : "Belum ada ulasan"}
            </Body>
            <View style={s.between}>
              <Body>{formatRupiah(m.hourlyRate)} / jam</Body>
              <Text style={{ color: colors.green }}>
                {m.languages.join(" · ").toUpperCase()}
              </Text>
            </View>
            <Button
              title="Lihat pendamping"
              secondary
              onPress={() =>
                router.push({ pathname: "/mutawif/[id]", params: { id: m.id } })
              }
            />
          </Card>
        ))}
        <Button
          title="Riwayat booking"
          secondary
          onPress={() => router.push("/bookings")}
        />
      </AccountGate>
    </Page>
  );
}
export function MutawifDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useResource<Mutawif>(id ? `/mutawif/${id}` : null);
  const reviews = useResource<ApiPage<Review>>(
    id ? `/reviews?mutawifId=${id}&limit=10` : null,
  );
  const m = resource.data;
  return (
    <Page title={m?.user?.name ?? "Profil mutawif"} back>
      <AccountGate>
        <ResourceState resource={resource} />
        {m ? (
          <>
            <Card>
              <Title>{m.user?.name}</Title>
              <Body>{m.bio || "Pendamping ibadah Manaseek."}</Body>
              <Body muted>
                {m.city} · {m.yearsExperience} tahun pengalaman
              </Body>
              <Body muted>
                {m.languages.join(" · ").toUpperCase()} ·{" "}
                {m.availabilityStatus === "ONLINE"
                  ? "Sedang online"
                  : "Sedang tidak tersedia"}
              </Body>
              {m.verificationStatus !== "APPROVED" ? (
                <Notice>Profil ini belum terverifikasi.</Notice>
              ) : (
                <Body muted>✓ Terverifikasi</Body>
              )}
            </Card>
            <Card>
              <Title>Layanan pendampingan</Title>
              {m.rates?.map((rate) => (
                <View key={rate.serviceType} style={s.between}>
                  <Body>{SERVICE_LABELS[rate.serviceType]}</Body>
                  <Body>{formatRupiah(rate.hourlyRate)} / jam</Body>
                </View>
              ))}
              <Button
                title="Atur pendampingan"
                disabled={!m.rates?.length || m.availabilityStatus !== "ONLINE"}
                onPress={() =>
                  router.push({
                    pathname: "/booking",
                    params: { mutawifId: id },
                  })
                }
              />
            </Card>
            <Title>Ulasan jamaah</Title>
            <ResourceState
              resource={reviews}
              empty={!reviews.data?.items.length}
            />
            {reviews.data?.items.map((review) => (
              <Card key={review.id}>
                <Title>{"★".repeat(review.rating)}</Title>
                <Body>{review.comment || "Tanpa komentar"}</Body>
                <Body muted>{review.author?.name || "Jamaah"}</Body>
              </Card>
            ))}
          </>
        ) : null}
      </AccountGate>
    </Page>
  );
}
