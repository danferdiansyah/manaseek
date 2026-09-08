import { useEffect, useState } from 'react'
import {
  ClipboardList, Bookmark, CheckSquare, Bell, Lock, HelpCircle, FileText,
  ChevronRight, LogOut, Landmark, Star,
} from 'lucide-react'
import { BottomNav } from './HomeScreen'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { BOOKING_STATUS_LABELS, formatSchedule, initialsOf, SERVICE_LABELS } from '../lib/format'

// Still prototype-only: these belong to the content and checklist modules.
const STATIC_MENU = [
  { Icon: Bookmark, label: 'Panduan Tersimpan', sub: 'Segera hadir' },
  { Icon: CheckSquare, label: 'Checklist Persiapan', sub: 'Segera hadir' },
  { Icon: Bell, label: 'Notifikasi', sub: 'Aktif' },
  { Icon: Lock, label: 'Keamanan Akun', sub: '' },
  { Icon: HelpCircle, label: 'Bantuan & FAQ', sub: '' },
  { Icon: FileText, label: 'Syarat & Ketentuan', sub: '' },
]

export default function ProfileScreen({ navigate }) {
  const { user, signOut } = useAuth()
  const [bookings, setBookings] = useState([])
  const [trip, setTrip] = useState(null)

  useEffect(() => {
    api.get('/bookings?limit=5').then((page) => setBookings(page.items)).catch(() => {})
    api.get('/users/me/trips').then((trips) => setTrip(trips[0] ?? null)).catch(() => {})
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('splash')
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-8" style={{ background: 'linear-gradient(150deg, #0f3d22 0%, #1B5E35 50%, #2D7A4F 100%)' }}>
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
            <p className="text-green-200 text-xs mt-0.5 truncate">{user?.email}</p>
            {user?.phone && <p className="text-green-200 text-xs mt-0.5">{user.phone}</p>}
          </div>
        </div>
      </div>

      {/* Trip */}
      <div className="mx-5 -mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-sm font-bold text-gray-800 mb-3">Rencana Ibadah</p>
        {trip ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E8F3EC, #C3DFC9)' }}>
              <Landmark size={20} color="#1B5E35" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {trip.packageName ?? (trip.type === 'HAJJ' ? 'Haji' : 'Umrah')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Berangkat {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(trip.departureDate))}
                {trip.agencyName ? ` • ${trip.agencyName}` : ''}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Belum ada rencana perjalanan yang terdaftar.</p>
        )}
      </div>

      {/* Booking history */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={16} color="#1B5E35" />
          <p className="text-sm font-bold text-gray-800">Riwayat Pemesanan</p>
        </div>

        {bookings.length === 0 ? (
          <p className="text-xs text-gray-400">Belum ada pemesanan mutawif.</p>
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
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {b.mutawif?.user?.name ?? 'Mutawif'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
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

      {/* Static menu */}
      <div className="mx-5 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {STATIC_MENU.map(({ Icon, label, sub }, i) => (
          <div key={label} className={`flex items-center gap-3 px-4 py-3.5 ${i < STATIC_MENU.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E8F3EC' }}>
              <Icon size={15} color="#1B5E35" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{label}</p>
              {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
            <ChevronRight size={15} color="#D1D5DB" />
          </div>
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
