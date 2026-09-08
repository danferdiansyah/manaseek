import { useCallback, useState } from 'react'
import { ArrowLeft, Bot, Search, AlertCircle, ChevronRight, UserCheck } from 'lucide-react'
import { BottomNav } from './HomeScreen'
import { api } from '../lib/api'
import { EmptyState, ErrorState, Loading } from '../lib/ui'
import { useResource } from '../lib/useResource'

/**
 * The AI assistant is not connected yet: it needs the Gemini key and the
 * chatbot module, which belong to the content track.
 *
 * Rather than fake a conversation, this screen does the honest half of the job
 * now — it searches the real guidance library and routes anything beyond that
 * to a human mutawif, which is the escalation path the product promises.
 */
export default function ChatbotScreen({ navigate }) {
  const [query, setQuery] = useState('')
  const [term, setTerm] = useState('')

  const fetchTopics = useCallback(() => {
    const params = new URLSearchParams()
    if (term.length >= 2) params.set('search', term)
    return api.get(`/content/topics?${params}`)
  }, [term])

  const { status, data, error, reload } = useResource(fetchTopics)
  const topics = data?.items ?? []

  const submit = (event) => {
    event.preventDefault()
    setTerm(query.trim())
  }

  return (
    <div className="flex flex-col min-h-full bg-stone">
      {/* Header */}
      <div className="glass-topbar px-5 pt-14 pb-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('home')} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#E8F3EC' }}>
            <ArrowLeft size={16} color="#1B5E35" />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
            <Bot size={18} color="white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-semibold text-ink text-sm">Manaseek AI</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <p className="text-xs text-ink-faint">Belum aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Honest status */}
      <div className="mx-4 mt-4 px-4 py-3 rounded-xl flex items-start gap-2" style={{ background: 'var(--color-brass-bg)', border: '1px solid rgba(184,148,74,.18)' }}>
        <AlertCircle size={14} color="#B8944A" className="flex-shrink-0 mt-0.5" />
        <p className="text-sm leading-relaxed" style={{ color: '#7a6224' }}>
          Asisten AI belum tersambung. Sementara ini kamu bisa mencari langsung
          di panduan ibadah di bawah. Untuk pertanyaan hukum ibadah, hubungi
          mutawif atau pembimbing rombongan.
        </p>
      </div>

      {/* Search over the real guidance library */}
      <form onSubmit={submit} className="px-4 mt-4">
        <div className="relative">
          <Search size={15} color="#9CA3AF" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari di panduan, misal: thawaf"
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-white text-sm text-ink outline-none border border-gray-200 focus:border-green-700"
          />
        </div>
      </form>

      <div className="px-4 mt-4 space-y-2.5 mb-28">
        {status === 'loading' && <Loading label="Mencari…" />}
        {status === 'error' && <ErrorState message={error} onRetry={reload} />}

        {status === 'ready' && topics.length === 0 && (
          <EmptyState
            title="Tidak ada panduan yang cocok"
            description={`Tidak ditemukan hasil untuk "${term}". Coba kata lain, atau pesan mutawif untuk bertanya langsung.`}
          />
        )}

        {status === 'ready' && topics.length > 0 && (
          <>
            <p className="text-sm font-semibold text-ink-soft">
              {term ? `Hasil untuk "${term}"` : 'Topik yang sering ditanyakan'}
            </p>
            {topics.slice(0, 6).map((topic) => (
              <button
                key={topic.slug}
                onClick={() => navigate('guidance-detail', { slug: topic.slug })}
                className="w-full flex items-center gap-3 glass rounded-[20px] p-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{topic.title}</p>
                  <p className="text-xs text-ink-faint mt-0.5 truncate">{topic.summary}</p>
                </div>
                <ChevronRight size={15} color="#D1D5DB" />
              </button>
            ))}
          </>
        )}

        <button
          onClick={() => navigate('mutawif')}
          className="w-full flex items-center gap-3 rounded-2xl p-4 text-left mt-2"
          style={{ background: 'linear-gradient(135deg, #E8F3EC, #D1EBD8)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1B5E35' }}>
            <UserCheck size={17} color="white" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#1B5E35' }}>Tanya mutawif langsung</p>
            <p className="text-xs text-ink-soft mt-0.5">Pendampingan manusia untuk pertanyaan yang kompleks</p>
          </div>
          <ChevronRight size={16} color="#1B5E35" />
        </button>
      </div>

      <BottomNav active="chatbot" navigate={navigate} />
    </div>
  )
}
