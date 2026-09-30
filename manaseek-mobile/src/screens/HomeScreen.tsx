import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import {
  Body,
  Button,
  Card,
  Notice,
  Page,
  Title,
  colors,
  s,
} from "../components/ui";
import { LocationPicker } from "../components/LocationPicker";
import { useAuth } from "../lib/auth";
import { usePosition } from "../lib/location";
import {
  deviceTimezoneLabel,
  formatClock,
  nextPrayer,
  prayerTimes,
  timezoneLooksWrong,
} from "../../../packages/shared/prayer-times.js";

const services: {
  title: string;
  subtitle: string;
  href: Href;
  image: number;
}[] = [
  {
    title: "Panduan ibadah",
    subtitle: "Satu langkah setiap hari",
    href: "/guidance",
    image: require("../../assets/services/hajj.webp"),
  },
  {
    title: "Tanya Manaseek",
    subtitle: "Asisten dari pustaka panduan",
    href: "/chat",
    image: require("../../assets/services/chat.webp"),
  },
  {
    title: "Cari mutawif",
    subtitle: "Teman dalam perjalanan",
    href: "/mutawif",
    image: require("../../assets/services/mutawif.webp"),
  },
  {
    title: "Arah kiblat",
    subtitle: "Temukan arah shalat",
    href: "/qibla",
    image: require("../../assets/services/qibla.webp"),
  },
  {
    title: "Checklist",
    subtitle: "Siapkan keberangkatan",
    href: "/checklist",
    image: require("../../assets/services/checklist.webp"),
  },
  {
    title: "Riyal ↔ Rupiah",
    subtitle: "Hitung tanpa internet",
    href: "/currency",
    image: require("../../assets/services/travel.webp"),
  },
];
export default function HomeScreen() {
  const { user, issue } = useAuth();
  const location = usePosition();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const times = location.position
    ? prayerTimes({ ...location.position, date: now })
    : null;
  const next = location.position
    ? nextPrayer({ ...location.position, now }).next
    : null;
  return (
    <Page
      title={`Assalamu’alaikum${user?.name ? `,\n${user.name.split(" ")[0]}` : "."}`}
      subtitle="Teman tenang dalam setiap langkah ibadah."
    >
      {issue ? <Notice>{issue}</Notice> : null}
      {!user ? (
        <Card>
          <Title>Perjalanan baik dimulai di sini</Title>
          <Body muted>
            Masuk untuk menyimpan persiapan dan terhubung dengan pendamping
            ibadah.
          </Body>
          <Button
            title="Mulai dengan Google"
            onPress={() => router.push("/login")}
          />
        </Card>
      ) : null}
      <Card>
        <View style={s.between}>
          <Title>Waktu shalat</Title>
          <Body muted>{deviceTimezoneLabel(now)}</Body>
        </View>
        <LocationPicker location={location} />
        {times ? (
          <>
            <Body muted>{times.method.label} · dihitung di perangkat</Body>
            {location.position && timezoneLooksWrong(location.position) ? (
              <Notice>
                Zona waktu ponsel tidak sesuai lokasi. Periksa pengaturan waktu;
                jadwal mengikuti zona waktu ponsel.
              </Notice>
            ) : null}
            <View
              style={[
                s.row,
                { flexWrap: "wrap", justifyContent: "space-between" },
              ]}
            >
              {times.times
                .filter((t) => !t.informational)
                .map((t) => (
                  <View key={t.id} style={{ paddingVertical: 10, gap: 6 }}>
                    <Text
                      style={{
                        color: t.id === next?.id ? colors.green : colors.muted,
                        fontSize: 12,
                      }}
                    >
                      {t.label}
                    </Text>
                    <Text
                      style={{
                        color: colors.ink,
                        fontWeight: "700",
                        fontSize: 17,
                      }}
                    >
                      {formatClock(t.at)}
                    </Text>
                  </View>
                ))}
            </View>
          </>
        ) : null}
      </Card>
      <Title>Untuk perjalananmu</Title>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {services.map((item) => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            style={[
              s.card,
              { width: "48%", flexGrow: 1, alignItems: "flex-start" },
            ]}
          >
            <Image source={item.image} style={{ width: 62, height: 62 }} />
            <Text style={[s.subtitle, { fontSize: 15 }]}>{item.title}</Text>
            <Body muted>{item.subtitle}</Body>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/umrah")}
      >
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <Image
            source={require("../../assets/umrah/makkah-dawn.webp")}
            style={{ width: "100%", height: 140 }}
          />
          <View style={{ padding: 18, gap: 8 }}>
            <Title>Rencanakan umrohmu</Title>
            <Body muted>
              Jelajahi paket dan jadwal perjalanan. Paket & pembayaran masih
              simulasi.
            </Body>
          </View>
        </Card>
      </Pressable>
      {user?.role === "MUTAWIF" ? (
        <Button
          title="Buka dashboard mutawif"
          onPress={() => router.push("/dashboard")}
        />
      ) : null}
    </Page>
  );
}
