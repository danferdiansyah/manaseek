import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, MapPin, Star, CheckCircle } from 'lucide-react'
import { BottomNav } from './HomeScreen'
import { api } from '../lib/api'
import { formatDistance, formatRupiah, initialsOf } from '../lib/format'
import { EmptyState, ErrorState, Loading } from '../lib/ui'
import { useResource } from '../lib/useResource'

/** Masjidil Haram. Used until the browser hands us a real position. */
const FALLBACK = { latitude: 21.4225, longitude: 39.8262, label: 'Masjidil Haram, Makkah' }

const FILTERS = [
  { id: 'all', label: 'Semua', serviceType: null },
  { id: 'ibadah', label: 'Pendampingan', serviceType: 'IBADAH_GUIDANCE' },
  { id: 'mobility', label: 'Lansia & Mobilitas', serviceType: 'MOBILITY_ASSISTANCE' },
  { id: 'emergency', label: 'Darurat', serviceType: 'EMERGENCY' },
]

export default function MutawifListScreen({ navigate }) {
  const [position, setPosition] = useState(FALLBACK)
  const [filter, setFilter] = useState(FILTERS[0])

  // Geolocation is a nicety: the list still works from the fallback point.
  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setPosition({
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: 'Lokasi kamu saat ini',
        }),
      () => {},
      { timeout: 8000 },
    )
  }, [])

  const fetchNearby = useCallback(() => {
    const query = new URLSearchParams({
      latitude: String(position.latitude),
      longitude: String(position.longitude),
      radiusKm: '25',
    })
    if (filter.serviceType) query.set('serviceType', filter.serviceType)

    return api.get(`/mutawif/nearby?${query}`)
  }, [position, filter])

  const { status, data, error, reload } = useResource(fetchNearby)
  const items = data ?? []

  const { latitude, longitude } = position
  const bbox = [longitude - 0.008, latitude - 0.006, longitude + 0.008, latitude + 0.006].join('%2C')

  return (
    <div className="flex flex-col min-h-full bg-stone">
      {/* Header */}
      <div className="canopy px-5 pt-14 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('home')} className="glass-control w-9 h-9 rounded-full flex items-center justify-center">
            <ArrowLeft size={16} color="white" />
          </button>
          <h2 className="text-white font-bold text-lg">Mutawif On-Demand</h2>
        </div>
        <div className="glass-canopy flex items-center gap-2.5 rounded-[16px] px-3.5 py-3">
          <MapPin size={15} color="#86EFAC" />
          <div className="flex-1">
            <p className="text-white text-xs font-semibold">Lokasi Kamu</p>
            <p className="text-canopy-100/85 text-xs">{position.label}</p>
          </div>
        </div>
      </div>

      {/* Map centred on the search point */}
      <div className="glass mx-5 mt-5 rounded-[20px] overflow-hidden p-1" style={{ height: 158 }}>
        <iframe
          title="Peta lokasi"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block', borderRadius: 16 }}
          loading="eager"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => {
          const active = f.id === filter.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium"
              style={active
                ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', color: 'white' }
                : { background: 'rgba(255,255,255,.75)', color: 'var(--color-ink-soft)', border: '1px solid rgba(255,255,255,.9)' }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="px-5 space-y-3 mb-24">
        {status === 'loading' && <Loading label="Mencari mutawif terdekat…" />}

        {status === 'error' && <ErrorState message={error} onRetry={reload} />}

        {status === 'ready' && items.length === 0 && (
          <EmptyState
            title="Belum ada mutawif tersedia"
            description="Tidak ada mutawif yang sedang online di radius 25 km. Coba lagi beberapa saat lagi atau ganti jenis layanan."
          />
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <p className="text-sm text-ink-soft font-medium">
              {items.length} mutawif tersedia di sekitarmu
            </p>
            {items.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate('mutawif-profile', { mutawifId: m.id })}
                className="w-full glass rounded-[20px] p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt={m.name} className="rounded-xl object-cover" style={{ width: 52, height: 52 }} />
                    ) : (
                      <div
                        className="rounded-xl flex items-center justify-center font-bold text-white"
                        style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}
                      >
                        {initialsOf(m.name)}
                      </div>
                    )}
                    <span
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full"
                      style={{ background: '#3FBF6F', border: '2.5px solid var(--color-stone)' }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-ink text-[15px] truncate">{m.name ?? 'Mutawif'}</p>
                      <span className="text-xs text-ink-faint flex-shrink-0">{formatDistance(m.distanceKm)}</span>
                    </div>
                    <p className="text-sm text-ink-soft mt-0.5">
                      {m.yearsExperience} tahun pengalaman{m.city ? ` · ${m.city}` : ''}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {m.ratingCount > 0 ? (
                        <>
                          <Star size={11} color="#B8944A" fill="#B8944A" />
                          <span className="text-xs font-semibold" style={{ color: '#B8944A' }}>
                            {m.ratingAverage.toFixed(1)}
                          </span>
                          <span className="text-xs text-ink-faint">•</span>
                          <span className="text-xs text-ink-faint">{m.ratingCount} ulasan</span>
                        </>
                      ) : (
                        <span className="text-xs text-ink-faint">Belum ada ulasan</span>
                      )}
                      <span className="text-xs text-ink-faint">•</span>
                      <CheckCircle size={11} color="#1B5E35" />
                      <span className="text-xs text-ink-faint">Terverifikasi</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex gap-1 flex-wrap">
                        {m.languages.map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full uppercase" style={{ background: '#E8F3EC', color: '#1B5E35' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs font-bold flex-shrink-0" style={{ color: '#1B5E35' }}>
                        {m.hourlyRate ? `${formatRupiah(m.hourlyRate)} / jam` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}
      </div>

      <BottomNav active="mutawif" navigate={navigate} />
    </div>
  )
}
