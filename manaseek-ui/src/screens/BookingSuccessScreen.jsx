import { useCallback, useEffect } from 'react'
import { CheckCircle, Clock, Home, RefreshCw, UserCheck } from 'lucide-react'
import { api } from '../lib/api'
import { BOOKING_STATUS_LABELS, formatRupiah, formatSchedule, SERVICE_LABELS } from '../lib/format'
import { ErrorState, Loading } from '../lib/ui'
import { useResource } from '../lib/useResource'

const STATUS_TONE = {
  REQUESTED: { bg: '#FEF3C7', fg: '#B45309' },
  ACCEPTED: { bg: '#E8F3EC', fg: '#1B5E35' },
  ONGOING: { bg: '#E8F3EC', fg: '#1B5E35' },
  COMPLETED: { bg: '#E8F3EC', fg: '#1B5E35' },
  REJECTED: { bg: '#FEE2E2', fg: '#B91C1C' },
  CANCELLED: { bg: '#FEE2E2', fg: '#B91C1C' },
  EXPIRED: { bg: '#F3F4F6', fg: '#6B7280' },
}

export default function BookingSuccessScreen({ navigate, params }) {
  const bookingId = params?.bookingId
  const fetchBooking = useCallback(() => {
    if (!bookingId) return Promise.reject(new Error('Pesanan tidak ditemukan.'))
    return api.get(`/bookings/${bookingId}`)
  }, [bookingId])

  const { status, data: booking, error, reload } = useResource(fetchBooking)

  // Keep the booking card in sync while the order is waiting or in progress.
  useEffect(() => {
    if (!['REQUESTED', 'ACCEPTED', 'ONGOING'].includes(booking?.status)) return

    const timer = setInterval(reload, 10000)
    return () => clearInterval(timer)
  }, [booking?.status, reload])

  if (status === 'loading') {
    return (
      <div className="min-h-full bg-white pt-24">
        <Loading label="Memuat pesanan…" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-full bg-white pt-24">
        <ErrorState message={error} onRetry={reload} />
        <div className="px-6">
          <button onClick={() => navigate('home')} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: '#E8F3EC', color: '#1B5E35' }}>
            Kembali ke beranda
          </button>
        </div>
      </div>
    )
  }

  const pending = booking.status === 'REQUESTED'
  const tone = STATUS_TONE[booking.status] ?? STATUS_TONE.EXPIRED
  const mutawifName = booking.mutawif?.user?.name ?? 'Mutawif'

  const rows = [
    { label: 'Kode Pesanan', val: booking.code },
    { label: 'Mutawif', val: mutawifName },
    { label: 'Layanan', val: SERVICE_LABELS[booking.serviceType] ?? booking.serviceType },
    { label: 'Waktu', val: `${formatSchedule(booking.scheduledStartAt)} WAS` },
    { label: 'Durasi', val: `${booking.durationHours} jam` },
    { label: 'Lokasi', val: booking.meetingPointLabel },
    { label: 'Total', val: formatRupiah(booking.totalAmount) },
  ]

  return (
    <div className="flex flex-col min-h-full bg-white items-center justify-between px-6 py-12">
      <div />

      <div className="flex flex-col items-center text-center w-full">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl"
          style={{ background: pending
            ? 'linear-gradient(135deg, #B8944A 0%, #D4A855 100%)'
            : 'linear-gradient(135deg, #1B5E35 0%, #2D7A4F 100%)' }}
        >
          {pending ? <Clock size={44} color="white" strokeWidth={1.8} /> : <CheckCircle size={44} color="white" strokeWidth={1.8} />}
        </div>

        <h2 className="text-2xl font-semibold text-ink mb-2">
          {pending ? 'Permintaan Terkirim' : BOOKING_STATUS_LABELS[booking.status]}
        </h2>
        <p className="text-ink-soft text-sm leading-relaxed">
          {pending
            ? `Menunggu ${mutawifName} menerima permintaanmu. Kamu akan diberi tahu begitu dikonfirmasi.`
            : `Pesanan bersama ${mutawifName}.`}
        </p>

        <span
          className="mt-4 text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{ background: tone.bg, color: tone.fg }}
        >
          {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
        </span>

        <div className="mt-6 w-full rounded-2xl p-5 text-left" style={{ background: 'linear-gradient(135deg, #E8F3EC, #D1EBD8)' }}>
          <p className="text-sm font-semibold text-ink-soft mb-3">Detail pesanan</p>
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3 py-1.5 border-b border-green-100 last:border-0">
              <span className="text-xs text-ink-soft flex-shrink-0">{r.label}</span>
              <span className="text-xs font-semibold text-ink text-right">{r.val}</span>
            </div>
          ))}
        </div>

        {pending && (
          <button
            onClick={reload}
            className="mt-4 text-xs font-semibold flex items-center gap-1.5"
            style={{ color: '#1B5E35' }}
          >
            <RefreshCw size={13} /> Perbarui status
          </button>
        )}

        <p className="text-xs text-ink-faint mt-4 leading-relaxed">
          Pembayaran diselesaikan langsung dengan mutawif. Belum ada pembayaran dalam aplikasi.
        </p>
      </div>

      <div className="w-full space-y-3 mt-8">
        <button
          onClick={() => navigate('home')}
          className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}
        >
          <Home size={18} /> Kembali ke Beranda
        </button>
        <button
          onClick={() => navigate('mutawif')}
          className="w-full py-4 rounded-2xl font-semibold border-2 text-sm flex items-center justify-center gap-2"
          style={{ borderColor: '#1B5E35', color: '#1B5E35' }}
        >
          <UserCheck size={16} /> Cari Mutawif Lain
        </button>
      </div>
    </div>
  )
}
