import { useCallback, useState } from 'react'
import { Search, ChevronRight, Info } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { api } from '../lib/api'
import { EmptyState, ErrorState, Loading } from '../lib/ui'
import { useResource } from '../lib/useResource'
import PageHeader from '../components/PageHeader'
import GlassIcon from '../components/GlassIcon'
import { topicArtwork } from '../components/artwork'

const FILTERS = [
  { id: 'all', label: 'Semua', category: null },
  { id: 'umrah', label: 'Umrah', category: 'UMRAH' },
  { id: 'hajj', label: 'Haji', category: 'HAJJ' },
  { id: 'persiapan', label: 'Persiapan', category: 'PERSIAPAN' },
]

const TAG_STYLE = {
  Wajib: { bg: '#FFF4E5', color: '#B8944A' },
  Rukun: { bg: '#E8F3EC', color: '#1B5E35' },
  Sunnah: { bg: '#edf3ee', color: '#50765d' },
}

export default function GuidanceScreen({ navigate, params = {} }) {
  const [filter, setFilter] = useState(() =>
    FILTERS.find((item) => item.category === params.category) ?? FILTERS[0],
  )
  const [search, setSearch] = useState('')
  // Only the committed term hits the API, so typing does not fire a request
  // per keystroke.
  const [term, setTerm] = useState('')

  const fetchTopics = useCallback(() => {
    const query = new URLSearchParams()
    if (filter.category) query.set('category', filter.category)
    if (term.length >= 2) query.set('search', term)

    return api.get(`/content/topics?${query}`).then(async (topics) => {
      const checklist = await api.get('/content/checklist').catch(() => null)
      return { topics, checklist }
    })
  }, [filter, term])

  const { status, data, error, reload } = useResource(fetchTopics)

  const topics = data?.topics.items ?? []
  const meta = data?.topics.meta
  const checklist = data?.checklist?.meta

  const submitSearch = (event) => {
    event.preventDefault()
    setTerm(search.trim())
  }

  return (
    <div className="app-page flex flex-col min-h-full bg-stone">
      <PageHeader title="Panduan ibadah" eyebrow="Bekal setiap langkah" description="Kenali rangkaian ibadah, satu langkah demi satu langkah." icon="hajj" onBack={() => navigate('home')}>
        <form onSubmit={submitSearch} className="relative">
          <Search size={15} color="#9CA3AF" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari panduan ibadah…"
            aria-label="Cari panduan ibadah"
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-white text-sm text-ink outline-none"
          />
        </form>
      </PageHeader>

      {/* Filters */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto">
        {FILTERS.map((f) => {
          const active = f.id === filter.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f)}
              className="filter-chip"
              aria-pressed={active}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Checklist */}
      {checklist && (
        <button
          onClick={() => navigate('checklist')}
          className="feature-link mx-5 mb-4"
        >
          <GlassIcon name="checklist" tone="gold" />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#8B6914' }}>Checklist Persiapan</p>
            <p className="text-xs" style={{ color: '#A07C2A' }}>
              {checklist.completed} dari {checklist.total} item selesai
            </p>
          </div>
          <ChevronRight size={16} color="#B8944A" />
        </button>
      )}

      {/* Review notice: nothing here is signed off yet. */}
      {meta && meta.publishedCount === 0 && (
        <div className="glass mx-5 mb-4 rounded-[16px] p-3.5 flex items-start gap-2.5">
          <Info size={15} color="var(--color-ink-soft)" className="flex-shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed text-ink-soft">
            Konten panduan masih berstatus draf dan menunggu tinjauan pembimbing.
            Untuk pertanyaan hukum ibadah, hubungi mutawif atau pembimbing rombongan.
          </p>
        </div>
      )}

      {/* Topics */}
      <div className="px-5 space-y-3 mb-24">
        <h3 className="font-semibold text-ink">Rangkaian ibadah</h3>

        {status === 'loading' && <Loading label="Memuat panduan…" />}
        {status === 'error' && <ErrorState message={error} onRetry={reload} />}

        {status === 'ready' && topics.length === 0 && (
          <EmptyState
            title="Panduan tidak ditemukan"
            description={term ? `Tidak ada hasil untuk "${term}".` : 'Belum ada panduan di kategori ini.'}
          />
        )}

        {status === 'ready' &&
          topics.map((topic) => {
            const tag = topic.obligation
            const style = TAG_STYLE[tag] ?? { bg: '#F3F4F6', color: '#6B7280' }

            return (
              <button
                key={topic.slug}
                onClick={() => navigate('guidance-detail', { slug: topic.slug })}
                className="topic-card w-full flex gap-3.5 glass text-left"
              >
                <GlassIcon name={topicArtwork(topic.icon)} tone={topic.icon === 'Layers' ? 'gold' : 'green'} />
                <div className="flex-1 min-w-0">
                  <div className="topic-card-title">
                    <p className="text-[15px] font-semibold text-ink">{topic.title}</p>
                    {tag && (
                      <span
                        className="app-tag font-medium"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {tag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-soft mt-1 leading-snug line-clamp-2">{topic.summary}</p>
                  <p className="text-xs text-ink-faint mt-1.5">{topic.readingMinutes} menit baca</p>
                </div>
              </button>
            )
          })}
      </div>

      <BottomNav active="guidance" navigate={navigate} />
    </div>
  )
}
