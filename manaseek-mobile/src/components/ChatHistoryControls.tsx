import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "./ui";
import type { ChatSession } from "../lib/models";

export function ChatHistoryItem({
  item,
  active,
  onOpen,
  onDelete,
}: {
  item: ChatSession;
  active: boolean;
  onOpen(): void;
  onDelete(): void;
}) {
  return (
    <View style={[styles.item, active && { borderColor: colors.green }]}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={styles.content}
      >
        <Text numberOfLines={2} style={styles.title}>
          {item.title || "Percakapan"}
        </Text>
        <Text numberOfLines={2} style={styles.preview}>
          {item.preview}
        </Text>
        <Text style={styles.date}>
          {new Date(item.updatedAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          })}{" "}
          · {item.messageCount} pesan
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Hapus percakapan ${item.title || "ini"}`}
        onPress={onDelete}
        style={({ pressed }) => [styles.trash, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="trash-outline" size={20} color={colors.red} />
      </Pressable>
    </View>
  );
}

export function ChatDeleteConfirmation({
  title,
  all,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  title?: string | null;
  all: boolean;
  busy: boolean;
  error: string | null;
  onConfirm(): void;
  onCancel(): void;
}) {
  return (
    <ScrollView
      style={{ flexShrink: 1 }}
      contentContainerStyle={styles.confirmation}
    >
      <View style={styles.badge}>
        <Ionicons name="trash-outline" size={26} color={colors.red} />
      </View>
      <Text accessibilityRole="header" style={styles.heading}>
        {all ? "Hapus semua riwayat?" : "Hapus percakapan ini?"}
      </Text>
      {!all && title ? (
        <Text numberOfLines={3} style={styles.chatTitle}>
          “{title}”
        </Text>
      ) : null}
      <Text style={styles.description}>
        {all
          ? "Semua percakapan dan pesanmu akan dihapus dari akun ini."
          : "Semua pesan dalam percakapan ini akan dihapus dari akunmu."}{" "}
        Riwayat yang dihapus tidak bisa dikembalikan.
      </Text>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={onConfirm}
        style={({ pressed }) => [
          styles.confirmButton,
          { opacity: busy || pressed ? 0.6 : 1 },
        ]}
      >
        {busy ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.confirmLabel}>
            {all ? "Ya, hapus semua" : "Ya, hapus percakapan"}
          </Text>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={onCancel}
        style={styles.cancelButton}
      >
        <Text style={styles.cancelLabel}>Batal</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFF",
  },
  content: { flex: 1, minWidth: 0, padding: 14, gap: 6 },
  title: { color: colors.ink, fontSize: 14, lineHeight: 21, fontWeight: "700" },
  preview: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  date: { color: colors.gold, fontSize: 11, lineHeight: 17 },
  trash: {
    width: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  confirmation: { gap: 14, paddingVertical: 16 },
  badge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FAEBE8",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
  },
  chatTitle: {
    color: colors.green,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
  },
  description: { color: colors.muted, fontSize: 14, lineHeight: 23 },
  error: { color: colors.red, fontSize: 13, lineHeight: 21 },
  confirmButton: {
    backgroundColor: colors.red,
    borderRadius: 16,
    minHeight: 52,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmLabel: {
    color: "#FFF",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: colors.light,
    borderRadius: 16,
    minHeight: 52,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelLabel: {
    color: colors.green,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
});
