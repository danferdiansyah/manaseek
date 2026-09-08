import { useCallback, useState } from 'react'
import { AuthProvider } from './lib/auth'
import { useAuth } from './lib/auth-context'
import { Loading } from './lib/ui'
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
import ChecklistScreen from './screens/ChecklistScreen'
import NotificationsScreen from './screens/NotificationsScreen'

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
  checklist: ChecklistScreen,
  notifications: NotificationsScreen,
}

/** Screens reachable without a session. */
const PUBLIC_SCREENS = new Set(['splash'])

function SessionLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loading label="Menyiapkan sesi…" />
    </div>
  )
}

function Shell() {
  const { status } = useAuth()
  const params = new URLSearchParams(window.location.search)
  const urlScreen = params.get('screen')
  const isCapture = params.get('capture') === '1'

  const [current, setCurrent] = useState(urlScreen || 'splash')
  // Route parameters, e.g. which mutawif a booking is for.
  const [routeParams, setRouteParams] = useState({})

  const navigate = useCallback((screen, nextParams = {}) => {
    setCurrent(screen)
    setRouteParams(nextParams)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Screenshot mode keeps the old behaviour: render any screen with no auth.
  if (isCapture) {
    const CaptureScreen = screens[current] ?? HomeScreen
    return (
      <div style={{ width: 390, minHeight: 844, background: '#f9fafb', overflow: 'hidden' }}>
        <CaptureScreen navigate={navigate} params={routeParams} />
      </div>
    )
  }

  let ActiveScreen = screens[current] ?? HomeScreen

  if (status === 'loading') {
    ActiveScreen = SessionLoadingScreen
  } else if (status === 'signedOut' && !PUBLIC_SCREENS.has(current)) {
    // Any screen behind the gate falls back to the entry screen.
    ActiveScreen = SplashScreen
  } else if (status === 'signedIn' && current === 'splash') {
    ActiveScreen = HomeScreen
  }

  return (
    <div className="min-h-screen w-full flex justify-center">
      <div
        className="relative w-full max-w-[420px] min-h-screen bg-stone overflow-x-hidden"
        style={{ boxShadow: '0 0 60px -20px rgba(15,61,34,.35)' }}
      >
        <ActiveScreen navigate={navigate} params={routeParams} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
