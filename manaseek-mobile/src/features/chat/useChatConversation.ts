import { useEffect, useRef, useState } from "react";
import { errorMessage, ApiError } from "../../lib/api-client";
import { chatApi } from "./chat-api";
import type { ChatMessage, ChatSession } from "../../lib/models";

/** Per-account conversation state; screens own only rendering and navigation. */
export function useChatConversation() {
  const mounted = useRef(true);
  const generation = useRef(0);
  const sending = useRef(false);
  const scrollToLatest = useRef(false);
  const historyFetching = useRef(false);
  const historyGeneration = useRef(0);
  const deleting = useRef(false);
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | "all" | null>(
    null,
  );
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMore, setHistoryMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [olderPage, setOlderPage] = useState(1);
  const [olderMore, setOlderMore] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ChatMessage | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function history(page = 1) {
    if (historyFetching.current || deleting.current) return;
    const ticket = ++historyGeneration.current;
    historyFetching.current = true;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const result = await chatApi.history(page);
      if (!mounted.current || ticket !== historyGeneration.current) return;
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
    } catch (e) {
      if (mounted.current && ticket === historyGeneration.current)
        setHistoryError(errorMessage(e));
    } finally {
      if (ticket === historyGeneration.current) {
        historyFetching.current = false;
        if (mounted.current) setHistoryLoading(false);
      }
    }
  }
  async function open(id: string) {
    if (sending.current || deleting.current) return;
    const ticket = ++generation.current;
    setSession(id);
    setMessages([]);
    setText("");
    setError(null);
    setOlderMore(false);
    setLoading(true);
    setShowHistory(false);
    try {
      const result = await chatApi.messages(id);
      if (ticket !== generation.current || !mounted.current) return;
      scrollToLatest.current = true;
      setMessages(result.items);
      setOlderPage(1);
      setOlderMore(result.meta.totalPages > 1);
    } catch (e) {
      if (ticket === generation.current && mounted.current)
        setError(errorMessage(e));
    } finally {
      if (ticket === generation.current && mounted.current) setLoading(false);
    }
  }
  async function older() {
    if (!session || loading || sending.current || deleting.current) return;
    const ticket = generation.current;
    setLoading(true);
    try {
      const result = await chatApi.messages(session, olderPage + 1);
      if (ticket !== generation.current || !mounted.current) return;
      setMessages((prev) => [
        ...result.items.filter((item) => !prev.some((p) => p.id === item.id)),
        ...prev,
      ]);
      setOlderPage(result.meta.page);
      setOlderMore(result.meta.page < result.meta.totalPages);
    } catch (e) {
      if (ticket === generation.current && mounted.current)
        setError(errorMessage(e));
    } finally {
      if (ticket === generation.current && mounted.current) setLoading(false);
    }
  }
  function resetConversation() {
    generation.current++;
    setSession(null);
    setMessages([]);
    setText("");
    setError(null);
    setLoading(false);
    setOlderMore(false);
    setOlderPage(1);
    setPending(null);
    setBusy(false);
  }
  function newChat() {
    if (sending.current || deleting.current) return;
    resetConversation();
    setShowHistory(false);
  }
  function closeHistory() {
    if (deleting.current) return;
    setDeleteTarget(null);
    setDeleteError(null);
    setShowHistory(false);
  }
  async function removeHistory() {
    if (!deleteTarget || deleting.current || sending.current) return;
    deleting.current = true;
    setDeleteBusy(true);
    setDeleteError(null);
    // In-flight pages cannot restore deleted rows or disturb the next refresh.
    historyGeneration.current++;
    historyFetching.current = false;
    setHistoryLoading(false);
    let refresh = false;
    try {
      const all = deleteTarget === "all";
      const id = all ? null : deleteTarget.id;
      await chatApi.remove(id);
      if (!mounted.current) return;
      setSessions((prev) => (all ? [] : prev.filter((item) => item.id !== id)));
      setHistoryPage(1);
      setHistoryMore(false);
      setHistoryError(null);
      if (all || id === session) resetConversation();
      setDeleteTarget(null);
      refresh = true;
    } catch (e) {
      if (mounted.current) setDeleteError(errorMessage(e));
    } finally {
      deleting.current = false;
      if (mounted.current) {
        setDeleteBusy(false);
        if (refresh) void history();
      }
    }
  }
  async function send() {
    const question = text.trim();
    if (sending.current || deleting.current || loading || question.length < 2)
      return;
    sending.current = true;
    const ticket = generation.current;
    scrollToLatest.current = true;
    setBusy(true);
    setError(null);
    setText("");
    setPending({
      id: "pending",
      role: "USER",
      content: question,
      citedSlugs: [],
      escalated: false,
      createdAt: new Date().toISOString(),
    });
    try {
      const result = await chatApi.send(question, session);
      if (ticket !== generation.current || !mounted.current) return;
      scrollToLatest.current = true;
      setSession(result.sessionId);
      setMessages((prev) => [...prev, result.userMessage, result.message]);
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
      } else {
        setText(question);
      }
      setError(errorMessage(e));
    } finally {
      sending.current = false;
      if (ticket === generation.current && mounted.current) {
        setPending(null);
        setBusy(false);
      }
    }
  }

  function consumeScrollRequest() {
    const requested = scrollToLatest.current;
    scrollToLatest.current = false;
    return requested;
  }

  return {
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
  };
}
