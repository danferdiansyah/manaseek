import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { colors } from "./ui";
import type { ChatAnswerDetails } from "../lib/models";
import { referenceUrl } from "../lib/chat-references";
import { superscriptCitation } from "../lib/chat-format";

export function ChatAnswerEvidence({
  details,
}: {
  details?: ChatAnswerDetails | null;
}) {
  const [linkError, setLinkError] = useState<string | null>(null);
  if (!details || details.version !== 1)
    return (
      <Text style={styles.legacy}>
        Jawaban lama belum dilengkapi sumber. Tanyakan kembali untuk mencari
        rujukannya.
      </Text>
    );
  if (details.status !== "sourced") return null;
  async function open(url: string) {
    const safe = referenceUrl(url);
    if (!safe) {
      setLinkError("Tautan sumber tidak valid.");
      return;
    }
    setLinkError(null);
    try {
      await Linking.openURL(safe);
    } catch {
      setLinkError("Sumber belum bisa dibuka. Periksa koneksi lalu coba lagi.");
    }
  }
  return (
    <View style={styles.group}>
      {details.prayers.map((prayer, index) => (
        <View key={`${prayer.sourceId}-${index}`} style={styles.prayer}>
          <Text accessibilityRole="header" style={styles.prayerTitle}>
            {prayer.title}
          </Text>
          <Text selectable style={styles.arabic}>
            {prayer.arabic}
          </Text>
          <View style={styles.translation}>
            <Text style={styles.label}>ARTI DALAM BAHASA INDONESIA</Text>
            <Text selectable style={styles.body}>
              {prayer.translation}
            </Text>
          </View>
          <View style={styles.evidence}>
            <Ionicons name="book-outline" size={16} color={colors.gold} />
            <Text selectable style={styles.evidenceText}>
              {prayer.evidence}{" "}
              <Text accessibilityLabel={`Sumber ${prayer.sourceId}`}>
                {superscriptCitation([prayer.sourceId])}
              </Text>
            </Text>
          </View>
        </View>
      ))}
      <View style={styles.sources}>
        <View style={styles.heading}>
          <Ionicons name="library-outline" size={16} color={colors.green} />
          <Text style={styles.sourceHeading}>Sumber rujukan</Text>
        </View>
        {details.references.map((ref) => (
          <Pressable
            key={ref.id}
            accessibilityRole="link"
            accessibilityLabel={`Buka sumber ${ref.id}: ${ref.title}`}
            onPress={() => {
              void open(ref.url);
            }}
            style={({ pressed }) => [
              styles.reference,
              pressed && { opacity: 0.65 },
            ]}
          >
            <Text style={styles.number}>{ref.id}.</Text>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.sourceTitle}>{ref.title}</Text>
              <Text style={styles.publisher}>{ref.publisher}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.green} />
          </Pressable>
        ))}
        <Text style={styles.note}>
          Baca sumber untuk konteks lengkap. Penjelasan AI tetap dapat keliru.
        </Text>
        {linkError ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {linkError}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: 18 },
  prayer: {
    backgroundColor: colors.paper,
    borderRadius: 18,
    padding: 16,
    gap: 18,
    borderWidth: 1,
    borderColor: "#E5DECC",
  },
  prayerTitle: {
    color: colors.green,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "center",
  },
  arabic: {
    color: colors.dark,
    fontSize: 27,
    lineHeight: 50,
    textAlign: "center",
    writingDirection: "rtl",
    fontFamily: Platform.OS === "android" ? "serif" : undefined,
    paddingVertical: 6,
  },
  translation: { gap: 7 },
  label: {
    fontSize: 9,
    letterSpacing: 1,
    lineHeight: 15,
    fontWeight: "700",
    color: colors.gold,
  },
  body: { fontSize: 14, lineHeight: 23, color: colors.ink },
  evidence: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5DECC",
    paddingTop: 12,
  },
  evidenceText: { flex: 1, fontSize: 12, lineHeight: 20, color: colors.muted },
  sources: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 14,
    gap: 9,
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 7 },
  sourceHeading: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.green,
  },
  reference: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingVertical: 10,
    minHeight: 48,
  },
  number: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.gold,
    fontWeight: "700",
  },
  sourceTitle: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.green,
    textDecorationLine: "underline",
  },
  publisher: { fontSize: 11, lineHeight: 17, color: colors.muted },
  note: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  legacy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
    fontStyle: "italic",
  },
  error: { color: colors.red, fontSize: 12, lineHeight: 19 },
});
