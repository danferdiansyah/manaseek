import { api } from "../../lib/api";
import type {
  ChatMessage,
  ChatResult,
  ChatSession,
  Page,
} from "../../lib/models";

/** Transport details live here, separate from screen and conversation state. */
export const chatApi = {
  history: (page = 1) =>
    api.get<Page<ChatSession>>(`/chat/sessions?page=${page}&limit=15`),
  messages: (sessionId: string, page = 1) =>
    api.get<Page<ChatMessage>>(
      `/chat/sessions/${encodeURIComponent(sessionId)}/messages?page=${page}&limit=30`,
    ),
  send: (text: string, sessionId: string | null) =>
    api.post<ChatResult>(
      "/chat/messages",
      { text, ...(sessionId ? { sessionId } : {}) },
      { timeout: 125000 },
    ),
  remove: (sessionId: string | null) =>
    api.delete<{ deleted: number }>(
      `/chat/sessions${sessionId ? `/${encodeURIComponent(sessionId)}` : ""}`,
    ),
};
