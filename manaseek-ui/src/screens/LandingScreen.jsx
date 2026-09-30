import { useState } from 'react'
import {
  ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown,
  ClipboardCheck, Compass, Heart, MapPin, Menu, Sparkles, X,
} from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import mark from '../assets/home/manaseek-mark.png'
import makkah from '../assets/umrah/makkah-dawn.webp'
import madinah from '../assets/umrah/madinah-serenity.webp'
import guidanceArt from '../assets/home/services/hajj.webp'
import chatArt from '../assets/home/services/chat.webp'
import mutawifArt from '../assets/home/services/mutawif.webp'
import './landing.css'

const FEATURES = [
  {
    number: '01', title: 'Pahami setiap langkah.', label: 'Panduan ibadah', image: guidanceArt,
    description: 'Pelajari rangkaian haji dan umrah, doa, serta persiapan perjalanan dalam satu tempat yang mudah diikuti.',
    tags: ['Haji & umrah', 'Doa & persiapan'], tone: 'sage',
  },
  {
    number: '02', title: 'Ada tanya, ada teman.', label: 'Asisten AI', image: chatArt,
    description: 'Tanyakan hal yang ingin kamu pahami. Asisten AI membantu mencari jawaban dari pustaka panduan, lengkap dengan rujukannya.',
    tags: ['Bahasa Indonesia', 'Riwayat percakapan'], tone: 'sand',
  },
  {
    number: '03', title: 'Didampingi lebih dekat.', label: 'Mutawif on-demand', image: mutawifArt,
    description: 'Temukan mutawif di sekitarmu, kenali profilnya, dan ajukan pendampingan sesuai kebutuhan perjalanan ibadahmu.',
    tags: ['Pencarian terdekat', 'Pemesanan praktis'], tone: 'mint',
  },
]

const STEPS = [
  { title: 'Mulai dari niat baik.', description: 'Masuk dengan akun Google, lalu lengkapi profil singkat untuk memulai perjalananmu.' },
  { title: 'Siapkan dengan lebih tenang.', description: 'Kenali tata cara ibadah dan gunakan checklist agar persiapanmu lebih terarah.' },
  { title: 'Bawa teman dalam perjalanan.', description: 'Buka panduan, tanyakan pada AI, atau cari pendamping saat kamu membutuhkannya.' },
]

const FAQS = [
  { question: 'Apa itu Manaseek?', answer: 'Manaseek adalah platform pendamping haji dan umrah untuk jamaah Indonesia. Kamu bisa mengakses panduan ibadah, bertanya kepada asisten AI, mencari mutawif, serta menggunakan checklist persiapan, waktu shalat, arah kiblat, dan konverter Riyal–Rupiah.' },
  { question: 'Apakah saya harus sudah berada di Tanah Suci?', answer: 'Tidak. Kamu bisa mulai menggunakan Manaseek sejak di rumah untuk mempelajari rangkaian ibadah dan menyiapkan kebutuhan perjalanan. Saat di Tanah Suci, fitur panduan dan pencarian mutawif dapat membantu melanjutkan persiapan itu.' },
  { question: 'Bagaimana cara mulai menggunakannya?', answer: 'Klik Login atau Mulai perjalanan, lalu masuk dengan akun Google. Jika baru pertama kali menggunakan Manaseek, kamu akan diminta memilih peran dan melengkapi profil singkat sebelum masuk ke aplikasi.' },
  { question: 'Apakah AI bisa menggantikan pembimbing ibadah?', answer: 'Asisten AI membantu menemukan informasi dari pustaka panduan dan menampilkan rujukan yang digunakan. Untuk keputusan sesuai kondisi pribadimu, konsultasikan dengan pembimbing yang kompeten. Konten panduan dan dalil di Manaseek saat ini masih dalam tahap peninjauan.' },
  { question: 'Bagaimana cara mendapatkan pendamping mutawif?', answer: 'Setelah masuk, buka Cari Mutawif dan izinkan akses lokasi untuk melihat mutawif yang tersedia di sekitarmu. Kamu bisa memeriksa profil, memilih layanan, lalu mengajukan pemesanan. Ketersediaan mengikuti lokasi dan status online mutawif.' },
]

function Brand({ footer = false }) {
  return (
    <a className={`landing-brand${footer ? ' landing-brand--footer' : ''}`} href="/" aria-label="Manaseek, halaman utama">
      <img src={mark} alt="" width="42" height="42" />
      <span>manaseek<span className="landing-brand-dot">.</span></span>
    </a>
  )
}

export default function LandingScreen() {
  const { status } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const signedIn = status === 'signedIn'
  const entryLabel = signedIn ? 'Buka aplikasi' : 'Mulai perjalanan'

  return (
    <div className="landing-page" id="atas">
      <a href="#konten" className="landing-skip">Lewati ke konten</a>
      <header className="landing-header">
        <div className="landing-container landing-nav">
          <Brand />
          <nav className={`landing-nav-links${menuOpen ? ' is-open' : ''}`} id="landing-navigation" aria-label="Navigasi utama">
            <a href="#fitur" onClick={() => setMenuOpen(false)}>Tentang Manaseek</a>
            <a href="#perjalanan" onClick={() => setMenuOpen(false)}>Cara kerja</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          </nav>
          <div className="landing-nav-actions">
            <a href="?screen=login" className="landing-button landing-button--small">
              {signedIn ? 'Buka aplikasi' : 'Login'} <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <button className="landing-menu-toggle" type="button" aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'} aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen(!menuOpen)} onKeyDown={(event) => { if (event.key === 'Escape') setMenuOpen(false) }}>
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </header>

      <main id="konten">
        <section className="landing-hero landing-container" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow"><span /> TEMAN PERJALANAN IBADAHMU</p>
            <h1 id="landing-title">Dekat di hati.<br />Tenang di<br /><em>setiap langkah.</em></h1>
            <p className="landing-hero-description">Dari niat pertama hingga tiba di Tanah Suci. Manaseek menemani perjalanan haji dan umrahmu dengan panduan, asisten AI, dan pendamping mutawif.</p>
            <div className="landing-hero-actions">
              <a href="?screen=login" className="landing-button">{entryLabel} <ArrowUpRight size={19} aria-hidden="true" /></a>
              <a href="#fitur" className="landing-text-link">Kenali Manaseek <ArrowDown size={17} aria-hidden="true" /></a>
            </div>
            <div className="landing-hero-note"><span><Heart size={17} aria-hidden="true" /></span> Dirancang untuk jamaah Indonesia.</div>
          </div>

          <div className="landing-hero-visual">
            <div className="landing-arch-outline" aria-hidden="true" />
            <div className="landing-hero-photo">
              <img src={makkah} alt="Ilustrasi Ka'bah di pelataran Masjidil Haram dalam cahaya keemasan pagi" width="1200" height="800" fetchPriority="high" />
              <div className="landing-photo-caption"><MapPin size={15} aria-hidden="true" /><span>Menuju tempat yang dirindukan.<strong>Makkah Al-Mukarramah</strong></span></div>
            </div>
            <div className="landing-float landing-float--guide"><span className="landing-float-icon"><BookOpen size={22} aria-hidden="true" /></span><span><small>Selangkah lebih siap</small><strong>Panduan dalam genggaman</strong></span><span className="landing-mini-check"><Check size={13} aria-hidden="true" /></span></div>
            <div className="landing-float landing-float--heart"><span className="landing-float-icon"><Heart size={23} aria-hidden="true" /></span><span><strong>Fokus pada ibadah.</strong><small>Kami temani perjalanannya.</small></span></div>
            <span className="landing-visual-star" aria-hidden="true">✳</span>
            <span className="landing-visual-note">NIAT BAIK, LANGKAH BAIK.</span>
          </div>
        </section>

        <div className="landing-essentials">
          <div className="landing-container landing-essentials-inner">
            <p>Perjalanan bermakna,<br /><strong>persiapan lebih sederhana.</strong></p>
            <span><BookOpen size={21} aria-hidden="true" /> Panduan haji & umrah</span>
            <span><Compass size={21} aria-hidden="true" /> Arah kiblat & waktu shalat</span>
            <span><ClipboardCheck size={21} aria-hidden="true" /> Checklist persiapan</span>
          </div>
        </div>

        <section className="landing-section landing-container" id="fitur" aria-labelledby="landing-features-title">
          <div className="landing-section-heading">
            <div><p className="landing-eyebrow">SATU TEMAN, BANYAK KEMUDAHAN</p><h2 id="landing-features-title">Kamu fokus beribadah.<br /><em>Kami bantu langkahnya.</em></h2></div>
            <p>Setiap perjalanan punya ceritanya sendiri.<br />Temukan dukungan yang kamu butuhkan,<br className="landing-desktop-break" /> kapan pun langkahmu membawanya.</p>
          </div>
          <div className="landing-feature-grid">
            {FEATURES.map((feature) => (
              <article className={`landing-feature landing-feature--${feature.tone}`} key={feature.number}>
                <div className="landing-feature-top"><span>{feature.label}</span><span>{feature.number}</span></div>
                <img className="landing-feature-art" src={feature.image} alt="" width="192" height="192" loading="lazy" />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="landing-feature-tags">{feature.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </article>
            ))}
          </div>
          <p className="landing-feature-footnote"><Sparkles size={15} aria-hidden="true" /> Dukungan digital untuk perjalananmu, berdampingan dengan bimbingan manusia.</p>
        </section>

        <section className="landing-journey-section" id="perjalanan" aria-labelledby="landing-journey-title">
          <div className="landing-container landing-journey">
            <div className="landing-journey-visual">
              <img src={madinah} alt="Ilustrasi kubah hijau Masjid Nabawi dan pelatarannya yang tenang di Madinah" width="1200" height="800" loading="lazy" />
              <div className="landing-journey-caption"><span>PERJALANAN YANG DIRINDUKAN</span><p>Jauh perjalanannya.<br /><em>Dekat pendampingnya.</em></p><span><MapPin size={14} aria-hidden="true" /> Madinah Al-Munawwarah</span></div>
            </div>
            <div className="landing-journey-copy">
              <p className="landing-eyebrow">DARI PERSIAPAN HINGGA PERJALANAN</p>
              <h2 id="landing-journey-title">Langkah kecil hari ini.<br /><em>Lebih siap esok hari.</em></h2>
              <ol className="landing-steps">
                {STEPS.map((step, index) => <li key={step.title}><span className="landing-step-number">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}
              </ol>
              <a href="?screen=login" className="landing-text-link">Yuk, mulai langkah pertama <ArrowRight size={19} aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section className="landing-section landing-container landing-faq" id="faq" aria-labelledby="landing-faq-title">
          <div><p className="landing-eyebrow">SEBELUM MELANGKAH</p><h2 id="landing-faq-title">Mungkin kamu<br /><em>ingin tahu.</em></h2><p className="landing-faq-intro">Beberapa hal tentang teman<br className="landing-desktop-break" /> perjalanan barumu.</p></div>
          <div className="landing-faq-list">
            {FAQS.map((faq, index) => <details key={faq.question} name="landing-faq" open={index === 0}><summary>{faq.question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{faq.answer}</p></details>)}
          </div>
        </section>

        <section className="landing-container landing-cta-wrap" aria-labelledby="landing-cta-title">
          <div className="landing-cta">
            <div className="landing-cta-orbit" aria-hidden="true"><Heart size={44} strokeWidth={1.2} /></div>
            <p className="landing-eyebrow">BISMILLAH, KITA MULAI.</p>
            <h2 id="landing-cta-title">Perjalanan suci.<br /><em>Tak harus sendiri.</em></h2>
            <p>Hadirkan rasa tenang dalam setiap langkah.<br />Manaseek siap menjadi teman perjalananmu.</p>
            <a href="?screen=login" className="landing-button landing-button--cream">{entryLabel} <ArrowUpRight size={19} aria-hidden="true" /></a>
          </div>
        </section>
      </main>

      <footer className="landing-container landing-footer">
        <div className="landing-footer-top"><div><Brand footer /><p>Teman perjalanan, ketenangan dalam genggaman.</p></div><nav aria-label="Navigasi footer"><a href="#fitur">Tentang Manaseek</a><a href="#perjalanan">Cara kerja</a><a href="#faq">FAQ</a><a href="?screen=login">{signedIn ? 'Buka aplikasi' : 'Login'} <ArrowUpRight size={14} aria-hidden="true" /></a></nav></div>
        <div className="landing-footer-bottom"><p>© {new Date().getFullYear()} Manaseek. Selangkah lebih tenang.</p><span>Dibuat dengan niat baik, untuk jamaah Indonesia. <Heart size={13} aria-hidden="true" /></span></div>
      </footer>
    </div>
  )
}
