import { useEffect, useRef, useState } from 'react'
import { api } from './api'

const EMPTY = { status: 'ready', session: null, messages: [], meta: null, error: null }
const messagePath = (id, page = 1) => `/chat/sessions/${encodeURIComponent(id)}/messages?page=${page}&limit=50`

function fromPage(page) {
  return { status: 'ready', session: page.session, messages: page.items, meta: page.meta, error: null }
}

export function useChatConversation() {
  const [conversation, setConversation] = useState({ ...EMPTY, status: 'loading' })
  const [restoreAttempt, setRestoreAttempt] = useState(0)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [olderError, setOlderError] = useState(null)
  const requestVersion = useRef(0)
  const sendLock = useRef(false)
  const olderLock = useRef(false)

  useEffect(() => {
    const version = ++requestVersion.current
    const restore = async () => {
      try {
        const history = await api.get('/chat/sessions?page=1&limit=1')
        if (version !== requestVersion.current) return
        const latest = history.items[0]
        const page = latest ? await api.get(messagePath(latest.id)) : null
        if (version === requestVersion.current) setConversation(page ? fromPage(page) : EMPTY)
      } catch (error) {
        if (version === requestVersion.current) {
          setConversation({ ...EMPTY, status: 'error', error: error.message ?? 'Percakapan belum dapat dimuat.' })
        }
      }
    }
    restore()
    return () => { requestVersion.current += 1 }
  }, [restoreAttempt])

  const retryRestore = () => {
    setConversation({ ...EMPTY, status: 'loading' })
    setRestoreAttempt((attempt) => attempt + 1)
  }

  const resetErrors = () => {
    setSendError(null)
    setOlderError(null)
    setLoadingOlder(false)
    olderLock.current = false
  }

  const startNew = () => {
    if (sendLock.current) return
    requestVersion.current += 1
    resetErrors()
    setConversation(EMPTY)
  }

  const openSession = async (session) => {
    if (sendLock.current) return
    const version = ++requestVersion.current
    resetErrors()
    setConversation({ ...EMPTY, session, status: 'loading' })
    try {
      const page = await api.get(messagePath(session.id))
      if (version === requestVersion.current) setConversation(fromPage(page))
    } catch (error) {
      if (version === requestVersion.current) {
        setConversation({ ...EMPTY, session, status: 'error', error: error.message ?? 'Percakapan belum dapat dimuat.' })
      }
    }
  }

  const loadOlder = async () => {
    if (olderLock.current || sendLock.current || !conversation.session || !conversation.meta || conversation.meta.page >= conversation.meta.totalPages) return
    olderLock.current = true
    setLoadingOlder(true)
    setOlderError(null)
    const version = requestVersion.current
    try {
      const page = await api.get(messagePath(conversation.session.id, conversation.meta.page + 1))
      if (version !== requestVersion.current) return
      setConversation((current) => {
        // Activity from another device can move offset-page boundaries.
        const seen = new Set(current.messages.map((message) => message.id))
        return { ...current, messages: [...page.items.filter((message) => !seen.has(message.id)), ...current.messages], meta: page.meta }
      })
    } catch (error) {
      if (version === requestVersion.current) setOlderError(error.message ?? 'Pesan sebelumnya belum dapat dimuat.')
    } finally {
      if (version === requestVersion.current) {
        olderLock.current = false
        setLoadingOlder(false)
      }
    }
  }

  const sendMessage = async (text) => {
    const question = text.trim()
    if (question.length < 2 || question.length > 1000 || sendLock.current || olderLock.current || conversation.status !== 'ready') return null
    sendLock.current = true
    const version = requestVersion.current
    const optimisticId = `local-${Date.now()}`
    setSending(true)
    setSendError(null)
    setConversation((current) => ({
      ...current,
      messages: [...current.messages, { id: optimisticId, role: 'USER', content: question }],
    }))

    const reconcile = (result, reply) => {
      setConversation((current) => ({
        ...current,
        session: current.session ?? { id: result.sessionId, title: question.slice(0, 80) },
        messages: [
          ...current.messages.map((message) => message.id === optimisticId ? (result.userMessage ?? message) : message),
          ...(reply ? [reply] : []),
        ],
      }))
    }

    try {
      const result = await api.post('/chat/messages', { text: question, sessionId: conversation.session?.id })
      if (version !== requestVersion.current) return null
      reconcile(result, result.message)
      return true
    } catch (error) {
      if (version !== requestVersion.current) return null
      const saved = error.details?.sessionId && error.details?.userMessage
      if (saved) {
        reconcile(error.details)
      } else {
        setConversation((current) => ({ ...current, messages: current.messages.filter((message) => message.id !== optimisticId) }))
      }
      setSendError(error.message ?? 'Asisten sedang tidak dapat menjawab.')
      return Boolean(saved)
    } finally {
      sendLock.current = false
      if (version === requestVersion.current) setSending(false)
    }
  }

  return {
    ...conversation, sending, sendError, loadingOlder, olderError,
    retry: conversation.session ? () => openSession(conversation.session) : retryRestore,
    startNew, openSession, loadOlder, sendMessage,
  }
}
