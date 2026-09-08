import { useEffect, useState } from 'react'
import {
  Bell, Home, BookOpen, MessageCircle, UserCheck, Settings,
  ChevronRight, FileText,
  Layers, RotateCcw, ArrowRightLeft, Sunrise, Scissors, Moon, Target,
  Heart, ClipboardList,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { BOOKING_STATUS_LABELS, formatSchedule, initialsOf } from '../lib/format'

const NAV_TABS = [
  { id: 'home', label: 'Beranda', Icon: Home },
  { id: 'guidance', label: 'Panduan', Icon: BookOpen },
  { id: 'chatbot', label: 'AI Chat', Icon: MessageCircle },
  { id: 'mutawif', label: 'Mutawif', Icon: UserCheck },
  { id: 'profile', label: 'Profil', Icon: Settings },
]

export function BottomNav({ active, navigate }) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 flex shadow-lg z-50">
      {NAV_TABS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            className="flex-1 flex flex-col items-center py-3 gap-0.5"
          >
            <Icon size={20} color={isActive ? '#1B5E35' : '#9ca3af'} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium" style={{ color: isActive ? '#1B5E35' : '#9ca3af' }}>
              {label}
            </span>
            {isActive && <div className="w-1 h-1 rounded-full" style={{ background: '#1B5E35' }} />}
          </button>
        )
      })}
    </div>
  )
}

// The API names an icon; the client owns the mapping to a component.
const ICONS = {
  BookOpen, Scissors, Sunrise, Moon, Target, Heart, RotateCcw, ArrowRightLeft,
  Layers, ClipboardList,
}

export default function HomeScreen({ navigate }) {
  const { user } = useAuth()
  const [activeBooking, setActiveBooking] = useState(null)
  const [topics, setTopics] = useState([])
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    // Surface whatever booking still needs the jamaah's attention.
    api
      .get('/bookings?limit=5')
      .then((page) => {
        const live = page.items.find((b) =>
          ['REQUESTED', 'ACCEPTED', 'ONGOING'].includes(b.status),
        )
        setActiveBooking(live ?? null)
      })
      .catch(() => {})

    api
      .get('/content/topics')
      .then((page) => setTopics(page.items))
      .catch(() => {})

    api
      .get('/notifications?limit=1')
      .then((page) => setNotificationCount(page.meta.total))
      .catch(() => {})
  }, [])

  const displayName = user?.name ?? user?.email ?? 'Jamaah'

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-6" style={{ background: 'linear-gradient(150deg, #0f3d22 0%, #1B5E35 50%, #2D7A4F 100%)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-green-200 text-xs mb-0.5">Assalamu'alaikum</p>
            <h2 className="text-white text-xl font-bold truncate max-w-[200px]">{displayName}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('notifications')}
              className="relative w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
            >
              <Bell size={18} color="white" strokeWidth={1.8} />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: '#B8944A' }}
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('profile')}
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #B8944A 0%, #D4A855 100%)', color: 'white' }}
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                : initialsOf(displayName)}
            </button>
          </div>
        </div>

        {/* Active booking, or a nudge to make one */}
        {activeBooking ? (
          <button
            onClick={() => navigate('booking-success', { bookingId: activeBooking.id })}
            className="w-full rounded-2xl p-4 text-left backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <p className="text-green-100 text-xs mb-1">Pesanan Aktif</p>
            <p className="text-white font-semibold truncate">
              {activeBooking.mutawif?.user?.name ?? 'Mutawif'} — {BOOKING_STATUS_LABELS[activeBooking.status]}
            </p>
            <p className="text-green-200 text-xs mt-1.5">
              {formatSchedule(activeBooking.scheduledStartAt)} WAS • {activeBooking.meetingPointLabel}
            </p>
          </button>
        ) : (
          <button
            onClick={() => navigate('mutawif')}
            className="w-full rounded-2xl p-4 text-left backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <p className="text-green-100 text-xs mb-1">Belum ada pesanan aktif</p>
            <p className="text-white font-semibold">Cari mutawif di sekitarmu</p>
            <p className="text-green-200 text-xs mt-1.5">Pendampingan ibadah, bantuan lansia, atau darurat</p>
          </button>
        )}
      </div>

      {/* Main features */}
      <div className="px-5 -mt-3 z-10 relative">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Guidance\nMandiri', Icon: BookOpen, screen: 'guidance', grad: 'linear-gradient(135deg, #1B5E35 0%, #2D7A4F 100%)' },
            { label: 'Chatbot\nAI', Icon: MessageCircle, screen: 'chatbot', grad: 'linear-gradient(135deg, #B8944A 0%, #D4A855 100%)' },
            { label: 'Mutawif\nOn-Demand', Icon: UserCheck, screen: 'mutawif', grad: 'linear-gradient(135deg, #0f3d22 0%, #1B5E35 100%)' },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => navigate(f.screen)}
              className="flex flex-col items-center justify-center py-5 px-2 rounded-2xl shadow-md text-white"
              style={{ background: f.grad }}
            >
              <f.Icon size={26} color="white" strokeWidth={1.8} className="mb-2" />
              <span className="text-xs font-semibold text-center leading-tight whitespace-pre-line opacity-95">
                {f.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick phases */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm">Panduan Ibadah</h3>
          <button onClick={() => navigate('guidance')} className="text-xs font-medium flex items-center gap-0.5" style={{ color: '#1B5E35' }}>
            Lihat semua <ChevronRight size={13} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {topics.slice(0, 4).map((topic) => {
            const Icon = ICONS[topic.icon] ?? BookOpen
            return (
              <button
                key={topic.slug}
                onClick={() => navigate('guidance-detail', { slug: topic.slug })}
                className="flex flex-col items-center py-3 rounded-xl bg-white shadow-sm border border-gray-100"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1" style={{ background: '#E8F3EC' }}>
                  <Icon size={17} color="#1B5E35" strokeWidth={1.8} />
                </div>
                <span className="text-xs text-gray-600 font-medium text-center leading-tight px-1 truncate w-full">
                  {topic.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="px-5 mt-5 mb-24">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm">Tips &amp; Informasi</h3>
        </div>
        <div className="space-y-3">
          {topics.slice(4, 6).map((topic) => (
            <button
              key={topic.slug}
              onClick={() => navigate('guidance-detail', { slug: topic.slug })}
              className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E8F3EC, #C3DFC9)' }}>
                <FileText size={18} color="#1B5E35" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{topic.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{topic.readingMinutes} menit baca</p>
              </div>
              {topic.obligation && (
                <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{ background: '#F5EDD8', color: '#B8944A' }}>
                  {topic.obligation}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}
