import { useCallback, useEffect, useState } from 'react'
import {
  Bell, Home, BookOpen, MessageCircle, UserCheck, Settings,
  ChevronRight, Heart, ClipboardCheck,
} from 'lucide-react'
import { api } from '../lib/api'
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
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {NAV_TABS.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => navigate(id)} className={active === id ? 'nav-item is-active' : 'nav-item'} aria-current={active === id ? 'page' : undefined}>
          <span className="nav-icon"><Icon size={23} strokeWidth={active === id ? 2.3 : 1.7} /></span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

const PILLARS = [
  { label: 'Panduan ibadah', description: 'Tata cara Umrah & Haji', Icon: BookOpen, screen: 'guidance' },
  { label: 'Tanya asisten', description: 'Jawaban seputar ibadah', Icon: MessageCircle, screen: 'chatbot' },
  { label: 'Cari mutawif', description: 'Pendamping di Tanah Suci', Icon: UserCheck, screen: 'mutawif' },
  { label: 'Doa & dzikir', description: 'Bacaan selama perjalanan', Icon: Heart, screen: 'guidance', params: { search: 'doa' } },
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
      <header className="home-header">
        <div className="greeting-copy">
          <p>Assalamu'alaikum,</p>
          <h1>{displayName}</h1>
        </div>
        <button
          onClick={() => navigate('notifications')}
          aria-label={`Notifikasi${notificationCount ? `, ${notificationCount} notifikasi` : ''}`}
          className="notification-button"
        >
          <Bell size={22} strokeWidth={1.7} />
          {notificationCount > 0 && <span className="notification-badge">{notificationCount > 9 ? '9+' : notificationCount}</span>}
        </button>
      </header>

      <main className="home-content">
        <PrayerStrip navigate={navigate} />
        {activeBooking && (
          <button onClick={() => navigate('booking-success', { bookingId: activeBooking.id })} className="active-booking">
            <UserCheck size={25} /><span><span className="eyebrow">PENDAMPING IBADAH ANDA</span><strong>{activeBooking.mutawif?.user?.name ?? 'Mutawif'}</strong><small>{BOOKING_STATUS_LABELS[activeBooking.status]}</small><small>{formatSchedule(activeBooking.scheduledStartAt)} WAS · {activeBooking.meetingPointLabel}</small></span><ChevronRight size={18} />
          </button>
        )}

        <section className="home-services" aria-labelledby="services-heading">
          <h2 id="services-heading" className="section-title">Untuk ibadah Anda</h2>
          <div className="service-grid">
            {PILLARS.map(({ label, description, Icon, screen, params }) => (
              <button key={label} onClick={() => navigate(screen, params)} className="service-card">
                <Icon size={24} strokeWidth={1.6} aria-hidden="true" />
                <span className="service-title">{label}</span>
                <span className="service-description">{description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="home-guidance" aria-labelledby="guidance-heading">
          <div className="section-heading">
            <h2 id="guidance-heading" className="section-title">Panduan ibadah</h2>
            <button onClick={() => navigate('guidance')}>Lihat semua <ChevronRight size={16} /></button>
          </div>
          {topicStatus === 'loading' && <Loading label="Memuat panduan…" />}
          {topicStatus === 'error' && <ErrorState message="Panduan belum dapat dimuat. Periksa koneksi lalu coba lagi." onRetry={reload} />}
          {topicStatus === 'ready' && topics.length === 0 && <EmptyState title="Panduan segera hadir" description="Panduan ibadah akan ditampilkan di sini." />}
          {topicStatus === 'ready' && topics.length > 0 && (
            <div className="guide-list">
              {topics.slice(0, 2).map((topic, index) => (
                <button key={topic.slug} onClick={() => navigate('guidance-detail', { slug: topic.slug })} className="guide-row">
                  <span className="guide-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span className="guide-copy">
                    <span className="guide-meta">{topic.category === 'HAJJ' ? 'Haji' : topic.category === 'UMRAH' ? 'Umrah' : 'Panduan'}{topic.readingMinutes ? ` · ${topic.readingMinutes} menit baca` : ''}</span>
                    <strong>{topic.title}</strong>
                    {topic.summary && <span className="guide-summary">{topic.summary}</span>}
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </section>
        <button className="preparation-link" onClick={() => navigate('checklist')}>
          <ClipboardCheck size={22} strokeWidth={1.6} aria-hidden="true" />
          <span>Checklist persiapan</span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </main>
      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}
