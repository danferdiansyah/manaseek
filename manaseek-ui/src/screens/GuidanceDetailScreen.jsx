import { useCallback } from 'react'
import { ArrowLeft, AlertTriangle, ChevronRight, Layers, Info, BookMarked } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorState, Loading } from '../lib/ui'
import { useResource } from '../lib/useResource'

const TAG_STYLE = {
  Wajib: 'linear-gradient(135deg, #B8944A, #D4A855)',
  Rukun: 'linear-gradient(135deg, #1B5E35, #2D7A4F)',
  Sunnah: 'linear-gradient(135deg, #4F46E5, #6366F1)',
}

export default function GuidanceDetailScreen({ navigate, params }) {
  const slug = params?.slug

  const fetchTopic = useCallback(() => {
    if (!slug) return Promise.reject(new Error('Panduan belum dipilih.'))
    return api.get(`/content/topics/${slug}`)
  }, [slug])

  const { status, data: topic, error, reload } = useResource(fetchTopic)

  if (status === 'loading') {
    return (
      <div className="min-h-full bg-stone pt-24">
        <Loading label="Memuat panduan…" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-full bg-stone pt-20">
        <ErrorState message={error} onRetry={reload} />
        <div className="px-5">
          <button onClick={() => navigate('guidance')} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: '#E8F3EC', color: '#1B5E35' }}>
            Kembali ke daftar panduan
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-stone">
      {/* Hero */}
      <div className="canopy relative pt-14 pb-8 px-5">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('guidance')} className="glass-control w-9 h-9 rounded-full flex items-center justify-center">
            <ArrowLeft size={16} color="white" />
          </button>
          <span className="text-canopy-100/85 text-sm flex-1">Guidance Mandiri</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
            <Layers size={32} color="white" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            {topic.obligation && (
              <span
                className="text-xs px-2 py-1 rounded-full font-medium text-white"
                style={{ background: TAG_STYLE[topic.obligation] ?? 'rgba(255,255,255,0.25)' }}
              >
                {topic.obligation}
              </span>
            )}
            <h2 className="text-white text-xl font-bold mt-1">{topic.title}</h2>
            <p className="text-canopy-100/85 text-xs mt-0.5">{topic.summary}</p>
            <p className="text-canopy-100/70 text-xs mt-1">{topic.readingMinutes} menit baca</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5 mb-10">
        {topic.status !== 'PUBLISHED' && (
          <div className="glass rounded-[16px] p-3.5 flex items-start gap-2.5">
            <Info size={15} color="var(--color-ink-soft)" className="flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed text-ink-soft">
              Draf, menunggu tinjauan pembimbing. Untuk pertanyaan hukum ibadah,
              rujuk kepada mutawif atau pembimbing rombongan.
            </p>
          </div>
        )}

        {/* Steps */}
        {topic.steps.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-ink mb-3">Tata Cara</p>
            <div className="space-y-3">
              {topic.steps.map((step, i) => (
                <div key={step.id} className="flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm text-ink-soft leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prayers */}
        {topic.prayers.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-ink mb-3">Bacaan</p>
            <div className="space-y-3">
              {topic.prayers.map((prayer) => (
                <div key={prayer.id} className="glass rounded-[20px] p-4">
                  <p className="text-xs font-semibold text-ink mb-2">{prayer.title}</p>
                  <p className="text-right text-xl leading-loose mb-2" style={{ color: '#1B5E35', fontFamily: 'serif' }} dir="rtl" lang="ar">
                    {prayer.arabic}
                  </p>
                  <p className="text-xs text-ink-soft italic mb-1">{prayer.transliteration}</p>
                  <p className="text-xs text-ink font-medium">{prayer.translation}</p>
                  {prayer.context && <p className="text-xs text-ink-faint mt-2">{prayer.context}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dalil */}
        {topic.references?.length > 0 && (
          <div>
            <p className="text-sm font-bold text-ink mb-3">Dalil</p>
            <div className="space-y-2">
              {topic.references.map((ref) => (
                <div key={ref.id} className="glass rounded-[16px] p-4 flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-[11px] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-canopy-100)' }}
                  >
                    <BookMarked size={15} color="var(--color-canopy-700)" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-ink">{ref.citation}</p>
                    {ref.gloss && <p className="text-sm text-ink-soft mt-0.5 leading-snug">{ref.gloss}</p>}
                    {!ref.verifiedAt && (
                      <p className="text-xs text-ink-faint mt-1.5">Menunggu verifikasi pembimbing</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prohibitions */}
        {topic.prohibitions.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #FFF8EC, #FFF4E5)' }}>
            <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#8B6914' }}>
              <AlertTriangle size={15} color="#B8944A" /> Larangan
            </p>
            <div className="space-y-2.5">
              {topic.prohibitions.map((item) => (
                <div key={item.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#B8944A' }} />
                  <div>
                    <p className="text-xs" style={{ color: '#8B6914' }}>{item.text}</p>
                    {item.consequence && (
                      <p className="text-xs mt-0.5 italic" style={{ color: '#A07C2A' }}>{item.consequence}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {topic.next && (
          <button
            onClick={() => navigate('guidance-detail', { slug: topic.next.slug })}
            className="w-full py-4 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}
          >
            Lanjut ke {topic.next.title} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
