import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  Navigation,
  Power,
  RefreshCw,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { BOOKING_STATUS_LABELS, formatRupiah, formatSchedule, SERVICE_LABELS } from '../lib/format'
import { EmptyState, ErrorState, Loading } from '../lib/ui'
import { useResource } from '../lib/useResource'
import { usePublishLocation } from '../lib/usePublishLocation'

const ACTIVE_STATUSES = new Set(['ACCEPTED', 'ONGOING'])

function StatusPill({ status }) {
  const pending = status === 'REQUESTED'
  const active = ACTIVE_STATUSES.has(status)

  return (
    <span
      className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
      style={{
        background: pending ? '#FEF3C7' : active ? '#E8F3EC' : '#F3F4F6',
        color: pending ? '#B45309' : active ? '#1B5E35' : '#6B7280',
      }}
    >
      {BOOKING_STATUS_LABELS[status] ?? status}
    </span>
  )
}

function BookingCard({ booking, actionKey, onAction }) {
  const pending = booking.status === 'REQUESTED'
  const actionBusy = actionKey?.startsWith(`${booking.id}:`)

  return (
    <div className="glass-solid rounded-[20px] p-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: pending ? '#FEF3C7' : '#E8F3EC' }}
        >
          <UserCheck size={18} color={pending ? '#B45309' : '#1B5E35'} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink truncate">
                {booking.jamaah?.name ?? 'Jamaah'}
              </p>
              <p className="text-[11px] text-ink-faint mt-0.5">#{booking.code}</p>
            </div>
            <StatusPill status={booking.status} />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <Clock3 size={14} color="#1B5E35" className="mt-0.5 flex-shrink-0" />
          <span className="text-ink-soft">
            {SERVICE_LABELS[booking.serviceType] ?? booking.serviceType} · {booking.durationHours} jam
            <br />
            <strong className="font-semibold text-ink">{formatSchedule(booking.scheduledStartAt)} WAS</strong>
          </span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={14} color="#1B5E35" className="mt-0.5 flex-shrink-0" />
          <span className="text-ink-soft">{booking.meetingPointLabel}</span>
        </div>
        {booking.notes && (
          <div className="rounded-xl px-3 py-2 text-ink-soft" style={{ background: '#F7F4ED' }}>
            Catatan jamaah: <span className="text-ink">{booking.notes}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <span className="text-ink-faint">Perkiraan imbalan</span>
          <strong className="text-ink">{formatRupiah(booking.totalAmount)}</strong>
        </div>
      </div>

      {pending && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            onClick={() => onAction(booking.id, 'accept')}
            disabled={actionBusy}
            className="py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}
          >
            <CheckCircle2 size={16} />
            {actionKey === `${booking.id}:accept` ? 'Menerima…' : 'Terima order'}
          </button>
          <button
            type="button"
            onClick={() => onAction(booking.id, 'reject')}
            disabled={actionBusy}
            className="py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ background: '#FEE2E2', color: '#B91C1C' }}
          >
            <XCircle size={16} />
            {actionKey === `${booking.id}:reject` ? 'Menolak…' : 'Tolak'}
          </button>
        </div>
      )}

      {booking.status === 'ACCEPTED' && (
        <button
          type="button"
          onClick={() => onAction(booking.id, 'start')}
          disabled={actionBusy}
          className="w-full mt-4 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}
        >
          {actionKey === `${booking.id}:start` ? 'Memulai…' : 'Mulai pendampingan'}
        </button>
      )}

      {booking.status === 'ONGOING' && (
        <button
          type="button"
          onClick={() => onAction(booking.id, 'complete')}
          disabled={actionBusy}
          className="w-full mt-4 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}
        >
          {actionKey === `${booking.id}:complete` ? 'Menyelesaikan…' : 'Tandai selesai'}
        </button>
      )}
    </div>
  )
}

export default function MutawifDashboardScreen() {
  const { user, signOut } = useAuth()
  const [actionKey, setActionKey] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [availabilityBusy, setAvailabilityBusy] = useState(false)

  const fetchDashboard = useCallback(async () => {
    // The demo database uses a small pool; keep these reads sequential so a
    // slow profile query cannot starve the booking query and show a false
    // "Database error" state in the panel.
    const profile = await api.get('/mutawif/me')
    const page = await api.get('/bookings?limit=50')
    return { profile, bookings: page.items ?? [] }
  }, [])

  const { status, data, error, reload } = useResource(fetchDashboard)

  // Jamaah can only find a mutawif whose position is current, so the fix is
  // published while online and left alone the rest of the time.
  const online = data?.profile?.availabilityStatus === 'ONLINE'
  const publishing = usePublishLocation({ enabled: online })

  useEffect(() => {
    if (!data) return undefined

    const timer = setInterval(reload, 10_000)
    return () => clearInterval(timer)
  }, [data, reload])

  const performAction = async (bookingId, action) => {
    setActionKey(`${bookingId}:${action}`)
    setActionError(null)

    try {
      await api.post(`/bookings/${bookingId}/${action}`, action === 'reject' ? {} : undefined)
      await reload()
    } catch (err) {
      setActionError(err.message ?? 'Aksi pesanan gagal dilakukan.')
    } finally {
      setActionKey(null)
    }
  }

  const toggleAvailability = async () => {
    if (!data?.profile) return

    const next = data.profile.availabilityStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE'
    setAvailabilityBusy(true)
    setActionError(null)

    try {
      await api.patch('/mutawif/me/availability', { status: next })
      await reload()
    } catch (err) {
      setActionError(err.message ?? 'Status ketersediaan gagal diubah.')
    } finally {
      setAvailabilityBusy(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-full bg-stone pt-24">
        <Loading label="Menyiapkan panel mutawif…" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-full bg-stone pt-20 px-5">
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }

  const { profile, bookings } = data
  const incoming = bookings.filter((booking) => booking.status === 'REQUESTED')
  const active = bookings.filter((booking) => ACTIVE_STATUSES.has(booking.status))
  const history = bookings.filter((booking) => !['REQUESTED', 'ACCEPTED', 'ONGOING'].includes(booking.status)).slice(0, 4)
  const isApproved = profile.verificationRequired === false || profile.verificationStatus === 'APPROVED'
  const isOnline = isApproved && profile.availabilityStatus === 'ONLINE'

  return (
    <div className="flex flex-col min-h-full bg-stone">
      <div className="canopy px-5 pt-14 pb-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <p className="text-canopy-100/80 text-sm">Panel Mutawif</p>
            <h2 className="text-white text-xl font-semibold truncate">{user?.name ?? 'Mutawif'}</h2>
          </div>
          <button
            type="button"
            onClick={reload}
            aria-label="Perbarui pesanan"
            className="glass-control w-10 h-10 rounded-full flex items-center justify-center"
          >
            <RefreshCw size={17} color="white" />
          </button>
        </div>

        <div className="glass-canopy rounded-[20px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-white text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: isOnline ? '#4ADE80' : '#9CA3AF' }} />
                {!isApproved ? 'Menunggu verifikasi' : isOnline ? 'Sedang menerima order' : 'Sedang offline'}
              </p>
              <p className="text-canopy-100/80 text-xs mt-1">
                {!isApproved
                  ? 'Lengkapi verifikasi agar bisa menerima order jamaah.'
                  : isOnline
                    ? 'Jamaah dapat mengirim permintaan kepadamu.'
                    : 'Aktifkan status untuk menerima permintaan baru.'}
              </p>
              {isOnline && (
                <p className="text-canopy-100/80 text-xs mt-1.5 flex items-center gap-1.5">
                  <Navigation size={11} />
                  {publishing.status === 'sent'
                    ? `Lokasi terkirim · akurasi ${publishing.accuracy} m`
                    : publishing.status === 'denied'
                      ? 'Izin lokasi ditolak, jamaah tidak bisa menemukanmu'
                      : publishing.status === 'failed'
                        ? 'Lokasi gagal terkirim, mencoba lagi'
                        : 'Mencari lokasimu…'}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={toggleAvailability}
              disabled={!isApproved || availabilityBusy}
              className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
              style={{ background: !isApproved ? 'rgba(255,255,255,.12)' : isOnline ? 'rgba(255,255,255,.18)' : '#D4A855', color: 'white' }}
            >
              <Power size={13} className="inline mr-1" />
              {!isApproved ? 'Menunggu' : availabilityBusy ? '…' : isOnline ? 'Offline' : 'Online'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-10 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-[20px] p-4">
            <p className="text-xs text-ink-faint">Order baru</p>
            <p className="text-2xl font-bold text-ink mt-1">{incoming.length}</p>
            <p className="text-xs text-ink-soft mt-1">Perlu dikonfirmasi</p>
          </div>
          <div className="glass rounded-[20px] p-4">
            <p className="text-xs text-ink-faint">Tugas aktif</p>
            <p className="text-2xl font-bold text-ink mt-1">{active.length}</p>
            <p className="text-xs text-ink-soft mt-1">Diterima atau berjalan</p>
          </div>
        </div>

        {actionError && (
          <div className="rounded-xl px-3 py-2.5 text-xs text-red-700" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            {actionError}
          </div>
        )}

        {profile.verificationRequired !== false && !isApproved && (
          <div className="rounded-[20px] p-4" style={{ background: '#FFF8E7', border: '1px solid #F1DFB1' }}>
            <p className="text-sm font-bold" style={{ color: '#80631F' }}>Profil sedang ditinjau</p>
            <p className="text-xs leading-relaxed mt-1" style={{ color: '#80631F' }}>
              Setelah disetujui admin, kamu bisa melengkapi tarif dan jadwal lalu mulai menerima order.
            </p>
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-base font-bold text-ink">Permintaan baru</p>
              <p className="text-xs text-ink-faint mt-0.5">Order masuk dari jamaah</p>
            </div>
            {incoming.length > 0 && <Clock3 size={18} color="#B8944A" />}
          </div>
          {incoming.length === 0 ? (
            <div className="glass rounded-[20px]">
              <EmptyState title="Belum ada order baru" description="Permintaan jamaah akan muncul otomatis di sini." />
            </div>
          ) : (
            <div className="space-y-3">
              {incoming.map((booking) => (
                <BookingCard key={booking.id} booking={booking} actionKey={actionKey} onAction={performAction} />
              ))}
            </div>
          )}
        </section>

        {active.length > 0 && (
          <section>
            <p className="text-base font-bold text-ink mb-3">Tugas aktif</p>
            <div className="space-y-3">
              {active.map((booking) => (
                <BookingCard key={booking.id} booking={booking} actionKey={actionKey} onAction={performAction} />
              ))}
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section>
            <p className="text-base font-bold text-ink mb-3">Aktivitas terakhir</p>
            <div className="glass rounded-[20px] divide-y divide-gray-100 overflow-hidden">
              {history.map((booking) => (
                <div key={booking.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                    {booking.status === 'COMPLETED' ? <CheckCircle2 size={15} color="#1B5E35" /> : <XCircle size={15} color="#9CA3AF" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{booking.jamaah?.name ?? 'Jamaah'}</p>
                    <p className="text-xs text-ink-faint mt-0.5">{formatSchedule(booking.scheduledStartAt)}</p>
                  </div>
                  <StatusPill status={booking.status} />
                </div>
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={signOut}
          className="w-full py-3 rounded-2xl text-sm font-semibold border-2 flex items-center justify-center gap-2"
          style={{ borderColor: '#EF4444', color: '#EF4444' }}
        >
          <LogOut size={15} /> Keluar dari akun
        </button>
      </div>
    </div>
  )
}
