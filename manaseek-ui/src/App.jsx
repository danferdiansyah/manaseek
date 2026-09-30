import { lazy, Suspense, useCallback, useState } from 'react'
import { AuthProvider } from './lib/auth'
import { useAuth } from './lib/auth-context'
import { Loading } from './lib/ui'
import LandingScreen from './screens/LandingScreen'

// Visitors can read the public page without downloading the app, map, or
// sign-in UI. Those screens load when the visitor enters the application.
const SplashScreen = lazy(() => import('./screens/SplashScreen'))
const HomeScreen = lazy(() => import('./screens/HomeScreen'))
const GuidanceScreen = lazy(() => import('./screens/GuidanceScreen'))
const GuidanceDetailScreen = lazy(() => import('./screens/GuidanceDetailScreen'))
const ChatbotScreen = lazy(() => import('./screens/ChatbotScreen'))
const MutawifListScreen = lazy(() => import('./screens/MutawifListScreen'))
const MutawifProfileScreen = lazy(() => import('./screens/MutawifProfileScreen'))
const BookingScreen = lazy(() => import('./screens/BookingScreen'))
const BookingSuccessScreen = lazy(() => import('./screens/BookingSuccessScreen'))
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'))
const ChecklistScreen = lazy(() => import('./screens/ChecklistScreen'))
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen'))
const QiblaScreen = lazy(() => import('./screens/QiblaScreen'))
const CurrencyScreen = lazy(() => import('./screens/CurrencyScreen'))
const MutawifDashboardScreen = lazy(() => import('./screens/MutawifDashboardScreen'))
const OnboardingScreen = lazy(() => import('./screens/OnboardingScreen'))
const UmrahPackagesScreen = lazy(() => import('./screens/UmrahPackagesScreen'))
const UmrahPackageScreen = lazy(() => import('./screens/UmrahPackageScreen'))
const UmrahCheckoutScreen = lazy(() => import('./screens/UmrahCheckoutScreen'))
const UmrahOrdersScreen = lazy(() => import('./screens/UmrahOrdersScreen'))
const UmrahOrderScreen = lazy(() => import('./screens/UmrahOrderScreen'))

const screens = {
  landing: LandingScreen,
  login: SplashScreen,
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
const PUBLIC_SCREENS = new Set(['landing', 'login', 'splash'])

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

  const [current, setCurrent] = useState(urlScreen || 'landing')
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
    url.search = screen === 'landing' ? '' : new URLSearchParams({ screen, ...nextParams }).toString()
    url.hash = ''
    if (capture) url.searchParams.set('capture', capture)
    window.history.replaceState(null, '', url)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // The public website uses the whole viewport and remains available while a
  // stored session is being restored. Only application screens use the frame.
  if (current === 'landing') return <LandingScreen />

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
  } else if (status === 'signedIn' && ['login', 'splash'].includes(current)) {
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
