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
    <div className="glass-bar fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] flex z-50 pb-[env(safe-area-inset-bottom)]">
      {NAV_TABS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            className="flex-1 flex flex-col items-center pt-2.5 pb-2 gap-1"
          >
            <span
              className="w-11 h-7 rounded-full flex items-center justify-center transition-colors"
              style={isActive ? { background: 'var(--color-canopy-100)' } : undefined}
            >
              <Icon
                size={19}
                color={isActive ? 'var(--color-canopy-700)' : 'var(--color-ink-faint)'}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
            </span>
            <span
              className="text-[11px] font-medium"
              style={{ color: isActive ? 'var(--color-canopy-700)' : 'var(--color-ink-faint)' }}
            >
              {label}
            </span>
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

// The one saturated element on the screen. Everything else stays quiet glass.
const PILLARS = [
  { label: 'Guidance\nMandiri', Icon: BookOpen, screen: 'guidance', grad: 'linear-gradient(150deg, #1B5E35 0%, #2D7A4F 100%)' },
  { label: 'Chatbot\nAI', Icon: MessageCircle, screen: 'chatbot', grad: 'linear-gradient(150deg, #B8944A 0%, #D4A855 100%)' },
  { label: 'Mutawif\nOn-Demand', Icon: UserCheck, screen: 'mutawif', grad: 'linear-gradient(150deg, #0F3D22 0%, #1B5E35 100%)' },
]

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
    <div className="flex flex-col min-h-full bg-stone">
      {/* Canopy */}
      <div className="canopy px-5 pt-14 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="min-w-0">
            <p className="text-canopy-100/80 text-sm">Assalamu'alaikum</p>
            <h2 className="text-white text-2xl font-semibold tracking-tight truncate max-w-[210px]">
              {displayName}
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('notifications')}
              aria-label="Notifikasi"
              className="glass-control relative w-10 h-10 rounded-full flex items-center justify-center"
            >
              <Bell size={18} color="white" strokeWidth={1.8} />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full text-[11px] font-semibold flex items-center justify-center text-white"
                  style={{ background: 'var(--color-brass)', border: '1.5px solid rgba(255,255,255,.35)' }}
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('profile')}
              aria-label="Profil"
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm overflow-hidden text-white"
              style={{
                background: 'linear-gradient(150deg, #B8944A 0%, #D4A855 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)',
              }}
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                : initialsOf(displayName)}
            </button>
          </div>
        </div>

        {/* Sits fully inside the canopy, clear of its edge. */}
        {activeBooking ? (
          <button
            onClick={() => navigate('booking-success', { bookingId: activeBooking.id })}
            className="glass-canopy w-full rounded-[20px] p-4 text-left"
          >
            <p className="text-canopy-100/80 text-xs mb-1">Pesanan aktif</p>
            <p className="text-white font-semibold truncate">
              {activeBooking.mutawif?.user?.name ?? 'Mutawif'}
            </p>
            <p className="text-canopy-100/90 text-sm mt-0.5">
              {BOOKING_STATUS_LABELS[activeBooking.status]}
            </p>
            <p className="text-canopy-100/85 text-xs mt-2">
              {formatSchedule(activeBooking.scheduledStartAt)} WAS · {activeBooking.meetingPointLabel}
            </p>
          </button>
        ) : (
          <button
            onClick={() => navigate('mutawif')}
            className="glass-canopy w-full rounded-[20px] p-4 text-left"
          >
            <p className="text-canopy-100/80 text-xs mb-1">Belum ada pesanan aktif</p>
            <p className="text-white font-semibold">Cari mutawif di sekitarmu</p>
            <p className="text-canopy-100/85 text-xs mt-1.5">
              Pendampingan ibadah, bantuan lansia, atau darurat
            </p>
          </button>
        )}
      </div>

      {/* Content starts below the canopy, not across it. */}
      <div className="px-5 pt-6 pb-28 space-y-7">
        <div className="grid grid-cols-3 gap-3">
          {PILLARS.map((pillar) => (
            <button
              key={pillar.label}
              onClick={() => navigate(pillar.screen)}
              className="flex flex-col items-center justify-center py-5 px-2 rounded-[20px] text-white"
              style={{
                background: pillar.grad,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.28), 0 10px 24px -16px rgba(15,61,34,.7)',
              }}
            >
              <pillar.Icon size={25} color="white" strokeWidth={1.8} className="mb-2" />
              <span className="text-xs font-semibold text-center leading-tight whitespace-pre-line">
                {pillar.label}
              </span>
            </button>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink">Panduan ibadah</h3>
            <button
              onClick={() => navigate('guidance')}
              className="text-sm font-medium flex items-center gap-0.5 text-canopy-700"
            >
              Lihat semua <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {topics.slice(0, 4).map((topic) => {
              const Icon = ICONS[topic.icon] ?? BookOpen
              return (
                <button
                  key={topic.slug}
                  onClick={() => navigate('guidance-detail', { slug: topic.slug })}
                  className="glass flex flex-col items-center justify-start py-3.5 rounded-[16px] min-h-[86px]"
                >
                  <span
                    className="w-9 h-9 rounded-[11px] flex items-center justify-center mb-1.5"
                    style={{ background: 'var(--color-canopy-100)' }}
                  >
                    <Icon size={17} color="var(--color-canopy-700)" strokeWidth={1.8} />
                  </span>
                  <span className="text-[11px] text-ink-soft font-medium text-center leading-tight px-1 line-clamp-2">
                    {topic.title}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-ink mb-3">Bacaan lanjutan</h3>
          <div className="space-y-2.5">
            {topics.slice(4, 6).map((topic) => (
              <button
                key={topic.slug}
                onClick={() => navigate('guidance-detail', { slug: topic.slug })}
                className="glass w-full flex items-center gap-3 rounded-[20px] p-4 text-left"
              >
                <span
                  className="w-10 h-10 rounded-[13px] flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-canopy-100)' }}
                >
                  <FileText size={18} color="var(--color-canopy-700)" strokeWidth={1.8} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium text-ink truncate">{topic.title}</span>
                  <span className="block text-xs text-ink-faint mt-0.5">
                    {topic.readingMinutes} menit baca
                  </span>
                </span>
                {topic.obligation && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                    style={{ background: 'var(--color-brass-bg)', color: 'var(--color-brass)' }}
                  >
                    {topic.obligation}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      </div>

      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}
