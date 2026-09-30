import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  AccountGate,
  Body,
  Button,
  Card,
  Field,
  Notice,
  Page,
  ResourceState,
  RowLink,
  Title,
  s,
} from "../components/ui";
import { useResource } from "../lib/resource";
import { api, errorMessage } from "../lib/api";
import { storage } from "../lib/storage";
import { useAuth } from "../lib/auth";
import type { Prayer, Topic } from "../lib/models";

export default function GuidanceScreen() {
  const auth = useAuth();
  const resource = useResource<{ items: Topic[] }>("/content/topics", true);
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const items =
    resource.data?.items.filter((t) =>
      `${t.title} ${t.summary}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  async function download() {
    if (!auth.user || downloading) return;
    setDownloading(true);
    setMessage(null);
    const id = auth.user.id;
    const version = api.sessionVersion;
    try {
      for (const item of resource.data?.items ?? []) {
        if (api.sessionVersion !== version) return;
        const topic = await api.get<Topic>(`/content/topics/${item.slug}`);
        await storage.set(
          `user:${id}:cache:/content/topics/${item.slug}`,
          topic,
        );
      }
      const prayers = await api.get<Prayer[]>("/content/prayers");
      await storage.set(`user:${id}:cache:/content/prayers`, prayers);
      setMessage(
        "Panduan dan doa tersimpan. Kamu bisa membacanya tanpa internet.",
      );
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setDownloading(false);
    }
  }
  return (
    <Page
      title="Langkah yang bermakna"
      subtitle="Panduan ibadah, dari persiapan hingga kepulangan."
      onRefresh={resource.reload}
      refreshing={resource.loading && !!resource.data}
    >
      <AccountGate>
        <Notice>
          Konten draf yang belum ditinjau pembimbing akan ditandai. Periksa
          status pada setiap panduan.
        </Notice>
        <Field
          label="Cari panduan"
          placeholder="Ihram, tawaf, sa’i…"
          value={search}
          onChangeText={setSearch}
        />
        <Button
          title="Unduh panduan & doa untuk offline"
          secondary
          busy={downloading}
          disabled={!resource.data}
          onPress={() => {
            void download();
          }}
        />
        {message ? <Notice>{message}</Notice> : null}
        <RowLink
          title="Kumpulan doa"
          subtitle="Arab, transliterasi, dan terjemahan"
          href="/prayers"
        />
        <ResourceState resource={resource} empty={!items.length} />
        {items.map((topic) => (
          <RowLink
            key={topic.id}
            title={topic.title}
            subtitle={`${topic.readingMinutes} menit · ${topic.status === "PUBLISHED" ? "Ditinjau" : "Draf, belum ditinjau"}\n${topic.summary}`}
            href={{
              pathname: "/guidance/[slug]",
              params: { slug: topic.slug },
            }}
          />
        ))}
      </AccountGate>
    </Page>
  );
}
function PrayerCard({ prayer }: { prayer: Prayer }) {
  return (
    <Card>
      <Title>{prayer.title}</Title>
      {prayer.context ? <Body muted>{prayer.context}</Body> : null}
      <Text
        style={{
          fontSize: 27,
          lineHeight: 49,
          textAlign: "right",
          writingDirection: "rtl",
          color: "#203D30",
        }}
      >
        {prayer.arabic}
      </Text>
      <Text style={[s.text, { fontStyle: "italic" }]}>
        {prayer.transliteration}
      </Text>
      <Body>{prayer.translation}</Body>
    </Card>
  );
}
export function GuidanceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const resource = useResource<Topic>(
    slug ? `/content/topics/${encodeURIComponent(slug)}` : null,
    true,
  );
  const topic = resource.data;
  return (
    <Page
      title={topic?.title ?? "Panduan ibadah"}
      back
      onRefresh={resource.reload}
      refreshing={resource.loading && !!topic}
    >
      <AccountGate>
        <ResourceState resource={resource} />
        {topic ? (
          <>
            {topic.status !== "PUBLISHED" ? (
              <Notice>Draf · panduan ini belum ditinjau pembimbing.</Notice>
            ) : null}
            <Body>{topic.summary}</Body>
            {topic.steps?.map((step, i) => (
              <Card key={step.id}>
                <Title>Langkah {i + 1}</Title>
                <Body>{step.text}</Body>
              </Card>
            ))}
            {topic.prayers?.map((p) => (
              <PrayerCard key={p.id} prayer={p} />
            ))}
            {topic.references?.length ? (
              <Card>
                <Title>Rujukan</Title>
                {topic.references.map((ref) => (
                  <View key={ref.id} style={{ gap: 5 }}>
                    <Body>{ref.citation}</Body>
                    {ref.gloss ? <Body muted>{ref.gloss}</Body> : null}
                    {!ref.verifiedAt ? (
                      <Body muted>Menunggu verifikasi pembimbing</Body>
                    ) : null}
                  </View>
                ))}
              </Card>
            ) : null}
            {topic.prohibitions?.map((item) => (
              <Notice key={item.id}>
                {item.text}
                {item.consequence ? `\n${item.consequence}` : ""}
              </Notice>
            ))}
            {topic.next ? (
              <RowLink
                title={`Lanjut: ${topic.next.title}`}
                href={{
                  pathname: "/guidance/[slug]",
                  params: { slug: topic.next.slug },
                }}
              />
            ) : null}
          </>
        ) : null}
      </AccountGate>
    </Page>
  );
}
export function PrayersScreen() {
  const resource = useResource<Prayer[]>("/content/prayers", true);
  return (
    <Page
      title="Doa dalam perjalanan"
      back
      onRefresh={resource.reload}
      refreshing={resource.loading && !!resource.data}
    >
      <AccountGate>
        <Notice>Rujukan doa masih menunggu verifikasi pembimbing.</Notice>
        <ResourceState resource={resource} empty={!resource.data?.length} />
        {resource.data?.map((prayer) => (
          <PrayerCard key={prayer.id} prayer={prayer} />
        ))}
      </AccountGate>
    </Page>
  );
}
