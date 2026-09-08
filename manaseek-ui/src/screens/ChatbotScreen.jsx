import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bot, Send, AlertCircle, UserCheck, BookOpen } from 'lucide-react'
import { BottomNav } from './HomeScreen'
import { api } from '../lib/api'

const SUGGESTIONS = [
  'Apa saja larangan saat ihram?',
  'Berapa putaran thawaf?',
  'Bagaimana tata cara tahalul?',
  'Apa yang dilakukan saat wukuf?',
]

function Bubble({ message, navigate, titleOf }) {
  const mine = message.role === 'USER'

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[85%]">
        <div
          className={mine ? 'rounded-[18px] rounded-br-[6px] px-4 py-3' : 'glass-solid rounded-[18px] rounded-bl-[6px] px-4 py-3'}
          style={mine
            ? {
                background: 'linear-gradient(150deg, #1B5E35, #2D7A4F)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.22)',
              }
            : undefined}
        >
          <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${mine ? 'text-white' : 'text-ink'}`}>
            {message.content}
          </p>
        </div>

        {message.citedSlugs?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.citedSlugs.map((slug) => (
              <button
                key={slug}
                onClick={() => navigate('guidance-detail', { slug })}
                className="glass flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full text-ink-soft"
              >
                <BookOpen size={12} color="var(--color-canopy-700)" />
                {titleOf(slug)}
              </button>
            ))}
          </div>
        )}

        {message.escalated && (
          <button
            onClick={() => navigate('mutawif')}
            className="mt-2 flex items-center gap-2 rounded-[14px] px-3.5 py-2.5 text-left w-full"
            style={{ background: 'var(--color-canopy-100)' }}
          >
            <UserCheck size={15} color="var(--color-canopy-700)" strokeWidth={1.9} />
            <span className="text-sm font-medium text-canopy-700">Tanya mutawif langsung</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default function ChatbotScreen({ navigate }) {
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [titles, setTitles] = useState({})
  const endRef = useRef(null)

  // Slugs are what the model returns; the reader needs the topic's name.
  useEffect(() => {
    api
      .get('/content/topics')
      .then((page) =>
        setTitles(Object.fromEntries(page.items.map((t) => [t.slug, t.title]))),
      )
      .catch(() => {})
  }, [])

  const titleOf = (slug) => titles[slug] ?? 'Buka panduan'

  // Scrolling is a DOM effect, not state, so it belongs in an effect.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending])

  const send = async (text) => {
    const question = text.trim()
    if (!question || sending) return

    setDraft('')
    setError(null)
    setSending(true)
    // Show the question immediately; the id is replaced by the server's copy
    // only if we ever need to reconcile, which for an append-only log we do not.
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: 'USER', content: question }])

    try {
      const result = await api.post('/chat/messages', {
        text: question,
        sessionId: sessionId ?? undefined,
      })
      setSessionId(result.sessionId)
      setMessages((prev) => [...prev, result.message])
    } catch (err) {
      setError(err.message ?? 'Asisten sedang tidak dapat menjawab.')
    } finally {
      setSending(false)
    }
  }

  const empty = messages.length === 0

  return (
    <div className="flex flex-col min-h-full bg-stone">
      <div className="glass-topbar px-5 pt-14 pb-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('home')}
            aria-label="Kembali"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-canopy-100)' }}
          >
            <ArrowLeft size={16} color="var(--color-canopy-700)" />
          </button>
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(150deg, #1B5E35, #2D7A4F)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
            }}
          >
            <Bot size={19} color="white" strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-semibold text-ink">Manaseek AI</p>
            <p className="text-xs text-ink-faint">Asisten informasi ibadah</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-40 space-y-3">
        <div
          className="rounded-[16px] px-4 py-3 flex items-start gap-2.5"
          style={{ background: 'var(--color-brass-bg)', border: '1px solid rgba(184,148,74,.18)' }}
        >
          <AlertCircle size={15} color="var(--color-brass)" className="flex-shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed" style={{ color: '#7a6224' }}>
            Asisten ini menjawab dari panduan Manaseek dan bukan pemberi fatwa.
            Pertanyaan hukum ibadah dan kondisi darurat diarahkan ke mutawif.
          </p>
        </div>

        {empty && (
          <div className="pt-2">
            <p className="text-sm text-ink-soft mb-3">Mulai dari salah satu ini:</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="glass w-full text-left rounded-[16px] px-4 py-3 text-[15px] text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <Bubble key={m.id} message={m} navigate={navigate} titleOf={titleOf} />
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="glass-solid rounded-[18px] rounded-bl-[6px] px-4 py-3">
              <span className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: 'var(--color-ink-faint)', animationDelay: `${i * 160}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-[16px] px-4 py-3.5"
            style={{ background: '#FDF0EF', border: '1px solid #F3D2CE' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: '#A8332B' }}>{error}</p>
            {/* A dead end is not an answer: always leave the human route open. */}
            <button
              onClick={() => navigate('mutawif')}
              className="mt-2.5 flex items-center gap-2 rounded-[12px] px-3.5 py-2.5 w-full"
              style={{ background: 'var(--color-canopy-100)' }}
            >
              <UserCheck size={15} color="var(--color-canopy-700)" strokeWidth={1.9} />
              <span className="text-sm font-medium text-canopy-700">Tanya mutawif langsung</span>
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Composer sits above the nav, both on the same glass. */}
      <div className="fixed bottom-[68px] left-1/2 -translate-x-1/2 w-full max-w-[420px] px-4 pb-3 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(draft)
          }}
          className="glass-solid flex items-end gap-2 rounded-[20px] p-2 pl-4"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tulis pertanyaanmu…"
            aria-label="Pertanyaan"
            className="flex-1 bg-transparent text-[15px] text-ink outline-none py-2.5 min-w-0"
          />
          <button
            type="submit"
            disabled={sending || draft.trim().length < 2}
            aria-label="Kirim"
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-35"
            style={{
              background: 'linear-gradient(150deg, #1B5E35, #2D7A4F)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
            }}
          >
            <Send size={16} color="white" strokeWidth={2} />
          </button>
        </form>
      </div>

      <BottomNav active="chatbot" navigate={navigate} />
    </div>
  )
}
