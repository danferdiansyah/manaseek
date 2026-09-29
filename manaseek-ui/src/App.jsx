import { lazy, Suspense, useCallback, useState } from 'react'
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
import QiblaScreen from './screens/QiblaScreen'
import CurrencyScreen from './screens/CurrencyScreen'
import MutawifDashboardScreen from './screens/MutawifDashboardScreen'
import OnboardingScreen from './screens/OnboardingScreen'

const UmrahPackagesScreen = lazy(() => import('./screens/UmrahPackagesScreen'))
const UmrahPackageScreen = lazy(() => import('./screens/UmrahPackageScreen'))
const UmrahCheckoutScreen = lazy(() => import('./screens/UmrahCheckoutScreen'))
const UmrahOrdersScreen = lazy(() => import('./screens/UmrahOrdersScreen'))
const UmrahOrderScreen = lazy(() => import('./screens/UmrahOrderScreen'))

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
  qibla: QiblaScreen,
  currency: CurrencyScreen,
  'umrah-packages': UmrahPackagesScreen,
  'umrah-package': UmrahPackageScreen,
  'umrah-checkout': UmrahCheckoutScreen,
  'umrah-orders': UmrahOrdersScreen,
  'umrah-order': UmrahOrderScreen,
  'mutawif-dashboard': MutawifDashboardScreen,
  onboarding: OnboardingScreen,
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
  const { status, user } = useAuth()
  const params = new URLSearchParams(window.location.search)
  const urlScreen = params.get('screen')
  const isCapture = params.get('capture') === '1'

  const [current, setCurrent] = useState(urlScreen || 'splash')
  // Route parameters, e.g. which mutawif a booking is for.
  const [routeParams, setRouteParams] = useState(() => Object.fromEntries(
    [...params].filter(([key]) => key !== 'screen' && key !== 'capture'),
  ))

  const navigate = useCallback((screen, nextParams = {}) => {
    setCurrent(screen)
    setRouteParams(nextParams)
    // Keep receipts and package selections reachable after a reload. Route
    // parameters contain identifiers only, never checkout/contact data.
    const url = new URL(window.location.href)
    const capture = url.searchParams.get('capture')
    url.search = new URLSearchParams({ screen, ...nextParams }).toString()
    if (capture) url.searchParams.set('capture', capture)
    window.history.replaceState(null, '', url)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Screenshot mode keeps the old behaviour: render any screen with no auth.
  if (isCapture) {
    const CaptureScreen = screens[current] ?? HomeScreen
    return (
      <div style={{ width: 390, minHeight: 844, background: '#f9fafb', overflow: 'hidden' }}>
        <Suspense fallback={<Loading />}><CaptureScreen navigate={navigate} params={routeParams} /></Suspense>
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
    ActiveScreen = user?.needsOnboarding
      ? OnboardingScreen
      : user?.role === 'MUTAWIF'
        ? MutawifDashboardScreen
        : HomeScreen
  } else if (status === 'signedIn' && current === 'onboarding' && !user?.needsOnboarding) {
    ActiveScreen = user?.role === 'MUTAWIF' ? MutawifDashboardScreen : HomeScreen
  }

  return (
    <div className="min-h-screen w-full flex justify-center">
      <div
        className="relative w-full max-w-[420px] min-h-screen bg-stone overflow-x-hidden"
        style={{ boxShadow: '0 0 60px -20px rgba(15,61,34,.35)' }}
      >
        <Suspense fallback={<Loading />}><ActiveScreen navigate={navigate} params={routeParams} /></Suspense>
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
