import { useEffect, useState } from 'react'
import { ChevronRight, LogOut } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import GlassIcon from '../components/GlassIcon'
import Avatar from '../lib/Avatar'
import { useAuth } from '../lib/auth-context'
import { BOOKING_STATUS_LABELS, formatSchedule, SERVICE_LABELS } from '../lib/format'

export default function ProfileScreen({ navigate }) {
  const { user, signOut } = useAuth()
  const [bookings, setBookings] = useState([])
  const [trip, setTrip] = useState(null)
  const [checklist, setChecklist] = useState(null)
  const [notificationCount, setNotificationCount] = useState(null)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      const bookings = await api.get('/bookings?limit=5').catch(() => null)
      if (mounted && bookings) setBookings(bookings.items)

      const trips = await api.get('/users/me/trips').catch(() => null)
      if (mounted && trips) setTrip(trips[0] ?? null)

      const checklist = await api.get('/content/checklist').catch(() => null)
      if (mounted && checklist) setChecklist(checklist.meta)

      const notifications = await api.get('/notifications?limit=1').catch(() => null)
      if (mounted && notifications) setNotificationCount(notifications.meta.total)
    }

    loadProfile()
    return () => {
      mounted = false
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('splash')
  }

  return (
    <div className="app-page flex flex-col min-h-full bg-stone">
      <PageHeader title="Profil saya" eyebrow="Perjalananmu" icon="profile">
        <div className="flex items-center gap-4">
          <Avatar
            src={user?.avatarUrl}
            name={user?.name ?? user?.email}
            alt={user?.name}
            imageClassName="w-16 h-16 profile-avatar object-cover border-2 border-white/25"
            fallbackClassName="w-16 h-16 profile-avatar flex items-center justify-center font-bold text-white text-xl border-2 border-white/25"
            fallbackStyle={{ background: 'linear-gradient(135deg, #B8944A, #D4A855)' }}
          />
          <div className="min-w-0">
            <p className="text-white font-bold text-base truncate">{user?.name ?? 'Jamaah Manaseek'}</p>
            <p className="text-canopy-100/85 text-xs mt-0.5 truncate">{user?.email}</p>
            {user?.phone && <p className="text-canopy-100/85 text-xs mt-0.5">{user.phone}</p>}
          </div>
        </div>
      </PageHeader>

      {/* Trip */}
      <div className="mx-5 mt-5 glass rounded-[20px] p-4">
        <p className="text-sm font-semibold text-ink mb-3">Rencana Ibadah</p>
        {trip ? (
          <div className="flex items-center gap-3">
            <GlassIcon name="travel" tone="sand" />
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
          <GlassIcon name="checklist" size="sm" bare />
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
                <GlassIcon name="mutawif" size="sm" />
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
            icon: 'checklist',
            label: 'Checklist Persiapan',
            sub: checklist ? `${checklist.completed} dari ${checklist.total} selesai` : 'Memuat…',
            screen: 'checklist',
          },
          {
            icon: 'notification',
            label: 'Notifikasi',
            sub: notificationCount === null
              ? 'Memuat…'
              : notificationCount === 0
                ? 'Belum ada notifikasi'
                : `${notificationCount} notifikasi`,
            screen: 'notifications',
          },
        ].map(({ icon, label, sub, screen }, i, all) => (
          <button
            key={label}
            onClick={() => navigate(screen)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${i < all.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            <GlassIcon name={icon} size="sm" />
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
          className="quiet-danger w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <LogOut size={15} /> Keluar dari Akun
        </button>
      </div>

      <BottomNav active="profile" navigate={navigate} />
    </div>
  )
}
