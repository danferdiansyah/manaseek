import { useCallback, useState } from 'react'
import {
  ArrowLeft, Search, CheckSquare, ChevronRight, BookOpen, Scissors, Sunrise, Moon,
  Target, Heart, RotateCcw, ArrowRightLeft, Layers, ClipboardList, Info,
} from 'lucide-react'
import { BottomNav } from './HomeScreen'
import { api } from '../lib/api'
import { EmptyState, ErrorState, Loading } from '../lib/ui'
import { useResource } from '../lib/useResource'

// The API names an icon; the client owns the mapping to a component.
const ICONS = {
  BookOpen, Scissors, Sunrise, Moon, Target, Heart, RotateCcw, ArrowRightLeft,
  Layers, ClipboardList,
}

const FILTERS = [
  { id: 'all', label: 'Semua', category: null },
  { id: 'umrah', label: 'Umrah', category: 'UMRAH' },
  { id: 'hajj', label: 'Haji', category: 'HAJJ' },
  { id: 'persiapan', label: 'Persiapan', category: 'PERSIAPAN' },
]

const TAG_STYLE = {
  Wajib: { bg: '#FFF4E5', color: '#B8944A' },
  Rukun: { bg: '#E8F3EC', color: '#1B5E35' },
  Sunnah: { bg: '#EEF2FF', color: '#4F46E5' },
}

export default function GuidanceScreen({ navigate }) {
  const [filter, setFilter] = useState(FILTERS[0])
  const [search, setSearch] = useState('')
  // Only the committed term hits the API, so typing does not fire a request
  // per keystroke.
  const [term, setTerm] = useState('')

  const fetchTopics = useCallback(() => {
    const query = new URLSearchParams()
    if (filter.category) query.set('category', filter.category)
    if (term.length >= 2) query.set('search', term)

    return Promise.all([
      api.get(`/content/topics?${query}`),
      api.get('/content/checklist').catch(() => null),
    ]).then(([topics, checklist]) => ({ topics, checklist }))
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
    <div className="flex flex-col min-h-full bg-stone">
      {/* Header */}
      <div className="canopy px-5 pt-14 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate('home')} className="glass-control w-9 h-9 rounded-full flex items-center justify-center">
            <ArrowLeft size={16} color="white" />
          </button>
          <h2 className="text-white font-bold text-lg">Guidance Mandiri</h2>
        </div>
        <form onSubmit={submitSearch} className="relative">
          <Search size={15} color="#9CA3AF" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari panduan ibadah..."
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-white text-sm text-ink outline-none"
          />
        </form>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto">
        {FILTERS.map((f) => {
          const active = f.id === filter.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={active
                ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', color: 'white' }
                : { background: 'white', color: '#6B7280', border: '1px solid #E5E7EB' }}
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
          className="mx-5 mb-4 rounded-2xl p-4 flex items-center gap-3 text-left"
          style={{ background: 'linear-gradient(135deg, #F5EDD8, #FFF4E5)' }}
        >
          <CheckSquare size={24} color="#B8944A" strokeWidth={1.8} />
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
            const Icon = ICONS[topic.icon] ?? BookOpen
            const tag = topic.obligation
            const style = TAG_STYLE[tag] ?? { bg: '#F3F4F6', color: '#6B7280' }

            return (
              <button
                key={topic.slug}
                onClick={() => navigate('guidance-detail', { slug: topic.slug })}
                className="w-full flex items-start gap-3.5 glass rounded-[20px] p-4 text-left"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #E8F3EC, #C3DFC9)' }}
                >
                  <Icon size={22} color="#1B5E35" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <p className="text-[15px] font-semibold text-ink flex-1">{topic.title}</p>
                    {tag && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
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
