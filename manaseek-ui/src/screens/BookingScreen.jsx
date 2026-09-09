import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Star, CheckCircle, MapPin, Accessibility, ShieldAlert, Info } from 'lucide-react'
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

const TIMES = ['08:00', '09:00', '10:00', '13:00', '14:00', '15:00']
const DURATIONS = [1, 2, 3, 4]
const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

/** Saudi Arabia is a fixed UTC+3 with no daylight saving, so this is exact. */
const RIYADH_OFFSET = '+03:00'

/**
 * The current date and time in Riyadh, regardless of the device's own
 * timezone: { date: 'YYYY-MM-DD', minutes: minutes since midnight }.
 */
function riyadhNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const get = (type) => parts.find((p) => p.type === type).value

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

const toMinutes = (time) => {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function nextDays(fromIso, count) {
  const [year, month, day] = fromIso.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(year, month - 1, day + i))
    return {
      iso: date.toISOString().slice(0, 10),
      weekday: DAY_SHORT[date.getUTCDay()],
      dayOfMonth: String(date.getUTCDate()),
    }
  })
}

const toInstant = (dateIso, time) => `${dateIso}T${time}:00${RIYADH_OFFSET}`

export default function BookingScreen({ navigate, params }) {
  const mutawifId = params?.mutawifId

  const [serviceType, setServiceType] = useState(null)
  const [dateIso, setDateIso] = useState(null)
  const [time, setTime] = useState('10:00')
  const [durationHours, setDurationHours] = useState(2)
  const [meetingPoint, setMeetingPoint] = useState('Pintu King Fahd, Masjidil Haram')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Read off the render path, then kept fresh so a screen left open does not
  // keep offering a slot that has since passed.
  const [now, setNow] = useState(null)

  useEffect(() => {
    const sync = () => setNow(riyadhNow())
    const immediate = setTimeout(sync, 0)
    const everyMinute = setInterval(sync, 60_000)

    return () => {
      clearTimeout(immediate)
      clearInterval(everyMinute)
    }
  }, [])

  const fetchProfile = useCallback(() => {
    if (!mutawifId) return Promise.reject(new Error('Mutawif belum dipilih.'))
    return api.get(`/mutawif/${mutawifId}`)
  }, [mutawifId])

  const { status, data: profile, error, reload } = useResource(fetchProfile)

  const days = now ? nextDays(now.date, 5) : []
  const firstAvailableDay = days.find((day) =>
    day.iso > now?.date || (day.iso === now?.date && toMinutes(time) > now.minutes),
  )
  // Derived rather than synced: the first option stands until one is picked.
  const activeService = serviceType ?? profile?.rates[0]?.serviceType ?? null
  const activeDate = dateIso ?? firstAvailableDay?.iso ?? days[0]?.iso ?? null

  const rate = profile?.rates.find((r) => r.serviceType === activeService)
  const total = rate ? Number(rate.hourlyRate) * durationHours : 0

  // The API rejects a start time in the past. `now` only advances on a tick,
  // so this never reads the clock during render.
  const startsInPast =
    Boolean(now && activeDate) &&
    (activeDate < now.date || (activeDate === now.date && toMinutes(time) <= now.minutes))

  const submit = async () => {
    if (!rate || !activeDate) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const booking = await api.post('/bookings', {
        mutawifId,
        serviceType: activeService,
        scheduledStartAt: toInstant(activeDate, time),
        durationHours,
        meetingPointLabel: meetingPoint.trim(),
        notes: notes.trim() || undefined,
      })
      navigate('booking-success', { bookingId: booking.id })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-full bg-stone pt-24">
        <Loading label="Menyiapkan pemesanan…" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-full bg-stone pt-20">
        <ErrorState message={error} onRetry={reload} />
        <div className="px-5">
          <button onClick={() => navigate('mutawif')} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: '#E8F3EC', color: '#1B5E35' }}>
            Kembali ke daftar mutawif
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-stone">
      {/* Header */}
      <div className="glass-topbar px-5 pt-14 pb-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('mutawif-profile', { mutawifId })} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#E8F3EC' }}>
            <ArrowLeft size={16} color="#1B5E35" />
          </button>
          <h2 className="font-semibold text-ink text-base">Konfirmasi Pemesanan</h2>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4 mb-44">
        {/* Mutawif */}
        <div className="glass rounded-[20px] p-4">
          <p className="text-sm font-semibold text-ink-soft mb-3">Mutawif Dipilih</p>
          <div className="flex items-center gap-3">
            <Avatar
              src={profile.user.avatarUrl}
              name={profile.user.name}
              alt={profile.user.name}
              imageClassName="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              fallbackClassName="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
              fallbackStyle={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}
            />
            <div>
              <p className="font-semibold text-ink text-sm">{profile.user.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {profile.ratingCount > 0 && (
                  <>
                    <Star size={11} color="#B8944A" fill="#B8944A" />
                    <span className="text-xs font-semibold" style={{ color: '#B8944A' }}>{profile.ratingAverage.toFixed(1)}</span>
                    <span className="text-xs text-ink-faint">•</span>
                  </>
                )}
                <CheckCircle size={11} color="#1B5E35" />
                <span className="text-xs text-ink-soft">Terverifikasi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service type */}
        <div className="glass rounded-[20px] p-4">
          <p className="text-sm font-semibold text-ink-soft mb-3">Jenis Layanan</p>
          <div className="space-y-2">
            {profile.rates.map((r) => {
              const Icon = SERVICE_ICONS[r.serviceType] ?? Star
              const selected = r.serviceType === activeService
              return (
                <button
                  key={r.serviceType}
                  onClick={() => setServiceType(r.serviceType)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border text-left"
                  style={{ borderColor: selected ? '#1B5E35' : '#E5E7EB', background: selected ? '#E8F3EC' : 'transparent' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: selected ? '#C3DFC9' : '#F3F4F6' }}>
                    <Icon size={14} color={selected ? '#1B5E35' : '#9CA3AF'} strokeWidth={1.8} />
                  </div>
                  <p className="flex-1 text-sm font-medium text-ink">
                    {SERVICE_LABELS[r.serviceType] ?? r.serviceType}
                  </p>
                  <p className="text-xs font-bold" style={{ color: '#1B5E35' }}>{formatRupiah(r.hourlyRate)}/jam</p>
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selected ? '#1B5E35' : '#D1D5DB' }}>
                    {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#1B5E35' }} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Schedule */}
        <div className="glass rounded-[20px] p-4">
          <p className="text-sm font-semibold text-ink-soft mb-3">Tanggal</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((d) => {
              const selected = d.iso === activeDate
              return (
                <button
                  key={d.iso}
                  onClick={() => setDateIso(d.iso)}
                  className="flex-shrink-0 w-12 flex flex-col items-center py-2 rounded-xl text-xs font-semibold"
                  style={selected
                    ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', color: 'white' }
                    : { background: '#F3F4F6', color: '#6B7280' }}
                >
                  <span>{d.weekday}</span>
                  <span>{d.dayOfMonth}</span>
                </button>
              )
            })}
          </div>

          <p className="text-sm font-semibold text-ink-soft mt-4 mb-3">Jam Mulai (Waktu Saudi)</p>
          <div className="grid grid-cols-3 gap-2">
            {TIMES.map((t) => {
              const selected = t === time
              return (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className="py-2 rounded-xl text-xs font-semibold text-center"
                  style={selected
                    ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', color: 'white' }
                    : { background: '#F3F4F6', color: '#6B7280' }}
                >
                  {t}
                </button>
              )
            })}
          </div>

          <p className="text-sm font-semibold text-ink-soft mt-4 mb-3">Durasi</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => {
              const selected = d === durationHours
              return (
                <button
                  key={d}
                  onClick={() => setDurationHours(d)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-center"
                  style={selected
                    ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', color: 'white' }
                    : { background: '#F3F4F6', color: '#6B7280' }}
                >
                  {d} jam
                </button>
              )
            })}
          </div>

          {startsInPast && (
            <p className="text-xs text-amber-600 mt-3 flex items-start gap-1.5">
              <Info size={13} className="flex-shrink-0 mt-0.5" />
              Waktu itu sudah lewat di Makkah. Pilih jam atau tanggal lain.
            </p>
          )}
        </div>

        {/* Meeting point */}
        <div className="glass rounded-[20px] p-4">
          <p className="text-sm font-semibold text-ink-soft mb-2">Lokasi Pertemuan</p>
          <div className="flex items-start gap-2">
            <MapPin size={18} color="#1B5E35" strokeWidth={1.8} className="mt-2 flex-shrink-0" />
            <input
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              placeholder="Contoh: Pintu King Fahd, Masjidil Haram"
              className="flex-1 text-sm text-ink py-2 border-b border-gray-200 focus:outline-none focus:border-green-700"
            />
          </div>

          <p className="text-sm font-semibold text-ink-soft mt-4 mb-2">Catatan untuk Mutawif</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Contoh: jamaah lansia, memakai kursi roda"
            className="w-full text-sm text-ink p-2 rounded-xl bg-stone border border-gray-200 focus:outline-none focus:border-green-700 resize-none"
          />
        </div>

        {/* Price */}
        <div className="glass rounded-[20px] p-4">
          <p className="text-sm font-semibold text-ink-soft mb-3">Rincian Biaya</p>
          <div className="flex justify-between">
            <span className="text-sm text-ink-soft">
              {SERVICE_LABELS[activeService] ?? '—'} ({durationHours} jam)
            </span>
            <span className="text-sm text-ink">{formatRupiah(total)}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between">
            <span className="text-sm font-semibold text-ink">Total</span>
            <span className="text-sm font-bold" style={{ color: '#1B5E35' }}>{formatRupiah(total)}</span>
          </div>
          <p className="text-xs text-ink-faint mt-2">
            Pembayaran diselesaikan langsung dengan mutawif. Belum ada pembayaran dalam aplikasi.
          </p>
        </div>

        {submitError && (
          <div className="rounded-xl p-3 text-xs text-red-600" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            {submitError}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] glass-bar px-5 py-4">
        <button
          onClick={submit}
          disabled={submitting || startsInPast || !rate || !activeDate || meetingPoint.trim().length < 3}
          className="w-full py-4 rounded-[16px] text-white font-semibold text-base disabled:opacity-40"
          style={{
            background: 'linear-gradient(150deg, #1B5E35, #2D7A4F)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.28), 0 10px 24px -14px rgba(15,61,34,.8)',
          }}
        >
          {submitting ? 'Mengirim permintaan…' : 'Konfirmasi Pemesanan'}
        </button>
        <p className="text-center text-xs text-ink-faint mt-2">
          Mutawif punya waktu 15 menit untuk menerima permintaanmu
        </p>
      </div>
    </div>
  )
}
