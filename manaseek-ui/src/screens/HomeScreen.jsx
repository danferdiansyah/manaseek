import { useEffect, useState } from 'react'
import {
  Bell, Home, BookOpen, MessageCircle, UserCheck, Settings, UserRound,
  ChevronRight, ArrowRight, Clock3, Compass, Luggage, Info,
  Layers, RotateCcw, ArrowRightLeft, Sunrise, Scissors, Moon, Target,
  Heart, ClipboardList,
} from 'lucide-react'
import { api } from '../lib/api'
import Avatar from '../lib/Avatar'
import KaabaIcon from '../lib/KaabaIcon'
import { useAuth } from '../lib/auth-context'
import { BOOKING_STATUS_LABELS, formatSchedule } from '../lib/format'
import PrayerStrip from '../lib/PrayerStrip'
import kaabaIllustration from '../assets/home/kaaba-cutout.png'
import manaseekMark from '../assets/home/manaseek-mark.png'
import './home.css'

const NAV_TABS = [
  { id: 'home', label: 'Beranda', Icon: Home },
  { id: 'guidance', label: 'Panduan', Icon: BookOpen },
  { id: 'chatbot', label: 'AI Chat', Icon: MessageCircle },
  { id: 'mutawif', label: 'Mutawif', Icon: UserCheck },
  { id: 'profile', label: 'Profil', Icon: Settings },
]

export function BottomNav({ active, navigate }) {
  return (
    <nav aria-label="Navigasi utama" className={`glass-bar fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] flex z-50 pb-[env(safe-area-inset-bottom)] ${active === 'home' ? 'home-bottom-nav' : ''}`}>
      {NAV_TABS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            aria-current={isActive ? 'page' : undefined}
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
                aria-hidden="true"
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
    </nav>
  )
}

const ICONS = {
  BookOpen, Scissors, Sunrise, Moon, Target, Heart, RotateCcw, ArrowRightLeft,
  Layers, ClipboardList,
}

const SERVICES = [
  { label: 'Panduan\nUmrah', Icon: KaabaIcon, screen: 'guidance', category: 'UMRAH', color: 'green' },
  { label: 'Panduan\nHaji', Icon: BookOpen, screen: 'guidance', category: 'HAJJ', color: 'gold' },
  { label: 'Tanya\nAI', Icon: MessageCircle, screen: 'chatbot', color: 'teal' },
  { label: 'Cari\nMutawif', Icon: UserCheck, screen: 'mutawif', color: 'sage' },
  { label: 'Arah\nKiblat', Icon: Compass, screen: 'qibla', color: 'gold' },
  { label: 'Checklist\nIbadah', Icon: ClipboardList, screen: 'checklist', color: 'green' },
  { label: 'Persiapan\nPerjalanan', Icon: Luggage, screen: 'guidance', category: 'PERSIAPAN', color: 'sand' },
  { label: 'Profil\nSaya', Icon: UserRound, screen: 'profile', color: 'olive' },
]

const HOME_RESOURCES = [
  ['bookings', '/bookings?limit=5'],
  ['topics', '/content/topics'],
  ['notifications', '/notifications?limit=1'],
  ['checklist', '/content/checklist'],
]

export default function HomeScreen({ navigate }) {
  const { user } = useAuth()
  const [resources, setResources] = useState({})
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let mounted = true
    const loadHome = async () => {
      // Keep requests sequential for the small database pool, while rendering
      // each result as it arrives. One failure must not hide the other sections.
      for (const [key, endpoint] of HOME_RESOURCES) {
        let result
        try {
          result = { status: 'ready', data: await api.get(endpoint) }
        } catch {
          result = { status: 'error' }
        }
        if (!mounted) return
        setResources((previous) => ({ ...previous, [key]: result }))
      }
    }
    loadHome()
    return () => { mounted = false }
  }, [attempt])

  const retry = () => {
    setResources({})
    setAttempt((value) => value + 1)
  }
  const activeBooking = resources.bookings?.data?.items?.find((booking) =>
    ['REQUESTED', 'ACCEPTED', 'ONGOING'].includes(booking.status),
  )
  const topics = resources.topics?.data?.items ?? []
  const notificationCount = resources.notifications?.data?.meta?.total ?? 0
  const checklist = resources.checklist?.data?.meta
  const displayName = user?.name ?? user?.email ?? 'Jamaah'
  const bookingFailed = resources.bookings?.status === 'error'
  const bookingLoading = !resources.bookings
  const hasDrafts = topics.some((topic) => topic.status === 'DRAFT')

  return (
    <div className="jamaah-home">
      <header className="home-header">
        <div className="home-topbar">
          <img className="home-brand-mark" src={manaseekMark} alt="Manaseek" width="48" height="48" />
          <button
            onClick={() => navigate('notifications')}
            aria-label={notificationCount > 0 ? `Notifikasi, ${notificationCount} notifikasi` : 'Notifikasi'}
            className="home-notifications"
          >
            <Bell size={20} strokeWidth={1.7} aria-hidden="true" />
            {notificationCount > 0 && <span>{notificationCount > 9 ? '9+' : notificationCount}</span>}
          </button>
        </div>
        <div className="home-greeting">
          <div>
            <p>Assalamu’alaikum,</p>
            <h1>{displayName}</h1>
          </div>
          <button onClick={() => navigate('profile')} aria-label="Buka profil" className="home-avatar">
            <Avatar src={user?.avatarUrl} name={displayName} imageClassName="home-avatar-image" fallbackClassName="home-avatar-fallback" />
          </button>
        </div>
        <PrayerStrip navigate={navigate} />
      </header>

      <main>
        <section className="home-services" aria-labelledby="home-services-heading">
          <div className="home-section-heading">
            <h2 id="home-services-heading">Temani setiap langkah</h2>
            <span>Haji &amp; Umrah</span>
          </div>
          <div className="home-service-grid">
            {SERVICES.map(({ label, Icon, screen, category, color }) => (
              <button key={label} className="home-service" onClick={() => navigate(screen, category ? { category } : {})}>
                <span className={`home-service-icon ${color}`} aria-hidden="true"><Icon size={25} strokeWidth={1.7} color="currentColor" /></span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="home-content">
          <section className="home-guide-promo" aria-labelledby="home-guide-heading">
            <div className="home-guide-copy">
              <p className="home-eyebrow">Bekal ibadahmu</p>
              <h2 id="home-guide-heading">Langkah tenang,<br />ibadah khusyuk.</h2>
              <p>Kenali rangkaian haji &amp; umrah, satu langkah demi satu langkah.</p>
              <button onClick={() => navigate('guidance')}>Mulai belajar <ArrowRight size={13} aria-hidden="true" /></button>
            </div>
            <img src={kaabaIllustration} alt="" width="640" height="640" />
          </section>

          <button
            className="home-booking"
            disabled={bookingLoading}
            onClick={() => bookingFailed ? retry() : activeBooking
              ? navigate('booking-success', { bookingId: activeBooking.id }) : navigate('mutawif')}
          >
            <span className="home-booking-icon"><UserCheck size={23} strokeWidth={1.6} aria-hidden="true" /></span>
            <span className="home-booking-copy">
              <small>{activeBooking ? 'PENDAMPINGAN AKTIF' : 'MUTAWIF MANASEEK'}</small>
              <strong>{bookingLoading ? 'Memuat pesanan…' : bookingFailed ? 'Pesanan belum termuat' : activeBooking
                ? activeBooking.mutawif?.user?.name ?? 'Mutawif' : 'Lebih tenang bersama mutawif'}</strong>
              <span>{bookingLoading ? 'Menyiapkan informasi pendampinganmu' : bookingFailed ? 'Ketuk untuk mencoba lagi' : activeBooking
                ? BOOKING_STATUS_LABELS[activeBooking.status] : 'Temukan pendamping ibadah di sekitarmu'}</span>
              {activeBooking && <span>{formatSchedule(activeBooking.scheduledStartAt)} WAS · {activeBooking.meetingPointLabel}</span>}
            </span>
            <ChevronRight size={17} aria-hidden="true" />
          </button>

          <section className="home-reading" aria-labelledby="home-reading-heading">
            <div className="home-section-heading">
              <h2 id="home-reading-heading">Kenali ibadahmu</h2>
              <button className="home-section-link" onClick={() => navigate('guidance')}>Lihat semua <ChevronRight size={13} aria-hidden="true" /></button>
            </div>
            {!resources.topics && <p className="home-inline-state" role="status">Memuat panduan ibadah…</p>}
            {resources.topics?.status === 'error' && (
              <div className="home-inline-state" role="status"><p>Panduan belum dapat dimuat.</p><button onClick={retry}>Coba lagi</button></div>
            )}
            {resources.topics?.status === 'ready' && topics.length === 0 && <p className="home-inline-state">Panduan ibadah sedang disiapkan.</p>}
            <div className="home-topic-list">
              {topics.slice(0, 3).map((topic) => {
                const Icon = ICONS[topic.icon] ?? BookOpen
                return (
                  <button key={topic.slug} className="home-topic" onClick={() => navigate('guidance-detail', { slug: topic.slug })}>
                    <span className="home-topic-icon"><Icon size={23} strokeWidth={1.6} aria-hidden="true" /></span>
                    <span className="home-topic-copy">
                      <strong>{topic.title}</strong>
                      <small><Clock3 size={11} aria-hidden="true" /> {topic.readingMinutes} menit baca{topic.status === 'DRAFT' && <em> · Draf</em>}</small>
                    </span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                )
              })}
            </div>
            {hasDrafts && <p className="home-topic-notice"><Info size={12} aria-hidden="true" />Panduan berlabel draf masih menunggu tinjauan pembimbing.</p>}
          </section>

          <button className="home-checklist" onClick={() => navigate('checklist')}>
            <ClipboardList size={25} strokeWidth={1.5} aria-hidden="true" />
            <span className="home-checklist-copy">
              <strong>Sudah siap berangkat?</strong>
              <small>{checklist ? `${checklist.completed} dari ${checklist.total} persiapan selesai` : 'Cek kembali persiapan perjalanan ibadahmu'}</small>
              {checklist?.total > 0 && <progress aria-label="Persiapan selesai" value={checklist.completed} max={checklist.total} />}
            </span>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
          <p className="home-footer">Menemani ikhtiar, mendekatkan hati.</p>
        </div>
      </main>
      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}
