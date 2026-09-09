import { useCallback } from 'react'
import { ArrowLeft, Star, CheckCircle, MapPin, Accessibility, ShieldAlert } from 'lucide-react'
import { api } from '../lib/api'
import Avatar from '../lib/Avatar'
import { formatRupiah, SERVICE_LABELS } from '../lib/format'
import { ErrorState, Loading } from '../lib/ui'
import { useResource } from '../lib/useResource'

const SERVICE_ICONS = {
  IBADAH_GUIDANCE: Star,
  MOBILITY_ASSISTANCE: Accessibility,
  EMERGENCY: ShieldAlert,
}

const DAY_LABELS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const minutesToClock = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}.${String(minutes % 60).padStart(2, '0')}`

export default function MutawifProfileScreen({ navigate, params }) {
  const mutawifId = params?.mutawifId
  const fetchProfile = useCallback(async () => {
    if (!mutawifId) throw new Error('Mutawif belum dipilih.')

    // Reviews are a separate resource; a failure there must not hide the
    // profile. Keep the reads sequential for the small demo database pool.
    const profile = await api.get(`/mutawif/${mutawifId}`)
    const reviews = await api.get(`/reviews?mutawifId=${mutawifId}&limit=5`).catch(() => ({ items: [] }))

    return { profile, reviews: reviews.items }
  }, [mutawifId])

  const { status, data, error, reload } = useResource(fetchProfile)

  if (status === 'loading') {
    return (
      <div className="min-h-full bg-stone pt-24">
        <Loading label="Memuat profil mutawif…" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-full bg-stone pt-20">
        <button onClick={() => navigate('mutawif')} className="ml-5 mb-4 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#E8F3EC' }}>
          <ArrowLeft size={16} color="#1B5E35" />
        </button>
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }

  const { profile, reviews } = data
  const rates = profile.rates ?? []
  const cheapest = rates.reduce(
    (min, rate) => (min === null || Number(rate.hourlyRate) < Number(min.hourlyRate) ? rate : min),
    null,
  )

  return (
    <div className="flex flex-col min-h-full bg-stone">
      {/* Hero */}
      <div className="canopy relative pt-14 pb-6 px-5">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('mutawif')} className="glass-control w-9 h-9 rounded-full flex items-center justify-center">
            <ArrowLeft size={16} color="white" />
          </button>
          <span className="text-canopy-100/85 text-sm flex-1">Detail Mutawif</span>
        </div>

        <div className="flex items-center gap-4">
          <Avatar
            src={profile.user.avatarUrl}
            name={profile.user.name}
            alt={profile.user.name}
            imageClassName="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
            imageStyle={{ border: '2px solid rgba(255,255,255,0.35)' }}
            fallbackClassName="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            fallbackStyle={{ background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.35)' }}
          />
          <div>
            <h2 className="text-white text-lg font-bold">{profile.user.name ?? 'Mutawif'}</h2>
            <p className="text-canopy-100/85 text-xs mt-0.5 flex items-center gap-1">
              <MapPin size={11} /> {profile.yearsExperience} tahun pengalaman
              {profile.city ? ` • ${profile.city}` : ''}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {profile.ratingCount > 0 ? (
                <>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <span className="text-white font-bold text-sm">{profile.ratingAverage.toFixed(1)}</span>
                  <span className="text-canopy-100/85 text-xs">({profile.ratingCount} ulasan)</span>
                </>
              ) : (
                <span className="text-canopy-100/85 text-xs">Belum ada ulasan</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="glass-canopy text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 text-white">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: profile.availabilityStatus === 'ONLINE' ? '#4ADE80' : '#9CA3AF' }}
            />
            {profile.availabilityStatus === 'ONLINE' ? 'Tersedia' : 'Sedang tidak tersedia'}
          </span>
          <span className="glass-canopy text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 text-white">
            <CheckCircle size={11} color="#86EFAC" /> Terverifikasi
          </span>
        </div>
      </div>

      {/* Languages */}
      {profile.languages.length > 0 && (
        <div className="mx-5 mt-5 glass rounded-[20px] p-4 flex gap-2 flex-wrap">
          {profile.languages.map((t) => (
            <span key={t} className="text-xs px-3 py-1.5 rounded-full font-semibold uppercase" style={{ background: '#E8F3EC', color: '#1B5E35' }}>
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="px-5 mt-4 space-y-5 mb-32">
        {profile.bio && (
          <div className="glass rounded-[20px] p-4">
            <p className="text-sm font-semibold text-ink mb-2">Tentang</p>
            <p className="text-sm text-ink-soft leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Services */}
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Layanan</p>
          <div className="space-y-2">
            {rates.map((rate) => {
              const Icon = SERVICE_ICONS[rate.serviceType] ?? Star
              return (
                <div key={rate.serviceType} className="glass rounded-[16px] p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E8F3EC' }}>
                    <Icon size={16} color="#1B5E35" strokeWidth={1.8} />
                  </div>
                  <p className="flex-1 text-sm font-medium text-ink">
                    {SERVICE_LABELS[rate.serviceType] ?? rate.serviceType}
                  </p>
                  <p className="text-xs font-bold flex-shrink-0" style={{ color: '#1B5E35' }}>
                    {formatRupiah(rate.hourlyRate)} / jam
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weekly schedule */}
        {profile.slots.length > 0 && (
          <div className="glass rounded-[20px] p-4">
            <p className="text-sm font-semibold text-ink mb-3">Jadwal Tersedia</p>
            <div className="space-y-1.5">
              {Object.entries(
                profile.slots.reduce((byDay, slot) => {
                  ;(byDay[slot.dayOfWeek] ??= []).push(slot)
                  return byDay
                }, {}),
              ).map(([day, slots]) => (
                <div key={day} className="flex justify-between text-xs">
                  <span className="text-ink-soft">{DAY_LABELS[Number(day)]}</span>
                  <span className="text-ink font-medium">
                    {slots.map((s) => `${minutesToClock(s.startMinute)}–${minutesToClock(s.endMinute)}`).join(', ')}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink-faint mt-2">Waktu Arab Saudi</p>
          </div>
        )}

        {/* Reviews */}
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Ulasan Jamaah</p>
          {reviews.length === 0 ? (
            <div className="glass rounded-[20px] p-4">
              <p className="text-xs text-ink-faint">Belum ada ulasan untuk mutawif ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="glass rounded-[20px] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-ink">{r.jamaah?.name ?? 'Jamaah'}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, j) => (
                        <Star key={j} size={11} color="#B8944A" fill="#B8944A" />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-ink-soft leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] glass-bar px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink-faint">Mulai dari</p>
            <p className="text-lg font-bold" style={{ color: '#1B5E35' }}>
              {cheapest ? `${formatRupiah(cheapest.hourlyRate)} / jam` : '—'}
            </p>
          </div>
          <button
            onClick={() => navigate('booking', { mutawifId: profile.id })}
            disabled={rates.length === 0}
            className="px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-sm disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}
          >
            Pesan Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}
