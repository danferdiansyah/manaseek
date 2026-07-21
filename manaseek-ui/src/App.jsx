import { useState, useEffect } from 'react'
import SplashScreen from './screens/SplashScreen'
import HomeScreen from './screens/HomeScreen'
import GuidanceScreen from './screens/GuidanceScreen'
import GuidanceDetailScreen from './screens/GuidanceDetailScreen'
import ChatbotScreen from './screens/ChatbotScreen'
import MutawifListScreen from './screens/MutawifListScreen'
import MutawifProfileScreen from './screens/MutawifProfileScreen'
import BookingScreen from './screens/BookingScreen'
import BookingSuccessScreen from './screens/BookingSuccessScreen'
import ProfileScreen from './screens/ProfileScreen'
import EsimScreen from './screens/EsimScreen'

const screens = {
  splash: SplashScreen,
  home: HomeScreen,
  guidance: GuidanceScreen,
  'guidance-detail': GuidanceDetailScreen,
  chatbot: ChatbotScreen,
  mutawif: MutawifListScreen,
  'mutawif-profile': MutawifProfileScreen,
  booking: BookingScreen,
  'booking-success': BookingSuccessScreen,
  profile: ProfileScreen,
  esim: EsimScreen,
}

const screenLabels = {
  splash: 'Splash',
  home: 'Beranda',
  guidance: 'Guidance',
  'guidance-detail': 'Detail Panduan',
  chatbot: 'Chatbot AI',
  mutawif: 'Mutawif List',
  'mutawif-profile': 'Profil Mutawif',
  booking: 'Pemesanan',
  'booking-success': 'Sukses',
  profile: 'Profil',
  esim: 'eSIM',
}

export default function App() {
  const params = new URLSearchParams(window.location.search)
  const urlScreen = params.get('screen')
  const isCapture = params.get('capture') === '1'

  const [current, setCurrent] = useState(urlScreen || 'splash')

  useEffect(() => {
    if (urlScreen) setCurrent(urlScreen)
  }, [urlScreen])

  const navigate = (screen) => {
    setCurrent(screen)
    document.querySelector('.phone-scroll')?.scrollTo({ top: 0, behavior: 'instant' })
  }

  const ActiveScreen = screens[current] ?? HomeScreen

  // Screenshot mode: bare screen, no frame
  if (isCapture) {
    return (
      <div style={{ width: 390, minHeight: 844, background: '#f9fafb', overflow: 'hidden' }}>
        <ActiveScreen navigate={navigate} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4" style={{ background: '#0f172a' }}>
      <div className="flex items-center gap-3 mb-5">
        <img src="/logo.png" alt="Manaseek" className="w-8 h-8" />
        <h1 className="text-white font-bold text-lg tracking-tight">Manaseek UI Prototype</h1>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-6 max-w-lg">
        {Object.entries(screenLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => navigate(key)}
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={
              current === key
                ? { background: '#1B5E35', color: 'white' }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))' }}>
        <div
          className="rounded-[44px] overflow-hidden border-[6px] relative"
          style={{ width: 390, borderColor: '#1e293b', background: '#000' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 rounded-b-2xl z-50" style={{ background: '#1e293b' }} />
          <div className="phone-scroll overflow-y-auto overflow-x-hidden" style={{ height: 844 }}>
            <ActiveScreen navigate={navigate} />
          </div>
        </div>
        <div className="flex justify-center mt-3">
          <div className="w-28 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>

      <p className="text-white/40 text-xs mt-4">
        Layar aktif: <span className="text-white/70 font-semibold">{screenLabels[current]}</span>
      </p>
    </div>
  )
}
