import { useRef, useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AccountGate,
  Body,
  Button,
  Notice,
  Page,
  RowLink,
  colors,
  s,
} from "../components/ui";
import { ChatAnswerEvidence } from "../components/ChatAnswerEvidence";
import { ChatAnswerBody } from "../components/ChatAnswerBody";
import {
  ChatDeleteConfirmation,
  ChatHistoryItem,
} from "../components/ChatHistoryControls";
import { useAuth } from "../lib/auth";
import type { ChatMessage } from "../lib/models";
import { useChatConversation } from "../features/chat/useChatConversation";
import { styles } from "../features/chat/chat.styles";

const suggestions = [
  {
    icon: "sunny-outline",
    title: "Ibadah sehari-hari",
    question: "Bagaimana cara menjaga salat agar lebih khusyuk?",
  },
  {
    icon: "heart-outline",
    title: "Doa & ketenangan",
    question: "Apa doa dan amalan ketika hati sedang gelisah?",
  },
  {
    icon: "moon-outline",
    title: "Haji & umrah",
    question: "Apa saja yang perlu disiapkan sebelum umrah pertama?",
  },
] as const;

type IconName = ComponentProps<typeof Ionicons>["name"];
function IconButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: IconName;
  label: string;
  onPress(): void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { opacity: disabled ? 0.35 : pressed ? 0.65 : 1 },
      ]}
    >
      <Ionicons name={icon} size={22} color="#FFF" />
    </Pressable>
  );
}

export default function ChatScreen() {
  const { user, refresh, issue } = useAuth();
  const [checkingAccess, setCheckingAccess] = useState(false);
  if (!user)
    return (
      <Page
        title="Tanya Manaseek"
        subtitle="Teman bertanya, teman memahami Islam."
      >
        <AccountGate>{null}</AccountGate>
      </Page>
    );
  if (user.permissions?.aiChat !== true) {
    const unknown = user.permissions?.aiChat === undefined;
    return (
      <Page title="Tanya Manaseek" subtitle="Teman memahami Islam">
        <View
          style={[
            s.card,
            { gap: 16, alignItems: "center", paddingVertical: 28 },
          ]}
        >
          <View
            style={{
              backgroundColor: colors.light,
              padding: 18,
              borderRadius: 50,
            }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={30}
              color={colors.green}
            />
          </View>
          <Text style={[s.title, { textAlign: "center" }]}>
            {unknown ? "Periksa akses akun" : "Akses AI masih terbatas"}
          </Text>
          <Body>
            {unknown
              ? "Sambungkan ke internet untuk memeriksa akses Tanya Manaseek."
              : "Tanya Manaseek hanya tersedia untuk akun yang telah diizinkan. Fitur Manaseek lainnya tetap bisa kamu gunakan."}
          </Body>
          <Text style={[s.muted, { textAlign: "center" }]}>{user.email}</Text>
          {issue ? <Notice>{issue}</Notice> : null}
          <Button
            title="Periksa akses"
            busy={checkingAccess}
            secondary
            onPress={async () => {
              setCheckingAccess(true);
              try {
                await refresh();
              } finally {
                setCheckingAccess(false);
              }
            }}
          />
        </View>
        <RowLink title="Buka profil akun" href="/profile" />
      </Page>
    );
  }
  return <Conversation key={user.id} />;
}

function Conversation() {
  const insets = useSafeAreaInsets();
  const list = useRef<FlatList<ChatMessage>>(null);
  const input = useRef<TextInput>(null);
  const {
    consumeScrollRequest,
    deleteTarget,
    setDeleteTarget,
    deleteBusy,
    deleteError,
    setDeleteError,
    sessions,
    historyPage,
    historyMore,
    historyLoading,
    historyError,
    showHistory,
    setShowHistory,
    session,
    messages,
    olderMore,
    text,
    setText,
    busy,
    loading,
    error,
    pending,
    history,
    open,
    older,
    newChat,
    closeHistory,
    removeHistory,
    send,
  } = useChatConversation();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[colors.dark, colors.green]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Tanya Manaseek</Text>
            <Text style={styles.headerSubtitle}>Teman memahami Islam</Text>
          </View>
          <IconButton
            icon="time-outline"
            label="Riwayat percakapan"
            disabled={busy || deleteBusy}
            onPress={() => {
              setShowHistory(true);
              void history();
            }}
          />
          <IconButton
            icon="create-outline"
            label="Percakapan baru"
            disabled={busy || deleteBusy}
            onPress={newChat}
          />
        </View>
      </LinearGradient>
      <FlatList
        ref={list}
        data={pending ? [...messages, pending] : messages}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.conversation,
          !messages.length && !pending && { flexGrow: 1 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        onContentSizeChange={() => {
          if (consumeScrollRequest()) {
            list.current?.scrollToEnd({ animated: true });
          }
        }}
        ListHeaderComponent={
          olderMore ? (
            <Button
              title="Pesan sebelumnya"
              secondary
              busy={loading}
              disabled={busy}
              onPress={() => {
                void older();
              }}
            />
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.green} />
              <Body muted>Memuat percakapan…</Body>
            </View>
          ) : (
            <View style={styles.welcome}>
              <View style={styles.emblem}>
                <Image
                  source={require("../../assets/mark.png")}
                  style={{ width: 48, height: 48 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.eyebrow}>BISMILLAH, MARI BELAJAR</Text>
              <Text accessibilityRole="header" style={styles.welcomeTitle}>
                Setiap pertanyaan,{"\n"}selangkah lebih paham.
              </Text>
              <Text style={styles.welcomeBody}>
                Tentang ibadah, doa, dan keseharian dalam Islam. Mulai dari yang
                ingin kamu ketahui.
              </Text>
              <View style={styles.suggestions}>
                {suggestions.map((item) => (
                  <Pressable
                    key={item.title}
                    accessibilityRole="button"
                    accessibilityLabel={item.question}
                    onPress={() => {
                      setText(item.question);
                      input.current?.focus();
                    }}
                    style={({ pressed }) => [
                      styles.suggestion,
                      pressed && { backgroundColor: colors.light },
                    ]}
                  >
                    <View style={styles.suggestionIcon}>
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={colors.green}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={styles.suggestionTitle}>{item.title}</Text>
                      <Text style={styles.suggestionQuestion}>
                        {item.question}
                      </Text>
                    </View>
                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color={colors.gold}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.role === "USER"
                ? styles.userMessage
                : styles.assistantMessage,
            ]}
          >
            {item.role === "ASSISTANT" ? (
              <View style={[s.row, { gap: 7 }]}>
                <Image
                  source={require("../../assets/mark.png")}
                  style={{ width: 22, height: 22 }}
                  resizeMode="contain"
                />
                <Text style={styles.author}>MANASEEK</Text>
              </View>
            ) : null}
            {item.role === "ASSISTANT" ? (
              <ChatAnswerBody content={item.content} />
            ) : (
              <Text selectable style={[styles.messageText, { color: "#FFF" }]}>
                {item.content}
              </Text>
            )}
            {item.role === "ASSISTANT" ? (
              <ChatAnswerEvidence details={item.answerDetails} />
            ) : null}
            {item.citedSlugs.map((slug) => (
              <RowLink
                key={slug}
                title={slug.replaceAll("-", " ")}
                href={{ pathname: "/guidance/[slug]", params: { slug } }}
              />
            ))}
            {item.escalated ? (
              <View style={styles.guidanceNote}>
                <Text style={s.muted}>
                  Untuk keputusan pribadi, konsultasikan dengan ustaz atau
                  pembimbing tepercaya.
                </Text>
                <RowLink title="Cari pendamping ibadah" href="/mutawif" />
              </View>
            ) : null}
          </View>
        )}
        ListFooterComponent={
          <View style={{ gap: 12 }}>
            {busy ? (
              <View accessibilityLiveRegion="polite" style={styles.thinking}>
                <ActivityIndicator size="small" color={colors.green} />
                <Text style={s.muted}>
                  Mencari sumber dan memeriksa jawaban…
                </Text>
              </View>
            ) : null}
            {error ? (
              <>
                <Notice error>
                  {error}
                  {"\n"}
                  {session
                    ? "Muat ulang untuk memeriksa pesan yang sudah tersimpan."
                    : "Periksa riwayat sebelum mengirim ulang jika koneksi terputus."}
                </Notice>
                {session ? (
                  <Button
                    title="Muat ulang percakapan"
                    secondary
                    onPress={() => {
                      void open(session);
                    }}
                  />
                ) : (
                  <Button
                    title="Periksa riwayat"
                    secondary
                    onPress={() => {
                      setShowHistory(true);
                      void history();
                    }}
                  />
                )}
              </>
            ) : null}
          </View>
        }
      />
      <View style={[styles.composerArea, { paddingBottom: 12 }]}>
        <View style={styles.composer}>
          <TextInput
            ref={input}
            accessibilityLabel="Pertanyaan tentang Islam"
            placeholder="Tanyakan tentang Islam…"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            value={text}
            onChangeText={setText}
            editable={!busy && !loading && !deleteBusy}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kirim pertanyaan"
            accessibilityState={{
              disabled: busy || loading || deleteBusy || text.trim().length < 2,
              busy,
            }}
            disabled={busy || loading || deleteBusy || text.trim().length < 2}
            onPress={() => {
              void send();
            }}
            style={({ pressed }) => [
              styles.send,
              {
                opacity:
                  busy || loading || deleteBusy || text.trim().length < 2
                    ? 0.4
                    : pressed
                      ? 0.7
                      : 1,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="arrow-up" size={24} color="#FFF" />
            )}
          </Pressable>
        </View>
        {text.length > 800 ? (
          <Text style={styles.counter}>{text.length}/1000</Text>
        ) : null}
        <Text style={styles.disclaimer}>
          Asisten AI dapat keliru. Pastikan dalil dengan sumber tepercaya.
        </Text>
      </View>
      <Modal
        visible={showHistory}
        transparent
        animationType="slide"
        onRequestClose={closeHistory}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Tutup riwayat"
            accessibilityRole="button"
            onPress={closeHistory}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={s.between}>
              <Text style={s.title}>Percakapanmu</Text>
              <Pressable
                accessibilityLabel="Tutup riwayat"
                accessibilityRole="button"
                onPress={closeHistory}
                disabled={deleteBusy}
                style={styles.close}
              >
                <Ionicons name="close" size={24} color={colors.ink} />
              </Pressable>
            </View>
            {deleteTarget ? (
              <ChatDeleteConfirmation
                all={deleteTarget === "all"}
                title={deleteTarget === "all" ? null : deleteTarget.title}
                busy={deleteBusy}
                error={deleteError}
                onConfirm={() => {
                  void removeHistory();
                }}
                onCancel={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
              />
            ) : (
              <>
                <Button title="Mulai percakapan baru" onPress={newChat} />
                {sessions.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setDeleteError(null);
                      setDeleteTarget("all");
                    }}
                    style={styles.clearHistory}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.red}
                    />
                    <Text
                      style={{
                        color: colors.red,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      Hapus semua riwayat
                    </Text>
                  </Pressable>
                ) : null}
                <FlatList
                  data={sessions}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ gap: 10, paddingVertical: 16 }}
                  renderItem={({ item }) => (
                    <ChatHistoryItem
                      item={item}
                      active={item.id === session}
                      onOpen={() => {
                        void open(item.id);
                      }}
                      onDelete={() => {
                        setDeleteError(null);
                        setDeleteTarget(item);
                      }}
                    />
                  )}
                  ListEmptyComponent={
                    !historyLoading && !historyError ? (
                      <Body muted>
                        Belum ada percakapan tersimpan. Mulai dengan satu
                        pertanyaan.
                      </Body>
                    ) : null
                  }
                  ListFooterComponent={
                    <View style={{ gap: 12 }}>
                      {historyLoading ? (
                        <ActivityIndicator color={colors.green} />
                      ) : null}
                      {historyError ? (
                        <>
                          <Notice error>{historyError}</Notice>
                          <Button
                            title="Coba muat lagi"
                            secondary
                            onPress={() => {
                              void history();
                            }}
                          />
                        </>
                      ) : null}
                      {historyMore && !historyLoading ? (
                        <Button
                          title="Riwayat lainnya"
                          secondary
                          onPress={() => {
                            void history(historyPage + 1);
                          }}
                        />
                      ) : null}
                    </View>
                  }
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
