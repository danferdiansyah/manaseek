import { useEffect, useState } from 'react'
import { ChevronRight, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { EmptyState, ErrorState, Loading } from '../lib/ui'
import GlassIcon from './GlassIcon'

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

export default function ChatHistory({ currentId, onOpen }) {
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ items: [], meta: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    api.get(`/chat/sessions?page=${page}&limit=20`)
      .then((result) => {
        if (cancelled) return
        setState((previous) => {
          const seen = new Set(previous.items.map((session) => session.id))
          return {
            items: page === 1 ? result.items : [...previous.items, ...result.items.filter((session) => !seen.has(session.id))],
            meta: result.meta,
            loading: false,
            error: null,
          }
        })
      })
      .catch((error) => {
        if (!cancelled) setState((previous) => ({ ...previous, loading: false, error: error.message ?? 'Riwayat belum dapat dimuat.' }))
      })
    return () => { cancelled = true }
  }, [page, attempt])

  const retry = () => {
    setState((previous) => ({ ...previous, loading: true, error: null }))
    setAttempt((value) => value + 1)
  }

  return (
    <section className="chat-history" aria-label="Riwayat percakapan">
      {state.meta && <p className="chat-history-count">{state.meta.total} percakapan tersimpan</p>}
      {state.items.length === 0 && state.loading && <Loading label="Memuat riwayat percakapan…" />}
      {state.items.length === 0 && !state.loading && !state.error && (
        <EmptyState icon="chat" title="Belum ada percakapan" description="Mulai chat baru. Percakapanmu akan tersimpan di sini dan bisa dilanjutkan kapan saja." />
      )}
      <div className="space-y-3">
        {state.items.map((session) => (
          <button
            key={session.id}
            type="button"
            className={`chat-history-item ${currentId === session.id ? 'is-active' : ''}`}
            onClick={() => onOpen(session)}
            aria-current={currentId === session.id ? 'true' : undefined}
          >
            <GlassIcon name="chat" size="sm" tone="teal" />
            <span className="chat-history-copy">
              <strong>{session.title || 'Percakapan tanpa judul'}</strong>
              <span className="chat-history-preview">{session.preview}</span>
              <span className="chat-history-meta">
                <time dateTime={session.updatedAt}>{dateFormatter.format(new Date(session.updatedAt))}</time>
                <span>{session.messageCount} pesan</span>
              </span>
            </span>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
      {state.error && <ErrorState message={state.error} onRetry={retry} />}
      {state.items.length > 0 && !state.error && state.meta.page < state.meta.totalPages && (
        <button type="button" className="chat-load-more" disabled={state.loading} onClick={() => {
          setState((previous) => ({ ...previous, loading: true }))
          setPage((value) => value + 1)
        }}>
          {state.loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {state.loading ? 'Memuat…' : 'Lihat riwayat lainnya'}
        </button>
      )}
    </section>
  )
}
