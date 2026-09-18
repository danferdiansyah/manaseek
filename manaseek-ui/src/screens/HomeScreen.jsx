import { useCallback, useEffect, useState } from 'react'
import {
  Bell, Home, BookOpen, MessageCircle, UserCheck, Settings,
  ChevronRight, ArrowRight, Plane, Bot, Heart, ClipboardCheck, Sparkles,
} from 'lucide-react'
import { api } from '../lib/api'
import Avatar from '../lib/Avatar'
import { useAuth } from '../lib/auth-context'
import { BOOKING_STATUS_LABELS, formatSchedule } from '../lib/format'
import { EmptyState, ErrorState, Loading } from '../lib/ui'
import PrayerStrip from '../lib/PrayerStrip'

const NAV_TABS = [
  { id: 'home', label: 'Beranda', Icon: Home },
  { id: 'guidance', label: 'Panduan', Icon: BookOpen },
  { id: 'chatbot', label: 'AI Chat', Icon: MessageCircle },
  { id: 'mutawif', label: 'Mutawif', Icon: UserCheck },
  { id: 'profile', label: 'Profil', Icon: Settings },
]

export function BottomNav({ active, navigate }) {
  return (
    <nav className="bottom-nav glass-bar" aria-label="Navigasi utama">
      {NAV_TABS.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => navigate(id)} className={active === id ? 'nav-item is-active' : 'nav-item'} aria-current={active === id ? 'page' : undefined}>
          <span className="nav-icon"><Icon size={23} strokeWidth={active === id ? 2.3 : 1.7} /></span>
          <span>{label}</span><span className="nav-dot" />
        </button>
      ))}
    </nav>
  )
}

const PILLARS = [
  { label: 'Panduan Mandiri', description: 'Langkah ibadah Umrah & Haji', Icon: BookOpen, screen: 'guidance', style: 'emerald' },
  { label: 'AI Chat', description: 'Teman bertanya seputar ibadah', Icon: Bot, screen: 'chatbot', style: 'ivory' },
  { label: 'Mutawif On-Demand', description: 'Pendamping di setiap langkah', Icon: UserCheck, screen: 'mutawif', style: 'emerald' },
  { label: 'Doa & Dzikir', description: 'Bacaan untuk menemani ibadah', Icon: Heart, screen: 'guidance', params: { search: 'doa' }, style: 'ivory' },
]

export default function HomeScreen({ navigate }) {
  const { user } = useAuth()
  const [activeBooking, setActiveBooking] = useState(null)
  const [topics, setTopics] = useState([])
  const [topicStatus, setTopicStatus] = useState('loading')
  const [notificationCount, setNotificationCount] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const reload = useCallback(() => {
    setTopicStatus('loading')
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    let mounted = true
    const loadHome = async () => {
      const bookings = await api.get('/bookings?limit=5').catch(() => null)
      if (mounted && bookings) setActiveBooking(bookings.items.find((b) => ['REQUESTED', 'ACCEPTED', 'ONGOING'].includes(b.status)) ?? null)
      const content = await api.get('/content/topics').catch(() => null)
      if (mounted) {
        if (content) setTopics(content.items)
        setTopicStatus(content ? 'ready' : 'error')
      }
      const notifications = await api.get('/notifications?limit=1').catch(() => null)
      if (mounted && notifications) setNotificationCount(notifications.meta.total)
    }
    loadHome()
    return () => { mounted = false }
  }, [attempt])

  const displayName = user?.name ?? user?.email ?? 'Manaseek Indonesia'

  return (
    <div className="home-screen">
      <header className="home-hero">
        <div className="home-brand"><span className="brand-mark">M</span> MANASEEK <span className="brand-rule" /></div>
        <div className="home-greeting">
          <button onClick={() => navigate('profile')} aria-label="Buka profil" className="home-avatar">
            <Avatar src={user?.avatarUrl} name={displayName} imageClassName="w-full h-full object-cover" fallbackClassName="flex items-center justify-center w-full h-full" />
          </button>
          <div className="greeting-copy"><p>Assalamu'alaikum</p><h1>{displayName}</h1></div>
          <button onClick={() => navigate('notifications')} aria-label={`Notifikasi${notificationCount ? `, ${notificationCount} notifikasi` : ''}`} className="notification-button">
            <Bell size={22} strokeWidth={1.8} />
            {notificationCount > 0 && <span className="notification-badge">{notificationCount > 9 ? '9+' : notificationCount}</span>}
          </button>
        </div>
        <p className="home-blessing">Semoga perjalanan ibadah Anda<br />selalu dalam lindungan-Nya.</p>
        <button className="journey-pill" onClick={() => activeBooking ? navigate('booking-success', { bookingId: activeBooking.id }) : navigate('profile')}>
          <Plane size={18} /><span>{activeBooking ? BOOKING_STATUS_LABELS[activeBooking.status] : 'Rencanakan perjalanan ibadah'}</span><ChevronRight size={17} />
        </button>
      </header>

      <main className="home-content">
        <PrayerStrip navigate={navigate} />
        <section className="service-grid" aria-label="Layanan Manaseek">
          {PILLARS.map(({ label, description, Icon, screen, params, style }) => (
            <button key={label} onClick={() => navigate(screen, params)} className={`service-card ${style}`}>
              <span className="service-art"><Icon size={36} strokeWidth={1.4} /></span>
              <span className="service-title">{label}</span><span className="service-description">{description}</span>
              <span className="service-arrow"><ArrowRight size={16} /></span>
            </button>
          ))}
        </section>

        {activeBooking && (
          <button onClick={() => navigate('booking-success', { bookingId: activeBooking.id })} className="active-booking glass">
            <UserCheck size={25} /><span><span className="eyebrow">PENDAMPING IBADAH ANDA</span><strong>{activeBooking.mutawif?.user?.name ?? 'Mutawif'}</strong><small>{formatSchedule(activeBooking.scheduledStartAt)} WAS · {activeBooking.meetingPointLabel}</small></span><ChevronRight size={18} />
          </button>
        )}

        <section className="home-guidance">
          <div className="section-heading"><h2>Panduan Ibadah</h2><button onClick={() => navigate('guidance')}>Lihat semua <ChevronRight size={16} /></button></div>
          {topicStatus === 'loading' && <Loading label="Menyiapkan panduan ibadah…" />}
          {topicStatus === 'error' && <div className="glass rounded-[22px]"><ErrorState message="Panduan belum dapat dimuat. Periksa koneksi lalu coba lagi." onRetry={reload} /></div>}
          {topicStatus === 'ready' && topics.length === 0 && <EmptyState title="Panduan segera hadir" description="Panduan ibadah akan ditampilkan di sini." />}
          <div className="guide-carousel">
            {topics.slice(0, 6).map((topic, index) => (
              <button key={topic.slug} onClick={() => navigate('guidance-detail', { slug: topic.slug })} className="guide-card">
                <div className={`guide-cover guide-cover-${index % 3}`}><span className="guide-category">{topic.category === 'HAJJ' ? 'HAJI' : topic.category === 'UMRAH' ? 'UMRAH' : 'PANDUAN'}</span></div>
                <div className="guide-body"><span className="guide-medallion"><BookOpen size={21} /></span><div><h3>{topic.title}</h3><p>{topic.summary || `${topic.readingMinutes} menit baca`}</p></div><ChevronRight size={19} /></div>
              </button>
            ))}
          </div>
        </section>
        <button className="preparation-card" onClick={() => navigate('checklist')}><span className="preparation-icon"><ClipboardCheck size={25} /></span><span><strong>Lebih siap, lebih tenang</strong><small>Lengkapi checklist persiapan ibadahmu</small></span><ChevronRight size={18} /></button>
        <p className="home-signoff"><Sparkles size={13} /> Menemani setiap langkah ibadah Anda</p>
      </main>
      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}
