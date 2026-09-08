import { useCallback } from 'react'
import { ArrowLeft, Bell, CheckCircle, Clock, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import { EmptyState, ErrorState, Loading } from '../lib/ui'
import { useResource } from '../lib/useResource'

const TONE = {
  'booking.requested': { Icon: Clock, bg: '#FEF3C7', fg: '#B45309' },
  'booking.accepted': { Icon: CheckCircle, bg: '#E8F3EC', fg: '#1B5E35' },
  'booking.started': { Icon: CheckCircle, bg: '#E8F3EC', fg: '#1B5E35' },
  'booking.completed': { Icon: CheckCircle, bg: '#E8F3EC', fg: '#1B5E35' },
  'booking.rejected': { Icon: XCircle, bg: '#FEE2E2', fg: '#B91C1C' },
  'booking.cancelled': { Icon: XCircle, bg: '#FEE2E2', fg: '#B91C1C' },
  'booking.expired': { Icon: Clock, bg: '#F3F4F6', fg: '#6B7280' },
}

const formatWhen = (iso) =>
  new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

export default function NotificationsScreen({ navigate }) {
  const fetchNotifications = useCallback(() => api.get('/notifications?limit=50'), [])
  const { status, data, error, reload } = useResource(fetchNotifications)

  const items = data?.items ?? []

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <div className="px-5 pt-14 pb-6" style={{ background: 'linear-gradient(150deg, #0f3d22 0%, #1B5E35 50%, #2D7A4F 100%)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('home')} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft size={16} color="white" />
          </button>
          <h2 className="text-white font-bold text-lg">Notifikasi</h2>
        </div>
      </div>

      <div className="px-5 py-5 space-y-2.5 mb-10">
        {status === 'loading' && <Loading label="Memuat notifikasi…" />}
        {status === 'error' && <ErrorState message={error} onRetry={reload} />}

        {status === 'ready' && items.length === 0 && (
          <EmptyState
            title="Belum ada notifikasi"
            description="Kabar tentang pesanan mutawif akan muncul di sini."
          />
        )}

        {items.map((item) => {
          const tone = TONE[item.templateKey] ?? { Icon: Bell, bg: '#F3F4F6', fg: '#6B7280' }
          const bookingId = item.data?.bookingId

          return (
            <button
              key={item.id}
              onClick={() => bookingId && navigate('booking-success', { bookingId })}
              disabled={!bookingId}
              className="w-full flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left disabled:cursor-default"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tone.bg }}>
                <tone.Icon size={16} color={tone.fg} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                {item.title && <p className="text-sm font-semibold text-gray-800">{item.title}</p>}
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.body}</p>
                <p className="text-xs text-gray-300 mt-1">{formatWhen(item.createdAt)}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
