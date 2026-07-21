import { useState } from 'react'
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

export default function App() {
  const params = new URLSearchParams(window.location.search)
  const urlScreen = params.get('screen')
  const isCapture = params.get('capture') === '1'

  const [current, setCurrent] = useState(urlScreen || 'splash')

  const navigate = (screen) => {
    setCurrent(screen)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const ActiveScreen = screens[current] ?? HomeScreen

  // Screenshot mode: bare screen, no chrome (used by screenshot.mjs)
  if (isCapture) {
    return (
      <div style={{ width: 390, minHeight: 844, background: '#f9fafb', overflow: 'hidden' }}>
        <ActiveScreen navigate={navigate} />
      </div>
    )
  }

  // Real web app: mobile-width canvas, centered on larger viewports.
  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: '#e5e7eb' }}>
      <div className="relative w-full max-w-[420px] min-h-screen bg-gray-50 shadow-xl overflow-x-hidden">
        <ActiveScreen navigate={navigate} />
      </div>
    </div>
  )
}
