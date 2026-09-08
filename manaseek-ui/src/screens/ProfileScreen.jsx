import { useEffect, useState } from 'react'
import {
  ClipboardList, CheckSquare, Bell, ChevronRight, LogOut, Landmark, Star,
} from 'lucide-react'
import { BottomNav } from './HomeScreen'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { BOOKING_STATUS_LABELS, formatSchedule, initialsOf, SERVICE_LABELS } from '../lib/format'

export default function ProfileScreen({ navigate }) {
  const { user, signOut } = useAuth()
  const [bookings, setBookings] = useState([])
  const [trip, setTrip] = useState(null)
  const [checklist, setChecklist] = useState(null)
  const [notificationCount, setNotificationCount] = useState(null)

  useEffect(() => {
    api.get('/bookings?limit=5').then((page) => setBookings(page.items)).catch(() => {})
    api.get('/users/me/trips').then((trips) => setTrip(trips[0] ?? null)).catch(() => {})
    api.get('/content/checklist').then((page) => setChecklist(page.meta)).catch(() => {})
    api.get('/notifications?limit=1').then((page) => setNotificationCount(page.meta.total)).catch(() => {})
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('splash')
  }

  return (
    <div className="flex flex-col min-h-full bg-stone">
      {/* Header */}
      <div className="canopy px-5 pt-14 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Profil Saya</h2>
        </div>
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/25" />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-xl border-2 border-white/25"
              style={{ background: 'linear-gradient(135deg, #B8944A, #D4A855)' }}
            >
              {initialsOf(user?.name ?? user?.email)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold text-base truncate">{user?.name ?? 'Jamaah Manaseek'}</p>
            <p className="text-canopy-100/85 text-xs mt-0.5 truncate">{user?.email}</p>
            {user?.phone && <p className="text-canopy-100/85 text-xs mt-0.5">{user.phone}</p>}
          </div>
        </div>
      </div>

      {/* Trip */}
      <div className="mx-5 mt-5 glass rounded-[20px] p-4">
        <p className="text-sm font-semibold text-ink mb-3">Rencana Ibadah</p>
        {trip ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E8F3EC, #C3DFC9)' }}>
              <Landmark size={20} color="#1B5E35" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">
                {trip.packageName ?? (trip.type === 'HAJJ' ? 'Haji' : 'Umrah')}
              </p>
              <p className="text-xs text-ink-faint mt-0.5">
                Berangkat {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(trip.departureDate))}
                {trip.agencyName ? ` • ${trip.agencyName}` : ''}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-faint">Belum ada rencana perjalanan yang terdaftar.</p>
        )}
      </div>

      {/* Booking history */}
      <div className="mx-5 mt-4 glass rounded-[20px] p-4">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={16} color="#1B5E35" />
          <p className="text-sm font-semibold text-ink">Riwayat Pemesanan</p>
        </div>

        {bookings.length === 0 ? (
          <p className="text-xs text-ink-faint">Belum ada pemesanan mutawif.</p>
        ) : (
          <div className="space-y-2.5">
            {bookings.map((b) => (
              <button
                key={b.id}
                onClick={() => navigate('booking-success', { bookingId: b.id })}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#E8F3EC' }}>
                  <Star size={15} color="#1B5E35" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {b.mutawif?.user?.name ?? 'Mutawif'}
                  </p>
                  <p className="text-xs text-ink-faint truncate">
                    {SERVICE_LABELS[b.serviceType] ?? b.serviceType} • {formatSchedule(b.scheduledStartAt)}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full flex-shrink-0" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                  {BOOKING_STATUS_LABELS[b.status] ?? b.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu: only entries that actually go somewhere */}
      <div className="mx-5 mt-4 glass rounded-[20px] overflow-hidden">
        {[
          {
            Icon: CheckSquare,
            label: 'Checklist Persiapan',
            sub: checklist ? `${checklist.completed} dari ${checklist.total} selesai` : 'Memuat…',
            screen: 'checklist',
          },
          {
            Icon: Bell,
            label: 'Notifikasi',
            sub: notificationCount === null
              ? 'Memuat…'
              : notificationCount === 0
                ? 'Belum ada notifikasi'
                : `${notificationCount} notifikasi`,
            screen: 'notifications',
          },
        ].map(({ Icon, label, sub, screen }, i, all) => (
          <button
            key={label}
            onClick={() => navigate(screen)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${i < all.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E8F3EC' }}>
              <Icon size={15} color="#1B5E35" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{label}</p>
              <p className="text-xs text-ink-faint mt-0.5">{sub}</p>
            </div>
            <ChevronRight size={15} color="#D1D5DB" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="mx-5 mt-4 mb-24">
        <button
          onClick={handleSignOut}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold border-2 flex items-center justify-center gap-2"
          style={{ borderColor: '#EF4444', color: '#EF4444' }}
        >
          <LogOut size={15} /> Keluar dari Akun
        </button>
      </div>

      <BottomNav active="profile" navigate={navigate} />
    </div>
  )
}
