import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import {
  AccountGate,
  Body,
  Button,
  Card,
  Field,
  Notice,
  Page,
  RowLink,
  Title,
  colors,
  s,
} from "../components/ui";
import { api, ApiError, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import type {
  ChatMessage,
  ChatResult,
  ChatSession,
  Page as ApiPage,
} from "../lib/models";

export default function ChatScreen() {
  const { user } = useAuth();
  return (
    <Page
      title="Tanya Manaseek"
      back
      subtitle="Jawaban dari pustaka panduan, dengan rujukan yang bisa dibaca kembali."
    >
      <AccountGate>{user ? <Conversation key={user.id} /> : null}</AccountGate>
    </Page>
  );
}
function Conversation() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMore, setHistoryMore] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [olderPage, setOlderPage] = useState(1);
  const [olderMore, setOlderMore] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  async function history(page = 1) {
    const result = await api.get<ApiPage<ChatSession>>(
      `/chat/sessions?page=${page}&limit=15`,
    );
    if (!mounted.current) return result;
    setSessions((prev) =>
      page === 1
        ? result.items
        : [
            ...prev,
            ...result.items.filter(
              (item) => !prev.some((p) => p.id === item.id),
            ),
          ],
    );
    setHistoryPage(page);
    setHistoryMore(page < result.meta.totalPages);
    return result;
  }
  async function open(id: string) {
    const ticket = ++generation.current;
    setSession(id);
    setMessages([]);
    setError(null);
    setText("");
    setLoading(true);
    setOlderMore(false);
    setShowHistory(false);
    try {
      const result = await api.get<ApiPage<ChatMessage>>(
        `/chat/sessions/${id}/messages?limit=30`,
      );
      if (ticket === generation.current && mounted.current) {
        setMessages(result.items);
        setOlderPage(1);
        setOlderMore(result.meta.totalPages > 1);
      }
    } catch (e) {
      if (ticket === generation.current && mounted.current)
        setError(errorMessage(e));
    } finally {
      if (ticket === generation.current && mounted.current) setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    const ticket = generation.current;
    void history()
      .then((result) => {
        if (mounted.current && generation.current === ticket && result.items[0])
          void open(result.items[0].id);
      })
      .catch((e) => {
        if (mounted.current) setError(errorMessage(e));
      });
    return () => {
      mounted.current = false;
      invalidate();
    };
  }, [invalidate]);
  async function older() {
    if (!session || loading) return;
    const ticket = generation.current;
    setLoading(true);
    try {
      const result = await api.get<ApiPage<ChatMessage>>(
        `/chat/sessions/${session}/messages?page=${olderPage + 1}&limit=30`,
      );
      if (ticket === generation.current && mounted.current) {
        setMessages((prev) => [
          ...result.items.filter((item) => !prev.some((p) => p.id === item.id)),
          ...prev,
        ]);
        setOlderPage((p) => p + 1);
        setOlderMore(result.meta.page < result.meta.totalPages);
      }
    } catch (e) {
      if (ticket === generation.current && mounted.current)
        setError(errorMessage(e));
    } finally {
      if (ticket === generation.current && mounted.current) setLoading(false);
    }
  }
  async function send() {
    const question = text.trim();
    if (busy || loading || question.length < 2) return;
    const ticket = generation.current;
    setBusy(true);
    setError(null);
    try {
      const result = await api.post<ChatResult>(
        "/chat/messages",
        { text: question, ...(session ? { sessionId: session } : {}) },
        { timeout: 90000 },
      );
      if (ticket !== generation.current || !mounted.current) return;
      setSession(result.sessionId);
      setMessages((prev) => [...prev, result.userMessage, result.message]);
      setText("");
      void history().catch(() => {});
    } catch (e) {
      if (ticket !== generation.current || !mounted.current) return;
      if (
        e instanceof ApiError &&
        typeof e.details?.sessionId === "string" &&
        e.details.userMessage
      ) {
        const saved = e.details.userMessage as ChatMessage;
        setSession(e.details.sessionId);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== saved.id),
          saved,
        ]);
        setText("");
        void history().catch(() => {});
      }
      setError(errorMessage(e));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <>
      <Notice>
        Konten dan dalil yang belum diverifikasi tetap perlu ditinjau
        pembimbing. Untuk kondisi pribadi, hubungi mutawif.
      </Notice>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Button
            title="Riwayat"
            secondary
            onPress={() => {
              setShowHistory((v) => !v);
              void history().catch((e) => setError(errorMessage(e)));
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Chat baru"
            secondary
            onPress={() => {
              generation.current++;
              setSession(null);
              setMessages([]);
              setText("");
              setError(null);
              setLoading(false);
              setOlderMore(false);
              setShowHistory(false);
            }}
          />
        </View>
      </View>
      {showHistory ? (
        <Card>
          <Title>Riwayat percakapan</Title>
          {sessions.map((item) => (
            <Button
              key={item.id}
              title={item.title || "Percakapan"}
              secondary
              onPress={() => {
                void open(item.id);
              }}
            />
          ))}
          {!sessions.length ? <Body muted>Belum ada percakapan.</Body> : null}
          {historyMore ? (
            <Button
              title="Riwayat berikutnya"
              secondary
              onPress={() => {
                void history(historyPage + 1).catch((e) =>
                  setError(errorMessage(e)),
                );
              }}
            />
          ) : null}
        </Card>
      ) : null}
      {olderMore ? (
        <Button
          title="Muat pesan sebelumnya"
          busy={loading}
          secondary
          onPress={() => {
            void older();
          }}
        />
      ) : null}
      {loading && !messages.length ? (
        <Body muted>Memuat percakapan…</Body>
      ) : null}
      {!messages.length && !loading ? (
        <Card>
          <Title>Apa yang ingin kamu pahami?</Title>
          <Body muted>
            Tanyakan langkah ibadah atau persiapan perjalanan. Rujukan jawaban
            akan ditampilkan bersama pesan.
          </Body>
        </Card>
      ) : null}
      {messages.map((message) => (
        <Card
          key={message.id}
          style={{
            backgroundColor: message.role === "USER" ? colors.light : "#FFF",
            marginLeft: message.role === "USER" ? 24 : 0,
            marginRight: message.role === "ASSISTANT" ? 12 : 0,
          }}
        >
          <Text style={[s.muted, { fontWeight: "700" }]}>
            {message.role === "USER" ? "Kamu" : "Manaseek"}
          </Text>
          <Body>{message.content}</Body>
          {message.citedSlugs.map((slug) => (
            <RowLink
              key={slug}
              title={slug.replaceAll("-", " ")}
              href={{ pathname: "/guidance/[slug]", params: { slug } }}
            />
          ))}
          {message.escalated ? (
            <RowLink title="Hubungi mutawif" href="/mutawif" />
          ) : null}
        </Card>
      ))}
      {error ? (
        <Notice error>
          {error}
          {session
            ? "\nMuat ulang percakapan sebelum mengirim ulang jika koneksi terputus."
            : ""}
        </Notice>
      ) : null}
      {error && session ? (
        <Button
          title="Muat ulang percakapan"
          secondary
          onPress={() => {
            void open(session);
          }}
        />
      ) : null}
      <Card>
        <Field
          label="Pesanmu"
          placeholder="Bagaimana urutan pelaksanaan umroh?"
          multiline
          maxLength={1000}
          value={text}
          onChangeText={setText}
        />
        <Body muted>{text.length}/1000 karakter</Body>
        <Button
          title="Kirim pertanyaan"
          busy={busy}
          disabled={loading || text.trim().length < 2}
          onPress={() => {
            void send();
          }}
        />
      </Card>
    </>
  );
}
